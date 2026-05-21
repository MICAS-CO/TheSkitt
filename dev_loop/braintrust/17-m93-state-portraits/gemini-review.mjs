#!/usr/bin/env node
// Pattern B iteration review for M93 (state-responsive portraits +
// diegetic bay-monitor frame). Multimodal — sends Gemini Pro Preview
// the standing reviewer prompt + the M93 diff + the BT 15 synthesis +
// the BEFORE/AFTER screenshot pairs (4 images), asking for a
// structured JSON-schema response. Output saved to roundN-review.json
// + roundN-usage.json alongside this script.
//
// Run from repo root:
//   node dev_loop/braintrust/17-m93-state-portraits/gemini-review.mjs
//
// Env vars (all optional):
//   GEMINI_MODEL   default 'gemini-3-pro-preview'
//   REVIEW_ROUND   default 'round1'
//   BASE_REF       default 'cb70aa5' (last M92 commit)
//   HEAD_REF       default 'HEAD'

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Agent, setGlobalDispatcher } from 'undici';

setGlobalDispatcher(
  new Agent({ headersTimeout: 600_000, bodyTimeout: 600_000 }),
);

const here = dirname(fileURLToPath(import.meta.url));
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not set in env. Aborting.');
  process.exit(1);
}

const model = process.env.GEMINI_MODEL ?? 'gemini-3-pro-preview';
const round = process.env.REVIEW_ROUND ?? 'round1';
const baseRef = process.env.BASE_REF ?? 'cb70aa5';
const headRef = process.env.HEAD_REF ?? 'HEAD';

const cwd = process.cwd();
const standingPrompt = readFileSync(join(cwd, 'dev_loop/braintrust_prompt.md'), 'utf8');
const synthesis = readFileSync(
  join(cwd, 'dev_loop/braintrust/15-visual-elements/synthesis.md'),
  'utf8',
);

const codeDiff = execSync(
  `git diff ${baseRef}..${headRef} -- src/ tests/ e2e/`,
  { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
);
const docDiff = execSync(
  `git diff ${baseRef}..${headRef} -- CHANGELOG.md HANDOVER.md`,
  { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
);

const screenshots = [
  '/tmp/skitt-m93/before-01-beth-triaged-panel.png',
  '/tmp/skitt-m93/after-01-beth-triaged-panel.png',
  '/tmp/skitt-m93/before-02-marcus-deteriorating-panel.png',
  '/tmp/skitt-m93/after-02-marcus-deteriorating-panel.png',
];
for (const s of screenshots) {
  if (!existsSync(s)) {
    console.error(`Missing screenshot ${s}. Run capture-m93.mjs first.`);
    process.exit(1);
  }
}

const milestoneBrief = `# M93 — state-responsive portraits + diegetic BAY MONITOR frame (Pattern B, ${round})

You are reviewing the M93 milestone for The Skitt. M93 is the
unanimous-consensus winner from BT 15 (\`dev_loop/braintrust/15-visual-elements/synthesis.md\`,
which is included below for context). It does two things:

1. **State-responsive patient portraits.** The EncounterScreen's
   patient-portrait panel already pulled sprites via
   \`spriteSvgFor(caseId, state, ...)\`. This milestone verifies the
   wiring works for all four named cases (Beth — anaphylaxis adult;
   sibling — anaphylaxis paeds; Marcus — DKA adult; Amir — DKA paeds;
   Brennan — head injury), via a new test sweep that asserts every
   authored state for those cases resolves to a non-null SVG AND
   that deteriorating differs from triaged.

2. **Diegetic BAY MONITOR frame.** The \`Monitor\` component in
   \`src/style/frames.tsx\` is enhanced with:
   - A subtle horizontal scanline pattern (~3% opacity black stripes
     every 3 viewBox units).
   - A corner-vignette radial gradient darkening the four corners to
     simulate CRT curvature (~35% black at the outer ring).
   - A new \`cornerLabel\` prop rendering a top-left OSD chip with
     phosphor-green mono text on a 45%-opaque black backdrop.
   - SVG \`<defs>\` ids are now suffixed via \`useId()\` to avoid
     collisions when multiple Monitors share a page.
   The chip text is composed in \`PatientPanel\` as
   \`BAY MONITOR · {bayLabel} · {clockMin}m\`, threaded from
   \`EncounterScreen\` (which already has \`ks.clockMin\`).
   \`bayLabelFor\` is a new helper in \`src/game/layout.ts\` that
   maps case bay ids to human labels (RESUS, MAJORS, etc.).

**Scope of this review.** Pattern B per
\`dev_loop/braintrust/BRAINTRUST_PATTERN.md\`. Look at the M93 diff
and the four attached screenshots. Surface \`request_changes\` items
that must be addressed before merge — concrete file + lines +
underlying cause + recommended fix. Use \`approve_with_note\` for
things that ship as-is but worth recording.

**The four attached images are paired:**
- Image 1 & 2: Beth (anaphylaxis adult, TRIAGE bay, triaged state) —
  BEFORE M93 (no scanlines/vignette/chip) and AFTER (with all three).
- Image 3 & 4: Marcus (DKA, MINORS bay, deteriorating state) —
  BEFORE and AFTER.

**What to assess specifically:**

1. **Monitor frame visual quality.** Are the scanlines subtle enough
   to read as CRT texture without fighting the portrait? Is the
   vignette visible without crushing the corners? Does the OSD chip
   text composition work? Is the phosphor-green tint on the chip
   text appropriate or does it look out of place?

2. **State responsiveness.** Compare Beth (triaged) vs Marcus
   (deteriorating) — do the two sprites read as visually distinct?
   The test sweep proves they ARE different SVG output, but the
   reviewer's eye is the better judge of whether the distinction is
   pedagogically useful.

3. **Code quality.** \`Monitor\` doubled in size; check for code
   smells. The \`useId()\` suffix pattern fixes a real bug (multiple
   Monitors on the same page would have collided on the old static
   ids). Is the prop API for \`cornerLabel\` cleanly optional?

4. **Test coverage.** 5 new tests in \`tests/sprites.test.ts\` +
   \`tests/layout.test.ts\` (state→sprite sweep for the 4 cases +
   \`bayLabelFor\` coverage). Any meaningful tests missing?

5. **Anything else genuinely consequential.** Don't invent findings.
   "Add a test" is not a finding unless the absence names a specific
   regression that's plausible to ship.

Respond using the structured schema. Be sparing with
\`request_changes\` — this is one focused milestone diff, not an
opening pass on the whole project.
`;

const prompt = `${standingPrompt}\n\n---\n\n${milestoneBrief}\n\n---\n\n## BT 15 synthesis (context)\n\n${synthesis}\n\n---\n\n## M93 code diff (src/, tests/, e2e/)\n\n\`\`\`diff\n${codeDiff}\n\`\`\`\n\n---\n\n## M93 doc diff (CHANGELOG + HANDOVER)\n\n\`\`\`diff\n${docDiff}\n\`\`\`\n`;

const responseSchema = {
  type: 'object',
  properties: {
    verdict: {
      type: 'string',
      enum: ['request_changes', 'approve_with_note'],
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          verdict: { type: 'string', enum: ['request_changes', 'approve_with_note'] },
          title: { type: 'string' },
          file: { type: 'string' },
          body: { type: 'string' },
          recommendation: { type: 'string' },
        },
        required: ['severity', 'verdict', 'title', 'file', 'body', 'recommendation'],
      },
    },
    overall_take: { type: 'string' },
  },
  required: ['verdict', 'findings', 'overall_take'],
};

const parts = [
  { text: prompt },
  { text: 'IMAGE 1 — Beth (anaphylaxis adult, TRIAGE bay) BEFORE M93:' },
  {
    inlineData: {
      mimeType: 'image/png',
      data: readFileSync(screenshots[0]).toString('base64'),
    },
  },
  { text: 'IMAGE 2 — Beth (anaphylaxis adult, TRIAGE bay) AFTER M93:' },
  {
    inlineData: {
      mimeType: 'image/png',
      data: readFileSync(screenshots[1]).toString('base64'),
    },
  },
  { text: 'IMAGE 3 — Marcus (DKA, MINORS bay) BEFORE M93:' },
  {
    inlineData: {
      mimeType: 'image/png',
      data: readFileSync(screenshots[2]).toString('base64'),
    },
  },
  { text: 'IMAGE 4 — Marcus (DKA, MINORS bay) AFTER M93:' },
  {
    inlineData: {
      mimeType: 'image/png',
      data: readFileSync(screenshots[3]).toString('base64'),
    },
  },
];

const promptChars =
  prompt.length +
  parts.filter((p) => p.text).reduce((n, p) => n + p.text.length, 0);
console.error(`Model: ${model}`);
console.error(`Diff: ${baseRef}..${headRef}`);
console.error(`Text prompt: ${promptChars} chars + 4 images`);
console.error(`Calling Gemini ...`);

const t0 = Date.now();
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
  },
);
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.error(`HTTP ${res.status} in ${elapsed}s`);

if (!res.ok) {
  const errText = await res.text();
  console.error('Error body:', errText.slice(0, 2000));
  process.exit(2);
}

const data = await res.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
if (!text) {
  console.error('No text in response; writing raw body to gemini-raw.json');
  writeFileSync(join(here, 'gemini-raw.json'), JSON.stringify(data, null, 2));
  process.exit(3);
}

const review = JSON.parse(text);
writeFileSync(join(here, `${round}-review.json`), JSON.stringify(review, null, 2));
writeFileSync(
  join(here, `${round}-usage.json`),
  JSON.stringify(
    {
      model,
      diff: `${baseRef}..${headRef}`,
      prompt_text_chars: promptChars,
      images: screenshots.length,
      elapsed_seconds: Number(elapsed),
      usage: data.usageMetadata ?? null,
    },
    null,
    2,
  ),
);

console.error(`Wrote ${round}-review.json (${text.length} chars) and ${round}-usage.json`);
console.error(`Verdict: ${review.verdict} · findings: ${review.findings?.length ?? 0}`);

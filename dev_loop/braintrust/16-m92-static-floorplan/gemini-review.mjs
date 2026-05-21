#!/usr/bin/env node
// Pattern B iteration review for M92 (Phaser hub → static SVG floorplan).
// Calls Gemini Pro Preview with the M92 diff + the BT 15 synthesis
// context + the standing braintrust prompt, asking for a structured
// JSON-schema response (verdict + findings + overall_take). Output
// saved to round1-review.json + round1-usage.json.
//
// Run from repo root:
//   node dev_loop/braintrust/16-m92-static-floorplan/gemini-review.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not set in env. Aborting.');
  process.exit(1);
}

const model = process.env.GEMINI_MODEL ?? 'gemini-3-pro-preview';
const round = process.env.REVIEW_ROUND ?? 'round1';
// Diff range: BT 15 synthesis commit → M92 commit (the M92 diff itself).
const baseRef = process.env.BASE_REF ?? '6f44240';
const headRef = process.env.HEAD_REF ?? 'HEAD';

const cwd = process.cwd();
const standingPrompt = readFileSync(join(cwd, 'dev_loop/braintrust_prompt.md'), 'utf8');
const synthesis = readFileSync(
  join(cwd, 'dev_loop/braintrust/15-visual-elements/synthesis.md'),
  'utf8',
);

const codeDiff = execSync(
  `git diff ${baseRef}..${headRef} -- src/ e2e/ eslint.config.js package.json`,
  { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
);
const docDiff = execSync(
  `git diff ${baseRef}..${headRef} -- CHANGELOG.md HANDOVER.md`,
  { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
);

const milestoneBrief = `# M92 — Phaser hub → static SVG floorplan (Pattern B iteration review, ${round})

You are reviewing the M92 milestone for The Skitt. M92 implements the
**unanimous BT 15 four-reviewer consensus** to replace the Phaser
department hub (1.5MB dep, walk-cycle avatar, coloured rectangles —
"reads as half-built on every reviewer pass") with a static SVG
floorplan + HTML-button patient cards. The full BT 15 synthesis is
included below for context.

**Scope of THIS review.** Pattern B iteration review per
\`dev_loop/braintrust/BRAINTRUST_PATTERN.md\`. Look at the M92 diff
specifically. Surface \`request_changes\` items that must be addressed
before this is treated as merged — concrete file + lines + underlying
cause + recommended fix. Use \`approve_with_note\` for things that ship
as-is but the note is worth recording. Be sparing with
\`request_changes\` — this is not an opening pass, it is a focused
review of one milestone's diff.

**Critical context the diff may not surface alone:**

- The synthesis listed \`src/style/walkCycles.ts\` as deletable
  ("only used by the hub avatar"). M92 deliberately did NOT delete
  it — it is also imported by \`EncounterScreen.tsx\` (M79
  McGrath-walks-in animation) and \`AssetLibraryScreen.tsx\`. The
  author's call was: synthesis claim was wrong, keep the file. Do
  NOT request_changes on this — it is correct.
- \`src/game/layout.ts\` was kept intentionally — the new
  \`EdFloorplan\` reuses \`ED_ZONES\`, \`GAME_WIDTH\`, \`GAME_HEIGHT\`,
  and \`PALETTE\`, and \`tests/layout.test.ts\` (4 tests) covers the
  floorplan shape. Do NOT request_changes on keeping this.
- The eslint config change is fixing **pre-existing breakage** in
  \`capture-screens.mjs\` from the prior session's BT 15 work (31
  errors that existed before M92 touched the tree). Reviewing that
  diff line-by-line is fine but it is not part of M92 proper — the
  fix was rolled in because the pre-flight "all six pass clean"
  contract from \`HANDOVER.md\` needed restoring.
- M67's semantic-colour contract leaks (amber for operational
  status, red for action pills) are documented in the BT 15 synthesis
  and are deferred to M94. Do NOT request_changes about token
  contract leaks in the NEW SVG floorplan unless the floorplan
  introduces ADDITIONAL leaks beyond what already existed.

**Dimensions to assess for M92 specifically:**

1. **Functional parity with the deleted Phaser scene** — clicking a
   patient card enters that encounter; bay-to-patient mapping
   preserved; ambient flag preserved; deteriorating / arrested
   visual cue preserved (was a Phaser tween, now a CSS animation
   with reduced-motion respect).
2. **Accessibility** — the new cards are real \`<button>\` elements
   with aria-labels; the SVG floorplan has role="img" and an
   aria-label. Are there a11y gaps the Phaser canvas (which had
   none) was getting away with?
3. **Bundle size** — claimed shedding ~1.5MB (single-file build
   went from ~2.8MB to ~1.35MB per HANDOVER). Is the diff consistent
   with that, or did the new SVG/CSS inadvertently add weight?
4. **State leakage / tests** — \`tests/layout.test.ts\` still covers
   the bays. The diff doesn't add new tests for \`EdFloorplan\`. Is
   there a test you'd request before merge?
5. **Anything else genuinely consequential.** Do not invent findings
   for the sake of having them. "Add a test" is not a finding
   unless the absence of the test names a specific regression that's
   plausible to ship.

Respond using the structured schema (verdict + findings + overall_take).
`;

const prompt = `${standingPrompt}\n\n---\n\n${milestoneBrief}\n\n---\n\n## BT 15 synthesis (context only)\n\n${synthesis}\n\n---\n\n## M92 code diff (src/ + e2e/ + eslint.config.js + package.json)\n\n\`\`\`diff\n${codeDiff}\n\`\`\`\n\n---\n\n## M92 doc diff (CHANGELOG + HANDOVER)\n\n\`\`\`diff\n${docDiff}\n\`\`\`\n`;

const responseSchema = {
  type: 'object',
  properties: {
    verdict: {
      type: 'string',
      enum: ['request_changes', 'approve_with_note'],
      description:
        'Overall verdict for the milestone. request_changes means at least one finding must be addressed before merge.',
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

console.error(`Model: ${model}`);
console.error(`Diff: ${baseRef}..${headRef}`);
console.error(`Prompt size: ${prompt.length} chars`);
console.error(`Calling Gemini ...`);

const t0 = Date.now();
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
      prompt_chars: prompt.length,
      elapsed_seconds: Number(elapsed),
      usage: data.usageMetadata ?? null,
    },
    null,
    2,
  ),
);

console.error(`Wrote ${round}-review.json (${text.length} chars) and ${round}-usage.json`);
console.error(`Verdict: ${review.verdict} · findings: ${review.findings?.length ?? 0}`);

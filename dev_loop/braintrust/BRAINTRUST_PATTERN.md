# Braintrust pattern — methodology for The Skitt

This file documents how design decisions and per-milestone reviews are run on The Skitt. It is the through-line connecting M80 onwards. **Read this before you ship any non-trivial change.**

There are TWO distinct patterns. Use the one that fits the work.

---

## Pattern A — Multi-reviewer consultation (open-ended design questions)

**When to use**: the user asks an open-ended design question with no clear answer yet. Examples that have actually been run:
- BT 02: "three author concerns about pacing, recurrence, and overworld"
- BT 06: "should the clock pause? where?"
- BT 10: "should there be a narrative thread through the rota?"
- BT 15: "what works visually, what doesn't, what to improve"

**Folder layout** (`dev_loop/braintrust/NN-shortname/`):

```
NN-shortname/
  prompt.md              The question + framing + any context bundle (max 1 file)
  gemini-take.md         Real Gemini Pro Preview call output (multimodal if visual)
  opus-take.md           Orchestrator-written take in Opus register (philosophical, broad)
  sonnet-take.md         Orchestrator-written take in Sonnet register (practical, faster verdict)
                         OR: openai-take.md if/when OpenAI is allowlisted
  synthesis.md           Three-way convergences/divergences + recommended next moves
  STATUS.md              (optional) — used only if the consultation is interim/blocked
  screenshots/           (optional) — only for multimodal calls (BT 15)
  capture-screens.mjs    (optional) — Playwright capture script for re-running screenshots
  gemini-usage.json      (optional) — token usage if captured
```

### The reviewer slate

Three voices is the canonical setup. Each must bring a genuinely different angle, otherwise you have a single voice in three hats.

1. **Gemini Pro Preview** (real API call). Long context, multimodal-capable, sees the actual artefacts. **This is the one non-negotiable real-API reviewer** — it provides the external grounding.
2. **Opus voice** (orchestrator-written). Philosophical, broad-context, will frame the build's stakes and identify the highest-order pattern. Register: "the build has two identities and they don't speak to each other."
3. **Sonnet voice** (orchestrator-written). Practical, faster-verdict, ranks fixes by hour-cost. Register: "first ship is the Phaser cut because it's cheapest and biggest lift."
4. **OpenAI / GPT-5** (real API call) — **OPTIONAL**, only when `api.openai.com` is allowlisted in the env and `OPENAI_API_KEY` is set. Was attempted in BT 15 and blocked. If used, it replaces one of the Claude voices (typically Sonnet).

**Honesty rule**: the synthesis must declare which takes are real-API calls and which are orchestrator-voice. See BT 15's synthesis header for the format:

> **Reviewers**: Gemini 3.1 Pro Preview (multimodal — sent 8 screenshots + the design-system spec) + Claude Opus + Claude Sonnet (orchestrator wrote both Claude voices as distinct registers).

This is not an aesthetic preference. It is the honesty contract that makes the pattern usable.

### Round semantics

Most consultations are one round. If the author pushes back (BT 10 round 1's reviewers all defended unrealistic recurrence and the author rejected it), run a **round 2** with:

- `round2-prompt.md` — restates the original question + the author's pushback verbatim
- `round2-gemini-take.md`, `round2-opus-take.md`, `round2-sonnet-take.md` — each reviewer re-runs against the new framing
- `round2-synthesis.md` — replaces the round-1 synthesis as the operative document

Reviewers reversing their position on a real signal from the author is a feature, not a failure. Capture both rounds — the divergence between them is itself useful design evidence.

### Synthesis structure

The `synthesis.md` should always lead with **convergences** (where all reviewers agreed) and then surface **divergences** as ranked next moves. End with:

- **Convergent recommendation** — a numbered sequence of ships, each independently reviewable
- **Reserved** — items 2+ reviewers liked but that don't justify shipping yet
- **Refused** — things one reviewer suggested but the convergence rejected (with justification)
- **Cost** — hours estimate per ship
- **Confidence** — each reviewer's self-rated confidence in their take
- **Recommended next move** — single sentence

---

## Pattern B — Single-reviewer iteration review (post-implementation diff)

**When to use**: a milestone has just been implemented, the diff is on a branch, and you want a clinical-quality reviewer pass before merging. Examples that have actually been run:
- BT 03: M82 rota skeleton
- BT 04: M83 keystone gating + EPortfolioScreen
- BT 05: M84 onboarding + recall
- BT 07: M85 pause clock + breadth scoring
- BT 08: M86 deterioration audit
- BT 09: M87 tier-aware
- BT 11: M88 patient-recurrence audit + Akin handover PoC

**Folder layout** (`dev_loop/braintrust/NN-mXX-shortname/`):

```
NN-mXX-shortname/
  round1-review.json     Gemini Pro Preview JSON-schema review of the round1 diff
  round1-usage.json      Token usage
  round2-review.json     Gemini Pro Preview review of the post-fix round2 diff
  round2-usage.json      Token usage
```

### The review schema

Gemini is called with a structured JSON schema response, asking for one of two verdicts per finding:

- `request_changes`: must-fix before merge. Specify file + lines + the underlying cause (not the surface symptom) + the recommended fix.
- `approve_with_note`: ships as-is, but the note is recorded for future iterations.

The reviewer is briefed via the `dev_loop/braintrust_prompt.md` standing prompt (the original Pixar-Braintrust framing — senior UK ED consultant + principal game architect).

### Round semantics

- **Round 1**: send the implemented diff. Reviewer surfaces `request_changes` items.
- **Fixes**: address each `request_changes` item; orchestrator may push back if a request is misframed (cite back to the prompt's "no homework-as-critique" rule).
- **Round 2**: send the post-fix diff to the same reviewer. Reviewer either signs off or surfaces residuals.

A milestone is "shipped" when round 2 is `approve_with_note` across the board (or all residual `request_changes` are explicitly deferred to a later milestone).

---

## Real-API call recipe — Gemini

The pattern that has worked across all 15 BTs:

```javascript
// Node script in /tmp or in the consultation folder
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const prompt = readFileSync('prompt.md', 'utf8');
const contextBundle = readFileSync('context-bundle.md', 'utf8');  // optional

const response = await ai.models.generateContent({
  model: 'gemini-3-pro-preview',  // current frontier as of 2026-05; check `?` if stale
  contents: [
    { role: 'user', parts: [
      { text: prompt + '\n\n---\n\n' + contextBundle },
      // for multimodal:
      // { inlineData: { mimeType: 'image/png', data: base64Png } },
    ]},
  ],
  config: {
    // for JSON-schema iteration review (Pattern B):
    // responseMimeType: 'application/json',
    // responseSchema: { type: 'object', properties: { findings: { type: 'array', items: {...} }}}
  },
});

writeFileSync('gemini-take.md', response.text);
writeFileSync('gemini-usage.json', JSON.stringify(response.usageMetadata, null, 2));
```

The container has `GEMINI_API_KEY` set in the env. Do not echo it. Do not save it to disk. Do not commit it.

## Real-API call recipe — OpenAI (when allowlisted)

```javascript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.responses.create({
  model: 'gpt-5',  // or current frontier OpenAI vision model
  input: [
    { role: 'user', content: [
      { type: 'input_text', text: prompt },
      // for multimodal:
      // { type: 'input_image', image_url: { url: `data:image/png;base64,${base64Png}` }},
    ]},
  ],
});

writeFileSync('openai-take.md', response.output_text);
```

**Network gotcha**: `api.openai.com` is NOT in the default `Trusted` env allowlist. If a call fails with `403 Host not in allowlist`, the user must reconfigure env via claude.ai/code → Settings → Network access → Custom → add `api.openai.com`. Do not retry from inside the session — it cannot be fixed from here.

---

## Security posture (API keys)

If a user pastes an API key in chat:

1. **Never echo it** in output back to the user or in commits.
2. **Never save it to a tracked file**. Acceptable to write to `/tmp/.openai_key` with `chmod 600` for the duration of one call, then delete.
3. **Always recommend rotation**. The transcript itself is a leak vector (logs, future shares, screenshots).
4. **Never commit the key**, even into a `.env` file that's in `.gitignore`. The risk of an `add -A` mistake is not zero.
5. Use the env-variable pattern (`OPENAI_API_KEY` configured via the cloud UI) for any persistent key.

---

## Cost discipline

Track real-API spend in `HANDOVER.md`'s cost ledger. Rough numbers from this rota:

- Gemini Pro Preview text call (~5-15k tokens): $0.04-0.10
- Gemini Pro Preview multimodal call (8 screenshots + spec): ~$0.06
- OpenAI calls: untested in this env

A full multi-reviewer consultation (one real Gemini + two orchestrator voices + synthesis) is ~$0.10. A per-milestone iteration review (two rounds of Gemini JSON-schema) is ~$0.10-0.15. The ~$15 envelope the user mentioned allows for ~50 consultations comfortably.

---

## Commit conventions

After each consultation completes:

```
Braintrust NN: <shortname> — <one-line verdict>
```

Examples from the log:
- `Braintrust 10 round 2: author pushback + reviewer realignment`
- `Braintrust 15 (in progress): visual-elements consultation`

After each milestone implementation:

```
MNN: <shortname>
```

Examples:
- `M88: patient-recurrence audit + dual-register Akin handover PoC`
- `M91 patch: Akin teaches M&M folder culture (NHS workflow accuracy)`

Per-milestone review folders share the NN number scheme with the milestone they review (folder `04-m83-...` reviews milestone `M83`).

---

## When NOT to run a braintrust

- One-line bug fixes
- Pure refactors with no behaviour change
- Content additions that follow an existing template (a new case YAML that's structurally identical to Brennan's)
- Test-only changes
- Anything where the answer is obvious and the user has already decided

The pattern's value is highest when the question is open and the cost of getting it wrong is rework. If you're shipping a one-line typo fix, just ship it.

---

## Honest failure modes (observed)

- **Three voices saying the same thing in three hats**. If your Opus, Sonnet, and Gemini all converge in the same paragraph with the same framing, you've added no value over a single review. The orchestrator-voice takes must bring genuinely different angles (Opus = stakes-and-identity, Sonnet = hours-cost ranking). If you can't tell them apart, rewrite.
- **Reviewers as cheerleaders**. The prompt explicitly says "you are NOT a cheerleader." Strip out hedge language ("could be improved...", "might want to consider...") on every pass. The verdicts should sting.
- **Synthesis as average of votes**. The synthesis is a JUDGMENT, not a tally. If two reviewers say one thing and the third says something cleverer, the synthesis can side with the third (BT 10 round 2 is the canonical example — Round 1's three-way agreement was wrong).
- **Real-API calls as theatre**. If the Gemini call returns nothing the orchestrator didn't already know, the synthesis should say so explicitly. Don't pretend the external reviewer added value when it didn't.

---

## Reading order if you're new to this

1. `dev_loop/braintrust/01-opening-pass/synthesis.md` — the earliest synthesis, shows the format.
2. `dev_loop/braintrust/10-narrative-thread/` — read round1-synthesis.md, then round2-synthesis.md. Best example of the round-2 reversal.
3. `dev_loop/braintrust/15-visual-elements/synthesis.md` — most recent, three-voice multimodal.
4. `dev_loop/braintrust/03-m82-rota-skeleton/round1-review.json` — example of pattern B iteration review.

Once you've read those four, you'll know the shape. Then go and run the next one.

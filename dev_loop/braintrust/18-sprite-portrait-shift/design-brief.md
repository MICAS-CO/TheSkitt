# Brief for Claude Design — sprite portrait shift (M98 reference character)

You're being briefed cold. Read this whole document before opening any
file. Repo is `MICAS-CO/TheSkitt`, working directory `/home/user/TheSkitt`.

## What The Skitt is

A UK FRCEM emergency-medicine study RPG. Player is a new doctor at the
fictional Skittstown General ED, running 1–4 patients per shift through
a phase pipeline (history → exam → ix → differential → management →
disposition → debrief) on a 20-minute simulated clock.

Stated visual ambition from `dev_loop/braintrust/15-visual-elements/synthesis.md`:
- **Disco Elysium** — writing-quality bar (we won't hit it yet — but the visual register should not contradict it)
- **Papers, Please** (Lucas Pope) — the closer visual register: bust portraits under harsh lamp light, civic-document dignity, clinical-administrative grim
- **Dwarf Fortress** — simulation-depth bar (not a visual reference)

## The problem this brief addresses

The current patient sprites (in `src/style/dropPatientSprites.ts` and
`src/style/sprites.ts`) work clinically — M96 made Marcus look
appropriately drowsy + Kussmaul-breathing in his deteriorating state —
but they read as "dopey" to the user. Five concrete issues:

1. **Eye treatment** — `wewew` (two black pupils on wide whites) reads as wide-awake / startled by default. Every patient looks slightly surprised before anything has happened.
2. **Flat shading** — skin is 2-tone (light + dark). Disciplined pixel art uses 4 tones (highlight, midtone, shadow, deep shadow) on a committed light direction.
3. **Heads too round** — most heads share the same rectangular-with-rounded-top outline. Silhouettes don't differentiate characters.
4. **Mouth as solid colour bar** — `OOOO` reads as a smile/grimace mask, not a mouth.
5. **No directional lighting on garment** — shirts are flat colour expanses. No fold-shadow, no shoulder highlight, no volume.

The user has chosen the most ambitious of three options: **stylistic
shift from full-body sprite to portrait bust**. The bay-monitor frame
M93 introduced (`Monitor` in `src/style/frames.tsx`, CRT scanlines +
vignette + "BAY MONITOR · {bay} · {time}" OSD chip) reads as a CCTV
feed — and a CCTV would show a close-up face, not a full-body sprite.
The bust register matches the diegetic frame naturally and gives 4× the
detail budget per face.

## Scope of THIS brief

**One reference character. One style guide. That's all.**

The reference character is **Beth** (`case_anaphylaxis_adult_peanut`).
She's the project's canonical example case — used in unit tests, used
in BT 17 review captures, and the only existing case with rich clinical
diffs already authored (swollen lips, sweat droplet on temple, urticaria
on neck — read the recipe in `src/style/sprites.ts` lines 220–263 to see
the current pattern).

Deliver:
1. Beth's bust portrait in **all 5 clinical states**: `stable`, `triaged`, `deteriorating`, `arrested`, `postResus` (note: `admitted` and `discharged` fall back to `stable` / baseline per existing convention).
2. A **style guide** that the team can use to redo the other 15 cases later. Without the guide, the look won't be reproducible.

Do NOT redo the other 15 cases in this brief. We gate on review of
Beth + the style guide before authoring further.

## Technical constraints

You are NOT free to redesign the sprite engine. Read `src/style/sprites.ts`
first — specifically the `frameToSvg`, `applyDiffs`, `substSkin`, and
`spriteSvgFor` exports — to understand the existing renderer's contract.
The new bust system should integrate alongside the existing full-body
sprite system, not replace it.

**Hard constraints:**

- **Resolution**: 48 columns × 48 rows (4× the cell count of the current 24×32 system). Wider than tall would also work if a head-and-shoulders read benefits from it (e.g. 56×48). Pick one and commit.
- **Palette**: define a new `BUST_PAL` in your new file. You may share characters with the existing palettes but the file should be self-contained. Aim for 24–32 distinct colours — enough for 4-tone skin gradients, hair, clothing, two background tones, and clinical-cue colours (sweat blue, urticaria red, cyanosis purple, etc).
- **State recipe shape**: keep the existing `{ base, skinMap?, diffs? }` contract from `PatientStateRecipe` so the recipe machinery still works. If you genuinely need a new field, propose it explicitly and justify.
- **Breathing animation**: keep the inhale/exhale frame pair convention. The `frameCountFor` resolver expects 1+ frames per state; 2 frames per upright state is the current pattern.
- **Output format**: TypeScript module. Same shape as `src/style/dropPatientSprites.ts` — `string[]` per frame, palette char → hex map, exported blueprint.
- **Where to put it**: new file `src/style/bustPortraitSprites.ts`. Then wire it in `src/style/sprites.ts` via a new `CASE_TO_BUST_ID` map (parallel to the existing `CASE_TO_DROP_ID`). The resolver should prefer bust → drop → hand-authored in that priority. Existing cases not yet ported keep working with their current sprite.
- **Light direction**: pick one (recommended: top-left, matching the existing `glassRefl` linear gradient in the Monitor frame). Commit to it across all 5 states.
- **Renderer integration**: the existing `Monitor` in `src/style/frames.tsx` constrains the portrait area to roughly the screen rect (~290×190 CSS px at the current panel width). At scale=4, a 48×48 sprite renders as 192×192 — fits comfortably. Pick a scale and verify it lands inside the Monitor's screen area without clipping.

**Soft constraints (prefer but not required):**

- Show the patient at a slight 3/4 turn rather than dead-front, if you can make the breathing animation work at that angle.
- Hair / silhouette differentiation should be enough that a player can recognise the case from the bust alone, before reading the OSD chip.
- The OSD chip lives at bottom-left of the Monitor's screen area — don't put critical clinical detail in that corner of the sprite.

## Per-state clinical cues for Beth (anaphylaxis adult)

Beth presents with peanut anaphylaxis. The five states should read as:

1. **stable** — calm, alert. Baseline. No clinical cues. This is what she looks like before the case opens (used in menu / asset library).
2. **triaged** — concerned but composed. The triage nurse has noted she's symptomatic. Subtle: slightly furrowed brow, mouth could show early lip swelling. NEWS2 is still GREEN-ish at this point.
3. **deteriorating** — full anaphylaxis on display. Swollen lips (visible labial swelling — bigger than triaged), urticaria on visible skin (cheeks, neck), sweat droplet on temple, slight pallor. The existing recipe authors all of these — match those clinical signals. (NEWS2 should land RED here per M97 audit.)
4. **arrested** — eyes closed, mouth open, head leaning. The current full-body system goes supine for this; in a bust you can't show supine, so signal it by: eyes closed, no breathing animation (single frame), pallor or cyanotic tint, head tilted to one side. The Monitor will overlay an "ASYSTOLE" text badge on top of this state already — coordinate with that.
5. **postResus** — recovering. Eyes open but tired, pallor reduced, no urticaria, lips back to normal. Closer to stable than to deteriorating but visibly post-event (maybe a sweat sheen still on the brow).

If you find that a sign clinically belongs to a different cue (e.g. you
want lip swelling in triaged because that's when the airway team would
have caught it), make the case in your style guide doc and we'll discuss.

## Style guide deliverable

Save to `src/style/bustPortraitSprites.md` (markdown alongside the TS).
Must include:

1. **The light direction you committed to** + a 3-pixel diagram showing the highlight / midtone / shadow / deep-shadow placement on a generic ovoid head.
2. **Eye treatment** — exact pixel pattern for open eye (alert), closed eye (drowsy / arrested), partial-close (sleepy / postResus). Include the palette characters.
3. **Mouth treatment** — neutral, smile-attempt (triaged), open (Kussmaul / arrested), pursed (pain). Pixel patterns.
4. **Skin-tone ladder** — 4 tones per skin colour you author (light, mid, mid-dark, shadow). Include enough characters to support at least 3 skin colours (the existing palette is unbalanced toward pale European tones; do better here).
5. **Garment shading rubric** — where the fold goes, where the highlight goes, when to use deep-shadow on a hospital gown vs streetwear.
6. **Clinical-cue catalogue** — for each of the major signs (sweat droplet, urticaria, pallor, cyanosis, lip swelling, drooping eye, facial droop) — show the exact pixel pattern, the palette character, and a note on which clinical states / case archetypes it belongs to.
7. **Recipe authoring rubric** — given a new case, how do you decide what cues to combine for each state? One short worked example covering DKA (drowsy + Kussmaul + sweat) is enough.

## Acceptance criteria — what we'll review against

When you deliver, we'll:

1. Render Beth in all 5 states via the existing `spriteSvgFor` path.
2. Capture a screenshot of the EncounterScreen patient panel showing one of the deteriorating states inside the existing Monitor frame.
3. Read the style guide and decide whether we can confidently apply it to the other 15 cases.

The work passes review if:
- Each state is visually distinct from the others without needing the OSD chip text to confirm.
- The triaged → deteriorating transition is clinically obvious (this was the BT 17 R3 finding-1 bar — "fake compliance" is failing this).
- Light direction is committed and consistent across all 5 states.
- The 4-tone shading reads as 3D in the bust rather than flat.
- The bust fits inside the Monitor screen area without clipping when rendered via the existing pipeline.
- The style guide is concrete enough that someone could redo Marcus / Leo / Joan / Ruby from it without further consultation.

## Pre-flight before submitting

Run from `/home/user/TheSkitt`:

```
npm run typecheck
npm run lint
npm test
npm run validate-content
npm run build:single-file
```

All six should pass clean. The existing `tests/sprites.test.ts` covers
state-resolution semantics — your new system needs to satisfy the
existing assertions plus the new ones the team will add for bust
portraits.

## Files to read first (in this order)

1. `src/style/dropPatientSprites.ts` — the existing drop-sprite system (full-body, 24×32). Read the Marcus block (line 972) and the Leo block (line 725) — they're the gold standard for state-recipe authoring as it currently stands.
2. `src/style/sprites.ts` lines 1–230 — the renderer's contract (`frameToSvg`, `applyDiffs`, `substSkin`, palette handling, animation frame loop). Plus Beth's existing recipes at lines 220–263.
3. `src/ui/encounter/PatientPanel.tsx` lines 100–116 — how the Monitor frames the sprite. Your output must render here without breaking the layering (M93 has bezel → sprite → CRT effects → OSD chip in DOM order; the sprite is layer 2).
4. `dev_loop/braintrust/15-visual-elements/synthesis.md` — the four-reviewer consensus that set the project's visual ambition.

## Tone

The Skitt is a clinical RPG with NHS register. Patients are not cartoons.
The visual register should feel like a hospital telemetry monitor showing
a patient you might actually have to assess. Avoid:
- Anime / chibi proportions
- Big sparkly eyes
- "Cute" framing
- Smile-by-default

Aim for:
- Quiet civic dignity (Papers Please)
- Honest clinical signs (FRCEM examiner's eye)
- Worn-in pixel art (CrossCode / Octopath Traveler tradition rather than 8-bit retro)

## Out of scope (do not do)

- Don't redo the other 15 cases in this brief.
- Don't redesign the Monitor frame, vitals strip, or any non-sprite UI element.
- Don't bump to higher resolutions than 48×48 (the panel area can't accommodate more without redesigning the Monitor).
- Don't introduce external image assets — sprites must be authored as character grids in TypeScript, same as the existing system.
- Don't change the kernel's case state machine. Your sprites consume whatever state the kernel produces.

## Commit / hand-off

Commit your work as `M98 — bust portrait reference character (Beth) +
style guide`. Push to whatever branch the session is running on. Include
the rendered screenshot in `dev_loop/braintrust/18-sprite-portrait-shift/`
so the user can review without rebuilding locally.

Ask questions early if anything is ambiguous. Better to clarify upfront
than to author 5 states in the wrong direction.

# Brief for Claude Design — M99 bust portraits, remaining 16 cases

Picks up from M98 (Beth bust + style guide). Repo:
`MICAS-CO/TheSkitt`, working dir `/home/user/TheSkitt`, branch
`claude/review-and-continue-HjlEy`.

## What you're picking up from

M98 shipped the bust portrait system: 48×48 head-and-shoulders
sprites rendered through the BAY MONITOR diegetic frame, with Beth
Cartwright (`case_anaphylaxis_adult_peanut`) as the reference
character in all 5 clinical states. Pre-flight clean, 455 tests
green, gallery shot in
`dev_loop/braintrust/18-sprite-portrait-shift/beth-bust-all5.png`.

**Read these first, in this order:**

1. `src/style/bustPortraitSprites.md` — the style guide. **This is
   the source of truth.** Light direction, eye treatment, mouth
   treatment, skin-tone ladder, clinical-cue catalogue, recipe
   authoring rubric, worked Marcus DKA example.
2. `src/style/bustPortraitSprites.ts` — Beth's reference recipes.
   Anchor rows for eyes (15–17), mouth (23–26), neck (31–34), and
   the dress shoulder (35–47) are described in the file's header
   comment block. **Don't change those row anchors** — the diff
   coordinates are position-portable so the recipe rubric works
   on every case.
3. `dev_loop/braintrust/18-sprite-portrait-shift/design-brief.md`
   — the M98 brief, for the project-wide visual ambition + the
   "what good pixel art does" diagnosis.

## Scope of THIS brief

**Three new skin-tone palette extensions, plus 16 remaining cases,
in two review-gated batches.**

The 16 cases are everything in the project's case content except
Beth — see the table in §3 below.

## §1. Mandatory pre-work — extend `BUST_PAL`

The style guide's Section 2 names three skin tones as "mandatory
before remaining 15 cases ship" (it's 16, not 15 — I miscounted in
the M98 brief). Each tone needs its own set of palette characters
in the BUST_PAL slot system because Beth's `l L S s` slots are
hard-coded to warm-fair anchors.

Three new tone groups to add to `src/style/bustPortraitSprites.ts`'s
`BUST_PAL`:

| Tone group | Slot chars (highlight / midtone / mid-shadow / shadow) | Hex anchors (matches style guide §2) |
|---|---|---|
| Mid-brown | `2 3 4 5` | `#e5b993 / #b88863 / #885d3e / #4f3a26` |
| Deep brown | `6 7 8 9` | `#a87555 / #7a5238 / #4e3320 / #2b1c12` |
| Olive | `Á É Í Ó` (or pick 4 unused chars) | `#ecc89e / #c89770 / #97694b / #5c4128` |

Pick characters that don't collide with the existing palette. Update
the BUST_PAL with grouped comments matching the existing structure.
The state-tint maps (`flushed → g G F f`, `clammy → D d C c`,
`mottled → N n M m`, `cyanosed → V v B b`) stay shared across all
skin tones — same hex values overlaid on whatever base tone slot.

Per-case recipes use the slot character SET appropriate to that
character's skin tone. Beth uses `l L S s` (warm-fair); Patel uses
`2 3 4 5` (mid-brown); Okonkwo uses `6 7 8 9` (deep brown); Priya
uses `Á É Í Ó` (olive). The `substSkin` helper expects per-recipe
maps; each case authors its own
`flushed/clammy/mottled/cyanosed` map keyed off its own base slot
characters.

## §2. Sequencing — two review-gated batches

The single biggest risk is authoring 16 cases × 5 states = 80 state
recipes in one go and hitting the wrong direction on all of them.

**Batch A (3 cases, gate on user review)**

One case per new skin tone, plus one paeds, to stress-test the
system across the dimensions M98 didn't cover:

1. **Patel (72f, mid-brown, NSTEMI presentation)** — exercises
   mid-brown palette + elderly female bust + clammy/sweat
   pathway. Initial state `triaged`.
2. **Okafor (58m, deep brown, aortic dissection)** — exercises
   deep brown palette + adult male + intense-pain pathway with
   shock progression.
3. **Amir/Leo (8y/m, warm-fair, paediatric DKA)** — exercises
   paediatric proportions (smaller jaw, larger eyes relative to
   face, less defined cheekbones — see §4 below for paeds notes).

Capture each in the asset library gallery. Push as a single
commit `M99a — batch A bust portraits (Patel, Okafor, Amir)`.
**Stop and wait for sign-off before proceeding.**

**Batch B (13 cases)**

The remaining 13. Author in any order — the recipe rubric in
style guide §8 is the workflow. Per-case spec table in §3 below
shows the clinical-pathway + cue assignments.

Push as one commit `M99b — batch B bust portraits (13 cases)`.

## §3. Per-case spec table

| # | Case ID | Bust id | Age/Sex | Skin | Pathway | Initial state | Triaged cue | Deteriorating cues | PostResus prop |
|---|---|---|---|---|---|---|---|---|---|
| Batch A | | | | | | | | | |
| 1 | case_chest_pain_patel_ambient | patel | 72f | mid-brown | clammy (NSTEMI) | triaged | brow furrow + hand-to-chest (above bust, skip) + faint pursed lip | sweat droplet (temple) + clammy tint + pursed lip (pain) + slight grey pallor | nasal cannula (non-arrest path) |
| 2 | case_aortic_dissection_okafor | okafor | 58m | deep brown | clammy + shock | deteriorating | pain grimace (corners of mouth pulled tight) | grimace + sweat droplet + clammy tint + pursed lip + slight pallor of lips | ETT + tape (post-arrest default) |
| 3 | case_paeds_dka_amir | amir | 8m | warm-fair | clammy (DKA) | deteriorating | drowsy upper lid + dry lower lip | sunken eyes + dry lips + Kussmaul wide mouth + clammy tint | ETT + tape + NG (post-arrest default; paeds intubation is more likely than not) |
| Batch B | | | | | | | | | |
| 4 | case_dka_marcus | marcus | 19m | warm-fair | clammy (DKA) | deteriorating | drowsy lid | sunken eyes + dry lips + Kussmaul + clammy tint | ETT + tape + NG (per worked example in style guide §8) |
| 5 | case_anaphylaxis_paeds_sibling | sibling | 8m | warm-fair | flushed (anaphylaxis) | deteriorating | mild lip swell + brow knit | swollen lip halo + urticaria on cheek + sweat droplet + flushed tint | ETT + tape (likely arrest path) |
| 6 | case_head_injury_doac_brennan | brennan | 78f | warm-fair | clammy + bleed | stable | minor brow knit | forehead lac (`r`+`o` gash) + clammy tint + drowsy lid | bandage on forehead + nasal cannula |
| 7 | case_htn_emergency_oduya | oduya | 52m | mid-brown | flushed (HTN encephalopathy) | deteriorating | brow furrow + slight sweat | sweat droplet + flushed tint + open mouth + tense brow + slight head tilt | nasal cannula |
| 8 | case_acute_heart_failure_ahmed | ahmed | 78m | mid-brown | cyanosed (pulmonary oedema) | deteriorating | mild open mouth + slight cyanosis around lips | cyanotic lips + open mouth (orthopnea) + sweat droplet + accessory muscle use (neck tendons visible) | NRB mask |
| 9 | case_massive_pe_okonkwo | okonkwo | 39f | deep brown | cyanosed (PE) | deteriorating | tachypnea (open mouth slightly) | cyanotic lips + open mouth + clammy tint | ETT + tape (post-arrest default) |
| 10 | case_ugib_variceal_kowalski | kowalski | 54m | warm-fair | clammy (shock) | deteriorating | mild pallor | severe pallor (clammy tint) + dry lips + sweat droplet + hint of blood at mouth corner (1-2 `O`/`r` chars below lip) | ETT (post-arrest default) |
| 11 | case_ectopic_minors_sarah | sarah | 30f | warm-fair | clammy (shock) | unseen | mild pallor + pursed lips | severe pallor + pursed lips (collapse imminent) + sweat droplet + clammy tint | nasal cannula |
| 12 | case_sepsis_uti_morrison | morrison | 72f | deep brown | flushed → clammy (septic shock) | deteriorating | confused/blank stare | flushed cheeks + sweat droplet + open mouth (confusion) + slack jaw at corners | ETT (post-arrest default) |
| 13 | case_status_epilepticus_priya | priya | 28f | olive | clammy (post-ictal) | deteriorating | normal pre-ictal | drowsy lid (post-ictal Todd's) + slack mouth + clammy tint + faint sweat | ETT (intubation is standard for ongoing status) |
| 14 | case_stroke_acute_williams | williams | 67m | warm-fair | clammy (stroke) | deteriorating | normal | facial droop (drop one corner of row 24 to `o`) + ipsilateral lid ptosis (heavy upper lid on same side) + slight clammy tint + slight slack jaw on droop side | nasal cannula |
| 15 | case_paracetamol_od_chloe | chloe | 19f | warm-fair | clammy → jaundice | stable | mild nausea hint (one mouth corner pulled down, slight sallow under-eye) | jaundice patch on cheek + sclera tinge (replace `w` with `I`) + clammy tint + dry lips + slight pallor around eyes | nasal cannula |
| 16 | case_intox_stan_ambient | stan | 58m | warm-fair | drowsy + occult head injury | stable | mild head tilt + drowsy lid | drowsy upper lid + flushed cheeks + slack lip + small forehead lac (`r`+`o`, mechanism: fell while intoxicated) | nasal cannula + small bandage on forehead |

### Character cues for recognition (silhouette)

Each case needs at least one silhouette feature so the bust is
identifiable from across the room without reading the OSD chip.

- **Elderly (Patel 72, Brennan 78, Ahmed 78, Morrison 72)** —
  greying hair (`H`/`Y` mid-light), softer face outline, possibly
  visible glasses (`#` frames at row 16, careful not to clash
  with eye row), neckline modestly higher than Beth's V-neck.
- **Paediatric (Amir 8m, Sibling 8m)** — proportionally larger
  head (face extends down to row 30 instead of stopping at 26),
  smaller jaw (taper sooner), eyes slightly larger relative to
  face. Same row anchors though; just shift more chars in the
  face region. Garment: pyjamas (`y` navy mid + `E` shadow per
  style guide §6) or a paeds gown.
- **Williams (67m, stroke)** — short grey-white hair, clean-
  shaven, sensible. The facial droop is the case's pedagogical
  signature; keep the rest of the face clean so the droop reads.
- **Priya (28f, status epilepticus)** — long dark hair (`k`/`h`
  spilling over shoulders), olive complexion, intelligent
  features.
- **Okonkwo (39f, massive PE)** — Sub-Saharan, short natural hair
  or braids (textured outline, `k` + `h` mix), strong jawline.
- **Stan (58m, intox)** — unkempt grey-brown hair, possibly
  beard stubble (`h`/`H` on row 26 area as the lower-face dark
  patch), tired eyes (slight `~` even in stable state). His
  initial state IS stable — he reads as a chronically
  unkempt high-frequency attender, not a textbook patient.
- **Kowalski (54m, cirrhotic UGIB)** — pallor + slightly jaundiced
  baseline (so his stable doesn't look like a healthy 54-year-old;
  this is Child-Pugh C cirrhosis); brown hair greying at temples,
  prominent under-eye sunken-ness.
- **Sarah (30f, ectopic)** — young adult female, in distress
  (subtle on baseline; obvious by deteriorating). Long hair tied
  back or short bob.
- **Chloe (19f, paracetamol OD)** — university student, hair down,
  young; the jaundice tint at deteriorating is delayed (hepatic
  failure takes 24-48h to manifest in the eye/skin) but for
  pedagogical clarity in this sim, surface it on the
  deteriorating state.

The above are suggestions. Use your judgement; the key is **each
case is visually identifiable** from the silhouette + base tone +
hair, before any state-specific cue lands.

## §4. Paediatric proportion notes

Beth's reference bust uses these anchor rows:

- row 8–14: forehead + brow
- row 15–17: eyes
- row 18–22: nose + cheek plate
- row 23–26: mouth
- row 30–34: neck
- row 35–47: garment

For an 8-year-old (Amir, Sibling) the face should feel **larger
relative to the bust**. Shift the cheek plate down by 1-2 rows so
the face occupies rows 8-28 instead of 8-26, and the neck shortens
to rows 29-32. Eye row stays at 15-17 (same anchor — recipe diffs
are portable). Mouth row stays at 23-26. The visual difference is
the face plate extends slightly further down, the neck shortens,
and the shoulders sit higher.

Don't make paeds eyes BIGGER (more pixels). They're the same
2-px sclera + 1-px iris. The "big eyes" feel of paeds pixel art
in Stardew Valley etc. comes from face proportions, not pupil
size.

## §5. Intervention props — postResus only

Two rules from the style guide §7 + §8:

1. **If the case's state arc passes through `arrested`** (i.e. the
   kernel reaches arrest before ROSC), postResus = intubated. ETT
   exits the right corner of the mouth, `T` body running across the
   right cheek, `t` highlight on the upper edge of the tube body,
   `z` tape strap from lip up to behind the ear, NG tube down the
   contralateral cheek if the pathology warrants gastric
   decompression (DKA, UGIB, GI bleed).
2. **If the case's postResus is a stepped-down recovery** (no
   arrest), use nasal cannula. Two small `t` dots at the nostrils,
   `T` line across the cheeks tracing the cannula, `T` curl behind
   the ear, brief continuation down the neck.

For the per-case table above I've named the prop. Check the case
YAMLs in `content/cases/` if you want to verify the state arc — the
`progression_events` or `deterioration_if_not_x_by_t` blocks tell
you which states the kernel can reach.

NRB mask only on Ahmed (AHF + pulmonary oedema specifically). Big
visible `I` (gold yellow) covering the lower face from row 22 to
row 28, with `Y` strap up the cheek to behind the ear. Should
obscure the lower-face cyanosis cue (which is now under the mask) —
that's fine, the mask itself signals respiratory failure.

## §6. Asset library gallery — verify after each commit

The Asset Library at `?style-guide=1` iterates
`CASE_TO_BUST_ID ∪ CASE_TO_DROP_ID ∪ PATIENT_SPRITES` and shows all
5 states (stable, triaged, deteriorating, arrested, admitted) per
case. After each batch commit:

```
pkill -f "vite preview"; npm run build && npm run preview &
```

Then navigate to `http://localhost:4173/?style-guide=1` and inspect
the patient sprites section. Each new case should render its 5
states. Capture the gallery row for each new case to
`dev_loop/braintrust/18-sprite-portrait-shift/` so review is
possible without rebuilding locally.

## §7. Constraints (unchanged from M98)

- Canvas 48×48 per bust. No bigger, no smaller.
- Light direction top-left. Same as M98.
- Recipe shape: `{ base, skinMap?, diffs? }` per `PatientStateRecipe`.
- Breathing animation: inhale + exhale 2-frame pair for upright
  states; arrested = single still frame.
- Output format: TypeScript modules. Same file as Beth's recipes
  (`src/style/bustPortraitSprites.ts`) — extend the BUST_SPRITES
  registry and CASE_TO_BUST_ID map; do NOT split into per-case
  files (the existing system keeps everything in one module for
  resolver simplicity and tree-shake reliability).
- Don't touch Beth's recipes. They're locked.
- Don't add a new renderer entry point — `bustFrameToSvg` is the
  only renderer; reuse it.
- Don't add external image assets.

## §8. Acceptance criteria — what review will check

Per case:

1. ✅ All 5 states render through `spriteSvgFor(caseId, state, 0, 4)`.
2. ✅ Each state visually distinct without the OSD chip.
3. ✅ Triaged → deteriorating clinically obvious.
4. ✅ Skin tone matches the table; uses the slot-character system.
5. ✅ At least one silhouette feature recognisable (hair, garment,
   distinguishing prop).
6. ✅ Intervention prop matches the postResus column.
7. ✅ Pre-flight clean (`npm run typecheck`, `npm run lint`,
   `npm test`, `npm run validate-content`, `npm run build`,
   `npm run build:single-file`).

Suite-wide:

1. ✅ 16 cases × 5 states authored (80 state recipes new + 5 from
   M98 = 85 state recipes total in BUST_SPRITES).
2. ✅ Style guide §2 mid-brown / deep brown / olive skin tones are
   present in BUST_PAL.
3. ✅ Existing 449 tests still pass; M98's 6 bust-resolution tests
   still pass; new per-case sprite tests pass.
4. ✅ Single-file bundle grows by less than ~150KB (rough budget
   for the recipe data; Beth was ~11KB).

## §9. Test coverage to add

Extend `tests/sprites.test.ts` (the `M98 — bust portrait resolver`
block):

- A loop asserting every case in CASE_TO_BUST_ID resolves to a
  48×48 SVG for `stable / triaged / deteriorating / arrested /
  admitted`.
- A loop asserting deteriorating differs from triaged for every
  case (catches accidental copy-paste regressions).
- A loop asserting arrested is a single still frame for every
  case (no breathing animation when the patient isn't breathing).

## §10. Don'ts

- Don't redesign the renderer. Don't add new helpers beyond
  `substSkin` / `applyDiffs` / `bustFrameToSvg`.
- Don't touch case YAMLs. Sprite changes do not change clinical
  content; M97 already audited the vitals.
- Don't redo Beth.
- Don't ship a feature flag, a config toggle, or a "demo case"
  fallback. The bust system either covers all 16 cases (plus
  Beth) or it shouldn't be shipped. Half-finished is worse than
  the current 24×32 sprites.
- Don't add comments narrating "M99 batch A" / "TODO author next"
  / "WIP". The commit log is the change history; the source file
  should read as a finished module.

## §11. Hand-off

After Batch A commit + push, **stop and wait**. The user will
review and post a comment on the PR (or in the session) approving
or requesting changes. Do not proceed to Batch B until you have
written sign-off.

After Batch B commit + push, run the full pre-flight + update
`HANDOVER.md §3` to mark M99 closed.

If you find that a case's clinical-pathway assignment in the
per-case table doesn't match what you see in the case YAML, raise
it BEFORE authoring. Better to clarify than to author against a
wrong assumption.

— *M99 · bust portraits, remaining 16 cases.*

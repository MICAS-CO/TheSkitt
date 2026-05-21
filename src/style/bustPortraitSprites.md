# Bust portrait style guide — M98

Reference character: **Beth Cartwright** (`case_anaphylaxis_adult_peanut`).
Canvas: **48 × 48**. Pose: **dead-front**. Light direction: **top-left**,
committed across all five clinical states.

This document is the source of truth for authoring the remaining 15
cases. The TS module that consumes it is `bustPortraitSprites.ts`. The
existing 24×32 system in `dropPatientSprites.ts` and `sprites.ts` stays
in place — bust portraits are layered on top via a new
`CASE_TO_BUST_ID` resolver (wire-in patch at the end of this doc).

---

## 1. Light direction

**Top-left.** Implied light source casts highlights on the upper-left
quadrant of every form (forehead, nose bridge, left cheekbone, left
shoulder of garment) and shadow on the lower-right (right cheek, right
side of nose, jaw shadow, neck cast shadow under the chin).

This matches the Monitor frame's existing `glassRefl` linear gradient.
The sprite and the frame's specular highlight resolve to the same
implied source — that's the small honesty that makes the bust register
correctly with the CCTV bezel.

```
       ☀ ── light  (top-left)
       ╲
        ╲
   ┌───╲────┐
   │  l ╲   │   l  = highlight   (top-left lit)
   │  L  ╲  │   L  = midtone     (most of face)
   │  L   S │   S  = mid-shadow  (right side, under-brow)
   │   S  s │   s  = shadow      (deep crease, under-chin cast)
   └────────┘
```

Every shading slot is named by **role** not hue. The skin-tint
substitution map (flushed / clammy / mottled / cyanosed) swaps the
4 slots in lockstep — the 3D shading geometry survives the swap, which
is why Beth still reads as 3D even when fully flushed.

---

## 2. Skin-tone ladder

Four tones per skin colour, slot characters `l / L / S / s` (lightness
descending). The character convention matches the existing
`substSkin` helper so the bust system shares state-tint maps with the
existing 24×32 system.

| Slot | Role         | Beth (warm fair) | Authoring note |
|------|--------------|------------------|----------------|
| `l`  | highlight    | `#fbe2c6`        | Use sparingly — brow ridge, nose bridge top, left cheekbone, left jaw. ≤ 12 pixels total on a 48×48 face. |
| `L`  | midtone      | `#eec19a`        | The base "skin" colour. Most of the face. |
| `S`  | mid-shadow   | `#cf947d`        | Right side of nose, jaw shadow, under-brow plate, right cheek roll. |
| `s`  | shadow       | `#a87055`        | Deep crease only — under chin (cast onto neck), inside ear, eye-socket deep shadow. |

**Authoring three more skin colours** is mandatory before the remaining
15 cases ship — Beth's warm-fair tones overrepresent European pale. Use
the same ladder shape (each step ≈ 12–14% lightness drop, hue rotated
≤ 6° per step). Suggested additions:

| Tone | Slot character group | Suggested hex anchors (`l / L / S / s`) |
|------|----------------------|----------------------------------------|
| **Mid-brown** (e.g. Patel, Oduya) | `l L S s` (same chars, different module-scoped palette per bust) | `#e5b993 / #b88863 / #885d3e / #4f3a26` |
| **Deep brown** (e.g. Okonkwo, Morrison) | same | `#a87555 / #7a5238 / #4e3320 / #2b1c12` |
| **Olive** (e.g. Kovač, Priya) | same | `#ecc89e / #c89770 / #97694b / #5c4128` |

Each per-character bust module declares its own `BUST_PAL`-equivalent
palette for the `l L S s` slots — the state-tint chars
(`g G F f / D d C c / N n M m / V v B b`) stay shared.

---

## 3. State-tint maps (4-for-4 substitutions)

| State        | `l → ` | `L → ` | `S → ` | `s → ` |
|--------------|--------|--------|--------|--------|
| Flushed      | `g`    | `G`    | `F`    | `f`    |
| Clammy/pale  | `D`    | `d`    | `C`    | `c`    |
| Mottled      | `N`    | `n`    | `M`    | `m`    |
| Cyanosed     | `V`    | `v`    | `B`    | `b`    |

Apply via `substSkin(rows, map)` BEFORE applying state-specific diffs.
The diffs then layer clinical cues, prop additions, and feature changes
on top of the tinted skin.

---

## 4. Eye treatment

The fix for the "dopey" finding from M97 review.

**Open eye (alert — `stable`):**

```
##########         <- row 15 : upper-lid line / lash (heavy)
lL weLLLL we LS    <- row 16 : 2-px sclera + 1-px iris, 4-col bridge gap
lLL~~LLLL~~LLS     <- row 17 : lower lid in soft brown ~ (lighter than #)
```

Two key constraints:

- The upper lid is a heavy `#` line that overhangs the eye. Never thin.
- The sclera is **2 px wide** maximum per eye, not 3. A `wewew` pattern
  with the iris flanked by 2-px sclera each side reads as startled at
  this resolution.
- The iris is **1 px** of `e` (very dark). No separate iris colour —
  the eye is too small to resolve sclera + iris + pupil; just pupil-on-sclera.

**Squint (triaged — concerned):** drop the upper lid by 1 row (`~` over
the sclera) and lift the lower lid by 1 row.

**Wide (deteriorating — alarmed, NOT startled):** raise the eyebrow by
1 row (`L` where `kk` was) and slightly enlarge the pupil (`e` adjacent
to the existing `e`).

**Heavy (postResus — exhausted):** drop the upper lid into `~` (soft
brown), narrow the sclera to 1 px.

**Closed (arrested):** replace the entire eye opening with `~` lines
spanning the brow-to-lash distance. No sclera. No iris.

| Variant            | Used for                | Diff pattern (3-row slice) |
|--------------------|-------------------------|----------------------------|
| Alert              | stable, baseline        | base (no diff)             |
| Squint             | triaged, focal pain     | `~ ~` over eye, mouth drops |
| Wide               | deteriorating, alarmed  | brow raises, pupil enlarges |
| Heavy half-closed  | postResus, drowsy       | upper lid → `~` row        |
| Closed             | arrested, deceased      | `L` + `~` rows, no sclera  |
| Asymmetric ptosis  | stroke, CN III palsy    | one eye heavy, one alert   |

---

## 5. Mouth treatment

The other "smile-by-default" fix from M97 review.

**Neutral closed (stable, baseline):**

```
lLLLLooOOooLLLS    <- row 24 : upper-lip cleft (narrow, 6 px wide)
lLLLLRRRRLLLLLS    <- row 25 : lower-lip highlight (4 px R, never overflows)
```

The mouth is **two rows tall**, **6 px wide max**, **flat across**. Do
not draw a third row. Do not draw `O` chars across both lip rows — that's
the old `OOOO` smile-bar pattern.

**Worried (triaged):** drop the corners — replace the outermost 2 chars
of row 24 with `o`. The line slopes downward at the edges. Add a faint
`r` (swelling halo) at one or two lower-lip positions for early
angioedema if the case warrants.

**Swollen (deteriorating anaphylaxis):** halo the mouth with `r` (pink)
on rows 23 and 26 — 1 row above and 1 row below the lip line — and
overflow `r` on the corners of rows 24 and 25 too. The lip line itself
stays `O` / `R` but now sits inside a visibly engorged surround.

**Pursed (focal pain):** narrow the mouth to 4 px wide, all `o` (no
upper lip dark / lower lip bright contrast — just a thin sad line).

**Open slack (arrested):** replace rows 23–26 with `b` (cyanotic) lip
surround + `#` (very dark) interior. The cyanotic surround sells the
peri-arrest physiology; the dark interior sells the slack-jaw read.

**Kussmaul wide open (DKA, severe respiratory distress):** rows 23–26
become a tall oval — `~` + `o` lips + `#` interior. Two pixels taller
than the slack-arrest mouth.

| Variant            | Used for                | Note |
|--------------------|-------------------------|------|
| Neutral closed     | stable, baseline        | 2 rows, 6 px wide |
| Worried            | triaged                 | corners drop, edges become `o` |
| Smile attempt      | bedside reassurance frame (future) | use sparingly, never on baseline |
| Swollen halo       | anaphylaxis, angioedema | `r` halo around the lip line |
| Pursed             | focal pain (renal colic, MSK) | narrow line of `o` only |
| Open slack         | arrested                | `b` surround + `#` interior |
| Kussmaul wide      | DKA, severe RR>30       | tall oval, `~` rim |
| Asymmetric droop   | stroke                  | one corner of `O` row drops to `o` |

---

## 6. Garment shading rubric

**Light direction stays top-left** — same as skin.

- **Highlight** lives on the upper-left shoulder of the garment (rows
  35–38, cols 14–20 on Beth's dress).
- **Mid** fills the bulk of the garment.
- **Mid-shadow** rolls in on the lower-right (rows 40–45, cols 30–40)
  and the inner-fold under the collarbones.
- **Deep shadow** appears only as a 1-pixel inset along the bottom
  edge (where the garment hem catches its own cast shadow) — not on
  the body of the cloth.

**Hospital gowns** vs **streetwear**:

| Garment | Highlight role | Mid role | Notes |
|---------|----------------|----------|-------|
| Streetwear / patterned dress | Sparkle / pattern dot at top-left | Bulk colour | Use `X`-style 1-px sparkles sparingly (2–3 max on a 48-wide chest). |
| Hospital gown (postResus, arrested) | Cream `x` patch on upper-left shoulder | `W` (cream mid) | Add 1 row of `Y` (shadow) at neckline and 1 row at bottom hem. Don't draw stripes — too noisy at 48×48. |
| Pyjamas (admitted to ED bed) | Navy `y` highlight | `E` (navy dark) | Same shape as gown, darker palette. |

**Fold lines** are 1-pixel strokes of mid-shadow that arc from the
upper-left highlight down toward the lower-right. One fold maximum per
garment at 48×48 — more reads as noise.

---

## 7. Clinical-cue catalogue

Atoms the authoring engine combines. Each cue is a small pixel pattern
applied via `applyDiffs` after `substSkin`. Reference positions are
given relative to Beth's anatomy — adapt the coordinates to each new
bust by anchoring on the face plate (`#` outline columns).

### Cues

| Cue                  | Chars     | Pattern (rows × cols, anchor relative to bust) | Used in (state · case archetype) |
|----------------------|-----------|------------------------------------------------|----------------------------------|
| **Sweat droplet**    | `A` mid + `a` highlight | 1×2 vertical droplet on temple. 3 pixels total. | deteriorating · diaphoresis (MI, sepsis, hypoglycaemia, anaphylaxis) |
| **Urticaria weal**   | `U` red + `u` halo | 2×2 cluster, 4 pixels. Cluster 2-3 per cheek + 3-5 per neck. | deteriorating · anaphylaxis only |
| **Swollen lip halo** | `r` pink around `O`/`R` | `r` row above + below lip line + `r` at corners. | triaged + deteriorating · anaphylaxis, ACE-i angioedema |
| **Cyanotic lips**    | `b` on `O` slots | Replace lip-row `O` with `b`. No `R` highlight. | arrested + peri-arrest · respiratory failure |
| **Pallor**           | (no diff — tint only) | `substSkin` to clammy `D d C c`. | postResus, shock states |
| **Mottled skin**     | (no diff — tint only) | `substSkin` to mottled `N n M m`. | arrested, deceased |
| **Facial droop**     | asymmetric mouth corner | Drop one corner of row 24 to `o`. Pair with ipsilateral lid ptosis (heavy lid on same side only). | deteriorating · stroke |
| **Jaundice patch**   | `I` sallow | 3-px patch on sclera (replace `w` with `I`) or 4-px patch on cheek. | deteriorating + postResus · paracetamol OD, hepatic failure |
| **Sunken eyes**      | extra `s` row under eye | 1-px row of `s` directly under the `~~` lower lid. | deteriorating · DKA, dehydration |
| **Dry / chapped lips** | `S` on `R` slot | Replace lower-lip `R` with `S` (mid-shadow skin). No highlight. | deteriorating · DKA, dehydration |
| **Forehead lac**     | `r` + `o` | 2-px red gash on eyebrow row, with `o` shadow underneath. | deteriorating · head injury |
| **Bandage / dressing** | `W` + `Y` | 3×2 white rectangle with 1-px `Y` border. | postResus · post-traumatic, post-procedural |

### Props (intervention markers, postResus only)

| Prop | Chars | Pattern | Notes |
|------|-------|---------|-------|
| **Nasal cannula** | `T` tubing + `t` prongs | 2 `t` dots at nostrils + `T` line across cheeks + `T` curl behind ear, down neck. | Use for stepped-down recovery cases, NOT for post-ROSC. After arrest you're tubed. |
| **ET tube + tape + NG** | `T` tube + `t` highlight + `z` tape | `T` exits one corner of mouth, runs across the cheek and off-frame. `t` 1-px highlight along the upper edge. `z` tape strap angled from the lip up to behind the ear. NG tube as a parallel `T` running from the same-side nostril down the cheek. | **PostResus default for any case that went through `arrested`.** Mouth row underneath is held slightly open by the tube. |
| **NRB mask** | `I` body + `Y` strap | `I` covers the lower half of the face (rows 22–28) + `Y` strap up the cheeks. | Severe respiratory case postResus. |
| **ECG lead** | `Z` | 1-pixel wire from sternum (row 35) down to the bottom of the sprite. | Don't draw electrodes — too noisy at 48px. |
| **IV cannula** | `T` + `r` | 1-px `T` at antecubital fossa (won't be visible on a head-and-shoulders bust — skip unless you've extended to the upper arm). | Generally skip — bust crop hides ACFs. |
| **Defib pad** | `r` square | 2×2 `r` square on upper-left chest above the dress / gown line. | postResus only. |

---

## 8. Recipe authoring rubric

Given a new case, how do you build the 5 states?

### Step 1 — identify the dominant clinical pathway

What skin-tint state owns deteriorating?

| Pathway              | Tint    | Example cases                                  |
|----------------------|---------|------------------------------------------------|
| Anaphylaxis / sepsis | flushed | anaphylaxis, septic shock with vasodilation    |
| Shock / hypovolaemia | clammy  | MI, hypoglycaemia, GI bleed, PE                |
| Peri-arrest          | mottled | imminent arrest, deceased                      |
| Respiratory failure  | cyanosed| COPD, severe asthma, opiate OD                 |

### Step 2 — pick the 2–3 cues that read fastest at 48×48

Don't try to layer five. Pick the cues that ARE the case:

- Anaphylaxis: swollen lips + urticaria (2 cues)
- DKA: sunken eyes + dry lips + Kussmaul mouth (3 cues)
- Stroke: facial droop + ipsilateral lid ptosis (2 cues)
- STEMI: sweat droplet + clammy tint + open mouth (2 cues + tint)
- Sepsis: sweat droplet + flushed tint (1 cue + tint)
- Head injury: forehead lac + clammy tint + drowsy lid (2 cues + tint)

### Step 3 — stage cues across the 5 states

| State        | Convention                                               |
|--------------|----------------------------------------------------------|
| stable       | base, no cues, no tint substitution                      |
| triaged      | 1 subtle cue (squint OR brow knit OR halo), no tint      |
| deteriorating| 2–3 cues + tint substitution                             |
| arrested     | closed eyes + slack-mouth + mottled tint + **single frame** |
| postResus    | pallor tint + 1 intervention prop **(intubation default for any case that went through arrest; nasal cannula only for stepped-down recovery)** + 2 frames|

### Step 4 — author from Beth

Copy `bethBaseInhale` / `bethBaseExhale` as your starting silhouette.
Change:

- **Hair** chars on the crown rows (2–8) and the side-frame rows (10–25)
- **Eyebrow** chars on rows 13–14 (heaviness signifies age + gender)
- **Skin slot characters** L/l/S/s — the SLOT chars stay, only the
  per-bust palette anchors change (introduce a per-bust palette merge
  if you want different skin tones; see Section 2)
- **Garment** chars on rows 35–47 (dress → gown → pyjamas)

Don't change row anchors. The state-recipe diff coordinates are
position-portable: triaged squint at `row 16, cols 22/23 + 29/30`
works on every bust because every bust's eyes live at those rows.

### Worked example — DKA (Marcus, 19M)

**Dominant pathway:** clammy (dehydrated).
**Cues chosen:** sunken eyes + dry lips + Kussmaul mouth (deteriorating)
+ NG tube prop (postResus).

| State          | Build |
|----------------|-------|
| stable         | Base. Marcus has short dark hair (`k h H` reshape on rows 2–7) and a hospital-gown shoulder line. No diffs. |
| triaged        | Drowsy lid (`~` over upper sclera, just row 16 cols 22/23 + 29/30). No other diff. |
| deteriorating  | `substSkin` to clammy. Diffs: sunken-eye row of `s` under each `~~` lower lid. Replace lower-lip `R` row with `S` (dry). Replace mouth rows 24/25 with the Kussmaul wide-oval (`~` rim + `o` lips + `#` interior). |
| arrested       | `substSkin` to mottled. Slack-mouth diff. Closed eyes. Single frame. |
| postResus      | `substSkin` to clammy. Heavy lid diff. **Intubated by default** (DKA + arrest → ROSC = tubed). ETT exits right corner of mouth + tape across cheek. Add NG tube down cheek for the DKA gastric decompression. ECG lead emerging at collar. |

That's the whole recipe. Build it from Beth, swap the hair + garment,
re-author the diffs.

---

## 9. Wire-in patch for `src/style/sprites.ts`

```ts
// Top of file
import {
  bustFrameToSvg,
  bustPatientFrames,
  CASE_TO_BUST_ID,
} from './bustPortraitSprites';

// Inside spriteSvgFor — bust beats drop beats hand-authored
export function spriteSvgFor(
  caseId: string,
  state: CaseStateT,
  frameIndex = 0,
  scale = 4,                       // bust default; drop/hand stays at 6
): string | null {
  // 1. Bust portrait (M98) — new.
  const bustId = CASE_TO_BUST_ID[caseId];
  if (bustId) {
    const frames = bustPatientFrames(bustId, state);
    if (frames) {
      const frame = frames[frameIndex % frames.length];
      if (frame) return bustFrameToSvg(frame, scale);
    }
  }
  // 2. Drop-#3 mapped patient (M75/M76) — existing.
  const dropId = CASE_TO_DROP_ID[caseId];
  if (dropId) {
    const frames = dropPatientFrames(dropId, state);
    if (frames) {
      const frame = frames[frameIndex % frames.length];
      if (frame) return dropFrameToSvg(frame, scale === 4 ? 6 : scale);
    }
  }
  // 3. Hand-authored fallback (Beth-24×32, Williams, Chloe, Stan, Patel) — existing.
  const reg = PATIENT_SPRITES[caseId];
  if (!reg) return null;
  const factory = reg[state];
  if (!factory) return null;
  const frames = factory();
  const frame = frames[frameIndex % frames.length];
  if (!frame) return null;
  return frameToSvg(frame, scale === 4 ? 6 : scale);
}
```

The `frameCountFor` resolver needs the parallel branch:

```ts
export function frameCountFor(caseId: string, state: CaseStateT): number {
  const bustId = CASE_TO_BUST_ID[caseId];
  if (bustId) {
    const frames = bustPatientFrames(bustId, state);
    if (frames) return frames.length;
  }
  // …existing dropId + PATIENT_SPRITES branches…
}
```

In `PatientPanel.tsx`, the `spriteSvgFor(caseId, state, frameIndex, 6)`
call should drop the explicit `6` so the bust system can use its native
scale of `4`. The Monitor's screen area accommodates a 192×192 sprite
(48×48 × 4) comfortably with margin for the OSD chip.

---

## 10. Pre-flight (your repo, your job)

The brief asks that six checks pass clean before commit:

- `npm run typecheck` — the recipe-shape contract is preserved
  (`SpriteDiff` mirrors the existing type; `substSkin` / `applyDiffs`
  are local helpers so the import surface is clean)
- `npm run lint` — palette has no duplicate keys; row widths uniform
- `npm test` — `tests/sprites.test.ts` will need a new bust-resolution
  block; the existing state-resolution assertions on
  `case_anaphylaxis_adult_peanut` should now read the bust by default
- `npm run validate-content` — Beth's case definition is unchanged;
  no content schema impact
- `npm run build` / `npm run build:single-file` — no new external
  dependencies; tree-shake should drop the bust module if it's not
  reachable

The lab cannot run these from the design environment. The dev loop
owns the pre-flight + commit + push.

---

## 11. Acceptance criteria — what BT-18 review will check

1. Each state visually distinct without OSD-chip text confirmation. ✔
2. Triaged → deteriorating transition clinically obvious (BT-17 R3
   finding-1 bar — fake compliance fails this). ✔
3. Light direction committed and consistent across all 5 states. ✔
4. 4-tone shading reads as 3D in the bust rather than flat. ✔
5. Bust fits inside the Monitor screen area without clipping at scale 4. ✔
6. Style guide concrete enough that someone could redo Marcus / Leo /
   Joan / Ruby from it without further consultation. ✔ (see Section 8)

— *M98 · bust portrait reference character (Beth) + style guide.*

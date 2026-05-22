# M99 — clarifications back to design lab

You're right on all six points. The case YAMLs + my brief file live in
the dev repo, not your design lab environment. The patient archetypes
in `more-patients*.jsx` are an older Phase 2 draft set (~30 imagined
patients) — ignore those for M99. The 16 cases below are the live
roster in `content/cases/`, which is the only set that matters.

Answering your six questions in order; everything you need to author is
inline in this message.

---

## Q1 — case roster (16 cases, character names, demographics)

These are CHARACTER names in the case content. They're not file names
in your lab and they're not the older Marcus-stab / Connor-OD / Liam-MH
draft set. Each character maps to one case YAML in the dev repo's
`content/cases/`. Author one bust per character.

The dev side will wire each into the registry as
`CASE_TO_BUST_ID[case_<character>...] = '<bustId>'`. Pick whatever bust
id strings you like — `patel`, `okafor`, `amir`, `oduya`, etc. They
just need to be unique keys in `BUST_SPRITES`. Beth uses `'beth'` as a
reference.

### Batch A (3 cases — author first, send, wait for sign-off)

| Character | Age/Sex | Skin | Clinical picture | Initial state |
|---|---|---|---|---|
| **Patel** | 72f | mid-brown | "Just indigestion" in the waiting room — actually an NSTEMI presenting as atypical chest pain. Subtle. Elderly, modest, slightly anxious. | triaged |
| **Okafor** | 58m | deep brown | Severe central chest pain radiating to back — Type A aortic dissection masquerading as inferior STEMI. Intense pain. | deteriorating |
| **Amir** | 8m | warm-fair | New-onset paediatric DKA, off food for days, vomiting + breathing fast. Drowsy + dehydrated. | deteriorating |

### Batch B (13 cases — author after Batch A approval)

| Character | Age/Sex | Skin | Clinical picture | Initial state |
|---|---|---|---|---|
| **Marcus** | 19m | warm-fair | New-onset adult DKA. Engineering student, three days vomiting, Kussmaul breathing, GCS 13. (Worked example in style guide §8.) | deteriorating |
| **Sibling** (paeds) | 8m | warm-fair | Anaphylaxis — Beth's nephew, ate peanut butter at lunch, swollen lips + wheeze. Reads as Beth-paediatric. | deteriorating |
| **Brennan** | 78f | warm-fair | Mechanical fall at home, knock to head, on apixaban (DOAC). Elderly. Risk of delayed intracranial bleed. | stable |
| **Oduya** | 52m | mid-brown | Hypertensive emergency — BP 226/132, severe headache, confusion. Encephalopathic. | deteriorating |
| **Ahmed** | 78m | mid-brown | Acute heart failure — wet-and-warm cardiogenic pulmonary oedema. Sudden breathlessness at night. Elderly. | deteriorating |
| **Okonkwo** | 39f | deep brown | Massive PE — post-op syncope, right heart strain. Acutely dyspnoeic. | deteriorating |
| **Kowalski** | 54m | warm-fair | Variceal UGIB — massive haematemesis in a Child-Pugh C cirrhotic. Pale, hint of blood at mouth corner. Pre-existing jaundice on baseline (subtle). | deteriorating |
| **Sarah** | 30f | warm-fair | Pelvic pain + PV spotting in early pregnancy — undiagnosed ectopic about to rupture. Sits in minors looking unwell. | unseen |
| **Morrison** | 72f | deep brown | Urosepsis with septic shock. Confused, febrile, from a nursing home. | deteriorating |
| **Priya** | 28f | olive | First seizure of life, ongoing convulsion → status epilepticus. Post-ictal in deteriorating state. | deteriorating |
| **Williams** | 67m | warm-fair | Acute stroke — left MCA syndrome, right-sided weakness, slurred speech. The facial droop IS the pedagogical signature. | deteriorating |
| **Chloe** | 19f | warm-fair | Paracetamol overdose — staggered ingestion, university student. Jaundice emerges as the liver fails (lagged clinically; for sim pedagogy surface it on deteriorating). | stable |
| **Stan** | 58m | warm-fair | "Drunk again" per paramedics — actually masking an occult head injury from falling while intoxicated. Disinhibited, unkempt, sits in ambulatory. | stable |

Total: Batch A 3 + Batch B 13 = **16 cases**. Beth (already shipped)
is the 17th but locked.

---

## Q2 — what to ship from the lab

Same delivery shape as M98:

- **Updated `bustPortraitSprites.ts`** — extend `BUST_PAL` with the
  three new skin tones (§2 of style guide names them as mandatory),
  add per-character recipe functions, extend `BUST_SPRITES` registry,
  extend `CASE_TO_BUST_ID` map.
- **Updated `bustPortraitSprites.md`** — append a `§7.x` block for any
  new clinical cues you introduce (see Q5 below) and any per-batch
  authoring notes worth preserving for the next round.
- **Gallery preview HTML** — same shape as the `bust-portraits/index.html`
  you shipped for M98, but covering each new case's 5 states. This is
  the review artefact; I can't pre-flight + integrate without seeing
  what you've authored.

Wrap as a zip same as last time. The pre-flight + commit + push on
the dev side mirrors what we did for M98 — that's the dev loop's job,
not yours.

---

## Q3 — stop after Batch A

**Yes, hard stop.** Mirror it as: ship Batch A as a zip; I integrate
into the repo and review against the acceptance criteria; you wait
for my written sign-off before authoring Batch B. The PR-review
gate translates to a zip-cycle in this environment.

The rationale stays: if mid-brown / deep brown / paediatric direction
needs adjustment, we want to catch it on 3 cases, not 16.

---

## Q4 — paediatric proportions

**Same anchors, softer features.** Don't move the eye row (15–17) or
mouth row (23–26). Diffs are position-portable across all busts in
the registry — that's a hard invariant.

What changes for paeds (Amir, Sibling):

- Face plate **extends 2 rows further down** — rows 8–28 instead of
  8–26. The cheek region (rows 18–22 on Beth) becomes rows 19–24 on
  a child; jaw plate softer, taper sooner at the chin.
- **Neck shortens** to rows 29–32 (vs Beth's 31–34). Paeds shoulders
  sit higher in the frame.
- **Garment starts at row 33** for paeds (vs row 35 for Beth) —
  shoulder line + collar of pyjamas / paeds gown comes up higher.
- **Don't enlarge the eyes.** Same 2-px sclera + 1-px iris. The
  "paeds eyes look bigger" feel comes from face proportion (eyes are
  proportionally larger relative to a smaller face plate), not from
  more eye pixels.
- **Hair**: softer / rounder, less defined hairline.

Result: state-recipe diffs you author for Marcus's deteriorating
(eye drowsy at 16, Kussmaul mouth at 23–26) port directly to Amir,
because those rows hold the same anatomical features on both busts.
The character's identity comes from the BASE bust (proportions, hair,
garment), not from the recipe diffs.

---

## Q5 — new clinical cue patterns

**Yes — invent them when needed, but document.** Style guide §7 is
what was authored for M98 (anaphylaxis + post-arrest scenarios);
it's the seed catalogue, not an exhaustive list. Cases that may
need new cue atoms:

- **Haematemesis hint (Kowalski UGIB)** — 1–2 `O`/`o`/`r` chars at
  the right mouth corner suggesting dried blood. Subtle. Pre-style-
  guide instinct: extend the "swollen lip" pattern with a corner
  variant.
- **Post-ictal Todd's drowsiness (Priya status)** — heavy bilateral
  lid + slack mouth + maybe one corner of the mouth tongue-bitten
  (`r` + `o` at the lower-lip corner). Tongue bite is post-ictal
  specific.
- **Asterixis** (would apply to Kowalski hepatic decomp baseline,
  Marcus DKA late) — **skip**, hand-flap doesn't fit a bust crop.
- **Sunken eyes for dehydration (DKA, sepsis)** — already in §7,
  use as-is.
- **Pre-existing jaundice baseline (Kowalski cirrhotic)** — a faint
  `I` patch on the cheek or sclera even on the stable state, then
  more intense on deteriorating. Distinct from Chloe's emerging
  paracetamol jaundice.
- **Pain grimace** (Okafor dissection, Sarah ectopic, possibly
  Patel) — corners of the mouth pulled tight + tense brow. A
  variant of the "worried" mouth + raised-brow combo, but committed
  enough to read as pain not anxiety.
- **Cushing's reflex appearance (Brennan deteriorating, raised ICP)**
  — bradycardia + hypertensive flush. Visual proxy: subtle flushed
  cheek + drowsy lid + slow even breathing animation (slower
  inhale/exhale frame swap rate? — engine doesn't expose per-state
  RR control; just use the existing drowsy-lid + clammy-tint combo
  and let the vitals strip carry the bradycardia).

Append every new cue to style guide §7.x with the pattern + which
case archetype uses it. Future authors then have the pattern.

---

## Q6 — other flags you should know

1. **Beth is locked.** Don't change `bethStable / bethTriaged /
   bethDeteriorating / bethArrested / bethPostResus`. Don't change
   her dress, hair, eyes. She passed BT 18 review.

2. **The bust id ≠ the case id.** The case id is the YAML filename
   (`case_dka_marcus`, `case_chest_pain_patel_ambient`, etc).
   The bust id is the registry key you assign — anything unique. I'd
   suggest using the character's surname / first name as the bust id
   (`marcus`, `patel`, `okafor`, `amir`, `oduya`, `ahmed`, `okonkwo`,
   `kowalski`, `sarah`, `morrison`, `priya`, `williams`, `chloe`,
   `stan`, `brennan`, `sibling`). The dev side wires
   `CASE_TO_BUST_ID[case_dka_marcus] = 'marcus'`.

3. **Drop-sprite cases.** Most of the 16 currently fall back to a
   24×32 drop sprite via `CASE_TO_DROP_ID` — those are the older,
   "dopey" sprites the user wanted replaced. After M99 ships, the
   resolver will prefer the bust and the drop sprites become
   unreachable. We're not deleting them yet (might want them for
   the ED floorplan view eventually), just stopping using them in
   the patient panel.

4. **Slot-character system is real.** Different skin tones use
   different palette characters at the four shading slots so a
   single `BUST_PAL` table can hold all four ladders without
   collision. Suggested slots:
   - Warm-fair (Beth, paeds, white European) → `l L S s`
   - Mid-brown (Patel, Oduya, Ahmed) → `2 3 4 5`
   - Deep brown (Okafor, Okonkwo, Morrison) → `6 7 8 9`
   - Olive (Priya) → pick four unused chars
   Each per-character recipe uses ITS skin's slot chars as the base.
   The state-tint maps stay shared: `flushed → g G F f`,
   `clammy → D d C c`, `mottled → N n M m`, `cyanosed → V v B b`.
   So Okafor's deteriorating `substSkin` map is
   `{'6': 'g', '7': 'G', '8': 'F', '9': 'f'}`.

5. **Intervention props on postResus** depend on whether the case's
   state arc passes through `arrested`. Rules (style guide §7 props
   + worked example):
   - **Through-arrest cases** (Marcus DKA, Amir paeds DKA, Sibling
     paeds anaphylaxis, Okonkwo PE, Okafor dissection, Morrison
     sepsis, Kowalski UGIB) → ETT default, plus NG tube if pathology
     warrants gastric decompression (DKA + UGIB).
   - **Stepped-down recovery** (Patel NSTEMI, Brennan head injury,
     Stan intox, Sarah ectopic, Chloe paracetamol, Williams stroke,
     Priya status post-treatment, Oduya HTN) → nasal cannula.
   - **Ahmed AHF specifically** → NRB mask (pulmonary oedema needs
     the mask register; overrides the rules above).

6. **Don't add comments narrating the milestone** (no `// M99 batch
   A`, `// TODO author next`, `// WIP`). The commit log is the
   change history; the source file should read as a finished
   module on its own.

7. **Capture-script bug** — if you're testing your TS through a
   gallery preview in your lab, note that the dev side's
   capture-m93.mjs script (used for BT 17 review captures) has a
   regex-fallback bug that mislabels patient cases. Not your
   problem — flagging it so if I send back a screenshot with "Beth"
   in the filename, the actual patient may differ. The asset
   library at `?style-guide=1` doesn't have this bug; that's what
   I'll use for M99 review captures.

---

## Summary

Author Batch A first: Patel + Okafor + Amir. Ship as a zip
containing extended TS module, extended style guide doc, and a
gallery preview HTML covering those 3 cases' 5 states each. Wait
for sign-off. Don't start Batch B until I send written approval.

Anything else, ask before authoring rather than after.

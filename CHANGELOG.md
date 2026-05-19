# Changelog

Format: one line per change, newest first.

## [Unreleased]

### Content: variceal UGIB (Kowalski) — Sepsis Six of the liver

- `content/cases/case_ugib_variceal_kowalski.yaml` — 12th authored
  case. Mr Kowalski, 54M, Child-Pugh C alcoholic cirrhotic, brought
  in with massive haematemesis after running out of propranolol.
  Grade 2 hepatic encephalopathy on arrival. The substrate makes a
  straightforward "haemorrhagic shock" presentation feel different:
  restrictive transfusion is the counterintuitive call.
- The teaching arc: ABCDE with SALAD-ready airway (DuCanto), GBS
  16 / Rockall ≥3, empirical terlipressin + ceftriaxone within the
  first hour, restrictive Hb 7–8 transfusion (Villanueva NEJM 2013),
  urgent OGD within 12 h.
- Six `must_not_do` traps that map to current evidence:
  1. Liberal transfusion to Hb 10 — worsens portal pressure
     (Villanueva NEJM 2013).
  2. **Routine TXA** in UGIB — HALT-IT (Lancet 2020) closed the door:
     no mortality benefit, increased VTE.
  3. Skipping ceftriaxone until OGD confirms variceal — one of the
     strongest evidence bases in hepatology (Cochrane 2010).
  4. Vitamin K for cirrhotic INR — synthetic failure, not vit-K
     deficiency.
  5. Pre-OGD high-dose PPI — not supported by NICE CG141.
  6. Routine "diagnostic" NG aspiration — not supported by NICE.
- Authored against **NICE CG141** (Acute upper GI bleeding in
  over-16s, 2016 update), **BSG/UK guidelines on variceal
  haemorrhage** (Tripathi 2015), **Villanueva NEJM 2013**
  (restrictive transfusion), **HALT-IT** (Roberts Lancet 2020 — no
  TXA), and **Chavez-Tapia Cochrane 2010** (ceftriaxone reduces
  all-cause mortality). Also Pabrinex + CIWA-Ar withdrawal planning
  per NICE CG100.
- `content/episodes/ep_ugib_solo.yaml` — 20-min single-case shift.
  T+2 GBS; T+4 VBG; T+8 housemate confirms variceal history; T+10
  rebleed beat (NEWS2 escalates to 9); T+12 bloods; T+15 endoscopy
  SpR call; T+18 deterioration deadline.
- New "Variceal UGIB — Sepsis Six of the liver" entry on the shift
  menu. App subtitle: 11 shifts, 12 cases.
- Inspiration: TheCase.Report S1E3. Player-facing citations remain
  NICE / BSG / NEJM / Lancet / Cochrane.
- 12 cases / 11 episodes / 2 arcs validate; 153 tests pass.

### Content: aortic dissection (Okafor) — the anchor-breaker

- `content/cases/case_aortic_dissection_okafor.yaml` — 11th
  authored case. Mr Okafor, 58M, sudden tearing interscapular pain,
  paramedic ECG shows inferior ST elevation in II/III/aVF (cath lab
  pre-alerted), troponin rises mildly. **Actually Type A AD with
  RCA-ostium involvement.** The SAQ-classic anchor-breaker.
- Bedside teaching arc: ADD-RS scoring (BP differential >20 mmHg,
  pulse deficit, new AR murmur, focal neuro of right arm), POCUS
  surfaces the intimal flap, CTA confirms Type A — ASCENDING aorta
  with proximal RCA dissection extension.
- Six `must_not_do` traps: escalate antiplatelet (aspirin was given
  pre-arrival), IV heparin, PCI activation, vasodilator before
  beta-blocker (reflex tachycardia → propagation), LP for the right-
  arm neuro signs, femoral central line (iliac extension risk).
- Authored against **RCEM Best Practice — Aortic Dissection 2023**,
  **ESC Guidelines for Aortic Diseases 2024**, IRAD registry (Hagan
  2000), Rogers 2011 ADD-RS, Nazerian 2018 ADvISED, and the Aortic
  Dissection Charitable Trust's Think Aorta UK pathway. Mortality
  figure (~1–2% per untreated hour) traces to IRAD via
  TheCase.Report S2E5.
- `content/episodes/ep_dissection_solo.yaml` — 20-min single-case
  shift. T+2 cardiology SpR pressing for STEMI activation; T+5
  POCUS flap; T+6 CXR; T+11 CTA confirmation; T+12 troponin (the
  anchor); T+15 wife arrives; T+20 deterioration deadline.
- Pairs thematically with `case_chest_pain_patel_ambient` (real
  STEMI in a 72-y/o) — same presenting symptom, opposite diagnosis.
- New "Aortic dissection — the anchor-breaker" entry on the shift
  menu. App subtitle bumped to "10 shifts, 11 cases".
- 11 cases / 10 episodes / 2 arcs validate; 150 tests pass.

### TheCase.Report integration — index + verification patches + topic backlog

The user owns TheCase.Report (Irish EM podcast, IEMTA + IAEM-produced)
and asked me to pull from it. Pulled the full episode archive (~64
episodes across S1–S6) and deep-read 10 strategic episodes for both
verification against existing Skitt cases AND case-authoring backlog.

- **New `content/sources/tcr-podcast.md`** — full episode index by
  season, deep-read clinical pearls (aortic dissection, posterior
  stroke, paeds seizures, delirium, TCA OD, UGIB, chest trauma,
  hypertensive emergency, VTE, perimortem CS), and the
  cross-reference table between TCR episodes and existing Skitt
  cases. **Authoring rule preserved:** Skitt cases continue to cite
  the source-of-truth UK guideline that TCR itself references (NICE,
  RCEM, Resus Council UK, etc.); TCR is acknowledged as inspiration
  in `content/sources/tcr-podcast.md`, NOT in case YAMLs.
- **Verification patches** to existing cases driven by TCR pearls:
  - `case_stroke_acute_williams`: pearl added that FAST misses ~50%
    of posterior-circulation strokes; HINTS for acute vestibular
    syndrome. Frames Williams as the anterior-stroke teaching point.
  - `case_sepsis_uti_morrison`: new `ix_4at` bedside investigation
    (4AT delirium screen), plus pearls on hypoactive delirium being
    most-missed and urine-dipstick interpretation caution in older
    adults.
  - `case_chest_pain_patel_ambient`: pearl added on AD mortality
    (~1–2% per hour untreated), 20% normal CXR, 6% painless — the
    must-not-miss aortic dissection narrative.
- **Topic backlog**: added 11 TCR-derived topics to
  `content/topic-map.yaml` (upper_gi_bleed, acute_heart_failure,
  hypertensive_emergency, tca_overdose, perimortem_caesarean,
  posterior_circulation_stroke, delirium_geriatric,
  chest_trauma_blunt, liver_cirrhosis_decompensated, nof_geriatric,
  hypothermia_drowning). All now show up in `pnpm new-case --list`
  and can be scaffolded directly.

10 cases / 9 episodes / 2 arcs validate; 147 tests pass.

### Simplify pass: shared ClockBar, lookup tables, CSS variable

Driven by three parallel review agents (reuse / quality / efficiency).
Net **−189 lines** across 7 files.

- **Extract `ClockBar` to `src/ui/shift/ClockBar.tsx`** — was
  triplicated near-verbatim across `EncounterScreen.tsx`,
  `ShiftBoardScreen.tsx`, and `ShiftHubScreen.tsx`. Each ARIA
  progressbar attribute I'd just added had to be added three times.
  Now one component, three consumers. SpeedSelect helper moved
  alongside.
- **`savedShiftTitle()`** was calling `KNOWN_SHIFTS[id]()` on every
  MenuView render with a saved shift — re-parsing 1–3 YAML docs
  through Zod just to read `episode.title`. Replaced with a static
  `SHIFT_TITLES` map.
- **App subtitle 3-way ternary → `SUBTITLES[view]` lookup table.**
- **`pickCardClass()` helper** unifies the `enc__card`/`is-revealed`/
  `--correct`/`--wrong` className concatenation that DifferentialPhase
  and DispositionPhase were both doing inline.
- **`checkRevealRef()` helper** replaces the four
  `if (reveal.on === 'X' && !refCase.data.Y.some(...))` blocks in
  validator.ts with a single switch.
- **`--danger-strong: #b94434` CSS variable** replaces four
  occurrences of the hard-coded red across the chip / red-flag
  border / wrong-card border / wrong-card gradient.
- **PhaseProgress nested-ternary** → derive `status` once
  (`'active' | 'done' | 'pending'`), use as className suffix.
- **Test parse hoist**: `tests/case-playable.test.ts` now parses each
  case YAML once (was twice — once per `it.each` block).

All 147 tests pass; production build green.

### Validator: cross-check action / investigation / history ids

The content validator was already checking `case_id` and `arc_id`
references but skipping the inner ids (which had occasionally drifted
during authoring). Extended `validateContent` to also verify:

- `results_back.investigation_id` and `lab_callback.investigation_id`
  exist on the referenced case's investigations.
- `deterioration_if_not_x_by_t.required_action_ids` exist on the
  referenced case's management.
- Arc reveal triggers (`action`, `history_asked`, `investigation_back`,
  `examined`) point at real ids on the referenced case.
- Arc `effect.unlocks_history_id` points at a real history item.

Plus three new unit tests in `tests/validator.test.ts` that
synthesise tiny YAML fixtures with each kind of broken reference and
assert the validator catches them. All 10 authored cases + 9
episodes + 2 arcs already pass under the stricter check.

Test count: 144 → 147.

### Content: DOAC double-bill — 2-case thematic shift

- `content/episodes/ep_doac_double.yaml` — 20-min 2-case shift
  pairing existing cases (no new clinical content): Williams
  (ischaemic LVO on apixaban) + Brennan (SDH on apixaban). Both
  patients on the same DOAC, opposite ends of the emergency
  spectrum.
- Pedagogical arc lives in the contrast: reperfusion vs reversal,
  preserve-anticoag vs hold-anticoag, alteplase contraindicated
  within 48 h of last apixaban dose vs andexanet alfa for
  uncontrolled bleeding.
- Schedule is back-loaded to force prioritisation: Williams CT at
  T+8 is the thrombolysis-decision moment; Brennan CT at T+13 is
  the SDH pivot; anti-Xa lab callback at T+14 surfaces the actual
  apixaban level (INR/APTT don't measure DOAC effect).
- Both patients have a relative pushing for the wrong answer
  (Carol wanting clot-buster, Brennan's son wanting safety-net
  discharge) — narrative pressure from different angles.
- New "DOAC double-bill — clot and bleed" entry on the shift menu.
  Difficulty band ST3 (parallel time-critical pathways).
- No new case YAML; this leverages the existing Williams + Brennan
  content. 10 cases / 9 episodes / 2 arcs validate. 144 tests pass.

### UX: stop revealing answers in differential + disposition pickers

The differential and disposition pickers were displaying the
`likelihood` chip ("top" / "must-not-miss") and the disposition
`criteria` text upfront, which is the answer key — the player could
just pick whichever option was labelled "top" or whose criteria
explicitly said "→ admit HDU". That breaks the assessment.

- **Differential**: likelihood chip is now hidden until the player
  picks their working diagnosis. After pick, the chip appears on
  every option, plus a green "correct" border on the `top` option
  and a red "wrong" border if the picked one isn't `top`.
- **Disposition**: criteria body text is now hidden until the player
  picks. After pick, criteria appears on every option with an
  `appropriate` / `inappropriate` chip, green border on
  `appropriate: true`, red on picked-but-`appropriate: false`.
- Player can still change their pick before the "see debrief"
  button — but they make the first pick blind, which is the test.

### UX: surface `red_flag` exam findings + backfill across cases

- Schema: `ExamFinding.red_flag` was already a documented field but
  unused by the UI. Wired into `ExaminationPhase`: red-flag rows now
  carry an "⚠ red flag" chip and a left-border accent so critical
  findings (stridor, NIHSS, GCS drop, hypotension, Kussmaul
  breathing) jump off the page when revealed.
- Backfilled `red_flag: true` on the most diagnostically important
  findings in Beth, Williams, Morrison, and Marcus. Combined with the
  two new cases (Priya status, Brennan head injury) that already used
  the field, all 10 cases now demonstrate red-flag rendering.
- WCAG contrast: red-flag chip uses the same `#b94434` red as the
  arrested/deceased state chip (≈5:1 on white).

### A11y: reduced-motion + WCAG-AA contrast + ARIA progressbar

- `@media (prefers-reduced-motion: reduce)` collapses all animations
  and transitions for users who set the OS-level preference. Targets
  the existing clock-bar `width` transition and any future motion.
- Darkened the "arrested / deceased" state chip background from
  `--danger` (#d96b5c → 3.2:1 on white) to `#b94434` (≈5:1 on white)
  to clear WCAG AA for normal-size text.
- Encounter clock bar in all three views (encounter, shift board,
  hub) now exposes ARIA `role="progressbar"` with `aria-valuenow` /
  `aria-valuemin` / `aria-valuemax` / `aria-label` so screen readers
  announce shift time as it advances.
- `<ol>` phase progress now has `aria-label="Encounter phase N of M"`;
  the active `<li>` carries `aria-current="step"` and the numeric
  prefix is hidden from assistive tech (`aria-hidden`) since the
  label text already conveys position.

### Content: head injury solo with DOAC reasoning

- `content/cases/case_head_injury_doac_brennan.yaml` — 78y/o Mrs
  Brennan, mechanical fall on apixaban, GCS 15 on arrival but the
  son is pushing for discharge. The teaching arc forces the player
  to apply the NICE NG232 anticoagulant-mandate rule (CT within 8 h
  regardless of GCS) and then choose the correct DOAC reversal
  pathway after CT shows a small frontal SDH.
- Five `must_not_do` traps: safety-net home with leaflet; skip CT on
  GCS 15; vitamin K + FFP "reversal" (warfarin not DOAC); aspirin
  bridging the held apixaban; skipping the lying-standing BP /
  cause-of-fall workup.
- Includes the **apixaban-calibrated anti-Xa** investigation to
  teach that INR / PT / APTT do NOT measure DOAC effect.
- Authored against NICE NG232 (2023), NICE TA697 (andexanet alfa),
  British Society for Haematology DOAC Reversal 2024, and the
  Canadian C-spine Rule (Stiell 2001).
- `content/episodes/ep_head_injury_doac.yaml` — 20-min single-case
  shift. T+5 son arrives with disposition pressure; T+8 bloods;
  T+10 lying-standing BP; T+12 CT head + CT C-spine return; T+13
  anti-Xa; T+18 bed-manager pressure. Deterioration deadline at
  T+25 if no CT + no apixaban-hold.
- Pairs thematically with `case_stroke_acute_williams` (ischaemic
  LVO on apixaban) — together they cover both ends of the
  DOAC-on-board emergency spectrum.
- New "Head injury — DOAC reasoning" entry on the shift menu.
- 10 cases / 8 episodes / 2 arcs validate. 124 tests pass.

### Content: status epilepticus solo with SAH twist

- `content/cases/case_status_epilepticus_priya.yaml` — 28y/o Priya
  Sharma, in active tonic-clonic on arrival, paramedics already gave
  one dose of IV lorazepam. Scaffolded by `pnpm new-case --topic
status_epilepticus` then authored against:
  - **NICE NG217** (2022 update — IV levetiracetam preferred over
    phenytoin as 2nd-line after the EcLiPSE / ESETT trials)
  - **Resuscitation Council UK ALS**
  - **RCEM Best Practice — First Seizure (2024)**
  - **MHRA Valproate Pregnancy Prevention Programme (2024)**
  - **RCOG Green-top 10A** — magnesium for eclampsia
- The twist stack: (1) urine βhCG comes back POSITIVE — valproate is
  forbidden in pregnancy, locking in levetiracetam as 2nd-line;
  (2) CT head returns at T+15 with subarachnoid haemorrhage — the
  preceding 3-day "thunderclap-pattern" headache and the
  first-seizure-of-life rule pivot the working diagnosis from
  idiopathic-epilepsy to SAH. Player must then call neurosurgery +
  obstetrics + anaesthetics simultaneously.
- Five `must_not_do` traps: third benzodiazepine dose (NICE NG217
  caps at 2); IV valproate (MHRA PPP); IV diazepam (lorazepam
  preferred in-hospital); ED-bedside intubation without anaesthetics;
  LP before CT in raised-ICP / active seizure.
- `content/episodes/ep_seizure_solo.yaml` — 20-min single-case shift.
  T+5 second-benzo deadline; T+8 βhCG result; T+11 flatmate arrives
  in relatives' room; T+12 anaesthetic-escalation deadline; T+15 CT
  result with the SAH pivot; T+16 bed-manager pressure.
- New "First seizure — status pathway" entry on the shift menu.
- 9 cases / 7 episodes / 2 arcs validate. 123 / 123 tests pass.

### Audit: clinical accuracy + narrative coherence pass

Driven by a content-audit subagent over all 8 authored cases / 6
episodes / 2 arcs. Each fix calls out the source-of-truth UK guideline.

- **Beth (anaphylaxis adult)** — split nebuliser drug entry: salbutamol
  back-to-back / 15–30 minutely, ipratropium 500 mcg every 4–6 h (was
  incorrectly "every 20 min" for the combined entry, BTS/SIGN 158).
- **Beth (anaphylaxis adult)** — `hx_partner` now actually mentions
  Beth's 8-year-old brother Sam. The `arc_family_peanut_party` reveal
  is gated on this history item; previously Tom's response only
  mentioned Sarah, so the arc reveal carried no narrative payload.
- **Marcus (DKA)** — JBDS-IP 2023 severity threshold updated to
  `pH <7.1` (was `≤7.00`), in result_summary, differential
  discriminator, and disposition criteria.
- **Mrs Morrison (sepsis/UTI)** — Creat 142 / baseline 70 = 2.03×
  = **AKI Stage 2** per KDIGO (was labelled Stage 1), corrected in
  result_summary and the NSAID trap.
- **Mr Williams (stroke)** — Re-attributed door-to-CT 25 min and
  door-to-needle 60 min targets to the RCP National Clinical Guideline
  for Stroke 2023 / SSNAP audit standards. NICE NG128 says "CT
  immediately, within 1 hour"; the 25/60-min targets are RCP/SSNAP.
- **Stan (intox + hypo)** — re-worded the Pabrinex pearl: in
  life-threatening hypoglycaemia, IV glucose is given FIRST; Pabrinex
  follows promptly (concurrent or immediately after) per NICE CG100.
  Previously the pearl was over-strong ("before glucose if at all
  feasible") which conflicts with safe hypo treatment.
- **Sam (paeds anaphylaxis)** — paeds nebulised salbutamol +
  ipratropium dose detail split same as the adult fix; pearl added
  explaining Sam's 5-h gap between mild lip reaction (settled with
  cetirizine) and systemic wheeze is best described as a "protracted /
  delayed" presentation rather than classic biphasic.
- **Sam (paeds anaphylaxis)** — `mx_oxygen_paeds.route` changed from
  `NEB` (semantically wrong — that's nebuliser) to `other` with the
  delivery device named in the frequency string.
- **Mrs Patel (STEMI)** — added inline sources to `mx_dual_antiplatelet`
  (NICE NG185 / ESC STEMI 2023) and `mx_pain_oxygen_glucose` (NICE
  NG185 + BTS Emergency Oxygen Guideline 2017 + AVOID trial citation).
- **Stub case removed**: `case_minor_laceration_ambient.yaml` was a
  schema-exercise sample left over from Milestone 8 ("clinical content
  not authored"). Not referenced by any episode. Removed to keep the
  content directory authored-only — the `pnpm new-case --topic` CLI
  remains the way to scaffold new cases. Content footprint is now
  **8 fully-authored cases**.

### Content: acute stroke (Williams) + stroke-solo shift

- `content/cases/case_stroke_acute_williams.yaml` — 67y/o, witnessed
  onset 37 min ago, right-sided weakness + non-fluent dysphasia,
  FAST+, ROSIER 4, NIHSS 14, on apixaban for AF. CT shows hyperdense
  MCA sign in the L MCA territory; CTA confirms M1 occlusion (LVO).
  Scaffolded by `pnpm new-case --topic stroke_tia` then authored
  against NICE NG128 (2019, updated 2022), RCP National Clinical
  Guideline for Stroke 2023, and Oxford Handbook of EM 5e Ch 3. Five
  `must_not_do` traps:
  1. Alteplase without checking DOAC timing (apixaban within 48 h
     is a relative contraindication).
  2. Aggressive BP lowering to <140/90 pre-reperfusion.
  3. 300 mg aspirin immediately (before CT, before thrombolysis
     decision).
  4. Resuming home apixaban this morning.
  5. Sedating to facilitate transfer to CT.
     Headline learning: anticoagulated LVO patient → thrombectomy is
     the preferred reperfusion path.
- `content/episodes/ep_stroke_solo.yaml` — 20-min single-case shift.
  T+8 CT results, T+11 CTA results, T+12 deterioration if no CT and
  no stroke-team activation, T+5 wife arrives, T+14 bed pressure.
- New "Stroke onset — thrombolysis window" entry on the shift menu.

### Polish: replay button + topic-map cleanup

- Episode debrief gets a "↻ play this shift again" button alongside
  "← back to menu". Replay destroys the current kernel, clears the
  save, and starts a fresh kernel for the same episode. Uses the
  existing `KNOWN_SHIFTS` registry — works for any registered shift.
- Topic-map cleanup: every `nice` citation now has both `id` (matching
  the NICE id regex) and `ref` (the canonical guideline title).
  Cleans up NG39 / NG40 / NG217 / NG10 / CG89 / NG143 entries that
  previously embedded the title inside `id`. Skeletons generated by
  `pnpm new-case` from these topics now produce valid Case YAML on
  the first run.

### Content: paeds anaphylaxis (Sam) + family-anaphylaxis shift

- Upgrade `content/cases/case_anaphylaxis_paeds_sibling.yaml` from
  the M2 skeleton to a fully-authored paeds case. Sam Cartwright,
  8y/o, brother of Beth from the hen-do shift. Mum saw Beth's
  hospitalisation on the family WhatsApp and connected it to Sam's
  lip-swelling-after-lunch earlier in the day. Authored against
  Resus Council UK 2021 paediatric algorithm, NICE CG134, BTS/SIGN
  158 (paediatric nebuliser doses), and APLS principles.
  - 6 history items (paramedic, mum's timeline, previous reactions,
    asthma history, asking Sam directly, pre-anaesthesia screen).
  - PAT (Paediatric Assessment Triangle) included as an explicit
    examination system.
  - 11 management actions including paeds IM adrenaline at 300 mcg
    (the dose-band trap is the headline pearl), 10 mL/kg fluid bolus
    (not the adult 500–1000 mL), salbutamol nebs as adjunct,
    paeds-team + paeds-anaesthetics escalation.
  - 5 must_not_do traps: adult 500 mcg dose in a child, IV chlorphenamine
    first-line, salbutamol-only as asthma, discharge after short obs
    without auto-injector, IV adrenaline bolus while still responding
    to IM.
- Upgrade `content/episodes/ep_birthday_party.yaml` (M2 sample) to a
  fully-authored 2-case family-anaphylaxis shift. Beth + Sam,
  arc_family_peanut_party connecting them. Sam arrives at T+8;
  Beth deteriorates at T+5 without adrenaline; Sam deteriorates at
  T+15 without further adrenaline AND oxygen.
- Rewrite `content/arcs/arc_family_peanut_party.yaml` to use the new
  `history_asked` reveal trigger (asking Beth's `hx_partner`) plus a
  T+7 clock-time fallback that primes the paeds team before Sam
  arrives.
- New "Family anaphylaxis — adult + paeds" entry on the shift menu.

### Content: new-onset DKA case + overnight metabolic shift

- `content/cases/case_dka_marcus.yaml` — 19y/o engineering student with
  3-day vomiting + polyuria + weight loss, GCS 13, Kussmaul breathing,
  BM "HI". First-presentation T1DM with severe DKA (pH 7.04, HCO3 7,
  ketones 5.6, anion gap 23). Scaffolded by `pnpm new-case --topic
dka_adult` then authored against JBDS-IP Adult DKA 2023, NICE NG17,
  RCEM Best Practice and Oxford Handbook 5e Ch 3. Five `must_not_do`
  traps: insulin bolus before FRII; bicarbonate to "correct" the
  acidosis; stopping insulin when glucose falls (instead of adding
  dextrose); oral rehydration alone; potassium in the first bag.
- `content/episodes/ep_overnight_metabolic.yaml` — 2-case 20-min
  overnight shift pairing Marcus (DKA, deteriorates at T+15 without
  fluids AND insulin) and Mrs Morrison (urosepsis, deteriorates at T+10
  without antibiotics AND fluids). Two competing time-critical bundles
  in resus, no arc — pure prioritisation pressure.
- New "Overnight: metabolic resus" entry on the shift menu.
- 8 cases / 5 episodes / 2 arcs validate. 122 / 122 tests pass.

### Hub → encounter wire-up (diegetic UI)

- Schema (`src/content/schema.ts`): new optional `bay` field on Case
  — enum `resus | majors | minors | paeds | relatives | ambulatory |
triage`. All seven authored cases tagged with a bay inferred from
  the vignette.
- `src/game/scenes/EDScene.ts` rewritten to accept `EDSceneData`
  (`patients`, `clockLabel`, `onCaseClick`) via Phaser's `init()`
  hook. Patient cards render inside their bay, colour-coded by
  state, with a pulse tween on `deteriorating` and `arrested`.
  Card click fires `onCaseClick(caseId)`.
- `src/game/boot.ts` takes `BootOptions { parent, sceneData }` and
  starts the ED scene with the data.
- `src/ui/PhaserGame.tsx` now accepts a `sceneData` prop; on prop
  change it calls `game.scene.start('ed', data)` to re-render the
  bay layout.
- New `src/ui/shift/ShiftHubScreen.tsx` — the department-view mode
  that mounts PhaserGame, watches the kernel via `tick`, and routes
  patient clicks back to `kernel.enterCase()` + the shift's
  encounter flow.
- `ShiftView` gains a `'hub'` mode and a "↥ department view" toggle
  on the shift board. From the hub you can return with "↥ board
  view". Clock controls and shift log mirror across both views.
- Tests: 3 new schema tests (`bay` validation) + 8 hub tests
  asserting every authored case has a valid bay. 121 / 121 total
  passing. All gates green.

### Polish: better next labels + Escape returns to board

- Encounter "next →" buttons now show the next phase name —
  e.g. "next: history →", "next: examination →" — so the player
  always knows where they're going.
- Escape key in an encounter returns to the shift board (skipped if
  focus is on a form control). Pairs with the spacebar pause shortcut
  added previously.

### Content: sepsis case + sepsis-solo shift

- New `content/cases/case_sepsis_uti_morrison.yaml` — 72y/o nursing-
  home resident with overnight confusion + fever + AKI; urosepsis
  with evolving septic shock. Scaffolded by `pnpm new-case
--topic sepsis_adult` and then authored end-to-end against NICE
  NG51, RCEM Best Practice — Septic Patient, NEWS2 (RCP), and
  Sepsis-3 (Singer 2016). NEWS2 7, qSOFA 2, lactate 3.2. Five
  `must_not_do` traps including the textbook _"wait for cultures
  before antibiotics"_, NSAIDs in AKI, oral trimethoprim in shock,
  routine hydrocortisone before vasopressor trial, and re-litigating
  a documented DNACPR at the bedside.
- New `content/episodes/ep_overnight_sepsis_solo.yaml` — 20-min
  single-case shift. T+10 deterioration window (must give IV
  antibiotics AND fluids), T+6 lactate result, T+12 family arrives,
  T+14 bed-manager pressure.
- New "Overnight: sepsis solo" entry on the shift menu.
- Validates the new-case → new-episode → playable shift round trip.
  Demonstrates the M7 content CLI in real use.

### UX quality (speed control · spacebar pause · ARIA live log)

- Sim speed selector: 0.5× / 1× / 2× / 4× available in both the shift
  board and the encounter clock-control bars. 1× (default) is 20-min
  shift in 60 real-seconds; 4× is 15 real-seconds for testing; 0.5×
  is more humane for first-time players. Persists in localStorage as
  `theSkitt.speed.v1`.
- Spacebar toggles play/pause when not focused on a form control.
  Buttons get a `title` attribute reflecting the shortcut.
- Shift log gets an `aria-live="polite"` channel announcing the latest
  log entry to screen readers (visually-hidden, so it doesn't affect
  layout).
- Add `.visually-hidden` utility class.

### Save / resume (localStorage)

- Kernel gains `serialize()` returning a `SerializedKernelSnapshot`
  (versioned, JSON-safe — Maps and Sets converted to arrays) and a
  `restore?: SerializedKernelSnapshot` option on construction. Episode
  identity is checked on restore so a snapshot can't be applied to the
  wrong shift.
- `src/state/sim.ts` adds `saveShift`, `loadShift`, `clearSavedShift`
  helpers backed by `localStorage` under key `theSkitt.shift.v1`.
- `useSim.init` auto-saves on every kernel notification — every player
  action, every clock tick. Closing the tab or hard-refreshing during
  a shift no longer loses state.
- App menu shows a "Shift in progress" banner with **Resume** /
  **Discard** buttons when a saved shift is detected. Starting a new
  shift clears the previous save.
- Tests (`tests/save-restore.test.ts`, 4 tests): round-trip a clean
  snapshot, preserve actions/asked/ix/arc-reveals across restore,
  restored kernel continues advancing deterministically, throws on
  episode mismatch. 111 / 111 tests passing.

### Post-milestone polish (perf · CI · a11y · mobile · E2E)

- Add Playwright end-to-end smoke (the build-prompt M1 deliverable
  deferred until interactions existed). `e2e/hendo-shift.spec.ts`
  boots the production preview, navigates menu → hen-do shift → shift
  board → Beth's encounter and back to board, and asserts both Focus
  and Ambient sections render. New `npm run test:e2e`.
- CI now also installs Chromium and runs the E2E after build, with a
  failure-time `playwright-report` artifact upload.

- Code-split Phaser. `src/game/boot.ts` exports `bootGame(parent)` and
  is dynamically imported by `src/ui/PhaserGame.tsx` only when the
  player opens the ED hub. **Initial JS chunk drops from ~1.9 MB to
  ~479 KB (gzip 145 KB).** Phaser ships in a separate `boot-*.js`
  chunk that downloads on demand.
- Add `.github/workflows/ci.yml` — GitHub Actions workflow that runs
  on PRs and pushes to main: typecheck → lint → format check →
  validate-content → unit tests → prod build. Concurrency-cancel on
  same-branch updates. Reads Node version from `.nvmrc`.
- Accessibility: global `:focus-visible` outline (accent colour),
  larger default button `min-height: 36px`, focus styles on inputs
  and links. Phaser load-failure path now renders a visible
  `role="alert"` fallback instead of a silent blank.
- Mobile: tighter breakpoints at 600 px — header collapses, footer
  wraps, encounter padding shrinks, phase-progress strip becomes
  number-only with the active label visible, clock-control row goes
  vertical, encounter card hit areas grow to 48 px minimum.

### Milestone 8 — Ambient board pressure (stretch)

- Author two ambient cases for the hen-do shift:
  - `case_intox_stan_ambient.yaml` — 58y/o frequent flyer, smells of
    alcohol, looks like "the usual". Underneath: hypoglycaemia
    (BM 2.4) + witnessed head injury → CT head indication per NICE
    NG232 (GCS <13 within 1 h). Trap: anchoring on alcohol.
    Authored against NICE NG232, NICE CG100, TREND-UK hypoglycaemia,
    RCEM Best Practice and Oxford Handbook 5e Ch 14. Three
    `must_not_do` traps (leave in side room, oral glucose with
    reduced GCS, missing head injury workup).
  - `case_chest_pain_patel_ambient.yaml` — 72y/o stoic woman in the
    waiting room, daughter says "it's just indigestion".
    Anterior STEMI hiding behind family framing. Authored against
    NICE NG185 with the 10-minute ECG target, 300 mg aspirin load,
    primary PCI pathway, oxygen-only-if-SpO2-<94% rule. Three
    `must_not_do` traps (routine oxygen, default thrombolysis
    without PCI discussion, discharge as reflux).
- Wire both ambient cases into `ep_hendo_shift.yaml` with four new
  scheduled events:
  - T+8 Mrs Patel NEWS2 escalation
  - T+10 Stan NEWS2 escalation
  - T+14 Mrs Patel arrest if no ECG + no aspirin
  - T+15 Stan arrest if no BM check + no dextrose
    → four time-critical mechanics on one 20-minute clock, in addition
    to Beth's T+5 and Sarah's T+16 events.
- `scoreEpisode` now splits the report into `cases` (focus) and
  `ambientCases`. Ambient deaths count as lives lost, ambient bands
  count toward `unsafeCases`. The percent and band aggregation
  includes both case sets.
- UI: shift board now renders **Focus cases** and **Ambient board**
  as separate sections with distinct heading hierarchy and a subtle
  `ambient` tag on each ambient card. Ambient cards dim when stable
  and reset to full opacity when deteriorating or arrested.
- Episode debrief panels both focus and ambient cases in their own
  sections (same per-case card UI).
- Tests (`tests/ambient.test.ts`, 7 tests): ambient cases listed in
  episode, Stan arrests-if-neglected, Stan-saved-if-actioned, Mrs
  Patel arrests-if-neglected, Mrs Patel-saved-if-actioned,
  `scoreEpisode` separates the two groups, ambient deaths count as
  lives lost.
- **107 / 107** tests passing. All gates green.

### Milestone 7 — Content ingestion CLI

- Add `scripts/new-case.ts` (`pnpm new-case`) — generates a Case YAML
  skeleton for a topic from `content/topic-map.yaml`. Pre-fills
  `curriculum_tags`, `slos` (converting `SLO1..SLO12` → integers),
  `paeds`, and a complete `sources` block from the topic entry, so
  authors don't re-look-up the same citations.
  - `--list` lists topics grouped by tier with their labels and paeds
    flags.
  - `--topic <id>` (required to write) plus optional `--id <case_id>`,
    `--title`, `--paeds`, `--difficulty <CT1..ST6>`, `--triage <1-5>`.
  - Refuses to overwrite an existing file.
  - Skeleton has every Case-schema-required field with `# TODO`
    placeholders; runs the validator after writing.
- Add `scripts/new-episode.ts` (`pnpm new-episode`) — generates an
  Episode YAML skeleton wrapping existing cases. Verifies that
  referenced case/arc ids exist on disk before writing. Pre-populates
  one `deterioration_if_not_x_by_t` event per focus case at `T+5 + 4i`
  so the author has a "patient deteriorates if you don't act"
  scaffold to edit. Aggregates `curriculum_tags` from the referenced
  cases. Episode-id prefix enforced (`ep_*`).
- Both scripts surface clear errors and a `--help` flag.
- Tests (`tests/new-scripts.test.ts`, 8 tests): topic list, refuse
  unknown topic, write valid Case YAML, inherit tags/SLOs/sources,
  refuse overwrite, refuse unknown case refs in episode, write valid
  Episode YAML, enforce `ep_*` prefix. End-to-end against the real
  topic-map.yaml and the real case files — proves the round trip.
- 100 / 100 tests passing. All gates green.

### Milestone 6 — Episode-level debrief & scoring

- Add `scoreEpisode(KernelState) → EpisodeReport` in `src/state/sim.ts`:
  - Per-case reports (final state, curriculum tags, SLOs, per-case score, attended flag).
  - Per-arc reports (revealed bool, reveal-time, effects applied).
  - Aggregates: lives saved, lives lost, unsafe-band count, per-case
    average %, and an overall % (average minus 25 pp per dead patient).
  - Overall band downgrades to `unsafe` if any case is unsafe or any
    patient died, matching the per-case rule.
  - Auto-generates `examinerNotes` ("must-do missed", "patient-safety
    trap picked", "arc never revealed", "textbook performance against
    the guideline", etc.) so the debrief reads like a structured SAQ
    examiner critique.
  - De-duplicates source citations across cases.
- Add `src/ui/shift/EpisodeDebriefScreen.tsx` — banded overall score
  card, per-case outcome cards (state chip + score band + must-do hit
  rate + working-dx and disposition correctness + attended flag), arc
  panel showing reveal status and time, examiner notes, aggregated
  sources, study-tool disclaimer.
- `ShiftView` now routes to the episode debrief either automatically
  when the shift clock ends or manually via a new "End shift — debrief"
  button on the shift board. The button is enabled once every focus
  case has been at least attended; the label switches to "End shift
  early" if not all dispositioned.
- Tests (`tests/episode-debrief.test.ts`, 5 tests): excellent band for
  a perfect two-case run; unsafe band + lives-lost count when both
  cases neglected; unrevealed arcs surfaced in examiner notes;
  source de-duplication across cases; `attended=false` for cases the
  player never entered.
- 92 / 92 tests passing. Typecheck, lint, format, validator
  (4 cases / 3 episodes / 2 arcs), prod build all green.

### Milestone 5 — Second case + first intersecting arc

- Author `content/cases/case_ectopic_minors_sarah.yaml` — Sarah Mendez, 30,
  7+0 weeks pregnant, walks in from the relatives' room with cramping LIF
  pain and PV spotting. **Deliberately different shape** from Beth:
  obstetric system, low triage (cat 3), deceptively well at presentation,
  but time-critical (ruptured tubal ectopic). Authored end-to-end against
  NICE NG126 (Ectopic pregnancy and miscarriage, 2019, updated 2023) and
  RCOG Green-top 21 (Tubal Ectopic Pregnancy, 2016). Every clinical claim
  cited inline. Four `must_not_do` examiner traps (ED methotrexate,
  discharge with safety-net, ED bimanual pelvic exam, NSAIDs in early
  pregnancy with bleeding).
- Author `content/arcs/arc_hendo_dinner.yaml` — first intersecting arc.
  Beth and Sarah are friends from the same hen-do dinner. Three reveal
  triggers (primary: asking Beth's `hx_partner`; backup: asking Sarah's
  gated `hx_friend_in_resus`; fallback: T+9 clock-time). Effects: unlocks
  two history items on Sarah's case (`hx_friend_in_resus`,
  `hx_pain_started_earlier`) — triangulating across cases unlocks a
  longer pain history that changes the timeline.
- Author `content/episodes/ep_hendo_shift.yaml` — 20-min, 2 focus cases,
  1 arc, 6 scheduled events. Two time-critical mechanics on one clock:
  T+5 deterioration for Beth (no adrenaline → arrest) and T+16
  deterioration for Sarah (no βhCG / no gynae referral → ruptured
  ectopic → arrest).
- Schema (`src/content/schema.ts`): add `history_asked` and `examined`
  variants to the `ArcRevealTrigger` discriminated union so arcs can
  reveal on history-question or system-examined events. Export
  `ArcRevealTriggerT` and `ArcEffectT` types.
- Kernel (`src/sim/kernel.ts`): accept `arcs: Map<string, ArcT>` in
  constructor; track `revealedArcIds` and unlocked history/finding ids
  per `CaseRuntime`; new `checkAllArcReveals()` runs after every player
  action and every tick advance; `revealArc()` applies all effects
  (unlocks_history_id / unlocks_finding_id / changes_state_to); new
  `new_arrival` event transitions `unseen → triaged` so the case
  appears on the board at the scheduled time. Arc reveals are
  idempotent and logged at `warn` level.
- UI: new `src/ui/shift/ShiftView.tsx` parent that owns the real-time
  clock loop and routes between board and encounter, plus
  `src/ui/shift/ShiftBoardScreen.tsx` rendering case cards (with state
  chip, pending/resulted ix counts, working-dx preview) and the live
  shift log. `EncounterScreen` now takes `phase` and `onPhaseChange`
  as props (state lifted to ShiftView so each case remembers where the
  player left off), adds a `← board` button, and gates locked history
  items with a `new` chip when unlocked by an arc reveal.
- App routing: menu now shows three shift options — the new "Hen-do"
  shift (M5), the "Anaphylaxis solo" shift (M4), and the ED hub preview
  (M1).
- Tests (`tests/arcs.test.ts`, 7 tests): reveal-via-history-question,
  reveal-via-clock-fallback, history unlock effects applied to Sarah's
  case, idempotent reveal, new-arrival → triaged, both-deterioration-
  events on one clock, and the save-both happy path. Total **87 / 87**
  passing.
- All gates green: typecheck, ESLint, Prettier, validator (4 cases /
  3 episodes / 2 arcs), prod build, dev server boots and serves the
  new YAMLs.

### Milestone 4 — Simulation kernel + episode shell on a shift clock

- Add `src/sim/kernel.ts` — a pure, deterministic `SimKernel` class. Owns
  `clockMin`, `unfiredEvents` (priority-sorted), `firedEventIds`, and
  per-case `CaseRuntime` (state, actions, asked, examined, ordered,
  resulted, workingDx, disposition, reasons, enteredAt). Public API:
  `advance(deltaMin)`, `start()`, `pause()`, `enterCase()`,
  `toggleAction()`, `recordAsk()`, `recordExamine()`,
  `orderInvestigation()`, `setWorkingDx()`, `setDisposition()`,
  `subscribe()`. No React, no Phaser, no Zustand inside.
- Per-tick the kernel: fires due scheduled events in order → checks
  every case's transitions (`action`, `finding`, `elapsed_min`,
  `inaction_by`, `scheduled_event`) → resolves any ordered
  investigations whose `turnaround_min` has elapsed → logs.
- Add `src/state/sim.ts` — `useSim` Zustand store wrapping a kernel
  reference with a `tick` counter to force component re-render; pure
  `scoreCase` function (replaces the old per-store `scoreEncounter`);
  `useRealTimeClock` rAF hook that drives `kernel.advance(whole minutes)`
  at a configurable speed (default 1 sim-min / 3 real-sec → 20-min
  shift in 60 real-sec).
- Replace `src/state/encounter.ts` and `src/content/runtime.ts` with the
  kernel-backed equivalents. Delete the old store.
- Rewrite `src/ui/encounter/EncounterScreen.tsx` against the kernel:
  - Header now includes a state chip (stable / deteriorating / arrested
    / admitted / discharged colour-coded).
  - New clock bar with shift progress, ▶ start / ❚❚ pause / +1 m skip
    controls.
  - Right sidebar: live shift log (info / warn / danger entries) from
    the kernel, reverse-chronological.
  - Investigations show order time and pending countdown; result reveals
    when `turnaround_min` has elapsed (or a scheduled `results_back`
    event fires).
  - Debrief gains a "what changed on the clock" section reading the
    kernel's `reasons` log per case.
- Add `content/episodes/ep_anaphylaxis_solo.yaml` — single-case 20-minute
  shift wrapping the anaphylaxis case with four scheduled events:
  deterioration-if-not-adrenaline-by-T+5 (must-act mechanic), family
  arrival at T+8, tryptase results back at T+10, bed-manager pressure
  at T+15.
- Add deps: `zustand` was already in (Milestone 3). No new runtime
  deps for Milestone 4.
- Add `tests/kernel.test.ts` (12 tests): clock advance, shift-over
  clamp, scheduled-event firing, deterioration/no-deterioration paths,
  investigation turnaround, terminal-state safety, subscribe/notify,
  determinism cross-check between two kernels.
- Replace `tests/encounter.test.ts` with `tests/scoring.test.ts` (5
  tests) over the new `scoreCase` against real `CaseRuntime` instances
  produced by the kernel.
- Total 80 tests passing. Typecheck, ESLint, Prettier, validator
  (3 cases / 2 episodes / 1 arc), prod build all green.

### Milestone 3 — First end-to-end playable case (adult anaphylaxis)

- Author the adult peanut anaphylaxis case end-to-end against Resus Council
  UK 2021 (updated 2024) and NICE CG134. Every clinical claim carries an
  inline citation; no `# TODO: verify` markers remain. Includes diagnostic
  criteria, three-sample tryptase timing, Pumphrey posture trap, refractory
  IV-infusion definition, biphasic risk-stratified observation, and four
  explicit `must_not_do` examiner-trap actions (chlorphenamine first-line,
  IV hydrocortisone first-line, sit-upright while hypotensive, fourth IM
  dose in refractory anaphylaxis).
- Add `zustand` (^5.0) for encounter state.
- Add `src/state/encounter.ts` — Zustand store with phase machine
  (vignette → history → examination → investigations → differential →
  management → disposition → debrief) and pure `scoreEncounter` function
  (must-do hit rate · working diagnosis · disposition · safety penalty
  for `must_not_do` picks → percent + band: excellent/good/borderline/
  unsafe).
- Add `src/content/runtime.ts` — browser-side YAML loader using Vite
  `?raw` imports; parses and schema-validates a case at runtime.
- Add `src/ui/encounter/EncounterScreen.tsx` — full encounter UI with
  a phase progress strip, distinct screens per phase, and a debrief that
  scores action-by-action against the case YAML and lists pearls,
  pitfalls, and clickable source citations.
- Rewire `src/App.tsx` to a tiny menu router (`menu` | `encounter` |
  `hub`) so the ED hub from Milestone 1 stays accessible while the
  encounter is the primary entry point.
- Extend `src/styles.css` with menu, encounter, progress, card, and
  debrief styles. Dark, monospace, diegetic-ish.
- Add `tests/encounter.test.ts` — 5 tests for `scoreEncounter` (perfect
  run, must_not_do detection, disposition correctness, missed must_do,
  empty run). Loads the real authored YAML to keep the test honest.
- Test count now 68 / 68 passing; typecheck, lint, format, validator,
  build, and dev-server YAML serving all verified.

### Milestone 2 — Content schemas + validator

- Add `zod` (^4.4) and `yaml` (^2.9) runtime deps; `tsx` and `@types/node` dev.
- Author `src/content/schema.ts` — Zod schemas for `Case`, `Episode`, `Arc`,
  `ScheduledEvent`, `Citation`, plus supporting types (curriculum codes,
  SLO numbers, difficulty bands, triage categories, demographics, history,
  examination, investigations, differential, management, state machine).
  Discriminated unions for `Citation` (NICE / RCEM / Resus Council UK /
  BTS-SIGN / RCOG / BSPED / JBDS / TOXBASE / ESC / textbook / legislation
  / etc.) and `ScheduledEvent` (results back, NEWS2 escalation, new
  arrival, family arrival, bed manager, lab callback, deterioration on
  inaction, arc reveal).
- Author `src/content/loader.ts` — YAML file walker.
- Author `src/content/validator.ts` — schema validation + cross-reference
  resolution (case ids referenced in episodes/arcs exist; arc reveal hooks
  reference real cases; duplicate id detection).
- Add `scripts/validate-content.ts` — CLI with colour output; non-zero
  exit on validation failure.
- Add `npm run validate-content` script (`pnpm validate-content` alias
  works under pnpm too).
- Author sample YAMLs that exercise every required schema field —
  `case_anaphylaxis_adult_peanut`, `case_anaphylaxis_paeds_sibling`,
  `case_minor_laceration_ambient`, `arc_family_peanut_party`, and
  `ep_birthday_party`. Clinical content is intentionally skeleton with
  `# TODO: verify` markers per the build-prompt rule; full authoring is
  Milestone 3.
- Add `tests/schema.test.ts` (54 unit tests over the Zod schemas) and
  `tests/validator.test.ts` (5 integration tests over the file walker
  - cross-ref validator using `tmpdir` fixtures). Total 63 tests passing.
- Tighten RCEM curriculum-code regex to enumerate real syllabus prefixes
  (catches typos at validation time).

### Pre-Milestone 2 — Content survey

- Read RCEM Curriculum 2021 v1.5 (Aug 2025): TOC, all 12 SLOs (pp.17–58),
  full Clinical Syllabus (pp.59–68), assessment blueprint (pp.75–78).
  Confirmed the Clinical Syllabus is the canonical exam topic universe.
- Surveyed Oxford Handbook 5e (Wyatt et al, 2020), Wenzel Case Studies in EM
  (Springer 2023), Kosoko Obstetric Emergencies Case-Based Guide (Springer 2024) — TOCs and editorial flavour captured in `content/sources/`.
- Attempted RCEMLearning public catalogue fetch — site returned HTTP 503 to
  automated requests; calibration relied on search-indexed page titles
  ("FRCEM SBA blueprint" guidance). The build prompt's own scope for
  RCEMLearning is public-facing topic calibration; no member content used.
- Authored `content/topic-map.yaml` — 27 prioritised topics across three
  tiers, each tagged to RCEM curriculum codes, SLOs, paeds status,
  authoritative UK sources, and narrative arc hooks.
- Authored `content/sources/rcem-curriculum-2021.md` — curriculum summary
  with the 12 SLOs and procedural skills lists.
- Authored `content/sources/rcem-clinical-syllabus-codes.md` — the full
  Clinical Syllabus topic-code list (228 codes across 26 systems).
- Authored `content/sources/source-books.md` — bibliographic metadata and
  cross-check protocol for the three project books. Kosoko's per-chapter
  structure (Case → Hx → Exam → Tests → DDx → Working Dx → Mx → Pearls) is
  flagged as the 1:1 template for the Milestone 2 Case schema.
- Recommended first end-to-end case (Milestone 3): **anaphylaxis** (codes
  RP2, AP1, AP2, AC1; SLOs 1/3/5; protocolised single-pathway management).

### Milestone 1 — Scaffold

- Add Vite + TypeScript + React 19 + Phaser 3 project skeleton.
- Add ESLint (flat config) and Prettier with EditorConfig.
- Add Vitest with jsdom environment; one smoke test for `src/game/layout.ts`.
- Add `EDScene` Phaser scene rendering a placeholder top-down ED with
  resus / majors / paeds / relatives / nurses' station / minors / triage /
  ambulatory zones, a title, a shift-start clock label, and a non-clinical-advice
  disclaimer.
- Add `PhaserGame` React component that mounts a single Phaser game instance
  via `useEffect`.
- Add `content/` directory tree (`cases/`, `episodes/`, `arcs/`, `sources/`) with
  a `topic-map.yaml` stub.
- Add `README.md`, `CHANGELOG.md`, `DECISIONS.md`, `.gitignore`,
  `.editorconfig`, `.nvmrc`.

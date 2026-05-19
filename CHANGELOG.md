# Changelog

Format: one line per change, newest first.

## [Unreleased]

### M47 — full multi-step ECG drill at the bedside + new bank entry

- EcgInlineQuiz upgraded from single-question preview to full
  3-step drill matching the side-room daily challenge. Progress
  dots, back/reveal/next nav, end-of-drill summary.
- New ECG bank entry: ecg_015_af_rvr_pulmonary_oedema. Teaches
  the no-cardiovert-before-anticoag rule + digoxin first-line for
  rate control in pulmonary oedema (ESC 2020 + NICE NG196).
- case_acute_heart_failure_ahmed.yaml wired. Coverage now Patel +
  Okonkwo + Ahmed.

### M46 — park world tiles + hidden Visual Style Guide

- src/style/worldSprites.ts: 11 environment tiles (lino /
  wall_teal / curtain / trolley / drip stand / monitor / handgel /
  sharps bin). Not wired into gameplay; available for a future
  overworld composition pass.
- AssetLibraryScreen.tsx: in-app asset library reachable via
  ?style-guide=1 URL gate. Renders palette ramps, icons, patient
  sprites, NPC sprites, encounter props, world tiles.

### M45 — inline prop sprites in the drug chart

- src/style/propSprites.ts: 12 encounter props (syringe / IV bag /
  vials / ECG dots / O2 mask / BVM / drug chart / cannula /
  glucometer / defib pads / ET tube / nurse-call button).
- propIdForAction: two-phase match (action.name regex first,
  category fallback second). Beth's IM adrenaline → syringe.
- Inline 16×16 SVG glyph between checkbox and action name in the
  drugchart row.

### M44 — Williams patient sprite (2/17 cases sprited)

- 24×32 sprite across 5 states (stable / triaged / deteriorating /
  arrested / post_resus). Right-sided facial droop + half-closed
  eye on deteriorating mirrors the M40 manoeuvre findings.
- Remapped chars (K/J/E/y) to avoid clashing with the flushed and
  cyanosed tints already in the palette.

### M43 — NPC sprites in history cards

- src/style/npcSprites.ts: 8 overworld NPCs (paramedic /
  triage_nurse / f1_doctor / sister / anaesthetic_sho / security /
  worried_partner / bereaved_relative) at 16×24.
- npcSpriteIdForSource maps the 4 NPC-bearing history sources
  onto sprite ids; patient / records / gp_letter return null.
- HistoryNpcSprite renders the matching NPC inline in every
  history card across all 17 cases (universal coverage via mapping).

### M42 — content backfill across new systems

- Branching choices on +3 cases (Beth partner, Sarah pregnancy
  disclosure, Ahmed CHF adherence) — 2/17 → 5/17.
- Essential workup markers on +3 cases (Sarah, Williams, Brennan) —
  3/17 → 6/17.
- gated_by_history on +3 traps (Marcus insulin-bolus, Williams
  thrombolyse-on-DOAC, Priya third-benzo) — 2/17 → 7/17.

### M41 — interpolated vitals + trend arrows

- PatientPanel now lerps HR/RR/SpO2/BP between baseline and target
  over a 6-10s wall-clock window via requestAnimationFrame.
- Per-vital trend arrows (▲ / ▼) render in the strip while
  interpolation is in flight. Snap-to-target at <0.05 delta.
- Kernel stays speed-agnostic; this is pure UI.

### M40 — discoverable examination manoeuvres

- ExamSystemFindings.manoeuvres?: Array<{ id, label, findings[] }>
  splits per-system findings from per-technique discoveries.
- Kernel CaseRuntime.performedManoeuvres (Set) keyed as
  'system::manoeuvreId'; idempotent; serialise/restore extended.
- UI: 'Specific manoeuvres (N)' block beneath examined-system
  findings; click-to-reveal with marker flipping from ▸ to ✓.
- Backfill: Stan exposure 'Log-roll' hides occipital scalp
  laceration + boggy haematoma; Brennan disability 'Pronator drift'
  + 'Cranial nerves II-XII' hide subtle right-sided focal signs.

### M39 — Dr McGrath bedside interrupts

- New \`src/state/consultantInterrupts.ts\` composes three triggers:
  trap_caught, deterioration_takeover, unsafe_midshift. Each line
  cites the case name so she lands as a presence.
- KernelState.pendingInterrupt + CaseRuntime.consultantInterruptsFired
  ledger (one beat per trigger per case). Not snapshotted.
- New \`<ConsultantInterruptModal>\` over the encounter with
  keyboard dismiss; tone-coloured left border per trigger.

### M38 — rapport gates content + silences source

- HistoryItem.min_rapport hides patient disclosures until earned;
  rapport ≤ −2 silences patient-source items (they 'pull away').
- ShiftMemo.rapportBucket (warm/neutral/cold/null); Dr McGrath
  references it on the menu memo.
- Backfill: Chloe hx_chloe_aftercare (min_rapport: 1 — 'Don't call
  my mum yet'), Stan hx_stan_maggies_birthday (min_rapport: 2 —
  'Friday's her birthday. Maggie's.').

### M34.1 — stop rendering canonical response when a branch is picked

- The HistoryItem.response field stays as the schema-level fallback
  but only renders on items without branch_choices, or before the
  player picks. Once branched, only the picked branch's response
  shows — the choice is now consequential, not additive.

### M37 — co-worker NPC: Dr Aoife McGrath comments on your last shift

- New \`src/state/consultant.ts\`: persists a \`ShiftMemo\`
  (band / lives / attended / top tags / highlight case) on debrief
  mount and renders a 3-line consultant message on the menu next
  session.
- Identity-stable voice; tone shifts by band
  (excellent → unsafe). Greeting reflects recency
  ('just now' / 'earlier' / 'last shift').
- Pure localStorage; safe in private mode.

### M36 — investigation workup parsimony

- \`Investigation.essential: boolean\` declares which ix make up the
  case's expected workup. Score tracks essentialIxOrdered vs
  extraIxOrdered; −2% per extra beyond a 2-ix free allowance, capped
  at −10%. Untracked on cases with no essentials (backwards compat).
- Backfill: Beth (tryptase), Marcus (cap glucose+ketones, VBG, bloods),
  Patel (ECG, troponin).
- Episode debrief shows 'Workup: 1/1 essential · 4 extra (−4%)' per
  tracked case.

### M35 — gate must_not_do behind clinical reasoning

- \`Management.gated_by_history?: string[]\` — action only renders
  once one of the listed history ids has been asked. Simulates the
  cognitive trap rather than displaying it.
- Backfill: Amir's three paeds-DKA traps (adult-bolus, concurrent
  insulin, insulin bolus) gated on hx_paramedics. Okafor's
  dual-antiplatelet trap gated on hx_paramedic.
- Hint line surfaces 'N more options will appear once you ask the
  right history'.
- Validator cross-checks every gated_by_history id resolves.

### M34 — branching dialogue choices + rapport

- \`HistoryItem.branch_choices: Array<{ id, label, response,
  npc_voice?, rapport_delta? (-3..+3) }>\` — pivotal history items
  become real choices that shape rapport.
- Kernel: \`CaseRuntime.branchChoices\` + \`rapport\` (clamped ±3);
  \`pickBranchChoice()\` method idempotent on repeat picks.
- UI: rapport pill in the history header ('warming up / engaging /
  guarded / pulling away'); inline \`<BranchPicker>\` with
  'How do you ask?' prompt + chosen-tag display.
- ScoreReport extended with rapport + branchesPicked /
  branchesAvailable; debrief surfaces 'Pivotal moments engaged: 2/3'.
- Content backfill: Chloe \`hx_chloe_intent\` (compassionate +2 /
  clinical 0 / dismissive -2); Stan \`hx_stan_speech\` (same shape,
  Maggie / history / dismissal).

### M33 — daily case rotation: 'Today's pick' highlighted on the menu

- New helper \`pickShiftOfTheDay\` rotates by day-of-year mod shift
  count (mirrors the daily ECG bank). The matching menu card gets
  an amber 'TODAY'S PICK' badge.

### M32 — perks with bite: Trap-aware + Resus reflexes modify gameplay

- \`perk_trap_aware\` (5 cases) forces trap hints ON across all
  encounters, even if the Settings toggle is off. The drug-chart
  hint line surfaces which is driving it.
- \`perk_resus_reflex\` (200 XP SLO 3) widens the deterioration
  timer's warn / critical thresholds by +1 min in both the
  encounter timer chip and the shift-board card chip — wider
  runway before the chip pulses red.
- New \`hasPerk(id)\` helper on \`progression.ts\` (synchronous,
  safe in private-mode).

### M31 — ECG bank inline interpretation on tagged case ECGs

- \`Investigation.ecg_challenge_id?: string\` links a case's ECG
  investigation to an entry in src/content/ecg-challenges.ts.
- New \`<EcgInlineQuiz>\` component renders inside the resulted-ix
  card with the monitor-green ASCII strip + first interpretation
  question + multiple-choice options + reveal-with-rationale.
- Patel (anterior STEMI ambient) → ecg_002_anterior_stemi;
  Okonkwo (massive PE) → ecg_005_pe_pattern.
- Validator cross-checks ecg_challenge_id against the live bank
  by scraping \`id: 'ecg_…'\` declarations from the TS source.

### M30 — drug-chart styled management section + time-stamped actions

- Replaces the plain checklist with a diegetic NHS-yellow drug
  chart: TIME · DRUG·DOSE·ROUTE · CATEGORY columns, rotated 'STAT'
  stamp on the header when any must_do drug action exists, paper-
  grain repeating gradient background.
- Each ticked row stamps T+min in the TIME column.
  \`CaseRuntime.actionsAt: Map<actionId, simMin>\` persists this
  through serialise/restore.
- Out-of-sequence rows tint red with inline '↯ out of sequence'
  chip — surfaces M20 sequence errors at the point of action.

### M29 — code-hygiene sweep

- \`ManagementPhase\` localStorage read for trap-hints memoised so
  it's read once per mount, not per render.
- Episode debrief now surfaces \`c.score.sequenceErrors\` per case.
- Validator additions: topic_id cross-check against topic-map.yaml;
  npc_voice empty-string soft warning; orphan-case soft warning.
- Tests: save-restore preserves \`sequenceErrors\` (+ pre-M20
  snapshots restore safely with empty Set); episode-debrief rolls
  up per-case sequenceErrors.
- Three audit findings verified as false alarms (inverted-button
  logic was actually correct; supports refs on findings + ix were
  already validated; reduce-motion was already wired at boot in
  main.tsx).

### M28 — clinical citation hygiene

- Five citation fixes from the clinical audit (no clinical content
  changes; all doses/thresholds/algorithms verified accurate):
  - Amir paeds DKA: \`BSPED 2020\` → \`BSPED 2021\` in 8 places
    (header comment, ix_vbg, mx_paeds_saline_bolus, trap detail,
    two pearls, one pitfall, sources block).
  - Morrison sepsis: NG253 source-block title + URL fixed
    (was pointing at the superseded NG51).
  - Chloe paracetamol: tightened 'GCS ≥3' → 'grade III–IV hepatic
    encephalopathy' to match the precise O'Grady 1989 King's
    criterion (in 2 places).
  - Beth + Sam anaphylaxis: annotated BTS/SIGN 158 citations to
    reflect NICE NG244 Nov 2024 supersession of the chronic-
    management sections (acute sections still authoritative).

### M27 — settings screen + hub board live mini-vitals & deterioration timers

- New menu card 'Settings' → \`src/ui/settings/SettingsScreen.tsx\`
  surfaces existing preferences (monitor-audio default, sim-speed
  default) and adds two new toggles:
  · Trap hints (when on, must_not_do actions show an IconTrap chip on
    the management list — useful for revision warm-up; off by default
    so traps stay traps).
  · Reduce motion (manual override beyond OS prefers-reduced-motion;
    adds \`.skitt--reduce-motion\` to \`<html>\` at boot in main.tsx).
- Local data section: Reset progression, Discard saved shift, Wipe
  all local data — each with a confirm prompt and inline toast.
- Hub board (\`ShiftBoardScreen\`) case cards now carry:
  · Live mini-vitals (HR · BP · SpO₂ · GCS · NEWS2) in JetBrains Mono,
    with NEWS2-traffic-light left border (green / amber / red).
  · Live deterioration countdown chip when an
    \`deterioration_if_not_x_by_t\` event is unfired and still has
    missing required actions. Tone shifts at ≤5 min (warn) and ≤2 min
    (critical, pulsing).
  · IconRedFlag leads the 'awaiting clinician' warn pill.
  · Arrested patients show '—' instead of zeros, matching the
    encounter behaviour.

### M26 — new case + episode: Amir, severe paediatric DKA (BSPED 2020)

- `case_paeds_dka_amir` (~430 lines, ST3, paeds, EnC2 + GC3,
  `resus_protocol: apls_paeds`). Severe DKA (pH 7.04, ketones 5.6,
  gluc 36, GCS 13). Trap density: 4 must_not_do (20 mL/kg bolus,
  concurrent insulin, insulin bolus, IV bicarbonate).
- Sequence-aware: `mx_paeds_insulin_1h_after` carries
  `prereq_action_ids: [mx_paeds_saline_bolus]` — starting insulin
  before fluids triggers M20 sequence-error penalty.
- `ep_paeds_dka_solo` (25-min ST3) with 7 scheduled events
  including T+6 saline-bolus deterioration safety-net.
- Pairs deliberately with Marcus (adult DKA) to teach BSPED-vs-
  JBDS-IP dose-band discipline. Menu: '17 shifts, 17 cases, 3 arcs'.

### M25 — third arc: Overnight Safety-Net (Chloe + Stan)

- `arc_overnight_safety_net.yaml` (shared_incident) connects Chloe
  (paracetamol OD, M23) and Stan (intox fall, M8) via the shared
  pattern of prior ED visits with no MH follow-up.
- Reveal triggers: \`history_asked\` on Chloe's hx_paeds_safeguarding
  + fallback \`clock_time\` at T+14.
- Effect: unlocks Stan's new \`hx_stan_prior_mh\` history item (three
  prior ED visits Mar/Jul/Oct 2024, each discharged with alcohol-team
  signposting only, no liaison-psych contact).
- `ep_overnight_safety_net` (25-min ST3) wraps both cases + the arc.
- Menu subtitle: '15 shifts, 16 cases' → '16 shifts, 16 cases, 3 arcs'.

### M24 — ECG bank +3 challenges (14 total, 2-week rotation)

- ecg_012 · New LBBB with positive Sgarbossa criteria → STEMI equivalent.
- ecg_013 · Severe hypothermia (Osborn J waves, modified ALS algorithm).
- ecg_014 · Asymptomatic WPW pattern (Type A) — appropriate ED pathway +
  the AV-node-blocker safety teaching for any future pre-excited AF.
- Menu copy: surfaces the 14-day rotation.

### M23 — new case: Chloe, staggered paracetamol overdose

- `case_paracetamol_od_chloe` (ST3, ~450 lines): 19 y/o student,
  16 g paracetamol staggered over 5 hours. Trains the
  staggered-vs-acute trap (NAC regardless of level) + NICE NG225
  parallel safeguarding pathway.
- `ep_paracetamol_solo` (15th menu shift) with 7 scheduled events
  including the trap moment at T+4 (paracetamol level returns) and
  the H+12 deterioration clause.
- Menu subtitle: 14 → 15 shifts, 15 → 16 cases.
- Reachability test caught a dead-end `deteriorating` state on first
  author; transitions added: → admitted (NAC started) and → arrested
  (no NAC + no hepatology by H+18).

### M22 — ECG bank +4 challenges + IconCitation on sources

- New ECGs: atrial flutter 2:1, inferior STEMI with RV infarct,
  pre-excited AF (WPW), Brugada phenocopy. Bank now 11; rotation
  cycles every ~11 days.
- `IconCitation` glyph leads every source-list item in the case
  debrief.

### M21 — Phaser palette unified with locked design tokens

- `src/game/layout.ts` PALETTE now mirrors `src/style/palette.ts`.
  Phaser overworld matches the React encounter teal-night aesthetic.
- `IconMustDo` on resus tile must-do hints; `IconNewInfo` on history
  new-unlock chips.

### M20 — sequence-aware penalty for resus

- `ManagementAction.prereq_action_ids?: string[]` — taking an action
  before its prereqs is recorded as a sequence error.
- Kernel logs `'danger'` entry, populates `cs.sequenceErrors`,
  surfaces a `'Sequence error: <action> before <names>'` reason.
- `ScoreReport.sequenceErrors` exposes the count; scoring deducts
  10 per error.
- Debrief: new amber-tinted row tone for `sequence_error` status;
  '↯ out of sequence' label.
- Backfill: Okafor `mx_gtn_after_beta` requires `mx_iv_labetalol`
  (GTN-before-beta-block trap); Priya `mx_levetiracetam_iv` requires
  `mx_lorazepam_2` (escalate-before-second-benzo trap).
- Validator enforces self-reference-free, valid-id-only refs.

### M19 — diegetic UI frames

- `src/style/frames.tsx` ports Clipboard, Monitor, VitalsStripFrame,
  DrugChart, ResultsEnvelope from Claude Design `frames.jsx`.
- Patient portrait now lives inside a `Monitor` bezel; the plain CSS
  vitals strip is replaced by `VitalsStripFrame` (thermal-paper feel,
  NEWS2-traffic-light values).
- Investigations section: `ResultsEnvelope` hero slides in with a
  slight tilt when ≥1 result back, summarising the four most recent.

### M18 — Claude Design Visual Style Guide Phase 1 integration

- `src/style/palette.ts` — 5 ramps × 5 stops + 5 inclusive skin
  ramps + 6 state tints, all hex-locked.
- Typography: Space Grotesk (display), Manrope (body), JetBrains Mono
  (data/clock/vitals), Caveat (handwritten margin scribbles).
- `src/style/sprites.ts` — paint-by-string pixel-sprite engine.
  Beth Cartwright authored across 5 states (stable / triaged /
  deteriorating / arrested / post-resus).
- `src/style/icons.tsx` — 8 pixel-art status icons (RedFlag, MustDo,
  Trap, Countdown, TrendUp/Down, NewInfo, Citation).
- `PatientPortrait` prefers an authored sprite when one exists,
  synchronising frame loop to current RR. Falls back to the CSS
  silhouette for cases without authored art.

### M17 — Phaser-resident encounter

- `EDScene` adds a controllable avatar (22×28 px teal-scrubs sprite).
- Arrow / WASD movement; diagonal normalised; bounded to floor rect.
- Proximity logic: any patient card within 90 px highlighted with
  4 px white outline. Press E / Space to enter.
- Click-to-enter preserved for mouse/touch.

### M16 — cross-shift progression

- `src/state/progression.ts` — pure XP awarding + perk evaluation.
- 7 perks across milestones (First admission · Trap-aware · Acting
  senior · Acting EPIC · Stable+complex SLO 1 · Resus reflexes SLO 3
  · Four-figure clinician).
- New menu card 'Skill tree' → standalone screen with per-SLO
  progress bars + locked/unlocked perk gallery + cases-completed list.
- Episode debrief now awards XP inline; new perks highlighted.

### M15 — monitor audio + daily ECG challenge

- `src/sim/audio.ts` — Web-Audio synthesised QRS-tick keyed to HR.
  NEWS2 ≥ 7 OR arrested overlays an alarm tone. Opt-in,
  localStorage-persisted.
- 7 hand-authored ECG challenges rotating by day-of-year; standalone
  menu card.

### M14 — live deterioration timers + ward-trap counter

- `DeteriorationTimers` component surfaces every unfired
  `deterioration_if_not_x_by_t` for the current case as a countdown
  chip with the named required-but-missing actions.
- Tone shifts: info (>5m) · warn (≤5m) · critical (≤2m, pulsing).
- Debrief: 'Ward traps: avoided N/M · caught: <names>' summary chip.

### M13 — resus mode (ABCDE action wheel)

- `Case.resus_protocol` enum (`als_adult`, `apls_paeds`, `atls`,
  `choking_adult`, `choking_child`).
- `ManagementAction.resus_letter` (A/B/C/D/E) groups actions into
  the wheel.
- Beth, Sam, Okonkwo, Okafor, Priya tagged + bucketed.

### M12 — patient panel: live vitals strip + state-driven portrait

- `Vitals.baseline / deteriorating / arrested` schema.
- `src/sim/vitals.ts` — `deriveVitals(state, authored)` +
  `news2(v)` per RCP NEWS2 chart.
- New `<PatientPanel>` component renders the portrait + NEWS2 tile
  + colour-coded vitals strip.
- Every case backfilled with realistic baseline + deteriorating
  vitals (NEWS2-escalation enforced by content discipline test).

### M11 — differential builder: clue board + lock-in

- `HistoryItem.supports / ExamFinding.supports / Investigation.supports`
  (optional, references differential diagnosis labels).
- `DifferentialPhase` rewritten as a two-section reasoning surface:
  clue board (auto-populated) + differential cards with live
  `+N linked` support tally.
- Lock-in flow replaces click-to-pick: explicit commit reveals
  likelihood + supports tags. Un-lock returns to thinking mode.
- All 15 cases backfilled with `supports` on 2–5 history items each.

### M10 — dialogue-tree history

- `HistoryItem.prereq_history_ids` (pull-driven gating) +
  `reveals` (push-driven unlock, now wired to
  `cs.unlockedHistoryIds`).
- `HistoryItem.npc_voice` (italic stage direction above the response).
- Patient-comfort gate: when state ∈ {deteriorating, arrested},
  first-person 'patient' history items are silenced; banner explains.
- All 15 cases backfilled with 1–3 prereq chains and a npc_voice
  flourish.

### M9 — kill the forced phase pipeline

- `Phase` → `Section` (drops 'vignette' as a section; it becomes a
  persistent top card).
- `PhaseProgress` (numbered steps) → `SectionTabs` (tablist) with
  live kernel-derived badges: history unasked count, examination
  remaining, investigations 'results' / 'N pending', differential
  'pick' / '✓', management 'core actions open' / '✓', disposition
  'decide' / '✓'.
- Debrief tab locked until disposition + working dx picked OR shift
  ends.

### Audit: guideline-currency + clinical-accuracy sweep across all 15 cases

Driven by 5 parallel subagent audits, each verifying internal
accuracy AND looking up each cited guideline online for currency /
supersession. Found and fixed material updates:

**Critical (clinical-safety / guideline-supersession):**

- **Brennan (head injury)**: **NICE TA697 was partially superseded
  by TA1029 (terminated appraisal) in January 2025** — andexanet
  alfa is **NO LONGER NICE-recommended for intracranial
  haemorrhage** (ANNEXa-I NEJM 2024 showed haemostatic benefit
  without mortality/disability benefit). Reversal pathway rewritten
  to **4-factor PCC 25-50 IU/kg per BSH 2024** as UK first-line for
  DOAC-associated ICH. TA697 retained as a reference for the
  remaining (GI-bleed) indication only.
- **Brennan**: NG232 wording softened from "must CT within 8 h" to
  "**should consider** CT within 8 h" — NICE explicitly softened
  this from the prior CG176 mandate in the 2023 update. The
  in-case decision still to scan (recurrent faller + DOAC + lives
  alone) is preserved with the correct clinical-judgement framing.
- **Brennan**: NG232 recommendation number corrected: **§1.5.13**
  (not 1.4.6).
- **Williams (stroke)**: Added **tenecteplase 0.25 mg/kg single
  bolus (NICE TA990, July 2024)** as alternative thrombolytic per
  RCP 2023 / AcT (Menon Lancet 2022). Was previously alteplase-only.
- **Williams**: Anti-Xa threshold for thrombolysis on DOAC corrected
  to **<50 ng/mL** (RCP 2023 / ESO 2021) — was incorrectly listed
  as <30 ng/mL.
- **Williams**: DAWN/DEFUSE-3 windows disambiguated (DAWN 6-24 h,
  DEFUSE-3 6-16 h) with first-author citations.
- **Priya (status)**: NICE NG217 citation updated to "last updated
  **30 January 2025**". Levetiracetam wording softened from
  "preferred over phenytoin" to "alongside phenytoin/valproate as
  2nd-line" per the current guideline text. ESETT (Kapur NEJM 2019)
  + EcLiPSE (Lyttle Lancet 2019) added to sources.
- **Priya**: Lorazepam dose framing corrected — "4 mg IV fixed dose
  (adult); 0.1 mg/kg max 4 mg (paeds)" (was misleadingly weight-
  based for adults). Levetiracetam pregnancy category note rewritten
  — FDA letter categories retired in 2015 (PLLR narrative system
  now); UKTIS framing used instead.
- **Priya**: MHRA Valproate PPP citation updated to include the
  2025 paternal-precaution refresh. Pregnancy contraindication
  unchanged.
- **Sam (paeds anaphylaxis)**: **EpiPen weight threshold corrected
  from 30 kg → 25 kg** per MHRA / BNFc 2024. Sam at 28 kg now
  correctly receives **2× EpiPen 300 mcg (adult)**, NOT EpiPen Jr.
  Discharge bundle pearl + disposition criterion updated.
- **Beth (anaphylaxis)**: Paeds adrenaline dose-band entry now
  includes the missing **<6 month band (100-150 mcg)** per RCUK
  2021. Biphasic incidence pearl corrected to ~5% (was "Up to
  ~20%" — overstated). 2-h fast-track disposition reframed as
  "inappropriate for Beth specifically" rather than universally
  wrong.
- **Morrison (sepsis)**: **NICE NG51 was replaced by NICE NG253
  (Suspected sepsis in people aged 16 or over, 19 November 2025)**.
  All references updated (9 instances). Septic shock Sepsis-3
  definition tightened to require both vasopressor + lactate >2
  despite adequate fluid resus.
- **Marcus (DKA)**: JBDS-IP 2023 severity pH threshold corrected to
  **<7.0** (the 2022/2023 update tightened from <7.1). Marcus's
  result_summary now correctly identifies which criteria he meets
  (HR >100 + anion gap >16) rather than over-claiming pH/HCO3
  severity that his actual numbers don't meet.
- **Marcus**: Added **0.05 unit/kg/h FRII step-down** when glucose
  <14 mmol/L per JBDS-IP 2022/2023 update — major hypokalaemia /
  hypoglycaemia mitigation that was missing.
- **Stan (intox)**: Pabrinex regimen corrected — "1 pair TDS" was
  non-standard. Now NICE CG100 / SPS:
  - Suspected/established Wernicke (Stan qualifies): **2 pairs IV
    TDS for 3 days**, then 1 pair OD.
  - Prophylaxis only: 1 pair IV OD for 3-5 days.
- **Sarah (ectopic)**: Methotrexate criteria expanded to **NICE
  NG126 tiered system**: <1500 IU/L offer MTX; 1500-5000 offer
  choice; >5000 surgery preferred. Sarah's βhCG 4280 sits in the
  choice band; surgery preferred because of rupture/free-fluid,
  NOT because the hCG disqualifies MTX.
- **Sarah**: Anti-D pearl rewritten per **NICE NG126 May 2026
  update** — no routine anti-D for ectopic/miscarriage at
  <12 weeks regardless of management.
- **Sarah**: NG126 citation date updated to "2019, updated June
  2025; anti-D update May 2026".
- **Kowalski (UGIB)**: Added **pre-emptive TIPS within 72 h**
  (ideally <24 h) action for Child-Pugh C per **Baveno VII (de
  Franchis J Hepatol 2022)** — paradigm shift from "TIPS as
  rescue". Mr Kowalski is the textbook candidate.
- **Kowalski**: Vitamin K trap reframed — single 10 mg IV is still
  recommended per BSG 2015 for the cholestatic/nutritional
  component; the wrong move is RELYING on it for haemostasis.
- **Kowalski**: Propranolol indication corrected to "**secondary**
  prevention" (post-banding), was "primary".
- **Kowalski**: Terlipressin dose corrected to **weight-banded**
  initial dose (<50 kg 1 mg / 50-70 kg 1.5 mg / >70 kg 2 mg) per
  UK SmPC.
- **Patel (STEMI)**: ESC ACS guideline title corrected to **Byrne
  et al. 2023 ESC ACS Guideline (consolidated STEMI + NSTE-ACS)** —
  was "ESC STEMI Guidelines 2023" which is the wrong document.
- **Okafor (AD)**: ESC 2024 guideline title corrected to
  **Mazzolai et al. 2024 ESC Guidelines for peripheral arterial
  and aortic diseases** (merged into one guideline with TEM
  classification for acute aortic syndromes). RCEM source updated
  to **RCEM/RCR Joint Best Practice Guideline 2024** (was "RCEM
  Best Practice 2023" — between versions). Labetalol cumulative
  bolus cap harmonised to **200 mg** (was 300 mg, inconsistent
  with Oduya). HR target tightened to **<60** in acute Type A.
- **Ahmed (AHF)**: **NICE NG106 was updated 3 September 2025** with
  quadruple therapy (ACEi/ARNI + β-blocker + MRA + SGLT2i) as
  first-line for HFrEF. `mx_restart_bumetanide_explain` now flags
  that Mr Ahmed (EF 32%) is NOT on SGLT2i and should be on
  dapagliflozin 10 mg OD per the updated guideline.
- **Ahmed**: Iakobishvili journal citation corrected — Acute
  Cardiac Care 2011 (was incorrectly listed as Eur Heart J 2011).
  Peacock ADHERE (Emerg Med J 2008) added as the primary morphine-
  harm signal.
- **Ahmed**: Apixaban wording corrected — "not recommended below
  CrCl 15" (was "contraindicated below CrCl 15... NOT below 30",
  which conflated SmPC language).
- **Okonkwo (PE)**: RCOG GT 37b citation replaced with **NICE
  NG89** (RCOG 37b covers pregnancy/puerperium; NG89 covers post-
  gynae-surgery thromboprophylaxis).

**Numbers**: 15 cases / 14 episodes / 2 arcs validate. 192 tests
pass. Production build green.

### Test: state-machine reachability; backfill missing case transitions

Added `tests/state-machine-reachability.test.ts` — would have caught
the Oduya hypertensive-emergency dead-end (no transitions out of
`deteriorating`) before review. Two invariants per case:

1. No case-internal "dead-end" non-terminal state — if the case
   routes the player INTO a state (e.g. `deteriorating`), it must
   route them OUT.
2. At least one transition leads to a success state (`admitted`
   or `discharged`).

The test surfaced **4 pre-existing authoring gaps** the validator
hadn't caught:

- **Patel (STEMI)**: added `stable → admitted` on `mx_ppci_pathway`
  and `deteriorating → stable` on `mx_aspirin` (recovery + success
  paths).
- **Sarah (ectopic)**: added `stable → admitted` on `mx_call_gynae`
  and `deteriorating → stable` on `mx_iv_fluids`.
- **Brennan (head injury / DOAC)**: added `deteriorating → stable`
  on `mx_haem_neurosurg_discuss` (had success path already).
- **Stan (intox)**: added `stable → admitted` on `mx_ct_head`
  (CT-cleared → admit AMU for sliding-scale glucose + Pabrinex +
  alcohol-team referral).

These weren't strict bugs (kernel's `setDisposition` will close any
case regardless of state-machine transitions), but the case
"narrative" was incomplete — failing to give the player a recovery
or admission path within the simulation state machine. All 4 cases
now have full deteriorating ↔ stable ↔ admitted loops in YAML.

Test count: 162 → 192 (added 2 invariants × 15 cases = 30).

### Audit: Ahmed (AHF) + Oduya (HTN emergency) accuracy fixes

Subagent audit caught 8 real clinical accuracy issues in the two
newest cases.

**Ahmed (acute heart failure):**

- **Apixaban dose-reduction criteria corrected**: SmPC rule for
  NVAF is ≥2 of {age ≥80, weight ≤60 kg, Cr ≥133 µmol/L} — NOT
  an eGFR cutoff. Apixaban contraindicated below CrCl 15 mL/min
  (not <30). Mr Ahmed meets 1 criterion only → continues 5 mg BD.
- **IV furosemide dose for chronic users corrected**: 40 mg
  starting dose was too low. Now 40–80 mg with safety factor 2–
  2.5× the oral equivalent (his bumetanide 1 mg ≈ furosemide 40 mg
  × 2 = 80 mg). 10-day washout does NOT reset receptor-level
  diuretic resistance.
- **VBG type-2 respiratory failure mislabel**: VBG pCO2 6.2 kPa
  ≠ arterial pCO2 >6 (venous typically 0.5–1 kPa higher than
  arterial). Now framed as hypercapnic strain not formal T2RF.
- **NT-proBNP threshold corrected**: NICE NG106 rule-out
  threshold in acute setting is <400 ng/L, not 300 pg/mL.
- **POCUS EF softened**: visual EF carries ±10% inter-rater
  variability; specific "25% vs 32%" overcalled — now framed as
  qualitative worsening.
- **Morphine citation primary source added**: Peacock W et al.
  ADHERE registry (Emerg Med J 2008) is the primary signal;
  Iakobishvili 2011 is a secondary analysis.

**Oduya (hypertensive emergency):**

- **`initial_state` corrected**: was `stable`, now `deteriorating`
  (AMT 7/10 + GCS 14 + papilloedema + AKI Stage 2 is not stable).
  Triage category bumped 2 → 1 to match the severity.
- **State machine completed**: previously had only stable →
  deteriorating + stable → admitted (dead-end on deteriorating).
  Now includes deteriorating → stable (on labetalol initiation)
  and deteriorating → arrested (inaction by T+25), giving the
  player a full recovery / failure path.
- **BP reduction target corrected**: was "MAP floor 100–110 in
  first 24 h" (too low), now "≤25% MAP reduction in first hour;
  ~160/100 over 2–6 h; gradual normalisation over 24–48 h".
  Calculated his arrival MAP 163 → 25% reduction ≈ MAP 122
  (≈ 160/100) so the worked example matches.
- **Labetalol cumulative bolus cap corrected**: was 300 mg, now
  200 mg (RCEM / BNF cap) before switching to infusion.
- Matching pearl + must_not_do detail updated to the corrected
  target.

15 cases / 14 episodes / 2 arcs validate; 162 tests pass.

### Content: hypertensive emergency (Oduya) — discipline over speed

- `content/cases/case_htn_emergency_oduya.yaml` — 15th authored
  case. Mr Oduya, 52M bus driver who stopped his amlodipine +
  ramipril 3 weeks ago when his GP told him not to drive until BP
  controlled. Now in majors with BP 226/132, AMT 7/10 confusion,
  blurred vision, **bilateral papilloedema with flame-shaped
  haemorrhages (Keith-Wagener-Barker grade IV)**, AKI Stage 2
  (Cr 168 vs baseline 76 = 2.2× — KDIGO), urinary RBC casts, and
  PRES pattern on CT.
- The shift's teaching pivot is **discipline over speed**: BP
  reduction 10-25% in the first hour, MAP floor 100-110 in the
  first 24 h. Trainees reflex to "get it below 140/90" and miss
  the autoregulation-curve teaching point.
- Five `must_not_do` traps:
  1. Aggressive BP reduction (target <140/90 in 1 h) — watershed
     infarcts, worsened AKI.
  2. **Sublingual nifedipine** — Grossman JAMA 1996 documented the
     deaths and the moratorium; this trap remains tempting decades
     later.
  3. IV furosemide "for the oedema" — compounds AKI without
     pulmonary-oedema indication.
  4. Oral antihypertensive + discharge with GP follow-up.
  5. IV amlodipine attempt (no such formulation exists; SL
     crushed-tablet is the same risk profile as SL nifedipine).
- Authored against **NICE NG136** (Hypertension in adults), **RCEM
  Learning — Hypertensive Emergency**, **ESH 2023** (Mancia
  J Hypertens), **KDIGO 2012** AKI staging, **Fugate Lancet
  Neurology 2015** (PRES review), Grossman JAMA 1996 (nifedipine
  moratorium).
- `content/episodes/ep_htn_emergency_solo.yaml` — 20-min single-
  case shift. T+3 wife arrives with compliance story; T+5 ECG (LVH
  + strain); T+7 urine dip (RBC casts); T+11 bloods (AKI Stage 2);
  T+14 CT head (PRES); T+17 medical-reg HDU bed callback; T+20
  deterioration deadline.
- Inspiration: TheCase.Report S1E13.
- New "Hypertensive emergency — controlled BP reduction" entry on
  the menu via `SHIFT_DEFS`. App subtitle: 14 shifts, 15 cases.
- 15 cases / 14 episodes / 2 arcs; 162 tests pass.

### Content: acute heart failure (Ahmed) — wet-and-warm pulmonary oedema

- `content/cases/case_acute_heart_failure_ahmed.yaml` — 14th
  authored case. Mr Ahmed, 78M, woken at 02:00 by suffocating
  dyspnoea, pink frothy sputum, JVP to the jaw, BP 188/104. Known
  HFrEF off his diuretic for 10 days because the pre-op clinic
  stopped his bumetanide before a planned knee replacement next
  week. The shift's defining teaching points:
  1. **Wet-and-warm phenotype** = NIPPV + IV GTN + IV furosemide;
     no fluid, no morphine, no beta-blocker bolus.
  2. **Chronic loop-diuretic dosing** — for chronic users, give at
     least the usual oral 24-h dose converted to IV (bumetanide
     1 mg ≈ furosemide 40 mg).
  3. **Pre-op-clinic medication holds** as a recurring AHF
     precipitant — document the patient-safety conversation with
     anaesthetics + cardiology for the next surgery.
- Five `must_not_do` traps: IV fluid bolus, routine IV morphine
  (NICE NG106 advises against — Iakobishvili EuroHF Eur Heart J
  2011), IV beta-blocker bolus for AF, premature intubation
  without CPAP trial (3CPO NEJM 2008), aggressive IV labetalol BP
  lowering.
- Authored against **NICE NG106**, **ESC 2021 Heart Failure
  Guideline** (McDonagh), **3CPO trial** (Gray NEJM 2008), Volpicelli
  POCUS 2012, BTS Emergency Oxygen 2017. Inspiration: TheCase.Report
  S1E10 + S1E11 (Acute HF + Prof Amal Mattu bonus).
- `content/episodes/ep_ahf_solo.yaml` — 20-min single-case shift.
  T+2 VBG, T+3 wife arrives with diuretic-hold history, T+5 POCUS
  pivot, T+8 CXR, T+11 troponin (the type-2 anchor), T+14 NT-proBNP,
  T+16 cardiology hand-over, T+18 deterioration deadline.
- Pairs thematically with case_chest_pain_patel_ambient (STEMI)
  and case_aortic_dissection_okafor (AD) as a "chest pain +
  dyspnoea" differential — same presenting cluster, three different
  mechanisms.
- New "Acute heart failure — pre-op diuretic-hold decomp" entry
  on the menu via `SHIFT_DEFS`. App subtitle: 13 shifts, 14 cases.
- 14 cases / 13 episodes / 2 arcs; 159 tests pass.

### Audit pass on the 3 newest cases

Subagent audit caught 10+ real clinical/arithmetic issues across the
3 newest cases. Each fix cites the source-of-truth UK guideline or
RCT.

- **Okafor (AD)**: STEMI fibrinolytic in the must-not-miss
  discriminator changed from alteplase → **tenecteplase** (UK STEMI
  agent per NICE TA52 / ESC 2023 ACS). Labetalol per-kg figure
  corrected (0.25 mg/kg was inconsistent with 10–20 mg in adults —
  changed to ≈0.1–0.2 mg/kg). Right-arm neuro finding re-labelled
  as **innominate-artery malperfusion** (not a C5–T1 dermatomal
  pattern, which would imply brachial-plexus pathology).
- **Kowalski (UGIB)**: GP letter wording corrected to **secondary**
  prevention of variceal rebleed (post-banding) — previously said
  "primary". GBS arithmetic breakdown now itemises each component
  (Urea +3, Hb +6, sBP +3, pulse +1, melaena +1, hepatic +2 = 16);
  the syncope component (+2) is removed because the vignette does
  not describe a frank syncope event. NICE CG141 outpatient cut-off
  corrected to **GBS = 0** (was "GBS <1") — minor but a real
  threshold.
- **Okonkwo (PE)**: alteplase risks at consent corrected from
  "~3% major bleeding + ~1% ICH" to **~10% major bleeding + ~2%
  ICH** per MAPPET / PEITHO / ESC 2019 — the previous figures
  materially understated risk at the consent moment. Wells score
  arithmetic corrected from 8 → **9** (3+3+1.5+1.5 = 9). Switched
  to **NICE NG158 two-tier Wells** (>4 = "PE likely" → CTPA),
  cross-referenced to the legacy three-tier (>6 = "high"). PESI vs
  ESC terminology disentangled: PESI is binary, the four-tier
  intermediate-low / intermediate-high / high naming is the
  **ESC 2019 risk stratification**. Date math fixed: COCP restarted
  5 days ago at the **day-7 (one-week) post-op review**, not "two
  weeks" (was inconsistent with day-12 vignette). Post-op
  prophylaxis re-attributed from "aspirin" to **LMWH (enoxaparin
  40 mg OD ×7 days)** per NICE NG89 / RCOG GT 37b. Action id
  renamed `mx_thrombolysis_call` → `mx_cardio_itu_pert_referral`
  to avoid implying the action gives thrombolysis (it's the
  referral).

13 cases / 12 episodes / 2 arcs validate; 156 tests pass.

### Content: massive PE (Okonkwo) — shock + thrombolysis decision

- `content/cases/case_massive_pe_okonkwo.yaml` — 13th authored
  case. Ms Okonkwo, 39F, day-12 post-laparoscopic hysterectomy on
  the COCP (restarted by a locum GP who didn't have the operation
  note), syncope in the supermarket carpark, arrives in resus with
  BP 86/54, SpO2 92% on NRB, S1Q3T3 ECG, McConnell's sign + DVT on
  POCUS. Family history of "burst aorta" and DVT.
- Wells = 8 (no D-dimer needed), sPESI = 2, raised trop + BNP =
  **high-risk (massive) PE** per ESC 2019 — 30-day mortality 25–50%
  without reperfusion.
- The teaching arc: pretest probability → bedside echo + DVT scan
  pivot at T+5 (rule-IN without leaving resus), cautious fluid +
  noradrenaline first, systemic alteplase 100 mg over 2 h, UFH
  alongside, capacity-respecting consent conversation.
- Five `must_not_do` traps:
  1. D-dimer "to rule out" at Wells 8 (wrong end of Bayes).
  2. Aggressive 2 L crystalloid bolus in obstructive shock.
  3. RSI without a pre-induction vasopressor (intubation-arrest).
  4. LMWH instead of UFH when thrombolysis is on the table.
  5. Restart COCP post-discharge (permanent contraindication after
     hormone-provoked VTE).
- Authored against **NICE NG158** (VTE 2020), **ESC 2019 PE
  Guidelines** (Konstantinides), **ADJUST-PE** (Righini JAMA 2014),
  **PERC rule** (Kline JTH 2008), **McConnell's sign** (Am J
  Cardiol 1996), **BTS 2018** outpatient PE pathway, **RCOG GT
  37b** post-gynae thromboprophylaxis.
- `content/episodes/ep_pe_solo.yaml` — 20-min single-case shift.
  T+2 Wells, T+5 POCUS pivot, T+8 trop+BNP, T+10 family arrive for
  consent conversation, T+13 CTPA, T+15 PERT lead call + hard
  deterioration deadline.
- Pairs thematically with `case_aortic_dissection_okafor` —
  chest-pain + shock + raised troponin, opposite therapies. Future
  "chest pain + shock differential" double-bill candidate.
- New "Massive PE — shock and the thrombolysis decision" entry on
  the shift menu. App subtitle: 12 shifts, 13 cases.
- Inspiration: TheCase.Report S3E1. Player-facing citations are
  NICE NG158 + ESC 2019 + ADJUST-PE + PERC + McConnell + BTS 2018
  + RCOG GT 37b.
- 13 cases / 12 episodes / 2 arcs; 156 tests pass.

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

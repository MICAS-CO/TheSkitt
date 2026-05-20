# The Skitt

Episodic, story-driven emergency medicine RPG. A study tool for UK FRCEM
candidates (Intermediate SAQ → Final SAQ/SBA).

> **Not medical advice.** Not a substitute for supervised clinical training.
> Clinical content is study material grounded in UK guidelines (NICE, RCEM,
> Resuscitation Council UK, BTS/SIGN, RCOG, JBDS, TREND-UK) with inline
> citations on every clinical claim.

## Status

All eight build-prompt milestones + 15 redesign milestones landed on
`claude/add-necessary-files-4THUA`. See `CHANGELOG.md` for the full
log and `RESUME.md` for current state at a glance.

| #     | Milestone                          | What it ships                                                                                          |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1     | Scaffold                           | Vite + TS + React 19 + Phaser 3, ESLint flat, Prettier, Vitest, "Hello, ED" scene                      |
| 2     | Schemas + validator                | Zod schemas for Case/Episode/Arc/ScheduledEvent/Citation + `validate-content` CLI                      |
| 3     | First playable case                | Adult anaphylaxis end-to-end (Resus Council UK 2021 + NICE CG134)                                      |
| 4     | Simulation kernel                  | Pure deterministic kernel + shift clock + scheduled events + state machines                            |
| 5     | Second case + arc                  | Ectopic pregnancy in minors (NICE NG126 + RCOG GTG 21) + hen-do shared-incident arc                    |
| 6     | Episode debrief                    | Banded overall score, lives saved/lost, examiner notes, source aggregation                             |
| 7     | Content CLI                        | `new-case` + `new-episode` generate skeleton YAMLs from `topic-map.yaml`                               |
| 8     | Ambient board (stretch)            | Two ambient cases (Stan, Mrs Patel) — four time-critical events on one clock                           |
| 9     | Free section nav                   | Killed the linear phase pipeline; section tabs with live kernel-derived badges                         |
| 10    | Dialogue-tree history              | Prereqs, NPC voice flourishes, patient-comfort gating                                                  |
| 11    | Differential builder               | Clue board + per-dx support tally + lock-in working diagnosis                                          |
| 12    | Patient panel                      | Live vitals strip + state-driven portrait + RCP NEWS2                                                  |
| 13    | Resus mode                         | ABCDE action wheel for SLO-3 cases (Beth, Sam, Okonkwo, Okafor, Priya)                                 |
| 14    | Live deterioration timers          | Countdown chips + ward-trap counter in the debrief                                                     |
| 15    | Monitor audio + Daily ECG          | Web-Audio beep + 11-rotation ECG challenge                                                             |
| 16    | Cross-shift progression            | XP, RCEM SLO mastery, perks (localStorage)                                                             |
| 17    | Phaser-resident encounter          | Controllable avatar with arrow / WASD movement + proximity interact                                    |
| 18–22 | **Claude Design integration**      | Locked palette, fonts, Beth's 5-state pixel sprites, 8 status icons, diegetic frames, palette in Phaser |
| 20    | Sequence-aware penalty             | `prereq_action_ids` on management actions; 10-pt deduction per out-of-order action                     |
| 23    | New case: Chloe paracetamol OD     | Staggered-vs-acute trap + NICE NG225 safeguarding parallel                                             |
| 24    | ECG bank +3 (14 total)             | Sgarbossa-positive LBBB, severe hypothermia, asymptomatic WPW — 14-day rotation                       |
| 25    | Third arc: Overnight Safety-Net    | Chloe + Stan connected by shared MH-system-failure pattern (NICE NG225)                                |
| 26    | New case: Amir paediatric DKA      | BSPED 2020 dose-band trap (10 mL/kg vs 20, 48-h deficit, insulin H+1) — pairs with Marcus              |
| 27    | Settings + hub-board live vitals   | Audio default · sim speed · trap hints · reduce motion · per-card NEWS2 strip & deterioration chips    |
| audit | Code · clinical · game-design      | Three parallel audits; three false alarms caught; ten actionable items rolled into M28-M33                |
| 28    | Clinical citation hygiene          | BSPED 2021, NG253 source-block, King's encephalopathy wording, NG244 annotation on BTS/SIGN 158         |
| 29    | Code hygiene                       | trapHints memo · sequenceErrors in episode debrief · topic_id + orphan validators · 3 new tests        |
| 30    | Drug-chart management section      | Diegetic NHS-yellow chart, T+min stamps per action, STAT stamp, in-place out-of-sequence chips         |
| 31    | ECG bank inline                    | Cases can link ix_ecg to bank entries; inline interpretation prompt + reveal at point of clinical use |
| 32    | Perks-with-bite                    | Trap-aware forces trap hints on; Resus reflexes widens deterioration warn/critical thresholds by 1 min  |
| 33    | Daily case rotation                | Day-of-year rotation picks 'Today's pick' shift, badged on the menu card                                |
| 34    | Branching dialogue + rapport       | HistoryItem.branch_choices → compassionate/clinical/dismissive picks → rapport ±3; Chloe + Stan        |
| 35    | must_not_do gating                 | Management.gated_by_history hides traps until you've heard the cue; Amir DKA + Okafor dissection       |
| 36    | Workup parsimony                   | Investigation.essential + −2%/extra beyond 2 (cap −10%); Beth + Marcus + Patel backfilled               |
| 37    | Co-worker NPC                      | Dr Aoife McGrath leaves a 3-line memo on the menu after each shift; tone shifts by band                |
| audit | Game-design re-audit               | M30/M35/M36 deep · M34 best content but weakest wiring · next pass: wire systems together               |
| 34.1  | Branch responses consequential     | Stop rendering canonical when a branch is picked — the choice becomes the response                       |
| 38    | Rapport gates content              | HistoryItem.min_rapport hides disclosures; rapport ≤ -2 silences the patient; consultant references it  |
| 39    | McGrath in the bay                 | Three bedside interrupts — trap caught · deterioration takeover · unsafe-trajectory midshift coffee     |
| 40    | Discoverable manoeuvres            | ExamSystemFindings.manoeuvres splits system-eyeball from technique (log-roll, pronator drift, CN II–XII) |
| 41    | Interpolated vitals                | HR/RR/SpO2/BP lerp toward kernel target over 6-10s wall-clock; trend arrows in the strip                |
| 42    | Content backfill                   | Branches +3 cases · essentials +3 cases · gated_by_history +3 traps                                      |
| 43    | NPC sprites in history             | 8 NPCs (paramedic / triage_nurse / sister / f1_doctor / SHO / security / partner / bereaved) inline      |
| 44    | Williams patient sprite            | 24×32 across 5 states; sprite coverage 1/17 → 2/17                                                       |
| 45    | Encounter props in drug chart      | 12 props (syringe / IV bag / vials / ECG dots / O2 / BVM / chart / cannula / glucometer / defib / ETT)   |
| 46    | World tiles + Style Guide          | 11 environment tiles parked · hidden ?style-guide=1 asset library                                         |
| 47    | ECG drill at the bedside           | EcgInlineQuiz upgraded to full multi-step · new bank entry · Patel + Okonkwo + Ahmed wired               |
| 48    | Two more bedside ECG drills        | New ecg_016 (paroxysmal AF stroke) · Marcus + Williams wired · coverage 5/17                              |
| 49    | Three more branch_choices          | Williams Carol · Marcus Joe · Brennan DOAC-compliance · coverage 8/17                                     |
| 50    | Four more discoverable manoeuvres  | Sarah pelvic · Patel auscultation · Beth airway · Priya post-ictal · coverage 6/17                        |
| 51    | Essentials on every case           | 6/17 → 17/17 — workup parsimony now runs on every shift                                                  |
| 52    | Ten more gated traps               | Brennan aspirin / DOAC reversal · Patel lysis · Ahmed BB+fluid · Morrison abx · Chloe level · Sarah · Beth |
| 53    | Three pivotal branches             | Stan paramedic (dismissive *drops* the witnessed fall + BM) · Chloe Mira · Patel daughter                  |
| 54    | Five rapport-gated disclosures     | Marcus mum · Brennan alone · Patel confides · Priya flatmate · Sam mum · coverage 2/17 → 7/17             |
| 55    | One branch / flat case             | Sam non-tonal trilemma · Morrison · Kowalski · Okafor · coverage 8/17 → 12/17                             |
| 56    | Case epilogue on every disposition | 59 narrative codas · schema add · UI wired · 'cup of tea she doesn't drink' becomes canonical             |
| 57    | Branches on the final flat 4       | Oduya · Okonkwo · Amir · Priya flatmate · coverage 12/17 → 16/17                                          |
| 58    | Branch source diversification      | First nurse (Marian) · triage_note (Anya) · paramedic (Dom) · gp_letter (pre-op nurse) forks              |
| 59    | Snapshot migration shim            | SNAPSHOT_VERSION + migrateSnapshot — future-proofs save/restore                                            |
| 60    | Second non-tonal fork              | Brennan son disclosure-timing trilemma — proves the pattern is repeatable                                  |
| 61    | Split EncounterScreen.tsx          | 4 phases → ./phases/* · 1743 → 1200 lines                                                                  |
| 62    | Five more exam manoeuvres          | Marcus / Sam / Ahmed / Okonkwo / Williams · coverage 6/17 → 11/17                                         |
| 63    | Case practice library              | Flat 17-card grid · 'drill any patient on their most-focused shift'                                       |
| 64    | Code-split styleguide              | AssetLibraryScreen lazy-loaded · style guide is a 9 kB chunk                                              |
| 65    | Drop #3 sprites                    | 13 patient archetypes · 8 equipment · 13 tiles · 17 FX · 4 walk frames                                    |
| 66    | FX in consultant interrupt         | Trigger-coded emote in modal corner — exclamation / heart_pulse / relief_exhale                          |
| 67    | Semantic colour contract           | brand-red ≠ alert-high ≠ alert-amber · applied to red flag / NEWS2-red / STAT stamp                       |
| 68    | App icon + favicon                 | Resus-cross 'I' on dark teal · public/app-icon.svg · 36×36 in header                                     |
| 69    | 'Time of Death' modal              | Mortuary-styled overlay on deceased transition · continue / debrief                                       |
| 70    | Achievement badges                 | 8 pixel-art unlocks · 6 conditions wired · localStorage persistence                                       |
| 71    | TheCase.Report brand lock-up       | public/tcr-lockup.svg in the app footer, linking thecase.report                                          |
| 72    | Three more patient sprites         | Chloe + Stan + Patel · 5 states each · sprite coverage 2/17 → 5/17                                       |
| 73    | FX particles on patient state      | urticaria / sweat / vomit / blood / pulse, diagnosis-coded, reduce-motion aware                          |
| 74    | First-run induction                | Character creator + McGrath's 13-beat Skittstown ED tour at first launch                                  |
| 75-76 | Full drop port + 17/17 sprites     | 13 drop archetypes × 5 states · mapped to every case · sprite coverage 17/17                              |
| 77    | Difficulty tiering                 | F1/F2/CT1 grade affects score band thresholds + trap-hint defaults                                        |
| 78    | LICENSE + lazy routes              | Proprietary copyright file · all menu-secondary routes lazy-loaded with Suspense                          |
| 79    | McGrath walks in                   | Parked walk-cycle frames now drive her entrance into the consultant interrupt modal                       |

Numbers: **324 unit tests · 3 E2E · 17 cases · 17 episodes · 3 arcs ·
16 daily ECGs · 8 NPC sprites + 13 patient archetypes · 20 props +
13 world tiles + 17 FX · 8 achievement badges · 17/17 cases sprited ·
F1/F2/CT1 difficulty tiering**.
Lint clean, typecheck clean, validator green.

## Stack

- **Vite 6 + TypeScript 5** — build/dev
- **React 19** — menus, encounter UI, debrief
- **Phaser 3** — ED hub scene (lazy-loaded only when the player opens it)
- **Zustand 5** — UI state; the simulation state is owned by the kernel
- **Zod 4 + YAML** — content schemas, runtime parse + validation
- **Vitest** — unit / kernel / scoring tests
- **Playwright** — single end-to-end smoke
- **ESLint 9 (flat) + Prettier 3** — lint + format

## Develop

Requires Node 20+ (Node 22 recommended; see `.nvmrc`).

```bash
npm install                 # or pnpm install / npm ci on a fresh clone

npm run dev                 # http://localhost:5173 — hot-reload dev server
npm run typecheck           # tsc -b --noEmit
npm test                    # Vitest (unit + scoring + kernel + arcs + CLIs)
npm run lint                # ESLint
npm run format              # Prettier write
npm run format:check        # Prettier check
npm run validate-content    # walk content/*.yaml against Zod schemas + cross-refs
npm run build               # production bundle to dist/
npm run preview             # serve the production bundle
npm run test:e2e            # Playwright (requires `npx playwright install --with-deps chromium` once)

npm run new-case --topic anaphylaxis --id case_anaphylaxis_v2
npm run new-case --list
npm run new-episode --id ep_new_shift --title "New shift" --focus case_a,case_b
```

## Layout

```
src/
  App.tsx                       Menu router (menu | shift | hub | ecg | skilltree)
  main.tsx                      React entry
  styles.css                    Global + encounter + board + debrief + sprite + frame styles
  ui/
    PhaserGame.tsx              Mounts Phaser via dynamic import
    encounter/
      EncounterScreen.tsx       Free-nav section UI (history | exam | ix | diff | mx | dispo | debrief)
      PatientPanel.tsx          Persistent portrait + vitals strip + monitor audio
      ResusMode.tsx             ABCDE action wheel (M13)
    shift/
      ShiftView.tsx             Routes between board / hub / encounter / debrief
      ShiftBoardScreen.tsx      Focus + ambient case cards, clock controls, live shift log
      ShiftHubScreen.tsx        Phaser department view with the walkable avatar
      EpisodeDebriefScreen.tsx  Whole-shift debrief + XP awarding
    ecg/
      EcgChallengeScreen.tsx    Daily ECG (3-step wizard)
    progression/
      SkillTreeScreen.tsx       XP, SLO mastery, perks
  style/
    palette.ts                  Locked colour ramps (mirrors Claude Design v1)
    sprites.ts                  Pixel-art sprite engine + Beth state set
    icons.tsx                   8 16×16 pixel-art status icons
    frames.tsx                  Clipboard, Monitor, VitalsStripFrame, DrugChart, ResultsEnvelope
  game/
    boot.ts                     Phaser entry — dynamically imported
    layout.ts                   Pure data: ED zones, palette (mirrors style/palette), canvas dims
    scenes/
      EDScene.ts                Top-down department + avatar + proximity interact (M17)
  sim/
    kernel.ts                   Pure deterministic simulation kernel (no React)
    vitals.ts                   RCP NEWS2 + deriveVitals(state, authored)
    audio.ts                    Web-Audio monitor beep
  state/
    sim.ts                      Zustand wrapper + useRealTimeClock + scoreCase/Episode
    progression.ts              Cross-shift XP + perks (localStorage)
  content/
    schema.ts                   Zod schemas (case · episode · arc · vitals · sequence)
    loader.ts                   Node-side YAML walker (CLI validator)
    validator.ts                Schema + cross-ref validation
    ecg-challenges.ts           Daily ECG bank (11 challenges)

content/
  cases/                        16 authored case YAMLs
  episodes/                     15 authored episode YAMLs
  arcs/                         2 authored arc YAMLs
  sources/                      Source summaries (RCEM curriculum etc.)
  topic-map.yaml                High-yield topic map (RCEM 2021 calibration)

scripts/                        validate-content / new-case / new-episode CLIs
tests/                          Vitest specs (22 files, 257 tests)
e2e/                            Playwright spec (2 tests)
.github/workflows/ci.yml        CI: typecheck → lint → format → validate → test → build → e2e
```

## Repository conventions

- `CHANGELOG.md` — one-liner per change, newest first.
- `DECISIONS.md` — architectural call per ID (D-001..), with open questions.
- Each clinical fact in a Case YAML must carry an inline citation. Unsourced
  facts → `# TODO: verify` rather than guessing.
- Run `npm run validate-content` before committing content changes.
- See `the-skitt-claude-code-prompt.md` for the canonical build brief.

## Play

1. `npm install && npm run dev`
2. http://localhost:5173
3. Pick "The hen-do" from the shift menu.
4. Press ▶ start, work the cases on the board.
5. End shift → episode debrief with banded score and examiner notes.

Shift speed defaults to 1 sim-min per 3 real-sec → 20-min shift in 60
real-sec. Tunable in `src/state/sim.ts`.

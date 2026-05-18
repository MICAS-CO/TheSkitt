# Changelog

Format: one line per change, newest first.

## [Unreleased]

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

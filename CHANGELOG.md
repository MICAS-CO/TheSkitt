# Changelog

Format: one line per change, newest first.

## [Unreleased]

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

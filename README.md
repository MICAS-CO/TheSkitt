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

Numbers: **257 unit tests · 2 E2E · 16 cases · 15 episodes · 2 arcs ·
11 daily ECGs**. Lint clean, typecheck clean, validator green.

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

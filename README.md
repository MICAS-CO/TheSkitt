# The Skitt

Episodic, story-driven emergency medicine RPG. A study tool for UK FRCEM
candidates (Intermediate SAQ → Final SAQ/SBA).

> **Not medical advice.** Not a substitute for supervised clinical training.
> Clinical content is study material grounded in UK guidelines (NICE, RCEM,
> Resuscitation Council UK, BTS/SIGN, RCOG, JBDS, TREND-UK) with inline
> citations on every clinical claim.

## Status

All eight build-prompt milestones landed on `claude/add-necessary-files-4THUA`:

| #   | Milestone               | What it ships                                                                       |
| --- | ----------------------- | ----------------------------------------------------------------------------------- |
| 1   | Scaffold                | Vite + TS + React 19 + Phaser 3, ESLint flat, Prettier, Vitest, "Hello, ED" scene   |
| 2   | Schemas + validator     | Zod schemas for Case/Episode/Arc/ScheduledEvent/Citation + `validate-content` CLI   |
| 3   | First playable case     | Adult anaphylaxis end-to-end (Resus Council UK 2021 + NICE CG134)                   |
| 4   | Simulation kernel       | Pure deterministic kernel + shift clock + scheduled events + state machines         |
| 5   | Second case + arc       | Ectopic pregnancy in minors (NICE NG126 + RCOG GTG 21) + hen-do shared-incident arc |
| 6   | Episode debrief         | Banded overall score, lives saved/lost, examiner notes, source aggregation          |
| 7   | Content CLI             | `new-case` + `new-episode` generate skeleton YAMLs from `topic-map.yaml`            |
| 8   | Ambient board (stretch) | Two ambient cases (Stan, Mrs Patel) — four time-critical events on one clock        |

Plus: Playwright E2E smoke, GitHub Actions CI, code-split Phaser
(~1.5 MB lazy-loaded), `:focus-visible` a11y, 600-px mobile breakpoint.

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
  App.tsx                       Menu router (menu | shift | hub)
  main.tsx                      React entry
  styles.css                    Global + encounter + board + debrief styles
  ui/
    PhaserGame.tsx              Mounts Phaser via dynamic import
    encounter/
      EncounterScreen.tsx       Per-case 8-phase UI (vignette → debrief)
    shift/
      ShiftView.tsx             Routes between board / encounter / debrief
      ShiftBoardScreen.tsx      Focus + ambient case cards, clock controls, live shift log
      EpisodeDebriefScreen.tsx  Whole-shift debrief with examiner notes
  game/
    boot.ts                     Phaser entry — dynamically imported
    layout.ts                   Pure data: ED zones, palette, canvas dims (testable)
    scenes/
      EDScene.ts                Top-down placeholder department layout
  sim/
    kernel.ts                   Pure deterministic simulation kernel (no React)
  state/
    sim.ts                      Zustand wrapper + useRealTimeClock + scoreCase/Episode
  content/
    schema.ts                   Zod schemas
    loader.ts                   Node-side YAML walker (CLI validator)
    validator.ts                Schema + cross-ref validation

content/
  cases/                        Authored case YAMLs
  episodes/                     Authored episode YAMLs
  arcs/                         Authored arc YAMLs
  sources/                      Source summaries (RCEM curriculum etc.)
  topic-map.yaml                High-yield topic map (RCEM 2021 calibration)

scripts/                        validate-content / new-case / new-episode CLIs
tests/                          Vitest specs
e2e/                            Playwright spec
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

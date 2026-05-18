# The Skitt

Episodic, story-driven emergency medicine RPG. A study tool for UK FRCEM
candidates (Intermediate SAQ → Final SAQ/SBA).

> **Not medical advice.** Not a substitute for supervised clinical training.
> Clinical content is study material grounded in UK guidelines (NICE, RCEM,
> Resuscitation Council UK) with inline citations.

## Status

Milestone 1 — project scaffold. Vite + TypeScript + React + Phaser 3 boot
into a "Hello, ED" placeholder department layout. No cases, no shift clock,
no schemas yet. See `CHANGELOG.md` and the [build prompt](./the-skitt-claude-code-prompt.md)
for the roadmap.

## Stack

- **Vite + TypeScript** — build/dev
- **React 19** — menus, debrief, study UI
- **Phaser 3** — game layer (top-down ED), mounted inside a React component
- **Vitest** — unit / pure-logic tests
- **ESLint (flat config) + Prettier** — lint and format
- Content (planned, Milestone 2): YAML files under `content/`, validated with Zod

## Develop

Requires Node 20+ (Node 22 recommended; see `.nvmrc`).

```bash
npm install        # or pnpm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run test
npm run lint
npm run format
npm run build      # production bundle to dist/
npm run preview    # preview built bundle
```

## Layout

```
src/
  App.tsx                     React shell
  main.tsx                    React entry
  styles.css                  Global styles
  ui/
    PhaserGame.tsx            Mounts Phaser inside a React ref'd div
  game/
    config.ts                 Phaser game config factory
    layout.ts                 Pure data: zones, palette, canvas dims (testable)
    scenes/
      EDScene.ts              "Hello, ED" placeholder department layout

content/                      Cases / episodes / arcs / sources (Milestone 2+)
tests/                        Vitest specs
```

## Repository conventions

- `CHANGELOG.md` — one-liner per change.
- `DECISIONS.md` — fuller note per architectural call, with open questions.
- Each milestone is stopped on for review before continuing.
- See `the-skitt-claude-code-prompt.md` for the canonical build brief.

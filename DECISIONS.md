# Decisions

Architectural notes and explicit trade-offs. Newest first.

---

## D-001 · Stack: Vite + TS + React 19 + Phaser 3 (Milestone 1)

**Date:** 2026-05-18

Adopted the stack proposed in the build prompt without modification. Brief
justification:

- **Phaser 3** is the best-supported HTML5 game engine for 2D scenes; mature,
  documented, and matches the "higher-res pixel art" target. Lighter
  alternatives (raw Canvas / PixiJS) push too much scene-graph plumbing onto us.
- **React** owns menus, debrief, study material, dialogue panes — everything
  that benefits from declarative trees and form state. Phaser owns the
  spatial/animated game layer.
- **Vite + TS** is the default for new TS/React projects; HMR is fast,
  config is minimal.
- **Single app, Phaser mounted in a React component** keeps deployment
  simple (one static bundle to Cloudflare/Vercel) and avoids cross-frame
  state plumbing.

State management (Zustand) and content stack (Zod + YAML) are deferred to
Milestone 2 where they are first needed. Adding them now would be
speculative.

## D-002 · ESLint flat config; Prettier separate

**Date:** 2026-05-18

Using the ESLint 9 flat config (`eslint.config.js`) and `typescript-eslint`
v8. Prettier is kept separate from ESLint (no `eslint-plugin-prettier`) to
avoid the perf/conflict tax — formatting via `npm run format`, lint via
`npm run lint`.

## D-003 · Phaser game lifecycle inside React

**Date:** 2026-05-18

`PhaserGame.tsx` creates `new Phaser.Game(...)` in `useEffect` against a
ref'd `<div>` and calls `game.destroy(true)` on cleanup. A guard prevents a
second game instance when StrictMode double-invokes effects in dev.

## D-004 · Pure layout data extracted from the scene

**Date:** 2026-05-18

`src/game/layout.ts` exports `GAME_WIDTH`, `GAME_HEIGHT`, `PALETTE`, and
`ED_ZONES` as plain TS, with `EDScene` consuming them. This lets us unit-test
layout invariants (no overlaps, in-bounds, unique ids) without spinning up
Phaser in jsdom, which is brittle. The same pattern will apply to case data
in Milestone 2.

## D-005 · Vitest for unit; Playwright deferred

**Date:** 2026-05-18

Milestone 1 ships one Vitest unit smoke (`tests/layout.test.ts`). Playwright
is deferred to whenever we first have an interaction worth E2E-asserting
(probably Milestone 3, end of first playable case).

---

# Open questions

## Q-001 · PDFs at repo root

The repo root currently contains five book/curriculum PDFs whose filenames
identify them as z-library scans:

- `Case Studies in Emergency Medicine ... (z-library.sk, 1lib.sk, z-lib.sk)-compressed.pdf`
- `Emergency Medicine Case-Based Guide Obstetric Emergencies ... (z-library.sk, ...).pdf`
- `Oxford Handbook Of Emergency Medicine ... (z-library.sk, ...).pdf` (25 MB)
- `RCEM-Emergency-Medicine-Training-Curriculum-...-Final (1).pdf` (×2 copies)

Concerns:

1. **Copyright.** The Wenzel, Kosoko, and Wyatt/Taylor texts are commercial
   books. The z-library provenance suggests they were obtained outside
   normal licensing. Hosting them on GitHub is a different exposure than
   reading them locally (DMCA takedown, account risk).
2. **Repo weight.** ~32 MB committed at root; the Oxford Handbook alone is
   25 MB. Every clone pays this cost forever.
3. **RCEM curriculum** is openly published by RCEM and the duplicate
   `(1)` files are redundant.

**Recommendation (not yet acted on):**

- Move all four book PDFs into a local-only `sources-local/` directory that is
  `.gitignore`d (already added to `.gitignore`). Replace with citation links
  in `content/sources/` summaries. Acquire legitimate copies via
  institutional access for personal reading.
- Keep ONE copy of the RCEM curriculum (it's openly licensed by RCEM) but
  consider linking to the canonical URL on rcem.ac.uk instead of vendoring.
- Purging from git history is a separate `git filter-repo` / BFG operation —
  do not undertake without explicit confirmation as it rewrites history.

**Status:** awaiting decision. No destructive action taken.

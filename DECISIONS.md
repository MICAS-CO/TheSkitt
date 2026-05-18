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

## D-006 · Case schema mirrors the Kosoko chapter structure

**Date:** 2026-05-18

Kosoko (Obstetric Emergencies Case-Based Guide, Springer 2024) uses a strict
per-chapter template — Case vignette → Past Hx → Meds/Allergies/Soc Hx →
Physical Exam → Pertinent Diagnostic Tests → Differential → Working Diagnosis
→ Management → Clinical Pearls — that is also how the RCEM SAQ format expects
trainees to think (history → exam → ix → ddx → mx → debrief). The Milestone 2
`Case` Zod schema will mirror this 1:1. Acceptance check: every Kosoko chapter
must be re-expressible as a Case YAML without information loss.

Additional required fields per build prompt §"Content model" — `curriculum_tags`
(RCEM Clinical Syllabus codes), `slos` (1–12), `difficulty_band`
(CT1/CT2/ST3/ST4–6), `sources` (typed citations), `pearls`, `pitfalls`,
`state_machine` (stable/deteriorating/arrested/discharged/admitted with time-
and-action transitions).

## D-007 · First end-to-end case is anaphylaxis

**Date:** 2026-05-18

Picking anaphylaxis (codes RP2, AP1, AP2, AC1; SLOs 1, 3, 5) for the Milestone
3 playable case. Rationale captured in `content/topic-map.yaml`
`recommended_first_case`. Short version: cleanest end-to-end loop, single
protocolised pathway (Resus Council UK 2021), adult and paeds variants share
the same algorithm, strong examiner-trap material (biphasic reactions,
upright-posture arrest per Pumphrey, ACE-I bradykinin angioedema mimic).

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

**Status:** under user management (per 2026-05-18 direction "I'll delete or
move once you've finished processing them, let me worry about that").
Claude has read the four book PDFs and the curriculum for topic calibration
and source summaries (`content/sources/`) without reproducing substantive
text. Once user moves/deletes the PDFs, the repo `.gitignore` already
excludes `sources-local/` and `*.pdf` for the prettier config.

## Q-002 · GitHub push permission

The Claude integration backing this session lacks `contents: write` on
`MICAS-CO/TheSkitt`. Both `git push` via the local proxy and
`mcp__github__push_files` / `create_branch` return HTTP 403. The user
precreated the working branch `claude/add-necessary-files-4THUA` on
2026-05-18, which removed the need for `create_branch` but did **not**
restore push permission. Until the integration's repo permissions include
`contents: write`, work on this branch cannot land on GitHub.

**Status:** awaiting permission grant. Commits accumulate locally.

# Decisions

Architectural notes and explicit trade-offs. Newest first.

---

## D-012 · Simulation kernel is a plain TS class; React subscribes via tick counter

**Date:** 2026-05-18

`SimKernel` in `src/sim/kernel.ts` is a plain TS class — no React, no
Zustand, no Phaser dependencies. Its single mutable field is the
`KernelState` object; `subscribe(fn)` adds the fn to a Set of listeners
that are called on every state change.

React integration in `src/state/sim.ts` is deliberately minimal:

```
useSim store {
  kernel: SimKernel | null,
  unsub: (() => void) | null,
  tick: number,
}
```

When `init(kernel)` is called, the store subscribes to the kernel and
increments `tick` on each notification. Components depend on `tick` via
`useSim(s => s.tick)` to force re-render, then read state imperatively
via `kernel.getState()`. This is simpler than mirroring the entire
`KernelState` into Zustand (which would require shallow-copying Sets
and Maps on every change) and avoids `useSyncExternalStore` selector
memoization tax.

Trade-off: any selector tied to a slice of kernel state will re-render
on every tick. Acceptable for Milestone 4 with one case; if it becomes
a perf issue in later milestones, switch to `useSyncExternalStore` with
per-slice snapshots.

## D-013 · Kernel always advances in whole minutes

**Date:** 2026-05-18

`kernel.advance(deltaMin)` accepts fractional minutes but the React
real-time clock (`useRealTimeClock`) only ever calls it with integers.
Two reasons:

1. Scheduled events have integer `t_min` in the schema. Mixing integer
   event times with sub-minute clock ticks invites off-by-one bugs in
   the "fires in `(current, target]`" window logic.
2. Tests stay readable: `advance(5)` "now T+5m" is more legible than
   `advance(5.0001)`.

If a future mechanic needs sub-minute resolution (e.g. defibrillation
sequencing, RSI countdown), we'll introduce a `tickSeconds` API rather
than relaxing this. The schema's `turnaround_min` and `t_min` remain
the unit of currency.

## D-014 · Logical clock, not wall clock

**Date:** 2026-05-18

The kernel never reads `Date.now()` or `performance.now()`. All time
flows through `kernel.advance(deltaMin)`. The `useRealTimeClock` hook
is the only thing that converts real-world milliseconds into kernel
minutes, and it lives in the React adapter, not the kernel.

This gives us:

- Deterministic replay (drive a kernel by recorded `advance` calls and
  player actions → identical state).
- Trivial fast-forward in tests (just call `advance(100)`).
- A clean future path to deterministic multiplayer / replays.

The kernel does NOT own its own `setInterval` or `requestAnimationFrame`
loop — that responsibility lives at the React boundary so the kernel
remains a pure function over (state, input) → state.

## D-010 · Encounter scorer is a pure function; Zustand only holds state

**Date:** 2026-05-18

`scoreEncounter(state)` in `src/state/encounter.ts` is a pure function over
the case data and the player's choices. It is exported separately from the
Zustand store so the debrief can re-compute the report deterministically
and tests can drive it without React. The Zustand store only owns the
record of player choices; it never holds derived state.

Score formula (Milestone 3 — deliberately simple, expected to evolve):

```
score = (mustDo_hit / mustDo_total) * 70
      + (workingDxCorrect ? 15 : 0)
      + (dispositionCorrect ? 15 : 0)
      - (mustNotDo_picked * 20)
clamp to [0, 100]
```

Any `must_not_do` action automatically downgrades the band to `unsafe`
regardless of percentage. This matches the SAQ examiner instinct of "one
unsafe answer fails the station". Will refine in Milestone 6 (proper
debrief & scoring) once we have more cases to calibrate against.

## D-011 · Browser YAML loading via Vite `?raw`

**Date:** 2026-05-18

The encounter UI imports case YAMLs as raw strings at build time:

    import yamlText from '../../content/cases/foo.yaml?raw';

Vite bundles them into the JS output. Pros: no runtime fetch, no path
resolution issues, types stay tight via `vite/client`. Cons: each case
ships in the main bundle today — fine for Milestone 3 (one case) but
will need dynamic `import()` once we have multiple cases or any size
pressure.

`src/content/runtime.ts` exists separately from `src/content/loader.ts`
because the latter uses `node:fs` (CLI validator only) and would fail
in the browser. They share `src/content/schema.ts` as the single source
of truth.

## D-008 · Zod + YAML for content; one schema file, no codegen

**Date:** 2026-05-18

Adopted the stack proposed in the build prompt (Zod for runtime validation,
YAML for human-friendly authoring). Schemas live in a single
`src/content/schema.ts` rather than split per entity, because all the entity
schemas reference shared primitives (`CurriculumCode`, `Citation`,
`CaseState`, `ScheduledEvent` variants) and split files added import
cyclomania without real benefit at this size.

**No codegen** (no `zod-to-json-schema`, no generated TypeScript from a
separate IDL). Zod is the single source of truth; TypeScript types are
inferred via `z.infer<typeof X>`. If a future consumer needs JSON Schema
(e.g. IDE YAML completion), generate it from the Zod schemas at that point.

**Discriminated unions** are used heavily — `Citation` discriminates on
`type`, `ScheduledEvent` on `type`, `TransitionTrigger` on `on`,
`ArcRevealTrigger` on `on`. This catches authoring mistakes early (e.g. a
`results_back` event missing `case_id` fails parse, not at runtime).

**Citation taxonomy** enumerates real UK guideline bodies (NICE, NICE CKS,
RCEM, Resus Council UK, BTS-SIGN, RCOG, BSPED, JBDS, TOXBASE, ESC, Renal
Assoc, RCPCH, RCP, NHS, legislation, textbook, trend_uk, other). New types
require a deliberate schema edit — prevents drift into vague citations.

**Curriculum code regex** enumerates real RCEM Clinical Syllabus prefixes
from the 2021 v1.5 syllabus. Catches typos. Will need bumping if RCEM adds
new system prefixes in a future curriculum version; cost is small.

## D-009 · Validator does two passes: schema then cross-ref

**Date:** 2026-05-18

`src/content/validator.ts` runs two phases:

1. **Per-file schema validation** with Zod's `safeParse`. Errors are
   collected per file with the JSON-pointer-style path so authors can
   navigate straight to the problem field.
2. **Cross-reference resolution** once all files are parsed — episode
   `focus_cases` / `ambient_cases` / `arcs` references must resolve to
   real case/arc files; arc `cases` and `reveals[].in_case_id` must
   resolve too; scheduled events that name a `case_id` or `arc_id`
   must resolve.

Duplicate ids across files are caught in phase 1 by maintaining a
`Map<id, file>` per entity bucket.

Validator returns a `ValidationReport` (errors, warnings, counts) so the
same logic can drive the CLI today and a Milestone-7 authoring TUI later
without re-implementing.

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

## Q-001 · PDFs at repo root — RESOLVED 2026-05-18

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

**Resolution.** On user direction, all five PDFs were removed from the
working tree via `git rm` in this commit. Topic calibration and source
summaries (`content/sources/rcem-curriculum-2021.md`,
`rcem-clinical-syllabus-codes.md`, `source-books.md`) were authored
beforehand from the PDFs without reproducing substantive text. The
RCEM curriculum is openly published at https://rcem.ac.uk; the three
book sources are cited in `source-books.md` for replacement via
legitimate institutional access. Add the `*.pdf` glob to `.gitignore`
to keep future binary uploads out of git.

**Git history note.** The PDFs remain in git history (this commit just
removes them from HEAD). A full purge would require `git filter-repo`
or BFG which rewrites history and requires force-push — that's still
gated behind explicit user confirmation if/when needed. For
DMCA-defensible removal, history rewrite is the right tool; for repo
weight, the removal from HEAD is sufficient (clones can use
`--depth 1` to skip history).

## Q-002 · GitHub push permission — RESOLVED 2026-05-18

Permission was granted by the user; first successful push at commit
`9852114` (the Content survey commit), and all subsequent pushes have
succeeded.

## Q-003 · RCEMLearning credentials disclosed in chat — USER ACTION

The user pasted `mohammed.hamza@outlook.ie` / `mohm4216` into chat
history on 2026-05-18. Claude did not use these (per build-prompt
"no paywall workarounds" rule). User responsibility to rotate.
Not a Claude-side action item; recorded here for traceability.

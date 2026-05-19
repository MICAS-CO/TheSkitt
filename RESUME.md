# Resume — current state

Last activity: 2026-05-19 ~07:20 UTC. Branch
`claude/add-necessary-files-4THUA` is at **51 commits** total.

## ⏸ WAITING ON USER FEEDBACK

**Status**: user has played the single-file HTML build and reported
that **"game mechanics feel like work rather than an educational
RPG"**. A full written feedback report is incoming.

**Next session: do NOT make changes until the user's report arrives.**
Read the report in full, then plan changes before touching code.
Likely scope (per the build prompt's RPG framing) covers:

- Narrative/dialogue depth — current dialogue is flat (topic →
  single response). The build prompt's "history tree" model is
  unimplemented; this is the most-likely culprit for "feels like work".
- Encounter UX flow — 8-phase forced linear progression
  (vignette → history → exam → ix → diff → mx → disposition → debrief).
  May feel checklist-y vs exploratory.
- Pacing — the clock pressure may be misaligned with learning intent.
- Feedback / reward loops — scoring is end-of-shift; in-the-moment
  feedback is minimal.
- Setting / character voice — vignettes are tight but may be too
  clinical-summary, not immersive.

Hold all design changes until the user has weighed in. The clinical
content + tech foundation are solid; the question is the game shell.

## Recently shipped (since last RESUME refresh)

- **TheCase.Report integration** — full episode index +
  verification patches + 11 topic-map entries.
- **5 new Tier-1 cases**: aortic dissection (Okafor), variceal UGIB
  (Kowalski), massive PE (Okonkwo), acute heart failure (Ahmed),
  hypertensive emergency (Oduya).
- **2 comprehensive audit passes** (subagent-driven, second one
  with web-search guideline-currency verification) — 28+ clinical
  accuracy fixes across all 15 cases.
- **State-machine reachability test** — caught 4 dead-end-state
  authoring bugs across older cases (Patel, Sarah, Brennan, Stan);
  all backfilled.
- **Simplify pass** — −189 lines, shared ClockBar, pickCardClass(),
  CSS variable for danger-strong, data-driven SHIFT_DEFS.
- **Single-file HTML build target** — `npm run build:single-file`
  produces a 2.3 MB self-contained index.html. Currently in user's
  hands for testing.

## Numbers

- **192 / 192** unit tests passing (Vitest)
- **2 / 2** E2E tests passing (Playwright)
- **15 fully-authored cases**, **14 episodes**, **2 arcs**, 44-topic
  high-yield map
- All clinical content cites current UK guidelines as of May 2026
  (NICE NG253 sepsis, NICE NG106 2025 update, NICE TA990 tenecteplase,
  NICE NG217 Jan 2025 update, NICE NG126 May 2026 anti-D update,
  Baveno VII 2022 pre-emptive TIPS, MHRA 2024 EpiPen 25 kg threshold,
  TA697 superseded for ICH by TA1029 Jan 2025)

## Cases on the menu (14 shifts)

1. **The hen-do** (ST3, 4 cases + 1 arc) — Beth + Sarah + Stan + Patel
2. **Family anaphylaxis — adult + paeds** (ST3, 2 cases + 1 arc) — Beth + Sam
3. **Overnight: metabolic resus** (ST3, 2 cases) — Marcus DKA + Morrison sepsis
4. **Overnight: sepsis solo** (CT2) — Morrison
5. **Stroke onset — thrombolysis window** (CT2) — Williams (LMCA on apixaban)
6. **First seizure — status pathway** (ST3) — Priya (status + SAH twist)
7. **Head injury — DOAC reasoning** (CT2) — Brennan (fall on apixaban)
8. **DOAC double-bill — clot and bleed** (ST3, 2 cases) — Williams + Brennan
9. **Aortic dissection — the anchor-breaker** (ST3) — Okafor
10. **Variceal UGIB — Sepsis Six of the liver** (ST3) — Kowalski
11. **Massive PE — shock and the thrombolysis decision** (ST3) — Okonkwo
12. **Acute heart failure — pre-op diuretic-hold decomp** (ST3) — Ahmed
13. **Hypertensive emergency — controlled BP reduction** (CT2) — Oduya
14. **Anaphylaxis solo** (CT2) — Beth (milestone-4 build)

Plus the ED hub layout preview (Phaser placeholder).

## Build targets

```bash
npm run dev               # dev server (http://localhost:5173)
npm run build             # multi-file static (for hosting)
npm run build:single-file # → dist/index.html, 2.3 MB self-contained
                          # (opens directly from file:// — no install)
npm test                  # 192 unit tests
npm run validate-content  # YAML schema + cross-reference + reachability
```

## Open user items (pre-existing)

1. **Q-001 PDFs** — removed from HEAD; blobs remain in git history.
   Full purge needs `git filter-repo` + force-push; gated.
2. **Q-003 RCEMLearning credentials** — `mohm4216` in chat history.
   Please rotate.
3. **License** — no `LICENSE` file.

## Architectural reminders

- Kernel is pure deterministic TS; React subscribes via `tick`
  counter. Kernel never reads wall time.
- Whole-minute advance only (D-013).
- Save/resume snapshots versioned at `v: 1`; episode identity checked
  on restore.
- Per-case phase memory in `ShiftView`'s `phases` map.
- **`SHIFT_DEFS` in `src/App.tsx`** is the single source of truth
  for the menu — adding a shift is one array entry.
- Shared `ClockBar` (`src/ui/shift/ClockBar.tsx`) used by encounter
  / board / hub screens.
- Schema-level state-machine reachability is enforced by
  `tests/state-machine-reachability.test.ts`.
- `case-playable.test.ts` validates every case is winnable via
  must_do + top differential + appropriate disposition.

## First three commands on resume

```bash
git fetch origin claude/add-necessary-files-4THUA
git checkout claude/add-necessary-files-4THUA
npm ci
```

Then **WAIT** for the user's game-feel feedback report before
designing changes. Read it carefully — they explicitly said this
needs to feel like an RPG, not work.

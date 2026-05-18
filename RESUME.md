# Resume — current state

Last activity: 2026-05-18 ~20:00 UTC. All eight build-prompt milestones
shipped on `claude/add-necessary-files-4THUA`. Continued autonomously
into post-milestone polish per user direction ("keep going with
everything you need to do … I'll be at my pc in the morning").

---

## What's done

### Build-prompt milestones (all 8)

| #   | Milestone                               | Commit                |
| --- | --------------------------------------- | --------------------- |
| 1   | Scaffold                                | `287e00b`             |
| 2   | Schemas + validator                     | `9852114` + `849038c` |
| 3   | First playable case (adult anaphylaxis) | `7bc9833`             |
| 4   | Simulation kernel + shift clock         | `372db78`             |
| 5   | Second case (ectopic) + hen-do arc      | `5ebf880`             |
| 6   | Episode-level debrief & scoring         | `43bc389`             |
| 7   | Content CLI (new-case + new-episode)    | `a7cc0fa`             |
| 8   | Ambient board pressure (stretch)        | `875b4cd`             |

### Post-milestone polish

- `2a6f321` Code-split Phaser; CI workflow; mobile + a11y pass.
- `b462621` Playwright E2E smoke; CI runs it.
- `11031be` Docs refresh (README / DECISIONS / RESUME).
- `dac02be` Save/resume to localStorage.
- `f26b38e` Sim-speed selector, spacebar pause, ARIA-live shift log.
- `0ac1cd3` Sepsis case + sepsis-solo shift (M7 CLI round-trip proof).
- `0583e85` Better next-button labels + Escape returns to board.

### Numbers

- **111 / 111** unit tests passing (Vitest).
- **1 / 1** E2E test passing (Playwright, prod preview).
- Initial JS bundle: 479 KB (gzip 145 KB). Phaser lazy-loaded
  (~1.5 MB chunk, only downloads when ED hub opens).
- Content: **7 cases**, **4 episodes**, **2 arcs**, 27-topic high-yield map.
- All authored clinical content cites UK guidelines inline.

### Play it (morning checklist)

```bash
git fetch origin claude/add-necessary-files-4THUA
git checkout claude/add-necessary-files-4THUA
npm ci
npm run dev    # → http://localhost:5173
```

Shifts on the menu (all on the same clock):

1. **The hen-do** (ST3, 20 min, 2 focus + 2 ambient + 1 arc). The
   milestone-5/8 build. Four time-critical events on one shift clock.
2. **Overnight: sepsis solo** (CT2, 20 min, 1 case). Sepsis Six
   bundle, NICE NG51. Authored via the M7 CLI.
3. **Anaphylaxis solo** (CT2, 20 min, 1 case). The milestone-4 build.

Controls: ▶/❚❚, +1m, speed selector (0.5×/1×/2×/4×). Spacebar toggles
play/pause. Escape returns to the shift board. Auto-save persists every
action to localStorage; a "Resume" banner shows on the menu if you
reload mid-shift.

---

## Open user items

1. **Q-001 PDFs** — removed from HEAD; the blobs remain in git history.
   A full purge needs `git filter-repo` + coordinated force-push; gated
   behind explicit confirmation.
2. **Q-003 RCEMLearning credentials** — `mohm4216` is in chat history.
   Please rotate.
3. **License** — no `LICENSE` file. Probably `proprietary, all rights
reserved` given that the topic-map cites commercial textbooks.

---

## Where to pick up

In rough priority order:

1. **Hub → encounter wire-up.** The Phaser ED scene is still a passive
   placeholder. Make the resus/minors/paeds zones clickable; click a
   bay → enter the relevant case via the same `kernel.enterCase()`. Will
   need a `bay`/`zone` field on Case (or inferred from triage) plus a
   Phaser → React click bridge.
2. **More cases.** The topic-map has 21 untouched Tier-1/2/3 topics.
   The new-case CLI makes authoring quick — STEMI, DKA, status
   epilepticus, head injury, asthma exacerbation are all natural next
   choices and share the existing case shape.
3. **Topic-map cleanup.** Several topic entries cite NICE guidelines
   with `id` but no `ref` text; the CLI works around this with a TODO
   placeholder. Cleaner data → cleaner skeletons.
4. **LLM-driven flavour dialogue** (build prompt explicitly defers
   to "after the scripted experience is solid" — we are now there).
   Boundaries: never on critical clinical path; mood/voice only.
5. **Accessibility audit** beyond the first pass (full keyboard
   reachability, contrast for every state chip, screen-reader tour).
6. **Bundle further** — Phaser is 1.5 MB; vendoring only modules in use
   could halve it.

---

## Architectural reminders

- Kernel is pure deterministic TS. React only subscribes via the `tick`
  counter and reads imperative state. The kernel never reads wall
  time — all time flows through `kernel.advance(deltaMin)`.
- Whole-minute advance only (D-013). Sub-minute mechanics would need a
  `tickSeconds` API, not a relaxation.
- Save/resume snapshots versioned at `v: 1`; episode identity is
  checked on restore. If the schema evolves, bump `v` and write a
  migration.
- Per-case phase memory lives in `ShiftView`'s `phases` map, not in
  the kernel — phase is UI navigation, not simulation state.

## First three commands on resume

```bash
git fetch origin claude/add-necessary-files-4THUA
git checkout claude/add-necessary-files-4THUA
npm ci
```

Then `npm run dev`, pick a shift, and start playing. The hen-do shift
is the showcase.

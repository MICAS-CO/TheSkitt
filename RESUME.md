# Resume — current state

Last activity: 2026-05-19 ~06:15 UTC. All 8 build-prompt milestones plus
substantial post-milestone content + refactor + audit work shipped on
`claude/add-necessary-files-4THUA`. The branch is now **46 commits** in
total. Latest work since last RESUME refresh:

- TheCase.Report (TCR) podcast integration — full episode index +
  verification patches + 11 new topic-map entries.
- 4 new Tier-1 cases authored: aortic dissection (Okafor),
  variceal UGIB (Kowalski), massive PE (Okonkwo), acute heart
  failure (Ahmed).
- Audit pass on the 3 newest cases caught 10+ clinical accuracy
  issues — fixed in commit `3cabc9c`.
- Simplify-pass code refactor — net −189 lines, shared `ClockBar`
  component, `pickCardClass()` helper, `--danger-strong` CSS
  variable, `checkRevealRef()` validator helper.
- Data-driven `SHIFT_DEFS` array — MenuView dropped from 16 props
  to 6; adding a new shift is now a single array entry.

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

### Numbers

- **159 / 159** unit tests passing (Vitest).
- **2 / 2** E2E tests passing (Playwright; menu → board → encounter,
  board ↔ hub toggle).
- **14 fully-authored cases**, **13 episodes**, **2 arcs**, 44-topic
  high-yield map (11 added from TCR).
- All clinical content cites UK guidelines (NICE, RCEM, Resus Council
  UK, BTS-SIGN, RCOG, ESC, JBDS, BSG, Cochrane) plus published RCTs
  (3CPO, HALT-IT, Villanueva NEJM, ADJUST-PE, etc.) inline.
- Initial JS bundle: ~650 KB (gzip ~195 KB). Phaser lazy-loaded
  (~1.5 MB chunk, only on the ED hub).

### Cases on the menu (13 shifts)

1. **The hen-do** (ST3, 4 cases + 1 arc) — Beth + Sarah + Stan +
   Patel. Anaphylaxis + ectopic + frequent flyer + STEMI on one clock.
2. **Family anaphylaxis — adult + paeds** (ST3, 2 cases + 1 arc) —
   Beth + Sam, parallel dose bands.
3. **Overnight: metabolic resus** (ST3, 2 cases) — DKA + urosepsis.
4. **Overnight: sepsis solo** (CT2) — Morrison urosepsis + delirium.
5. **Stroke onset — thrombolysis window** (CT2) — Williams LMCA on
   apixaban.
6. **First seizure — status pathway** (ST3) — Priya status, pregnant,
   CT-SAH twist.
7. **Head injury — DOAC reasoning** (CT2) — Brennan fall on apixaban.
8. **DOAC double-bill — clot and bleed** (ST3, 2 cases) — Williams +
   Brennan together (reperfusion vs reversal).
9. **Aortic dissection — the anchor-breaker** (ST3) — Okafor Type A
   masquerading as inferior STEMI.
10. **Variceal UGIB — Sepsis Six of the liver** (ST3) — Kowalski
    Child-Pugh C cirrhotic, terlipressin + ceftriaxone bundle.
11. **Massive PE — shock and the thrombolysis decision** (ST3) —
    Okonkwo post-op + COCP, bedside echo pivot.
12. **Acute heart failure — pre-op diuretic-hold decomp** (ST3) —
    Ahmed wet-and-warm pulmonary oedema, CPAP-first.
13. **Anaphylaxis solo** (CT2) — milestone-4 build, Beth.

Plus the ED hub layout preview (Phaser placeholder).

### TheCase.Report integration

- Full episode index (~64 episodes S1–S6) captured in
  `content/sources/tcr-podcast.md` with deep-read clinical pearls
  from 10 strategic episodes.
- 11 new topic-map entries surfaced by TCR are scaffoldable via
  `pnpm new-case --topic <id>`: upper_gi_bleed, acute_heart_failure,
  hypertensive_emergency, tca_overdose, perimortem_caesarean,
  posterior_circulation_stroke, delirium_geriatric,
  chest_trauma_blunt, liver_cirrhosis_decompensated, nof_geriatric,
  hypothermia_drowning.
- Verification patches applied: Williams gains a posterior-stroke /
  HINTS pearl, Morrison gains a 4AT delirium screen + hypoactive
  pearl, Patel gains AD mortality / 20%-normal-CXR pearls.

### Play it (morning checklist)

```bash
git fetch origin claude/add-necessary-files-4THUA
git checkout claude/add-necessary-files-4THUA
npm ci
npm run dev    # → http://localhost:5173
```

**Controls**:

- ▶ / ❚❚ start/pause (spacebar shortcut)
- +1m skip
- 0.5× / 1× / 2× / 4× speed selector (persists)
- Escape returns to shift board
- Auto-save persists every action to localStorage
- "Resume" banner on menu now shows the **episode title** (not
  the raw id)
- "↥ department view" toggle on board → Phaser hub with clickable
  patient cards
- "↻ play this shift again" button on the episode debrief
- Disposition / differential pickers no longer leak the answer —
  rationale is revealed only after the player commits a choice

---

## Open user items

1. **Q-001 PDFs** — removed from HEAD; the blobs remain in git
   history. A full purge needs `git filter-repo` + coordinated
   force-push; gated behind explicit confirmation.
2. **Q-003 RCEMLearning credentials** — `mohm4216` is in chat
   history. Please rotate.
3. **License** — no `LICENSE` file. Probably `proprietary, all
rights reserved` given that the topic-map cites commercial
   textbooks.

---

## Where to pick up (in rough priority order)

1. **More cases** — the topic-map now has ~30 unused entries. Strong
   Tier-1/2 SAQ candidates remaining: **hypertensive emergency**
   (labetalol, 10-20% in 1 h), **TCA overdose** (sodium bicarb at
   QRS >100 ms), **perimortem caesarean** (4-min rule + lateral
   tilt), **posterior circulation stroke** (HINTS), **chest trauma**
   (DOAC + flail), **decompensated liver cirrhosis**, **fractured
   NoF**, **hypothermia/drowning**.
2. **Branching narrative trees** — dialogue is still flat (topic →
   response). Build prompt's "history" model could lift narrative
   quality further.
3. **LLM-driven flavour dialogue** — build-prompt explicitly defers
   until the scripted experience is solid; we are now there.
4. **Wider accessibility audit** — keyboard reachability of every
   interactive element, screen-reader tour of the encounter flow.
5. **Phaser hub art** — still colored rectangles. Real pixel-art
   bays + patient sprites are deferred per "MVP placeholder" rule.
6. **Multiplayer / leaderboards / save profiles** — kernel is
   deterministic enough for replay/sharing.

---

## Architectural reminders

- Kernel is pure deterministic TS. React only subscribes via the
  `tick` counter and reads imperative state. Kernel never reads
  wall time — all time flows through `kernel.advance(deltaMin)`.
- Whole-minute advance only (D-013). Sub-minute mechanics would
  need a `tickSeconds` API, not a relaxation.
- Save/resume snapshots versioned at `v: 1`; episode identity is
  checked on restore.
- Per-case phase memory lives in `ShiftView`'s `phases` map, not
  in the kernel — phase is UI navigation, not simulation state.
- Bay assignments are an optional Case-schema field; used by the
  hub-view to place patient cards.
- **`SHIFT_DEFS` in `src/App.tsx`** is the single source of truth
  for shifts on the menu — adding a new shift is now one entry in
  this array (no separate import-factory-callback-button-prop
  cascade).
- Shared `ClockBar` (in `src/ui/shift/ClockBar.tsx`) is used by
  EncounterScreen, ShiftBoardScreen, and ShiftHubScreen — ARIA
  progressbar attributes live here.

## First three commands on resume

```bash
git fetch origin claude/add-necessary-files-4THUA
git checkout claude/add-necessary-files-4THUA
npm ci
```

Then `npm run dev`, pick a shift, and start playing.

**Showcase shifts**: The hen-do (4 cases on one clock with the
shared-incident arc), First seizure (the SAH twist + MHRA Valproate
PPP), Aortic dissection (the anchor-breaker), Massive PE (the
bedside-echo + thrombolysis decision).

**Lesson shifts**: Family anaphylaxis (paeds + adult parallel
dose bands), DOAC double-bill (reperfusion vs reversal on the same
drug), Acute heart failure (the no-fluid no-morphine wet-and-warm
bundle).

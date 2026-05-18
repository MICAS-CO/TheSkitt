# Resume — current state

Last activity: 2026-05-18 ~22:30 UTC. All 8 build-prompt milestones plus
substantial post-milestone work shipped on `claude/add-necessary-files-4THUA`.
The branch is now **34 commits ahead of main**. Recent work: full
clinical-accuracy audit, two new Tier-1 cases (status epilepticus +
head injury with DOAC reasoning), a11y pass, red-flag finding
rendering, and a UX fix that stopped the differential / disposition
pickers from leaking the answer key.

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

### Post-milestone work

- `2a6f321` Code-split Phaser; CI workflow; mobile + a11y pass.
- `b462621` Playwright E2E smoke; CI runs it.
- `dac02be` Save/resume to localStorage.
- `f26b38e` Sim-speed selector, spacebar pause, ARIA-live shift log.
- `0ac1cd3` Sepsis case (Mrs Morrison) + sepsis-solo shift (M7 CLI round-trip).
- `0583e85` Better next-button labels + Escape returns to board.
- `9fb728d` **Hub → encounter wire-up** — clickable Phaser department view.
- `08b4924` DKA case (Marcus) + overnight metabolic 2-case shift.
- `b542697` Paeds anaphylaxis (Sam) + family-anaphylaxis 2-case shift.
- `57ac4cc` Replay button on debrief + topic-map citation cleanup.
- `0d0e437` Acute stroke case (Williams) + stroke-solo shift.
- `8f00a95` Narrative-ground the arc reveal + hub E2E smoke.
- `b51945c` Docs: refresh RESUME with 25-commit current state.
- `2684fca` **Audit: clinical accuracy + narrative coherence pass** —
  Beth ipratropium frequency, Marcus DKA pH threshold, Morrison AKI
  staging, Williams door-to-CT citation, Stan Pabrinex pearl, Sam
  oxygen route + paeds neb dose, Patel ticagrelor + AVOID citations.
  Beth's hx_partner now actually mentions Sam (fixes a dead arc
  reveal). Stub `case_minor_laceration_ambient.yaml` removed.
- `6e28902` **Status epilepticus solo with SAH twist** — 9th case +
  7th episode + new menu card. NICE NG217 (2022 update), RCEM Best
  Practice 2024, MHRA Valproate PPP, RCOG GTG 10A.
- `c7899e7` **Head injury — DOAC reasoning** — 10th case + 8th
  episode. NICE NG232 + NICE TA697 (andexanet alfa) + BSH 2024 DOAC
  reversal + Canadian C-spine Rule. Pairs thematically with Williams
  (stroke on apixaban) — together they cover the
  ischaemic-vs-haemorrhagic ends of the DOAC-on-board spectrum.
- `ee7032d` **A11y pass** — prefers-reduced-motion media query,
  ARIA progressbar on all three clock bars, encounter PhaseProgress
  gets aria-current="step", darkened arrested/deceased chip
  background for WCAG-AA contrast.
- `cf0ddc6` **Surface red_flag exam findings** — `ExamFinding.red_flag`
  schema field was unused by the UI. Now wired to render a "⚠ red
  flag" chip + left-border accent. Backfilled across Beth, Williams,
  Morrison, Marcus. All 10 cases now demonstrate the feature.
- `93a972b` **UX: stop revealing answers in pickers** — differential
  hid likelihood chip until pick; disposition hid criteria text
  until pick. Genuine assessment restored. Correct/wrong borders
  reveal feedback after pick.
- _(pending commit)_ Menu copy refresh: resume banner uses the
  episode title (not raw id); subtitle updated; menu copy points at
  the showcase shifts.

### Numbers

- **124 / 124** unit tests passing (Vitest).
- **2 / 2** E2E tests passing (Playwright; menu → board → encounter, board ↔ hub toggle).
- Initial JS bundle: 636 KB (gzip 188 KB). Phaser lazy-loaded
  (~1.5 MB chunk, only downloads when ED hub opens).
- Content: **10 cases (all authored)**, **8 episodes**, **2 arcs**,
  27-topic high-yield map.
- All authored clinical content cites UK guidelines inline.

### Shifts on the menu

1. **The hen-do** (ST3, 20 min, 2 focus + 2 ambient + 1 arc).
   Anaphylaxis (Beth) + ectopic (Sarah) + frequent flyer
   (Stan, hypoglycaemia + head injury) + chest pain (Mrs Patel, STEMI).
2. **Family anaphylaxis — adult + paeds** (ST3, 20 min, 2 cases + 1 arc).
   Beth + her 8y/o brother Sam. Two dose bands of the Resus Council
   UK 2021 algorithm on one clock.
3. **Stroke onset — thrombolysis window** (CT2, 20 min, 1 case).
   Witnessed L MCA stroke on apixaban. NICE NG128 plus DOAC
   contraindication plus thrombectomy referral.
4. **First seizure — status pathway** (ST3, 20 min, 1 case).
   28y/o in refractory status, pregnant, with a CT-SAH twist. NICE
   NG217 (2022) plus MHRA Valproate PPP plus RCOG GTG 10A.
5. **Head injury — DOAC reasoning** (CT2, 20 min, 1 case). 78y/o
   faller on apixaban, GCS 15 on arrival. NICE NG232 + NICE TA697 +
   Canadian C-spine Rule. The well-looking-but-bleeding trap.
6. **Overnight: sepsis solo** (CT2, 20 min, 1 case). Sepsis Six, NICE NG51.
7. **Overnight: metabolic resus** (ST3, 20 min, 2 cases). New-onset DKA
   plus urosepsis on the same shift. JBDS-IP plus NICE NG51.
8. **Anaphylaxis solo** (CT2, 20 min, 1 case). The milestone-4 build.
9. **ED hub layout** (preview).

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
- "Resume" banner on menu if you reload mid-shift
- "↥ department view" toggle on board → Phaser hub with clickable patient cards
- "↻ play this shift again" button on the episode debrief

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

## Where to pick up (in rough priority order)

1. **More cases** — the topic-map has 17 unused Tier-1/2/3 topics. The
   new-case CLI generates a schema-valid skeleton from any of them in
   one command (`pnpm new-case --topic <id>`). Natural next picks
   (post-head-injury): major trauma, asthma exacerbation, paeds DKA,
   aortic dissection, paracetamol overdose.
2. **Branching narrative trees** — currently dialogue is flat (topic →
   response). Building a real branching tree per the build prompt's
   "history" model would lift the narrative quality.
3. **LLM-driven flavour dialogue** (build prompt explicitly defers
   to "after the scripted experience is solid" — we are now there).
   Boundaries: never on critical clinical path; mood/voice only.
4. **Accessibility audit** beyond first pass (full keyboard
   reachability, contrast for every state chip, screen-reader tour
   of the encounter flow).
5. **Multiplayer / leaderboards / save profiles** — the kernel is
   already deterministic enough for replay/sharing.
6. **Art pipeline polish** — the Phaser hub still uses colored
   rectangles. Real pixel-art bays + patient sprites are deferred per
   the build prompt's "MVP, placeholder sprites" rule.

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
- Bay assignments are an optional Case-schema field; used by the
  hub-view to place patient cards. New cases without a bay won't
  appear on the hub but the board still shows them.
- KNOWN_SHIFTS registry in `src/App.tsx` is the single source of
  truth for which episode ids are restorable / replayable. Adding
  a new shift means: author case YAML → author episode YAML → add
  one line to the registry → wire a menu card.

## First three commands on resume

```bash
git fetch origin claude/add-necessary-files-4THUA
git checkout claude/add-necessary-files-4THUA
npm ci
```

Then `npm run dev`, pick a shift, and start playing. **The hen-do**,
**Stroke onset**, and **First seizure** are the showcase shifts;
**Family anaphylaxis** is the paeds + adult parallel-dose-bands lesson.

# HANDOVER — The Skitt

**Last session ended**: May 2026, post-M79. **Branch**: `claude/add-necessary-files-4THUA` at `ed3e752` (then a final docs commit). **Numbers**: 324 unit tests · 3 E2E · 17/17 cases sprited · 17 episodes · 3 arcs · 16 daily ECGs · F1/F2/CT1 difficulty tiering · first-run induction shipped.

A live single-file playable build is at `exports/the-skitt.html` (2.8 MB, ~712 KB gzipped).

This document is the handover for the next session. Read it cold and you should be able to continue work without re-reading the chat log.

---

## 1. What The Skitt is

A UK FRCEM emergency-medicine study RPG. The player is a new doctor at the fictional Skittstown General ED (colloquially "The Skitt"), inside the parent MedEd project **TheCase.Report**. Each shift puts 1-4 patients on the board; the player runs each through a phase pipeline (history → exam → ix → differential → management → disposition → debrief) on a 20-minute simulated clock.

It is not a game **about** emergency medicine. It is emergency medicine, with the simulation hand-authored against current UK guidance (NICE NG106 Sep 2025, RCEM, JBDS-IP 2023, MHRA Valproate PPP 2024+2025, ESC 2024, RCP Stroke 2023, NICE NG225 Sep 2022, TOXBASE 2026, Resus Council UK 2021, BSPED 2020, ISPAD, BSH 2024). Disco Elysium is the writing-bar reference; Dwarf Fortress is the simulation-depth reference. Both consciously.

---

## 2. Repo orientation

```
src/
  App.tsx                     coordinator + view-state machine (menu / shift / hub / ecg / skilltree / settings / styleguide / practice / induction)
  main.tsx                    entry
  content/
    schema.ts                 zod schemas for Case / Episode / Arc + types
    loader.ts                 YAML → typed objects + cross-ref validation
    validator.ts              standalone validator (runs on every build)
    ecg-challenges.ts         16 ECG drills authored against UK practice
  sim/
    kernel.ts                 SimKernel — the central simulator. State machine,
                              transitions, consultant interrupts, deterioration
                              timers, save/restore with version stamp.
    vitals.ts                 NEWS2 + state-machine vitals derivation
    audio.ts                  monitor beep audio (HR-tracked)
  state/
    sim.ts                    Zustand store + scoreCase / scoreEpisode
    character.ts              Character record (firstName/lastName/role/inducted)
    difficulty.ts             F1/F2/CT1 tier configs — drives band thresholds
    progression.ts            XP + perks + unlock store
    consultant.ts             ShiftMemo + composeConsultantMessage
    achievements.ts           8 badges + scanAchievements
  style/
    palette.ts                locked palette ramps
    sprites.ts                Beth + Williams + Chloe + Stan + Patel (hand-authored)
                              + CASE_TO_DROP_ID routing into dropPatientSprites
    dropPatientSprites.ts     13 drop archetypes × 5 states (self-contained PAL)
    npcSprites.ts             8 NPC sprites (paramedic, sister, etc.)
    propSprites.ts            12 prop sprites (syringe, IV bag, ECG dots, etc.)
    fxSprites.ts              8 particles + 3 alerts + 6 emotes
    walkCycles.ts             4 F1 doctor walk frames
    extraEquipment.ts         8 additional drug/equipment sprites
    extraWorldTiles.ts        13 environment tiles
    worldSprites.ts           11 environment tiles (M46)
    extraPatientSprites.ts    initial M65 base-frame port (superseded by
                              dropPatientSprites)
    icons.tsx                 8 status icons
    frames.tsx                clipboard / monitor / vitals-strip / drug-chart /
                              results-envelope frame components
  ui/
    encounter/
      EncounterScreen.tsx     coordinator. Includes EncounterHeader, VignetteCard,
                              SectionTabs, DeteriorationTimers, ShiftLog,
                              ConsultantInterruptModal, ConsultantWalkIn,
                              ConsultantInterruptEmote, PatientDeathModal,
                              HistoryNpcSprite, BranchPicker, HistoryPhase,
                              DifferentialPhase, DebriefPhase, CitationLine
                              (~1200 lines post-M61 split)
      phases/
        ExaminationPhase.tsx
        InvestigationsPhase.tsx (includes EcgInlineQuiz)
        ManagementPhase.tsx (includes ActionPropSprite)
        DispositionPhase.tsx
      PatientPanel.tsx        portrait + vitals strip + interpolation +
                              PatientFxOverlay (state-coded particles)
      ResusMode.tsx           ALS algorithm modal
    induction/
      InductionScreen.tsx     character creator + McGrath 13-beat tour
    practice/
      CasePracticeScreen.tsx  flat 17-card library
    ecg/
      EcgChallengeScreen.tsx  daily ECG drill (standalone route)
    progression/
      SkillTreeScreen.tsx     XP + perks
    settings/
      SettingsScreen.tsx      reduce motion + trap hints + sim speed +
                              clear data
    shift/
      ShiftBoardScreen.tsx    department board
      EpisodeDebriefScreen.tsx case-by-case + XP + badge unlocks
      ClockBar.tsx
    styleguide/
      AssetLibraryScreen.tsx  hidden ?style-guide=1 asset library
      url-gate.ts             ?style-guide=1 helper
    PhaserGame.tsx            Phaser wrapper (lazy-loaded chunk)
  game/
    boot.ts                   Phaser game boot
    scenes/EDScene.ts         department-view scene

content/
  cases/      17 case YAMLs (each = full clinical case with citations)
  episodes/   17 episode YAMLs (shift definitions)
  arcs/       3 arc YAMLs (cross-case narrative threads)

tests/        32 vitest files, 324 tests
e2e/          3 playwright specs (hendo-shift, hub-flow, induction)

public/
  app-icon.svg     32×32 Skitt resus-cross logo
  tcr-lockup.svg   TheCase.Report parent brand lock-up

exports/
  the-skitt.html   single-file playable build (2.8 MB)
```

---

## 3. Key systems — what's wired and where

| System | File | Notes |
|---|---|---|
| Phase pipeline | `ui/encounter/EncounterScreen.tsx` | All 7 phases + 1 debrief |
| Branching dialogue (rapport) | `content/cases/*.yaml` `branch_choices:` | 24 branches across all 17 cases; rapport_delta ±2 |
| `min_rapport` disclosures | `content/cases/*.yaml` `min_rapport: N` | 7 disclosures across 7 cases |
| `gated_by_history` traps | `content/cases/*.yaml` `gated_by_history:` | 16 traps gated (of 78 total) |
| Essentials (workup parsimony) | `content/cases/*.yaml` `essential: true` | 17/17 cases have at least one |
| Manoeuvres | `content/cases/*.yaml` `manoeuvres:` | 21 manoeuvres across 11/17 cases |
| ECG drill inline | `content/cases/*.yaml` `ecg_challenge_id:` | 5/17 cases wired; 16 bank entries authored |
| Disposition epilogues | `content/cases/*.yaml` `epilogue:` | 59 lines across 17/17 cases |
| Consultant interrupts | `sim/kernel.ts` `emitInterrupt` + UI modal | trap_caught / deterioration_takeover / unsafe_midshift |
| Patient sprites | `style/sprites.ts` + `dropPatientSprites.ts` | 17/17 case coverage via CASE_TO_DROP_ID |
| Patient FX particles | `ui/encounter/PatientPanel.tsx` `PatientFxOverlay` | sweat / urticaria / vomit / blood / pulse_ring |
| McGrath walk-in animation | `ui/encounter/EncounterScreen.tsx` `ConsultantWalkIn` | uses `WALK_FRAMES` |
| Achievements | `state/achievements.ts` | 8 badges, 6 wired conditions |
| Snapshot version | `sim/kernel.ts` `SNAPSHOT_VERSION` + `migrateSnapshot` | versioned + future-proof |
| Difficulty tiers | `state/difficulty.ts` | F1/F2/CT1 affect score band thresholds + trap-hint defaults |
| First-run induction | `ui/induction/InductionScreen.tsx` | character creator + 13-beat tour |
| Time-of-death modal | `ui/encounter/EncounterScreen.tsx` `PatientDeathModal` | fires on `deceased` transition |
| Code-split | `App.tsx` lazy + Suspense | every menu-secondary route lazy |
| Asset library | `ui/styleguide/AssetLibraryScreen.tsx` | `?style-guide=1` URL gate |

---

## 4. Recent milestones (M65 → M79)

| | Milestone | Headline |
|---|---|---|
| M65 | Drop #3 sprite ports | 13 patient archetypes, FX, walks, equipment, tiles |
| M66 | FX in consultant interrupts | trigger-coded emote in modal corner |
| M67 | Semantic colour contract | brand red ≠ alert red ≠ accent amber |
| M68 | App icon + favicon | Skitt resus-cross 'I' on dark teal |
| M69 | Time-of-Death modal | mortuary-styled overlay on `deceased` |
| M70 | Achievement badges | 8 pixel-art unlocks + localStorage |
| M71 | TheCase.Report lockup | parent brand mark in footer |
| M72 | 3 hand-authored sprites | Chloe / Stan / Patel (coverage 2/17 → 5/17) |
| M73 | FX particles on patient state | sweat / urticaria / vomit / blood / pulse |
| M74 | Character creator + induction | first-run Skittstown ED tour |
| M75 | Full drop port | 13 archetypes × 5 states with state machinery |
| M76 | 17/17 sprite coverage | mapping drop archetypes onto every case |
| M77 | Difficulty tiering wired | F1/F2/CT1 affects score band + trap defaults |
| M78 | LICENSE + lazy routes | proprietary copyright + every menu-secondary route lazy |
| M79 | McGrath walks in | parked walk-cycle frames now drive her entrance |

Full milestone log lives in `RESUME.md`. Changelog in `CHANGELOG.md`.

---

## 5. Open items + recommendations

From the previous full audit + what's surfaced since:

### Clinical
- Catalogue has 128 citations across 17 cases (~7.5 avg). All UK-current.
- **TODO**: UK ED consultant + trainee review pass. Some cases at 4-5 cites (Sam, Amir, Brennan, Oduya, UGIB) could deepen.
- **TODO**: 2026 Resus Council UK ALS update if/when it lands.
- **TODO**: NG185 dual-antiplatelet timing on Patel; DAWN/DEFUSE-3 extended-window on Williams.

### Gameplay
- Difficulty tiering wired (M77) ✓
- First-run experience landed (M74) ✓
- **TODO**: pause-budget axis from `audit-fixes-3.jsx` ('30s/15s ratio per shift-minute') — needs kernel changes.
- **TODO**: Ambient case throttling per tier — needs episode-time filtering.
- **TODO**: Wire `bleep_lord` + `rcem_reader` achievements (still un-condition'd).
- **TODO**: Fail-state escape — when a case dies mid-shift, no "try again" loop within the same shift.

### Story
- 24 branched moments, 7 rapport-gated disclosures, 17/17 disposition epilogues.
- **TODO**: More arcs. Currently 3 (hen-do, family peanut, overnight safety-net). Two more would lift the catalogue from "linked-in-places" to "world-with-throughlines".
- **TODO**: Recurring named NPCs (Anya the triage nurse, Dom the paramedic) — currently one-shot.
- **TODO**: Source diversity. 11 of 24 branches are family-source. Some nurse / triage_note / gp_letter / records branches authored in M58; could deepen.
- **TODO**: Working_diagnosis → narrative coda. Schema add (`case_coda?: string`) + 17 short authoring slots.

### Visual
- 17/17 sprite coverage via the M76 mapping ✓
- FX particles wired (M73) ✓
- McGrath walks in (M79) ✓
- **TODO**: World tiles (24 authored) still parked. No overworld view; no department map; no waiting-room ambient.
- **TODO**: 6 of the 12 drop-mapped cases use mild demographic looseness (Sam ↔ ruby, Amir ↔ leo, Okafor ↔ jake, Priya ↔ liam, Okonkwo ↔ maya, Oduya ↔ ahmed). Hand-authored alternatives would tighten these.

### Other
- LICENSE landed (M78) ✓
- Lazy routes landed (M78) ✓
- Phaser already lazy ✓
- **TODO**: UI integration tests via @testing-library/react (not installed). The 3 E2E tests are smokes; deeper render-tree assertions on the consultant modal, branch picker, etc. would catch UI regressions earlier.
- **TODO**: A11y audit beyond aria-* hooks. Screen-reader walkthrough + high-contrast mode.
- **TODO**: Telemetry hook (even local debugging breadcrumbs would help when a case feels stuck).

---

## 6. How to continue

### Build / run

```bash
npm install               # if fresh
npm run dev               # vite dev server on :5173
npm run build             # production bundle into dist/
VITE_SINGLE_FILE=1 npm run build   # single-file HTML (current export shape)
```

### Test

```bash
npm test                  # vitest — 324 tests
npx playwright test       # 3 E2E
npm run lint              # eslint
npm run validate-content  # cross-reference content validator
```

All five (test, e2e, lint, typecheck, validator, build) are clean as of `ed3e752`.

### Adding a case

1. New YAML in `content/cases/case_<topic>_<patient>.yaml` — follow Brennan or Patel as the most-developed templates.
2. New episode in `content/episodes/ep_<id>.yaml` referencing the case.
3. Wire factory in `src/App.tsx` `SHIFT_DEFS`.
4. Add a row in `src/ui/practice/CasePracticeScreen.tsx` `CASES`.
5. If you want a sprite from the drop catalogue: add a `CASE_TO_DROP_ID` entry in `src/style/sprites.ts`.
6. Tests run via `npm test`; add a fixture in `tests/case-playable.test.ts` if the case is unusual.

### Adding a milestone

Pattern across M30 → M79:
1. Author the schema + state changes
2. Wire UI
3. Add tests (unit first, E2E only when the change crosses screen boundaries)
4. Run all checks
5. Commit with a milestone-tagged title and a body that names the audit recommendation, the system change, and the coverage shift

### Style + voice

The catalogue's house style is in `CLAUDE.md` / observed across cases:
- Patient dialogue uses dashes for action breaks, not asterisks
- Branch responses are 3-tone (compassionate / clinical / dismissive) unless the moment genuinely demands a different axis (Sam M55, Brennan M60 are non-tonal)
- Dismissive branches drop information mechanically when possible
- Citations stay in the YAML, not in the UI prose
- McGrath voices the consultant memo + bedside interrupts; she's the only named NHS staff member with a through-line so far

### Naming
- The Skitt = Skittstown General ED (in-game)
- TheCase.Report = the parent MedEd project (publisher attribution in footer)
- The internal narrative voice refers to the player as `Dr {firstName}` once the M74 character is set

---

## 7. The single-file export

`exports/the-skitt.html` is a 2.8 MB self-contained playable build:
- Open in any modern browser. No server, no install.
- Inlines all assets (sprite SVGs, fonts via CDN, styles, JS, Phaser engine, ECG bank, 17 case YAMLs).
- On first run shows the Skittstown ED induction.
- Save data persists to that browser's localStorage. Re-opening the same file in the same browser resumes from the same save.

Build it again any time with:
```
VITE_SINGLE_FILE=1 npm run build && cp dist/index.html exports/the-skitt.html
```

---

## 8. Quick-start prompts for the next session

If picking up cold, the highest-leverage next moves (in order):

1. **Wire `bleep_lord` + `rcem_reader` achievement conditions** — small (~30 min), removes "un-conditioned badge" tech debt.
2. **Schema `case_coda?: string` + author 17 short codas** — small content win, completes the audit's recommendation.
3. **Two more arcs** — author one daytime majors arc + one bank-holiday arc; lifts world-building.
4. **Two more hand-authored patient sprites** to tighten the M76 demographic-loose mappings (recommended: Sam paeds + Marcus DKA — both currently use opposite-gender drop archetypes).
5. **UI integration tests** — `npm install -D @testing-library/react`, write 5-6 specs for the consultant modal, branch picker, disposition phase, induction tour, death modal.
6. **A11y audit pass** — screen-reader walkthrough, high-contrast review.

---

## 9. Contact / context

The repo lives at `MICAS-CO/TheSkitt`. The parent MedEd project is **TheCase.Report**. Work-in-progress branch as of handover: `claude/add-necessary-files-4THUA`.

If the next session is a different model or a different operator, the conventions in `CLAUDE.md` should carry forward. The codebase rewards being read top-down (App.tsx → kernel.ts → schema.ts → an example case YAML). Test density is highest on the kernel + schema + scoring; lowest on the UI components — pattern-match from existing tests rather than introduce new frameworks.

Disco Elysium grade is the bar. *Dr Aoife McGrath remains the consultant.*

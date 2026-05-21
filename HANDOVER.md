# HANDOVER — The Skitt

**Last session ended**: 2026-05-21, post-M93 closed (state-responsive portraits + BAY MONITOR frame; BT 17 three-round multimodal review complete; three residual content / pre-existing findings explicitly deferred to a vitals-strip + content-sweep + clinical-cue sprite milestone) + M92 closed + BT 16 closed + BT 15 synthesis complete.
**Branch**: `claude/review-and-continue-HjlEy` — merged `claude/new-session-Sax8M` forward. Previous branch tip `c622850` is preserved in history.
**Numbers**: 444 unit tests passing · 37 test files · 3 E2E specs · 17 cases · 18 episodes · 3 arcs · 17-shift rota · Intern/SHO/Registrar tier ladder. Single-file build: 1.35MB (down from ~2.8MB pre-M92).

Live single-file playable build at `exports/the-skitt.html` (regenerate with `npm run build:single-file && cp dist/index.html exports/the-skitt.html`).

This document is the handover for the next session. Read it cold and you should be able to continue work without re-reading the chat log. **If you do nothing else, also read `dev_loop/braintrust/BRAINTRUST_PATTERN.md` — that documents the multi-reviewer consultation pattern this project uses for every non-trivial design call.**

---

## 1. What The Skitt is

A UK FRCEM emergency-medicine study RPG. The player is a new doctor at the fictional Skittstown General ED (colloquially "The Skitt"), inside the parent MedEd project **TheCase.Report**. Each shift puts 1-4 patients on the board; the player runs each through a phase pipeline (history → exam → ix → differential → management → disposition → debrief) on a 20-minute simulated clock.

It is not a game **about** emergency medicine. It is emergency medicine, with the simulation hand-authored against current UK guidance (NICE NG106 Sep 2025, RCEM, JBDS-IP 2023, MHRA Valproate PPP 2024+2025, ESC 2024, RCP Stroke 2023, NICE NG225 Sep 2022, TOXBASE 2026, Resus Council UK 2021, BSPED 2020, ISPAD, BSH 2024). *Disco Elysium* is the writing-bar reference; *Dwarf Fortress* is the simulation-depth reference; *Papers, Please* is the closer visual-register reference (per Braintrust 15). Both consciously.

---

## 2. M80 → M91b change log

The previous handover stopped at M79. Since then, 12 implementation milestones + 5 braintrust consultations (numbered 01-15) have shipped. Summary:

| | Milestone / Consultation | Headline |
|---|---|---|
| **BT 01** | Opening-pass | Two-reviewer (Gemini + orchestrator-Opus) audit of the M79 bundle. Surfaced kernel-leak, recurring-patient over-reliance, rapport prose flatness, breadth-not-scored. |
| **BT 02** | Design consultation | Three author concerns triaged into a roadmap. Output drove M80-M84. |
| M80 | Per-case triage clock + clue persistence + death-modal halt | Each case now has its own 20-min triage countdown; clues persist; deaths halt the case loop instead of letting the timer keep running. |
| M81 | Rename grades to Intern / SHO / Registrar | F1/F2/CT1 → UK-clinical-ladder labels surfaced everywhere. Stop spoiling diagnoses on title cards. |
| M82 | Rota skeleton + entry shift | 17-shift linear rota replaces the freeform shift-board entry. Front door is now the rota. |
| M83 | Keystone gating + EPortfolioScreen + block progress | Three blocks (Intern / SHO / Registrar); each gated by a keystone shift; eportfolio screen tracks attestations. |
| **BT 03–04** | Per-milestone iteration reviews | M82 + M83 each got a 2-round Gemini iteration review (round1 → fixes → round2). Pattern doc: `dev_loop/braintrust/BRAINTRUST_PATTERN.md`. |
| M84 | First-shift onboarding + random recall + practice library re-exposed | New player gets a guided first shift; practice library is back on the menu. |
| **BT 05–06** | M84 review + timer-pedagogy consultation | Multi-reviewer call on pause-budget / timer behaviour. Verdict: pause during reasoning, not during action; score differential breadth. |
| M85 | Pause clock in reasoning sections + differential breadth scoring | +10 score for ≥3 differentials with linked clues. Pause clock during reasoning phases only. |
| M86 | Deterioration-event audit | Trimmed wall-clock arrests where literature didn't support them. Kept only deteriorations literature-true. |
| M87 | Tier-aware deterioration + mirror invariant + reasoning callout | Intern gets 2× deterioration time + arrest clamps; SHO 1.5×; Registrar literature-true. |
| **BT 10** | Narrative thread (2 rounds) | Should there be a story through the rota? Round 1 reviewers said yes-via-recurring-patients; author pushed back on unrealistic recurrence and asked for comic relief as legitimate ingredient. Round 2 reviewers reversed: human-factors arc + slice-of-life comic relief beats. |
| M88 | Patient-recurrence audit + dual-register Akin handover PoC | Reduced recurring patient count to clinically-plausible 1-2 high-intensity users. Introduced **Akin** as the morning-handover voice (dry humour + clinical) alongside McGrath. |
| M88b/89/90 | Narrative thread complete across the rota | NTS (non-technical skills) arc threaded through all 17 shifts, crescendo at the dissection case. |
| M91 | Akin teaches M&M folder culture | "Make sure you leave a sticker in the M&M folder" — NHS-accurate way to flag cases for retrospective review. |
| M91b | M&M timing accuracy sweep | Audited every M&M reference across content; M&Ms are MONTHLY retrospective chart reviews, never real-time. Fixed all in-line mentions. |
| **BT 15** | Visual elements (COMPLETE — `dev_loop/braintrust/15-visual-elements/synthesis.md`) | Four-reviewer multimodal: Gemini Pro + GPT-5.5 (both real-API) + Opus + Sonnet (orchestrator-voice). GPT-5.5 materially revised round 1 — Patel portrait does not yet earn its size; semantic-colour contract is leaking (amber + red); v0.0.1 footer should hide from learners. M93 plan expanded to include state-responsive portrait variants (was *Reserved*). |
| M92 | Phaser hub → static SVG floorplan | Removed `phaser` from deps; deleted `PhaserGame.tsx` + `EDScene.ts` + `game/boot.ts`. New `EdFloorplan.tsx` renders bays from `ED_ZONES` as SVG + patient cards as absolutely-positioned HTML buttons (native a11y, no canvas). Kept `walkCycles.ts` (still used by `EncounterScreen` M79 + `AssetLibraryScreen`) and `game/layout.ts` (the SVG reuses `ED_ZONES`). Single-file build ~1.35MB, down from ~2.8MB. |

---

## 3. Pending roadmap (in priority order)

### From Braintrust 15 (REVISED after GPT-5.5 fourth reviewer) — ship as separate commits, each reviewable

See `dev_loop/braintrust/15-visual-elements/synthesis.md` for the full revised synthesis.

1. ~~**M92 — Phaser hub → static SVG floorplan**~~ **SHIPPED + BT 16 reviewed (3 rounds)**. `phaser` dep removed, `PhaserGame.tsx` + `EDScene.ts` + `game/boot.ts` deleted. New `EdFloorplan.tsx` renders SVG bays + per-bay flex card stacks with HTML-button patients. `walkCycles.ts` correctly kept (M79 EncounterScreen + AssetLibraryScreen still import it — the synthesis's claim it was "only used by the hub avatar" was wrong). All six pre-flight checks green; single-file build 1.35MB (down from ~2.8MB). BT 16 round-3 residual: kernel-tick polling in `ShiftHubScreen` flagged HIGH but **pre-existing** (not introduced by M92); deferred to a future kernel-selectors milestone (M9x).

2. ~~**M93 — State-responsive portrait + diegetic monitor frame**~~ **SHIPPED (BT 17 multimodal review pending)**. State responsiveness was already wired via `spriteSvgFor(caseId, state, ...)` in `PatientPortrait`; M93 added a sprite-resolution test sweep for all four named cases (Beth anaphylaxis adult, sibling anaphylaxis paeds, Marcus DKA, Amir paeds DKA, Brennan head injury) proving deteriorating differs from triaged SVG output per case. Frame work: `Monitor` in `src/style/frames.tsx` gained scanlines (3% opacity SVG `<pattern>`), corner vignette (radial gradient), and a `cornerLabel` OSD chip (phosphor-green mono on dark backdrop). `PatientPanel` threads `clockMin` from `ks` and composes `BAY MONITOR · {bayLabel} · {clockMin}m`. `useId()` suffix on Monitor's SVG `<defs>` ids fixes a latent collision bug when multiple Monitors share a page. New helper `bayLabelFor` in `src/game/layout.ts`. 449 tests (was 444). Single-file bundle 1.355MB (+0.06%).
   - (The "lite, fallback" alternative — shrink portrait into a compact right-rail module — was not pursued. The "full" path was the unanimous reviewer pick and shipped.)

3. **M94 — Token-contract leak audit + shift-log defer + Caveat audit + v0.0.1 footer** (EXPANDED, 2-3h). GPT-5.5 found amber leaking onto "TODAY'S SHIFT" header / e-portfolio block / awaiting-clinician chip / bed-state; red leaking onto "pick" / "decide" / core-action pills. The M67 contract says amber = trap icon only, red = logo + resus stripe. Either migrate the leaking sites to new operational-status tokens, or amend the contract. After the audit, the round-1 *Reserved* visual-contract CI test becomes writable. Plus: collapse the shift log to a chip (unchanged from round 1), audit / purge Caveat (unchanged from round 1), and hide the `v0.0.1` footer from learner-facing chrome.

### Deferred (from BT 15, file as future)

- **Visual-contract CI test** — assert each semantic token is referenced from a small allowlist of selectors. Becomes writable after M94's leak audit. M95 candidate.
- **Mobile responsiveness pass** (NEW, GPT-5.5): the build is laptop-shaped. Two-column → stacked at phone widths, side panels collapse, density audit per screen size. Milestone-scale, **run a fresh braintrust before scoping**.

### From BT 17 (deferred from M93's three-round review)

- **M9x — vitals-strip layout repair** (HIGH, deferred). The vitals row in `PatientPanel` collapses all metric values into a single run-on string ("781498%132/821536.6") at the current viewport. Visible in every BT 17 round 1/2/3 screenshot; pre-existing — not introduced by M93. Likely needs the `VitalsStripFrame` (in `src/style/frames.tsx`) rebuilt with a real CSS grid / flex-with-gap layout + `font-variant-numeric: tabular-nums`. Fatal for the FRCEM clinical-rigor bar, so candidate for the next visual milestone.
- **M9x — clinical-cue sprite recipe enhancement** (HIGH, deferred). BT 17 R3 finding 1: the `deteriorating` recipes in `src/style/dropPatientSprites.ts` for the four BT 15 named cases (anaphylaxis adult/paeds, DKA Marcus/Amir, head-injury Brennan) carry skinMap + diffs but the diffs are minimal — no explicit sweat / urticaria / pallor / pupil-change layer that surfaces the clinical state. Wiring is done (M93); content is thin. Substantial pixel-art authoring scope; should slot before any further "screenshot the encounter screen" review.
- **M9x — case-content audit: deteriorating-state vitals** (CRITICAL, deferred). BT 17 R3 finding 2: a `deteriorating` DKA case shows NEWS2=0 because the YAML's deteriorating state block doesn't author meaningful vitals overrides. Needs a sweep of all 17 cases' `deteriorating` state vitals authoring to enforce a minimum clinical bar. M93 didn't touch case content; this is content work.

### From BT 16 (deferred from M92's review)

- **M9x — kernel selectors instead of tick polling** (HIGH, deferred). `ShiftHubScreen` (and likely other in-shift views) subscribe to `useSim((s) => s.tick)` and force a full re-render on every kernel notify. The hub now rebuilds a small SVG + ~10 button DOM elements per tick; cheap but wasteful. Cleaner: expose selectors from `useSim` that only fire when the visible patient slice materially changes (`focus_cases` list + per-case `state`/`bay`). Pre-existing behaviour — Phaser had the same pattern. Worth a dedicated architectural pass before any future view that subscribes more aggressively. BT 17 R1 + R3 re-reported the same pattern in PatientPanel — same root cause, same deferral.
- **e2e click→encounter assertion** (LOW, deferred). Tried in M92 patch 2; backed off because card presence depends on kernel-startup timing the e2e wasn't otherwise exercising. Worth picking up when the e2e gets a dedicated rework.
- **`shortTitle` JS truncation vs CSS ellipsis** (LOW, deferred). Current implementation slices at 26 chars in JS; in dense bays this could hide clinical disambiguation. CSS `text-overflow: ellipsis` is already applied; could drop the JS truncation entirely.

### Standing TODOs (preserved from earlier handover)

- 2026 Resus Council UK ALS update when/if it lands.
- NG185 dual-antiplatelet timing on Patel; DAWN/DEFUSE-3 extended-window on Williams.
- Wire `bleep_lord` + `rcem_reader` achievement conditions.
- Schema `case_coda?: string` + author 17 short codas.
- Two more arcs (daytime majors, bank-holiday).
- UI integration tests via `@testing-library/react`.
- A11y audit beyond aria-* hooks.

---

## 4. Repo orientation

```
src/
  App.tsx                     view-state machine (menu / shift / hub / ecg / skilltree / settings / styleguide / practice / induction / eportfolio / rota)
  main.tsx
  content/                    schema.ts, loader.ts, validator.ts, ecg-challenges.ts
  sim/                        kernel.ts (state machine + deterioration + save/restore), vitals.ts, audio.ts
  state/                      sim.ts, character.ts, difficulty.ts, progression.ts, consultant.ts, achievements.ts, rota.ts (M82)
  style/                      palette + sprite catalogues (sprites.ts / dropPatientSprites.ts / npcSprites.ts / propSprites.ts / fxSprites.ts / walkCycles.ts / extraEquipment.ts / extraPatientSprites.ts / extraWorldTiles.ts / worldSprites.ts)
  ui/
    encounter/                EncounterScreen.tsx coordinator + phases/ + PatientPanel + ResusMode
    induction/                InductionScreen.tsx (character creator + 13-beat tour)
    practice/                 CasePracticeScreen.tsx (flat 17-card library)
    ecg/                      EcgChallengeScreen.tsx
    progression/              SkillTreeScreen.tsx
    settings/                 SettingsScreen.tsx
    shift/                    ShiftBoardScreen.tsx, EpisodeDebriefScreen.tsx, ClockBar.tsx, RotaScreen.tsx (M82), EPortfolioScreen.tsx (M83)
    styleguide/               AssetLibraryScreen.tsx (?style-guide=1 URL gate)
    PhaserGame.tsx            **scheduled for deletion in M92**
  game/scenes/EDScene.ts      **scheduled for deletion in M92**

content/cases/                17 case YAMLs
content/episodes/             17 episode YAMLs
content/arcs/                 3 arc YAMLs

tests/                        37 vitest files, 444 tests
e2e/                          3 playwright specs

public/
  app-icon.svg                32×32 Skitt resus-cross logo
  tcr-lockup.svg              TheCase.Report parent brand lock-up

exports/the-skitt.html        single-file playable build
exports/app-icon.svg
exports/tcr-lockup.svg

dev_loop/
  braintrust_prompt.md        original Pixar-Braintrust single-pass prompt (pre-iterative)
  braintrust/
    BRAINTRUST_PATTERN.md     **methodology doc — read this**
    01-opening-pass/          gemini + opus findings + synthesis
    02-design-consultation/   gemini + opus design + synthesis + iter2 changes
    03-m82-rota-skeleton/     round1 + round2 single-reviewer iteration review
    04-m83-keystone-eportfolio/
    05-m84-onboarding-recall/
    06-timer-pedagogy/        multi-reviewer (Gemini + Opus voice) consultation
    07-m85-pause-breadth/
    08-m86-deterioration-audit/
    09-m87-tier-mirror-callout/
    10-narrative-thread/      2-round multi-reviewer; round2 captures author pushback
    11-m88-audit-and-handover/
    12-m88b-89-90-narrative-arc/
    13-m91-mm-folder-workflow/
    14-m91b-mm-monthly-cadence/
    15-visual-elements/       IN PROGRESS — Gemini+Opus+Sonnet; OpenAI pending env unblock
```

---

## 5. Standing decisions / conventions

These were either authored or surfaced in the M80-M91b run and apply going forward:

**Tier policy (M87)**
- Intern: 2× deterioration time + arrest clamps (no wall-clock arrests below SHO).
- SHO: 1.5× deterioration time.
- Registrar: literature-true (no scaling).
- This is the player-protection contract. Don't reverse without playtest evidence.

**Narrative voice (M88-90)**
- **Dr Aoife McGrath**: consultant — clinical interrupt voice, end-of-shift memo, the player's named supervisor.
- **Akin**: registrar/SHO — morning-handover voice. Dry humour + clinical. Carries the comic-relief register the M88+ rota needed without breaking the simulator's seriousness.
- Both run a single NTS (non-technical skills) arc threaded across the 17-shift rota with a crescendo at the dissection case (M88b/89/90).

**M&M culture (M91/M91b)**
- M&Ms are MONTHLY retrospective chart reviews. NEVER real-time, never "wrote the M&M for that one" in the moment.
- Flagging is folder-sticker culture: characters say "leave a sticker in the M&M folder", not "I'll M&M this."
- If you author new content with an M&M reference, the cadence must be monthly + retrospective.

**Score breadth (M85)**
- +10 score for ≥3 differentials with linked clues.
- Clock pauses in reasoning phases only (history nuance / differential drafting). Action phases keep the clock live.

**Disco Elysium clarification (BT 15)**
- DE is **not** a pixel-art game — it's painterly illustration with pixel-art-feeling UI.
- The Skitt's actual lineage is closer to *Papers, Please*: sober, small-team, retro-feeling, made-by-hand.
- Don't optimise visual decisions toward DE. Optimise toward "made by clinicians, for clinicians."

**Semantic colour token contract (M67)**
- One CSS variable per job. brand-red ONLY for logo + resus stripe. amber ONLY for trap icon. accent-green ONLY for stable/ECG. etc.
- All three BT 15 reviewers named this as the build's strongest design-system work. Do not leak tokens for "kinda warn" / "kinda OK".

---

## 6. Pre-flight checklist (run before any commit)

```bash
npm test                   # vitest — should report 444/444 (37 files)
npm run typecheck          # tsc -b --noEmit
npm run lint               # eslint
npm run validate-content   # cross-reference content validator
npm run build              # production bundle into dist/
npx playwright test        # 3 E2E (optional; slower)
```

All six pass clean as of `c622850` (last code-changing commit; BT 15 fourth-reviewer commits are docs-only).

---

## 7. Build / run

```bash
npm install                            # if fresh
npm run dev                            # vite dev server on :5173
npm run build                          # production bundle into dist/
npm run build:single-file              # single-file HTML build
cp dist/index.html exports/the-skitt.html  # update exported single-file
```

---

## 8. Cost ledger

Rough running spend on real-API braintrust calls this rota:

- Gemini Pro Preview text calls (BT 01-14): ~$0.04-0.10 each, ~$0.80 total.
- Gemini Pro Preview multimodal call (BT 15 round 1, 8 screenshots): ~$0.06.
- OpenAI GPT-5.5 multimodal call (BT 15 fourth reviewer, 8 screenshots, 65k input + ~2k output incl. 516 reasoning tokens): ~$0.15.
- Opus / Sonnet voices: free (orchestrator-written register).

Running total this rota: **~$1.69** against the user's noted budget (~$15 envelope).

---

## 9. Env access — OpenAI now unblocked (BT 15 follow-on)

When BT 15 was first written, `api.openai.com` was blocked at the env allowlist level and `OPENAI_API_KEY` was not set. The fourth reviewer was deferred and round 1 shipped with three voices.

**As of the follow-on session (2026-05-21):** `OPENAI_API_KEY` is set and `api.openai.com` is reachable. The fourth-reviewer call ran successfully against `gpt-5.5-2026-04-23`, took 47s, returned ~7k chars of substantive critique. Take in `dev_loop/braintrust/15-visual-elements/openai-take.md`; usage in `openai-usage.json`. Synthesis revised; `STATUS.md` deleted (consultation no longer interim).

Gemini key (`GEMINI_API_KEY`) is **not currently set** in this session env — that's fine for now (no pending Gemini calls), but the next session that wants to run a Gemini iteration review will need it.

Security posture from `BRAINTRUST_PATTERN.md` still applies: never echo, never commit, never save to a tracked file. The `openai-call.mjs` script reads from `process.env.OPENAI_API_KEY` and never writes it anywhere.

---

## 10. First moves for the next session (in priority order)

1. **Read `dev_loop/braintrust/BRAINTRUST_PATTERN.md`.** Non-negotiable. It is how this project ships decisions.
2. **Read `dev_loop/braintrust/15-visual-elements/synthesis.md`** for the revised M92-M94 plan (note: M93 materially changed in the four-reviewer synthesis vs the round-1 version).
3. **Run the Pattern B iteration review for M92** if `GEMINI_API_KEY` is set in this session env. M92 shipped without one — see Section 12. If pushing further changes to M92 in response, do them as a `M92 patch:` commit and run round 2.
4. Decide M93 shape with the user: full (state-responsive portrait + monitor frame, 4-6h) vs lite (shrink portrait, demote to compact patient-state card, 2-3h).
5. Ship M93 → then M94 (token-contract leak audit + shift-log defer + Caveat audit + v0.0.1 footer hide).

If picking up cold and shipping completely-unrelated work, the priority list from the earlier handover still stands (wire un-conditioned achievements, schema `case_coda?: string`, two more arcs, UI integration tests, a11y audit).

---

## 11. Style + voice (carried over)

- Patient dialogue uses dashes for action breaks, not asterisks.
- Branch responses are 3-tone (compassionate / clinical / dismissive) unless the moment genuinely demands a different axis.
- Dismissive branches drop information mechanically when possible.
- Citations stay in the YAML, not in the UI prose.
- The internal narrative voice refers to the player as `Dr {firstName}` once the M74 character is set.
- McGrath = consultant. Akin = morning-handover registrar. Both have through-lines. Other NHS staff stay one-shot unless promoted.

---

## 12. Contact / context + M92 pending review note

Repo: `MICAS-CO/TheSkitt`. Parent MedEd project: **TheCase.Report**. Branch as of handover: `claude/review-and-continue-HjlEy` (merged `claude/new-session-Sax8M` forward via a `--no-ff` merge commit; both branches remain on origin for reference).

**M92 was shipped without a Pattern B iteration review** because `GEMINI_API_KEY` is not set in this session's env (it was set in the prior session that ran BT 15 round 1; appears to have rolled off when the env was reconfigured for OpenAI). All six local pre-flight checks pass clean (vitest 444/444, typecheck, lint, validate-content, build, build:single-file). For methodology purity per `BRAINTRUST_PATTERN.md` Pattern B, the next session should set `GEMINI_API_KEY` and run a round-1 Gemini review against the M92 diff (commit `<M92 sha>` vs `6f44240`). If a round-1 finding requires changes, ship those as `M92 patch:` and run round 2 to close.

If the next session is a different model or a different operator, conventions in `CLAUDE.md` carry forward. The codebase rewards being read top-down (App.tsx → kernel.ts → schema.ts → an example case YAML). Test density is highest on kernel + schema + scoring; lowest on UI — pattern-match from existing tests rather than introduce new frameworks.

The braintrust pattern is the through-line of how this project has shipped since M80. Do not skip it. *Disco Elysium grade is the bar. Dr Aoife McGrath remains the consultant.*

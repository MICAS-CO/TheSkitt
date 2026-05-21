# HANDOVER — The Skitt

**Last session ended**: 2026-05-21, post-M91b + Braintrust 15 in-progress.
**Branch**: `claude/new-session-Sax8M` at `c622850` (pushed).
**Numbers**: 444 unit tests passing · 37 test files · 3 E2E specs · 17 cases · 17 episodes · 3 arcs · 17-shift rota · F1/F2/CT1 → Intern/SHO/Registrar tier ladder.

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
| **BT 15** | Visual elements (IN PROGRESS — see `dev_loop/braintrust/15-visual-elements/STATUS.md`) | Gemini Pro multimodal call + Opus voice + Sonnet voice complete. OpenAI third-reviewer call BLOCKED by env network allowlist. |

---

## 3. Pending roadmap (in priority order)

### From Braintrust 15 — ship as separate commits, each reviewable

1. **M92 — Phaser hub cut** (2-3h, consensus first move). Remove `import phaser` + `PhaserGame` lazy chunk + `game/scenes/EDScene.ts` + `style/walkCycles.ts` (only the hub avatar uses it). Replace the hub view with a static SVG floorplan (same bay rectangles, same labels, no walk-around). Sheds ~1.5MB from the bundle. The Phaser hub renders as "coloured rectangles + wobbly walk-cycle" and reads as half-built on every reviewer pass.

2. **M93 — Diegetic pixel art** (2-4h, highest-leverage visual fix). Frame the patient portrait container in EncounterScreen as a CCTV / bay-monitor feed: subtle scanline overlay, phosphor tint at edges, slight CRT vignette, label "BAY MONITOR · bay {bay} · {clock}m". Same treatment to any other pixel surface (status icons, small avatars). Reconciles the build's two visual identities (sober pixel craft + modern clinical UI) by making the pixel art something the modern UI is *rendering*, not something stuck on top of it.

3. **M94 — Shift log defer + Caveat audit** (1-2h, polish). Move ShiftLog side panel to a collapsible chip; expand on click; auto-expand when a new entry arrives. Default state at T+0 is collapsed. Then `grep -r 'font-hand\|Caveat' src/` — if Caveat is unused, delete the import + font-face. If used somewhere unseen, document where in `src/styles.css`.

### Deferred (from BT 15, file as future)

- **Visual-contract CI test** (Opus suggestion): assert each semantic token is referenced from a small allowlist of selectors. Insurance against future leak.
- **Patient sprite state variants** (Opus suggestion): use `extraPatientSprites.ts` to render Mrs Patel more unwell as case state degrades, or delete the variants. Pedagogical win if done.

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

All six pass clean as of `c622850`.

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

Rough running spend on real-API braintrust calls this session:

- Gemini Pro Preview text calls (BT 01-14): ~$0.04-0.10 each, ~$0.80 total.
- Gemini Pro Preview multimodal call (BT 15, 8 screenshots): ~$0.06.
- OpenAI calls: $0.00 (blocked by env network allowlist).
- Opus / Sonnet voices: free (orchestrator-written register).

Running total this rota: **~$1.54** against the user's noted budget (~$15 envelope).

---

## 9. Live state pending — Braintrust 15 OpenAI reviewer

`dev_loop/braintrust/15-visual-elements/STATUS.md` captures this fully. Short version:

- User pasted an OpenAI API key in plaintext mid-session asking to swap Sonnet for OpenAI as third reviewer.
- Container's network policy blocked `api.openai.com` (default `Trusted` allowlist doesn't include it).
- Sonnet-voice (orchestrator-written) take stands in for now. Synthesis is robust on the convergences (Phaser cut, semantic-colour triumph, encounter density OK, typography keep first 3 fonts).

**Steps for the user to unblock OpenAI** (also in STATUS.md):
1. **Rotate the leaked OpenAI key** on the OpenAI dashboard — it appears in plaintext in the chat transcript.
2. Open env settings (cloud icon → settings) → switch Network access from Trusted to Custom.
3. Add `api.openai.com` to Allowed domains; tick "Also include default list of common package managers".
4. Add `OPENAI_API_KEY=sk-proj-...` to Environment variables.
5. Open a new session (env cache rebuilds ~5min one-off).

Once unblocked, the next session can run a fourth reviewer pass against `gpt-5` (or current frontier OpenAI vision model) with the same prompt + screenshots, save to `openai-take.md`, revise `synthesis.md`. **OR** the author can choose to ship M92-M94 on the current Gemini+Opus+Sonnet synthesis without waiting — the substantive convergences will hold.

---

## 10. First moves for the next session (in priority order)

1. **Read `dev_loop/braintrust/BRAINTRUST_PATTERN.md`.** Non-negotiable. It is how this project ships decisions.
2. **Read `dev_loop/braintrust/15-visual-elements/synthesis.md`** for the M92-M94 plan.
3. **Read `dev_loop/braintrust/15-visual-elements/STATUS.md`** for the OpenAI pending state.
4. Decide with the user: do we wait for OpenAI to unblock, or ship M92 now?
5. If shipping M92: pick the Phaser hub cut. Lowest-risk, biggest-perceived-quality lift per hour. Reviewer pipeline as standard (single-reviewer iteration review pattern from `BRAINTRUST_PATTERN.md`).
6. After M92: M93 diegetic monitor framing → M94 shift-log defer + Caveat audit.

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

## 12. Contact / context

Repo: `MICAS-CO/TheSkitt`. Parent MedEd project: **TheCase.Report**. Branch as of handover: `claude/new-session-Sax8M`.

If the next session is a different model or a different operator, conventions in `CLAUDE.md` carry forward. The codebase rewards being read top-down (App.tsx → kernel.ts → schema.ts → an example case YAML). Test density is highest on kernel + schema + scoring; lowest on UI — pattern-match from existing tests rather than introduce new frameworks.

The braintrust pattern is the through-line of how this project has shipped since M80. Do not skip it. *Disco Elysium grade is the bar. Dr Aoife McGrath remains the consultant.*

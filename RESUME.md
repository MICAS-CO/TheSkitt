# Resume — current state

Last activity: 2026-05-19. Branch `claude/add-necessary-files-4THUA`
now at **75+ commits** total.

## What just happened (M9–M25)

The game-feel feedback ("feels like work, not an RPG") landed as the
Strategic Blueprint and drove a 17-milestone redesign + a fresh
visual integration from Claude Design + new content.

| Milestone | Headline |
|---|---|
| M9  | Killed the linear phase pipeline → free section nav with live kernel-derived badges |
| M10 | Dialogue-tree history with prereqs, NPC voice flourishes, patient-comfort gating · all 15 cases backfilled |
| M11 | Differential builder: clue board + per-dx support tally + lock-in working diagnosis · `supports` authored across all cases |
| M12 | Live vitals strip + state-driven patient portrait · RCP NEWS2 scoring · `vitals` authored on all 15 cases |
| M13 | Resus mode (ABCDE action wheel) for 4 SLO-3 cases + `resus_letter` schema |
| M14 | Live deterioration timers + ward-trap counter in debrief |
| M15 | Web-Audio monitor beep + 7-day ECG challenge bank |
| M16 | Cross-shift XP, RCEM SLO mastery, perks (`src/state/progression.ts`) |
| M17 | Phaser-resident encounter: controllable avatar + proximity interact |
| M18 | **Claude Design style guide v1** — locked palette, fonts, Beth's 5-state pixel-sprite engine, 8 pixel-art status icons |
| M19 | Diegetic frames — Monitor wrap on portrait, VitalsStripFrame, ResultsEnvelope hero |
| M20 | Sequence-aware penalty for resus (prereq_action_ids) — Okafor + Priya wired |
| M21 | Phaser overworld palette unified with locked design tokens + more icon wire-ins |
| M22 | ECG bank +4 (11 total) + IconCitation on sources |
| M23 | New case + episode — Chloe, staggered paracetamol OD with safeguarding parallel |
| M24 | ECG bank +3 (14 total, 2-week rotation) |
| M25 | Third arc — Overnight Safety-Net connecting Chloe + Stan via NICE NG225 system-failure narrative |
| M26 | New case + episode — Amir, severe paediatric DKA, BSPED 2020 dose-band trap (pairs with Marcus) |
| M27 | Settings screen + hub board live mini-vitals & deterioration timers · trap-hints + reduce-motion toggles |
| **Audit** | Three parallel audits (code · clinical · game-design). 3 false-alarm code findings caught and discarded; clinical audit found no patient-safety errors. |
| M28 | Clinical citation hygiene: BSPED 2021, NG253, King's encephalopathy, NG244 annotation |
| M29 | Code hygiene: trapHints memo, sequenceErrors in episode debrief, topic_id + orphan-case validators, save-restore + episode-debrief sequence tests |
| M30 | Drug-chart styled management section + time-stamped actions (CaseRuntime.actionsAt) |
| M31 | ECG bank inline interpretation on tagged case ECGs (Patel + Okonkwo) |
| M32 | Perks-with-bite: Trap-aware forces trap hints on; Resus reflexes widens deterioration thresholds by 1 min |
| M33 | Daily case rotation: 'Today's pick' highlighted on the menu |
| M34 | Branching dialogue choices + rapport (Chloe + Stan) |
| M35 | must_not_do gated behind clinical reasoning (Amir + Okafor) |
| M36 | Investigation workup parsimony — essential ix + extras penalty (Beth + Marcus + Patel) |
| M37 | Co-worker NPC — Dr Aoife McGrath comments on the last shift on the menu |
| **Re-audit** | Game-design re-audit. M30/M35/M36 landed deep; M31/M32/M33/M37 shallow; M34 best content, weakest wiring. Next pass: wire systems into each other. |
| M34.1 | Stop rendering canonical response when a branch is picked — choice becomes consequence |
| M38 | Rapport gates content (Chloe / Stan) + silences source at ≤−2 + reaches the consultant memo |
| M39 | Dr McGrath enters the bay — three bedside interrupts (trap_caught / deterioration_takeover / unsafe_midshift) |
| M40 | Discoverable examination manoeuvres (Stan log-roll, Brennan pronator-drift + cranial nerves) |
| M41 | Interpolated vitals + trend arrows — patients deteriorate in real time, no jump-cut |
| M42 | Content backfill across new systems — branches on +3 cases, essentials on +3, gating on +3 |
| M43 | NPC sprites in history cards — paramedic / triage_nurse / sister / worried_partner / etc render next to source rows |
| M44 | Williams patient sprite (5 states) — sprite coverage 1/17 → 2/17 |
| M45 | Inline encounter prop sprites in the drug chart — syringe / IV bag / O2 mask / etc per action |
| M46 | World tiles parked + hidden Visual Style Guide (?style-guide=1) |
| M47 | Full multi-step ECG drill at the bedside — coverage Patel + Okonkwo + Ahmed |

## ⏳ WAITING ON DESIGN

Claude Design is still producing pixel sprites for the remaining 14
patients (Beth is fully authored). When a sprite set lands, add it to
`PATIENT_SPRITES` in `src/style/sprites.ts` using Beth's shape as a
template. No code changes needed beyond the registry entry.

## Numbers

- **295 / 295** unit tests passing (Vitest)
- **2 / 2** E2E tests passing (Playwright)
- **17 fully-authored cases**, **17 episodes**, **3 arcs**, 44-topic
  high-yield map
- **14 daily ECG challenges** rotating by day-of-year (2-week cycle)
- All clinical content cites current UK guidelines as of May 2026
  (NICE NG253 sepsis, NICE NG106 2025, NICE TA990 tenecteplase,
  NICE NG217 Jan 2025, NICE NG126 May 2026 anti-D, NICE NG225 self-harm
  Sep 2022, Baveno VII 2022 pre-emptive TIPS, MHRA 2024 EpiPen 25 kg
  threshold, MHRA Sep 2012 paracetamol IV NAC, TA1029 Jan 2025 ICH)

## Cases on the menu (17 shifts)

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
14. **Paracetamol overdose — staggered, safeguarding parallel** (ST3) — Chloe
15. **Overnight — the safety net** (ST3, 2 cases + 1 arc) — Chloe + Stan
16. **Paediatric DKA — BSPED-vs-JBDS dose bands** (ST3, paeds) — Amir
17. **Anaphylaxis solo** (CT2) — Beth (milestone-4 build)

Plus: **ED hub layout** (Phaser overworld with avatar + proximity
interact); **Daily ECG challenge** (11-rotation bank);
**Skill tree** (XP, SLO mastery, perks).

## Build targets

```bash
npm run dev               # dev server (http://localhost:5173)
npm run build             # multi-file static (for hosting)
npm run build:single-file # → dist/index.html self-contained
npm test                  # 257 unit tests
npm run validate-content  # YAML schema + cross-reference + reachability
npx playwright test       # 2 E2E smoke tests
```

## Open user items (pre-existing)

1. **Q-001 PDFs** — removed from HEAD; blobs remain in git history.
   Full purge needs `git filter-repo` + force-push; gated.
2. **Q-003 RCEMLearning credentials** — `mohm4216` in chat history.
   Please rotate.
3. **License** — no `LICENSE` file.

## Architectural reminders

- Kernel is pure deterministic TS; React subscribes via `tick` counter.
  Kernel never reads wall time.
- Whole-minute advance only (D-013).
- Save/resume snapshots versioned at `v: 1`; new fields like
  `sequenceErrors` are restored optionally for backwards compat.
- Per-case section memory in `ShiftView`'s `sections` map (renamed
  from `phases` in M9).
- **`SHIFT_DEFS` in `src/App.tsx`** is the single source of truth for
  the menu — adding a shift is one array entry + one factory.
- Shared `ClockBar` (`src/ui/shift/ClockBar.tsx`) used by encounter /
  board / hub screens.
- Locked palette in `src/style/palette.ts` (mirrors Claude Design's
  contract). Phaser uses the same hexes via `src/game/layout.ts`.
- Pixel-sprite engine in `src/style/sprites.ts`. `PATIENT_SPRITES`
  registry keys off `case_id` → state factories.
- Diegetic frame components in `src/style/frames.tsx`. SVG with
  `preserveAspectRatio="none"` so they scale to container.
- `IconRedFlag/MustDo/Trap/Countdown/TrendUp/TrendDown/NewInfo/Citation`
  in `src/style/icons.tsx` — 16×16 paint-by-string glyphs.
- Schema-level state-machine reachability enforced by
  `tests/state-machine-reachability.test.ts` — adding a non-terminal
  state requires an outbound transition.
- `case-playable.test.ts` validates every case is winnable via
  must_do + top differential + appropriate disposition.
- Sequence errors persist after untoggle: `cs.sequenceErrors` records
  every action ever taken out-of-order, even if subsequently
  un-checked. The −10 penalty reflects the decision the player made.

## First three commands on resume

```bash
git fetch origin claude/add-necessary-files-4THUA
git checkout claude/add-necessary-files-4THUA
npm ci
```

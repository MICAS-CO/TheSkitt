# Braintrust 01 — Opening Pass Synthesis

**Reviewers:** Gemini 3.1 Pro Preview (6 findings) + Claude Opus (8 findings)
**Bundle:** HANDOVER, build prompt, App.tsx, kernel.ts, schema.ts, EncounterScreen.tsx, all 17 cases, all 3 arcs (~163k input tokens)
**Cost:** Gemini ~$0.29; Opus free (existing env credentials)
**Date:** 2026-05-20, against baseline `c787a9c` (M79 import)

---

## Headline

The Skitt has proven its single-case loop. The two ambitions it has not yet earned are **multi-patient simulation** ("Dwarf Fortress depth") and **dialogue density** ("Disco Elysium voice"). Both have the same shape of failure: a kernel mechanic exists (the `inaction_by` deterioration system; the rapport −3..+3 gauge) but the content/scheduling can't drive it past its trivial state.

Two reviewers converged on this independently. Gemini named the simulation half (absolute-time triggers + no ambient throttling = the multi-patient board is a ticking script, not a system). Opus named the writing half (1.4 branched beats per case = the rapport gauge can't move past 0; the "pulling away" banner is functionally unreachable).

---

## Convergent findings (both reviewers flagged)

### C1. Kernel/UI boundary leakage — `getState()` returns mutable refs; view-state lives in `KernelState`

- **Gemini #3** (HIGH/architecture): `pendingInterrupt` and `pendingDeathNotice` are React-modal state inside `SimKernel`. Explicitly excluded from serialization → snapshot contract is broken by design.
- **Opus #4** (MED/architecture): `getState()` returns the live `KernelState` (incl. Maps/Sets that mutate in place). Two separate `getState()` calls in one render tree (EncounterScreen L2846, HistoryPhase L3316). The `useSim((s) => s.tick)` shim at L2844 exists only to force re-renders.
- **Joint diagnosis:** The kernel was designed read-only-by-convention rather than read-only-by-shape. The original build prompt asked for "a deterministic event scheduler / tick loop … React/Phaser are just views onto it." Today the scheduler leaks both directions.

### C2. EncounterScreen is the project's default junk drawer

- **Gemini #5** (MED): `collectClues`, `computeBadge`, `DifferentialPhase`, `DebriefPhase` all inline. Calls `kernel.recordAsk`, `kernel.toggleAction` deep in nested renders.
- **Opus #3** (HIGH): 15 components in one 1331-line file. Three of them (Modal/WalkIn/Emote) own their own intervals + SVG `dangerouslySetInnerHTML`. **Silent gameplay bug found:** `DifferentialPhase` keeps `selectedClues` as React local `useState<Set>` at L3801 — tabbing away from Differential and back loses every clue the player selected.
- **Joint diagnosis:** The file is the project's destination for any beat that fires inside an encounter. M61 carved out the phase bodies but nothing has been pulled out since.

### C3. Rapport system is real, but the content can't drive it

- **Gemini #4** (MED/voice): Chloe's compassionate branch dumps intent + plan + regret in one 40-word block — rapport as vending-machine reward.
- **Opus #1** (CRIT/voice): 24 branch_choices across 17 cases; 11 of 17 have exactly ONE branched beat; none have ≥3. The `rapportCollapsed = cs.rapport <= -2` state at EncounterScreen L3331 is functionally unreachable in normal play because there aren't enough dismissive branches to get there. Disco's bar isn't the quality of one line — it's the density of consequential choices.
- **Joint diagnosis:** Gemini found a specific instance (vending-machine writing); Opus found the underlying density problem. Two views of the same gap.

---

## Independent findings worth keeping

### G1. **Absolute-time `inaction_by` triggers break concurrent play** — Gemini, CRITICAL/gameplay
`sim/kernel.ts` evaluates `inaction_by` against `this.state.clockMin >= trigger.min`. In `case_ectopic_minors_sarah.yaml`, Sarah arrests at min 16 — but if the player spends 17 min on Beth's resus first, Sarah dies off-screen before the player ever opens her case. **The multi-patient sim is currently choreographed for one linear path.** Fix: switch to `elapsed_min` since triage or `enteredAt`.

### G2. **No location-lock during investigations** — Gemini, HIGH/clinical
Ordering a CTPA does not move the patient to `scanner`. Player can keep examining a patient who is in theory away for imaging. Fails the FRCEM resource-management bar.

### G3. **Death modal "debrief now" doesn't halt sim** — Gemini, MED/gameplay
Clicking debrief changes section but `kernel.isRunning` stays true; ambient cases keep degrading during debrief.

### O1. **Recurring NPCs drafted then abandoned at the shift seam** — Opus, HIGH/voice
Dom the paramedic in Beth's case (named, given shift-since-06:30 voice, EXPLICITLY tells the player "the friend Sarah came with us, she had belly pain, I think she's pregnant" — L5266) is **absent entirely** from Sarah's case (no paramedic source in her history). Anya the triage nurse has identical fate. The arc reveal is already there — only the *who tells you* is missing. ~6 history items of authoring lifts the catalogue from "linked cases" to "an ED with regulars."

### O2. **Pause-budget + ambient throttling absent from kernel** — Opus, HIGH/gameplay
`pause_budget` term has zero grep hits in the codebase. The original prompt opens with "pressure should feel like a busy ED, not a reaction-time test"; the audit-fixes-3 note explicitly calls for 30s/15s per shift-minute. Today there is no felt cost to dwelling. **13 of 17 shifts ship as solo cases.** Dwarf Fortress works because watching is expensive; Skitt makes time pass without making attention cost.

### O3. **Citation density is bimodal — paeds + obstetric are SAQ-vulnerable** — Opus, HIGH/clinical
Range: Amir paeds DKA (4 citations) → Kowalski variceal UGIB (18). The lightest-cited cases (Amir, sibling anaphylaxis, Sarah, Marcus) are precisely the cohort an FRCEM examiner can ambush. Specific gaps named: Amir's corrected-Na warning + cerebral-oedema mortality (need BSPED 2021), Sarah's TVUSS-first-line + Anti-D (need NG126 §1.4).

### O4. **No mid-shift fail-state escape** — Opus, HIGH/gameplay
`replayShift()` at App.tsx L964 restarts the entire episode. Kill a patient in a two-case shift = either swallow 10 min of nothing or scrap the whole shift. Punishes the curious learner — exactly the audience the project is for. Fix is `kernel.rewindCase(caseId, toTransitionId)`.

### O5. **Wrong-disposition epilogues vary from genuinely-Disco to procedure-note** — Opus, MED/voice
Beth's wrong-discharge epilogue ("She is back at 23:40 with biphasic angioedema. Tom rings 999 from the car park.") vs Patel's ("Door-to-balloon would have been 78 minutes from here. The decision is reviewable next week at M&M."). Variance teaches mistrust. Rule for the pass: name a person who is not in the bay and what they are doing at that moment.

---

## Prioritised work plan

### Tier 1 — must fix before next playtest

**T1.1 — Switch `inaction_by` to elapsed-since-triage** *(G1, critical)*
- `sim/kernel.ts`: rewrite `triggerMatches` for `inaction_by` to compare against `clockMin - case.enteredAt` rather than `clockMin`.
- Sweep all 17 case YAMLs; verify each `inaction_by` minute is intended as "minutes since arrival" not "global clock minute." Update where needed.
- Add a unit test: case A entered at T+5 with `inaction_by: 16` should fire at T+21, not T+16.
- Scope: ~1-2 hours coder time, full reviewer pass.

**T1.2 — Disco-density content floor** *(C3 + Opus #1, critical voice)*
- Per-case floor: 4 branched history beats + 2 `min_rapport` disclosures.
- Add a "silencing branch" (`rapport_delta: -2`) to one early history item in every case so the "pulling away" banner becomes a reachable failure mode.
- Beth + Brennan as templates; port density to the 11 single-branch cases.
- Scope: ~40-60 branches of authoring. Could be staged 4-5 cases at a time.

### Tier 2 — high leverage, scoped

**T2.1 — EncounterScreen split + lift `selectedClues` to kernel** *(C2 + clue persistence bug)*
- Carve `./encounter/consultant/{Modal,WalkIn,Emote}.tsx`, `./encounter/DebriefScreen.tsx`, `./encounter/dialogue/{HistoryPhase,BranchPicker,HistoryNpcSprite}.tsx`.
- Move `selectedClues` from React local state to `cs.selectedClueIds` in kernel.
- Scope: ~3-4 hours, reversible refactor + one real bug fix.

**T2.2 — Kernel boundary tightening** *(C1)*
- `Object.freeze` snapshot return from `getState()`; narrow selectors (`getCaseRuntime`, `getDeteriorationTimers`).
- Move `pendingInterrupt`/`pendingDeathNotice` out of `KernelState` to a separate `ui-events` Zustand store.
- Remove `tick` force-refresh shim once selectors are value-equal.
- Scope: ~2 hours, touches many call sites.

**T2.3 — Pause-budget + ambient-case dyads** *(O2)*
- Add `kernel.pauseBudget` (cap 30s/shift-min), surface as thin bar on ClockBar.
- Exhausted → McGrath "standing around" interrupt + ambient case state silently advances.
- Re-shape Marcus+Morrison, Okafor+Patel, Ahmed+Okonkwo as two-case shifts (cases already exist; just pair them in SHIFT_DEFS).
- Scope: ~3-4 hours kernel + small content adjustments.

**T2.4 — Recurring NPCs (Dom → Sarah, Anya → Patel/Stan)** *(O1)*
- Author ~6 paramedic-sourced history items for Sarah, gated by `arc_hendo_dinner` reveal.
- Same surgery for Anya across overnight cases.
- Scope: ~1 hour authoring.

**T2.5 — Citation parity sweep (Amir, Sam, Marcus, Sarah)** *(O3)*
- Specifically: Amir corrected-Na + cerebral-oedema mortality → BSPED 2021; Sarah TVUSS + Anti-D → NG126 §1.4; Marcus DKA bedside thresholds → JBDS-IP 2023.
- Scope: ~1 hour per case = 4 hours.

**T2.6 — Mid-shift `rewindCase()`** *(O4)*
- `kernel.rewindCase(caseId, toLastStableSnapshot)`; "Study Mode rewind" button in PatientDeathModal; debrief flag = `studied_not_played`.
- Gate behind CT1 difficulty (off in F1).
- Scope: ~2 hours.

### Tier 3 — medium

- **T3.1** Location-lock during investigations (G2) — `location: scanner` state; lock History/Exam/Mx phases while away. ~2 hours.
- **T3.2** Death modal halts sim (G3) — `kernel.endShiftEarly()` called from PatientDeathModal `onDebrief`. ~30 min.
- **T3.3** Wrong-disposition epilogue pass (O5) — one rule: name a person not in the bay and what they're doing. 17 epilogues. ~1 hour.

---

## What two reviewers agreed on as the single biggest move

- **Gemini's overall_take:** "If you change ONE thing before the next playtest, it must be decoupling patient deterioration from absolute shift-minutes." → **T1.1**
- **Opus's overall_take:** "Rapport must stop being a one-shot per case. Until rapport is a continuous variable the player feels they're holding through the encounter, every case is a tutorial wearing Beth's dress." → **T1.2**

These are different recommendations, but they're not in conflict — they're the simulation half and the writing half of the same underlying observation (the kernel mechanic outpaces the content/scheduling that drives it). T1.1 is smaller and more demo-able for the pipeline; T1.2 has higher total leverage but is content-heavy.

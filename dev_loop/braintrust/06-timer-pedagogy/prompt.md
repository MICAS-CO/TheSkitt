# Braintrust 06 — Does the timer mechanic teach the wrong thing?

The author wants a single design question put to two reviewers in parallel. Argue for or against the thesis, hard. Don't hedge.

## The question

**Does the 20-minute simulated shift clock — and especially the per-case `deterioration_if_not_x_by_t` events — incentivise corner-cutting by the player, and could this lead to maladaptive learning for the FRCEM-candidate target audience?**

## The build, factually

**TheSkitt** is an episodic emergency-medicine RPG (study tool / Disco-Elysium-influenced narrative shape) built for UK + Ireland + Commonwealth FRCEM SAQ candidates. The player runs a fictional ED shift on a 20-minute simulated clock. The phase pipeline per case: history → exam → investigations → differential → management → disposition → debrief. Multiple cases sit on a tracking board simultaneously; the player picks the order.

**Score components (per case, capped 0-100%):**
- `must_do` actions completed: weight 70/100
- Working diagnosis correct (yes/no): +15
- Disposition appropriate (yes/no): +15
- Safety penalty: -20 per `must_not_do` action chosen
- Sequence penalty: -10 per sequence error (out-of-order ix or mx)
- Workup parsimony penalty: -2 per extra investigation beyond a 2-ix free allowance, capped at -10
- Band assignment: `unsafe` if patient arrested/deceased OR a must_not_do was chosen; otherwise tier-thresholded percent (excellent/good/borderline). Tier thresholds adjust per character grade (Intern = lenient, SHO = lenient, Registrar = standard).

**Time-related mechanics:**
- The shift clock is a hard budget: 20 minutes simulated, real-time advance unless paused. Ends when clock = duration.
- 12 of 18 episodes have at least one `deterioration_if_not_x_by_t` event. Example (the anaphylaxis solo shift): if the player has not toggled `mx_adrenaline_im` by T+5 minutes, Beth's case state transitions to `arrested` — and the score for that case becomes `unsafe` regardless of what's done after.
- Other event types include `family_arrival`, `results_back`, `bed_manager_pressure`. The clock also gates investigation result reveals (results return at T+N depending on the test).
- McGrath (the consultant NPC) fires bedside interrupts when the player is about to perform a `must_not_do` action OR when deterioration fires while required actions are still unticked — taking the case off the player at that point.
- There is no direct "spent too long" score penalty. Slowness only hurts the player insofar as it causes deterioration timers to fire or the shift clock to run out.

**Speed-rewarding mechanics:**
- Beating deterioration timers (act fast → patient stays stable → score intact).
- Multiple cases on board mean the player has to triage attention across patients.
- The 20-min shift hard-budgets total play time.

**Speed-PENALISING mechanics:**
- Workup parsimony (extra investigations dock score) — but this penalises over-investigation, not slowness.
- Sequence errors (e.g. starting antibiotics before culturing) — order matters.

## Background on the target audience + exam

- FRCEM (Fellowship of the Royal College of Emergency Medicine) is the UK exit exam for EM. The SAQ (short-answer questions) paper tests structured written reasoning on managed patient scenarios. There is exam time pressure but it's per-question, not per-step.
- The MAIN cognitive demand FRCEM tests:
  * Systematic differential generation
  * Appropriate, justified investigation choices
  * Safety-conscious management
  * Pattern recognition for red flags
  * Knowing when to escalate
- The exam does NOT directly test "managing time pressure in resus" — that's the OSCE / workplace assessments.
- Candidates are typically post-CT3, often ST4+ trainees, with several years of clinical floor experience. They've seen the real time pressure already. What they need from study is structured reasoning practice.

## The author's actual concern

The author's worry, in their own words:

> Does the timer feature being one of the core mechanics in the game incentivize corner cutting? Is this a potential adverse educational consequence that could lead to maladaptive learning?

**Specific maladaptive behaviours this could produce:**
1. Skipping history-taking branches (rapport beats, narrative depth) to reach management faster.
2. Reflexive pattern-matching ("this is anaphylaxis, give adrenaline") instead of differential reasoning ("what else could cause this presentation?").
3. Ordering only "the obvious" investigation, missing trap diagnoses that need a broader workup.
4. Learning "the answer is whatever lets me beat the timer" — i.e. instrumentalising clinical reasoning into pattern-action shortcuts.
5. Performance anxiety transferring to the FRCEM exam, where speed is NOT the bottleneck.

**The competing concern:**
- Real ED practice has real time pressure. Stripping it out makes the simulator a wiki — turn-based clinical reasoning with no stakes.
- The deterioration timers TEACH which presentations are time-critical (anaphylaxis, dissection, stroke, status epilepticus, anaphylaxis, massive PE). That IS valuable clinical knowledge.
- Without any stakes, decisions feel weightless and the player learns less.

## Your task

**Pick a side and argue it.** Don't deliver a balanced essay. The author can synthesise; what we need from each reviewer is an unambiguous claim + the strongest argument for it. Specifically:

1. **Does the concern land?** Is the maladaptive-learning risk real, partly real, or overblown? Be specific about which behaviours from the list above (or others) you think are most/least likely.

2. **If yes — what's the design fix?** Concrete. Not "rebalance the timers." Tell me what to change in code/content. Options to evaluate (don't limit yourself to these):
   - Remove all `deterioration_if_not_x_by_t` events. The clock becomes a soft budget for "this is one shift's worth of work."
   - Keep deterioration events ONLY on the textbook time-critical presentations (anaphylaxis, dissection, stroke onset, status, paeds DKA), drop them everywhere else.
   - Add a "pause and reason" mode that doesn't punish — explicit "training wheels" the player can toggle.
   - Replace deterioration timers with REASONING checks (the patient gets worse if your differential is too narrow, not if you're slow).
   - Reverse the score weighting — reward thoroughness explicitly; cap the speed bonus.
   - Add a debrief beat that calls out the player's reasoning depth specifically: did you actually consider the differential, or did you pattern-match?
   - The current Registrar tier "standard" thresholds are 90/75 — should those drop so the player isn't punished for taking the time to be thorough?
   - Something else entirely.

3. **If no — make the affirmative case.** Why is the current design pedagogically sound for FRCEM candidates? What evidence (literature, simulation pedagogy, the specific cognitive demand of EM) supports the timer pressure as authored?

4. **Bonus: would the answer differ for the Intern/SHO tier vs the Registrar tier?** The Registrar tier is the FRCEM target; the Intern/SHO tiers are framed as easier difficulty wrappers. Could the timer pressure be appropriate for one tier and harmful for the other?

## Format

Free prose. ~800-1500 words. Don't hedge into "on the one hand / on the other hand" — pick a position. If you want to acknowledge a counter-argument, do it briefly to dismiss it, not to balance.

No JSON, no schema. The author will read your prose directly.

End with three lines:
  - **Verdict (one line):** [concern lands / concern is overblown / concern is partly real — be precise about which parts]
  - **Single highest-priority change:** [one concrete code/content edit if action is warranted, else "none"]
  - **Confidence:** [low / medium / high]

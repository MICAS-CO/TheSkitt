# Opus take — timer pedagogy

The concern lands, and it lands harder than the author has framed it. But the fix is surgical, not wholesale, and the author's instinct to interrogate it before the build calcifies is correct. I'll argue: **the 20-minute shift clock is fine; the per-case deterioration timers are over-deployed by ~6 episodes and they're training the wrong cognitive shape for 60-70% of the catalogue.** Let me say why, then say what to change.

## The two timer mechanics are doing different jobs and one of them is good

It matters that you're not asking one question, you're asking two.

The 20-minute shift clock is a **triage budget**. It forces the player to allocate attention across multiple patients in parallel, which is the single most ED-specific cognitive skill there is. Internal medicine ward rounds aren't this. Outpatient clinic isn't this. The thing that distinguishes EM from every other branch of acute care is "I have N patients of varying acuity and a finite N-minutes of clinical attention; which one do I touch next, for how long, and on what evidence?" The 20-minute clock teaches that. It is pedagogically the most defensible time mechanic in the build, *because* it doesn't push the player to be fast on any single case — it pushes them to make conscious allocation choices. Keep it.

The per-case `deterioration_if_not_x_by_t` events are a different beast. They are **act-or-die clocks** on individual presentations, and 12 of 18 episodes have them. That ratio is the problem.

## Why act-or-die clocks misfire pedagogically for ~6 of those 12 cases

The author's worry about "skipping history-taking to get to management" is real but it's not the worst failure mode. The worst failure mode is something subtler: the player learns to **enter every case with a Markov-chain heuristic** ("read the chief complaint → pattern-match → fire the must-do action → next") because that's what beats the clock most reliably. The clock doesn't reward Bayesian reasoning ("what's the prior, what does the history shift it, what does the exam shift it again, what does the ix confirm or refute") because Bayesian reasoning takes time and time is the thing being penalised.

This matters specifically for the FRCEM-candidate audience because FRCEM SAQ doesn't test Markov-chain reflex action. It tests, almost without exception, structured differential reasoning and the comprehensiveness of the candidate's investigation + management approach. The exam mark-point format is "give 3 differentials, give 4 investigations with justification, give 5 management priorities." A candidate who has been drilled by The Skitt's current timer mechanics has been *negatively* trained on the cognitive shape FRCEM rewards — they've learned to pick the single most-likely diagnosis and act on it before considering the rest. Croskerry's diagnostic-error literature is on the author's side here: premature closure is the single highest-cost cognitive bias in EM, and time pressure is the empirically strongest cause of it.

## But the concern is *partly real*, not *fully real*

Here's where I push back on the strongest version of the worry. There are six presentations in the catalogue where the act-or-die timer is **clinically correct and pedagogically valuable**:

1. **Anaphylaxis (adult + paeds)** — Resus Council UK 2021 explicitly times adrenaline. Five-minute window is real. Teaching the player to recognise + treat fast here is the right cognitive habit.
2. **Aortic dissection** — IRAD mortality data: ~1-2% per hour untreated. The clock is real and the case's teaching point is precisely "don't anchor on STEMI, the dissection clock is running."
3. **Stroke onset** — NICE NG128 thrombolysis window is hard at 4.5 hours; thrombectomy at 24. The player learning "the clock starts at LSW" is the case.
4. **Status epilepticus** — NICE NG217 escalates benzo → second-line → anaesthetic at fixed intervals. The intervals ARE the teaching.
5. **Severe paediatric DKA** — cerebral oedema risk is tied to fluid timing + osmolar correction rate. The clock is the safety check.
6. **Massive PE in shock** — thrombolysis-vs-embolectomy decision has a haemodynamic clock.

For these six, the deterioration timer is doing real teaching work. Drop the timer and you've removed the case's clinical edge.

The other six episodes with `deterioration_if_not_x_by_t` events — that's where the author's concern lands. Without naming them all, the pattern is: cases where the underlying clinical course is hours-to-days (UGIB resuscitation, HTN emergency BP-lowering, head injury observation, AHF diuresis, paracetamol staggered NAC), but the build has imposed a 5-10-minute act-or-die timer because the author wanted the case to "feel urgent." The urgency isn't textbook. The player is being trained on a fictional time pressure that doesn't exist in the literature, and they're being penalised for reasoning at the actual clinical pace.

(Special case: paracetamol staggered. NAC initiation is genuinely time-sensitive — within 8 hours of the *last* ingestion for maximum benefit — but the build's clock is a 20-minute simulated shift, not the 8-hour ingestion window. So the timer in the build is teaching the wrong scale of time. This is the one I'd most loudly remove.)

## The fix, in priority order

1. **Audit the 12 episodes with deterioration events. Keep them on the six clinically-time-critical presentations. Remove them from the other six.** Replace the removed timers with — and this is the substantive design move — *reasoning-depth checks* instead of *speed checks*. The case state can still degrade, but it degrades when the player's working differential is too narrow or they've missed a red-flag clue, not when the player took 12 minutes instead of 8.

2. **Add a "differential breadth" score component.** Right now the scoring rewards "you picked the top diagnosis." It should also reward "you linked clues to multiple plausible diagnoses before committing." Specifically: a +10 component for having ≥3 differentials with at least one supporting clue linked each, before lock-in. This is the closest the score can get to teaching FRCEM-shaped reasoning explicitly. Right now there's nothing in the score that rewards a wide net.

3. **The debrief needs to call out reasoning depth, not just outcomes.** A line at the top of the debrief: "Your working differential: anaphylaxis (correct) — and 2 others linked." vs "Your working differential: anaphylaxis (correct) — no other differentials considered." That second line is the player's wake-up call. Even when they got it right, were they reasoning, or pattern-matching?

4. **Don't add a "pause and reason" mode.** The author lists this as an option. I'd refuse it. A discretionary pause that doesn't punish is structurally the same as removing the timer; it just adds a button between the player and the mechanic. The player will use it as a debugging tool, not a learning tool. If the timer is wrong on a case, fix the case; don't add an escape hatch.

5. **The Registrar / SHO / Intern tier distinction is the right place to soften act-or-die further for novice players.** Currently the tiers only shift score bands and trap-hint defaults. They could ALSO halve deterioration timer urgency for Intern (anaphylaxis adrenaline window at T+10 not T+5; dissection mortality clock slowed), and McGrath's bedside takeover (`composeDeteriorationTakeoverInterrupt`) should fire EARLIER for Intern so the patient doesn't die — McGrath catches the case and walks the player through what was missed. The Intern tier should be "you can't kill a patient" by design; the Registrar tier is where the consequences are full-weight.

6. **The workup parsimony penalty (-2 per extra ix beyond a 2-ix allowance, capped at -10) should probably go.** It mildly penalises the FRCEM-shaped behaviour of "list a comprehensive workup." The 2-ix free allowance is arbitrary; ED reality is most acutely-unwell patients have 4-6 essential investigations. Drop the penalty entirely, or reframe it as a positive reward for parsimony rather than a punishment for thoroughness.

## What I'd NOT change

The 20-minute shift clock. Keep it. Triage allocation across multiple patients is the most ED-specific cognitive skill, and the clock is the only mechanic teaching it. If anything, vary it across shifts (15 min for a quiet day, 30 for a true overnight) so the budget varies and the player has to recalibrate.

The score weighting (70% on must_do, 15+15 on dx and disposition) — fine. Don't touch it without a specific argument; the author has already done that work.

The current trap penalty (-20 per must_not_do) — fine. Safety errors should be cheap to spot in the debrief and expensive in the score.

---

**Verdict (one line):** Concern is partly real — the 20-min shift clock is good; six of the twelve `deterioration_if_not_x_by_t` episodes are training the wrong cognitive shape for FRCEM candidates.

**Single highest-priority change:** Audit and remove `deterioration_if_not_x_by_t` events from non-time-critical episodes (UGIB / HTN / head injury without acute deterioration / AHF / paracetamol staggered / overnight nights), keep them on the six clinically-time-critical cases (anaphylaxis x2, dissection, stroke onset, status, severe paeds DKA, massive PE in shock).

**Confidence:** medium-high.

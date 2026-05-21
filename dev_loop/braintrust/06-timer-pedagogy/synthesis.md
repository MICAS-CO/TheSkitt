# Braintrust 06 — Timer pedagogy synthesis

**Reviewers:** Gemini 3.1 Pro Preview + Claude Opus, in parallel
**Cost:** Gemini ~$0.03; Opus free (env creds)
**Date:** 2026-05-20, against `0c0b9f4` (M84)
**Trigger:** Author surfaced a single design concern about the core timer mechanic.

---

## The question (verbatim)

> Does the timer feature being one of the core mechanics in the game incentivize corner cutting? Is this a potential adverse educational consequence that could lead to maladaptive learning?

---

## Where the reviewers AGREE

**The concern lands. Both reviewers say yes, this is a real risk for FRCEM candidates specifically.** Neither hedged.

**Both identified the same failure mode:** reflexive pattern-matching / premature closure, with the player learning to strip-mine the chief complaint for keywords, fire the obvious must-do action, and skip the history / differential reasoning that the FRCEM SAQ actually tests. Croskerry's diagnostic-error literature is on the author's side.

**Both flagged the FRCEM-specific mismatch:** the exam tests structured, systematic, slow-brain reasoning. The current build trains fast-brain reflexive action. The cognitive shapes are opposed.

**Both agreed the Intern/Registrar tier distinction matters.** Time pressure is more pedagogically appropriate for Intern/SHO (still building reflexes) than for Registrar (the FRCEM target, expected to have reflexes already, being tested on wisdom).

**Both agreed the 20-minute SHIFT clock and the per-case DETERIORATION timers are doing different jobs** and should be evaluated separately. (Although they reach different conclusions about whether to keep the shift clock — see below.)

---

## Where the reviewers DISAGREE

### Gemini Pro — architectural overhaul

> "The solution is to fundamentally change how time is calculated in the game engine. Change the clock from a real-time 20-minute countdown to an Action-Driven (Turn-Based) Clock."

Gemini's verdict: concern lands **completely**, confidence **high**. The fix is architectural — time should ONLY advance when the player commits an in-game clinical action (history question, exam, ix order, mx toggle). Sitting on the differential screen for 10 real minutes costs zero in-game time.

Gemini's fallback: auto-pause the shift clock whenever the player is inside a patient's chart / reasoning UI. Clock only ticks on the tracking board.

### Opus — selective audit, keep the shift budget

> "The 20-minute shift clock is fine; the per-case deterioration timers are over-deployed by ~6 episodes and they're training the wrong cognitive shape for 60-70% of the catalogue."

Opus's verdict: concern lands **partly**, confidence **medium-high**. The 20-minute shift clock teaches **triage allocation across multiple patients** — the single most ED-specific cognitive skill. Keep it. The problem is the 12 of 18 episodes with `deterioration_if_not_x_by_t` events: six of those clocks are clinically real (anaphylaxis, dissection, stroke onset window, status, severe paeds DKA, massive PE in shock); the other six are inventions that train fictional time pressure.

Opus's fix: surgical. Keep timers on the six time-critical cases; remove from the others. Replace removed deterioration triggers with **reasoning-depth checks** (case degrades on narrow differential, not on slowness). Add a **differential breadth** score component (+10 for ≥3 differentials with ≥1 clue each linked). Audit and possibly remove the workup-parsimony penalty (currently mildly punishes FRCEM-shaped thoroughness).

---

## The argument that needs adjudicating

Gemini's strongest claim — that **the optimal way to play the current build is to skip narrative, ignore differential generation, and click the must-do toggle as fast as possible** — is correct, and the score components support it. The score doesn't reward differential breadth, history depth, or reasoning quality. It rewards "did you toggle the right management item before the deterioration event fired?"

Opus's strongest claim — that **the 20-minute shift clock is doing irreplaceable triage-training work** — is also correct. Real ED practice is overwhelmingly about attention allocation across multiple patients, not about being fast on any single one. An action-driven clock erases that.

These are both true. They point at different time mechanics, and the right move is to address them differently.

---

## Convergent recommendation

The reviewers' takes pull in different directions but they map onto two distinct mechanics, so both fixes can land without contradiction.

### Tier 1 — must-do (the concern lands; ship a fix)

1. **Pause the clock when the player is inside the reasoning UI.** Specifically: while the player is on the History, Examination, Investigations, or Differential sections, the shift clock does not advance. It resumes on the board, on Management, on Disposition. (This is Gemini's fallback, applied selectively: it protects the slow-brain UI from real-time pressure, while keeping the clock as a triage budget when the player is choosing between patients.) This is the highest-leverage single change.
2. **Audit the 12 episodes with deterioration timers. Keep them on the 6 clinically-time-critical presentations** (anaphylaxis adult, anaphylaxis paeds, dissection, stroke onset, status epilepticus, severe paeds DKA, massive PE in shock — that's actually 7 but #6 is borderline). **Remove deterioration events from the other 5-6** where the underlying clinical course is hours-to-days (paracetamol staggered, HTN emergency, UGIB resus, head injury observation, AHF, overnight metabolic / safety net / sepsis variants). For removed cases, the case-state degradation transitions to reasoning-depth triggers (narrow differential, missed red flag) rather than wall-clock triggers.
3. **Add a "differential breadth" score component.** +10 for the player having locked-in or linked clues to ≥3 differentials before working_dx commit. This is the closest the score can get to FRCEM-shaped reasoning. Currently nothing in the score rewards a wide net.

### Tier 2 — should-do (clean up at the same time)

4. **Tier-aware deterioration urgency.** Intern/SHO get longer windows (anaphylaxis at T+10 not T+5; dissection mortality clock halved). McGrath's `composeDeteriorationTakeoverInterrupt` fires earlier for Intern — they cannot kill a patient by design. Registrar tier gets the literature-true clocks.
5. **Drop the workup parsimony penalty** (-2 per extra ix beyond 2-ix allowance, capped at -10). It mildly punishes FRCEM-shaped comprehensive workup behaviour. Reframe as a positive reward for parsimony if a reward signal is wanted at all.
6. **Add a debrief beat that calls out reasoning depth explicitly.** Top of debrief: "Your working differential: X (correct/incorrect) — and N other differentials with clues linked." Players who get it right via pattern-matching see "0 other differentials linked" and learn what the game actually wants from them.

### Tier 3 — explicit refusals (do NOT do these)

7. **Do NOT add a discretionary "pause and reason" mode that doesn't punish.** Opus argued against this: it's structurally identical to removing the timer but adds a button between the player and the mechanic. Players will use it as a debug tool, not a learning tool. If the timer is wrong on a case, fix the case.
8. **Do NOT do a wholesale conversion to action-driven time.** Gemini argued for this; Opus pushed back; the synthesis position is that the 20-minute shift clock is doing real triage-training work that an action-driven clock would erase. The compromise — pause-in-reasoning-UI (Tier 1 #1) — captures most of what action-driven time was trying to fix without losing triage.

---

## Cost of doing this

Not small, but well-bounded. Multi-iteration:

- **M85 — Pause-in-reasoning + differential breadth score:** the highest-leverage single iteration. Touches `src/sim/kernel.ts` (clock advance gating), `src/state/sim.ts` (new score component), `src/ui/encounter/EncounterScreen.tsx` (visual cue when clock is paused). Probably ~6-8 hours.
- **M86 — Deterioration audit + content reshape:** content-side work. Identify the 5-6 episodes where the deterioration timer is invented; edit their scheduled_events to remove the deterioration triggers or replace with reasoning-depth-degradation events. Schema may need a new event type (`degrade_if_differential_narrow`). Probably ~8-12 hours including content authoring + new tests.
- **M87 — Tier-aware deterioration + debrief reasoning beat + workup penalty removal:** smaller polish iteration after the two big ones. Probably ~3-4 hours.

---

## Reviewers split on confidence

- **Gemini confidence:** high. "Real-time pressure directly subverts the slow-brain differential reasoning required for the FRCEM SAQ."
- **Opus confidence:** medium-high. Same direction, narrower scope.

Both reviewers consider this concern more important than several of the M81 design questions. The pedagogy mismatch is foundational — if the core mechanic teaches the wrong cognitive shape, the rest of the build's craft is undermined regardless of how well the rota / e-portfolio / case content land.

---

## Recommended next move

The author should pick one of three paths:

**A. Land Tier 1 now (M85+M86 over the next two iterations).** Address the substantive concern before more content lands on top of the current mechanic. Cost: ~14-20 hours of work over two iterations.

**B. Land Tier 1 #1 alone (just the pause-in-reasoning-UI change) as a fast M85.** Single mechanic shift, ~4-6 hours. The deterioration-event audit can come later when the author has time to do content authoring properly.

**C. Defer the whole thing.** Acknowledge the concern in HANDOVER, file as known limitation, address when the build's content authoring is more mature.

Both reviewers would prefer A or B over C. The structural concern is real and the longer it sits the more content lands on top of it.

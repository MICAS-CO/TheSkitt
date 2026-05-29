# Opus take — narrative thread through the rota

Yes. But not the version of yes the author is probably hoping for, and not the version a Disco-Elysium fan would design at the whiteboard. The build should have a narrative thread, and the reason it should is purely pedagogical, and the moment the narrative thread stops paying off as pedagogy it should be cut. I'll argue for shape B — recurring-patient continuity — with one specific constraint: every payoff beat is a cognitive task the FRCEM exam would set, not a story-beat the player consumes.

## Why the question lands

The author has just spent three braintrust iterations defending this build against pattern-match-the-answer reflex (timer pedagogy, premature closure, differential breadth scoring). The temptation to add a narrative thread NOW is the structurally opposite temptation. A through-line that pulls the player through twenty shifts to "find out what happens to Stan" is the gravity well of entertainment, and that gravity well is what separates Disco Elysium from every CME revision app and also what makes The Skitt a coherent build instead of a textbook. The author's choice on this question determines whether the next six months of work pulls the product toward Anki-with-vibes or toward the thing it actually claims to be — which is a study tool whose study power comes from the narrative scaffold, not in spite of it.

What I want to argue against, hard, is the version where narrative is decoration on top of the cases. "Wouldn't it be nice if McGrath ages a little." "What if Akin recurs." That's pleasant. It's the wrong question. The right question is: where would FRCEM-shaped reasoning actually benefit from cumulative cross-shift memory the player is forced to carry? And the answer is: at exactly the places where FRCEM tests cumulative cross-shift memory, which is several places, and the build is leaving them on the table.

## The case for shape B (recurring-patient continuity)

Look at the casting table the author already put in front of us. Stan appears in three shifts. Beth in three. Williams in two, Brennan in two, Chloe in two, Patel in two. The build is already a soap opera; the build just doesn't know it yet. None of these patients currently *know* they've met the player before, because the kernel has no cross-shift state for cases. Each shift loads a fresh case-runtime; the patient's vignette renders the same way regardless of whether this is the player's first or third encounter with them. That is a mechanical failure of the existing content's promise.

It is also exactly the cognitive frame FRCEM tests for in its safeguarding, mental health and frequent-flyer SAQs. The question the exam is asking, in code: *given a patient who has presented three times in four months, what is your pattern recognition?* The build can put a player in that exam-shaped cognitive frame at no additional content cost — Stan is already there three times. What's missing is the mechanism that lets the player KNOW he's there three times.

So the thread I would build is: every recurring patient appearance is a chance to test whether the player remembered the previous appearance, and the test is implemented as a single conditional vignette paragraph + a single conditional history-item unlock keyed off the rota's `completedShifts` log. Concretely, Stan in `ep_overnight_safety_net` gets a vignette preamble that says "the same charge nurse who handed you his card on your first day is handing it to you again — same trolley, same pattern" if-and-only-if the rota records `ep_minors_day_entry` completed. The history item `hx_previous_attendances` unlocks automatically because the player has lived them. The safeguarding question — *recognise the pattern* — is now a CONFIRMED experience the player has had, not an authored line they read on a card.

This is the version of the narrative thread that EARNS its keep. The player who plays through the rota linearly gets a richer story than the player who jumps in and out via the M83 e-portfolio replay button. That richness is the FRCEM-shaped reward. Skip a rota shift and the next time you see Stan, the safeguarding question is one of difficulty; play the rota in order and the safeguarding question is one you've already lived.

## What I would refuse

Shape A (player-character arc with McGrath aging her voice toward the player) is the temptation I'd refuse first. McGrath's M86 consultant interrupts and post-shift memos are already doing this work via her band-dependent tone shifts; the system exists, it persists across shifts via `state/consultant.ts`, and the author has invested in it. Adding a more explicit "she's testing you" → "she trusts you" → "she asks your opinion" arc layers a narrative reading on top of a mechanic that already does the job. It's narrative tax, not narrative payoff.

Shape C (department-level arc — the ED itself changes) is the temptation I'd refuse second, with regret. NHS-realistic. Atmospheric. Zero pedagogical payoff. If you spend an iteration on a referral pathway that breaks at the midpoint, you've spent an iteration the build doesn't have on something that doesn't move an FRCEM mark. The product is a study tool with narrative scaffolding, not a workplace simulator.

Shape D (Disco-Elysium mystery arc — the player figures out a recurring pattern by block 3) is the most seductive and I would still refuse it, more cautiously. The reason: a mystery thread requires the player to do something they don't currently do, which is *retain attention across shifts*. The rota assumes shifts are completable in 20 minutes and the player may take days between them. A mystery whose payoff depends on the player remembering a detail from shift 3 when they reach shift 17 is a structural mismatch with the play pattern. If a mystery thread WERE introduced it would need a "previously, in your career so far..." beat at the start of each shift, which is a different product. Save it for v2.

Shape E (refuse the thread entirely) is the answer I'd want to give if shape B's recurring-patient mechanism turned out to be too expensive. It is not too expensive. The author already has the patients, the case YAMLs, and the rota state slice. The only thing missing is the conditional rendering layer.

## Mechanic surface

The smallest mechanic surface is also the right one: keep the existing arc schema untouched (it's single-shift, that's correct — the M83/M86 work has stabilised it), and add a new lightweight content surface for cross-shift continuity.

What I'd build: a new YAML file per recurring patient, e.g. `content/continuity/patient_stan_williams.yaml`. The file lists, for each shift in which Stan appears, a vignette-preamble paragraph and an optional list of `auto_unlock_history_ids`. The encounter screen, when rendering a case whose `case_id` matches a continuity file, looks up the rota's `completedShifts`, finds whichever of Stan's prior appearances the player has lived, picks the right preamble, prepends it, and pre-unlocks the listed history items.

This is a UI/render-layer change, not a schema change to the Case YAML. The Case content stays atomic and replayable. The continuity content is layered on top. A player using the e-portfolio random-recall feature gets the case the same way they'd get it in the rota for their FIRST encounter; only players moving through the rota in order earn the continuity richness. That's the FRCEM-shaped reward I want.

Mirror invariant test (M87 echo): the continuity file's `shift_id` references must match real episode IDs and the patient must appear as a focus or ambient case in those episodes. CI-time check. Cheap. Mandatory.

## The first commit

A single recurring vignette callback on a single patient, no schema changes. The patient is Stan. The shift is `ep_overnight_safety_net` — the one where the safeguarding teaching point is the centre of the case. The continuity file is `content/continuity/patient_stan_williams.yaml`. The render-layer change in `EncounterScreen.tsx` is a `<ContinuityPreamble />` component above the vignette card that conditionally renders based on `loadRota().completedShifts`. The author writes one paragraph of preamble text. The history item `hx_previous_attendances` (if Chloe's safety_net case has it; if not, the author adds it in the same commit) gets auto-unlocked. Total: one new YAML file (~50 lines), one new tiny React component (~40 lines), one new history item if needed.

Land that. Run the existing 424-test suite plus a new mirror test for the continuity file. Send it to Gemini. If it lands well, the next iteration adds Beth and Chloe to the same pattern. If it lands badly, you've lost a single iteration on a single patient and the build is no worse off than it is now.

## What I'm watching for in the v2

If shape B works, the v2 question is whether McGrath's post-shift memos should reference cross-shift continuity ("the same Stan, third presentation this term — what did the records say?"). I think yes, eventually, but not in the first commit. Memos are an existing surface; modifying them is cheap. Defer.

If shape B fails — if playtesting shows the conditional rendering reads as fan-service rather than pedagogy — kill it and revisit Shape E. The build's narrative-blankness defense is intact; nothing has been spent.

---

**Verdict (one line):** Yes — but only as pedagogically-justified recurring-patient continuity; refuse player-character / department / mystery threads as narrative-tax masquerading as story.

**Primary shape if yes:** B (recurring-patient continuity arc) with one constraint: every payoff beat must be a FRCEM-shaped cognitive task, not story-beat consumption.

**Smallest first commit:** Single new `content/continuity/patient_stan_williams.yaml` file + a `<ContinuityPreamble />` render-layer component reading rota state; render preamble + auto-unlock relevant history when Stan recurs in `ep_overnight_safety_net` and the player has completed `ep_minors_day_entry`. One patient, one shift, no schema change to Case YAML.

**Confidence:** medium-high.

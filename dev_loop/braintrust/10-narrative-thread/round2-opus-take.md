# Opus take — round 2 on the narrative thread

The author is right on all three counts. The patient recurrence is too high, the round-1 synthesis (mine included) under-weighted entertainment, and the two-track NTS-plus-comic-relief proposal is the actually-correct shape. Let me argue each, then close on what to do first.

## The patient-recurrence audit was missing from round 1

This is a real diagnostic miss in my round-1 take. I argued for shape B (recurring-patient continuity) anchored on the existing casting table — Beth × 3, Stan × 3, Williams × 2, Brennan × 2, Chloe × 2, Patel × 2 — and I treated that table as a feature to exploit. The author has correctly pointed out that the table itself is a content-economy artifact, not a clinical reality.

Walk it through: in real ED practice, you have a small number of frequent flyers (the Stan archetype — AUD-related, social complexity, regular re-presenters), and a slightly larger number of self-harm return-attenders (the Chloe archetype — genuine return rate after paracetamol OD is non-trivial). Beyond that, the same patient does not show up three weeks running with three different acute presentations. The build's Beth-x-3, Williams-x-2, Brennan-x-2, Patel-x-2 recurrences are the author needing to fill 18 shifts with 17 cases-worth of content. They're not in-fiction defensible.

So Opus's round-1 shape B compounds the error: it papers over an unrealistic casting layer with a narrative layer that pretends the recurrence is intentional. That's worse than just having the unrealistic casting; it's having the unrealistic casting and *insisting on it*.

The right move is an EXPLICIT recurrence audit BEFORE any cross-shift continuity mechanic lands. The audit's job:

- **Keep**: Stan (frequent-flyer pattern — clinically realistic), Chloe (self-harm return rate — clinically realistic).
- **Reframe**: where the same case_id appears in two shifts, decide if (a) it's a clinically-defensible follow-up (e.g. Williams returns as a post-thrombolysis ward review the player drops in on between cases) or (b) the case file should be cloned-and-edited into a new patient with a similar presentation. This is content work, ~6-10 hours.
- **Cut**: any recurrence that can't be defended either way. Better fewer cases than implausible casting.

This audit is a PRECONDITION for the narrative-thread work. If you skip it, every subsequent piece of the thread is asking the player to suspend disbelief in a way that undermines the build's clinical-realism claim. And the clinical-realism claim is what makes The Skitt a credible study tool — burn that and you're left with a soap opera in scrubs.

## The round-1 synthesis under-weighted entertainment, and I was the one doing it

Re-reading my round-1 take, the offending sentence: *"the gravity well of entertainment is what separates Disco Elysium from every CME revision app."* That is the wrong diagnosis. Disco Elysium IS entertainment first and pedagogy second. Its claim on the reader's attention — forty-plus hours, replays, online discourse-mining — comes from being *fun to be inside*, not from teaching anything. The fact that Disco DOES teach things (about depression, capitalism, decline, comedy of failure) is laundered through the entertainment, not despite it.

The Skitt's claim to be Disco-influenced fails on inspection of its actual texture. The case content is uniformly serious-clinical: triage notes that read like triage notes, history items that read like history items, McGrath's bedside interrupts in dry register but not actually funny, vignettes in textbook tone. There is no Disco-equivalent in the build right now — no character voice that holds heaviness and lightness in the same sentence, no slice of dark humour you'd quote to a colleague the next day. The build has authored itself as an FRCEM SAQ generator with NPC sprites on top.

So the author's instinct — "this is a study tool but it's also a game" — is correctly diagnosing what's missing. The reviewers, including me, defended the pedagogy claim because we were primed by the Braintrust 06 timer-pedagogy fight (where the build legitimately needed defending against pattern-match-reflex). That defence over-corrected. There's a difference between "don't let the timer train premature closure" (good) and "don't let the build have humour" (bad).

A Disco-influenced study tool needs to BE Disco-textured to earn the badge. Otherwise it's misframing the product.

## The two-track NTS + comic relief composition is the right architecture

The author's actual proposal — heavy NTS narrative thread + interspersed slice-of-life comic relief — works because the two tracks aren't in fact two tracks. Done well, they're a single dual-register voice held by the same characters.

This is exactly how Disco's structure works. Kim Kitsuragi is dry-funny and also a serious cop; the protagonist is broken and also absurd; the comedy and the depth coexist in the same sentence because the characters are written to hold both. The Skitt has the casting for this already — McGrath as an EM consultant could speak in dry-funny register without sacrificing authority (EM consultants do this in real life — gallows humour is a cultural protective device), and Akin's M84 introduction already has the bones of a dual-register character (cold-watching-you AND offering tea, in successive sentences).

The NTS thread the author proposes is legitimately curriculum-relevant. The FRCEM examination tests non-technical skills heavily — communication, situation awareness, decision-making, leadership, teamwork — but more importantly, NTS failures CAUSE clinical failures in real practice. James Reason's swiss-cheese model is taught in every FRCEM revision course. Just Culture frameworks are RCEM-recommended. Speaking up across hierarchies (the junior trainee who needs to challenge a senior decision) is exactly the sort of teachable beat that doesn't fit in a case YAML but fits beautifully in a cross-shift narrative.

A specific shape that would work:

- **Block 1 (positions 0-4)**: small interpersonal frictions. The on-call surgical registrar curt over the phone, brushes off a referral. The radiographer pushes back on an ix request. McGrath alludes to staffing pressure. The player notices but doesn't action. Comic relief: the doctors' mess politics, who-stole-whose-yoghurt, the new locum who doesn't understand the rota.
- **Block 2 (positions 5-10)**: friction escalates. A near-miss event. A radiology delay that becomes a system issue. A nursing handover that breaks down. The player starts to see the latent failures. McGrath is shorter on the memos; her humour gets darker. Comic relief: ED culture — the "tea round" politics, gallows jokes about the bed manager, somebody's birthday in the staff room.
- **Block 3 (positions 11-17)**: crescendo. The block-3 keystone is Okafor (Type A AD masquerading as inferior STEMI) — exactly the case where anchoring + NTS-failure combine to harm a patient in real practice. The narrative pays off: the latent failures from blocks 1 and 2 have created the conditions for the missed dissection. The player learns that the case isn't just about ECG patterns; it's about whether they call cardiology when they should and what they say.

The comic relief track is what makes the heavy track playable. The author is exactly right that they balance each other — without the lightness, the NTS thread reads as preachy; without the heaviness, the comedy reads as filler. They have to coexist.

## The smallest first commit

Both the recurrence audit AND a pre-shift handover proof-of-concept can be sketched in a single iteration if the scope is tight. I'd ship in two halves of one commit:

**Half A — recurrence audit.** Pick the two least-defensible recurrences (Williams x2 and Brennan x2 in `doac_double`) and either reframe their second appearance as a follow-up (Williams seen on the ward as a coffee-room interlude, not as the same acute case re-run) or split one into a new patient with similar presentation. Document the audit decision in `content/cases/AUDIT.md` so future authors know the rule. Reserve the larger work (Beth, Patel) for a phase-2 audit pass.

**Half B — Akin pre-shift handover with dual register.** Author ONE handover paragraph for the entry shift, in the dual-register voice — clinical handover content + a slice-of-life observation. Render it via a `<PreShiftHandover />` component above the board on shift start, gated on rota position 0 for the first commit. The handover content lives in a new `content/narrative/akin_handovers.yaml` — not as 18 separate paragraphs yet, but with a schema that supports it. Prove the voice works on one shift before authoring 17 more.

If the dual-register voice lands on the entry shift, the M89 follow-up authors the remaining 17 handovers and seeds the NTS thread's block-1 first beats. If the voice doesn't land — if the slice-of-life reads as filler or the clinical content reads as redundant — you've lost one commit, not a multi-iteration content investment.

## What I'm watching for in the v2

The thing that would kill the two-track proposal is the build authoring slice-of-life beats that read like Buzzfeed listicles. "Top 5 things you'll only understand if you work in ED." Disco's comedy lands because every joke is also a character study; the same writer's discipline has to apply here. If the slice-of-life beats are atmospheric without being characterisation, they're noise.

The other failure mode is the NTS thread being authored as a sermon. NTS teaching is plausibly preachy in writing — the author has to RESIST writing "and the trainee learned that closed-loop communication matters" and instead just put the failure mode on-screen and let the player notice. Disco never explains the protagonist to the reader; the reader notices.

These are writing problems. They're not mechanic problems. The build's mechanic surfaces support both threads at minimal cost; the risk is the prose.

---

**Verdict on the author's counter-proposal:** Yes — strongly. The round-1 synthesis (mine included) was wrong to under-weight entertainment; the author's instinct to thread NTS + comic relief is structurally correct.

**Patient-recurrence audit needed first:** Yes. Don't compound an unrealistic casting layer with a narrative layer that depends on it.

**NTS thread + comic relief — viable as a two-track composition:** Yes, but ONLY if authored as a single dual-register voice held by the same characters (McGrath + Akin), not as two parallel storylines. Two-track ≠ two storylines; it's one voice that does both registers.

**Smallest first commit:** A two-half iteration — (a) audit + reframe the two least-defensible patient recurrences (Williams x2, Brennan x2 in `doac_double`); (b) author one Akin pre-shift handover for the entry shift in the dual-register voice and ship the render component. Prove the voice before authoring 17 more paragraphs.

**Confidence:** medium. The author's diagnosis is sound; the execution risk is writing craft, which the build hasn't yet demonstrated.

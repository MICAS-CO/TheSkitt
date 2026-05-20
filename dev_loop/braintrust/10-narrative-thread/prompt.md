# Braintrust 10 — A narrative thread through the rota?

The author wants a single design question put to two reviewers in parallel. Argue for or against the thesis, hard. Don't hedge.

## The question (verbatim)

> Given the new shift pattern, should there be a narrative thread through the progression? How can the different arcs be used to tell a story running through all the episodes?

## What the build looks like NOW

**Front door (post-M82-M84):**
A rota that publishes one shift at a time across **three blocks** (5/6/7 = 18 shifts total). Block N+1 unlocks when the player clears the block's **keystone shift** at SHO band or better. Keystones are:
  - Block 1: `ep_stroke_solo` (Mr Williams — LMCA stroke on apixaban)
  - Block 2: `ep_seizure_solo` (Priya — refractory status in pregnancy with SAH twist)
  - Block 3: `ep_dissection_solo` (Mr Okafor — Type A AD masquerading as inferior STEMI)

Entry shift = `ep_minors_day_entry` packaging Patel (silent STEMI) + Stan (intox + occult head injury). This is the player's first day on the floor, with Charge Nurse Adesuwa Akin establishing the workflow and McGrath off getting coffee — established M84 ("Mechanical confusion, not narrative confusion" per the synthesis from braintrust 02).

**E-portfolio** (M83) holds every completed shift attempt with replay + random-recall buttons. The player's journey through the rota is now persisted and surface-able.

**Current arc mechanic** (the relevant prior-art piece):

```ts
const Arc = z.object({
  id: ArcId,
  type: ArcType,         // shared_incident | family_relation | safeguarding | recurring_npc | ...
  cases: z.array(CaseId).min(2),  // MUST be in the SAME shift
  reveals: z.array(ArcRevealTrigger).nonempty(),
  effects: z.array(ArcEffect).default([]),
});
```

`Episode.arcs: ArcId[]` loads the arc INTO ONE SHIFT. The kernel checks reveal triggers (clock / action / history-asked / examined / finding / investigation-back) during that shift. Effects unlock history items, examination findings, or transition a case's state. **All this is single-shift only** — when the shift ends, the arc's state evaporates. No cross-shift arc state exists in the kernel.

**Three existing arcs (all intra-shift):**

1. `arc_hendo_dinner` — Beth (anaphylaxis) and Sarah (ectopic) came in the same ambulance from a hen-do dinner. Reveal unlocks an extra history item on Sarah ("the pain started two days ago, didn't want to ruin the trip"). Triangulating saves Sarah.

2. `arc_family_peanut_party` — Beth and her 8-y/o brother Sam both reacted at a birthday party. Adult + paeds dose-band parallel.

3. `arc_overnight_safety_net` — Chloe (paracetamol OD) and Stan (intox) — asking Chloe's records-trail surfaces that the system missed Stan's previous safeguarding flags too. NICE NG225 § 1.3 thinking applied systemically.

**Recurring patients across shifts (the casting is already there):**

| Patient | Shifts they appear in | Role |
|---|---|---|
| **Beth** | anaphylaxis_solo, hendo_shift, birthday_party | Same person; three different presentations to the same player |
| **Williams** | stroke_solo, doac_double | LVO stroke, both cases |
| **Brennan** | head_injury_doac, doac_double | SDH on apixaban, both cases |
| **Chloe** | paracetamol_solo, overnight_safety_net | Repeat presenter / safeguarding |
| **Stan** | hendo (ambient), overnight_safety_net (focus), minors_day_entry (focus) | Frequent flyer — three appearances |
| **Patel** | hendo (ambient), minors_day_entry (focus) | Atypical STEMI |
| Sarah, Sam, Marcus, Amir, Priya, Okafor, Kowalski, Morrison, Ahmed, Oduya, Okonkwo | One shift each | Single appearance |

**Recurring NPCs with established voice:**

- **Dr Aoife McGrath** — consultant in EM. Fires bedside interrupts (`composeTrapCaughtInterrupt`, `composeDeteriorationTakeoverInterrupt`, `composeUnsafeMidshiftInterrupt`). Sends a post-shift consultant memo persisted via `state/consultant.ts` and surfaced on the next session's menu. Tone-shifts with the player's band (excellent / good / borderline / unsafe). Already serves as the recurring authority figure across every shift.
- **Charge Nurse Adesuwa Akin** — introduced in M84 for the entry shift only. Cold-watching-you voice — "first one's in the waiting room. The daughter will tell you it's nothing. You decide what it is." Currently a single-shift NPC.

**The build's design north star:** Disco Elysium meets Dwarf Fortress for EM trainees. From the M81 consultation:
- "Disco's whole structural claim is that the world arrives at you, not that you shop the world" — which is why we moved to the rota.
- "Mechanical confusion, not narrative confusion. Not Disco-amnesiac." — entry shift is procedural disorientation.
- "Person, not problem, not even complaint" — patients are named-and-characterised, not just diagnoses.

## What "narrative thread" could plausibly mean here

(Don't limit yourself to these — invent better shapes if they exist. But the reviewers need concrete options to argue between, not abstractions.)

**A. Player-character arc.** McGrath's voice toward the player shifts from "watching you, registrar" (block 1) → "trusting you with the floor" (block 2) → "asking your opinion on the dissection" (block 3). The player IS the protagonist; the rota is their year of growth. Akin recurs as a quiet counterweight — she sees more than McGrath. This is the "rota = career-stage compressed" angle, low-mechanic-cost, all-voice.

**B. Recurring-patient continuity arc.** Stan's three appearances become a deliberate story: entry shift (hypoglycaemic frequent-flyer with occult head injury, dismissed as "drunk again"), overnight safety-net mid-rota (his fall this time IS the safeguarding flag the system missed), final shift cameo (admitted patient seen on the ward by-the-by — the player learns what happened to him). Beth across her three shifts could similarly thread (anaphylaxis solo → hen-do double → birthday-party paeds), with continuity rewarded narratively. The build's "person, not problem" ambition gets full payoff.

**C. Department-level arc.** The ED itself changes over the rota — a recurring referral pathway breaks at the midpoint; a senior trainee leaves; a new resus protocol arrives. The setting evolves around the player. NHS-realistic; gives the keystone shifts thematic weight beyond their clinical content.

**D. Disco-Elysium mystery arc.** One thread that the player gradually figures out across blocks. Hooks in early shifts (the entry shift's silent-STEMI Patel "should have been seen sooner — there was a delay") that the player keeps noticing pattern-by-pattern, eventually meeting its resolution at the final keystone (the dissection: the same delay pattern is what almost kills Okafor). The build's "Disco" badge gets earned.

**E. None — preserve narrative-blankness.** Each shift is its own day. Real EM has no through-line; you treat people and then they're gone. Imposing a narrative thread is a literary affectation that distorts what EM actually feels like and dilutes the per-case teaching. The rota gives you a sense of campaign; that's enough.

## What the reviewers should address

1. **Should there be a narrative thread at all?** Argue yes/no, hard. Specifically: does narrative threading reinforce or undermine the FRCEM-shaped pedagogy the build has just spent three iterations protecting (Braintrust 06 / M85-M87)? If a recurring story incentivises the player to play through to "see what happens next," does that compete with the build's reasoning-focused study purpose?

2. **If yes, which shape?** Argue for ONE primary thread (A / B / C / D, or a hybrid you invent). Address: what does this thread cost in authoring effort? what does it cost in mechanic changes? what does it BUY the player in stakes, retention, and FRCEM-skill consolidation?

3. **Mechanic surface.** The current arc system is single-shift only. A cross-shift arc would need at least:
   - persistent state (which arc-beats have fired across the player's rota progress)
   - reveal triggers that fire on shift-completion events, not just in-shift events
   - effects that mutate FUTURE shifts (e.g. when the player reaches Williams again in doac_double, his case state machine references the earlier solo encounter)
   - or none of the above (narrative-only, via vignette/dialogue text that conditionally renders based on `rota.completedShifts`)
   
   Argue for the smallest viable surface change OR — if you think mechanic change is unjustified — argue for the constraint that any narrative thread MUST live within the existing systems (no new schema).

4. **Recurring-NPC voice.** Akin was introduced in M84 with strong characterisation but appears in one shift. McGrath appears in all but has only the consultant-interrupt + memo surfaces. Should NPC voice carry the thread, and if so via what beats — vignette text? Pre-shift handover paragraphs? Post-debrief memos that reference earlier shifts? Or is more NPC presence actively bad (a study tool with a charge-nurse subplot is a different product)?

5. **Pedagogy vs entertainment.** The author has insisted the build is a STUDY TOOL for FRCEM candidates, not a video game in the entertainment sense. Does adding a narrative thread risk pulling the product toward entertainment in a way that undermines its credibility as a study tool? Or does it cement the build's claim to be "the thing it says it is" (a Disco-influenced narrative RPG) vs another revision app?

6. **What about RANDOMNESS?** The rota currently goes in a fixed linear sequence. The case YAMLs are deterministic. If a narrative thread requires the same shift to play the same way every time, it removes any future possibility of randomised case ordering or variant presentations. Is that a fair trade?

7. **Concrete first move.** If the answer is "yes, add a thread of shape X," what's the SMALLEST first commit that establishes it? A single recurring vignette callback? A new shift that retroactively threads? An NPC memo change?

## Format

Free prose. ~800-1500 words. Don't hedge into "on the one hand / on the other hand" — pick a position. If you want to acknowledge a counter-argument, do it briefly to dismiss it, not to balance.

No JSON, no schema. The author will read your prose directly.

End with four lines:
  - **Verdict (one line):** [yes / no / yes-with-strict-constraints]
  - **Primary shape if yes:** [A / B / C / D / hybrid + which]
  - **Smallest first commit:** [one concrete change], or "none — defer until the build proves it needs this"
  - **Confidence:** [low / medium / high]

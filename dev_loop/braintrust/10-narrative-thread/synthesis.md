# Braintrust 10 — Narrative thread synthesis

**Reviewers:** Gemini 3.1 Pro Preview + Claude Opus, in parallel
**Cost:** Gemini ~$0.04; Opus free (env creds)
**Date:** 2026-05-20, against `35f0d85` (M87)
**Trigger:** Author asked whether the new rota structure should carry a narrative thread, and how the existing arc mechanic should be used.

---

## The question (verbatim)

> Given the new shift pattern, should there be a narrative thread through the progression? How can the different arcs be used to tell a story running through all the episodes?

---

## Where the reviewers AGREE

Both said **yes-with-strict-constraints**. Both rejected:
  - **Option D (Disco mystery arc)** as a structural mismatch with the rota's play pattern (shifts may be days apart; a multi-block puzzle can't survive that).
  - **Option E (narrative blankness)** as a missed opportunity given the build's Disco-influenced framing and existing NPC investment.

Both agreed:
  - **The kernel's intra-shift arc system stays untouched.** The 3 existing arcs (hen-do dinner, family peanut, overnight safety-net) are intra-shift triangulation devices and that's the right level for them.
  - **McGrath + Akin are the right voice anchors.** No new NPCs.
  - **The narrative must serve pedagogy, not consume entertainment.** The moment the thread starts pulling the player through "to see what happens next" rather than "to recognise the pattern next time", it's net-negative.
  - **No new schema for the kernel.** No `cross_shift_state`, no `arc_chain` field. Narrative lives in the existing surfaces.

Both confidence: medium-high to high.

---

## Where the reviewers DISAGREE

### Gemini Pro — meta-layer thread (Option A + C hybrid)

> "The patients blur together, but your relationship with the charge nurse, your standing with the consultant, and the ambient friction of a collapsing NHS department form a relentless, unbroken narrative."

Gemini's verdict: **hybrid A+C, exclusively in the meta-layer** (pre-shift handover + post-shift consultant memo). The narrative thread is the player's professional maturation in a department that gets busier as winter pressure hits. Block 1 = unknown quantity, Akin skeptical, McGrath double-checks. Block 2 = winter crisis, pathways failing, Akin starts relying on you. Block 3 = veteran on the floor, McGrath treats you as peer.

Gemini explicitly REJECTS shape B (recurring-patient continuity): *"Tying the narrative to specific patients distorts the reality of EM. You treat them, you admit them, and they disappear into the hospital. Forcing them back into the ED to deliver narrative payoffs feels like Casualty, not a real trauma center."*

Gemini's first commit: **Akin pre-shift handover on every shift**, conditionally rendering based on `rota.completedShifts.length`. Zero new schema. Preserves randomness — any shift ordering works because Akin's evolution depends on COUNT, not CONTENT.

### Claude Opus — recurring-patient continuity (Option B)

> "The build is already a soap opera; the build just doesn't know it yet. None of these patients currently know they've met the player before, because the kernel has no cross-shift state for cases."

Opus's verdict: **shape B, constrained to FRCEM-shaped cognitive tasks**. Stan's three appearances become a deliberate test of safeguarding pattern recognition. When the player returns to him in `ep_overnight_safety_net`, his vignette gets a continuity preamble (only if `ep_minors_day_entry` is in completedShifts), and his `hx_previous_attendances` history item auto-unlocks. The narrative payoff IS the cognitive skill being tested.

Opus also REJECTS shape A (the player-character arc), arguing McGrath's existing band-dependent memo system already does this work. Shape A would be narrative-tax on a mechanic that's already serving.

Opus's first commit: **single `content/continuity/patient_stan_williams.yaml` file** + a `<ContinuityPreamble />` render-layer component, applied to one patient in one shift. Phase 2 if successful: Beth, Chloe.

---

## The argument that needs adjudicating

Both reviewers see different parts of the build correctly. Gemini sees the META-LAYER (the spaces between shifts) and proposes the thread live there. Opus sees the CASTING (recurring patients as built-in setup) and proposes the thread live there.

The strongest claim from each:

**Gemini's strongest:** *"By keeping the narrative in the meta-layer, the shifts themselves remain pristine, isolated clinical encounters."* This protects the build's claim to deterministic, replayable, randomisable shifts. It also matches EM reality — *patients disappear into the hospital*, but your professional context persists.

**Opus's strongest:** *"FRCEM's safeguarding questions test exactly this pattern recognition. The build can ACT OUT the cognitive frame of the question rather than just stating it."* The recurring-patient continuity creates a lived experience that maps onto an exam-shaped task.

The honest read on Opus's claim: the build ALREADY teaches the safeguarding pattern in the `arc_overnight_safety_net` intra-shift arc (Chloe + Stan). The cross-shift continuity I proposed isn't adding teaching value beyond what's already in the existing case content — it's adding NARRATIVE continuity on top of pedagogical content that's already doing the work. Gemini's objection lands.

The honest read on Gemini's claim: the meta-layer thread is genuinely cheaper, more robust to randomisation, and matches EM phenomenology better. But it ALSO doesn't directly do new pedagogical work — it provides atmosphere and stakes. The atmospheric weight is its own justification (the rota goes from "career-stage compressed" to "experienced career-stage compressed"), but it's narrative-as-stakes rather than narrative-as-cognitive-task.

---

## Convergent recommendation

**Ship Gemini's first move. Reserve Opus's shape B for a later iteration that explicitly justifies itself on playtest evidence.**

The reasoning:

1. **Gemini's commit is cheaper.** Akin pre-shift handover is one new component, one block-of-text-per-rota-position content file, no schema change. Lands in a single iteration of code. Opus's shape B requires a new YAML schema for continuity files + render-layer changes + author-pass-per-patient — multi-iteration.

2. **Gemini's commit preserves more options.** Meta-layer narrative is randomisation-safe. If a future iteration wants to shuffle shift order within blocks (the M84 author already left that door open in the rota_order test that asserts contiguous block positions), Akin's evolution still works. Opus's shape B would lock the rota order forever once continuity preambles reference specific prior shifts.

3. **Opus's pedagogical claim is weaker than I argued.** The recurring-patient pattern recognition the build wants to teach is already taught by `arc_overnight_safety_net` inside the safety_net shift. Cross-shift continuity adds atmosphere, not pedagogy.

4. **Gemini's atmospheric claim is stronger than it sounds.** A study tool whose meta-text references the player's accumulated experience IS a more credible product than one that treats each shift as a context-free question. The rota IS a year of training; making the player FEEL that year is its own justification.

5. **Both reviewers' refusals matter.** Both said no to the Disco-mystery and to the player-as-protagonist narrative-tax. Both said no to schema changes. The convergence on what NOT to do is as important as the convergence on what to do.

### Concrete next-iteration shape (M88)

- New YAML data file (not Case schema; a separate type): `content/narrative/akin_handovers.yaml` containing 18 entries, one per rota position. Each entry: `rota_index: number`, `text: string` (the handover paragraph from Akin), optional `bed_state: 'green'|'amber'|'red'|'black'` for atmospheric framing.
- New `<PreShiftHandover />` React component rendered above the board view on shift start, before the player has actioned anything.
- The handover text is gated by `rota.currentShiftIndex` — index 0 (entry shift) carries the existing Akin onboarding; later indices carry the maturation arc.
- McGrath's existing post-shift memo (`state/consultant.ts:memoFromEpisodeReport`) gets ONE small addition: the memo composition factors in `rota.completedShifts.length` to pick from a small bank of band-+ rota-position-aware lines. Same band-shifting behaviour as M37; just adds rota-awareness.
- No kernel changes. No Case YAML changes. No schema additions to the Case shape.
- Tests: handover-content-completeness test (every rota position has a handover authored); memo voice test (a borderline-band memo at rota-index 17 reads differently from a borderline-band memo at rota-index 0).

### Reserved (NOT M88, possibly later)

- Recurring-patient continuity (Opus's shape B). If playtesting after M88 shows the meta-layer narrative landed but the shifts themselves still feel context-free, this is the next move.
- Cross-shift arc state in the kernel. Both reviewers refused this; do not build it unless a specific case demands it.

### Refused

- Disco-style mystery arc (shape D). Wrong tool for this play pattern.
- Department-side-plots that don't pay off in clinical reasoning (the "winter crisis" framing should colour the AKin handover voice without becoming a subplot the player follows).
- New NPCs. McGrath + Akin are sufficient.

---

## Cost of doing this

- M88 ~3-5 hours: one new YAML file, one new React component, one render-layer change, one consultant-memo composer extension, plus tests. No mechanic-layer change.
- Author content: 18 handover paragraphs from Akin + maybe ~6 new memo-voice variants for McGrath. ~600-1000 words of authored content.
- No risk to existing tests; the existing 424-test suite stays green by construction (no kernel or schema changes).

---

## Recommended next move

Land Gemini's first commit at M88. Run the existing review pipeline (single iteration, two reviewer rounds). If the meta-layer narrative lands, consider Opus's recurring-patient continuity at M89 as a phase-2 expansion — but only with explicit playtest justification.

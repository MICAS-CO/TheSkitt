# Braintrust 10 — Round 2 synthesis

**Reviewers:** Gemini 3.1 Pro Preview + Claude Opus, in parallel (second round)
**Cost:** Gemini round-2 ~$0.03; Opus free
**Date:** 2026-05-20, against `3bbfe99` (round-1 commit)
**Trigger:** Author pushed back on round-1 synthesis with three concrete observations.

---

## The author's pushback (verbatim recap)

1. Patient recurrence is unrealistically high (content-economy artifact, not clinical realism).
2. Entertainment has a legitimate role — round 1 under-weighted comic relief.
3. Two-track proposal: an NTS / human-factors narrative thread + slice-of-life comic relief moments, balancing each other.

---

## Where the reviewers AGREE (strongly)

Both said **yes to all three pushbacks**. Both reversed substantive elements of round 1:

  - **Round 1 was wrong to under-weight entertainment.** Both reviewers acknowledged this. Disco Elysium is entertainment first; pedagogy is laundered through it. The Skitt's claim to be Disco-influenced fails on inspection — the case content is uniformly serious-clinical, no dual-register voice anywhere. Opus's round-1 "gravity well of entertainment" framing was the wrong diagnosis.
  
  - **Patient-recurrence audit is a PRECONDITION** for any narrative thread. Opus's round-1 shape B (recurring-patient continuity) compounded the error by treating the content-economy duplication as a feature. Both reviewers now agree: audit first, thread later.

  - **NTS-as-narrative is pedagogically sound for FRCEM.** Both reviewers cite swiss-cheese, Just Culture, CRM, communication failures. The exam tests NTS via OSCE + workplace assessments; the narrative thread can teach it directly.

  - **Two tracks ≠ two storylines — it's one dual-register voice.** This is the strongest convergent insight. Comedy and seriousness coexist in Disco BECAUSE the same characters speak both registers in the same sentence. The Skitt's McGrath + Akin already have the bones for this; what's needed is the writing craft, not new characters or surfaces.

  - **No new UI surfaces needed.** Both reviewers refuse a dedicated "doctors' mess" location or new comic-relief-only surface. The comedy lives in the margins of existing surfaces (pre-shift handover, post-shift memo, vignette intros).

---

## Where the reviewers DIVERGE

The disagreement is narrow but worth flagging.

**Gemini argues for a more aggressive recurrence cull:**

> "Strip Beth, Williams, Brennan, Chloe, and Patel down to single appearances. Keep Stan. Stan is your safety-net frequent flyer."

Gemini's claim: anything that isn't a clinically-realistic frequent flyer (Stan only) is content-economy duplication that should be cut. Even Chloe's two appearances (paracetamol_solo + overnight_safety_net), which have a defensible clinical reading as self-harm return-attendance, should go.

**Opus argues for a graded audit:**

> "Keep: Stan (frequent-flyer pattern). Keep: Chloe (self-harm return rate is real). Reframe: where the same case_id appears in two shifts, decide if it's a clinically-defensible follow-up (e.g. Williams as a post-thrombolysis ward review) or should be cloned-and-edited into a new patient with similar presentation."

Opus's claim: Chloe's two appearances are defensible if explicitly framed as return-attendance; Williams/Brennan recurrences could be reframed as follow-ups rather than acute re-presentations.

**The honest read on this disagreement:** Gemini is right on rigour, Opus is right on cost. Gemini's cleaner rule ("keep Stan only") is easier to defend and easier to execute. Opus's graded rule preserves more content but requires explicit in-fiction reframing for each kept recurrence, which is more authoring work for a softer pedagogical payoff. **Default to Gemini's stricter cull unless there's a specific clinical-realism argument for retention.**

For Chloe specifically: the self-harm return-rate point IS clinically valid, but the build's `ep_overnight_safety_net` doesn't currently frame her as a returner — it treats her as a parallel case to Stan. Reframing would mean rewriting the vignette + the arc. If you're going to do that work anyway, you might as well clone-and-edit into a new patient.

---

## Convergent position

**Adopt the author's counter-proposal in full, with Gemini's stricter recurrence audit and the synthesis-position dual-register voice.**

The shape of M88 changes substantially from round 1:

### M88 part A — recurrence audit (precondition)

- **Keep**: Stan in all three shifts (`ep_minors_day_entry`, `ep_hendo_shift` ambient, `ep_overnight_safety_net` focus). Frequent-flyer pattern is realistic; the M84 onboarding work has already wired the entry-shift connection.
- **Cull**:
  - `ep_doac_double`: replace one of {Williams, Brennan} with a different patient OR reframe the recurrence as an explicit follow-up (e.g. Williams seen on ward, not as acute re-presentation).
  - `ep_birthday_party`: Beth's second presentation is the dubious one — strip her, keep Sam as the singular paeds anaphylaxis case (paediatric case can stand alone without needing the adult parallel).
  - `ep_hendo_shift` ambient: reconsider whether Patel + Stan both belong here given they're now focus cases in the entry shift. Probably drop both ambient appearances; the hen-do shift's focus is Beth + Sarah and adding the other two as ambients was content density, not narrative weight.
  - `ep_overnight_safety_net`: keep Stan; replace Chloe with a different patient OR cut to a single-case shift.
- **Document the audit** in a new `content/cases/AUDIT.md` so the rule survives ("each patient appears in at most one shift unless the second appearance is an explicit follow-up or the patient is the named frequent flyer").
- **Update**: `src/state/rotaOrder.ts` focus_case lists; the `tests/rotaOrder.consistency.test.ts` will guard against drift after the audit.
- **Cost**: 6-10 hours of content work; possibly +1-2 new case files for the replacements.

### M88 part B — first dual-register handover (proof-of-concept)

- Author **one** Akin pre-shift handover for the entry shift in the dual-register voice. Clinical content + slice-of-life micro-beat. Establish the tone — dry, gallows-humour-tinted, watching-you.
- Render via a new `<PreShiftHandover />` React component above the board on shift start, gated by `rota.currentShiftIndex === 0` for the first commit.
- Content lives in a new `content/narrative/akin_handovers.yaml` with a schema supporting 18 entries but only one populated initially.
- McGrath's post-shift memo composer (`state/consultant.ts:memoFromEpisodeReport`) gets ONE small extension: add rota-position awareness to the voice variant selection, but DON'T author all the new variants yet. Just wire the hook.
- **Cost**: ~2-3 hours code + ~500 words of authored content.

### M89+ — phased expansion (after M88 lands)

- M89: author the remaining 17 Akin handovers + the rota-aware McGrath memo variants. Seed the NTS thread's block-1 beats (small frictions, missing handover sheets, sarcastic comments about bed management).
- M90: block-2 NTS escalation beats; a near-miss event referenced in McGrath's memos.
- M91: block-3 crescendo — the dissection keystone shift gets explicit NTS framing connecting back to the latent failures established earlier.

---

## What's NOT happening

- **Cross-shift arc state in the kernel**: still refused. Both reviewers agreed in both rounds.
- **New NPCs**: still refused. McGrath + Akin carry it.
- **Recurring-patient continuity (Opus round-1 shape B)**: refused. The casting layer was the problem, not a feature to exploit.
- **Disco-style mystery thread**: refused. Wrong tool for the play pattern.
- **Dedicated doctors'-mess location surface**: refused as scope creep.

---

## The execution risk both reviewers flagged

**Writing craft.** The dual-register voice requires actual skill — McGrath's dark humour has to land like a real EM consultant, not like a sitcom. Akin's slice-of-life observations have to feel like Disco-level dry characterisation, not Buzzfeed filler. The NTS thread has to surface without being preached at.

If the M88 entry-shift handover lands well in playtest / review, the rest follows. If it reads as fan-fiction or pedagogical lecturing, the whole arc has to be reconsidered. This is exactly why the first commit is one paragraph, not 18.

---

## Recommended next move

Land M88 as scoped above. Two halves (audit + dual-register PoC). One reviewer pipeline. The recurrence audit is the bigger half by cost; the handover authoring is the higher-risk half by writing-craft.

Both reviewers' confidence: high (after the round-2 alignment).

---

## Verdict block (consolidated)

  - **Author's counter-proposal adopted**: yes, in full
  - **Patient-recurrence audit needed first**: yes (Gemini's stricter version preferred)
  - **NTS thread + comic relief as a two-track composition**: yes, but executed as ONE dual-register voice held by McGrath + Akin, not two parallel storylines
  - **Smallest first commit (M88)**: recurrence audit (cull non-Stan reuses) + one dual-register Akin handover for the entry shift + the render component + a rota-position hook in McGrath's memo composer
  - **Confidence**: high (synthesis); medium-high (execution — writing craft is the unproven variable)

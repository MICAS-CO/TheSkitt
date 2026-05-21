# Content audit — patient recurrence rules

M88 (from Braintrust 10 round-2 synthesis): the build's patient
recurrence was content-economy duplication that wasn't clinically
defensible. This file records the audit rule and the per-patient
decisions so future authors don't re-introduce the problem.

## The rule

Each named patient appears in **at most one shift** unless one of:

1. **Named recurring character** — explicitly framed in fiction as a
   recurring presenter (e.g. a high intensity user, a self-harm
   return-attender). The recurrence is the pedagogy.
2. **Explicit follow-up** — the second appearance is framed as a
   ward review / outpatient handover / interim check-in, NOT as a
   fresh acute presentation. The case data must reflect this in the
   vignette and history.

Otherwise: cull the second appearance. Use a new patient.

## Per-patient decisions (M88)

| Patient | Appearances | Decision | Rationale |
|---|---|---|---|
| **Stan Williams** | `ep_minors_day_entry` (focus), `ep_overnight_safety_net` (focus), `ep_hendo_shift` (ambient — DROPPED at M88) | **Keep as recurring**, retire the "_ambient" framing. Authored as a **high intensity user (HIU)** — RCEM curriculum terminology supersedes "frequent flyer," which is pejorative and culturally inappropriate. The repeated presentation IS the teaching point: HIU pattern recognition, MDT case management, why the system fails repeat presenters. | RCEM Best Practice has had specific guidance on HIU; SAQs have tested it. |
| **Chloe Davies** | `ep_paracetamol_solo`, `ep_overnight_safety_net` | **Keep as recognised return patient.** Self-harm return-attendance rates are clinically real (10-15% within 4 weeks, 25-30% within a year per NICE NG225). The existing `arc_overnight_safety_net` already frames her as having a prior ED visit; that arc text covers the recurrence in fiction. | Self-harm return-attendance is clinically genuine and pedagogically relevant for FRCEM. |
| **Beth Cartwright** | `ep_anaphylaxis_solo`, `ep_hendo_shift`, ~~`ep_birthday_party`~~ | **CULLED from `ep_birthday_party`** at M88. The shift was using Beth as the adult parallel to Sam's paeds anaphylaxis (dose-band teaching). Beth's two remaining appearances are clinically defensible (the canonical solo + the hen-do showcase with Sarah). The birthday_party shift becomes Sam-only paediatric anaphylaxis. | The dose-band parallel teaching was nice-to-have; the realism cost was too high. |
| **Williams (stroke)** | `ep_stroke_solo` (keystone), `ep_doac_double` | **DEFERRED to M88b.** The doac_double shift's pedagogical hook is the parallel DOAC management (reperfusion for ischaemic stroke vs reversal for SDH). Replacing Williams here requires authoring a new stroke-on-DOAC case file (~6h content authoring). M88's M88b follow-up will either author the replacement or reframe doac_double. | Cost > scope of M88. Documented as known limitation. |
| **Brennan (SDH)** | `ep_head_injury_doac`, `ep_doac_double` | **DEFERRED to M88b.** Same rationale as Williams. | Cost > scope of M88. |
| **Patel** | `ep_minors_day_entry` (focus), `ep_hendo_shift` (ambient — DROPPED at M88) | **Keep entry-shift focus**; drop ambient. The entry-shift introduction is the canonical Patel appearance; the hen-do ambient was content density not narrative weight. | Single appearance now. |
| **Sam** | `ep_birthday_party` only | Single appearance (after Beth's cull). | Singular paeds case, clean. |
| Sarah, Marcus, Amir, Priya, Okafor, Kowalski, Morrison, Ahmed, Oduya, Okonkwo, Mrs Williams (stroke patient), Mrs Brennan (SDH patient) | one shift each | No action — already single-appearance. | — |

## Deferred to M88b

1. **`ep_doac_double` Williams + Brennan recurrence.** Authoring a new
   stroke-on-DOAC and/or new SDH-on-DOAC case file. Alternative:
   reframe one of the two as an explicit ward follow-up the player
   checks between cases.
2. **Stan's case_id rename.** Currently `case_intox_stan_ambient` —
   the "_ambient" suffix is misleading now that Stan is a focus case
   in entry-shift + safety_net. Rename to `case_intox_stan` (touches
   18+ references across episodes / tests / src).

## Audit enforcement

The `tests/rotaOrder.consistency.test.ts` already asserts that the
`ROTA_ORDER` constant matches each episode YAML's `focus_cases`. A
future test could walk all episodes and assert each patient appears
at most N times (per the rule above), but that needs the rule's
"recurring character" carve-out encoded explicitly — deferred until
a second author starts contributing content.

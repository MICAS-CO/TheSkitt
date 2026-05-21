# RCEM Emergency Medicine Curriculum 2021 — source summary

**Citation:** Royal College of Emergency Medicine. _Emergency Medicine 2021
Curriculum_, version 1.5 (August 2025 update). Approved by GMC.

**Location of local copy (as of 2026-05-18):** repo root —
`RCEM-Emergency-Medicine-Training-Curriculum-–-2025-Update-v1.5-Final (1).pdf`
(131 pages). The PDF is openly published by RCEM and is the canonical training
specification for UK Emergency Medicine.

## What this document is

The 2021 curriculum (with v1.5 amendments in 2025) replaces the previous
presentation-based RCEM curriculum with a **competence-based** model anchored
on:

- **Generic Professional Capabilities (GPCs)** — GMC framework, 9 domains.
- **12 Specialty Learning Outcomes (SLOs)** — what an EM consultant must be
  entrusted to do independently at CCT.
- **Clinical Syllabus** — the bounded list of presentations and conditions
  that may appear in formal RCEM examinations.

> "Anything that is in the Clinical Syllabus can appear in the formal
> examinations, and each of the relevant SLOs will be tested."
> — RCEM Curriculum 2021 §5.2, p.78

That sentence is the assessment blueprint in one line: the SLOs structure the
exam, and the Clinical Syllabus is the topic universe.

## The 12 RCEM Specialty Learning Outcomes

Captured verbatim from Table 1 (p.10) and §3.2.2 (pp.17–58):

| #   | SLO                                                                  | Scope                                                                                                                                 |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Care for physiologically stable adult patients                       | Acute physical and mental health; complex co-morbidity; frailty; CDU/observation medicine.                                            |
| 2   | Support the ED team — answer clinical questions, make safe decisions | Expert diagnostician role; dual-process reasoning; cognitive bias; guideline use; Bayesian thinking.                                  |
| 3   | Identify sick adults, resuscitate and stabilise, know when to stop   | Cardiac/respiratory arrest, peri-arrest, end-of-life decisions, advance directives, organ donation.                                   |
| 4   | Care for acutely injured patients                                    | ATLS primary/secondary survey, CT head/c-spine decision rules, major haemorrhage, NOF#, trauma team leadership.                       |
| 5   | Care for children of all ages                                        | Paediatric resuscitation (APLS), HEEADSSS adolescent assessment, NAI/safeguarding, SUDIC, immunisation, transition to adult services. |
| 6   | Deliver key procedural skills                                        | See §5.5 — ACCS and EM-specific procedural lists below.                                                                               |
| 7   | Deal with complex/challenging workplace situations                   | Capacity, MHA, refusal of treatment, self-discharge, police/FME, adult safeguarding, violence.                                        |
| 8   | Lead the ED shift                                                    | From intermediate training; situational awareness; staff wellbeing.                                                                   |
| 9   | Support, supervise, educate                                          | Multi-professional team, ACPs, physician associates.                                                                                  |
| 10  | Research and data                                                    | Critical appraisal, audit, EBM.                                                                                                       |
| 11  | Quality & safety                                                     | QIAT (Quality Improvement Assessment Tool), audit cycle.                                                                              |
| 12  | Lead and manage                                                      | Leadership theory, cultural impact, emotional intelligence (revised in v1.5).                                                         |

## Procedural skills lists (§5.5)

**ACCS / Core (§5.5.1):** pleural aspiration; chest drain (Seldinger and open);
CVP/Art line; emergency vascular access (IO, femoral); fracture/dislocation
manipulation; external pacing; DC cardioversion; POCUS (vascular access, fascia
iliaca); LP; procedural sedation.

**Intermediate / Higher (§5.5.2):** adult procedural sedation; paediatric
sedation; advanced airway management (RSI); NIV; open chest drain;
**resuscitative thoracotomy**; **lateral canthotomy**; DC cardioversion;
external pacing; **pericardiocentesis**; ED management of life-threatening
haemorrhage; **emergency delivery**; **resuscitative hysterotomy**;
fracture/dislocation manipulation; large joint aspiration; POCUS (extended).

Procedures in bold are the rare-but-critical set — strong candidates for
simulation-mode cases, as they will be infrequently encountered clinically.

## Training structure (§2.3)

- **Core (ACCS, 2 yr)** — shared with anaesthetics, acute medicine, ICM. 11
  ACCS Learning Outcomes (8 clinical, 3 generic). Trainees rotate ED, AMU,
  ICU, theatres.
- **Intermediate (1 yr)** — paeds EM skills, junior leadership role, can be
  the senior overnight.
- **Higher (3 yr)** — full ED shift leadership; mastery of supporting SLOs.

## Assessment programme (§5)

Three components:

1. **Formal RCEM examinations** (MRCEM Primary SBA, MRCEM Intermediate SBA,
   MRCEM OSCE, FRCEM SBA, FRCEM OSCE).
2. **Workplace-based assessments** (WPBAs) — Mini-CEX, CbD, DOPs, ACAT, ESLE,
   MSF, ESR.
3. **Panel-based judgements** — FEG Statements feeding ARCP decisions.

## Implications for The Skitt content design

1. **Cases must be tagged with one or more curriculum codes (e.g. RP2, CC1,
   ObC4)** — that tagging IS the curriculum mapping for case-pool coverage
   analysis. Implemented in `Case.curriculum_tags` in the Milestone 2 schema.
2. **Each case carries one or more SLO mappings** — used for debrief screens
   ("this case tested SLO3 — resuscitation; SLO5 — paeds") and for ensuring
   episode rosters span SLOs.
3. **Difficulty band must map to a training stage** — CT1/CT2 (ACCS) →
   ST3 (Intermediate) → ST4–6 (Higher / FRCEM Final). The build prompt
   already calls for this.
4. **Procedural skill cases are a natural Skitt extension** — a sim-mode
   "Resuscitative Thoracotomy" or "Lateral Canthotomy" mini-game would teach
   the rare-but-critical set without needing a full encounter loop.
5. **The Clinical Syllabus is closed and authoritative.** Topics outside it
   are out of scope. If we want a topic to be in the game, it must map to a
   syllabus code or be justified as an adjunct (e.g. non-clinical
   leadership/communications in an SLO7 or SLO8 case).

## What's NOT in this document

- Specific drug doses (defer to BNF, NICE, RCEM Best Practice).
- Decision rule cut-offs (defer to NICE/RCEM/RCP).
- Step-by-step procedural technique (defer to course manuals — APLS, ATLS,
  ALS).

The curriculum names topics; it does not teach them.

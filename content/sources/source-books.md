# Source books — survey notes

Three textbooks are vendored at repo root (see `DECISIONS.md` Q-001 re:
provenance). These notes summarise their structure and editorial flavour so
future case authoring picks the right book for the right purpose. **No
substantive text is reproduced**; chapter titles and case titles are listed
as bibliographic metadata.

---

## 1. Oxford Handbook of Emergency Medicine, 5e

**Citation:** Wyatt JP, Taylor RG, de Wit K, Hotton EJ. _Oxford Handbook of
Emergency Medicine_, 5th edition. Oxford University Press, 2020.
ISBN 978-0-19-878419-7. 804 pages.

**Status as a source:** Primary UK reference for the encounter loop. UK
practice, UK drug names, UK guideline alignment. The "Golden rules of
Emergency Medicine" introduction (immediately after the cover) reads like a
list of arc/pearl seeds: "Beware patients who are handed over", "Always
listen to nagging doubts", "Never assume ↓GCS is due to alcohol alone
(especially with head injury)", etc.

**Top-level structure (verbatim from TOC, p.vii):**

| Ch  | Title                               | p.  |
| --- | ----------------------------------- | --- |
| 1   | General approach                    | 1   |
| 2   | Life-threatening emergencies        | 43  |
| 3   | Medicine                            | 66  |
| 4   | Toxicology                          | 187 |
| 5   | Infectious diseases                 | 227 |
| 6   | Environmental emergencies           | 263 |
| 7   | Analgesia and anaesthesia           | 281 |
| 8   | Major trauma                        | 328 |
| 9   | Wounds, fractures, and orthopaedics | 408 |
| 10  | Surgery                             | 519 |
| 11  | Ophthalmology                       | 549 |
| 12  | Ear, nose, and throat               | 561 |
| 13  | Obstetrics and gynaecology          | 579 |
| 14  | Psychiatry                          | 617 |
| 15  | Paediatric emergencies              | 646 |

Index: p.765.

**Use as a case-content source:** primary. Cite by chapter and page range.
Most of the Tier 1 topic-map entries (anaphylaxis, STEMI, sepsis, DKA,
status, stroke, head injury, asthma, major trauma) draw their UK practice
detail from Ch 2 (pp.43–65) or the corresponding system chapter.

**Editorial voice to mirror in case framing:** terse, decision-rule heavy,
explicit about UK-specific drug choices and NHS workflow. The Skitt's
patient dialogue and pearl screens should sound consultant-on-shift, not
lecturer.

---

## 2. Case Studies in Emergency Medicine (Wenzel, ed.)

**Citation:** Wenzel V (ed.). _Case Studies in Emergency Medicine: A
Collection of Memorable Clinically Relevant Cases with Clinical Pearls._
Springer, 2023. ISBN 978-3-662-67248-8. 243 pages, 56 cases.

**Status as a source:** **Narrative shape and atmosphere reference, not a
clinical authority.** The contributors are predominantly German-speaking
prehospital/EMS physicians; the cases are framed around pre-hospital and
HEMS work as much as ED-floor care. UK drug names and guidelines do not
necessarily align — clinical content must be cross-checked against UK
sources before any fact lands in a case YAML.

**What it's good for:** case _framing_. The chapter titles read like Skitt
episode pitches:

> 1. Forearm Fracture in Afghanistan
> 2. 24-Year-Old in a River
> 3. Serious Traffic Accident in Fog
> 4. 80-Year-Old Patient with Devastating Chest Pain
> 5. Unconscious in Industrial Area
> 6. Buried Under Concrete Slabs
> 7. Fall into Icy Water
> 8. Unconscious Woman in Bathroom
> 9. Fall into Garden Pond
> 10. Child with Head Injury
> 11. Status Epilepticus
> 12. Collapse During Seniors' Hike
> 13. A Nearly Deadly Tea
> 14. Abandoned Newborn
> 15. Avalanche Burial
> 16. Cardiologist with Heart Attack
> 17. Stop (the title is the whole point)
> 18. Quarantine

Each chapter is a 3–6 page tight clinical vignette built around a single
decision or a single learned-the-hard-way pearl. The format —
mise-en-scène → handover → key decision → learning — maps directly onto
Skitt's per-encounter loop.

**Use:** mine for arc and episode _premise_. Skitt cases will rewrite
content in UK-EM voice against UK guidelines.

---

## 3. Emergency Medicine Case-Based Guide: Obstetric Emergencies (Kosoko, ed.)

**Citation:** Kosoko AA (ed.). _Emergency Medicine Case-Based Guide:
Obstetric Emergencies._ Springer Nature, 2024. ISBN 978-3-031-70117-7.
218 pages, 19 chapters.

**Status as a source:** **Schema template and didactic scaffold.** US
practice (Houston-led contributor list). UK adaptation is required for
drug names, dose units, and pathway specifics (e.g. UK gestational diabetes
pathway, UK postnatal sepsis tools).

**Chapter list (verbatim from TOC):**

1. Hyperemesis Gravidarum — Not Just Morning Sickness
2. Ectopic Pregnancy
3. Gestational Trophoblastic Disease
4. Spontaneous Abortion
5. Placenta Previa
6. Placental Abruption
7. Asymptomatic Hypertension in Pregnancy
8. Preeclampsia and Eclampsia
9. Thromboembolic Disease in Pregnancy
10. Premature Rupture of Membranes
11. Peri/Post-Mortem Cesarean Section
12. Shoulder Dystocia
13. Postpartum Hemorrhage
14. Amniotic Fluid Embolism
15. Postpartum Endometritis
16. Mastitis
17. Peripartum Cardiomyopathy
18. Evaluating a Newborn
19. Neonatal Resuscitation

Plus Appendix: Emergency Ultrasound and the Pregnant Patient.

**Per-chapter structure** (consistent across the book):

1. **Case** — vignette: age, gravida/para, presenting complaint, brief history.
2. **Past medical / surgical history.**
3. **Medications · Allergies · Family Hx · Social Hx.**
4. **Physical Exam** — vital signs + system-by-system.
5. **Pertinent Diagnostic Tests** — POCUS image, ECG image, labs (CBC, CMP,
   electrolytes, TFTs, VBG, β-hCG, etc.).
6. **Differential Diagnosis.**
7. **Working Diagnosis / Critical Decision-Making.**
8. **Management.**
9. **Clinical Pearls.**

> **This is exactly the case YAML schema we should target for Milestone 2.**
> The Case schema's required sections map 1:1 to the book's chapter
> structure. We can verify schema completeness by checking that any Kosoko
> chapter could be re-expressed as a Case YAML without information loss.

---

## Cross-check protocol (build prompt §"Knowledge verification rule")

Before any fact, dose, threshold, or guideline reference enters a case YAML:

1. **Primary UK source check** — NICE / RCEM Best Practice / Resus Council
   UK / BTS-SIGN / RCOG / BSPED — whichever is authoritative for the topic.
2. **UK textbook cross-check** — Oxford Handbook 5e for the same fact.
3. **Conflict resolution** — if textbook contradicts current guideline, the
   guideline wins; flag in case YAML with `# CONFLICT:` and link both.
4. **Wenzel / Kosoko** — used for case shape, atmosphere, didactic scaffold
   only. **Not** used as a clinical-fact source for UK practice.

Unsourced facts get `# TODO: verify` rather than guessing.

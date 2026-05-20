# Pixar-Braintrust design consultation #2 — The Skitt

The author of The Skitt has surfaced three design concerns. None are bugs. All are real critique-the-shape questions and the author wants two adversarial perspectives, not one synthesised answer. Push back on each other and on the orchestrator's straw-man take if you disagree.

## Q1 — The "menu of all encounters" wrongness

**Author:** *"I don't like that you have a menu of all possible encounters at the start of the game. It doesn't feel right. Should there be a progression through episodes either in order of increasing difficulty, or in terms of story arc progression?"*

### Ground truth from the codebase

- `src/App.tsx` registers 17 episodes via `SHIFT_DEFS: ShiftDef[]` — visible on the hub at first launch.
- `src/ui/practice/CasePracticeScreen.tsx` is explicitly labelled (in HANDOVER §3) as "a flat 17-card library" of all cases.
- HANDOVER §3 has "ShiftHubScreen" listed but the project ships with **no progression gating**. New player from M74 induction → hub → can launch any shift.
- Existing structures the project has but doesn't fully use:
  - **Difficulty tiering** is wired (F1 / F2 / CT1) per HANDOVER M77. But that affects scoring bands + trap-hint defaults *within* a shift; it does not gate which shifts are available.
  - **Arcs**: 3 currently (`arc_hendo_dinner`, `arc_family_peanut_party`, `arc_overnight_safety_net`). These are cross-case threads within a shift, not cross-shift progression.

### Orchestrator's initial take (push back if wrong)

Two-track structure:
- **Career mode** = the default. The shift is what the shift is. Each completed shift unlocks the next; sequencing follows clinical progression (resus presentations early, then ambient/diagnostic complexity, then complex multi-case nights). Arcs sit *across* shifts where possible (Anya the triage nurse appears in shift 4 and shift 7; the patient from shift 2 is the relative in shift 9). The structural reference is Disco Elysium: you don't pick the case; you sit down and the next file is on your desk.
- **Practice library** = retained as a separate menu mode for revision use, hidden behind a "consultant office / study" entry point, not the front door.

What I want from you:

- Does this two-track split fix the problem or just paper over it?
- If career mode, what's the actual unlock rule? Difficulty ladder, narrative ladder, or hybrid?
- If Disco's "the case is on your desk" is the structural reference, what's the equivalent of Disco's "wake up cold and don't know who you are"? Should the first shift be deliberately disorienting?
- Are there shifts in the current catalogue that *only* make sense as the entry shift, or as the late-game shift? Be specific. (Beth hen-do at T=5? Sarah ectopic? Brennan SDH double-bill?)
- Is keeping the practice library at all the right call, or does it undermine the career framing?

## Q2 — Case titles spoil the topic

**Author:** *"I also don't like that the titles give the topic away. in real life you don't know what a shift is going to bring."*

### Ground truth from the codebase

All 17 current `title:` fields in `content/cases/*.yaml`:

```
Acute heart failure — wet-and-warm cardiogenic pulmonary oedema
Chest pain in the waiting room — minors
Hypertensive emergency — hypertensive encephalopathy
Anaphylaxis — adult, peanut at restaurant
Anaphylaxis — child, brother of the resus-bay patient
Aortic dissection — Type A masquerading as inferior STEMI
Paracetamol overdose — staggered, university student
New-onset DKA — resus
Variceal UGIB — massive haematemesis in a Child-Pugh C cirrhotic
Head injury — mechanical fall on apixaban
Pelvic pain in early pregnancy — minors
Frequent flyer intoxicated — minors
Paediatric DKA — first presentation, 8 y/o
Urosepsis with septic shock — resus
Acute stroke — left MCA syndrome (right-sided weakness)
Massive PE — post-op syncope and right heart strain
Status epilepticus — first seizure of life
```

The title is displayed on the encounter header (line 264 of `EncounterScreen.tsx`: `{cs.data.title}`) and on the shift board / practice library cards.

### Orchestrator's initial take (push back if wrong)

The author is right. These titles read like the answer key. Three of them already have the right shape (the two "minors" ones name the bay-and-vibe; "Chest pain in the waiting room — minors" reads like triage). The rest read like CME slide-deck titles.

**Proposal:** the player-facing title is the triage-card chief complaint. The internal/debrief metadata gets a separate `clinical_title` (the current strings, for the debrief, the catalogue, the citations panel). Examples:

- "Anaphylaxis — adult, peanut at restaurant" → triage: *"Collapsed in restaurant, throat swelling — resus, 26F"*
- "Aortic dissection — Type A masquerading as inferior STEMI" → triage: *"Tearing chest pain, sweat-and-pale, 68M — query STEMI"*
- "Status epilepticus — first seizure of life" → triage: *"Brought in convulsing, mum on the phone — resus, 24F"*

The encounter card after disposition can show both titles — the chief complaint as they saw her, and the diagnosis they reached, side by side. That double surface is the *learning beat*.

What I want from you:

- Is the chief-complaint-as-title the right shape, or is there a better one? (Disco titles its dialogues by speaker name, not by what's said. Equivalent for Skitt might be "Beth, 26F, hen-do" — a person not a problem.)
- Does the "person not the problem" reframe land for the FRCEM-candidate audience or do they need the diagnostic anchor to know what they're revising?
- What about ambient cases on the board — the shift dashboard shows 3-4 cases at once. Are *those* titles their chief complaints or something else?
- Should the diagnosis be revealed only after the player commits a `working_dx`, or after disposition, or at debrief?

## Q3 — ED is the place, EM is the specialty

**Author:** *"smaller note: ED is a place, EM is a specialty. I don't like being referred to by the place in which I work. can we keep ED as reference to the emergency department, but change job titles to reflect emergency medicine practice? EM consultant, EM registrar etc."*

### Ground truth from the codebase

- `src/state/consultant.ts:20`: `export const CONSULTANT_ROLE = 'ED consultant';`
- `src/state/consultant.ts:5` (comment, 15 lines earlier): *"The voice — Dr Aoife McGrath, consultant in EM"*. Internal inconsistency.
- The original build prompt uses "EM doctor" / "EM trainees" throughout. The code drifted.
- Character roles are titled `F1 / F2 / CT1` (the training grades) — those stay as-is.
- "ED" the *place* is correct everywhere it appears: "Skittstown General ED", "ED workflow", "ED department view", "the relatives' room of the ED". Those are fine.

### Orchestrator's initial take

Author is correct. Scope of rename:
- `CONSULTANT_ROLE = 'ED consultant'` → `'EM consultant'`.
- Audit other places where ED is used as a role/specialty descriptor. Likely candidates: any "ED doctor", "ED nurse" (the latter is a real role, leave); "ED registrar" (rename to EM registrar).
- ED stays everywhere it means *the place*. "ED department", "the relatives' room of the ED", "Skittstown General ED", etc.

What I want from you:

- Are there edge cases I'm missing? (e.g. McGrath signing off "ED" on a memo — is that a place or a self-identification?)
- Should the player character role be re-tagged? (Currently F1/F2/CT1; that's training grade. Does the game ever say "you're a new ED doctor"? If so, change to "you're a new EM SHO / EM CT1".)
- Is "EM SHO" the right grade for the player's default? F1 in the ED is a thing, but if the case content is FRCEM SAQ level the player would more often be a CT trainee.
- UK trainees self-describe as "EM trainee" or "EM reg" — does the game's bedside dialogue (consultant interrupts, McGrath voice) need a sweep for "ED reg" / "ED doctor" mentions?

## Output

Return JSON of this shape:

```json
{
  "q1_progression": {
    "agree_with_concern": true | false,
    "verdict_on_orchestrator_take": "agree | disagree | partially",
    "your_take": "1-2 paragraphs — give judgment, not options",
    "specific_recommendation": "Be concrete: what's the unlock rule, what's the entry shift, what's the practice library's fate"
  },
  "q2_titles": {
    "agree_with_concern": true | false,
    "verdict_on_orchestrator_take": "agree | disagree | partially",
    "your_take": "1-2 paragraphs",
    "specific_recommendation": "Be concrete: title format, where the diagnosis is surfaced, ambient-case board entries"
  },
  "q3_ed_vs_em": {
    "agree_with_concern": true | false,
    "verdict_on_orchestrator_take": "agree | disagree | partially",
    "your_take": "1 paragraph",
    "specific_recommendation": "Concrete list of strings/files to touch + any edge cases"
  },
  "single_biggest_design_change_for_skitt": "1 paragraph. Of these three, which one has the most leverage on the Disco-bar / Dwarf-Fortress-bar ambition, and why?"
}
```

Both reviewers are reading this in parallel — give your own honest read, not a hedge that tries to be everyone's centrist.

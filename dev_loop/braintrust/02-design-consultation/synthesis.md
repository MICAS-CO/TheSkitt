# Braintrust 02 — Design consultation synthesis

**Reviewers:** Gemini 3.1 Pro Preview + Claude Opus, in parallel
**Cost:** Gemini ~$0.06; Opus free (env creds)
**Date:** 2026-05-20, against `611bbda` (M80)
**Trigger:** Author surfaced three design concerns to bring to both reviewers.

---

## The three concerns (author's words)

1. *"I don't like that you have a menu of all possible encounters at the start of the game. it doesn't feel right. should there be a progression through episodes either in order of increasing difficulty, or in terms of story arc progression?"*
2. *"I also don't like that the titles give the topic away. in real life you don't know what a shift is going to bring."*
3. *"ED is a place, EM is a specialty. I don't like being referred to by the place in which I work. can we keep ED as reference to the emergency department, but change job titles to reflect emergency medicine practice? EM consultant, EM registrar etc."*

---

## Q1 — Menu/progression — BOTH AGREE; BOTH PUSH HARDER THAN ORCHESTRATOR

Both reviewers concur with the concern and partially disagree with the orchestrator's two-track "career mode + practice library" answer. They want the practice library gone from the front door.

**Gemini:** *"The two-track split papers over the problem. Retaining a practice library from the start undermines the narrative stakes and the 'Disco' ambition. The career mode must be the only front door. Progression should be a narrative ladder that naturally escalates clinical difficulty."*

**Opus:** *"A menu of 17 shifts at first launch is the single most Disco-betraying surface in the build. Disco's whole structural claim is that the world arrives at you, not that you shop the world. The fix is: you have a rota. Locked shifts are not greyed out menu items — they don't exist on the rota yet because the rota hasn't been published."*

### Convergent recommendation

- **One front door = the rota.** Shows next shift + a peek at the one after. Completed shifts collapse into an e-portfolio (the FRCEM-candidate framing writes itself).
- **No practice library as a launcher.** Re-expose individual cases only inside the e-portfolio after they're worked, plus a single "random recall" warm-up button.
- **Hybrid unlock:** three blocks of ~5 shifts each, gated by a *keystone* shift per block (not every shift) cleared at F2+ band.
- **Entry shift** = a deliberately easy minors-floor day shift establishing the nurse-in-charge, McGrath, and the e-portfolio loop. From the existing catalogue: package the chest-pain-waiting-room + frequent-flyer-intoxicated cases as the entry shift.
- **Late-game shifts** (block 3, locked until prior anchoring earned): Aortic dissection (Gemini), Brennan SDH on apixaban (Opus), Massive PE post-op (Opus). All three require the player to have already confidently anchored on the *wrong* thing once before this trap-shaped case can teach what it's meant to teach.
- **First-shift disorientation:** procedural, not narrative. You don't know where the gloves are. The nurse-in-charge is testing you. The consultant is on coffee. The e-portfolio is empty. (Opus: *"Mechanical confusion, not narrative confusion. Not Disco-amnesiac."*)

### Cost of doing this

Not small. Touches:
- `src/App.tsx` `SHIFT_DEFS` registration shape
- A new `RotaScreen.tsx` replacing `ShiftHubScreen` / `ShiftBoardScreen` as the menu surface
- A new `EPortfolioScreen.tsx` for completed-shifts review
- A new progression state slice (which keystone shifts cleared at what band)
- Content reshape: the chest-pain + intox cases need to be packaged as one shift, not two
- Wiring `CasePracticeScreen` to be unreachable until campaign complete (or removable)

Multi-iteration work.

---

## Q2 — Titles spoil the topic — BOTH AGREE; ONE REAL DISAGREEMENT ON FORMAT

Both reviewers fully agree the concern is valid. Both endorse the orchestrator's reframe (player-facing title ≠ clinical title). One genuine disagreement on the *format* of the player-facing title.

### Gemini Pro — tracking-board format

> *"`person not the problem` is a false dichotomy in EM. Doctors look at the tracking board, which displays age, sex, and chief complaint. The board should reflect exactly what the clinical software shows."*
>
> Format: `[Age][Sex] - [Chief Complaint]` (e.g., `68M - Tearing chest pain`)

### Opus — person-first format

> *"Person, not problem, not even complaint. The triage card is what the nurse-in-charge says to you, in her voice, in eight to twelve words. That's the title. The complaint is in the body of the triage note, not the header."*
>
> Format: `<First name>, <age><sex>, <one-line vibe>` (e.g., `Beth, 26F, brought in from a hen-do`)

### Resolution proposed by orchestrator (post-synthesis)

Both formats coexist because they appear at different surfaces:

| Surface | Format | Voice |
|---|---|---|
| Shift board / rota / dashboard (the tracking board you scan) | Gemini's format | Clinical software |
| Encounter header / vignette card / handover beat | Opus's format | Nurse-in-charge's voice |
| Debrief screen (post-disposition) | Both, side-by-side | "How she came in" / "What this was" |

This matches the real ED workflow. The reveal-at-debrief structure is what both reviewers explicitly endorsed.

### Convergent (both reviewers agreed):

- Add a `clinical_title` field to the case YAML, populated with the current titles verbatim (one find-replace).
- Diagnosis revealed **only at debrief**, NOT at working_dx commit. *"The player committing a wrong dx and then watching the case unfold is the highest-value teaching moment in the build — don't spoil it the moment they click."* (Opus)
- Three of the current 17 titles already half-conform (the two "minors" ones, plus chest-pain-waiting-room). Rewrite all 17 in one sitting so the voice stays consistent.

### Cost of doing this

Smallest of the three. Roughly:
- `schema.ts`: add `clinical_title: z.string()` to Case shape
- `validator.ts`: require it on all cases
- 17 case YAMLs: `title:` becomes player-facing version, add `clinical_title:` with the current value
- `EncounterScreen.tsx` line 264: use the per-surface logic
- `ShiftBoardScreen.tsx`: same
- `EpisodeDebriefScreen.tsx`: render the side-by-side reveal
- 4-6 hours of focused work + a content-authoring afternoon for the 17 player-facing titles.

---

## Q3 — ED is a place, EM is a specialty — BOTH AGREE; SMALL JOB

Both fully agree with concern and with orchestrator's scope. Convergent additions:

- **`ED nurse` is correct UK usage — leave it.** (Both reviewers flagged this independently.) "Nurses don't typically self-describe as 'EM nurse' the way doctors do." (Opus)
- **Player default grade should change** from F1/F2/CT1 to **EM CT1** (default), with F1/F2 retained as easier-difficulty framings ("you're shadowing as the F2 today"). FRCEM SAQ content sits at CT1-CT3, so F1 default is wrong for the FRCEM-candidate audience.
- **Self-identification vs reference to the place:** "the ED" stays when referring to the place ("we've been in the ED for six hours" from a relative is correct UK speech). "ED reg" / "ED doctor" → "EM reg" / "EM doctor" everywhere a person is describing what they ARE.
- **McGrath memo sign-off pattern:** "EM Consultant, Skittstown General ED" — specialty, then place.

### Files to touch

- `src/state/consultant.ts:20` — `CONSULTANT_ROLE = 'EM consultant'`
- `src/state/character.ts` — player role default
- Grep + sweep for `ED consultant`, `ED registrar`, `ED reg`, `ED SHO`, `ED doctor`, `ED trainee`, `ED clinician` → EM equivalents
- LEAVE: `ED nurse`, `ED nursing`, `in ED` (workplace-adjective shorthand), any `ED` referring to the place
- Bedside-dialogue sweep: McGrath's lines in `state/consultantInterrupts.ts` and any history items where staff self-identify

### Cost of doing this

Cheapest. Roughly 1-2 hours including the McGrath voice sweep.

---

## Reviewers split on "single biggest design change"

**Gemini → Q2 (titles).** *"Spoiling the diagnosis reduces a complex, Dwarf-Fortress-style clinical reasoning engine into a linear management checklist. By hiding the diagnosis and presenting only the chief complaint, you force the player to actually do the diagnostic work."*

**Opus → Q1 (progression).** *"Q2 is the highest leverage per hour of work; Q1 is what decides whether Skitt is a study app with narrative skin or the thing it claims to be. Career-mode-with-a-rota is also what makes Q2's reveal-at-debrief land — a chief-complaint title only feels like a chief complaint if the case is what's in front of you tonight, not what you picked off a shelf. Fix Q1 and Q2 becomes load-bearing instead of cosmetic; fix Q2 without Q1 and you've made the menu prettier."*

Both true at different levels. Pragmatic ordering: **Q3 first (cheap, no-disagreement), Q2 second (high-leverage one-day job, well-bounded), Q1 third (multi-iteration structural work).**

---

## Recommended next iteration

1. **Q3 ED→EM rename** — 1-2 hours. Coder = me. Reviewer = Gemini Pro on the diff. Tiebreaker if needed = Sonnet on McGrath voice calls.
2. **Q2 title reframe** — 4-6 hours. Coder = me. Reviewer = both Gemini and Opus on the 17 author-pass titles (writing critique, not code). Tiebreaker for any voice disputes = Sonnet.
3. **Q1 rota + e-portfolio** — multi-iteration. Plan first, scope second, code third.

The Q3+Q2 bundle is the right next commit. ~6-8 hours of work, two reviewer cycles, both well-bounded.

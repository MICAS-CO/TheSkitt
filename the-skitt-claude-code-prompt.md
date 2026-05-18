# The Skitt — Claude Code Build Prompt

## Project vision

Build a web-based, episodic, story-driven emergency medicine RPG called **The Skitt** (working title, inspired by *The Pitt*). The player is an EM doctor managing patients through a shift.

Each ~20-minute episode runs **2–3 deeply-playable focus cases plus ambient board pressure**, with **intersecting story arcs** that braid the cases together — the worried parent in bay 2 doesn't yet know the trauma rolling into resus is their son; the frequent flyer in minors is the one quietly deteriorating while you're tied up elsewhere; two patients arrive from the same RTC with very different injury patterns. The shift runs on a real clock: while you're with one patient, others evolve.

The game is a learning tool for UK FRCEM candidates (Intermediate SAQ and Final SAQ/SBA level), with case content grounded in authoritative EM sources.

## Target audience

UK FRCEM candidates and EM trainees. Clinical reasoning, depth, and examiner-style traps must match FRCEM Intermediate/Final standard. UK practice — UK drug names, UK guidelines (NICE, RCEM, Resus Council UK), UK ED workflow.

## Core design pillars

1. **Clinically rigorous** — every case decision maps to evidence-based EM practice with a citation.
2. **Atmospheric, not gimmicky** — pixel art and shift-drama framing serve immersion; never trivialise patient care.
3. **Replayable** — branching outcomes, varied case mix, no two shifts identical.
4. **Learnable** — debrief screens with rationale, references, and links back to source material.

## Visual & audio style

- Higher-res pixel art RPG aesthetic (think *Stardew Valley* / *Sea of Stars* density, **not** 8-bit retro).
- Top-down ED department view as the hub: bays, resus, paeds corner, majors, minors, relatives' room.
- Patient sprites with condition-appropriate states (cyanosed, diaphoretic, agitated, post-ictal, etc.).
- Diegetic UI where possible: clipboards, monitors, drug charts.
- Ambient ED soundscape; monitor beeps that respond to patient state.

For the MVP, use placeholder sprites with a consistent palette. Don't sink time into art.

## Gameplay loop

### Episode level (one ~20-minute shift)

- **Shift clock** runs continuously. Patients exist in parallel. Time passes whether you're with someone or not.
- **2–3 focus cases** — deeply playable: full history → exam → ix → mx → outcome loop.
- **Ambient board pressure** — 2–4 additional patients you see on the board, occasionally check on, refer, or hand over. Mostly texture; can become a focus case if you ignore the wrong one.
- **Scheduled events** fire on the timeline: results back, NEWS2 escalations, new arrivals, family showing up, bed manager pressure, lab callbacks, deterioration if X wasn't done by T+n.
- **Intersecting arcs** — narrative links between cases (relation, shared incident, recurring character, hidden connection). At least one per episode. Arc reveals are gated on player actions or clock progress.
- **Handover at start** and **end-of-shift debrief** bookend the episode.

### Per-encounter (when player is with a specific patient)

1. **History** — dialogue tree with patient / family / paramedic / GP letter.
2. **Examination** — interactive sprite (chest, abdomen, neuro, etc.).
3. **Investigations** — order set with realistic turnaround times; results arrive on the shift clock, not immediately.
4. **Differential & working diagnosis.**
5. **Management** — drugs with doses, procedures, referrals, disposition.
6. The player can **leave the encounter** at any point; the patient persists in their current state until the player or an event returns to them.

Pressure should feel like a busy ED, not a reaction-time test. The clock matters, but the game is about *prioritisation and reasoning*, not twitch.

## Content model

Three nested entities:

**Episode** — a 20-minute shift.
- Title, learning objectives, RCEM curriculum tags covered.
- Roster of focus cases (2–3) and ambient cases (2–4).
- Scheduled events on the shift timeline.
- Narrative arcs linking cases.
- Difficulty band overall.

**Case** — one patient encounter. Maps to the **RCEM 2021 curriculum**. Each case carries:
- Curriculum tag(s) and SLO mapping
- Difficulty band (CT1 → ST6 / FRCEM Final)
- Source citations (book + page, RCEMLearning module URL, NICE/RCEM guideline ID)
- Clinical pearls
- Common pitfalls / SAQ-style examiner traps
- Decision tree with weighted outcomes
- Per-case state machine (stable / deteriorating / arrested / discharged / admitted) with transitions tied to time and player actions

**Arc** — a narrative thread spanning two or more cases in the same episode.
- Type: family relation, shared incident, hidden identity, frequent-flyer-with-new-pathology, recurring NPC, etc.
- Reveal triggers (clock time, specific player action, specific finding).
- Effect on cases (e.g. revealing the arc unlocks new history for case B).

The schema needs all three from milestone 2. Don't retrofit arcs later — that always hurts.

## Content sources

**In-project (already provided in `/mnt/project/` — read these first):**

- *Oxford Handbook of Emergency Medicine* (Wyatt & Taylor)
- *Case Studies in Emergency Medicine* (Wenzel)
- *Emergency Medicine Case-Based Guide: Obstetric Emergencies* (Kosoko)

**Live web (fetch, cite, do not redistribute verbatim):**

- RCEM curriculum and guidelines — https://rcem.ac.uk
- **RCEMLearning — https://www.rcemlearning.co.uk** — use this for **topic calibration only**. Survey the public-facing module list, session titles, podcast topics, and reference pages to build an internal "high-yield topic map" — what comes up often, what's weighted heavily, what the college signals as exam-relevant. **We do not pull text from RCEMLearning into the game.** We use it to decide *what* the cases should teach; the *content* of cases comes from the open books, NICE/RCEM/Resus Council guidelines, and original authored material. Save the topic map to `/content/topic-map.yaml` so I can see what informed the case selection.
- NICE guidelines relevant to EM (sepsis NG51, anaphylaxis, ACS, head injury, etc.)
- Resuscitation Council UK — ALS, APLS, EPALS algorithms
- BestBETs — https://bestbets.org

**Knowledge verification rule:** any case fact, dose, threshold, or guideline reference must be cross-checked against ≥1 cited source before it enters the case pool. Flag conflicts and stop for my review — do not silently pick one.

## ⚠️ Legal & ethical guardrails

- **Do not reproduce substantial copyrighted text** from the books, RCEMLearning, or NICE. Cases are originally authored vignettes informed by these sources, with citations and links so the user can read the originals.
- **RCEMLearning is for topic calibration, not content.** No paywall workarounds, no pulling module text in. If a public page is genuinely freely accessible and you want to cite a topic exists, that's fine — quoting from it is not.
- **No medical advice positioning** — the launch screen / about page must make clear this is study material, not clinical guidance.
- **No "patient dies" splash screens.** Outcomes are clinical and surfaced in the debrief, framed as learning.

## Technical direction

Suggested stack (push back if you have a better idea — justify it):

- **Frontend**: TypeScript + **Phaser 3** for the pixel-art game layer, **React** for menus / debrief / study screens. Single Vite app, Phaser mounted in a React component.
- **State**: Zustand for UI state. A separate, deterministic **event scheduler / tick loop** owns the shift clock, patient state evolution, and scheduled events — do not mix this into Zustand. Think of it as the game's simulation kernel; React/Phaser are just views onto it.
- **Content store**: Cases as structured **YAML** files in `/content/cases/`, validated against a Zod schema at build time. No DB for MVP.
- **AI in-loop**: Use the Claude API for runtime patient dialogue *flavour* and case variation only — **never on the critical clinical path** (differential, dose, disposition). Defer until after the scripted experience is solid.
- **Testing**: Vitest for schema and game logic; Playwright for one end-to-end smoke test.
- **Deploy**: Static site to Cloudflare Pages or Vercel.

You have full internet access — use it for guideline lookups, library docs, and source verification. Cache fetched guideline summaries to `/content/sources/` so I can audit what informed each case.

## Scope for this session — MVP, milestone by milestone

**Stop and show me each milestone before continuing.**

1. **Project scaffold** — repo structure, Vite + TS + React + Phaser, lint, format, a "Hello, ED" Phaser scene rendering a placeholder department layout. Smoke test passes. `CHANGELOG.md` and `DECISIONS.md` started.
2. **Episode + Case + Arc schema** — Zod schemas, sample YAML for each, validator CLI (`pnpm validate-content`). Schemas must accommodate everything in the content model above, including arcs and scheduled events, from day one.
3. **One playable case, end-to-end** — pick a high-yield, well-protocolised topic (anaphylaxis, STEMI, sepsis, or DKA are good candidates). Full encounter loop: history → exam → ix → mx → debrief. No shift clock yet — prove the encounter loop works in isolation. Cite everything in the YAML.
4. **Simulation kernel + episode shell** — deterministic tick loop, shift clock, scheduled-event bus, patient state machines that evolve while the player is elsewhere. Wrap the milestone-3 case in a single-case episode running on the clock with at least one scheduled event (e.g. bloods come back at T+10). This is the architectural backbone for everything that follows — get it right.
5. **Second case + first intersecting arc** — author a second case of deliberately different shape (paeds or obstetric). Wire it and case #1 into a 2-case episode with one narrative arc connecting them. This is the first time the game actually feels like *The Skitt*. Refactor the schema if real authoring exposes weaknesses.
6. **Episode-level debrief & scoring** — per-case outcomes, arc resolution, what-the-examiner-wanted breakdown, source links, overall episode grade.
7. **Content ingestion CLI** — `pnpm new-case` and `pnpm new-episode`: take a topic and optional source (PDF page range or URL), draft a YAML skeleton populated with verified facts and citations, leave clinical decisions for me to author. Informed by what milestones 3–5 actually needed.
8. **Stretch — ambient board pressure** — add 2 ambient (non-focus) patients to the milestone-5 episode whose board state changes over the shift and who can be escalated to a focus case if neglected.

**Defer for later sessions**: save system, art pipeline polish, audio, branching narrative trees, LLM-driven patient dialogue, multiplayer/leaderboards, mobile layout, accessibility audit.

## How to work with me

- **Read the three project PDFs and skim the RCEM curriculum page before designing the schema.** Don't design content structure without seeing the source shape.
- **Ask before non-obvious architectural choices.** Engine, state lib, content format — surface the decision, recommend, then ask.
- **Show me the first runnable build as early as possible**, even if it's ugly placeholder squares.
- **Cite sources inline in every case YAML.** If a fact isn't sourced, mark it `# TODO: verify` rather than guessing.
- **Keep `CHANGELOG.md` and `DECISIONS.md` current** — one-liner per change, fuller note per architectural call.
- **When you hit a paywall or login wall, stop and ask me.** Never try to work around it.
- **When sources conflict** (e.g. older textbook vs current NICE), flag it and ask — don't pick silently.

## Anti-goals

- Not an arcade game. Pressure should feel like a busy ED, not a reaction-time test.
- Not a flashcard app with a sprite on top. The clinical reasoning chain is the point.
- **Not variety for its own sake.** Three well-drawn cases with a real arc beat six shallow ones. If milestone 5 starts feeling thin, cut a case rather than dilute.
- Not a replacement for supervised clinical training. The about page must say so.
- Not a content-reproduction tool. We *learn from* the books and RCEMLearning; we don't republish them.

## Ready?

Start by:

1. Reading the three PDFs in `/mnt/project/`.
2. Fetching the RCEM curriculum overview from rcem.ac.uk.
3. Proposing: the project structure, the case schema sketch, and which topic you'd pick for the first end-to-end case — and why.

Then wait for my go-ahead before writing code.

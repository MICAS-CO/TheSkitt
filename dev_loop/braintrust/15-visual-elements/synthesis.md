# Braintrust 15 — Visual elements synthesis (revised, four reviewers)

**Reviewers:**
- **Gemini 3.1 Pro Preview** — real multimodal API call. Sent 8 screenshots + design-system spec. Take in `gemini-take.md`.
- **OpenAI GPT-5.5** (`gpt-5.5-2026-04-23`) — real multimodal API call. Fourth reviewer, completed after env allowlist + `OPENAI_API_KEY` were reconfigured. Same 8 screenshots + spec. Take in `openai-take.md`, usage in `openai-usage.json`.
- **Claude Opus voice** — orchestrator-written, philosophical / stakes-and-identity register. Take in `opus-take.md`.
- **Claude Sonnet voice** — orchestrator-written, practical / hours-cost-ranking register. Take in `sonnet-take.md`.

**Real-API calls:** Gemini + OpenAI. **Orchestrator-voice:** Opus + Sonnet. This is the honesty contract per `BRAINTRUST_PATTERN.md`.

**Cost:** Gemini multimodal ~$0.06 · GPT-5.5 multimodal ~$0.15 (65k input + ~2k output tokens incl. 516 reasoning) · Opus / Sonnet free. Total this consultation: **~$0.21**.

**Date:** Round 1 against commit `05f6acc` (2026-05-20, Gemini + Opus + Sonnet). Fourth reviewer added 2026-05-21 against the same commit + same inputs, no re-screenshot. This is now the authoritative document; the round-1-only version is preserved in git history.

---

## Where all four reviewers AGREE (strong convergence)

1. **The Phaser department hub does not earn its 1.5MB dependency in its current form.** Three of four (Gemini, Opus, Sonnet) said cut outright. The fourth (GPT-5.5) said reduce-to-static rather than cut, but reframes to the same end-state: replace the live walk-around with a static department map. The unanimous read is the live walk-around delivers no decision-value the card click doesn't already deliver. GPT-5.5: *"Movement is not interaction unless movement creates decisions, interruptions, proximity cues, or time pressure."* Gemini: *"a 1.5MB vanity dependency that completely breaks the abstraction layer."*

2. **The semantic-colour token contract is the build's strongest design-system work — but it is leaking.** Three of four (Gemini, Opus, Sonnet) named the M67 token contract as a triumph with no qualification. GPT-5.5 agrees the discipline is real (*"This does not look like a random Bootstrap app"*) **but** identifies specific leak surfaces:
   - **Amber** appears on "TODAY'S SHIFT" header, e-portfolio block accent, awaiting-clinician flag, and bed-state amber. The contract says amber is `trap icon ONLY`. GPT-5.5: *"If amber is operational status, then say that; if it is trap-only, stop using it as a warm UI accent."*
   - **Red** has spread from logo + resus stripe to "pick," "decide," and "core actions open" pills. GPT-5.5: *"red feels like generic urgency rather than clinical danger."*

   Honest synthesis: contract is close enough to be worth protecting, but a real audit pass (Reserved item from round 1) needs to ship sooner than originally scoped.

3. **The encounter screen's information density is appropriate for the genre but the hierarchy is not ruthless enough.** All four say it's right that the screen feels busy. Three of four (Gemini, Opus, Sonnet) were content with deferring the shift-log panel as the main density fix. GPT-5.5 goes harder: the right rail (portrait + NEWS2 + vitals + monitor toggle + log) is *"a museum of widgets"* and should be condensed into a single compact clinical-state module.

4. **Typography stack works.** Space Grotesk display + Manrope body + JetBrains Mono mono is praised by all four. JetBrains Mono on tabular vitals is singled out repeatedly. Caveat (hand-drawn) is the question mark for all four — either purge it or document where it earns its keep.

5. **Brand identity passes.** Red pixel cross, "The Skitt" wordmark, TheCase.Report lockup, teal clinical palette — all four read it as a credible UK FRCEM study tool, not patronising NHS e-learning. GPT-5.5 adds a small but real polish point: **the `v0.0.1` footer should not be visible to learners** — it screams prototype.

6. **The Disco Elysium reference is a category error.** Gemini + Opus + GPT-5.5 each surfaced this independently (round 1 had Gemini + Opus on this; GPT-5.5 ratifies). DE is painterly illustration with pixel-art-feeling UI; The Skitt is crisp-edged pixel sprites + serious modern UI. The actual lineage is closer to *Papers, Please*. Optimise toward "made by clinicians, for clinicians," not toward DE.

---

## Where the reviewers DIVERGE (and what to do about it)

### The Patel pixel portrait — material disagreement (the round-1 → round-final flip)

This is the round-1 finding the fourth reviewer materially **changed**.

- **Gemini + Opus + Sonnet (round 1):** the patient portrait earns its pixels. It's where the pixel craft does real emotional work — a person on a trolley, not a clinical abstraction. The round-1 convergent recommendation was M93: dress the portrait in a diegetic bay-monitor frame (scanline, phosphor tint, CRT vignette, "BAY MONITOR · bay {n} · {clock}m" label) to reconcile the build's two visual identities without changing the portrait itself.

- **GPT-5.5 (fourth reviewer):** the portrait does **not** yet earn its space. The character art is too simple to carry the burden Disco Elysium portraits carry. Sitting it in a fake monitor frame *"like a Game Boy cutscene"* while the rest of the page is *"a precise, modern clinical cockpit"* makes the mismatch louder, not quieter. GPT-5.5's recommendation: either shrink the portrait and demote it into the compact clinical-state card, **or** make it clinically responsive (sweat / pallor / distress / oxygen mask / posture / daughter present) so the pixels earn their keep through pedagogy.

**How to read this divergence.** GPT-5.5 is not denying the portrait could earn its space — it's saying the round-1 fix (monitor framing) is cosmetic, and the substantive fix is to give the portrait a clinical job. This is consistent with Opus's *reserved* round-1 item: *"render Mrs Patel as more unwell as the case state degrades"* — exactly what the `extraPatientSprites.ts` variants already in the codebase enable.

The synthesis sides with GPT-5.5 here. Round-1 Reserved-item alignment + GPT-5.5's independent high-confidence call against monitor-framing-alone outweighs three reviewers liking a cosmetic fix. **M93 is revised below.**

### Phaser hub — cut vs reduce-to-static

- **Gemini, Opus, Sonnet:** cut. Replace with a static SVG floorplan. Remove `phaser` + `EDScene.ts` + `walkCycles.ts`.
- **GPT-5.5:** reduce-to-static. Keep the spatial metaphor (resus / majors / paeds / minors / triage / relatives' room); lose the walk-around.

Same implementation either way — the difference is rhetorical. End-state convergence: ship M92 as Phaser-dependency removal + static SVG floorplan + bay-placed case chips. Frame the commit as "reduce to static" rather than "cut entirely" — that matches all four takes and is the more accurate description.

### Mobile readiness — new dimension from the fourth reviewer

- **Round 1 (Gemini, Opus, Sonnet):** mobile not addressed in any take.
- **GPT-5.5:** *"On a desktop it reads like a serious indie FRCEM project. On a phone? Not yet. The screenshots are wide, roomy, and heavily two-column. A UK ED trainee would want the content on their phone, but the visual system currently feels designed for a laptop during study time, not a five-minute break on shift."*

This is genuinely new. Defer to a separate consultation — mobile responsiveness is milestone-scale, not a polish ship. File as **M95+ candidate: mobile pass**, run a fresh braintrust before scoping.

---

## Convergent recommendation (revised)

Three-ship sequence with materially revised M93. Each ship independently reviewable.

### M92 — Phaser hub → static SVG floorplan (unchanged from round 1)

Unanimous across all four reviewers (three said cut, one said reduce-to-static; same implementation).

- Remove `phaser` from `package.json` + `import Phaser` + lazy `PhaserGame` component
- Delete `src/game/scenes/EDScene.ts` and `src/style/walkCycles.ts` (only the hub avatar uses walk-cycles)
- Replace the hub view with a static SVG floorplan: same bay rectangles + labels, **plus** current-case chips placed in their bay (this is the small upgrade GPT-5.5's framing demands — the static map should do MORE than just sit there)
- Update tests; update the menu's "ED hub layout" preview-card copy
- Bundle size: shed ~1.5MB
- Cost: 2-3 hours
- **Commit framing:** "M92: replace Phaser hub with static department floorplan + bay-placed case chips"

### M93 — State-responsive patient portrait + diegetic monitor frame (revised, scope expanded)

Round 1 had M93 as monitor-frame-only. GPT-5.5's challenge — the portrait itself doesn't earn its size — promotes the state-responsive variants (round-1 *Reserved*) into the M93 critical path. The honest read: monitor framing alone is the cosmetic fix three reviewers wanted; with state-responsiveness, GPT-5.5's pedagogical objection also lands.

Two acceptable shapes; author picks one based on time / scope appetite:

**M93 (full) — state-responsive portrait + diegetic monitor frame** (recommended)
- Wire the existing `extraPatientSprites.ts` variants to the case state machine. Pick 3-4 cases with clinically distinguishable presentations (Patel STEMI, anaphylaxis/urticaria, DKA/dehydrated, head-injury/post-traumatic) and author state diffs that change as the case evolves
- Frame the EncounterScreen patient-portrait container as a bay-monitor feed: scanline overlay, phosphor tint at edges, slight CRT vignette, label "BAY MONITOR · bay {bay} · {clock}m"
- Clinical job justifies the size; monitor frame justifies the pixel-art register against the modern clinical UI
- Cost: 4-6 hours (state-variant wiring across 3-4 cases is the slow part)

**M93 (lite) — shrink the portrait + demote to compact patient-state card** (cheaper fallback)
- Smaller portrait thumbnail inside a compact right-rail "patient state" module: small portrait + NEWS2 + current vitals + trend + last event
- Skip the monitor framing entirely — the cognitive job is now done by the compact card, not the portrait
- Frees vertical space for the actual clinical work
- Cost: 2-3 hours
- **Trade-off:** lose the bay-monitor visual identity reconciliation three reviewers wanted; but unblock the right-rail hierarchy GPT-5.5 wanted

**Author's call.** M93-full is higher-leverage and more expensive. M93-lite is the honest-to-budget alternative.

### M94 — Token-contract leak audit + shift-log defer + Caveat audit + v0.0.1 footer (expanded)

GPT-5.5's leak findings on amber / red promote the round-1 *Reserved* CI-test item: you can't write a CI test for a contract that's currently leaking. Audit first.

- **Token-contract leak audit (new):** `grep -r 'var(--warn)\|var(--brand-red)' src/` and audit each call site against the M67 contract:
  - Amber: trap icon only. If currently used on "TODAY'S SHIFT" header, e-portfolio block accent, awaiting-clinician chip, or bed-state — those need either (a) migration to a different operational-status token (introduce `--status-info` / `--accent-warm`), or (b) the contract amended to say "amber = trap icon OR operational-status; never decoration"
  - Same audit for red on "pick" / "decide" / core-action pills
  - The audit's output is a small migration commit, then the visual-contract CI test (round-1 *Reserved*) becomes writable
- **Shift log side panel → collapsible chip** (unchanged from round 1): default collapsed at T+0; expand on click; auto-expand when a new log entry arrives
- **Caveat audit** (unchanged from round 1): `grep -r 'font-hand\|Caveat' src/` and purge-or-document
- **`v0.0.1` footer removal (new):** hide the version string from learner-facing chrome. Keep it in `dist` build metadata / about page, but not in persistent footer
- Cost: 2-3 hours (token audit is the bulk)

### Reserved (defer if not justified now)

- **Visual-contract CI test** (Opus suggestion, round 1): now arguably *more* justified by GPT-5.5's leak findings. Becomes writable after M94's leak audit. M95 candidate.
- **Mobile responsiveness pass** (new, GPT-5.5): two-column → stacked at phone widths, side panels collapse, density audit per screen size. M95+ candidate. **Run a fresh braintrust before scoping** — mobile is a milestone-scale design call that warrants its own consultation.

### Refused

- Re-investing in a live Phaser hub. Unanimous against — three "cut," one "reduce-to-static," none "invest."
- Replacing the patient pixel portrait with stock photo or illustrated art. Even GPT-5.5 — the harshest portrait take — didn't abandon the pixel register, only said it needs a clinical job to earn its size.
- A wholesale typography revisit. All four praise Space Grotesk + Manrope + JetBrains Mono. Touch Caveat only.

---

## Cost of doing this

- M92: 2-3 hours. Unchanged. Consensus first ship.
- M93 (full): 4-6 hours. Higher-leverage; addresses GPT-5.5's pedagogical concern + three-reviewer visual-identity concern in one ship.
- M93 (lite): 2-3 hours. Cheaper fallback if M93-full is over-budget.
- M94: 2-3 hours. Up from round 1's 1-2 because of the added token leak audit.

Total **~6-12 hours** for the full visual-elements sweep (was 5-9 in round 1; growth = M93 scope expansion + token audit).

---

## Reviewer confidence (self-rated)

- Gemini: high
- GPT-5.5: high
- Opus voice: medium-high
- Sonnet voice: high

GPT-5.5's high confidence on the Patel-portrait disagreement is what justifies revising M93 rather than treating it as outlier. The disagreement is not between an external reviewer and the orchestrator voices — it is between two real-API reviewers (Gemini said portrait earns pixels; GPT-5.5 said it does not). Both calls are real; both are high-confidence; the synthesis sides with GPT-5.5 on grounds that the round-1 framing (cosmetic monitor frame fixes everything) does not survive the round-1 Reserved item being promoted to the critical path.

---

## Recommended next move

**Land M92 first.** Unanimous across four reviewers; lowest-risk single-ship fix; biggest perceived-quality lift per hour. After M92 lands and is reviewed (pattern B, Gemini round1 → fixes → round2 per `BRAINTRUST_PATTERN.md`), decide M93-full vs M93-lite with the author based on time/scope appetite at that point.

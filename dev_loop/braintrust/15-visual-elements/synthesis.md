# Braintrust 15 — Visual elements synthesis

**Reviewers:** Gemini 3.1 Pro Preview (multimodal — sent 8 screenshots + the design-system spec) + Claude Opus + Claude Sonnet (orchestrator wrote both Claude voices as distinct registers).
**Cost:** Gemini ~$0.06; Opus/Sonnet free.
**Date:** 2026-05-20, against commit `05f6acc`.

---

## Where all three reviewers AGREE (strong convergence)

1. **The Phaser department hub — CUT.** Unanimous, all three reviewers, no hedge. The 1.5MB Phaser dependency renders to coloured rectangles + a wobbly walk-cycle avatar that has shipped at every milestone unchanged. Gemini's framing: *"a 1.5MB vanity dependency that completely breaks the abstraction layer."* Opus: *"the version that's shipping is worse than not shipping."* Sonnet: *"the screen as it currently renders communicates 'this product is half-built'."* Replace with static SVG floorplan (~50KB instead of ~1.5MB) or remove the navigation point entirely.

2. **The semantic-colour token contract is the build's strongest design-system work.** All three named the M67 audit's discipline as a triumph. The token-per-job rule (brand-red ONLY for logo + resus stripe; amber ONLY for trap icon; etc) holds across all eight surveyed screenshots. Gemini: *"It feels like a piece of high-end medical software."* Opus: *"would survive an external code review at a serious product company."* Sonnet: *"the kind of upfront engineering most projects skip and pay for later."*

3. **The encounter screen's density is correct** but the shift-log side panel should be deferred (hidden until events arrive) or moved. The vignette is the build's strongest written content and deserves the visual centre; the log competes for attention without doing work at T+0.

4. **Typography stack is excellent.** Space Grotesk display + Manrope body + JetBrains Mono for data. JetBrains Mono on the vitals strips singled out specifically — tabular figures matter for stressed-registrar parsing.

5. **Caveat hand-drawn font is the question mark.** Two of three (Gemini + Opus) want it purged unless it's earning its keep on a real surface. Sonnet flagged it couldn't see Caveat in use across the eight screenshots either. Verdict converges: audit where it's used; if nowhere, delete; if somewhere, document the surface so future authors don't generalise.

6. **The brand identity passes the test.** The small red pixel cross + "The Skitt" wordmark + TheCase.Report lockup + the v0.0.1 footer reads as exactly what the build is: clinicians making something for clinicians. Gemini: *"It does not look like a patronizing NHS e-learning module."*

7. **The patient portrait in the encounter screen earns its pixels.** All three identified Mrs Patel's pixel face as the place the pixel craft does real emotional work — a person on a trolley, not a clinical abstraction. The pixel choice elsewhere (icons, walk-cycle, asset library variants) is more decorative than functional.

---

## Where the reviewers DIVERGE (and what to do about it)

### Highest-leverage improvement

Two reviewers' top picks were the same SHAPE of fix:

- **Gemini**: *"Apply a 'medical monitor' visual treatment to the patient pixel sprites. Right now Mrs Patel is a flat opaque graphic sitting on a pure black background inside the CardioVis container. Give that container a subtle dark-green phosphor glow, faint scanlines, or a slight vignette. Make the pixel art feel like it is being rendered by the medical equipment within the game's universe."*

- **Opus**: *"Make the pixel art diegetic, not decorative. Render the portrait container as a CCTV / monitor feed (subtle scanline, slight phosphor tint, dim border-glow), and label it as such ('bay monitor — bay 4 · 19:24'). The pixel art is now a thing the player is LOOKING AT through the simulation, not a sprite the simulation is showing them."*

- **Sonnet** picked a different angle (cut the Phaser hub first) but didn't disagree with the diegetic-monitor idea — they just ranked the Phaser cut higher.

The convergence is strong. The diegetic-monitor treatment is a 2-3 hour CSS-and-light-restructure fix that reconciles the build's two visual identities (sober pixel craft + modern clinical UI) without changing either. Both pixel art and modern UI keep their existing register; the framing makes them speak to each other.

### What to cut first

- **Sonnet**: Caveat font (provably unused; cheapest single deletion)
- **Gemini**: Phaser dependency + hub scene
- **Opus**: Phaser dependency, alternatively the unused patient sprite variants in `extraPatientSprites.ts` etc

The Phaser cut is what TWO of three said should be the first move and the third (Sonnet) recommended as the highest-leverage improvement. So Phaser cut is the consensus first ship. The Caveat audit is a cheap follow-up.

### Pixel-art reading

- **Gemini**: *"The 'Disco Elysium' comparison is a false flag. Disco uses painterly impressionistic art that bleeds into its UI. What you have here is Papers, Please meets an ICU monitor."* — the framing is a category error.
- **Opus**: identical observation, attributed differently. *"Disco Elysium specifically is not a pixel-art game — it's a painterly-illustrated game that uses pixel-art-feeling UI."* — the build's heritage is more *Papers, Please*, which is fine.
- **Sonnet**: didn't engage with the genealogy directly but agreed on functional outcome.

Both Gemini and Opus independently caught that the Disco reference is a misleading frame for what the build actually IS visually. Don't optimise toward Disco; optimise toward a build whose pixel craft and clinical UI speak to each other on their own terms.

---

## Convergent recommendation

Three-ship sequence, each separately reviewable:

### M92 — Phaser hub removal (cheap, unblocks the rest)

- Remove `import Phaser` and the `PhaserGame` lazy component
- Replace the hub view with a static SVG floorplan component (same bay rectangles, same labels, no walk-around). Keep the navigation point ("Department view" button) so the player can see the floor — but the SVG is rendered, fast, finished-looking.
- Remove `src/style/walkCycles.ts` (only used by the hub avatar)
- Update tests; update the menu's "ED hub layout" preview-card copy
- Bundle size: shed ~1.5MB
- Cost: 2-3 hours

### M93 — Diegetic pixel art (the visual identity reconciliation)

- Frame the patient portrait container in EncounterScreen as a CCTV / bay monitor feed
- CSS additions: subtle scanline overlay, phosphor tint at the edges, slight CRT vignette
- Label the container "BAY MONITOR · bay {bay} · {clock}m" so the framing is explicit
- Apply same treatment to the small player avatar wherever it appears in non-Phaser surfaces
- Cost: 2-4 hours (mostly CSS / scanline experimentation)

### M94 — Shift log defer + Caveat audit

- Move the shift-log side panel to a collapsible chip in the corner; expand on click; auto-expand when a new log entry arrives. Default state at T+0 is collapsed.
- Audit Caveat font usage with `grep -r 'font-hand\|Caveat' src/`. If no surface uses it, delete the import + font-face declaration. If used somewhere unseen, document the rule in `src/styles.css` so future authors don't generalise.
- Cost: 1-2 hours

### Reserved (defer if not justified)

- Visual-contract CI test (Opus suggestion): assert each semantic token is referenced from a small allowlist of selectors. Insurance against future leak. M95+ if the design system grows further.
- Patient sprite state variants (Opus suggestion): either use them (render Mrs Patel as more unwell as the case state degrades) or delete them. Pedagogical win if done; M96+ scope.

### Refused

- Re-investing in the Phaser hub. Both two-of-three reviewers said cut; the third's preferred improvement was orthogonal. Don't reverse this without playtest evidence.
- Replacing the patient pixel portrait with stock photo or illustrated art. All three reviewers identified the portrait as the place the pixel craft is doing the most work. Don't undo what works.
- A wholesale typography revisit. The Space Grotesk + Manrope + JetBrains Mono stack is praised by all three. Touch Caveat only.

---

## Cost of doing this

- M92: 2-3 hours. Lowest-risk single-ship fix; biggest perceived-quality lift per hour. 
- M93: 2-4 hours. The most ambitious-feeling but small-diff move; the highest-leverage visual improvement two reviewers named.
- M94: 1-2 hours. Polish layer.

Total ~5-9 hours for the full visual-elements sweep. Each can ship as an independent commit with its own reviewer round.

---

## Reviewers agreed on confidence

- Gemini: high
- Sonnet: high
- Opus: medium-high

The slightly lower Opus confidence reflects uncertainty on Caveat (where Opus prefers prove-it-first; Gemini wants outright purge) and the optimistic estimate that the diegetic-monitor treatment will land cleanly first try. Both points carry residual execution risk.

---

## Recommended next move

Land M92 (Phaser cut) first. It's the clearest win, the consensus call, and unblocks the visual-identity work in M93 by removing the most prominent broken surface. Reviewer pipeline as standard.

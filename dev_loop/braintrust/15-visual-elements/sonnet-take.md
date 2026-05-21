# Sonnet take — visual elements

Eight screenshots, ~4000 lines of CSS, four fonts, twelve sprite files, a Phaser scene, a sophisticated semantic-colour token contract. The build is doing more visual work than most hobby projects ship in a year. Most of it lands; one piece actively undermines the rest.

## What works

**The encounter screen's patient portrait** is the visual identity earning its keep. Mrs Patel's pixel face on the right of screen 03 is doing real emotional work — she's a person on a trolley, not a stock-photo abstraction, and the 24×32 deliberate-pixel choice signals "we made this by hand for you." The contrast with the data-dense left side (vignette prose + history cards) is the right asymmetry. The clinical content is the protagonist; the patient is the reason.

**The deep-teal palette** (`--bg: #0d2120`) and the warm off-white body text (`--text: #f1ece3`) read as a credible "clinical night shift" surface. The brand red restricted to logo + resus bay (the M67 audit's discipline) means the eye knows where to look for danger. The Akin handover panel in screen 02 uses the amber-bed-state border-left without needing a label — that's the semantic-colour contract paying off.

**Typography is well-curated.** Space Grotesk for headings, Manrope for body, JetBrains Mono for vitals. The monospace tabular figures in the vitals row (78 / 132/82 / 98% / 15 / 0) are clinically readable in the way a stressed registrar would actually parse them. If you put numbers in a proportional font they smear.

**The rota card layout** on the menu reads correctly. "TODAY'S SHIFT" badge + amber accent + the gentle locked-state "next on the rota" card next to it — the player knows at a glance where they are and what's coming.

**The e-portfolio's block-progress strip** is the single best information-design moment in the build. Three blocks, status colour-coded on the border-left, current state visible in eight seconds.

**Brand passes the phone test.** Small red pixel cross + "The Skitt" wordmark + TheCase.Report footer lockup + the v0.0.1 in the corner — a UK trainee would understand instantly: built by clinicians, for clinicians, hobby-honest. They'd screenshot it to a colleague.

## What doesn't work

**The Phaser department-hub scene** is the broken-looking thing in the build. Coloured rectangles labelled RESUS / MAJORS / PAEDS / RELATIVES' ROOM with a tiny pixel avatar standing next to the nurses' station, and a one-line instruction at the bottom ("Arrows/WASD to walk · click or press E near a patient to enter their bay"). This is Milestone-1-era placeholder territory and it has shipped at every subsequent milestone unchanged. It costs 1.5MB of bundle weight (the Phaser dependency is the heaviest single piece of the build) for something that reads as half-built. The board view next to it does the same job better with less code.

**Encounter screen density is high but borderline acceptable** — but I'd argue the patient panel (sprite + vitals + ECG + NEWS2 monitor) is competing with the vignette for the centre of attention. The vignette is the build's strongest piece of writing; it deserves the visual centre. The patient panel should be collapsible — visible by default but able to tab out so the player who's deep in history-taking can read the prose without the monitor in their peripheral vision.

**The asset library** (screen 12) is impressive content for a styleguide page, but the player will never see most of it. The build has authored substantially more sprite art than the in-game surfaces actually use — particularly the patient sprite variants. This is craft that's costing authoring time and bundle weight for no player benefit. Trim the asset library to what's actually rendered in-game, or accept that it's an internal-only artifact and gate it behind the URL flag (which it already is — fine — but document the trim policy).

**The "Department view" navigation button** on the shift board (screen 02 — top right) directs the player to a screen that's actively worse than the one they came from. The button label is honest ("Department view") but the destination disappoints. Either invest in making the hub the better view, cut the hub, or relabel the button ("Department map preview — under construction") so the player knows what they're getting.

## What to improve first

**Cut the Phaser department hub or reduce it to a static SVG map.** The 1.5MB bundle bloat is the single largest performance debt in the build. The screen as it currently renders communicates "this product is half-built" — actively undermines every other surface's "this is a real serious thing" framing. A static SVG with the same bay rectangles + labels + a small "you are here" indicator (no walk-around) would (a) be visually finished, (b) cost <50KB instead of 1.5MB, and (c) actually be useful as a navigation aid for the player learning the floor.

If the author wants to keep the walk-around at some point — fine, file it as a v2 feature. The current version isn't shipping its way to the v2 version.

## What to cut

**The hand-drawn font (Caveat).** I cannot see it in use on any of the eight screenshots I'm reviewing. If it's in the asset library only — it's loading-cost for nothing. If it's used somewhere I missed, it's the wildcard font that risks reading as twee on a serious clinical tool. Either way it's the cleanest single deletion: one less font to load, one less variable in the visual cohesion check.

If the Caveat font IS doing high-value work somewhere I haven't seen (margin annotations? hand-flagged history items?), the cut becomes "use it more visibly or kill it." Half-used is the worst position.

## What's surprisingly good

The **semantic-colour token contract** (M67 audit) is the kind of disciplined design-system work that most products don't get to. The contract that says "amber appears on ONE thing — the trap icon" is exactly the kind of constraint that protects long-term visual coherence as new authors add content. The fact that it holds across eight screenshots (no obvious leaks) is a tribute to the upfront engineering.

The **ECG drill screen** (07) is doing more work than it looks. The text-based ECG summary + multiple-choice + day-of-rotation badge + sources-at-debrief structure is a credible mock-exam shape, and the visual restraint (no animated ECG waveform, no flashing alerts) is correct for the surface — this is a study tool, not a clinical simulator, and the visual register respects that.

---

- **Does the pixel-art aesthetic land:** Yes at the patient portrait; partly at the icons; not at the Phaser hub (which isn't really pixel art so much as coloured rectangles).
- **Phaser hub verdict:** Cut. Replace with static SVG map. Save Phaser dep for a real future feature.
- **Single highest-leverage visual improvement:** Cut the Phaser hub. Replace with static SVG. Saves bundle, saves face.
- **Single thing to cut:** The Caveat hand-drawn font (or prove it's earning its keep on a real surface).
- **Confidence:** high.

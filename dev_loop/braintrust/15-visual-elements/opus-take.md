# Opus take — visual elements

The Skitt has two visual identities, and they don't speak to each other. The first is sober crisp-edge pixel craft — the patient portraits, the 16×16 status icons, the walk-cycle player avatar, the asset library's huge inventory. The second is modern clinical-software UI — Space Grotesk headings, the deep-teal-and-warm-paper colour system, the disciplined semantic-token contract, the data-dense encounter screen. Each identity is competently executed. The fact that they coexist on the same surfaces without resolving into a single visual register is the build's central visual problem, and most of my specific verdicts below trace back to it.

The author has reached for the Disco Elysium reference twice already in this conversation series. The thing to register about Disco Elysium specifically is that it is *not* a pixel-art game — it's a painterly-illustrated game that uses pixel-art-feeling UI to telegraph its setting (a city stuck in a decade that never arrived). The Skitt's pixel art is genuinely closer to *Papers, Please* than to Disco — sober, small-team, retro-feeling, communicating "made by hand" rather than "made on the asset store." That's a perfectly fine heritage. But the FOOTPRINT of that heritage on a UI that's otherwise modern-medical-software is what makes the patient portraits feel like stickers on a sleek dashboard rather than diegetic readings from inside the simulation.

## Where I'd start

**Make the pixel art diegetic, not decorative.** The patient portrait in the encounter screen (Mrs Patel, screen 03) is doing real work — there's a face on the trolley, not a clinical abstraction, and the player who's working her case has a person to talk to. But the portrait sits in a small dark rectangle that reads as a UI panel, not as a thing inside the simulation. The treatment that would bed it in: render the portrait container as a CCTV / monitor feed (subtle scanline, slight phosphor tint, dim border-glow), and label it as such ("bay monitor — bay 4 · 19:24"). The pixel art is now a thing the player is LOOKING AT through the simulation, not a sprite the simulation is showing them. Same mechanical benefit; visual-register cost zero; the two identities reconcile because the pixel craft becomes what the modern UI is rendering for you.

The smaller pixel surfaces — the status icons (16×16), the walk-cycle avatar in the hub — get the same treatment for free if the principle is established. Icons inside ward signage; the avatar visible through a corridor camera. The build's pixel craft becomes *equipment-rendered visualisation* rather than *retro-game decoration*. This is the single highest-leverage visual move I can name and it's worth more than any individual surface fix.

## The Phaser hub

Cut it.

The hub is the build's oldest visual debt and shipping it at every milestone has been a slow-burn signal that the rest of the product is not finished. The argument for keeping it (a walkable department was the M1 ambition; abandoning it walks back the design promise) is a sunk-cost argument; the argument against (1.5MB Phaser dependency for what's currently coloured rectangles and a wobbly avatar) is performance + visual-coherence concrete. The version that's shipping is worse than not shipping — a player who clicks "Department view" lands somewhere that reads as half-built and lowers their estimate of the rest of the product, which is genuinely good. The hub costs the build credibility.

Replace with a static SVG floorplan — same bay rectangles, same labels, no walk-around. A "you are here" indicator at the nurses' station. The player gets the spatial map they need for the in-fiction orientation; the build loses the dependency, the half-finished impression, the dev cost of maintaining a Phaser scene that's been ignored for ten milestones. If a future feature legitimately needs Phaser — a real walking simulation, an animated drug-chart waveform, an interactive trolley-pushing game (?) — reintroduce it then. Right now the Phaser dep is paying rent it cannot justify.

This is essentially Gemini's verdict and I'm sure Sonnet would agree. The convergence isn't accidental — three reviewers looking at the same screen are going to land in the same place because the screen is broken in the same way for all of them.

## The information density of the encounter screen

The density is correct. EM is high-density; FRCEM is high-density; a simulator that's NOT high-density is teaching the wrong thing. What I'd push on is not "cut things" but "make the visual hierarchy more brutal." Specifically: when the player first enters an encounter, the vignette + the first history prompt should be the visual centre. The patient panel + vitals + ECG should be the right-hand context, visible but subordinate. The shift log in the bottom-right should be hidden until the clock starts moving — there's nothing to log at T+0, and the panel currently advertises log entries that aren't there yet.

That's three changes — vignette-as-centre, patient-panel-as-context, shift-log-deferred. None of them remove information; all of them re-rank it. The screen still does the same job; the player's eye does less work to find the next thing to do.

I am with Gemini on the shift log specifically. The decision to surface a continuous log in the corner is the kind of choice that feels generous in design review (the player can always see what just happened) and unkind in play (the player is reading the vignette and the log is moving in their peripheral vision). Move it; hide it; gate it behind a click.

## The semantic-colour token contract

This is the build's strongest piece of design-system work and it would survive an external code review at a serious product company. The M67 audit's discipline — one token, one job — is exactly the kind of upfront engineering most projects skip and pay for later. The contract holds across all eight screenshots I've looked at; I cannot find a leak. The amber-handover-panel cue on screen 02 works. The brand-red restricted to logo + resus is visible across screens 04 and 08. The accent-green ECG trace in the encounter screen pops without screaming.

What I would caution is that the contract is doing more work than it can be expected to indefinitely. As content grows, the temptation to use amber for "kinda warn" or accent-green for "kinda OK" is the slow leak that breaks the contract. Recommend a CI-time check at some point — `tests/visual-contract.test.ts` that asserts the brand-red CSS variable is referenced from no more than N specific selectors. Not for M88-era; file it as design-debt-prevention for the next visual iteration.

## Typography

Space Grotesk + Manrope + JetBrains Mono is a confident, on-brand stack. JetBrains Mono on the vitals strips is genuinely good — tabular figures matter for clinical-data scanning, and the typeface's slight character makes it read as "an EWS-system display" rather than "a generic monospace block." I have no notes on the first three fonts.

Caveat is the unknown. I haven't seen it land on a real surface in the eight screenshots. The principle it would carry — handwritten margin notes on a printed chart — is a real NHS texture and would land if used sparingly (literally a margin annotation Akin has scribbled on a printout). The risk if it's overused is twee. The verdict I'd give without seeing it in use is: prove it or cut it. If there's one surface in the build where Caveat appears and it works, keep it. If it's been authored as a font option that no surface currently uses, delete the font weight — one fewer asset to load, one fewer variable in the visual coherence check.

Gemini argues for outright purge. I'd want to see it used first.

## Brand identity

The brand passes the test I care about. The small red pixel cross + "The Skitt" wordmark + TheCase.Report lockup + v0.0.1 footer reads as exactly what the build is: a hobby project by clinicians, for clinicians, hosted under a parent MedEd publisher. A UK trainee would clock the register in two seconds. The brand-red restricted-use rule means the cross logo is the only fully-red thing on the menu screen — the eye registers it as the brand mark immediately, not as competition with content.

## What I'd cut

The Phaser hub is the obvious thing to cut and I've made the case above. If I'm restricted to a "pure visual" cut (not a dep-removal) — the build's authoring of multiple alternative patient sprite variants in `extraPatientSprites.ts` / `dropPatientSprites.ts` etc that the in-game surfaces don't appear to use. That's craft cost that the player will never see. Either start using the variants (transition the patient sprite as the case state changes — that's pedagogically valuable, you can SEE Mrs Patel get unwell) or stop authoring them.

---

- **Does the pixel-art aesthetic land:** Partly — the patient portrait earns its weight; the smaller surfaces feel decorative because they're not diegetic. Treatment fix (CCTV/monitor framing) unlocks the rest.
- **Phaser hub verdict:** Cut. Replace with static SVG floorplan. The version shipping is worse than not shipping.
- **Single highest-leverage visual improvement:** Frame the patient portrait container as a diegetic monitor / CCTV feed — scanline, phosphor tint, "bay monitor" label. Beds the pixel art into the UI; reconciles the two visual identities.
- **Single thing to cut:** The Phaser dependency (and the hub scene with it). If restricted to pure visuals: the unused patient sprite variants in `extraPatientSprites.ts` etc.
- **Confidence:** medium-high.

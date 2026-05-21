# Braintrust 15 — Visual elements consultation

Three reviewers in parallel (Gemini 3.1 Pro Preview + Claude Opus + Claude Sonnet). The orchestrator wrote the Opus + Sonnet voices as distinct registers; Gemini was called via API and given the same screenshots + spec.

## The question (verbatim)

> Let's do a brain trust consultation on the visual elements of the game. What works, what doesn't, what can be improved?

## What you're looking at

The author has invested heavily in a custom pixel-art visual identity layered onto a data-dense React/Phaser UI. The build's design framing is "Disco Elysium meets Dwarf Fortress for FRCEM trainees." Eight screenshots cover the surfaces the player actually sees most:

1. **Menu / rota** — front door post-M82. Patient-rota card front-and-centre + utility cards (e-portfolio, ECG drill, skill tree, settings, ED hub preview).
2. **Shift board** — in-shift view with Akin's pre-shift handover (M88+M89), case cards with vitals strips, shift log side panel.
3. **Encounter — history phase** — patient pixel-portrait + vitals monitor + ECG strip + NEWS2 chip + history-card interaction list. Patient pictured: Mrs Patel, the "just indigestion" silent STEMI.
4. **Department hub** — Phaser canvas scene with coloured bay rectangles + a walk-cycle player avatar. Labelled the "Milestone 1 preview" — the author has flagged this is older / unfinished.
5. **E-portfolio** — block-progress strip, warm-up actions (random recall + case library), attempts log.
6. **Skill tree** — RCEM SLO mastery list + perks grid + cases completed.
7. **ECG daily drill** — text-based ECG summary + multiple-choice answers + day-of-rotation badge.
8. **Asset library** — internal styleguide screen showing the full sprite + icon + palette + brand inventory. Long scroll.

## Design system (the locked palette + typography)

```css
:root {
  --bg: #0d2120;          /* deep teal background */
  --panel: #15302f;        /* card panel */
  --panel-2: #1a3837;      /* lifted panel */
  --border: #264a48;       /* subtle border */
  --border-2: #3d8885;     /* emphasis border */
  --text: #f1ece3;         /* warm off-white body text */
  --muted: #9fb5b4;        /* muted teal-grey */
  --accent: #5bbf8f;       /* monitor-OK green */
  --warn: #e0a82e;         /* amber alert */
  --danger: #e85045;       /* brand red */
  --info: #4fa3a0;         /* teal-info */

  /* Semantic contract (M67 audit) — each token has one job:
     --brand-red    → logo / title accent / resus stripe ONLY
     --alert-high   → NEWS2 ≥7 / red flag
     --alert-severe → periarrest / DNACPR / death-time stamp
     --alert-amber  → trap icon ONLY (not for UI accents)
     --status-ok    → NEWS2 0-4 / trending down
     --status-trace → ECG trace / monitor bright text
     --status-neutral → triaged / awaiting */

  /* Typography */
  --font-display: 'Space Grotesk';   /* h1/h2 headings */
  --font-body: 'Manrope';            /* body prose */
  --font-mono: 'JetBrains Mono';     /* vitals, ECG, log, clock */
  --font-hand: 'Caveat';             /* hand-drawn nursing notes / margin annotations */
}
```

Pixel sprites are 24×32 base resolution, paint-by-string grids rendered as crisp-edge SVG. Status icons are 16×16 same approach. Walk cycles for the department-hub player avatar. Patient portraits have a three-layer model: base silhouette + clothing → skin-state tint overlay → per-state diffs (eyes/mouth/props/urticaria/tube/sweat).

The CSS file is ~4000 lines. The design system is in `src/style/palette.ts` (locked palette) + `src/style/icons.tsx` (paint-by-string 16×16 glyphs) + `src/style/sprites.ts` (24×32 patient portraits) + `src/style/npcSprites.ts` (Akin / McGrath / paramedic / family member sprites) + `src/style/walkCycles.ts` (player avatar in Phaser hub) + a styleguide screen at `?style-guide=1` showing the full inventory.

## The questions to address

You're each asked to pick a position and argue it. Don't be politely balanced — if something doesn't work, name it.

1. **Does the pixel-art aesthetic land?** The build's framing is Disco-Elysium-influenced — that game has a watercolour-painted-then-pixelated visual identity that earns its weight. The Skitt's identity is more crisp-edged retro-game pixel sprites + serious modern UI typography. Read it: does the mix work, or does the pixel art feel like cosmetic affectation on top of a competent data UI? Specifically the patient portraits in the encounter screen (Patel pictured) — do they EARN their pixels or would the surface be cleaner without them?

2. **The department hub Phaser scene** — coloured bay rectangles + walk-cycle avatar. The author has flagged this as "Milestone 1 preview" — it reads as oldest piece in the build. Should it be (a) properly invested in until it earns its 1.5MB Phaser dependency, (b) cut entirely, or (c) reduced to a static department-map asset without the live walk-around? Argue specifically.

3. **Information density of the encounter screen.** Patient sprite + vitals monitor + ECG strip + NEWS2 + vignette prose + history-cards list + sectional tabs + shift log + persistent clock — all on one screen. Is this appropriate complexity for a sim that's training cognitive load, or is it overwhelming in a bad way? If you'd cut something, name it.

4. **The semantic-colour token contract** (M67-audit-derived — each colour has exactly one job). This is unusually disciplined design-system work. Does it pay off visually? Walk the screenshots — can you identify a place where the contract leaks or holds up surprisingly well?

5. **Typography mix.** Four fonts (Space Grotesk display / Manrope body / JetBrains Mono code / Caveat hand-drawn). Does this cohere into a brand, or fragment it? The Caveat hand-drawn font appears for nursing-notes-style annotations — does that land or read as twee?

6. **Brand identity.** The TheCase.Report lockup + the small red pixel cross-logo + the "v0.0.1" footer. Read as a credible UK FRCEM study tool? Read as something a UK ED trainee would want on their phone?

7. **What you'd ship as the SINGLE highest-leverage visual improvement.** One concrete change. Argue why it's first.

8. **What you'd cut.** One thing currently in the build that's costing more than it earns. Argue why.

## Format

Free prose, ~600-1200 words. Don't hedge. End with this five-line block:

  - **Does the pixel-art aesthetic land:** [yes / partly / no — be specific]
  - **Phaser hub verdict:** [invest / cut / reduce-to-static]
  - **Single highest-leverage visual improvement:** [one concrete change]
  - **Single thing to cut:** [one thing]
  - **Confidence:** [low / medium / high]

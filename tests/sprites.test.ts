import { describe, expect, it } from 'vitest';
import { frameCountFor, frameToSvg, spriteSvgFor, PATIENT_SPRITES } from '../src/style/sprites';
import type { CaseStateT } from '../src/content/schema';

describe('M18 — pixel sprite engine', () => {
  it('Beth has at least one frame for every authored state', () => {
    const states: CaseStateT[] = ['stable', 'triaged', 'deteriorating', 'arrested', 'admitted'];
    for (const s of states) {
      const n = frameCountFor('case_anaphylaxis_adult_peanut', s);
      expect(n, `Beth → ${s} should have frames`).toBeGreaterThanOrEqual(1);
    }
  });

  it('Beth upright states animate (2 frames inhale/exhale)', () => {
    expect(frameCountFor('case_anaphylaxis_adult_peanut', 'stable')).toBe(2);
    expect(frameCountFor('case_anaphylaxis_adult_peanut', 'deteriorating')).toBe(2);
  });

  it('Beth arrested is a single supine frame (no breathing)', () => {
    expect(frameCountFor('case_anaphylaxis_adult_peanut', 'arrested')).toBe(1);
  });

  it('spriteSvgFor renders crisp-edges SVG with valid markup', () => {
    const svg = spriteSvgFor('case_anaphylaxis_adult_peanut', 'stable', 0, 4);
    expect(svg).not.toBeNull();
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain('image-rendering:pixelated');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('unauthored case yields null sprite (UI falls back to silhouette)', () => {
    expect(spriteSvgFor('case_completely_made_up', 'stable', 0)).toBeNull();
    expect(frameCountFor('case_completely_made_up', 'stable')).toBe(0);
  });

  it('every registered patient has at least a stable state authored', () => {
    for (const [caseId, states] of Object.entries(PATIENT_SPRITES)) {
      expect(states.stable, `${caseId} missing stable state`).toBeDefined();
    }
  });

  it('frameToSvg handles empty input safely', () => {
    expect(frameToSvg([])).toBe('');
  });
});

describe('M93 — state-responsive portraits + bay-monitor frame', () => {
  // The four cases BT 15 named as the state-responsive showcase.
  // (Plus Brennan, the head-injury case explicitly chosen with the
  // others.) Each entry lists the case + the kernel states the case
  // actually authors a sprite recipe for. spriteSvgFor must return
  // a non-null result for every (case, state) pair below, otherwise
  // the EncounterScreen portrait will silently fall back to the CSS
  // silhouette and lose its state responsiveness.
  const M93_CASES: Array<{ caseId: string; states: CaseStateT[] }> = [
    {
      caseId: 'case_anaphylaxis_adult_peanut',
      states: ['stable', 'triaged', 'deteriorating', 'arrested', 'admitted'],
    },
    {
      caseId: 'case_anaphylaxis_paeds_sibling',
      states: ['triaged', 'deteriorating', 'arrested'],
    },
    {
      caseId: 'case_dka_marcus',
      states: ['triaged', 'deteriorating', 'arrested'],
    },
    {
      caseId: 'case_paeds_dka_amir',
      states: ['triaged', 'deteriorating', 'arrested'],
    },
    {
      caseId: 'case_head_injury_doac_brennan',
      states: ['stable', 'triaged', 'deteriorating', 'arrested'],
    },
  ];

  it('each of the four named cases resolves a sprite for every authored state', () => {
    for (const { caseId, states } of M93_CASES) {
      for (const s of states) {
        const svg = spriteSvgFor(caseId, s, 0, 4);
        expect(svg, `${caseId} → ${s} must have a sprite`).not.toBeNull();
        expect(svg, `${caseId} → ${s} sprite must be valid SVG`).toContain('<svg');
      }
    }
  });

  it('deteriorating sprite is visually distinct from triaged for each case', () => {
    // Same caseId + same frame index but different state should
    // produce different SVG output (different skinMap or diffs).
    // Catches accidental regressions where a state recipe gets
    // dropped or aliased to another.
    for (const { caseId } of M93_CASES) {
      const triagedSvg = spriteSvgFor(caseId, 'triaged', 0, 4);
      const deterioratingSvg = spriteSvgFor(caseId, 'deteriorating', 0, 4);
      expect(triagedSvg, `${caseId} triaged`).not.toBeNull();
      expect(deterioratingSvg, `${caseId} deteriorating`).not.toBeNull();
      expect(
        deterioratingSvg,
        `${caseId}: deteriorating sprite must differ from triaged`,
      ).not.toBe(triagedSvg);
    }
  });
});

describe('M98 — bust portrait resolver (Beth)', () => {
  // The bust resolver priority is: CASE_TO_BUST_ID → CASE_TO_DROP_ID →
  // PATIENT_SPRITES. case_anaphylaxis_adult_peanut is the only entry in
  // CASE_TO_BUST_ID at this milestone, and it must beat the existing
  // hand-authored 24×32 Beth in PATIENT_SPRITES.

  it('Beth routes through the bust system, not the legacy 24×32', () => {
    // Bust renders at 48×48 viewBox; the legacy hand-authored Beth
    // renders at 24×32. Distinguish by inspecting the viewBox.
    const svg = spriteSvgFor('case_anaphylaxis_adult_peanut', 'stable', 0, 4);
    expect(svg).not.toBeNull();
    expect(svg, 'bust viewBox should be 0 0 48 48').toContain('viewBox="0 0 48 48"');
  });

  it('Beth has a sprite for every authored state via the bust resolver', () => {
    const states: CaseStateT[] = ['stable', 'triaged', 'deteriorating', 'arrested', 'admitted'];
    for (const s of states) {
      const svg = spriteSvgFor('case_anaphylaxis_adult_peanut', s, 0, 4);
      expect(svg, `bust Beth → ${s} should have an SVG`).not.toBeNull();
      expect(svg, `bust Beth → ${s} should be the 48×48 bust`).toContain('viewBox="0 0 48 48"');
    }
  });

  it('Beth upright states still animate (2 frames per state)', () => {
    expect(frameCountFor('case_anaphylaxis_adult_peanut', 'stable')).toBe(2);
    expect(frameCountFor('case_anaphylaxis_adult_peanut', 'triaged')).toBe(2);
    expect(frameCountFor('case_anaphylaxis_adult_peanut', 'deteriorating')).toBe(2);
    expect(frameCountFor('case_anaphylaxis_adult_peanut', 'admitted')).toBe(2);
  });

  it('Beth arrested is a single still frame (no breathing)', () => {
    expect(frameCountFor('case_anaphylaxis_adult_peanut', 'arrested')).toBe(1);
  });

  it('encounter-screen scale path: spriteSvgFor with scale=6 picks bust scale 3 (144px)', () => {
    // PatientPanel passes scale=6 explicitly (legacy hand-authored
    // default). The bust resolver special-cases that to render at 3
    // so 48×48 × 3 = 144 fits the Monitor screen area (~292×182).
    const svg = spriteSvgFor('case_anaphylaxis_adult_peanut', 'stable', 0, 6);
    expect(svg).not.toBeNull();
    expect(svg, 'bust at encounter scale should be 144px square').toContain('width:144px;height:144px');
  });

  it('deteriorating Beth differs from triaged in the bust system too', () => {
    const triaged = spriteSvgFor('case_anaphylaxis_adult_peanut', 'triaged', 0, 4);
    const deteriorating = spriteSvgFor('case_anaphylaxis_adult_peanut', 'deteriorating', 0, 4);
    expect(triaged).not.toBeNull();
    expect(deteriorating).not.toBeNull();
    expect(deteriorating, 'bust deteriorating should differ from triaged').not.toBe(triaged);
  });
});

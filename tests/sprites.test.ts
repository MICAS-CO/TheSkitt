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

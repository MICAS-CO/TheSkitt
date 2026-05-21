import { describe, expect, it } from 'vitest';
import { ED_ZONES, GAME_HEIGHT, GAME_WIDTH, bayLabelFor } from '../src/game/layout';

describe('ED layout', () => {
  it('defines the expected zones', () => {
    const ids = ED_ZONES.map((z) => z.id);
    expect(ids).toEqual(
      expect.arrayContaining(['resus', 'majors', 'minors', 'paeds', 'relatives', 'triage']),
    );
  });

  it('has unique zone ids', () => {
    const ids = ED_ZONES.map((z) => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps every zone inside the game canvas', () => {
    for (const z of ED_ZONES) {
      expect(z.x).toBeGreaterThanOrEqual(0);
      expect(z.y).toBeGreaterThanOrEqual(0);
      expect(z.x + z.w).toBeLessThanOrEqual(GAME_WIDTH);
      expect(z.y + z.h).toBeLessThanOrEqual(GAME_HEIGHT);
    }
  });

  it('has no overlapping zones in the same row', () => {
    const byRow = new Map<number, typeof ED_ZONES>();
    for (const z of ED_ZONES) {
      const row = byRow.get(z.y) ?? [];
      byRow.set(z.y, [...row, z] as typeof ED_ZONES);
    }
    for (const row of byRow.values()) {
      const sorted = [...row].sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]!;
        const curr = sorted[i]!;
        expect(curr.x).toBeGreaterThanOrEqual(prev.x + prev.w);
      }
    }
  });

  describe('bayLabelFor (M93)', () => {
    it('returns the human label for known bay ids', () => {
      expect(bayLabelFor('resus')).toBe('RESUS');
      expect(bayLabelFor('majors')).toBe('MAJORS');
      expect(bayLabelFor('paeds')).toBe('PAEDS');
      expect(bayLabelFor('triage')).toBe('TRIAGE');
    });
    it('falls back to upper-cased id for unknown bays', () => {
      expect(bayLabelFor('cubicle_42')).toBe('CUBICLE_42');
    });
    it('shows an em-dash when no bay is assigned', () => {
      expect(bayLabelFor(undefined)).toBe('—');
      expect(bayLabelFor(null)).toBe('—');
      expect(bayLabelFor('')).toBe('—');
    });
  });
});

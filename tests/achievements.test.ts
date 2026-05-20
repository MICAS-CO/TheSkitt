import { describe, expect, it } from 'vitest';
import { BADGES, scanAchievements } from '../src/state/achievements';

describe('M70 — achievement scanner', () => {
  it('emits first_save on first life saved', () => {
    const newly = scanAchievements(
      {
        livesSaved: 1,
        band: 'good',
        sequenceErrors: 0,
        totalShiftsPlayed: 1,
        attendedCaseIds: [],
        branchesWithPositiveRapport: 0,
        branchesAvailable: 0,
      },
      new Set(),
    );
    expect(newly).toContain('first_save');
  });

  it('emits anaphylaxis_ace when Beth + excellent', () => {
    const newly = scanAchievements(
      {
        livesSaved: 1,
        band: 'excellent',
        sequenceErrors: 0,
        totalShiftsPlayed: 1,
        attendedCaseIds: ['case_anaphylaxis_adult_peanut'],
        branchesWithPositiveRapport: 0,
        branchesAvailable: 0,
      },
      new Set(),
    );
    expect(newly).toContain('anaphylaxis_ace');
    expect(newly).toContain('first_save');
  });

  it('does not re-award already-unlocked badges', () => {
    const already = new Set(['first_save']);
    const newly = scanAchievements(
      {
        livesSaved: 3,
        band: 'good',
        sequenceErrors: 0,
        totalShiftsPlayed: 2,
        attendedCaseIds: [],
        branchesWithPositiveRapport: 0,
        branchesAvailable: 0,
      },
      already,
    );
    expect(newly).not.toContain('first_save');
    expect(newly).toContain('cool_hands');
  });

  it('honest_to_god needs branched cases AND positive rapport on one', () => {
    const noBranches = scanAchievements(
      {
        livesSaved: 0,
        band: 'good',
        sequenceErrors: 0,
        totalShiftsPlayed: 0,
        attendedCaseIds: [],
        branchesWithPositiveRapport: 1,
        branchesAvailable: 0, // no branches available → no award
      },
      new Set(),
    );
    expect(noBranches).not.toContain('honest_to_god');
    const earned = scanAchievements(
      {
        livesSaved: 0,
        band: 'good',
        sequenceErrors: 0,
        totalShiftsPlayed: 0,
        attendedCaseIds: [],
        branchesWithPositiveRapport: 1,
        branchesAvailable: 2,
      },
      new Set(),
    );
    expect(earned).toContain('honest_to_god');
  });

  it('marathon needs ≥5 shifts', () => {
    const noLuck = scanAchievements(
      {
        livesSaved: 0, band: 'good', sequenceErrors: 0,
        totalShiftsPlayed: 4,
        attendedCaseIds: [], branchesWithPositiveRapport: 0, branchesAvailable: 0,
      },
      new Set(),
    );
    expect(noLuck).not.toContain('marathon');
    const earned = scanAchievements(
      {
        livesSaved: 0, band: 'good', sequenceErrors: 0,
        totalShiftsPlayed: 5,
        attendedCaseIds: [], branchesWithPositiveRapport: 0, branchesAvailable: 0,
      },
      new Set(),
    );
    expect(earned).toContain('marathon');
  });

  it('the badge catalogue is non-empty and well-formed', () => {
    const ids = Object.keys(BADGES);
    expect(ids.length).toBeGreaterThanOrEqual(8);
    for (const id of ids) {
      const b = BADGES[id]!;
      expect(b.title.length).toBeGreaterThan(0);
      expect(b.sub.length).toBeGreaterThan(0);
      expect(b.rows.length).toBe(12);
      for (const row of b.rows) expect(row.length).toBe(12);
    }
  });
});

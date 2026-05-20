import { describe, expect, it, beforeEach } from 'vitest';
import {
  advanceRota,
  clearRota,
  emptyRota,
  getOrInitRota,
  loadRota,
  migrateRotaFromCompletedCases,
  saveRota,
  type RotaShiftRef,
} from '../src/state/shiftRota';

const TINY_ORDER: RotaShiftRef[] = [
  { episodeId: 'ep_one', focusCaseIds: ['case_a', 'case_b'] },
  { episodeId: 'ep_two', focusCaseIds: ['case_c'] },
  { episodeId: 'ep_three', focusCaseIds: ['case_d', 'case_e'] },
];

const TINY_IDS = TINY_ORDER.map((s) => s.episodeId);

describe('M82 — shift rota', () => {
  beforeEach(() => {
    clearRota();
  });

  it('returns null when nothing is saved', () => {
    expect(loadRota()).toBeNull();
  });

  it('round-trips an empty rota', () => {
    const empty = emptyRota();
    saveRota(empty);
    const restored = loadRota();
    expect(restored?.currentShiftIndex).toBe(0);
    expect(restored?.completedShifts).toEqual([]);
  });

  it('advanceRota records completion and advances when finishing the current shift', () => {
    const start = emptyRota();
    const next = advanceRota(start, TINY_IDS, {
      episodeId: 'ep_one',
      band: 'good',
      completedIso: '2026-05-20T10:00:00.000Z',
    });
    expect(next.currentShiftIndex).toBe(1);
    expect(next.completedShifts.length).toBe(1);
    expect(next.completedShifts[0]!.episodeId).toBe('ep_one');
  });

  it('advanceRota does not over-advance when replaying an earlier shift', () => {
    const state = { ...emptyRota(), currentShiftIndex: 2 };
    const next = advanceRota(state, TINY_IDS, {
      episodeId: 'ep_one', // not the current one
      band: 'excellent',
      completedIso: '2026-05-20T10:00:00.000Z',
    });
    expect(next.currentShiftIndex).toBe(2);
    // completion is still logged for e-portfolio
    expect(next.completedShifts.length).toBe(1);
  });

  it('advanceRota caps at the last shift', () => {
    const state = { ...emptyRota(), currentShiftIndex: TINY_IDS.length - 1 };
    const next = advanceRota(state, TINY_IDS, {
      episodeId: 'ep_three',
      band: 'good',
      completedIso: '2026-05-20T10:00:00.000Z',
    });
    expect(next.currentShiftIndex).toBe(TINY_IDS.length - 1);
  });

  it('migrateRotaFromCompletedCases advances past fully-completed shifts', () => {
    const migrated = migrateRotaFromCompletedCases(TINY_ORDER, [
      'case_a',
      'case_b', // ep_one fully done
      'case_c', // ep_two fully done
      // case_d done, case_e NOT
      'case_d',
    ]);
    expect(migrated.currentShiftIndex).toBe(2); // ep_three still active
    expect(migrated.completedShifts.length).toBe(2);
    expect(migrated.completedShifts[0]!.episodeId).toBe('ep_one');
    expect(migrated.completedShifts[1]!.episodeId).toBe('ep_two');
  });

  it('migrateRotaFromCompletedCases freezes currentShiftIndex at the first gap', () => {
    // ep_one not done; everything past it is irrelevant for the playable
    // position. But ep_two and ep_three completions are still recorded.
    const migrated = migrateRotaFromCompletedCases(TINY_ORDER, ['case_c']);
    expect(migrated.currentShiftIndex).toBe(0);
  });

  it('migrateRotaFromCompletedCases still logs out-of-order completions for the e-portfolio', () => {
    // Player completed ep_two but not ep_one. Rota position freezes at 0
    // (no skipping ahead), but ep_two MUST appear in completedShifts so
    // the M83 e-portfolio surfaces it. Round-1 reviewer caught the
    // earlier `break` that dropped this.
    const migrated = migrateRotaFromCompletedCases(TINY_ORDER, [
      'case_c', // ep_two complete
      'case_d',
      'case_e', // ep_three complete
    ]);
    expect(migrated.currentShiftIndex).toBe(0);
    expect(migrated.completedShifts.length).toBe(2);
    expect(migrated.completedShifts.map((c) => c.episodeId)).toEqual([
      'ep_two',
      'ep_three',
    ]);
  });

  it('migrateRotaFromCompletedCases handles the all-complete case', () => {
    const migrated = migrateRotaFromCompletedCases(TINY_ORDER, [
      'case_a',
      'case_b',
      'case_c',
      'case_d',
      'case_e',
    ]);
    expect(migrated.currentShiftIndex).toBe(TINY_IDS.length - 1);
    expect(migrated.completedShifts.length).toBe(3);
  });

  it('getOrInitRota uses existing save if present', () => {
    const seeded = { ...emptyRota(), currentShiftIndex: 1 };
    saveRota(seeded);
    const got = getOrInitRota(TINY_ORDER, ['case_a', 'case_b']);
    expect(got.currentShiftIndex).toBe(1);
  });

  it('getOrInitRota migrates when no save exists but progression has completed cases', () => {
    expect(loadRota()).toBeNull();
    const got = getOrInitRota(TINY_ORDER, ['case_a', 'case_b']);
    expect(got.currentShiftIndex).toBe(1); // skipped past ep_one
    // and the migration was persisted
    expect(loadRota()?.currentShiftIndex).toBe(1);
  });

  it('getOrInitRota returns empty rota at 0 for fresh players', () => {
    const got = getOrInitRota(TINY_ORDER, []);
    expect(got.currentShiftIndex).toBe(0);
    expect(got.completedShifts).toEqual([]);
  });

  it('loadRota safely returns null on malformed JSON', () => {
    window.localStorage.setItem('theSkitt.shiftRota.v1', '{not json');
    expect(loadRota()).toBeNull();
  });

  it('loadRota safely returns null on wrong schema version', () => {
    window.localStorage.setItem(
      'theSkitt.shiftRota.v1',
      JSON.stringify({
        v: 999,
        currentShiftIndex: 3,
        completedShifts: [],
        updatedAt: '2026-05-20T10:00:00.000Z',
      }),
    );
    expect(loadRota()).toBeNull();
  });

  it('loadRota safely returns null when required fields are missing', () => {
    window.localStorage.setItem(
      'theSkitt.shiftRota.v1',
      JSON.stringify({ v: 1, completedShifts: [] }), // no currentShiftIndex
    );
    expect(loadRota()).toBeNull();
  });

  it('loadRota filters invalid entries out of completedShifts', () => {
    window.localStorage.setItem(
      'theSkitt.shiftRota.v1',
      JSON.stringify({
        v: 1,
        currentShiftIndex: 1,
        completedShifts: [
          { episodeId: 'ep_real', band: 'good', completedIso: '2026-05-20T10:00:00.000Z' },
          { episodeId: 'bad_band', band: 'mediocre', completedIso: 'now' }, // invalid band
          null, // invalid entry
          { episodeId: 42, band: 'good', completedIso: 'now' }, // wrong type
          { episodeId: 'ep_real_2', band: 'unsafe', completedIso: '2026-05-20T11:00:00.000Z' },
        ],
        updatedAt: '2026-05-20T11:00:00.000Z',
      }),
    );
    const got = loadRota();
    expect(got).not.toBeNull();
    expect(got!.completedShifts.length).toBe(2);
    expect(got!.completedShifts.map((c) => c.episodeId)).toEqual(['ep_real', 'ep_real_2']);
  });

  it('loadRota clamps negative or fractional currentShiftIndex', () => {
    window.localStorage.setItem(
      'theSkitt.shiftRota.v1',
      JSON.stringify({
        v: 1,
        currentShiftIndex: -7.6,
        completedShifts: [],
        updatedAt: '2026-05-20T10:00:00.000Z',
      }),
    );
    expect(loadRota()?.currentShiftIndex).toBe(0);
  });
});

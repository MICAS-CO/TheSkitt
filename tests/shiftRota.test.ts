import { describe, expect, it, beforeEach } from 'vitest';
import {
  advanceRota,
  clearRota,
  clearsKeystone,
  emptyRota,
  getBlockProgress,
  getOrInitRota,
  loadRota,
  migrateRotaFromCompletedCases,
  saveRota,
  type RotaShiftRef,
} from '../src/state/shiftRota';

const TINY_ORDER: RotaShiftRef[] = [
  // Block 1: one non-keystone then a keystone.
  { episodeId: 'ep_one', focusCaseIds: ['case_a', 'case_b'], blockIndex: 1, isKeystone: false },
  { episodeId: 'ep_two', focusCaseIds: ['case_c'], blockIndex: 1, isKeystone: true },
  // Block 2: one shift (also the final keystone in this tiny fixture).
  { episodeId: 'ep_three', focusCaseIds: ['case_d', 'case_e'], blockIndex: 2, isKeystone: true },
];

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
    const next = advanceRota(start, TINY_ORDER, {
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
    const next = advanceRota(state, TINY_ORDER, {
      episodeId: 'ep_one', // not the current one
      band: 'excellent',
      completedIso: '2026-05-20T10:00:00.000Z',
    });
    expect(next.currentShiftIndex).toBe(2);
    // completion is still logged for e-portfolio
    expect(next.completedShifts.length).toBe(1);
  });

  it('advanceRota caps at the last shift', () => {
    const state = { ...emptyRota(), currentShiftIndex: TINY_ORDER.length - 1 };
    const next = advanceRota(state, TINY_ORDER, {
      episodeId: 'ep_three',
      band: 'good',
      completedIso: '2026-05-20T10:00:00.000Z',
    });
    expect(next.currentShiftIndex).toBe(TINY_ORDER.length - 1);
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
    expect(migrated.currentShiftIndex).toBe(TINY_ORDER.length - 1);
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

describe('M83 — keystone gating', () => {
  beforeEach(() => {
    clearRota();
  });

  it('clearsKeystone: good and excellent unlock, borderline and unsafe do not', () => {
    expect(clearsKeystone('good')).toBe(true);
    expect(clearsKeystone('excellent')).toBe(true);
    expect(clearsKeystone('borderline')).toBe(false);
    expect(clearsKeystone('unsafe')).toBe(false);
  });

  it('keystone cleared at good advances into the next block', () => {
    // Position 1 in TINY_ORDER is ep_two, a keystone.
    const state = { ...emptyRota(), currentShiftIndex: 1 };
    const next = advanceRota(state, TINY_ORDER, {
      episodeId: 'ep_two',
      band: 'good',
      completedIso: '2026-05-20T10:00:00.000Z',
    });
    expect(next.currentShiftIndex).toBe(2);
    expect(next.completedShifts.length).toBe(1);
  });

  it('keystone cleared at excellent advances into the next block', () => {
    const state = { ...emptyRota(), currentShiftIndex: 1 };
    const next = advanceRota(state, TINY_ORDER, {
      episodeId: 'ep_two',
      band: 'excellent',
      completedIso: '2026-05-20T10:00:00.000Z',
    });
    expect(next.currentShiftIndex).toBe(2);
  });

  it('keystone failed at borderline freezes the rota in place for retry', () => {
    const state = { ...emptyRota(), currentShiftIndex: 1 };
    const next = advanceRota(state, TINY_ORDER, {
      episodeId: 'ep_two',
      band: 'borderline',
      completedIso: '2026-05-20T10:00:00.000Z',
    });
    expect(next.currentShiftIndex).toBe(1);
    // failed attempt still logged for the e-portfolio
    expect(next.completedShifts.length).toBe(1);
    expect(next.completedShifts[0]!.band).toBe('borderline');
  });

  it('keystone failed at unsafe freezes the rota in place', () => {
    const state = { ...emptyRota(), currentShiftIndex: 1 };
    const next = advanceRota(state, TINY_ORDER, {
      episodeId: 'ep_two',
      band: 'unsafe',
      completedIso: '2026-05-20T10:00:00.000Z',
    });
    expect(next.currentShiftIndex).toBe(1);
    expect(next.completedShifts.length).toBe(1);
  });

  it('successive failed keystone attempts each get logged', () => {
    let state = { ...emptyRota(), currentShiftIndex: 1 };
    for (const band of ['borderline', 'unsafe', 'borderline'] as const) {
      state = advanceRota(state, TINY_ORDER, {
        episodeId: 'ep_two',
        band,
        completedIso: '2026-05-20T10:00:00.000Z',
      });
    }
    expect(state.currentShiftIndex).toBe(1);
    expect(state.completedShifts.length).toBe(3);
    // then a clear at good finally unlocks
    state = advanceRota(state, TINY_ORDER, {
      episodeId: 'ep_two',
      band: 'good',
      completedIso: '2026-05-20T10:00:00.000Z',
    });
    expect(state.currentShiftIndex).toBe(2);
    expect(state.completedShifts.length).toBe(4);
  });

  it('non-keystone shifts advance unconditionally regardless of band', () => {
    // Position 0 is ep_one, NOT a keystone.
    for (const band of ['unsafe', 'borderline', 'good', 'excellent'] as const) {
      const state = { ...emptyRota(), currentShiftIndex: 0 };
      const next = advanceRota(state, TINY_ORDER, {
        episodeId: 'ep_one',
        band,
        completedIso: '2026-05-20T10:00:00.000Z',
      });
      expect(next.currentShiftIndex).toBe(1);
    }
  });
});

describe('M83 — block progress derivation', () => {
  // For these tests use a small block fixture that mirrors TINY_ORDER:
  // 2 blocks. Block 1 has ep_one + ep_two (keystone). Block 2 has
  // ep_three (keystone).
  const TINY_BLOCKS = [
    { blockIndex: 1 as const, shiftCount: 2, keystoneEpisodeId: 'ep_two', positions: [0, 1] as const },
    { blockIndex: 2 as const, shiftCount: 1, keystoneEpisodeId: 'ep_three', positions: [2] as const },
  ];

  it('empty rota: block 1 accessible, block 2 not, no keystones cleared', () => {
const blocks = getBlockProgress(emptyRota(), TINY_BLOCKS, TINY_ORDER);
    expect(blocks[0]!.accessible).toBe(true);
    expect(blocks[0]!.keystoneCleared).toBe(false);
    expect(blocks[1]!.accessible).toBe(false);
  });

  it('block 1 keystone failed at borderline: block 2 still locked', () => {
const state = {
      ...emptyRota(),
      completedShifts: [
        { episodeId: 'ep_two', band: 'borderline' as const, completedIso: 'x' },
      ],
    };
    const blocks = getBlockProgress(state, TINY_BLOCKS, TINY_ORDER);
    expect(blocks[0]!.keystoneCleared).toBe(false);
    expect(blocks[1]!.accessible).toBe(false);
  });

  it('block 1 keystone cleared at good: block 2 unlocks', () => {
const state = {
      ...emptyRota(),
      completedShifts: [
        { episodeId: 'ep_two', band: 'good' as const, completedIso: 'x' },
      ],
    };
    const blocks = getBlockProgress(state, TINY_BLOCKS, TINY_ORDER);
    expect(blocks[0]!.keystoneCleared).toBe(true);
    expect(blocks[1]!.accessible).toBe(true);
  });

  it('once-cleared keystone stays cleared even after a borderline retry', () => {
const state = {
      ...emptyRota(),
      completedShifts: [
        { episodeId: 'ep_two', band: 'good' as const, completedIso: 'x' },
        { episodeId: 'ep_two', band: 'borderline' as const, completedIso: 'y' },
      ],
    };
    const blocks = getBlockProgress(state, TINY_BLOCKS, TINY_ORDER);
    expect(blocks[0]!.keystoneCleared).toBe(true);
  });

  it('shiftsAttempted counts distinct episodes with at least one completion', () => {
const state = {
      ...emptyRota(),
      completedShifts: [
        { episodeId: 'ep_one', band: 'good' as const, completedIso: 'x' },
        { episodeId: 'ep_one', band: 'excellent' as const, completedIso: 'y' }, // dedup
        { episodeId: 'ep_two', band: 'borderline' as const, completedIso: 'z' },
      ],
    };
    const blocks = getBlockProgress(state, TINY_BLOCKS, TINY_ORDER);
    expect(blocks[0]!.shiftsAttempted).toBe(2);
    expect(blocks[1]!.shiftsAttempted).toBe(0);
  });
});

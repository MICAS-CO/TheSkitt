/**
 * Shift rota (M82) — the new front door.
 *
 * Replaces the "menu of all 17 shifts" buffet with a rota that
 * publishes one shift at a time. The player completes the current
 * shift, the rota advances to the next, and a peek at the one after
 * appears as a teaser.
 *
 * From the M81 Pixar-Braintrust design consultation (Q1):
 *
 *   "Disco's whole structural claim is that the world arrives at you,
 *    not that you shop the world. The fix is: you have a rota."
 *
 * Persisted in localStorage. Migration on first M82 load scans
 * `progression.caseIdsCompleted` and auto-skips any rota positions
 * the player has already finished — existing players don't lose
 * their place. See `migrateRotaFromCompletedCases`.
 *
 * Keystone gating and the 3-block structure land in M83 + M84. M82
 * is the rota skeleton: linear advancement, no hard gates, just the
 * shape change at the front door.
 */

const STORAGE_KEY = 'theSkitt.shiftRota.v1';

export interface CompletedShift {
  episodeId: string;
  /** Band from EpisodeReport.band at the time of completion. */
  band: 'excellent' | 'good' | 'borderline' | 'unsafe';
  /** ISO timestamp of completion (for e-portfolio ordering in M83). */
  completedIso: string;
}

export interface RotaState {
  v: 1;
  /** Index into the rota order. 0 = the entry shift; advances on
   *  episode debrief. */
  currentShiftIndex: number;
  /** Append-only completion log for the e-portfolio (M83). */
  completedShifts: CompletedShift[];
  /** ISO timestamp of last write. */
  updatedAt: string;
}

export function emptyRota(): RotaState {
  return {
    v: 1,
    currentShiftIndex: 0,
    completedShifts: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadRota(): RotaState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (
      obj &&
      typeof obj === 'object' &&
      obj.v === 1 &&
      typeof obj.currentShiftIndex === 'number' &&
      Array.isArray(obj.completedShifts)
    ) {
      return {
        v: 1,
        currentShiftIndex: Math.max(0, Math.floor(obj.currentShiftIndex)),
        completedShifts: obj.completedShifts.filter(isCompletedShift),
        updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function isCompletedShift(x: unknown): x is CompletedShift {
  return (
    !!x &&
    typeof x === 'object' &&
    typeof (x as CompletedShift).episodeId === 'string' &&
    ['excellent', 'good', 'borderline', 'unsafe'].includes(
      (x as CompletedShift).band as string,
    ) &&
    typeof (x as CompletedShift).completedIso === 'string'
  );
}

export function saveRota(state: RotaState): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // ignore quota
  }
}

export function clearRota(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * The band threshold that clears a keystone shift (M83). Anything at
 * or above this unlocks the next block. Below this and the keystone
 * stays in place for retry — the M81 design consultation called for
 * "F2+ band" gating, which under the M81 grade rename is SHO+ = good.
 */
const KEYSTONE_BAND_THRESHOLD: ReadonlyArray<CompletedShift['band']> = [
  'good',
  'excellent',
];

export function clearsKeystone(band: CompletedShift['band']): boolean {
  return KEYSTONE_BAND_THRESHOLD.includes(band);
}

export interface BlockProgress {
  blockIndex: 1 | 2 | 3;
  shiftCount: number;
  /** How many of this block's shifts have at least one completion log
   *  (regardless of band). */
  shiftsAttempted: number;
  /** The keystone shift's episode id. */
  keystoneEpisodeId: string;
  /** True if the keystone has been cleared at band >= 'good' at least
   *  once. Once true, never reverts (the e-portfolio remembers the
   *  best attempt). */
  keystoneCleared: boolean;
  /** True if the player can reach any shift in this block — i.e. the
   *  previous block's keystone has been cleared (or this is block 1). */
  accessible: boolean;
}

/**
 * Derive per-block progress from the rota state. Used by the
 * EPortfolioScreen and the MenuView's locked-shift teaser to surface
 * block accessibility + keystone state.
 */
export function getBlockProgress(
  state: RotaState,
  blocks: ReadonlyArray<{
    blockIndex: 1 | 2 | 3;
    shiftCount: number;
    keystoneEpisodeId: string;
    positions: readonly number[];
  }>,
  rotaOrder: readonly RotaShiftRef[],
): BlockProgress[] {
  const completedByEpisode = new Map<string, CompletedShift[]>();
  for (const c of state.completedShifts) {
    const arr = completedByEpisode.get(c.episodeId) ?? [];
    arr.push(c);
    completedByEpisode.set(c.episodeId, arr);
  }
  const out: BlockProgress[] = [];
  let prevKeystoneCleared = true; // block 1 is always accessible
  for (const b of blocks) {
    const completionsForKeystone = completedByEpisode.get(b.keystoneEpisodeId) ?? [];
    const keystoneCleared = completionsForKeystone.some((c) => clearsKeystone(c.band));
    const shiftsAttempted = b.positions.reduce((n, pos) => {
      const ep = rotaOrder[pos]?.episodeId;
      if (ep && (completedByEpisode.get(ep)?.length ?? 0) > 0) return n + 1;
      return n;
    }, 0);
    out.push({
      blockIndex: b.blockIndex,
      shiftCount: b.shiftCount,
      shiftsAttempted,
      keystoneEpisodeId: b.keystoneEpisodeId,
      keystoneCleared,
      accessible: prevKeystoneCleared,
    });
    prevKeystoneCleared = keystoneCleared;
  }
  return out;
}

/**
 * Record a shift as completed and advance the rota one step.
 *
 * Advancement rules (M82 baseline + M83 keystone gating):
 *  - The just-completed episode must be the one at currentShiftIndex.
 *    Replays of earlier shifts log the completion but never advance.
 *  - If the just-completed shift IS a keystone:
 *      * band >= 'good' → advance (the next block unlocks)
 *      * band <  'good' → DO NOT advance. The keystone stays at the
 *        currentShiftIndex for retry. Completion is still logged for
 *        the e-portfolio.
 *  - Non-keystone shifts: advance unconditionally on completion.
 *
 * Completion is ALWAYS appended to `completedShifts` — failed
 * keystones, replays, everything. The e-portfolio renders the full
 * log; the gating affects only the playable position.
 */
export function advanceRota(
  state: RotaState,
  rotaOrder: readonly RotaShiftRef[],
  completed: CompletedShift,
  maxIndex: number = rotaOrder.length - 1,
): RotaState {
  const currentRef = rotaOrder[state.currentShiftIndex];
  const isCurrent = currentRef?.episodeId === completed.episodeId;
  const isKeystoneFail =
    isCurrent && currentRef.isKeystone && !clearsKeystone(completed.band);
  const next: RotaState = {
    ...state,
    completedShifts: [...state.completedShifts, completed],
    currentShiftIndex:
      isCurrent && !isKeystoneFail
        ? Math.min(state.currentShiftIndex + 1, maxIndex)
        : state.currentShiftIndex,
    updatedAt: new Date().toISOString(),
  };
  return next;
}

export interface RotaShiftRef {
  episodeId: string;
  focusCaseIds: readonly string[];
  /** Which of the 3 blocks this shift sits in (M83). Used to compute
   *  block-boundary gating after the player completes a keystone. */
  blockIndex: 1 | 2 | 3;
  /** True if this is the keystone shift for its block — the one whose
   *  band-cleared-at-good-or-better unlocks the next block. M83. */
  isKeystone: boolean;
}

/**
 * One-time migration from pre-M82 progression state to the new rota.
 *
 * Walks the FULL rota order. For each shift, if every focus case is
 * already in `completedCaseIds`, log it into `completedShifts` (with a
 * default 'good' band — actual per-case bands aren't reconstructed
 * from the old progression record). `currentShiftIndex` advances ONLY
 * through the contiguous-from-start run of completed shifts; once a
 * gap is hit, the index freezes at the first incomplete position
 * (the rota framing is "no skipping ahead").
 *
 * Importantly: out-of-order completed shifts are STILL logged into
 * `completedShifts` so the M83 e-portfolio can surface them. The
 * rota's playable position and the portfolio's history are two
 * different reads on the same data (M81 reviewer feedback).
 *
 * Idempotent: callers should only call this when loadRota() returns
 * null AND progression.caseIdsCompleted is non-empty. M82 wires this
 * into App.tsx's first-load path via getOrInitRota.
 */
export function migrateRotaFromCompletedCases(
  rotaOrder: readonly RotaShiftRef[],
  completedCaseIds: readonly string[],
): RotaState {
  const doneSet = new Set(completedCaseIds);
  const completedShifts: CompletedShift[] = [];
  let currentShiftIndex = 0;
  let stillAdvancing = true;
  const now = new Date().toISOString();
  for (let i = 0; i < rotaOrder.length; i++) {
    const shift = rotaOrder[i]!;
    const allDone = shift.focusCaseIds.every((id) => doneSet.has(id));
    if (allDone) {
      completedShifts.push({
        episodeId: shift.episodeId,
        band: 'good',
        completedIso: now,
      });
      if (stillAdvancing) {
        currentShiftIndex = Math.min(i + 1, rotaOrder.length - 1);
      }
    } else if (stillAdvancing) {
      currentShiftIndex = i;
      stillAdvancing = false;
    }
  }
  return {
    v: 1,
    currentShiftIndex,
    completedShifts,
    updatedAt: now,
  };
}

/**
 * Read-or-initialise the rota for the current player. If no rota is on
 * disk, either (a) migrate from existing progression if any cases are
 * already completed, or (b) return an empty rota at position 0.
 */
export function getOrInitRota(
  rotaOrder: readonly RotaShiftRef[],
  completedCaseIds: readonly string[],
): RotaState {
  const existing = loadRota();
  if (existing) return existing;
  if (completedCaseIds.length > 0) {
    const migrated = migrateRotaFromCompletedCases(rotaOrder, completedCaseIds);
    saveRota(migrated);
    return migrated;
  }
  const empty = emptyRota();
  saveRota(empty);
  return empty;
}

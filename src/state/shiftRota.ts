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
 * Record a shift as completed and advance the rota one step. Idempotent
 * on the (episodeId, band) tuple — completing a shift twice (e.g. via
 * Replay) appends a second entry but does not over-advance.
 *
 * The current rule for advancement: if the just-completed episode is
 * the shift at currentShiftIndex, advance. Otherwise (a replay or an
 * already-passed shift), just log the completion. This guards against
 * accidental rota jumps when the player replays an earlier shift.
 */
export function advanceRota(
  state: RotaState,
  rotaOrder: readonly string[],
  completed: CompletedShift,
  maxIndex: number = rotaOrder.length - 1,
): RotaState {
  const isCurrent =
    rotaOrder[state.currentShiftIndex] === completed.episodeId;
  const next: RotaState = {
    ...state,
    completedShifts: [...state.completedShifts, completed],
    currentShiftIndex: isCurrent
      ? Math.min(state.currentShiftIndex + 1, maxIndex)
      : state.currentShiftIndex,
    updatedAt: new Date().toISOString(),
  };
  return next;
}

export interface RotaShiftRef {
  episodeId: string;
  focusCaseIds: readonly string[];
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

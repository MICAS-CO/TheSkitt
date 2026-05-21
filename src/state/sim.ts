import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  SimKernel,
  type CaseRuntime,
  type KernelState,
  type SerializedKernelSnapshot,
} from '../sim/kernel';
import type { CaseStateT, CitationT } from '../content/schema';
import { bandForPercent, getActiveTier } from './difficulty';

interface SimStore {
  kernel: SimKernel | null;
  unsub: (() => void) | null;
  /** Increments on every kernel notification — components select this to force re-render. */
  tick: number;
  init: (kernel: SimKernel) => void;
  destroy: () => void;
}

export const useSim = create<SimStore>((set, get) => ({
  kernel: null,
  unsub: null,
  tick: 0,
  init: (kernel) => {
    get().unsub?.();
    const unsub = kernel.subscribe(() => {
      set((s) => ({ tick: s.tick + 1 }));
      // Auto-save every kernel notification — localStorage writes are
      // microseconds and dwarfed by the React re-render that follows.
      saveShift(kernel);
    });
    set({ kernel, unsub, tick: 0 });
    saveShift(kernel); // save initial state too
  },
  destroy: () => {
    get().unsub?.();
    set({ kernel: null, unsub: null, tick: 0 });
  },
}));

/**
 * Subscribe to a derived slice of the kernel state. Re-renders the
 * consumer ONLY when the slice's return value changes (shallow
 * equality on the projection), not on every kernel notify.
 *
 * BT 16 + BT 17 architectural finding: the `useSim((s) => s.tick)`
 * pattern forces a full re-render of every subscriber on each tick.
 * Most subscribers actually care about a narrow slice (clockMin, a
 * single case's state, focus_cases membership) that changes far less
 * frequently than the tick rate. `useKernelSelector` lets a view
 * subscribe to exactly that slice via a selector, and zustand's
 * shallow equality short-circuits the re-render when the projected
 * value hasn't moved.
 *
 * Returns `undefined` if no kernel is initialised yet (e.g. menu
 * screens that mount before the shift starts).
 *
 * Example
 *   const clockMin = useKernelSelector((ks) => ks.clockMin);
 *   const state = useKernelSelector((ks) => ks.cases.get(id)?.state);
 *   const focus = useKernelSelector((ks) => ({
 *     ids: ks.episode.focus_cases,
 *     allDispositioned: ks.episode.focus_cases.every(
 *       (i) => ks.cases.get(i)?.disposition !== null,
 *     ),
 *   }));
 *
 * Selectors that return Map/Set/large-array values fall back to a
 * shallow check at the top level only — compose a primitive
 * projection (id list, single state value, scalar) when you can.
 */
export function useKernelSelector<T>(
  selector: (ks: KernelState) => T,
): T | undefined {
  return useSim(
    useShallow((s) => {
      // Reading tick is what keeps zustand subscribed to kernel
      // notifications — without it, the selector wouldn't re-run on
      // each tick. The shallow wrapper means we only re-render when
      // the projection actually differs.
      void s.tick;
      if (!s.kernel) return undefined;
      return selector(s.kernel.getState());
    }),
  );
}

/**
 * Sim speed presets. The kernel itself is speed-agnostic; this is purely
 * a UI knob telling `useRealTimeClock` how many sim-minutes to add per
 * real-second.
 */
export const SIM_SPEEDS = {
  slow: { label: '0.5×', value: 1 / 6 }, // 20 sim-min in 120 real-sec
  normal: { label: '1×', value: 1 / 3 }, // 20 sim-min in 60 real-sec
  fast: { label: '2×', value: 2 / 3 }, // 20 sim-min in 30 real-sec
  veryFast: { label: '4×', value: 4 / 3 }, // 20 sim-min in 15 real-sec
} as const;

export type SimSpeedKey = keyof typeof SIM_SPEEDS;

export const DEFAULT_SIM_SPEED_MIN_PER_SEC = SIM_SPEEDS.normal.value;

const SPEED_KEY = 'theSkitt.speed.v1';

export function loadSavedSpeed(): SimSpeedKey {
  try {
    const v = window.localStorage.getItem(SPEED_KEY);
    if (v && v in SIM_SPEEDS) return v as SimSpeedKey;
  } catch {
    /* ignore */
  }
  return 'normal';
}

export function saveSpeed(k: SimSpeedKey): void {
  try {
    window.localStorage.setItem(SPEED_KEY, k);
  } catch {
    /* ignore */
  }
}

// ─── Save / resume (localStorage) ────────────────────────────────────────────

const SAVE_KEY = 'theSkitt.shift.v1';

export interface SavedShift {
  savedAt: number;
  snapshot: SerializedKernelSnapshot;
}

export function saveShift(kernel: SimKernel): void {
  try {
    const data: SavedShift = { savedAt: Date.now(), snapshot: kernel.serialize() };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently.
  }
}

export function loadShift(): SavedShift | null {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedShift;
    if (!data?.snapshot || data.snapshot.v !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSavedShift(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Hook that drives `kernel.advance` from a real-time rAF loop.
 * Pauses cleanly when `running` toggles off.
 * Always advances by whole minutes for kernel determinism.
 */
export function useRealTimeClock(
  kernel: SimKernel | null,
  running: boolean,
  speedMinPerSec = DEFAULT_SIM_SPEED_MIN_PER_SEC,
) {
  const accumRef = useRef(0);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!kernel || !running) {
      lastRef.current = null;
      return;
    }
    let handle = 0;
    function loop(t: number) {
      if (lastRef.current == null) lastRef.current = t;
      const dtSec = (t - lastRef.current) / 1000;
      lastRef.current = t;
      accumRef.current += dtSec * speedMinPerSec;
      const whole = Math.floor(accumRef.current);
      if (whole >= 1 && kernel) {
        accumRef.current -= whole;
        kernel.advance(whole);
      }
      handle = requestAnimationFrame(loop);
    }
    handle = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(handle);
      lastRef.current = null;
    };
  }, [kernel, running, speedMinPerSec]);
}

// ─── Scoring (pure) ──────────────────────────────────────────────────────────

export interface ScoreReport {
  mustDoTotal: number;
  mustDoDone: number;
  mustNotDoChosen: number;
  sequenceErrors: number;
  /** Net rapport across the case (M34). Only meaningful when the
   *  case has at least one HistoryItem.branch_choices authored.
   *  Otherwise stays at 0. */
  rapport: number;
  /** Number of branching dialogue moments the player actually engaged
   *  with (M34) — used by the debrief to show "you reflected on 2 / 3
   *  pivotal moments". */
  branchesPicked: number;
  branchesAvailable: number;
  /** Workup parsimony (M36, declawed M85). \`tracked\` is true only when
   *  the case has at least one investigation flagged \`essential: true\`.
   *  \`extraIxOrdered\` is the count of non-essential ix the player
   *  ordered. The penalty is held at 0 — per the Braintrust 06 timer-
   *  pedagogy synthesis, mildly punishing thoroughness trains against
   *  the FRCEM-shaped behaviour the build is trying to teach. The
   *  shape is retained for the debrief surface ("you ordered N extras")
   *  but it no longer docks the score. */
  workup: {
    tracked: boolean;
    essentialIxTotal: number;
    essentialIxOrdered: number;
    extraIxOrdered: number;
    penaltyPercent: number;
  };
  /** M85 — differential breadth bonus. The number of distinct
   *  differentials for which the player linked at least one supporting
   *  clue on the clue board. Rewards FRCEM-shaped Bayesian reasoning
   *  ("consider 3+ differentials before committing") rather than
   *  reflexive pattern-matching. */
  differentialBreadth: {
    differentialsConsidered: number;
    bonusPercent: number;
  };
  dispositionCorrect: boolean;
  workingDxCorrect: boolean;
  percent: number;
  band: 'excellent' | 'good' | 'borderline' | 'unsafe';
  details: {
    mxId: string;
    name: string;
    status: 'done' | 'missed' | 'trap_avoided' | 'trap_picked' | 'sequence_error';
  }[];
}

/**
 * M85 — count the distinct differentials for which the player has
 * linked at least one supporting clue on the clue board. Mirrors the
 * `collectClues` + `supportTally` logic in EncounterScreen but without
 * coupling to the React layer.
 *
 * Selected clue IDs are namespaced by origin (matches collectClues):
 *   - "hx:{historyId}"
 *   - "ex:{system}:{findingName}"  (single-colon separator)
 *   - "ix:{ixId}"
 * We walk each selected ID, find the matching content item, and union
 * its `supports` array into the "differentials considered" set.
 */
export function countDifferentialsConsidered(cs: CaseRuntime): number {
  const considered = new Set<string>();
  for (const clueId of cs.selectedClueIds) {
    if (clueId.startsWith('hx:')) {
      const hxId = clueId.slice(3);
      const item = cs.data.history.find((h) => h.id === hxId);
      for (const dx of item?.supports ?? []) considered.add(dx);
    } else if (clueId.startsWith('ex:')) {
      const rest = clueId.slice(3);
      const sep = rest.indexOf(':');
      if (sep < 0) continue;
      const system = rest.slice(0, sep);
      const findingName = rest.slice(sep + 1);
      const examSystem = cs.data.examination.find((e) => e.system === system);
      const finding = examSystem?.findings.find((f) => f.name === findingName);
      for (const dx of finding?.supports ?? []) considered.add(dx);
    } else if (clueId.startsWith('ix:')) {
      const ixId = clueId.slice(3);
      const item = cs.data.investigations.find((i) => i.id === ixId);
      for (const dx of item?.supports ?? []) considered.add(dx);
    }
  }
  return considered.size;
}

export function scoreCase(cs: CaseRuntime): ScoreReport {
  const mustDo = cs.data.management.filter((m) => m.must_do);
  const mustNotDo = cs.data.management.filter((m) => m.must_not_do);

  const mustDoDone = mustDo.filter((m) => cs.actions.has(m.id)).length;
  const mustNotDoChosen = mustNotDo.filter((m) => cs.actions.has(m.id)).length;
  const sequenceErrors = cs.sequenceErrors.size;

  const details: ScoreReport['details'] = [
    ...mustDo.map((m) => ({
      mxId: m.id,
      name: m.name,
      status: cs.sequenceErrors.has(m.id)
        ? ('sequence_error' as const)
        : cs.actions.has(m.id)
          ? ('done' as const)
          : ('missed' as const),
    })),
    ...mustNotDo.map((m) => ({
      mxId: m.id,
      name: m.name,
      status: cs.actions.has(m.id) ? ('trap_picked' as const) : ('trap_avoided' as const),
    })),
    // Sequence errors on non-mustDo actions also appear in details so the
    // player sees them in the debrief breakdown.
    ...cs.data.management
      .filter((m) => !m.must_do && !m.must_not_do && cs.sequenceErrors.has(m.id))
      .map((m) => ({
        mxId: m.id,
        name: m.name,
        status: 'sequence_error' as const,
      })),
  ];

  const dispositionCorrect = !!cs.data.disposition_options.find(
    (d) => d.label === cs.disposition && d.appropriate,
  );
  const topDx = cs.data.differential.find((d) => d.likelihood === 'top');
  const workingDxCorrect = !!topDx && cs.workingDx === topDx.diagnosis;

  // Workup parsimony (M36, declawed M85). Counts retained for debrief
  // surfacing but the penalty is hard-coded to zero per the Braintrust
  // 06 synthesis.
  const essentialIx = cs.data.investigations.filter((i) => i.essential);
  const orderedIxIds = new Set(cs.ordered.keys());
  const essentialIxOrdered = essentialIx.filter((i) => orderedIxIds.has(i.id)).length;
  const extraIxOrdered = [...orderedIxIds].filter(
    (id) => !essentialIx.some((i) => i.id === id),
  ).length;
  const workupTracked = essentialIx.length > 0;
  const workupPenalty = 0;

  // M85 — differential breadth. How many distinct differentials had at
  // least one supporting clue linked? Counts clues from history /
  // examination / investigations whose authored \`supports\` field
  // names a differential and that the player has selected on the
  // clue board. +10 for >=3, +5 for 2, 0 for <=1 (the FRCEM-shaped
  // reward for considering a broad differential rather than
  // pattern-matching the obvious diagnosis).
  const differentialsConsidered = countDifferentialsConsidered(cs);
  const differentialBreadthBonus =
    differentialsConsidered >= 3 ? 10 : differentialsConsidered === 2 ? 5 : 0;

  const safetyPenalty = mustNotDoChosen * 20;
  const sequencePenalty = sequenceErrors * 10;
  // M85: must_do weight rebalanced from 70 to 60 to make room for the
  // +10 differential breadth bonus. Net max remains 100.
  const score =
    (mustDoDone / Math.max(1, mustDo.length)) * 60 +
    (workingDxCorrect ? 15 : 0) +
    (dispositionCorrect ? 15 : 0) +
    differentialBreadthBonus -
    safetyPenalty -
    sequencePenalty -
    workupPenalty;
  const percent = Math.max(0, Math.min(100, Math.round(score)));

  // M77: band thresholds shift with the character's grade. F1/F2 sit
  // at lenient bands (excellent ≥80 / good ≥65 for F1); CT1 at
  // standard (≥90 / ≥75 — same as the pre-M77 hard-coded values).
  // `unsafe` remains decided by clinical safety conditions and is
  // not affected by tier.
  const tier = getActiveTier();
  let band: ScoreReport['band'];
  if (mustNotDoChosen > 0 || cs.state === 'arrested' || cs.state === 'deceased') {
    band = 'unsafe';
  } else {
    band = bandForPercent(percent, tier.thresholds);
  }

  const branchesAvailable = cs.data.history.filter((h) => h.branch_choices).length;
  const branchesPicked = cs.branchChoices.size;

  return {
    mustDoTotal: mustDo.length,
    mustDoDone,
    mustNotDoChosen,
    sequenceErrors,
    rapport: cs.rapport,
    branchesPicked,
    branchesAvailable,
    workup: {
      tracked: workupTracked,
      essentialIxTotal: essentialIx.length,
      essentialIxOrdered,
      extraIxOrdered,
      penaltyPercent: workupPenalty,
    },
    differentialBreadth: {
      differentialsConsidered,
      bonusPercent: differentialBreadthBonus,
    },
    dispositionCorrect,
    workingDxCorrect,
    percent,
    band,
    details,
  };
}

// ─── Episode-level scoring (Milestone 6) ─────────────────────────────────────

export interface PerCaseReport {
  caseId: string;
  title: string;
  chiefComplaint: string;
  finalState: CaseStateT;
  curriculumTags: string[];
  slos: number[];
  score: ScoreReport;
  /** True if the player ever entered this case during the shift. */
  attended: boolean;
}

export interface PerArcReport {
  arcId: string;
  title: string;
  revealed: boolean;
  /** Earliest log entry text that mentions the arc reveal. */
  revealedAtMin: number | null;
  effectsApplied: number;
}

export interface EpisodeReport {
  episodeId: string;
  episodeTitle: string;
  shiftEnded: boolean;
  clockMin: number;
  shiftDurationMin: number;
  /** Episode focus cases (the player is expected to take these end-to-end). */
  cases: PerCaseReport[];
  /** Ambient board cases — board pressure (Milestone 8). */
  ambientCases: PerCaseReport[];
  arcs: PerArcReport[];
  livesSaved: number;
  livesLost: number;
  unsafeCases: number;
  averagePercent: number;
  overallPercent: number;
  band: 'excellent' | 'good' | 'borderline' | 'unsafe';
  examinerNotes: string[];
  /** Aggregated, de-duplicated source citations across all cases. */
  sources: CitationT[];
}

const LIFE_LOST_STATES: ReadonlySet<CaseStateT> = new Set<CaseStateT>(['arrested', 'deceased']);

const LIFE_SAVED_STATES: ReadonlySet<CaseStateT> = new Set<CaseStateT>([
  'stable',
  'admitted',
  'discharged',
]);

export function scoreEpisode(ks: KernelState): EpisodeReport {
  function reportFor(ids: readonly string[]): {
    runtimes: CaseRuntime[];
    perCase: PerCaseReport[];
  } {
    const runtimes: CaseRuntime[] = [];
    for (const id of ids) {
      const cs = ks.cases.get(id);
      if (cs) runtimes.push(cs);
    }
    const perCase: PerCaseReport[] = runtimes.map((cs) => ({
      caseId: cs.caseId,
      title: cs.data.title,
      chiefComplaint: cs.data.chief_complaint,
      finalState: cs.state,
      curriculumTags: cs.data.curriculum_tags,
      slos: cs.data.slos,
      score: scoreCase(cs),
      attended: cs.enteredAt !== null,
    }));
    return { runtimes, perCase };
  }

  const focus = reportFor(ks.episode.focus_cases);
  const ambient = reportFor(ks.episode.ambient_cases);
  const allRuntimes = [...focus.runtimes, ...ambient.runtimes];
  const allPerCase = [...focus.perCase, ...ambient.perCase];

  const livesLost = allPerCase.filter((c) => LIFE_LOST_STATES.has(c.finalState)).length;
  const livesSaved = allPerCase.filter((c) => LIFE_SAVED_STATES.has(c.finalState)).length;
  const unsafeCases = allPerCase.filter((c) => c.score.band === 'unsafe').length;

  const averagePercent =
    allPerCase.length === 0
      ? 0
      : Math.round(allPerCase.reduce((sum, c) => sum + c.score.percent, 0) / allPerCase.length);

  // Overall penalty: lose 25 percentage points per dead patient.
  const overallPercent = Math.max(0, Math.min(100, averagePercent - livesLost * 25));

  let band: EpisodeReport['band'];
  if (livesLost > 0 || unsafeCases > 0) band = 'unsafe';
  else if (overallPercent >= 90) band = 'excellent';
  else if (overallPercent >= 75) band = 'good';
  else band = 'borderline';

  const perArc: PerArcReport[] = [...ks.arcs.values()].map((arc) => {
    const revealed = ks.revealedArcIds.has(arc.id);
    const revealLog = ks.log.find(
      (l) => revealed && l.text.startsWith('Arc reveal') && l.text.includes(arc.title),
    );
    return {
      arcId: arc.id,
      title: arc.title,
      revealed,
      revealedAtMin: revealLog?.t_min ?? null,
      effectsApplied: revealed ? arc.effects.length : 0,
    };
  });

  return {
    episodeId: ks.episode.id,
    episodeTitle: ks.episode.title,
    shiftEnded: ks.isShiftOver,
    clockMin: ks.clockMin,
    shiftDurationMin: ks.shiftDurationMin,
    cases: focus.perCase,
    ambientCases: ambient.perCase,
    arcs: perArc,
    livesSaved,
    livesLost,
    unsafeCases,
    averagePercent,
    overallPercent,
    band,
    examinerNotes: buildExaminerNotes(allPerCase, perArc),
    sources: dedupeCitations(allRuntimes.flatMap((cs) => cs.data.sources)),
  };
}

function dedupeCitations(all: CitationT[]): CitationT[] {
  const seen = new Set<string>();
  const out: CitationT[] = [];
  for (const c of all) {
    const key = `${c.type}::${c.ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function buildExaminerNotes(cases: PerCaseReport[], arcs: PerArcReport[]): string[] {
  const notes: string[] = [];
  for (const c of cases) {
    if (c.score.band === 'unsafe') {
      notes.push(
        `${c.title}: ${c.score.mustNotDoChosen > 0 ? 'patient-safety trap picked' : 'patient deteriorated'}. SAQ examiner would fail the station.`,
      );
    } else if (c.score.mustDoDone < c.score.mustDoTotal) {
      const missed = c.score.mustDoTotal - c.score.mustDoDone;
      notes.push(`${c.title}: ${missed} must-do action(s) missed. Examiner wants the full bundle.`);
    } else if (!c.score.workingDxCorrect) {
      notes.push(`${c.title}: working diagnosis not aligned with the top differential.`);
    } else if (!c.score.dispositionCorrect) {
      notes.push(`${c.title}: disposition wasn't the safest option for this presentation.`);
    } else if (c.score.band === 'excellent') {
      notes.push(`${c.title}: textbook performance against the guideline.`);
    }
  }
  for (const a of arcs) {
    if (!a.revealed) {
      notes.push(
        `Arc "${a.title}" never revealed. Triangulating across cases would have unlocked extra history — worth revisiting how to ask connected questions.`,
      );
    } else if (a.revealedAtMin !== null) {
      notes.push(`Arc "${a.title}" revealed at T+${a.revealedAtMin}m.`);
    }
  }
  return notes;
}

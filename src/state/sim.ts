import { useEffect, useRef } from 'react';
import { create } from 'zustand';
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
  /** Workup parsimony (M36). \`tracked\` is true only when the case
   *  has at least one investigation flagged \`essential: true\` — older
   *  cases without essential markers stay out of the metric and pay
   *  no penalty. \`extraIxOrdered\` is the count of non-essential ix
   *  the player ordered. */
  workup: {
    tracked: boolean;
    essentialIxTotal: number;
    essentialIxOrdered: number;
    extraIxOrdered: number;
    penaltyPercent: number;
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

  // Workup parsimony (M36). Only tracked when the case actually
  // declares essentials; older cases pay nothing.
  const essentialIx = cs.data.investigations.filter((i) => i.essential);
  const orderedIxIds = new Set(cs.ordered.keys());
  const essentialIxOrdered = essentialIx.filter((i) => orderedIxIds.has(i.id)).length;
  const extraIxOrdered = [...orderedIxIds].filter(
    (id) => !essentialIx.some((i) => i.id === id),
  ).length;
  const workupTracked = essentialIx.length > 0;
  // -2% per extra ix beyond a 2-ix free allowance, capped at -10%.
  const workupPenalty = workupTracked
    ? Math.min(10, Math.max(0, (extraIxOrdered - 2) * 2))
    : 0;

  const safetyPenalty = mustNotDoChosen * 20;
  const sequencePenalty = sequenceErrors * 10;
  const score =
    (mustDoDone / Math.max(1, mustDo.length)) * 70 +
    (workingDxCorrect ? 15 : 0) +
    (dispositionCorrect ? 15 : 0) -
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

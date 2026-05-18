import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { SimKernel, type CaseRuntime, type KernelState } from '../sim/kernel';
import type { CaseStateT, CitationT } from '../content/schema';

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
    const unsub = kernel.subscribe(() => set((s) => ({ tick: s.tick + 1 })));
    set({ kernel, unsub, tick: 0 });
  },
  destroy: () => {
    get().unsub?.();
    set({ kernel: null, unsub: null, tick: 0 });
  },
}));

/**
 * Default sim speed: 1 simulated minute per 3 real seconds.
 * → A 20-minute shift takes 60 real seconds to elapse.
 * Tunable per UI; kernel itself is speed-agnostic.
 */
export const DEFAULT_SIM_SPEED_MIN_PER_SEC = 1 / 3;

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
  dispositionCorrect: boolean;
  workingDxCorrect: boolean;
  percent: number;
  band: 'excellent' | 'good' | 'borderline' | 'unsafe';
  details: {
    mxId: string;
    name: string;
    status: 'done' | 'missed' | 'trap_avoided' | 'trap_picked';
  }[];
}

export function scoreCase(cs: CaseRuntime): ScoreReport {
  const mustDo = cs.data.management.filter((m) => m.must_do);
  const mustNotDo = cs.data.management.filter((m) => m.must_not_do);

  const mustDoDone = mustDo.filter((m) => cs.actions.has(m.id)).length;
  const mustNotDoChosen = mustNotDo.filter((m) => cs.actions.has(m.id)).length;

  const details: ScoreReport['details'] = [
    ...mustDo.map((m) => ({
      mxId: m.id,
      name: m.name,
      status: cs.actions.has(m.id) ? ('done' as const) : ('missed' as const),
    })),
    ...mustNotDo.map((m) => ({
      mxId: m.id,
      name: m.name,
      status: cs.actions.has(m.id) ? ('trap_picked' as const) : ('trap_avoided' as const),
    })),
  ];

  const dispositionCorrect = !!cs.data.disposition_options.find(
    (d) => d.label === cs.disposition && d.appropriate,
  );
  const topDx = cs.data.differential.find((d) => d.likelihood === 'top');
  const workingDxCorrect = !!topDx && cs.workingDx === topDx.diagnosis;

  const safetyPenalty = mustNotDoChosen * 20;
  const score =
    (mustDoDone / Math.max(1, mustDo.length)) * 70 +
    (workingDxCorrect ? 15 : 0) +
    (dispositionCorrect ? 15 : 0) -
    safetyPenalty;
  const percent = Math.max(0, Math.min(100, Math.round(score)));

  let band: ScoreReport['band'];
  if (mustNotDoChosen > 0 || cs.state === 'arrested' || cs.state === 'deceased') {
    band = 'unsafe';
  } else if (percent >= 90) band = 'excellent';
  else if (percent >= 75) band = 'good';
  else band = 'borderline';

  return {
    mustDoTotal: mustDo.length,
    mustDoDone,
    mustNotDoChosen,
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
  cases: PerCaseReport[];
  arcs: PerArcReport[];
  livesSaved: number;
  livesLost: number;
  unsafeCases: number;
  averagePercent: number;
  overallPercent: number;
  band: 'excellent' | 'good' | 'borderline' | 'unsafe';
  examinerNotes: string[];
  /** Aggregated, de-duplicated source citations across all focus cases. */
  sources: CitationT[];
}

const LIFE_LOST_STATES: ReadonlySet<CaseStateT> = new Set<CaseStateT>(['arrested', 'deceased']);

const LIFE_SAVED_STATES: ReadonlySet<CaseStateT> = new Set<CaseStateT>([
  'stable',
  'admitted',
  'discharged',
]);

export function scoreEpisode(ks: KernelState): EpisodeReport {
  const focusIds = new Set(ks.episode.focus_cases);
  const focusCases: CaseRuntime[] = [];
  for (const id of focusIds) {
    const cs = ks.cases.get(id);
    if (cs) focusCases.push(cs);
  }

  const perCase: PerCaseReport[] = focusCases.map((cs) => ({
    caseId: cs.caseId,
    title: cs.data.title,
    chiefComplaint: cs.data.chief_complaint,
    finalState: cs.state,
    curriculumTags: cs.data.curriculum_tags,
    slos: cs.data.slos,
    score: scoreCase(cs),
    attended: cs.enteredAt !== null,
  }));

  const livesLost = perCase.filter((c) => LIFE_LOST_STATES.has(c.finalState)).length;
  const livesSaved = perCase.filter((c) => LIFE_SAVED_STATES.has(c.finalState)).length;
  const unsafeCases = perCase.filter((c) => c.score.band === 'unsafe').length;

  const averagePercent =
    perCase.length === 0
      ? 0
      : Math.round(perCase.reduce((sum, c) => sum + c.score.percent, 0) / perCase.length);

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
    cases: perCase,
    arcs: perArc,
    livesSaved,
    livesLost,
    unsafeCases,
    averagePercent,
    overallPercent,
    band,
    examinerNotes: buildExaminerNotes(perCase, perArc),
    sources: dedupeCitations(focusCases.flatMap((cs) => cs.data.sources)),
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

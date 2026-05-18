import { create } from 'zustand';
import type { CaseT } from '../content/schema';

export type EncounterPhase =
  | 'vignette'
  | 'history'
  | 'examination'
  | 'investigations'
  | 'differential'
  | 'management'
  | 'disposition'
  | 'debrief';

export const PHASE_ORDER: EncounterPhase[] = [
  'vignette',
  'history',
  'examination',
  'investigations',
  'differential',
  'management',
  'disposition',
  'debrief',
];

interface EncounterState {
  caseData: CaseT | null;
  phase: EncounterPhase;

  historyAsked: Set<string>;
  examined: Set<string>;
  investigationsOrdered: Set<string>;
  workingDiagnosis: string | null;
  managementPicked: Set<string>;
  dispositionPicked: string | null;

  start: (caseData: CaseT) => void;
  next: () => void;
  prev: () => void;
  ask: (historyId: string) => void;
  examine: (systemId: string) => void;
  order: (investigationId: string) => void;
  chooseDiagnosis: (dx: string) => void;
  toggleManagement: (mxId: string) => void;
  chooseDisposition: (label: string) => void;
  reset: () => void;
}

export const useEncounter = create<EncounterState>((set, get) => ({
  caseData: null,
  phase: 'vignette',
  historyAsked: new Set(),
  examined: new Set(),
  investigationsOrdered: new Set(),
  workingDiagnosis: null,
  managementPicked: new Set(),
  dispositionPicked: null,

  start: (caseData) =>
    set({
      caseData,
      phase: 'vignette',
      historyAsked: new Set(),
      examined: new Set(),
      investigationsOrdered: new Set(),
      workingDiagnosis: null,
      managementPicked: new Set(),
      dispositionPicked: null,
    }),

  next: () => {
    const i = PHASE_ORDER.indexOf(get().phase);
    if (i < PHASE_ORDER.length - 1) set({ phase: PHASE_ORDER[i + 1]! });
  },

  prev: () => {
    const i = PHASE_ORDER.indexOf(get().phase);
    if (i > 0) set({ phase: PHASE_ORDER[i - 1]! });
  },

  ask: (id) =>
    set((s) => {
      const next = new Set(s.historyAsked);
      next.add(id);
      return { historyAsked: next };
    }),

  examine: (id) =>
    set((s) => {
      const next = new Set(s.examined);
      next.add(id);
      return { examined: next };
    }),

  order: (id) =>
    set((s) => {
      const next = new Set(s.investigationsOrdered);
      next.add(id);
      return { investigationsOrdered: next };
    }),

  chooseDiagnosis: (dx) => set({ workingDiagnosis: dx }),

  toggleManagement: (mxId) =>
    set((s) => {
      const next = new Set(s.managementPicked);
      if (next.has(mxId)) next.delete(mxId);
      else next.add(mxId);
      return { managementPicked: next };
    }),

  chooseDisposition: (label) => set({ dispositionPicked: label }),

  reset: () =>
    set({
      caseData: null,
      phase: 'vignette',
      historyAsked: new Set(),
      examined: new Set(),
      investigationsOrdered: new Set(),
      workingDiagnosis: null,
      managementPicked: new Set(),
      dispositionPicked: null,
    }),
}));

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

export function scoreEncounter(state: EncounterState): ScoreReport {
  const c = state.caseData;
  if (!c) {
    return {
      mustDoTotal: 0,
      mustDoDone: 0,
      mustNotDoChosen: 0,
      dispositionCorrect: false,
      workingDxCorrect: false,
      percent: 0,
      band: 'unsafe',
      details: [],
    };
  }

  const mustDo = c.management.filter((m) => m.must_do);
  const mustNotDo = c.management.filter((m) => m.must_not_do);

  const mustDoDone = mustDo.filter((m) => state.managementPicked.has(m.id)).length;
  const mustNotDoChosen = mustNotDo.filter((m) => state.managementPicked.has(m.id)).length;

  const details: ScoreReport['details'] = [
    ...mustDo.map((m) => ({
      mxId: m.id,
      name: m.name,
      status: state.managementPicked.has(m.id) ? ('done' as const) : ('missed' as const),
    })),
    ...mustNotDo.map((m) => ({
      mxId: m.id,
      name: m.name,
      status: state.managementPicked.has(m.id)
        ? ('trap_picked' as const)
        : ('trap_avoided' as const),
    })),
  ];

  const dispositionCorrect = !!c.disposition_options.find(
    (d) => d.label === state.dispositionPicked && d.appropriate,
  );
  const topDx = c.differential.find((d) => d.likelihood === 'top');
  const workingDxCorrect = !!topDx && state.workingDiagnosis === topDx.diagnosis;

  const safetyPenalty = mustNotDoChosen * 2;
  const score =
    (mustDoDone / Math.max(1, mustDo.length)) * 70 +
    (workingDxCorrect ? 15 : 0) +
    (dispositionCorrect ? 15 : 0) -
    safetyPenalty * 10;
  const percent = Math.max(0, Math.min(100, Math.round(score)));

  let band: ScoreReport['band'];
  if (mustNotDoChosen > 0) band = 'unsafe';
  else if (percent >= 90) band = 'excellent';
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

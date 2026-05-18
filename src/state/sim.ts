import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { SimKernel, type CaseRuntime } from '../sim/kernel';

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

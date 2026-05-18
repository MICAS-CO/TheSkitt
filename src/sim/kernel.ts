import type {
  CaseStateT,
  CaseT,
  EpisodeT,
  ScheduledEventT,
  TransitionTriggerT,
} from '../content/schema';

/**
 * Runtime state of one patient case while a shift is in progress.
 * Owned by the kernel; React/Phaser read it but never mutate it directly.
 */
export interface CaseRuntime {
  caseId: string;
  data: CaseT;
  state: CaseStateT;
  /** Sim-minute the player first opened the encounter. */
  enteredAt: number | null;
  /** Player actions taken (management ids). */
  actions: Set<string>;
  /** History items asked. */
  asked: Set<string>;
  /** Examination systems revealed. */
  examined: Set<string>;
  /** Investigations ordered: ix id → sim-minute when ordered. */
  ordered: Map<string, number>;
  /** Investigations whose results are back. */
  resulted: Set<string>;
  /** Working diagnosis picked. */
  workingDx: string | null;
  /** Disposition chosen. */
  disposition: string | null;
  /** Free-text history of state changes for the debrief. */
  reasons: string[];
}

export type LogLevel = 'info' | 'warn' | 'danger';

export interface LogEntry {
  t_min: number;
  level: LogLevel;
  text: string;
  /** Optional case the entry relates to. */
  caseId?: string;
}

export interface KernelState {
  clockMin: number;
  shiftDurationMin: number;
  isRunning: boolean;
  isShiftOver: boolean;
  episode: EpisodeT;
  cases: Map<string, CaseRuntime>;
  /** Scheduled events that haven't fired yet, sorted by t_min. */
  unfiredEvents: ScheduledEventT[];
  /** Scheduled event ids that HAVE fired (for trigger lookup). */
  firedEventIds: Set<string>;
  log: LogEntry[];
}

const TERMINAL_STATES: ReadonlySet<CaseStateT> = new Set<CaseStateT>([
  'arrested',
  'admitted',
  'discharged',
  'deceased',
]);

export interface SimKernelOpts {
  episode: EpisodeT;
  cases: Map<string, CaseT>;
}

export class SimKernel {
  private state: KernelState;
  private subs = new Set<() => void>();

  constructor(opts: SimKernelOpts) {
    const caseMap = new Map<string, CaseRuntime>();
    for (const [id, data] of opts.cases) {
      caseMap.set(id, {
        caseId: id,
        data,
        state: data.initial_state,
        enteredAt: null,
        actions: new Set(),
        asked: new Set(),
        examined: new Set(),
        ordered: new Map(),
        resulted: new Set(),
        workingDx: null,
        disposition: null,
        reasons: [],
      });
    }
    this.state = {
      clockMin: 0,
      shiftDurationMin: opts.episode.shift_duration_min,
      isRunning: false,
      isShiftOver: false,
      episode: opts.episode,
      cases: caseMap,
      unfiredEvents: [...opts.episode.scheduled_events].sort((a, b) => a.t_min - b.t_min),
      firedEventIds: new Set(),
      log: [{ t_min: 0, level: 'info', text: 'Shift handover received.' }],
    };
  }

  // ─── Read API ─────────────────────────────────────────────────────────────

  getState(): KernelState {
    return this.state;
  }

  /**
   * Subscribe to any kernel state change. Returns an unsubscribe fn.
   */
  subscribe(fn: () => void): () => void {
    this.subs.add(fn);
    return () => {
      this.subs.delete(fn);
    };
  }

  // ─── Time control ─────────────────────────────────────────────────────────

  start(): void {
    if (this.state.isShiftOver) return;
    this.state.isRunning = true;
    this.notify();
  }

  pause(): void {
    this.state.isRunning = false;
    this.notify();
  }

  /**
   * Advance simulated time by `deltaMin` minutes. Fractional minutes accepted.
   * Always deterministic given the same starting state and player actions.
   */
  advance(deltaMin: number): void {
    if (deltaMin <= 0 || this.state.isShiftOver) return;

    const target = Math.min(this.state.clockMin + deltaMin, this.state.shiftDurationMin);

    // Fire any scheduled events whose t_min falls in (current, target], in order.
    while (this.state.unfiredEvents.length > 0) {
      const head = this.state.unfiredEvents[0]!;
      if (head.t_min > target) break;
      this.state.clockMin = Math.max(this.state.clockMin, head.t_min);
      this.processEvent(head);
      this.state.unfiredEvents.shift();
      this.checkAllTransitions();
      this.processInvestigationResults();
    }

    this.state.clockMin = target;
    this.processInvestigationResults();
    this.checkAllTransitions();

    if (this.state.clockMin >= this.state.shiftDurationMin) {
      this.state.isRunning = false;
      this.state.isShiftOver = true;
      this.log('info', 'Shift over.');
    }

    this.notify();
  }

  // ─── Player actions (record-and-react) ───────────────────────────────────

  /**
   * Open a case the player wasn't attending yet. Records the entry time so
   * elapsed_min transitions per-case can fire.
   */
  enterCase(caseId: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    if (cs.enteredAt === null) {
      cs.enteredAt = this.state.clockMin;
      this.log('info', `Entered ${cs.data.title}.`, caseId);
    }
    this.checkTransitions(cs);
    this.notify();
  }

  toggleAction(caseId: string, actionId: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    if (cs.actions.has(actionId)) {
      cs.actions.delete(actionId);
    } else {
      cs.actions.add(actionId);
      this.log('info', `Action: ${actionLabel(cs, actionId)}.`, caseId);
    }
    this.checkTransitions(cs);
    this.notify();
  }

  recordAsk(caseId: string, hxId: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    cs.asked.add(hxId);
    this.notify();
  }

  recordExamine(caseId: string, system: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    cs.examined.add(system);
    this.checkTransitions(cs);
    this.notify();
  }

  orderInvestigation(caseId: string, ixId: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    if (cs.ordered.has(ixId)) return;
    cs.ordered.set(ixId, this.state.clockMin);
    const ix = cs.data.investigations.find((i) => i.id === ixId);
    this.log('info', `Ordered: ${ix?.name ?? ixId}.`, caseId);
    this.notify();
  }

  setWorkingDx(caseId: string, dx: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    cs.workingDx = dx;
    this.notify();
  }

  setDisposition(caseId: string, label: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    cs.disposition = label;
    // Disposition closes the case if appropriate
    const opt = cs.data.disposition_options.find((d) => d.label === label);
    if (opt) {
      cs.state =
        opt.appropriate || cs.state === 'stable'
          ? label.toLowerCase().includes('discharge')
            ? 'discharged'
            : 'admitted'
          : cs.state;
    }
    this.notify();
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private log(level: LogLevel, text: string, caseId?: string): void {
    this.state.log.push({ t_min: this.state.clockMin, level, text, caseId });
  }

  private processInvestigationResults(): void {
    for (const cs of this.state.cases.values()) {
      for (const [ixId, orderedAt] of cs.ordered) {
        if (cs.resulted.has(ixId)) continue;
        const ix = cs.data.investigations.find((i) => i.id === ixId);
        if (!ix) continue;
        if (this.state.clockMin >= orderedAt + ix.turnaround_min) {
          cs.resulted.add(ixId);
          this.log('info', `${ix.name} resulted.`, cs.caseId);
        }
      }
    }
  }

  private processEvent(ev: ScheduledEventT): void {
    this.state.firedEventIds.add(ev.id);

    switch (ev.type) {
      case 'results_back': {
        const cs = this.state.cases.get(ev.case_id);
        if (!cs) break;
        cs.resulted.add(ev.investigation_id);
        const ix = cs.data.investigations.find((i) => i.id === ev.investigation_id);
        this.log('info', `Scheduled result: ${ix?.name ?? ev.investigation_id}.`, cs.caseId);
        break;
      }
      case 'news2_escalation': {
        const cs = this.state.cases.get(ev.case_id);
        if (!cs) break;
        this.log(
          ev.if_no_action ? 'warn' : 'info',
          `NEWS2 escalation → ${ev.new_news2}.`,
          cs.caseId,
        );
        break;
      }
      case 'new_arrival': {
        const cs = this.state.cases.get(ev.case_id);
        this.log('warn', `Arrival: ${cs?.data.title ?? ev.case_id}.`, ev.case_id);
        break;
      }
      case 'family_arrival': {
        const cs = this.state.cases.get(ev.case_id);
        this.log('info', `${ev.npc} arrives — relatives' room.`, cs?.caseId);
        break;
      }
      case 'bed_manager_pressure': {
        this.log('warn', `Bed manager (${ev.severity}): asking about admissions.`);
        break;
      }
      case 'lab_callback': {
        const cs = this.state.cases.get(ev.case_id);
        this.log('warn', `Lab callback: ${ev.urgent_finding}.`, cs?.caseId);
        break;
      }
      case 'deterioration_if_not_x_by_t': {
        const cs = this.state.cases.get(ev.case_id);
        if (!cs) break;
        const allDone = ev.required_action_ids.every((a) => cs.actions.has(a));
        if (!allDone) {
          const prev = cs.state;
          cs.state = ev.new_state;
          cs.reasons.push(
            `Deteriorated at T+${ev.t_min} (required ${ev.required_action_ids.join(', ')} not done).`,
          );
          this.log(
            'danger',
            `${cs.data.title}: deterioration (${prev} → ${cs.state}) — required actions not completed.`,
            cs.caseId,
          );
        } else {
          this.log(
            'info',
            `${cs.data.title}: critical interventions completed in time.`,
            cs.caseId,
          );
        }
        break;
      }
      case 'arc_reveal': {
        this.log('info', `Arc reveal: ${ev.arc_id}.`);
        break;
      }
    }
  }

  private checkAllTransitions(): void {
    for (const cs of this.state.cases.values()) this.checkTransitions(cs);
  }

  private checkTransitions(cs: CaseRuntime): void {
    if (TERMINAL_STATES.has(cs.state)) return;
    for (const t of cs.data.state_machine.transitions) {
      if (t.from !== cs.state) continue;
      if (this.triggerMatches(t.trigger, cs)) {
        const prev = cs.state;
        cs.state = t.to;
        if (t.trigger.note) cs.reasons.push(t.trigger.note);
        this.log(
          cs.state === 'arrested' || cs.state === 'deceased' ? 'danger' : 'info',
          `${cs.data.title}: ${prev} → ${cs.state}.`,
          cs.caseId,
        );
        break;
      }
    }
  }

  private triggerMatches(trigger: TransitionTriggerT, cs: CaseRuntime): boolean {
    switch (trigger.on) {
      case 'action':
        return cs.actions.has(trigger.action_id);
      case 'finding':
        return cs.examined.has(trigger.finding_id);
      case 'elapsed_min':
        return cs.enteredAt !== null && this.state.clockMin - cs.enteredAt >= trigger.min;
      case 'inaction_by':
        return (
          this.state.clockMin >= trigger.min &&
          !trigger.required_actions.every((a) => cs.actions.has(a))
        );
      case 'scheduled_event':
        return this.state.firedEventIds.has(trigger.event_id);
    }
  }

  private notify(): void {
    for (const fn of this.subs) fn();
  }
}

function actionLabel(cs: CaseRuntime, actionId: string): string {
  return cs.data.management.find((m) => m.id === actionId)?.name ?? actionId;
}

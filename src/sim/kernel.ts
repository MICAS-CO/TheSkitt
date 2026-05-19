import type {
  ArcRevealTriggerT,
  ArcT,
  CaseStateT,
  CaseT,
  EpisodeT,
  ScheduledEventT,
  TransitionTriggerT,
} from '../content/schema';
import {
  composeDeteriorationTakeoverInterrupt,
  composeTrapCaughtInterrupt,
  composeUnsafeMidshiftInterrupt,
  type InterruptContext,
} from '../state/consultantInterrupts';

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
  /** History item ids unlocked by an arc reveal effect. */
  unlockedHistoryIds: Set<string>;
  /** Findings unlocked by an arc reveal effect (e.g. extra exam findings). */
  unlockedFindingIds: Set<string>;
  /** Management ids taken out of their authored sequence (M20). */
  sequenceErrors: Set<string>;
  /** Sim-minute at which each currently-ticked action was given.
   *  Untoggling removes the entry (M30). Drives the drug-chart
   *  TIME column. */
  actionsAt: Map<string, number>;
  /** Branching dialogue picks (M34). historyId → branch_choice id. */
  branchChoices: Map<string, string>;
  /** Net rapport score across the encounter (M34). Clamped −3..+3. */
  rapport: number;
  /** Consultant interrupt ids that have already fired for this case
   *  (M39). Prevents re-fire of the same beat within an encounter. */
  consultantInterruptsFired: Set<string>;
  /** Manoeuvres the player has performed during examination (M40),
   *  keyed as "system::manoeuvreId". Unlocks the manoeuvre's
   *  per-finding payload separately from the system's base findings.
   */
  performedManoeuvres: Set<string>;
}

/**
 * In-flight bedside interrupt from Dr McGrath (M39). Lives on
 * KernelState until the UI dismisses it. Not snapshotted — interrupts
 * are run-only beats, not save-state.
 */
export interface ConsultantInterrupt {
  id: string;
  trigger: 'trap_caught' | 'deterioration_takeover' | 'unsafe_midshift';
  caseId: string;
  caseName: string;
  line: string;
  /** Optional follow-up shown smaller after the main line. */
  aside?: string;
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
  /** Arcs loaded for this episode (keyed by arc id). */
  arcs: Map<string, ArcT>;
  /** Ids of arcs that have already been revealed to the player. */
  revealedArcIds: Set<string>;
  /** Scheduled events that haven't fired yet, sorted by t_min. */
  unfiredEvents: ScheduledEventT[];
  /** Scheduled event ids that HAVE fired (for trigger lookup). */
  firedEventIds: Set<string>;
  log: LogEntry[];
  /**
   * The most recent un-dismissed Dr McGrath bedside interrupt (M39),
   * or null. UI shows a modal until cleared via dismissConsultantInterrupt().
   * Not part of the serialised snapshot — beats are run-only.
   */
  pendingInterrupt: ConsultantInterrupt | null;
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
  arcs?: Map<string, ArcT>;
  /** Restore the kernel from a previously-saved snapshot. */
  /** Optional snapshot to restore from. Accepts \`unknown\` (raw
   *  localStorage / file payload) — \`migrateSnapshot\` brings it to
   *  the current version. */
  restore?: SerializedKernelSnapshot | unknown;
}

/** Plain-object snapshot of mutable kernel state, safe to JSON.stringify. */
export interface SerializedCaseRuntime {
  caseId: string;
  state: CaseStateT;
  enteredAt: number | null;
  actions: string[];
  asked: string[];
  examined: string[];
  ordered: [string, number][];
  resulted: string[];
  workingDx: string | null;
  disposition: string | null;
  reasons: string[];
  unlockedHistoryIds: string[];
  unlockedFindingIds: string[];
  sequenceErrors?: string[];
  actionsAt?: [string, number][];
  branchChoices?: [string, string][];
  rapport?: number;
  performedManoeuvres?: string[];
}

/** Current snapshot format version (M59). Bump on any non-additive
 *  change to the serialised shape (renames, removals, semantic
 *  changes). Additive changes (new optional fields read with `?? default`)
 *  do NOT require a bump. */
export const SNAPSHOT_VERSION = 1 as const;

export interface SerializedKernelSnapshot {
  v: typeof SNAPSHOT_VERSION;
  clockMin: number;
  isRunning: boolean;
  isShiftOver: boolean;
  episodeId: string;
  cases: SerializedCaseRuntime[];
  revealedArcIds: string[];
  firedEventIds: string[];
  unfiredEventIds: string[];
  log: LogEntry[];
}

/**
 * Bring an unknown snapshot to the current SNAPSHOT_VERSION (M59).
 *
 * The shape today is straightforwardly v:1; this function exists so
 * that the moment a future change demands a v:2 schema (a rename, a
 * removal, a semantic change), the migration step is already in the
 * pipeline rather than retrofitted under pressure.
 *
 * Additive changes — new optional CaseRuntime fields read with
 * \`?? defaults\` on restore — still don't need a version bump.
 */
export function migrateSnapshot(raw: unknown): SerializedKernelSnapshot {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Snapshot is not a valid object.');
  }
  const snap = raw as { v?: unknown } & Record<string, unknown>;
  // Pre-M59 snapshots lacked the v field — treat as v:1 since the shape
  // was identical (the field existed in the type but wasn't enforced).
  const version = typeof snap.v === 'number' ? snap.v : 1;
  switch (version) {
    case 1:
      // Currently the same shape; future v:2 → v:1 rewrite would live here.
      return { ...(snap as object), v: 1 } as SerializedKernelSnapshot;
    default:
      throw new Error(
        `Snapshot version ${version} is newer than the kernel's SNAPSHOT_VERSION ${SNAPSHOT_VERSION}. ` +
          'Please update the app.',
      );
  }
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
        unlockedHistoryIds: new Set(),
        unlockedFindingIds: new Set(),
        sequenceErrors: new Set(),
        actionsAt: new Map(),
        branchChoices: new Map(),
        rapport: 0,
        consultantInterruptsFired: new Set(),
        performedManoeuvres: new Set(),
      });
    }
    this.state = {
      clockMin: 0,
      shiftDurationMin: opts.episode.shift_duration_min,
      isRunning: false,
      isShiftOver: false,
      episode: opts.episode,
      cases: caseMap,
      arcs: opts.arcs ?? new Map(),
      revealedArcIds: new Set(),
      unfiredEvents: [...opts.episode.scheduled_events].sort((a, b) => a.t_min - b.t_min),
      firedEventIds: new Set(),
      log: [{ t_min: 0, level: 'info', text: 'Shift handover received.' }],
      pendingInterrupt: null,
    };
    if (opts.restore) {
      this.applySnapshot(migrateSnapshot(opts.restore));
    }
  }

  /** Returns a JSON-safe snapshot of mutable state for persistence. */
  serialize(): SerializedKernelSnapshot {
    return {
      v: SNAPSHOT_VERSION,
      clockMin: this.state.clockMin,
      isRunning: this.state.isRunning,
      isShiftOver: this.state.isShiftOver,
      episodeId: this.state.episode.id,
      cases: [...this.state.cases.values()].map((cs) => ({
        caseId: cs.caseId,
        state: cs.state,
        enteredAt: cs.enteredAt,
        actions: [...cs.actions],
        asked: [...cs.asked],
        examined: [...cs.examined],
        ordered: [...cs.ordered.entries()],
        resulted: [...cs.resulted],
        workingDx: cs.workingDx,
        disposition: cs.disposition,
        reasons: [...cs.reasons],
        unlockedHistoryIds: [...cs.unlockedHistoryIds],
        unlockedFindingIds: [...cs.unlockedFindingIds],
        sequenceErrors: [...cs.sequenceErrors],
        actionsAt: [...cs.actionsAt.entries()],
        branchChoices: [...cs.branchChoices.entries()],
        rapport: cs.rapport,
        performedManoeuvres: [...cs.performedManoeuvres],
      })),
      revealedArcIds: [...this.state.revealedArcIds],
      firedEventIds: [...this.state.firedEventIds],
      unfiredEventIds: this.state.unfiredEvents.map((e) => e.id),
      log: [...this.state.log],
    };
  }

  private applySnapshot(snap: SerializedKernelSnapshot): void {
    if (snap.episodeId !== this.state.episode.id) {
      throw new Error(
        `Snapshot is for episode "${snap.episodeId}" but kernel was constructed for "${this.state.episode.id}".`,
      );
    }
    this.state.clockMin = snap.clockMin;
    this.state.isRunning = snap.isRunning;
    this.state.isShiftOver = snap.isShiftOver;
    for (const sc of snap.cases) {
      const cs = this.state.cases.get(sc.caseId);
      if (!cs) continue;
      cs.state = sc.state;
      cs.enteredAt = sc.enteredAt;
      cs.actions = new Set(sc.actions);
      cs.asked = new Set(sc.asked);
      cs.examined = new Set(sc.examined);
      cs.ordered = new Map(sc.ordered);
      cs.resulted = new Set(sc.resulted);
      cs.workingDx = sc.workingDx;
      cs.disposition = sc.disposition;
      cs.reasons = [...sc.reasons];
      cs.unlockedHistoryIds = new Set(sc.unlockedHistoryIds);
      cs.unlockedFindingIds = new Set(sc.unlockedFindingIds);
      cs.sequenceErrors = new Set(sc.sequenceErrors ?? []);
      cs.actionsAt = new Map(sc.actionsAt ?? []);
      cs.branchChoices = new Map(sc.branchChoices ?? []);
      cs.rapport = sc.rapport ?? 0;
      cs.performedManoeuvres = new Set(sc.performedManoeuvres ?? []);
    }
    this.state.revealedArcIds = new Set(snap.revealedArcIds);
    this.state.firedEventIds = new Set(snap.firedEventIds);
    this.state.unfiredEvents = this.state.episode.scheduled_events.filter((e) =>
      snap.unfiredEventIds.includes(e.id),
    );
    this.state.unfiredEvents.sort((a, b) => a.t_min - b.t_min);
    this.state.log = [...snap.log];
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
    this.checkAllArcReveals();
    this.checkUnsafeMidshiftInterrupt();

    if (this.state.clockMin >= this.state.shiftDurationMin) {
      this.state.isRunning = false;
      this.state.isShiftOver = true;
      this.log('info', 'Shift over.');
    }

    this.notify();
  }

  /**
   * Drop the pending bedside interrupt (M39). Called by the UI when
   * the player dismisses the McGrath modal. Idempotent.
   */
  dismissConsultantInterrupt(): void {
    if (this.state.pendingInterrupt === null) return;
    this.state.pendingInterrupt = null;
    this.notify();
  }

  /**
   * Emit a bedside interrupt onto the kernel state. UI subscribes via
   * \`pendingInterrupt\`. The composer (state/consultantInterrupts.ts)
   * picks the line; the kernel owns the trigger ledger.
   */
  private emitInterrupt(
    trigger: 'trap_caught' | 'deterioration_takeover' | 'unsafe_midshift',
    cs: CaseRuntime,
    ctx: Omit<InterruptContext, 'caseName'>,
  ): void {
    const fullCtx: InterruptContext = { caseName: cs.data.title, ...ctx };
    const composed =
      trigger === 'trap_caught'
        ? composeTrapCaughtInterrupt(fullCtx)
        : trigger === 'deterioration_takeover'
          ? composeDeteriorationTakeoverInterrupt(fullCtx)
          : composeUnsafeMidshiftInterrupt(fullCtx);
    this.state.pendingInterrupt = {
      id: `${trigger}_${cs.caseId}_${this.state.clockMin}`,
      trigger,
      caseId: cs.caseId,
      caseName: cs.data.title,
      line: composed.line,
      aside: composed.aside,
    };
    this.log(
      'warn',
      `Dr McGrath (bedside): ${composed.line.replace(/\s+/g, ' ').slice(0, 80)}…`,
      cs.caseId,
    );
  }

  /**
   * Once per shift, at the half-clock mark, McGrath pulls the player
   * aside if any attended case is already arrested or deceased. The
   * interrupt is purely supportive — no penalty, no choice. Fires
   * at most once per kernel via the 'unsafe_midshift' ledger entry
   * on the first available case.
   */
  private checkUnsafeMidshiftInterrupt(): void {
    if (this.state.pendingInterrupt) return;
    if (this.state.clockMin < Math.floor(this.state.shiftDurationMin / 2)) return;
    for (const cs of this.state.cases.values()) {
      if (cs.enteredAt === null) continue;
      if (cs.consultantInterruptsFired.has('unsafe_midshift')) continue;
      if (cs.state !== 'arrested' && cs.state !== 'deceased') continue;
      cs.consultantInterruptsFired.add('unsafe_midshift');
      this.emitInterrupt('unsafe_midshift', cs, {});
      return; // one beat at a time
    }
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
      cs.actionsAt.delete(actionId);
    } else {
      cs.actions.add(actionId);
      cs.actionsAt.set(actionId, this.state.clockMin);
      this.log('info', `Action: ${actionLabel(cs, actionId)}.`, caseId);
      // Sequence check: any unmet prereq → mark as out-of-order (M20).
      const action = cs.data.management.find((m) => m.id === actionId);
      const missing = (action?.prereq_action_ids ?? []).filter((p) => !cs.actions.has(p));
      if (missing.length > 0) {
        cs.sequenceErrors.add(actionId);
        const missingNames = missing.map((mid) => actionLabel(cs, mid)).join(', ');
        cs.reasons.push(
          `Sequence error: ${actionLabel(cs, actionId)} taken before ${missingNames}.`,
        );
        this.log(
          'danger',
          `Sequence error — ${actionLabel(cs, actionId)} before ${missingNames}.`,
          caseId,
        );
      }
      // M39: McGrath steps in if the player ticks an examiner trap.
      // Fires once per case to avoid being preachy across replays.
      if (action?.must_not_do && !cs.consultantInterruptsFired.has('trap_caught')) {
        cs.consultantInterruptsFired.add('trap_caught');
        this.emitInterrupt('trap_caught', cs, { actionName: action.name });
      }
    }
    this.checkTransitions(cs);
    this.checkAllArcReveals();
    this.notify();
  }

  recordAsk(caseId: string, hxId: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    cs.asked.add(hxId);
    // Apply push-driven dialogue unlocks: asking an item with `reveals: [...]`
    // makes those history ids available regardless of their prereqs.
    const item = cs.data.history.find((h) => h.id === hxId);
    if (item?.reveals) {
      for (const r of item.reveals) cs.unlockedHistoryIds.add(r);
    }
    this.checkAllArcReveals();
    this.notify();
  }

  /**
   * Record the player's pick among a history item's branch_choices
   * (M34). Idempotent — choosing again is a no-op. Clamps rapport to
   * −3..+3 to keep the gauge in range.
   */
  pickBranchChoice(caseId: string, hxId: string, choiceId: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    if (cs.branchChoices.has(hxId)) return;
    const item = cs.data.history.find((h) => h.id === hxId);
    const choice = item?.branch_choices?.find((c) => c.id === choiceId);
    if (!choice) return;
    cs.branchChoices.set(hxId, choiceId);
    if (choice.rapport_delta) {
      cs.rapport = Math.max(-3, Math.min(3, cs.rapport + choice.rapport_delta));
    }
    this.notify();
  }

  /**
   * Record that the player performed a named examination manoeuvre
   * within a system (M40). Idempotent — the same manoeuvre can be
   * 'performed' multiple times without changing state. Reveals the
   * manoeuvre's findings on the encounter UI.
   */
  recordManoeuvre(caseId: string, system: string, manoeuvreId: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    const key = `${system}::${manoeuvreId}`;
    if (cs.performedManoeuvres.has(key)) return;
    cs.performedManoeuvres.add(key);
    this.notify();
  }

  recordExamine(caseId: string, system: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    cs.examined.add(system);
    this.checkTransitions(cs);
    this.checkAllArcReveals();
    this.notify();
  }

  orderInvestigation(caseId: string, ixId: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    if (cs.ordered.has(ixId)) return;
    cs.ordered.set(ixId, this.state.clockMin);
    const ix = cs.data.investigations.find((i) => i.id === ixId);
    this.log('info', `Ordered: ${ix?.name ?? ixId}.`, caseId);
    this.checkAllArcReveals();
    this.notify();
  }

  setWorkingDx(caseId: string, dx: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    cs.workingDx = dx;
    this.log('info', `Working dx: ${dx}.`, caseId);
    this.notify();
  }

  /** Clear a previously-set working diagnosis (e.g. player un-locks to re-think). */
  clearWorkingDx(caseId: string): void {
    const cs = this.state.cases.get(caseId);
    if (!cs) return;
    cs.workingDx = null;
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
        if (cs && cs.state === 'unseen') {
          cs.state = 'triaged';
          cs.reasons.push(`Arrived at T+${ev.t_min}.`);
        }
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
          // M39: McGrath takes over when a deterioration fires due to
          // missing actions. Fires once per case.
          if (!cs.consultantInterruptsFired.has('deterioration_takeover')) {
            cs.consultantInterruptsFired.add('deterioration_takeover');
            const missingActionLabels = ev.required_action_ids
              .filter((a) => !cs.actions.has(a))
              .map((id) => actionLabel(cs, id));
            this.emitInterrupt('deterioration_takeover', cs, {
              missingActionLabels,
              newState: cs.state,
            });
          }
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
        this.revealArc(ev.arc_id, `scheduled at T+${ev.t_min}`);
        break;
      }
    }
  }

  private checkAllArcReveals(): void {
    for (const arc of this.state.arcs.values()) {
      if (this.state.revealedArcIds.has(arc.id)) continue;
      for (const trigger of arc.reveals) {
        if (this.arcTriggerMatches(trigger)) {
          this.revealArc(arc.id, `${trigger.on} trigger`);
          break;
        }
      }
    }
  }

  private revealArc(arcId: string, why: string): void {
    if (this.state.revealedArcIds.has(arcId)) return;
    const arc = this.state.arcs.get(arcId);
    if (!arc) return;
    this.state.revealedArcIds.add(arcId);
    this.log('warn', `Arc reveal — ${arc.title} (${why}).`);
    for (const effect of arc.effects) {
      const cs = this.state.cases.get(effect.on_case_id);
      if (!cs) continue;
      if (effect.unlocks_history_id) {
        cs.unlockedHistoryIds.add(effect.unlocks_history_id);
      }
      if (effect.unlocks_finding_id) {
        cs.unlockedFindingIds.add(effect.unlocks_finding_id);
      }
      if (effect.changes_state_to && !TERMINAL_STATES.has(cs.state)) {
        const prev = cs.state;
        cs.state = effect.changes_state_to;
        cs.reasons.push(`Arc "${arc.title}" changed state ${prev} → ${cs.state}.`);
        this.log('info', `${cs.data.title}: ${prev} → ${cs.state} (arc effect).`, cs.caseId);
      }
      if (effect.note) cs.reasons.push(`Arc: ${effect.note}`);
    }
  }

  private arcTriggerMatches(trigger: ArcRevealTriggerT): boolean {
    switch (trigger.on) {
      case 'clock_time':
        return this.state.clockMin >= trigger.t_min;
      case 'action': {
        const cs = this.state.cases.get(trigger.in_case_id);
        return !!cs && cs.actions.has(trigger.action_id);
      }
      case 'history_asked': {
        const cs = this.state.cases.get(trigger.in_case_id);
        return !!cs && cs.asked.has(trigger.history_id);
      }
      case 'examined': {
        const cs = this.state.cases.get(trigger.in_case_id);
        return !!cs && cs.examined.has(trigger.system);
      }
      case 'finding': {
        const cs = this.state.cases.get(trigger.in_case_id);
        return !!cs && cs.examined.has(trigger.finding_id);
      }
      case 'investigation_back': {
        const cs = this.state.cases.get(trigger.in_case_id);
        return !!cs && cs.resulted.has(trigger.investigation_id);
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

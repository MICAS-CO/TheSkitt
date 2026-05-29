import { useMemo } from 'react';
import { EdFloorplan, type FloorplanPatient } from './EdFloorplan';
import { useSim, type SimSpeedKey } from '../../state/sim';
import { ClockBar } from './ClockBar';
import type { CaseRuntime, LogEntry } from '../../sim/kernel';

interface Props {
  onEnterCase: (caseId: string) => void;
  onFinishShift: () => void;
  onSwitchToBoard: () => void;
  onExit: () => void;
  speedKey: SimSpeedKey;
  onSpeedChange: (k: SimSpeedKey) => void;
}

/**
 * Diegetic department view — static SVG floorplan with patient cards in
 * the bays they're sitting in. Click a card to enter that encounter.
 * Mirrors the board's controls so the player never feels like they've
 * left the shift to look at the hub.
 *
 * M92: replaced the Phaser walk-around with `EdFloorplan` — same bay
 * geometry from `ED_ZONES`, same card-in-bay rendering, no canvas, no
 * walk-cycle.
 */
export function ShiftHubScreen({
  onEnterCase,
  onFinishShift,
  onSwitchToBoard,
  onExit,
  speedKey,
  onSpeedChange,
}: Props) {
  const tick = useSim((s) => s.tick);
  const kernel = useSim((s) => s.kernel);

  const floorplanPatients = useMemo<FloorplanPatient[]>(() => {
    if (!kernel) return [];
    // `tick` is read so the linter and React both know this recomputes
    // on every kernel notify; the body reads kernel state imperatively.
    void tick;
    const ks = kernel.getState();
    const patients: FloorplanPatient[] = [];
    const focusSet = new Set(ks.episode.focus_cases);
    for (const cs of ks.cases.values()) {
      if (cs.state === 'unseen' || !cs.data.bay) continue;
      patients.push({
        caseId: cs.caseId,
        // M81: hub-card title is chief_complaint, not the spoiler-y
        // clinical title.
        title: cs.data.chief_complaint,
        bay: cs.data.bay,
        state: cs.state,
        triageCategory: cs.data.triage_category,
        isAmbient: !focusSet.has(cs.caseId),
      });
    }
    return patients;
  }, [kernel, tick]);

  if (!kernel) return null;
  const ks = kernel.getState();

  const focusCases = ks.episode.focus_cases
    .map((id) => ks.cases.get(id))
    .filter((c): c is CaseRuntime => !!c);
  const allDispositioned = focusCases.every((c) => c.disposition !== null);
  const allEntered = focusCases.every((c) => c.enteredAt !== null);

  return (
    <div className="enc">
      <header className="enc__head">
        <div>
          <div className="enc__head-title">{ks.episode.title} — department view</div>
          <div className="enc__head-meta">
            {ks.episode.focus_cases.length} focus case
            {ks.episode.focus_cases.length === 1 ? '' : 's'}
            {ks.episode.ambient_cases.length > 0
              ? ` · ${ks.episode.ambient_cases.length} ambient`
              : ''}{' '}
            · T+{ks.clockMin}m / {ks.shiftDurationMin}m
          </div>
        </div>
        <div className="enc__head-actions">
          <button onClick={onSwitchToBoard}>↥ board view</button>
          <button onClick={onExit}>← menu</button>
        </div>
      </header>

      <ClockBar
        clockMin={ks.clockMin}
        shiftDurationMin={ks.shiftDurationMin}
        isRunning={ks.isRunning}
        isShiftOver={ks.isShiftOver}
        onPlay={() => kernel.start()}
        onPause={() => kernel.pause()}
        onSkip={() => kernel.advance(1)}
        speedKey={speedKey}
        onSpeedChange={onSpeedChange}
      />

      <div className="hub">
        <div className="hub__floorplan">
          <EdFloorplan
            patients={floorplanPatients}
            clockLabel={`T+${ks.clockMin}m / ${ks.shiftDurationMin}m`}
            onCaseClick={onEnterCase}
          />
        </div>
        <ShiftLog log={ks.log} />
      </div>

      <div className="board__finish">
        <button
          className="enc__primary"
          onClick={onFinishShift}
          disabled={!allEntered && !allDispositioned}
        >
          {allDispositioned ? 'End shift — debrief' : 'End shift early — debrief'}
        </button>
      </div>
    </div>
  );
}

function ShiftLog({ log }: { log: LogEntry[] }) {
  const latest = log[log.length - 1];
  return (
    <aside className="enc__log" aria-label="Shift log">
      <h3 className="enc__log-title">Shift log</h3>
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {latest ? `T+${latest.t_min} minutes — ${latest.text}` : ''}
      </div>
      <ol className="enc__log-list">
        {log.map((e, i) => (
          <li key={i} className={`enc__log-entry enc__log-entry--${e.level}`}>
            <span className="enc__log-time">T+{e.t_min}m</span>
            <span>{e.text}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

import { useMemo } from 'react';
import { PhaserGame } from '../PhaserGame';
import { useSim, SIM_SPEEDS, type SimSpeedKey } from '../../state/sim';
import type { CaseRuntime, LogEntry } from '../../sim/kernel';
import type { HubPatient, EDSceneData } from '../../game/scenes/EDScene';

interface Props {
  onEnterCase: (caseId: string) => void;
  onFinishShift: () => void;
  onSwitchToBoard: () => void;
  onExit: () => void;
  speedKey: SimSpeedKey;
  onSpeedChange: (k: SimSpeedKey) => void;
}

/**
 * Diegetic department view — Phaser scene renders patient cards in the
 * bays they're sitting in. Click a card to enter that encounter. Mirrors
 * the board's controls so the player never feels like they've left the
 * shift to look at the hub.
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

  const sceneData = useMemo<EDSceneData | undefined>(() => {
    if (!kernel) return undefined;
    // `tick` is read so the linter and React both know this recomputes
    // on every kernel notify; the body reads kernel state imperatively.
    void tick;
    const ks = kernel.getState();
    const patients: HubPatient[] = [];
    const focusSet = new Set(ks.episode.focus_cases);
    for (const cs of ks.cases.values()) {
      if (cs.state === 'unseen' || !cs.data.bay) continue;
      patients.push({
        caseId: cs.caseId,
        title: cs.data.title,
        bay: cs.data.bay,
        state: cs.state,
        triageCategory: cs.data.triage_category,
        isAmbient: !focusSet.has(cs.caseId),
      });
    }
    return {
      patients,
      clockLabel: `T+${ks.clockMin}m / ${ks.shiftDurationMin}m`,
      onCaseClick: onEnterCase,
    };
  }, [kernel, onEnterCase, tick]);

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
        <div className="hub__phaser">
          <PhaserGame sceneData={sceneData} />
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

function ClockBar({
  clockMin,
  shiftDurationMin,
  isRunning,
  isShiftOver,
  onPlay,
  onPause,
  onSkip,
  speedKey,
  onSpeedChange,
}: {
  clockMin: number;
  shiftDurationMin: number;
  isRunning: boolean;
  isShiftOver: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  speedKey: SimSpeedKey;
  onSpeedChange: (k: SimSpeedKey) => void;
}) {
  const pct = Math.min(100, Math.round((clockMin / shiftDurationMin) * 100));
  return (
    <div className="enc__clock">
      <div className="enc__clock-bar" aria-hidden>
        <div className="enc__clock-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="enc__clock-row">
        <span className="enc__clock-text">
          T+{clockMin}m / {shiftDurationMin}m {isShiftOver ? '· shift over' : ''}
        </span>
        <div className="enc__clock-buttons">
          <label className="enc__speed">
            <span className="enc__speed-label">speed</span>
            <select value={speedKey} onChange={(e) => onSpeedChange(e.target.value as SimSpeedKey)}>
              {Object.entries(SIM_SPEEDS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          {!isRunning && !isShiftOver && (
            <button onClick={onPlay} title="Start (spacebar)">
              ▶ start
            </button>
          )}
          {isRunning && !isShiftOver && (
            <button onClick={onPause} title="Pause (spacebar)">
              ❚❚ pause
            </button>
          )}
          {!isShiftOver && <button onClick={onSkip}>+1m</button>}
        </div>
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

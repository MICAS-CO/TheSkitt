import { SIM_SPEEDS, type SimSpeedKey } from '../../state/sim';

interface Props {
  clockMin: number;
  shiftDurationMin: number;
  isRunning: boolean;
  isShiftOver: boolean;
  /** M85 — clock is shielded from real-time advance because the player
   *  is in a reasoning section. Renders a visual cue. */
  autoPaused?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  speedKey: SimSpeedKey;
  onSpeedChange: (k: SimSpeedKey) => void;
}

export function ClockBar({
  clockMin,
  shiftDurationMin,
  isRunning,
  isShiftOver,
  autoPaused = false,
  onPlay,
  onPause,
  onSkip,
  speedKey,
  onSpeedChange,
}: Props) {
  const pct = Math.min(100, Math.round((clockMin / shiftDurationMin) * 100));
  return (
    <div className={`enc__clock ${autoPaused ? 'enc__clock--auto-paused' : ''}`}>
      <div
        className="enc__clock-bar"
        role="progressbar"
        aria-valuenow={clockMin}
        aria-valuemin={0}
        aria-valuemax={shiftDurationMin}
        aria-label={`Shift clock: ${clockMin} of ${shiftDurationMin} minutes${
          autoPaused ? ' (paused — thinking time)' : ''
        }`}
      >
        <div className="enc__clock-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="enc__clock-row">
        <span className="enc__clock-text">
          T+{clockMin}m / {shiftDurationMin}m
          {isShiftOver
            ? ' · shift over'
            : autoPaused
              ? ' · thinking time (clock paused)'
              : ''}
        </span>
        <div className="enc__clock-buttons">
          <SpeedSelect value={speedKey} onChange={onSpeedChange} />
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

function SpeedSelect({
  value,
  onChange,
}: {
  value: SimSpeedKey;
  onChange: (k: SimSpeedKey) => void;
}) {
  return (
    <label className="enc__speed">
      <span className="enc__speed-label">speed</span>
      <select value={value} onChange={(e) => onChange(e.target.value as SimSpeedKey)}>
        {Object.entries(SIM_SPEEDS).map(([k, v]) => (
          <option key={k} value={k}>
            {v.label}
          </option>
        ))}
      </select>
    </label>
  );
}

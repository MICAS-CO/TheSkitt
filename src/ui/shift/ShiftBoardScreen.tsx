import { useSim } from '../../state/sim';
import type { CaseRuntime, LogEntry } from '../../sim/kernel';

interface Props {
  onEnterCase: (caseId: string) => void;
  onExit: () => void;
}

export function ShiftBoardScreen({ onEnterCase, onExit }: Props) {
  useSim((s) => s.tick);
  const kernel = useSim((s) => s.kernel);
  if (!kernel) return null;

  const ks = kernel.getState();
  const visible = [...ks.cases.values()].filter((c) => c.state !== 'unseen');
  const unseen = [...ks.cases.values()].filter((c) => c.state === 'unseen').length;

  return (
    <div className="enc">
      <header className="enc__head">
        <div>
          <div className="enc__head-title">{ks.episode.title}</div>
          <div className="enc__head-meta">
            {ks.episode.focus_cases.length} focus case
            {ks.episode.focus_cases.length === 1 ? '' : 's'}
            {ks.arcs.size > 0 ? ` · ${ks.arcs.size} arc${ks.arcs.size === 1 ? '' : 's'}` : ''} · T+
            {ks.clockMin}m / {ks.shiftDurationMin}m
          </div>
        </div>
        <button className="enc__exit" onClick={onExit}>
          ← menu
        </button>
      </header>

      <ClockBar
        clockMin={ks.clockMin}
        shiftDurationMin={ks.shiftDurationMin}
        isRunning={ks.isRunning}
        isShiftOver={ks.isShiftOver}
        onPlay={() => kernel.start()}
        onPause={() => kernel.pause()}
        onSkip={() => kernel.advance(1)}
      />

      <div className="enc__split">
        <main className="board">
          <h2 className="board__title">Shift board</h2>
          {visible.length === 0 ? (
            <p className="enc__hint">
              No patients yet — press <strong>▶ start</strong> to begin the shift.
            </p>
          ) : (
            <ul className="board__cases">
              {visible.map((c) => (
                <CaseCard key={c.caseId} cs={c} clockMin={ks.clockMin} onEnter={onEnterCase} />
              ))}
            </ul>
          )}
          {unseen > 0 && (
            <p className="enc__hint">
              {unseen} more patient{unseen === 1 ? '' : 's'} expected to triage.
            </p>
          )}
        </main>

        <ShiftLog log={ks.log} />
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
}: {
  clockMin: number;
  shiftDurationMin: number;
  isRunning: boolean;
  isShiftOver: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
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
          {!isRunning && !isShiftOver && <button onClick={onPlay}>▶ start</button>}
          {isRunning && !isShiftOver && <button onClick={onPause}>❚❚ pause</button>}
          {!isShiftOver && <button onClick={onSkip}>+1m</button>}
        </div>
      </div>
    </div>
  );
}

function CaseCard({
  cs,
  clockMin,
  onEnter,
}: {
  cs: CaseRuntime;
  clockMin: number;
  onEnter: (id: string) => void;
}) {
  const minsSinceEntered = cs.enteredAt !== null ? clockMin - cs.enteredAt : null;
  const pendingIx = [...cs.ordered].filter(([id]) => !cs.resulted.has(id)).length;
  const resultedIx = cs.resulted.size;
  return (
    <li className={`board__card board__card--${cs.state}`}>
      <button className="board__card-btn" onClick={() => onEnter(cs.caseId)}>
        <div className="board__card-row">
          <span className="board__card-title">{cs.data.title}</span>
          <span className={`enc__chip enc__chip--state-${cs.state}`}>{cs.state}</span>
        </div>
        <div className="board__card-meta">
          {cs.data.demographics.age_value} {cs.data.demographics.age_unit} ·{' '}
          {cs.data.demographics.sex} · triage {cs.data.triage_category} · {cs.data.chief_complaint}
        </div>
        <div className="board__card-stats">
          {cs.enteredAt === null ? (
            <span className="board__card-stat board__card-stat--warn">awaiting clinician</span>
          ) : (
            <span className="board__card-stat">attending {minsSinceEntered}m</span>
          )}
          {pendingIx > 0 && (
            <span className="board__card-stat board__card-stat--warn">{pendingIx} pending ix</span>
          )}
          {resultedIx > 0 && <span className="board__card-stat">{resultedIx} ix back</span>}
          {cs.workingDx && (
            <span className="board__card-stat">working dx: {cs.workingDx.slice(0, 28)}…</span>
          )}
        </div>
      </button>
    </li>
  );
}

function ShiftLog({ log }: { log: LogEntry[] }) {
  return (
    <aside className="enc__log" aria-label="Shift log">
      <h3 className="enc__log-title">Shift log</h3>
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

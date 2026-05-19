import { useSim, type SimSpeedKey } from '../../state/sim';
import { ClockBar } from './ClockBar';
import type { CaseRuntime, LogEntry } from '../../sim/kernel';

interface Props {
  onEnterCase: (caseId: string) => void;
  onFinishShift: () => void;
  onSwitchToHub?: () => void;
  onExit: () => void;
  speedKey: SimSpeedKey;
  onSpeedChange: (k: SimSpeedKey) => void;
}

export function ShiftBoardScreen({
  onEnterCase,
  onFinishShift,
  onSwitchToHub,
  onExit,
  speedKey,
  onSpeedChange,
}: Props) {
  useSim((s) => s.tick);
  const kernel = useSim((s) => s.kernel);
  if (!kernel) return null;

  const ks = kernel.getState();
  const unseen = [...ks.cases.values()].filter((c) => c.state === 'unseen').length;

  const focusCases = ks.episode.focus_cases
    .map((id) => ks.cases.get(id))
    .filter((c): c is CaseRuntime => !!c);
  const ambientCases = ks.episode.ambient_cases
    .map((id) => ks.cases.get(id))
    .filter((c): c is CaseRuntime => !!c);
  const visibleFocus = focusCases.filter((c) => c.state !== 'unseen');
  const visibleAmbient = ambientCases.filter((c) => c.state !== 'unseen');
  const totalVisible = visibleFocus.length + visibleAmbient.length;
  const allDispositioned = focusCases.every((c) => c.disposition !== null);
  const allEntered = focusCases.every((c) => c.enteredAt !== null);

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
        <div className="enc__head-actions">
          {onSwitchToHub && <button onClick={onSwitchToHub}>↥ department view</button>}
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

      <div className="enc__split">
        <main className="board">
          {totalVisible === 0 ? (
            <p className="enc__hint">
              No patients yet — press <strong>▶ start</strong> to begin the shift.
            </p>
          ) : (
            <>
              {visibleFocus.length > 0 && (
                <>
                  <h2 className="board__title">Focus cases</h2>
                  <ul className="board__cases">
                    {visibleFocus.map((c) => (
                      <CaseCard
                        key={c.caseId}
                        cs={c}
                        clockMin={ks.clockMin}
                        onEnter={onEnterCase}
                      />
                    ))}
                  </ul>
                </>
              )}
              {visibleAmbient.length > 0 && (
                <>
                  <h3 className="board__subtitle">Ambient board</h3>
                  <p className="enc__hint">
                    Board pressure — they look stable now, but check on them before they go off.
                  </p>
                  <ul className="board__cases">
                    {visibleAmbient.map((c) => (
                      <CaseCard
                        key={c.caseId}
                        cs={c}
                        clockMin={ks.clockMin}
                        onEnter={onEnterCase}
                        ambient
                      />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
          {unseen > 0 && (
            <p className="enc__hint">
              {unseen} more patient{unseen === 1 ? '' : 's'} expected to triage.
            </p>
          )}

          <div className="board__finish">
            <button
              className="enc__primary"
              onClick={onFinishShift}
              disabled={!allEntered && !allDispositioned}
              title={
                allDispositioned
                  ? 'Everyone has a disposition — end the shift.'
                  : allEntered
                    ? "You've at least seen every case — end early if you're done."
                    : "Cases you haven't seen yet remain on the board."
              }
            >
              {allDispositioned ? 'End shift — debrief' : 'End shift early — debrief'}
            </button>
          </div>
        </main>

        <ShiftLog log={ks.log} />
      </div>
    </div>
  );
}

function CaseCard({
  cs,
  clockMin,
  onEnter,
  ambient = false,
}: {
  cs: CaseRuntime;
  clockMin: number;
  onEnter: (id: string) => void;
  ambient?: boolean;
}) {
  const minsSinceEntered = cs.enteredAt !== null ? clockMin - cs.enteredAt : null;
  const pendingIx = [...cs.ordered].filter(([id]) => !cs.resulted.has(id)).length;
  const resultedIx = cs.resulted.size;
  return (
    <li className={`board__card board__card--${cs.state} ${ambient ? 'board__card--ambient' : ''}`}>
      <button className="board__card-btn" onClick={() => onEnter(cs.caseId)}>
        <div className="board__card-row">
          <span className="board__card-title">
            {ambient && <span className="board__card-tag">ambient</span>}
            {cs.data.title}
          </span>
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

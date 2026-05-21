import { useSim, type SimSpeedKey } from '../../state/sim';
import { ClockBar } from './ClockBar';
import { PreShiftHandover } from './PreShiftHandover';
import type { CaseRuntime, KernelState, LogEntry } from '../../sim/kernel';
import { deriveVitals, news2 } from '../../sim/vitals';
import { IconCountdown, IconRedFlag } from '../../style/icons';
import { hasPerk } from '../../state/progression';
import { ROTA_ORDER_IDS } from '../../state/rotaOrder';

interface Props {
  onEnterCase: (caseId: string) => void;
  onFinishShift: () => void;
  onSwitchToHub?: () => void;
  onExit: () => void;
  speedKey: SimSpeedKey;
  onSpeedChange: (k: SimSpeedKey) => void;
  /** M88 — Akin handover dismiss state lifted from ShiftView so the
   *  handover stays collapsed across board ↔ encounter navigation. */
  handoverDismissed: boolean;
  onHandoverDismissChange: (dismissed: boolean) => void;
}

export function ShiftBoardScreen({
  onEnterCase,
  onFinishShift,
  onSwitchToHub,
  onExit,
  speedKey,
  onSpeedChange,
  handoverDismissed,
  onHandoverDismissChange,
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

      {/* M88 (Braintrust 10) — Charge nurse Akin's pre-shift handover.
          Renders only when authored content exists for this rota
          position; otherwise the component returns null. Dismissible.
          Dismiss state is lifted to ShiftView so it survives
          board ↔ encounter navigation (round-1 reviewer caught the
          local-state remount bug). */}
      <PreShiftHandover
        rotaIndex={ROTA_ORDER_IDS.indexOf(ks.episode.id)}
        dismissed={handoverDismissed}
        onDismissChange={onHandoverDismissChange}
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
                        ks={ks}
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
                        ks={ks}
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
  ks,
  clockMin,
  onEnter,
  ambient = false,
}: {
  cs: CaseRuntime;
  ks: KernelState;
  clockMin: number;
  onEnter: (id: string) => void;
  ambient?: boolean;
}) {
  const minsSinceEntered = cs.enteredAt !== null ? clockMin - cs.enteredAt : null;
  const pendingIx = [...cs.ordered].filter(([id]) => !cs.resulted.has(id)).length;
  const resultedIx = cs.resulted.size;

  // Live mini-vitals readout — gives the player a triage-by-acuity feel
  // without having to enter the encounter.
  const vitals = deriveVitals(cs.state, cs.data.vitals);
  const score = news2(vitals);
  const newsBand = score.total >= 7 ? 'red' : score.total >= 5 ? 'amber' : 'green';

  // Live deterioration timer: any unfired deterioration_if_not_x_by_t
  // for this case with at least one required action still missing.
  const upcomingDeterioration = ks.unfiredEvents.find((e) => {
    if (e.type !== 'deterioration_if_not_x_by_t') return false;
    if (e.case_id !== cs.caseId) return false;
    return !e.required_action_ids.every((a) => cs.actions.has(a));
  });
  const deteriorationRemaining = upcomingDeterioration
    ? Math.max(0, upcomingDeterioration.t_min - clockMin)
    : null;
  const reflex = hasPerk('perk_resus_reflex');
  const detTone =
    deteriorationRemaining === null
      ? null
      : deteriorationRemaining <= (reflex ? 3 : 2)
        ? 'critical'
        : deteriorationRemaining <= (reflex ? 6 : 5)
          ? 'warn'
          : 'info';

  return (
    <li className={`board__card board__card--${cs.state} ${ambient ? 'board__card--ambient' : ''}`}>
      <button className="board__card-btn" onClick={() => onEnter(cs.caseId)}>
        <div className="board__card-row">
          {/* M81: board card title is chief_complaint (the triage line),
              NEVER cs.data.title which names the diagnosis. */}
          <span className="board__card-title">
            {ambient && <span className="board__card-tag">ambient</span>}
            {cs.data.chief_complaint}
          </span>
          <span className={`enc__chip enc__chip--state-${cs.state}`}>{cs.state}</span>
        </div>
        <div className="board__card-meta">
          {cs.data.demographics.age_value} {cs.data.demographics.age_unit} ·{' '}
          {cs.data.demographics.sex} · triage {cs.data.triage_category}
        </div>

        <BoardMiniVitals
          v={vitals}
          newsTotal={score.total}
          newsBand={newsBand}
          arrested={cs.state === 'arrested' || cs.state === 'deceased'}
        />

        {detTone && deteriorationRemaining !== null && (
          <div className={`board__card-det board__card-det--${detTone}`}>
            <IconCountdown size={12} title="Deterioration imminent" />
            <span>
              <strong>{deteriorationRemaining} min</strong> to critical interventions
            </span>
          </div>
        )}

        <div className="board__card-stats">
          {cs.enteredAt === null ? (
            <span className="board__card-stat board__card-stat--warn">
              <IconRedFlag size={10} fill="#E0A82E" /> awaiting clinician
            </span>
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

function BoardMiniVitals({
  v,
  newsTotal,
  newsBand,
  arrested,
}: {
  v: ReturnType<typeof deriveVitals>;
  newsTotal: number;
  newsBand: 'green' | 'amber' | 'red';
  arrested: boolean;
}) {
  return (
    <div className={`board__vitals board__vitals--${newsBand}`} aria-label="Current vitals">
      <span className="board__vitals-tile">
        <span className="board__vitals-label">HR</span>
        <span className="board__vitals-value">{arrested ? '—' : (v.hr ?? '—')}</span>
      </span>
      <span className="board__vitals-tile">
        <span className="board__vitals-label">BP</span>
        <span className="board__vitals-value">
          {arrested ? '—' : `${v.bp_sys ?? '—'}/${v.bp_dia ?? '—'}`}
        </span>
      </span>
      <span className="board__vitals-tile">
        <span className="board__vitals-label">SpO₂</span>
        <span className="board__vitals-value">
          {arrested ? '—' : v.spo2 !== undefined ? `${v.spo2}%` : '—'}
        </span>
      </span>
      <span className="board__vitals-tile">
        <span className="board__vitals-label">GCS</span>
        <span className="board__vitals-value">{v.gcs ?? '—'}</span>
      </span>
      <span className="board__vitals-tile board__vitals-tile--news">
        <span className="board__vitals-label">NEWS2</span>
        <span className="board__vitals-value">{newsTotal}</span>
      </span>
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

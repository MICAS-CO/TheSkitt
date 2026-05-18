import { useEffect, useMemo } from 'react';
import { useSim, scoreCase, SIM_SPEEDS, type ScoreReport, type SimSpeedKey } from '../../state/sim';
import type { CitationT } from '../../content/schema';
import type { CaseRuntime, LogEntry } from '../../sim/kernel';

export type Phase =
  | 'vignette'
  | 'history'
  | 'examination'
  | 'investigations'
  | 'differential'
  | 'management'
  | 'disposition'
  | 'debrief';

const PHASE_ORDER: Phase[] = [
  'vignette',
  'history',
  'examination',
  'investigations',
  'differential',
  'management',
  'disposition',
  'debrief',
];

const PHASE_LABELS: Record<Phase, string> = {
  vignette: 'Arrival',
  history: 'History',
  examination: 'Examination',
  investigations: 'Investigations',
  differential: 'Differential',
  management: 'Management',
  disposition: 'Disposition',
  debrief: 'Debrief',
};

interface Props {
  caseId: string;
  phase: Phase;
  onPhaseChange: (p: Phase) => void;
  onBackToBoard: () => void;
  onExit: () => void;
  speedKey: SimSpeedKey;
  onSpeedChange: (k: SimSpeedKey) => void;
}

export function EncounterScreen({
  caseId,
  phase,
  onPhaseChange,
  onBackToBoard,
  onExit,
  speedKey,
  onSpeedChange,
}: Props) {
  useSim((s) => s.tick);
  const kernel = useSim((s) => s.kernel);
  const cs = kernel?.getState().cases.get(caseId) ?? null;
  const ks = kernel?.getState();
  const isRunning = ks?.isRunning ?? false;
  const isShiftOver = ks?.isShiftOver ?? false;

  // Auto-jump to debrief when the shift ends
  useEffect(() => {
    if (isShiftOver && phase !== 'debrief') onPhaseChange('debrief');
  }, [isShiftOver, phase, onPhaseChange]);

  // Escape returns to the board (unless editing a form control).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      onBackToBoard();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBackToBoard]);

  if (!kernel || !cs || !ks) {
    return (
      <div className="enc">
        <p>No case loaded.</p>
        <button onClick={onExit}>Back</button>
      </div>
    );
  }

  const idx = PHASE_ORDER.indexOf(phase);
  const isFirst = phase === 'vignette';
  const isDebrief = phase === 'debrief';
  const cannotAdvance =
    (phase === 'differential' && !cs.workingDx) || (phase === 'disposition' && !cs.disposition);

  function next() {
    if (idx < PHASE_ORDER.length - 1) onPhaseChange(PHASE_ORDER[idx + 1]!);
  }
  function prev() {
    if (idx > 0) onPhaseChange(PHASE_ORDER[idx - 1]!);
  }

  return (
    <div className="enc">
      <EncounterHeader
        cs={cs}
        clockMin={ks.clockMin}
        onBackToBoard={onBackToBoard}
        onExit={onExit}
      />
      <ClockControls
        clockMin={ks.clockMin}
        shiftDurationMin={ks.shiftDurationMin}
        isRunning={isRunning}
        isShiftOver={isShiftOver}
        onPlay={() => kernel.start()}
        onPause={() => kernel.pause()}
        onSkip={() => kernel.advance(1)}
        speedKey={speedKey}
        onSpeedChange={onSpeedChange}
      />

      <PhaseProgress phase={phase} />

      <div className="enc__split">
        <main className="enc__body">
          {phase === 'vignette' && <VignettePhase cs={cs} />}
          {phase === 'history' && (
            <HistoryPhase cs={cs} onAsk={(id) => kernel.recordAsk(caseId, id)} />
          )}
          {phase === 'examination' && (
            <ExaminationPhase cs={cs} onExamine={(s) => kernel.recordExamine(caseId, s)} />
          )}
          {phase === 'investigations' && (
            <InvestigationsPhase
              cs={cs}
              clockMin={ks.clockMin}
              onOrder={(id) => kernel.orderInvestigation(caseId, id)}
            />
          )}
          {phase === 'differential' && (
            <DifferentialPhase cs={cs} onChoose={(dx) => kernel.setWorkingDx(caseId, dx)} />
          )}
          {phase === 'management' && (
            <ManagementPhase cs={cs} onToggle={(id) => kernel.toggleAction(caseId, id)} />
          )}
          {phase === 'disposition' && (
            <DispositionPhase cs={cs} onChoose={(label) => kernel.setDisposition(caseId, label)} />
          )}
          {phase === 'debrief' && <DebriefPhase cs={cs} />}
        </main>

        <ShiftLog log={ks.log} caseId={caseId} />
      </div>

      <footer className="enc__foot">
        <button onClick={prev} disabled={isFirst}>
          ← back
        </button>
        {!isDebrief ? (
          <button className="enc__primary" onClick={next} disabled={cannotAdvance}>
            {phase === 'disposition' ? 'See debrief' : `next: ${nextPhaseLabel(phase)} →`}
          </button>
        ) : (
          <button className="enc__primary" onClick={onBackToBoard}>
            ← back to shift board
          </button>
        )}
      </footer>
    </div>
  );
}

// ─── Header / clock / progress / log ─────────────────────────────────────────

function EncounterHeader({
  cs,
  clockMin,
  onBackToBoard,
  onExit,
}: {
  cs: CaseRuntime;
  clockMin: number;
  onBackToBoard: () => void;
  onExit: () => void;
}) {
  const d = cs.data.demographics;
  return (
    <header className="enc__head">
      <div>
        <div className="enc__head-title">
          {cs.data.title}{' '}
          <span className={`enc__chip enc__chip--state-${cs.state}`}>{cs.state}</span>
        </div>
        <div className="enc__head-meta">
          {d.age_value} {d.age_unit} · {d.sex}
          {d.weight_kg ? ` · ${d.weight_kg} kg` : ''} · triage {cs.data.triage_category} · T+
          {clockMin}m
        </div>
      </div>
      <div className="enc__head-actions">
        <button onClick={onBackToBoard}>← board</button>
        <button onClick={onExit}>← menu</button>
      </div>
    </header>
  );
}

function ClockControls({
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

function PhaseProgress({ phase }: { phase: Phase }) {
  const idx = PHASE_ORDER.indexOf(phase);
  return (
    <ol className="enc__progress">
      {PHASE_ORDER.map((p, i) => (
        <li key={p} className={i === idx ? 'is-active' : i < idx ? 'is-done' : ''}>
          <span className="enc__progress-num">{i + 1}</span>
          <span className="enc__progress-label">{PHASE_LABELS[p]}</span>
        </li>
      ))}
    </ol>
  );
}

function ShiftLog({ log, caseId }: { log: LogEntry[]; caseId: string }) {
  // Most-recent entry announced via aria-live; the full list is below.
  const latest = log[log.length - 1];
  return (
    <aside className="enc__log" aria-label="Shift log">
      <h3 className="enc__log-title">Shift log</h3>
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {latest ? `T+${latest.t_min} minutes — ${latest.text}` : ''}
      </div>
      <ol className="enc__log-list">
        {log.map((e, i) => (
          <li
            key={i}
            className={`enc__log-entry enc__log-entry--${e.level} ${
              e.caseId === caseId ? 'enc__log-entry--this' : ''
            }`}
          >
            <span className="enc__log-time">T+{e.t_min}m</span>
            <span>{e.text}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

// ─── Phases ─────────────────────────────────────────────────────────────────

function VignettePhase({ cs }: { cs: CaseRuntime }) {
  const c = cs.data;
  return (
    <section className="enc__phase">
      <h2>Arrival</h2>
      <pre className="enc__vignette">{c.vignette}</pre>
      <details className="enc__details">
        <summary>Pre-existing PMH and meds (handover sheet)</summary>
        <ul>
          {c.demographics.pmh.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p>
          <strong>Meds:</strong> {c.demographics.medications.join(', ') || 'none'}
        </p>
        <p>
          <strong>Allergies:</strong> {c.demographics.allergies.join(', ') || 'NKDA'}
        </p>
        {c.demographics.social && (
          <p>
            <strong>Social:</strong> {c.demographics.social}
          </p>
        )}
      </details>
    </section>
  );
}

function HistoryPhase({ cs, onAsk }: { cs: CaseRuntime; onAsk: (id: string) => void }) {
  const kernel = useSim((s) => s.kernel)!;
  const ks = kernel.getState();
  const gatedIds = useMemo(() => gatedHistoryIds(cs.caseId, ks), [cs.caseId, ks]);

  const items = cs.data.history.filter(
    (h) => !gatedIds.has(h.id) || cs.unlockedHistoryIds.has(h.id),
  );
  const stillLocked = cs.data.history.filter(
    (h) => gatedIds.has(h.id) && !cs.unlockedHistoryIds.has(h.id),
  ).length;

  return (
    <section className="enc__phase">
      <h2>History</h2>
      <p className="enc__hint">
        Tap a topic to ask. You can ask all of them.
        {stillLocked > 0 && (
          <>
            {' '}
            <em>{stillLocked} more would open if an arc reveals.</em>
          </>
        )}
      </p>
      <ul className="enc__cards">
        {items.map((h) => {
          const isAsked = cs.asked.has(h.id);
          const isNewlyUnlocked = cs.unlockedHistoryIds.has(h.id) && !isAsked;
          return (
            <li
              key={h.id}
              className={`enc__card ${isAsked ? 'is-revealed' : ''} ${
                isNewlyUnlocked ? 'is-unlocked' : ''
              }`}
            >
              <button className="enc__card-head" onClick={() => onAsk(h.id)} disabled={isAsked}>
                <span className="enc__chip">{h.source.replace('_', ' ')}</span>
                <span>{h.topic}</span>
                {isNewlyUnlocked && <span className="enc__chip enc__chip--unlock">new</span>}
              </button>
              {isAsked && <p className="enc__card-body">{h.response}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ExaminationPhase({ cs, onExamine }: { cs: CaseRuntime; onExamine: (s: string) => void }) {
  return (
    <section className="enc__phase">
      <h2>Examination</h2>
      <p className="enc__hint">Select a system to examine.</p>
      <ul className="enc__cards">
        {cs.data.examination.map((e) => {
          const isExamined = cs.examined.has(e.system);
          return (
            <li key={e.system} className={`enc__card ${isExamined ? 'is-revealed' : ''}`}>
              <button
                className="enc__card-head"
                onClick={() => onExamine(e.system)}
                disabled={isExamined}
              >
                <span className="enc__chip">{e.system.replace('_', ' ')}</span>
                <span>{isExamined ? 'examined' : 'examine'}</span>
              </button>
              {isExamined && (
                <ul className="enc__findings">
                  {e.findings.map((f, i) => (
                    <li key={i}>
                      <strong>{f.name}</strong>
                      {f.value ? `: ${f.value}` : ''}
                      {f.pertinent_negative ? ' · (pertinent negative)' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function InvestigationsPhase({
  cs,
  clockMin,
  onOrder,
}: {
  cs: CaseRuntime;
  clockMin: number;
  onOrder: (id: string) => void;
}) {
  return (
    <section className="enc__phase">
      <h2>Investigations</h2>
      <p className="enc__hint">
        Results come back after the turnaround. The clock keeps running — order what you need early.
      </p>
      <ul className="enc__cards">
        {cs.data.investigations.map((ix) => {
          const orderedAt = cs.ordered.get(ix.id);
          const isOrdered = orderedAt !== undefined;
          const isResulted = cs.resulted.has(ix.id);
          const dueAt = orderedAt !== undefined ? orderedAt + ix.turnaround_min : null;
          const remaining = dueAt !== null ? Math.max(0, dueAt - clockMin) : null;
          return (
            <li
              key={ix.id}
              className={`enc__card ${isResulted ? 'is-revealed' : isOrdered ? 'is-pending' : ''}`}
            >
              <button
                className="enc__card-head"
                onClick={() => onOrder(ix.id)}
                disabled={isOrdered}
              >
                <span className="enc__chip">{ix.category}</span>
                <span>{ix.name}</span>
                <span className="enc__chip enc__chip--muted">
                  {isResulted
                    ? 'resulted'
                    : isOrdered
                      ? `pending (${remaining}m)`
                      : `~${ix.turnaround_min} min`}
                </span>
              </button>
              {isResulted && <pre className="enc__result">{ix.result_summary}</pre>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DifferentialPhase({ cs, onChoose }: { cs: CaseRuntime; onChoose: (dx: string) => void }) {
  return (
    <section className="enc__phase">
      <h2>Differential — pick your working diagnosis</h2>
      <p className="enc__hint">
        Use the discriminator to test each. The &ldquo;must-not-miss&rdquo; item isn&rsquo;t always
        the answer — but you should rule it out actively.
      </p>
      <ul className="enc__cards">
        {cs.data.differential.map((d) => {
          const isPicked = cs.workingDx === d.diagnosis;
          return (
            <li key={d.diagnosis} className={`enc__card ${isPicked ? 'is-revealed' : ''}`}>
              <button
                className="enc__card-head enc__card-head--toggle"
                onClick={() => onChoose(d.diagnosis)}
                data-picked={isPicked}
              >
                <span className={`enc__chip enc__chip--${d.likelihood}`}>
                  {d.likelihood.replace('_', ' ')}
                </span>
                <span>{d.diagnosis}</span>
              </button>
              <p className="enc__card-body">{d.discriminator}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ManagementPhase({ cs, onToggle }: { cs: CaseRuntime; onToggle: (id: string) => void }) {
  return (
    <section className="enc__phase">
      <h2>Management — tick what you do</h2>
      <p className="enc__hint">
        Some options are distractors. Actions count immediately — the patient&rsquo;s state may
        change.
      </p>
      <ul className="enc__cards">
        {cs.data.management.map((m) => {
          const isPicked = cs.actions.has(m.id);
          return (
            <li key={m.id} className={`enc__card ${isPicked ? 'is-picked' : ''}`}>
              <label className="enc__card-head enc__card-head--check">
                <input type="checkbox" checked={isPicked} onChange={() => onToggle(m.id)} />
                <span className="enc__chip">{m.category}</span>
                <span>{m.name}</span>
              </label>
              {m.detail && <p className="enc__card-body enc__card-body--dim">{m.detail}</p>}
              {m.drug && (
                <p className="enc__card-body">
                  <strong>Dose:</strong> {m.drug.amount} {m.drug.route} {m.drug.frequency}
                  {m.drug.paeds_dose ? ` · paeds: ${m.drug.paeds_dose}` : ''}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DispositionPhase({
  cs,
  onChoose,
}: {
  cs: CaseRuntime;
  onChoose: (label: string) => void;
}) {
  return (
    <section className="enc__phase">
      <h2>Disposition — where does this patient go now?</h2>
      <ul className="enc__cards">
        {cs.data.disposition_options.map((d) => {
          const isPicked = cs.disposition === d.label;
          return (
            <li key={d.label} className={`enc__card ${isPicked ? 'is-revealed' : ''}`}>
              <button
                className="enc__card-head enc__card-head--toggle"
                onClick={() => onChoose(d.label)}
                data-picked={isPicked}
              >
                <span>{d.label}</span>
              </button>
              <p className="enc__card-body">{d.criteria}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DebriefPhase({ cs }: { cs: CaseRuntime }) {
  const score = useMemo<ScoreReport>(() => scoreCase(cs), [cs]);
  const c = cs.data;

  return (
    <section className="enc__phase">
      <h2>Debrief — {c.title}</h2>
      <div className={`enc__score enc__score--${score.band}`}>
        <div className="enc__score-pct">{score.percent}%</div>
        <div className="enc__score-band">{score.band.toUpperCase()}</div>
        <ul className="enc__score-meta">
          <li>
            Must-do actions taken: <strong>{score.mustDoDone}</strong>/{score.mustDoTotal}
          </li>
          <li>
            Working diagnosis correct: <strong>{score.workingDxCorrect ? 'yes' : 'no'}</strong>
          </li>
          <li>
            Disposition appropriate: <strong>{score.dispositionCorrect ? 'yes' : 'no'}</strong>
          </li>
          <li>
            Final patient state: <strong>{cs.state}</strong>
          </li>
          {score.mustNotDoChosen > 0 && (
            <li className="enc__score-warn">
              <strong>Patient safety:</strong> picked {score.mustNotDoChosen} trap action(s).
            </li>
          )}
        </ul>
      </div>

      {cs.reasons.length > 0 && (
        <>
          <h3>What changed on the clock</h3>
          <ul className="enc__pearls">
            {cs.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </>
      )}

      <h3>Action-by-action</h3>
      <ul className="enc__breakdown">
        {score.details.map((d) => (
          <li key={d.mxId} className={`enc__breakdown-row enc__breakdown-row--${d.status}`}>
            <span className="enc__breakdown-status">{statusLabel(d.status)}</span>
            <span>{d.name}</span>
          </li>
        ))}
      </ul>

      <h3>Clinical pearls</h3>
      <ul className="enc__pearls">
        {c.pearls.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>

      <h3>Common pitfalls</h3>
      <ul className="enc__pitfalls">
        {c.pitfalls.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>

      <h3>Sources</h3>
      <ul className="enc__sources">
        {c.sources.map((s, i) => (
          <li key={i}>
            <CitationLine c={s} />
          </li>
        ))}
      </ul>

      <p className="enc__disclaimer">
        Study material. Not medical advice. Not a substitute for supervised clinical training.
      </p>
    </section>
  );
}

function nextPhaseLabel(phase: Phase): string {
  const i = PHASE_ORDER.indexOf(phase);
  const next = PHASE_ORDER[i + 1];
  return next ? PHASE_LABELS[next].toLowerCase() : '';
}

function statusLabel(s: 'done' | 'missed' | 'trap_avoided' | 'trap_picked') {
  switch (s) {
    case 'done':
      return '✓ done';
    case 'missed':
      return '✗ missed';
    case 'trap_avoided':
      return '✓ trap avoided';
    case 'trap_picked':
      return '✗ trap picked';
  }
}

function CitationLine({ c }: { c: CitationT }) {
  const head = c.type === 'nice' ? `NICE ${c.id}` : c.type.replace(/_/g, ' ').toUpperCase();
  return (
    <span>
      <strong>{head}</strong> — {c.ref}
      {c.type === 'textbook' && (c.chapter || c.page) && (
        <span>
          {' '}
          ({c.chapter ? `Ch ${c.chapter}` : ''}
          {c.chapter && c.page ? ', ' : ''}
          {c.page ?? ''})
        </span>
      )}
      {c.url && (
        <>
          {' '}
          <a href={c.url} target="_blank" rel="noreferrer">
            link
          </a>
        </>
      )}
    </span>
  );
}

/**
 * Compute the set of history ids on `caseId` that are gated by an unrevealed
 * arc's unlocks_history_id effect.
 */
function gatedHistoryIds(
  caseId: string,
  ks: ReturnType<NonNullable<ReturnType<typeof useSim.getState>['kernel']>['getState']>,
): Set<string> {
  const gated = new Set<string>();
  for (const arc of ks.arcs.values()) {
    if (ks.revealedArcIds.has(arc.id)) continue;
    for (const effect of arc.effects) {
      if (effect.on_case_id === caseId && effect.unlocks_history_id) {
        gated.add(effect.unlocks_history_id);
      }
    }
  }
  return gated;
}

import { useEffect, useMemo, useState } from 'react';
import { useSim, scoreCase, type ScoreReport, type SimSpeedKey } from '../../state/sim';
import type { CitationT } from '../../content/schema';
import type { CaseRuntime, KernelState, LogEntry } from '../../sim/kernel';
import { ClockBar } from '../shift/ClockBar';
import { PatientPanel } from './PatientPanel';
import { ResusMode } from './ResusMode';
import { IconCountdown, IconRedFlag } from '../../style/icons';
import { ResultsEnvelope } from '../../style/frames';

/**
 * Sections of the encounter. Replaces the old linear "phase pipeline":
 * the player picks any section at any time. Vignette is no longer a
 * section — it's a persistent card above the section tabs.
 */
export type Section =
  | 'history'
  | 'examination'
  | 'investigations'
  | 'differential'
  | 'management'
  | 'disposition'
  | 'debrief';

const SECTION_ORDER: Section[] = [
  'history',
  'examination',
  'investigations',
  'differential',
  'management',
  'disposition',
  'debrief',
];

const SECTION_LABELS: Record<Section, string> = {
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
  section: Section;
  onSectionChange: (s: Section) => void;
  onBackToBoard: () => void;
  onExit: () => void;
  speedKey: SimSpeedKey;
  onSpeedChange: (k: SimSpeedKey) => void;
}

export function EncounterScreen({
  caseId,
  section,
  onSectionChange,
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
  const [resusActive, setResusActive] = useState(false);

  // Auto-jump to debrief when the shift ends
  useEffect(() => {
    if (isShiftOver && section !== 'debrief') onSectionChange('debrief');
  }, [isShiftOver, section, onSectionChange]);

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

  const canCloseCase = cs.workingDx !== null && cs.disposition !== null;
  const resusEligible =
    !!cs.data.resus_protocol ||
    cs.state === 'arrested' ||
    cs.state === 'deteriorating';

  return (
    <div className="enc">
      <EncounterHeader
        cs={cs}
        clockMin={ks.clockMin}
        onBackToBoard={onBackToBoard}
        onExit={onExit}
      />
      <ClockBar
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

      <div className="enc__top">
        <VignetteCard cs={cs} />
        <PatientPanel cs={cs} />
      </div>

      <DeteriorationTimers caseId={caseId} ks={ks} />

      {resusEligible && (
        <div className="enc__resus-row">
          <button
            type="button"
            className={`enc__resus-toggle ${resusActive ? 'is-active' : ''}`}
            onClick={() => setResusActive((v) => !v)}
            aria-pressed={resusActive}
          >
            {resusActive ? '← back to standard encounter' : '⚠ enter resus mode'}
          </button>
        </div>
      )}

      {!resusActive && (
        <SectionTabs
          section={section}
          onChange={onSectionChange}
          cs={cs}
          ks={ks}
          canViewDebrief={canCloseCase || isShiftOver}
        />
      )}

      <div className="enc__split">
        <main className="enc__body">
          {resusActive ? (
            <ResusMode cs={cs} onAction={(id) => kernel.toggleAction(caseId, id)} />
          ) : null}
          {!resusActive && section === 'history' && (
            <HistoryPhase cs={cs} onAsk={(id) => kernel.recordAsk(caseId, id)} />
          )}
          {!resusActive && section === 'examination' && (
            <ExaminationPhase cs={cs} onExamine={(s) => kernel.recordExamine(caseId, s)} />
          )}
          {!resusActive && section === 'investigations' && (
            <InvestigationsPhase
              cs={cs}
              clockMin={ks.clockMin}
              onOrder={(id) => kernel.orderInvestigation(caseId, id)}
            />
          )}
          {!resusActive && section === 'differential' && (
            <DifferentialPhase
              cs={cs}
              onLockIn={(dx) => kernel.setWorkingDx(caseId, dx)}
              onClear={() => kernel.clearWorkingDx(caseId)}
            />
          )}
          {!resusActive && section === 'management' && (
            <ManagementPhase cs={cs} onToggle={(id) => kernel.toggleAction(caseId, id)} />
          )}
          {!resusActive && section === 'disposition' && (
            <DispositionPhase cs={cs} onChoose={(label) => kernel.setDisposition(caseId, label)} />
          )}
          {!resusActive && section === 'debrief' && <DebriefPhase cs={cs} />}
        </main>

        <ShiftLog log={ks.log} caseId={caseId} />
      </div>

      <footer className="enc__foot">
        <button onClick={onBackToBoard}>← back to shift board</button>
        {section !== 'debrief' && canCloseCase && (
          <button className="enc__primary" onClick={() => onSectionChange('debrief')}>
            close case · see debrief →
          </button>
        )}
        {section === 'debrief' && (
          <button className="enc__primary" onClick={onBackToBoard}>
            ← back to shift board
          </button>
        )}
      </footer>
    </div>
  );
}

// ─── Header / vignette / section tabs / log ──────────────────────────────────

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

function VignetteCard({ cs }: { cs: CaseRuntime }) {
  const c = cs.data;
  return (
    <section className="enc__vignette-card" aria-label="Arrival">
      <h2 className="enc__vignette-title">Arrival</h2>
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

interface SectionBadge {
  /** Badge text, e.g. "3" or "results". Empty means no badge. */
  text: string;
  /** Visual tone of the badge. */
  tone: 'idle' | 'pending' | 'new' | 'attention' | 'done';
}

function computeBadge(section: Section, cs: CaseRuntime, ks: KernelState): SectionBadge {
  switch (section) {
    case 'history': {
      const total = visibleHistoryItems(cs, ks).length;
      const asked = visibleHistoryItems(cs, ks).filter((h) => cs.asked.has(h.id)).length;
      const newlyUnlocked = visibleHistoryItems(cs, ks).some(
        (h) => cs.unlockedHistoryIds.has(h.id) && !cs.asked.has(h.id),
      );
      if (newlyUnlocked) return { text: 'new', tone: 'new' };
      if (asked === total) return { text: '', tone: 'done' };
      return { text: `${total - asked}`, tone: 'idle' };
    }
    case 'examination': {
      const total = cs.data.examination.length;
      const done = cs.data.examination.filter((e) => cs.examined.has(e.system)).length;
      if (done === total) return { text: '', tone: 'done' };
      return { text: `${total - done}`, tone: 'idle' };
    }
    case 'investigations': {
      const pending = [...cs.ordered.entries()].filter(([id]) => !cs.resulted.has(id));
      if (cs.resulted.size > 0 && !ks.isShiftOver) {
        return { text: 'results', tone: 'new' };
      }
      if (pending.length > 0) {
        return { text: `${pending.length} pending`, tone: 'pending' };
      }
      return { text: '', tone: 'idle' };
    }
    case 'differential': {
      if (cs.workingDx === null) return { text: 'pick', tone: 'attention' };
      return { text: '✓', tone: 'done' };
    }
    case 'management': {
      const mustDoTotal = cs.data.management.filter((m) => m.must_do).length;
      const mustDoDone = cs.data.management.filter(
        (m) => m.must_do && cs.actions.has(m.id),
      ).length;
      if (mustDoTotal === 0) return { text: '', tone: 'idle' };
      if (mustDoDone === mustDoTotal) return { text: '✓', tone: 'done' };
      // Don't reveal which are missing — just that some core actions are open.
      return { text: 'core actions open', tone: 'attention' };
    }
    case 'disposition': {
      if (cs.disposition === null) return { text: 'decide', tone: 'attention' };
      return { text: '✓', tone: 'done' };
    }
    case 'debrief': {
      return { text: '', tone: 'idle' };
    }
  }
}

function SectionTabs({
  section,
  onChange,
  cs,
  ks,
  canViewDebrief,
}: {
  section: Section;
  onChange: (s: Section) => void;
  cs: CaseRuntime;
  ks: KernelState;
  canViewDebrief: boolean;
}) {
  return (
    <nav className="enc__tabs" role="tablist" aria-label="Encounter sections">
      {SECTION_ORDER.map((s) => {
        const badge = computeBadge(s, cs, ks);
        const isActive = s === section;
        const isDebrief = s === 'debrief';
        const disabled = isDebrief && !canViewDebrief;
        return (
          <button
            key={s}
            role="tab"
            aria-selected={isActive}
            aria-disabled={disabled || undefined}
            disabled={disabled}
            className={`enc__tab is-${badge.tone} ${isActive ? 'is-active' : ''}`}
            onClick={() => !disabled && onChange(s)}
            title={
              disabled
                ? 'Pick a working diagnosis and disposition first.'
                : SECTION_LABELS[s]
            }
          >
            <span className="enc__tab-label">{SECTION_LABELS[s]}</span>
            {badge.text && <span className="enc__tab-badge">{badge.text}</span>}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Live deterioration clauses (M14) — surfaces any unfired
 * `deterioration_if_not_x_by_t` events for the current case as a countdown
 * chip with the named required actions, so the player sees the trap
 * coming before the kernel fires it.
 */
function DeteriorationTimers({ caseId, ks }: { caseId: string; ks: KernelState }) {
  const cs = ks.cases.get(caseId);
  if (!cs) return null;
  const upcoming = ks.unfiredEvents.filter((e) => {
    if (e.type !== 'deterioration_if_not_x_by_t') return false;
    if (e.case_id !== caseId) return false;
    const allDone = e.required_action_ids.every((a) => cs.actions.has(a));
    return !allDone;
  });
  if (upcoming.length === 0) return null;
  return (
    <div className="enc__det-row" role="status" aria-label="Deterioration timers">
      {upcoming.map((e) => {
        if (e.type !== 'deterioration_if_not_x_by_t') return null;
        const remaining = Math.max(0, e.t_min - ks.clockMin);
        const tone = remaining <= 2 ? 'critical' : remaining <= 5 ? 'warn' : 'info';
        const missing = e.required_action_ids
          .filter((a) => !cs.actions.has(a))
          .map((a) => cs.data.management.find((m) => m.id === a)?.name ?? a);
        return (
          <div key={e.id} className={`enc__det enc__det--${tone}`}>
            <span className="enc__det-chip">
              <IconCountdown size={12} title="Deterioration timer" />
              <span>T+{e.t_min}</span>
            </span>
            <span className="enc__det-text">
              <strong>{remaining} min</strong> to complete: <em>{missing.join(', ')}</em>
            </span>
          </div>
        );
      })}
    </div>
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

// ─── Helpers used by both badges and the history section ─────────────────────

function visibleHistoryItems(cs: CaseRuntime, ks: KernelState) {
  const arcGated = gatedHistoryIds(cs.caseId, ks);
  return cs.data.history.filter((h) => {
    // Arc-gated items hide until the arc reveals (or push-reveal via `reveals`).
    if (arcGated.has(h.id) && !cs.unlockedHistoryIds.has(h.id)) return false;
    // Prereq-gated items hide until every prereq has been asked, OR until
    // explicitly unlocked by another item's `reveals`/an arc effect.
    const prereqs = h.prereq_history_ids ?? [];
    if (prereqs.length === 0) return true;
    if (cs.unlockedHistoryIds.has(h.id)) return true;
    return prereqs.every((p) => cs.asked.has(p));
  });
}

/**
 * The patient cannot answer questions when actively deteriorating or
 * arrested. Family and other indirect sources stay available; first-person
 * patient history is silenced until the player stabilises them.
 */
function isHistorySilenced(
  cs: CaseRuntime,
  source: 'patient' | 'family' | 'paramedic' | 'gp_letter' | 'triage_note' | 'nurse' | 'records',
): boolean {
  if (cs.state !== 'deteriorating' && cs.state !== 'arrested') return false;
  return source === 'patient';
}

// ─── Section bodies ─────────────────────────────────────────────────────────

function HistoryPhase({ cs, onAsk }: { cs: CaseRuntime; onAsk: (id: string) => void }) {
  const kernel = useSim((s) => s.kernel)!;
  const ks = kernel.getState();
  const items = useMemo(() => visibleHistoryItems(cs, ks), [cs, ks]);
  const arcGatedIds = useMemo(() => gatedHistoryIds(cs.caseId, ks), [cs.caseId, ks]);
  const hiddenByArc = cs.data.history.filter(
    (h) => arcGatedIds.has(h.id) && !cs.unlockedHistoryIds.has(h.id),
  ).length;
  const hiddenByPrereq = cs.data.history.filter((h) => {
    const prereqs = h.prereq_history_ids ?? [];
    if (prereqs.length === 0) return false;
    if (arcGatedIds.has(h.id) && !cs.unlockedHistoryIds.has(h.id)) return false;
    if (cs.unlockedHistoryIds.has(h.id)) return false;
    return !prereqs.every((p) => cs.asked.has(p));
  }).length;

  const patientSilenced = cs.state === 'deteriorating' || cs.state === 'arrested';

  return (
    <section className="enc__phase">
      <h2>History</h2>
      {patientSilenced && (
        <div className="enc__banner enc__banner--danger" role="status">
          <strong>{firstName(cs.data.title)} can&rsquo;t talk right now.</strong> They need urgent
          stabilisation before you take more first-person history. Family, paramedic and triage
          sources remain available.
        </div>
      )}
      <p className="enc__hint">
        Ask a topic to start. Some answers will open follow-up questions.
        {hiddenByPrereq > 0 && (
          <>
            {' '}
            <em>{hiddenByPrereq} more would open if you ask the right questions.</em>
          </>
        )}
        {hiddenByArc > 0 && (
          <>
            {' '}
            <em>{hiddenByArc} more would open if an arc reveals.</em>
          </>
        )}
      </p>
      <ul className="enc__cards">
        {items.map((h) => {
          const isAsked = cs.asked.has(h.id);
          const isNewlyUnlocked =
            !isAsked &&
            (cs.unlockedHistoryIds.has(h.id) ||
              ((h.prereq_history_ids?.length ?? 0) > 0 &&
                (h.prereq_history_ids ?? []).every((p) => cs.asked.has(p))));
          const silenced = !isAsked && isHistorySilenced(cs, h.source);
          return (
            <li
              key={h.id}
              className={`enc__card ${isAsked ? 'is-revealed' : ''} ${
                isNewlyUnlocked ? 'is-unlocked' : ''
              } ${silenced ? 'is-silenced' : ''}`}
            >
              <button
                className="enc__card-head"
                onClick={() => onAsk(h.id)}
                disabled={isAsked || silenced}
                title={silenced ? 'Patient cannot answer right now.' : undefined}
              >
                <span className="enc__chip">{h.source.replace('_', ' ')}</span>
                <span>{h.topic}</span>
                {isNewlyUnlocked && <span className="enc__chip enc__chip--unlock">new</span>}
              </button>
              {isAsked && (
                <div className="enc__card-body enc__card-body--dialogue">
                  {h.npc_voice && <p className="enc__npc-voice">{h.npc_voice}</p>}
                  <p className="enc__response">{h.response}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function firstName(title: string): string {
  // Cases are titled e.g. "Anaphylaxis — adult, peanut at restaurant".
  // We don't have a firstName field, so fall back to a neutral pronoun.
  const m = title.match(/—\s*([A-Z][a-z]+)/);
  return m?.[1] ?? 'They';
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
                    <li key={i} className={f.red_flag ? 'is-red-flag' : ''}>
                      {f.red_flag && (
                        <span className="enc__chip enc__chip--red-flag" aria-label="Red flag">
                          <IconRedFlag size={12} fill="#fff" />
                          <span style={{ marginLeft: 4 }}>red flag</span>
                        </span>
                      )}
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
  const resultedNow = cs.data.investigations.filter((ix) => cs.resulted.has(ix.id));
  const showEnvelope = resultedNow.length > 0;
  return (
    <section className="enc__phase">
      <h2>Investigations</h2>
      <p className="enc__hint">
        Results come back after the turnaround. The clock keeps running — order what you need early.
      </p>

      {showEnvelope && (
        <div className="enc__results-hero">
          <ResultsEnvelope
            width={520}
            height={220}
            ward={`ED · ${cs.data.bay?.toUpperCase() ?? 'BAY'}`}
            from="LAB · PATHOLOGY"
            re={cs.data.title}
            style={{ width: '100%', maxWidth: 560 }}
          >
            <div className="enc__results-list">
              {resultedNow.slice(0, 4).map((ix) => (
                <div key={ix.id} className="enc__results-row">
                  <strong>{ix.name}{ix.abnormal ? ' ⚠' : ''}:</strong>{' '}
                  {summariseResult(ix.result_summary)}
                </div>
              ))}
              {resultedNow.length > 4 && (
                <div className="enc__results-row enc__results-row--more">
                  + {resultedNow.length - 4} more — see list below
                </div>
              )}
            </div>
          </ResultsEnvelope>
        </div>
      )}

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

function summariseResult(text: string): string {
  // First non-empty line, trimmed and clipped — enough to surface the
  // headline finding in the envelope hero without overflowing.
  const firstLine = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstLine) return text;
  return firstLine.length > 110 ? firstLine.slice(0, 107) + '…' : firstLine;
}

interface Clue {
  id: string;
  /** Display label for the clue card. */
  label: string;
  /** Where the clue came from — drives the source chip. */
  origin: 'history' | 'exam' | 'investigation';
  /** Diagnosis labels this clue clinically supports (from the case data). */
  supports: string[];
  /** Whether the clue is a red-flag finding (exam) or abnormal (ix). */
  flagged?: boolean;
}

function collectClues(cs: CaseRuntime): Clue[] {
  const out: Clue[] = [];
  for (const h of cs.data.history) {
    if (!cs.asked.has(h.id)) continue;
    out.push({
      id: `hx:${h.id}`,
      label: h.topic.replace(/[?.]+$/, ''),
      origin: 'history',
      supports: h.supports ?? [],
    });
  }
  for (const e of cs.data.examination) {
    if (!cs.examined.has(e.system)) continue;
    for (const f of e.findings) {
      // Skip pertinent-negatives and unflagged routine findings — clue board
      // surfaces what actually moves the differential.
      const valueLabel = f.value ? `${f.name}: ${f.value}` : f.name;
      if (f.pertinent_negative) continue;
      if (!f.red_flag && !f.supports) continue;
      out.push({
        id: `ex:${e.system}:${f.name}`,
        label: valueLabel,
        origin: 'exam',
        supports: f.supports ?? [],
        flagged: f.red_flag,
      });
    }
  }
  for (const ix of cs.data.investigations) {
    if (!cs.resulted.has(ix.id)) continue;
    if (!ix.abnormal && !ix.supports) continue;
    out.push({
      id: `ix:${ix.id}`,
      label: ix.name,
      origin: 'investigation',
      supports: ix.supports ?? [],
      flagged: ix.abnormal,
    });
  }
  return out;
}

function DifferentialPhase({
  cs,
  onLockIn,
  onClear,
}: {
  cs: CaseRuntime;
  onLockIn: (dx: string) => void;
  onClear: () => void;
}) {
  const clues = useMemo(() => collectClues(cs), [cs]);
  const [selectedClues, setSelectedClues] = useState<Set<string>>(new Set());
  const hasPicked = cs.workingDx !== null;

  function toggleClue(id: string) {
    setSelectedClues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Per-differential support tally: how many of the player's selected clues
  // actually point at this diagnosis (per author's `supports` field)?
  const supportTally = useMemo(() => {
    const tally = new Map<string, number>();
    for (const d of cs.data.differential) tally.set(d.diagnosis, 0);
    for (const c of clues) {
      if (!selectedClues.has(c.id)) continue;
      for (const dx of c.supports) {
        tally.set(dx, (tally.get(dx) ?? 0) + 1);
      }
    }
    return tally;
  }, [cs.data.differential, clues, selectedClues]);

  return (
    <section className="enc__phase">
      <h2>Differential — build a case, then lock it in</h2>
      <p className="enc__hint">
        {hasPicked
          ? 'Working diagnosis locked. Likelihood revealed. Use ✗ to un-lock and reconsider.'
          : 'Tap a clue to add it to your reasoning. The differential cards tally how many of your linked clues point at each diagnosis. When you have a working diagnosis, lock it in.'}
      </p>

      {clues.length === 0 ? (
        <div className="enc__banner">
          <strong>No clues yet.</strong> Take a history, examine the patient, or order
          investigations to build the clue board.
        </div>
      ) : (
        <div className="enc__clueboard" role="group" aria-label="Clue board">
          <h3 className="enc__clueboard-title">Clue board</h3>
          <ul className="enc__cluelist">
            {clues.map((c) => {
              const isSelected = selectedClues.has(c.id);
              return (
                <li key={c.id} className={`enc__clue ${isSelected ? 'is-selected' : ''}`}>
                  <button
                    type="button"
                    className="enc__clue-btn"
                    onClick={() => toggleClue(c.id)}
                    aria-pressed={isSelected}
                  >
                    <span className={`enc__chip enc__chip--clue-${c.origin}`}>
                      {c.origin === 'history' ? 'hx' : c.origin === 'exam' ? 'O/E' : 'ix'}
                    </span>
                    {c.flagged && (
                      <span className="enc__chip enc__chip--red-flag" aria-label="Red flag">
                        ⚠
                      </span>
                    )}
                    <span className="enc__clue-label">{c.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <h3 className="enc__diff-heading">Differential diagnoses</h3>
      <ul className="enc__cards">
        {cs.data.differential.map((d) => {
          const isPicked = cs.workingDx === d.diagnosis;
          const supports = supportTally.get(d.diagnosis) ?? 0;
          const isTop = d.likelihood === 'top';
          return (
            <li
              key={d.diagnosis}
              className={pickCardClass({ isPicked, hasPicked, isCorrect: isTop })}
            >
              <div className="enc__diff-card-head">
                <div className="enc__diff-card-left">
                  {hasPicked && (
                    <span className={`enc__chip enc__chip--${d.likelihood}`}>
                      {d.likelihood.replace('_', ' ')}
                    </span>
                  )}
                  <span className="enc__diff-name">{d.diagnosis}</span>
                  {supports > 0 && (
                    <span
                      className="enc__chip enc__chip--support"
                      aria-label={`${supports} supporting clues linked`}
                    >
                      +{supports} linked
                    </span>
                  )}
                </div>
                {!hasPicked && (
                  <button
                    type="button"
                    className="enc__diff-lockin"
                    onClick={() => onLockIn(d.diagnosis)}
                  >
                    lock in →
                  </button>
                )}
                {isPicked && (
                  <button
                    type="button"
                    className="enc__diff-unlock"
                    onClick={() => onClear()}
                    aria-label="Un-lock working diagnosis"
                  >
                    ✗
                  </button>
                )}
              </div>
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
  const hasPicked = cs.disposition !== null;
  return (
    <section className="enc__phase">
      <h2>Disposition — where does this patient go now?</h2>
      <p className="enc__hint">
        {hasPicked
          ? 'Rationale revealed below. You can change your pick before going to debrief.'
          : 'Pick the disposition you would document. Rationale is revealed once you choose.'}
      </p>
      <ul className="enc__cards">
        {cs.data.disposition_options.map((d) => {
          const isPicked = cs.disposition === d.label;
          return (
            <li
              key={d.label}
              className={pickCardClass({
                isPicked,
                hasPicked,
                isCorrect: d.appropriate,
              })}
            >
              <button
                className="enc__card-head enc__card-head--toggle"
                onClick={() => onChoose(d.label)}
                data-picked={isPicked}
              >
                <span>{d.label}</span>
                {hasPicked && (
                  <span
                    className={`enc__chip ${
                      d.appropriate ? 'enc__chip--unlock' : 'enc__chip--red-flag'
                    }`}
                  >
                    {d.appropriate ? 'appropriate' : 'inappropriate'}
                  </span>
                )}
              </button>
              {hasPicked && <p className="enc__card-body">{d.criteria}</p>}
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
  const trapsTotal = c.management.filter((m) => m.must_not_do).length;
  const trapsAvoided = trapsTotal - score.mustNotDoChosen;
  const trapsPicked = c.management.filter((m) => m.must_not_do && cs.actions.has(m.id));

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
          {score.sequenceErrors > 0 && (
            <li className="enc__score-warn">
              <strong>Sequence errors:</strong> {score.sequenceErrors} action
              {score.sequenceErrors === 1 ? '' : 's'} taken out of order (−
              {score.sequenceErrors * 10})
            </li>
          )}
          {trapsTotal > 0 && (
            <li className={score.mustNotDoChosen > 0 ? 'enc__score-warn' : 'enc__score-good'}>
              <strong>Ward traps:</strong> avoided {trapsAvoided}/{trapsTotal}
              {trapsPicked.length > 0 && (
                <>
                  {' '}
                  · <em>caught: {trapsPicked.map((t) => t.name).join(', ')}</em>
                </>
              )}
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

function pickCardClass({
  isPicked,
  hasPicked,
  isCorrect,
}: {
  isPicked: boolean;
  hasPicked: boolean;
  isCorrect: boolean;
}): string {
  const parts = ['enc__card'];
  if (isPicked) parts.push('is-revealed');
  if (hasPicked && isCorrect) parts.push('enc__card--correct');
  if (hasPicked && isPicked && !isCorrect) parts.push('enc__card--wrong');
  return parts.join(' ');
}

function statusLabel(s: 'done' | 'missed' | 'trap_avoided' | 'trap_picked' | 'sequence_error') {
  switch (s) {
    case 'done':
      return '✓ done';
    case 'missed':
      return '✗ missed';
    case 'trap_avoided':
      return '✓ trap avoided';
    case 'trap_picked':
      return '✗ trap picked';
    case 'sequence_error':
      return '↯ out of sequence';
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
function gatedHistoryIds(caseId: string, ks: KernelState): Set<string> {
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

import { useEffect, useMemo, useState } from 'react';
import { useSim, scoreCase, type ScoreReport, type SimSpeedKey } from '../../state/sim';
import type { CitationT, HistoryItemT } from '../../content/schema';
import type {
  CaseRuntime,
  ConsultantInterrupt,
  KernelState,
  LogEntry,
} from '../../sim/kernel';
import { ClockBar } from '../shift/ClockBar';
import { PatientPanel } from './PatientPanel';
import { ResusMode } from './ResusMode';
import { IconCitation, IconCountdown, IconNewInfo } from '../../style/icons';
import { NPC_SPRITES, npcFrameToSvg, npcSpriteIdForSource } from '../../style/npcSprites';
import { FX_EMOTES, fxFrameToSvg } from '../../style/fxSprites';
import { WALK_FRAMES } from '../../style/walkCycles';
import { hasPerk } from '../../state/progression';
import { ExaminationPhase } from './phases/ExaminationPhase';
import { ManagementPhase } from './phases/ManagementPhase';
import { DispositionPhase } from './phases/DispositionPhase';
import { InvestigationsPhase } from './phases/InvestigationsPhase';

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

  const pendingInterrupt = ks.pendingInterrupt;
  const pendingDeath = ks.pendingDeathNotice;
  return (
    <div className="enc">
      {pendingInterrupt && (
        <ConsultantInterruptModal
          interrupt={pendingInterrupt}
          onDismiss={() => kernel.dismissConsultantInterrupt()}
        />
      )}
      {pendingDeath && (
        <PatientDeathModal
          notice={pendingDeath}
          onContinue={() => kernel.dismissDeathNotice()}
          onDebrief={() => {
            kernel.dismissDeathNotice();
            onSectionChange('debrief');
          }}
        />
      )}
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
            <HistoryPhase
              cs={cs}
              onAsk={(id) => kernel.recordAsk(caseId, id)}
              onPickBranch={(hxId, choiceId) => kernel.pickBranchChoice(caseId, hxId, choiceId)}
            />
          )}
          {!resusActive && section === 'examination' && (
            <ExaminationPhase
              cs={cs}
              onExamine={(s) => kernel.recordExamine(caseId, s)}
              onPerformManoeuvre={(s, m) => kernel.recordManoeuvre(caseId, s, m)}
            />
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
        // perk_resus_reflex widens the warn/critical bands by 1 min,
        // giving the player a wider runway before the chip pulses red.
        const reflex = hasPerk('perk_resus_reflex');
        const warnThreshold = reflex ? 6 : 5;
        const criticalThreshold = reflex ? 3 : 2;
        const tone =
          remaining <= criticalThreshold
            ? 'critical'
            : remaining <= warnThreshold
              ? 'warn'
              : 'info';
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
    // Rapport-gated items hide until the player has earned the floor (M38).
    // Asked-already items stay visible even if rapport later drops — once
    // disclosed, you can't un-hear something.
    if (h.min_rapport !== undefined && cs.rapport < h.min_rapport && !cs.asked.has(h.id)) {
      return false;
    }
    // Prereq-gated items hide until every prereq has been asked, OR until
    // explicitly unlocked by another item's `reveals`/an arc effect.
    const prereqs = h.prereq_history_ids ?? [];
    if (prereqs.length === 0) return true;
    if (cs.unlockedHistoryIds.has(h.id)) return true;
    return prereqs.every((p) => cs.asked.has(p));
  });
}

/**
 * The patient cannot answer questions when actively deteriorating /
 * arrested OR when rapport has collapsed (M38: rapport ≤ −2 — they
 * 'pull away' and stop engaging). Family and other indirect sources
 * stay available either way.
 */
function isHistorySilenced(
  cs: CaseRuntime,
  source: 'patient' | 'family' | 'paramedic' | 'gp_letter' | 'triage_note' | 'nurse' | 'records',
): 'physiology' | 'rapport' | null {
  if (source !== 'patient') return null;
  if (cs.state === 'deteriorating' || cs.state === 'arrested') return 'physiology';
  if (cs.rapport <= -2) return 'rapport';
  return null;
}

// ─── Section bodies ─────────────────────────────────────────────────────────

function rapportLabel(r: number): { mood: string; tone: 'good' | 'neutral' | 'bad' } {
  if (r >= 2) return { mood: 'warming up', tone: 'good' };
  if (r >= 1) return { mood: 'engaging', tone: 'good' };
  if (r <= -2) return { mood: 'pulling away', tone: 'bad' };
  if (r <= -1) return { mood: 'guarded', tone: 'bad' };
  return { mood: 'neutral', tone: 'neutral' };
}

function HistoryPhase({
  cs,
  onAsk,
  onPickBranch,
}: {
  cs: CaseRuntime;
  onAsk: (id: string) => void;
  onPickBranch: (hxId: string, choiceId: string) => void;
}) {
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
  const rapportCollapsed = cs.rapport <= -2;

  // Rapport surfaces only once the encounter actually has at least one
  // branching dialogue moment authored on it (M34).
  const hasAnyBranching = cs.data.history.some((h) => h.branch_choices);
  const rapport = rapportLabel(cs.rapport);
  // M38: count how many items the player has *unlocked* by reaching the
  // rapport floor — surfaces in the hint line so the reward feels earned.
  const rapportUnlockedHidden = cs.data.history.filter(
    (h) => h.min_rapport !== undefined && cs.rapport < h.min_rapport && !cs.asked.has(h.id),
  ).length;

  return (
    <section className="enc__phase">
      <header className="enc__phase-head">
        <h2>History</h2>
        {hasAnyBranching && (
          <span
            className={`enc__rapport enc__rapport--${rapport.tone}`}
            title={`Net rapport: ${cs.rapport}`}
            aria-label={`Patient rapport: ${rapport.mood}`}
          >
            Patient: <strong>{rapport.mood}</strong>
          </span>
        )}
      </header>
      {patientSilenced && (
        <div className="enc__banner enc__banner--danger" role="status">
          <strong>{firstName(cs.data.title)} can&rsquo;t talk right now.</strong> They need urgent
          stabilisation before you take more first-person history. Family, paramedic and triage
          sources remain available.
        </div>
      )}
      {!patientSilenced && rapportCollapsed && (
        <div className="enc__banner enc__banner--warn" role="status">
          <strong>{firstName(cs.data.title)} has pulled away.</strong> First-person history is
          closed for now — they&rsquo;ll answer family or paramedic questions, but not yours
          directly. The way you asked got there.
        </div>
      )}
      <p className="enc__hint">
        Ask a topic to start. Some answers will open follow-up questions.
        {hasAnyBranching && (
          <>
            {' '}
            <em>Some questions let you choose tone — how you ask matters.</em>
          </>
        )}
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
        {rapportUnlockedHidden > 0 && (
          <>
            {' '}
            <em>
              {rapportUnlockedHidden} more would open if {firstName(cs.data.title).toLowerCase()}{' '}
              trusted you more.
            </em>
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
          const silencedReason = !isAsked ? isHistorySilenced(cs, h.source) : null;
          const silenced = silencedReason !== null;
          const silenceTitle =
            silencedReason === 'rapport'
              ? `${firstName(cs.data.title)} has pulled away — they won't answer you directly right now.`
              : silencedReason === 'physiology'
                ? 'Patient cannot answer right now — they need stabilisation.'
                : undefined;
          return (
            <li
              key={h.id}
              className={`enc__card ${isAsked ? 'is-revealed' : ''} ${
                isNewlyUnlocked ? 'is-unlocked' : ''
              } ${silenced ? 'is-silenced' : ''} ${
                silencedReason === 'rapport' ? 'is-silenced-rapport' : ''
              }`}
            >
              <button
                className="enc__card-head enc__card-head--with-npc"
                onClick={() => onAsk(h.id)}
                disabled={isAsked || silenced}
                title={silenceTitle}
              >
                <HistoryNpcSprite source={h.source} silenced={silenced} />
                <span className="enc__chip">{h.source.replace('_', ' ')}</span>
                <span>{h.topic}</span>
                {isNewlyUnlocked && (
                  <span className="enc__chip enc__chip--unlock">
                    <IconNewInfo size={12} fill="#000" />
                    <span style={{ marginLeft: 4 }}>new</span>
                  </span>
                )}
              </button>
              {isAsked && (
                <div className="enc__card-body enc__card-body--dialogue">
                  {h.npc_voice && <p className="enc__npc-voice">{h.npc_voice}</p>}
                  {h.branch_choices && !cs.branchChoices.has(h.id) && (
                    <BranchPicker
                      choices={h.branch_choices}
                      onPick={(cid) => onPickBranch(h.id, cid)}
                    />
                  )}
                  {h.branch_choices && cs.branchChoices.has(h.id)
                    ? (() => {
                        const pickedId = cs.branchChoices.get(h.id)!;
                        const picked = h.branch_choices.find((c) => c.id === pickedId);
                        if (!picked) return null;
                        return (
                          <div className="enc__branch-picked">
                            <p className="enc__branch-picked-tag">
                              You asked: <em>“{picked.label}”</em>
                            </p>
                            {picked.npc_voice && (
                              <p className="enc__npc-voice">{picked.npc_voice}</p>
                            )}
                            <p className="enc__response">{picked.response}</p>
                          </div>
                        );
                      })()
                    : null}
                  {/* The canonical response only renders when the item carries
                      no branch_choices, OR while the player has not yet picked
                      one (so they can see the topic before committing). Once a
                      branch is picked, only its response shows — keeping the
                      choice consequential rather than additive flavour. */}
                  {!h.branch_choices && <p className="enc__response">{h.response}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Bedside interrupt modal (M39). Renders over the encounter when
 * \`KernelState.pendingInterrupt\` is set. Dr McGrath has stepped into
 * the bay — the player reads her line and presses 'noted' to continue.
 * Identity-stable across triggers; tone shifts by trigger via the
 * composer module (state/consultantInterrupts.ts).
 */
function ConsultantInterruptModal({
  interrupt,
  onDismiss,
}: {
  interrupt: ConsultantInterrupt;
  onDismiss: () => void;
}) {
  // Auto-focus the dismiss button so 'Enter' or 'Space' closes the modal.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDismiss]);

  const triggerLabel =
    interrupt.trigger === 'trap_caught'
      ? 'pausing you'
      : interrupt.trigger === 'deterioration_takeover'
        ? 'taking over'
        : 'pulling you aside';

  return (
    <div
      className="consultant-interrupt"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultant-interrupt-title"
      onClick={(e) => {
        // Click on backdrop dismisses; click on dialog body doesn't.
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className={`consultant-interrupt__dialog consultant-interrupt__dialog--${interrupt.trigger}`}>
        <ConsultantInterruptEmote trigger={interrupt.trigger} />
        <ConsultantWalkIn />
        <header className="consultant-interrupt__head">
          <span className="consultant-interrupt__name" id="consultant-interrupt-title">
            Dr Aoife McGrath
          </span>
          <span className="consultant-interrupt__role">ED consultant · {triggerLabel}</span>
        </header>
        <p className="consultant-interrupt__line">{interrupt.line}</p>
        {interrupt.aside && <p className="consultant-interrupt__aside">{interrupt.aside}</p>}
        <button type="button" className="consultant-interrupt__dismiss" onClick={onDismiss} autoFocus>
          Noted — back to the bay
        </button>
      </div>
    </div>
  );
}

/**
 * Time-of-death modal (M69). Per drop #3 outcomes.jsx — a mortuary-
 * styled overlay when a case transitions into the deceased state.
 * Two routes: continue the shift, or jump straight to the debrief.
 *
 * Renders once per death (set by kernel when state hits 'deceased',
 * cleared on dismiss). Not snapshotted — single-fire beat.
 */
function PatientDeathModal({
  notice,
  onContinue,
  onDebrief,
}: {
  notice: { caseId: string; caseName: string; timeOfDeath: number };
  onContinue: () => void;
  onDebrief: () => void;
}) {
  const tod = `T+${notice.timeOfDeath}`;
  return (
    <div className="death-modal" role="dialog" aria-modal="true" aria-labelledby="death-modal-title">
      <div className="death-modal__vignette" />
      <div className="death-modal__inner">
        <div className="death-modal__eyebrow">· TIME OF DEATH ·</div>
        <div className="death-modal__time">{tod}</div>
        <div className="death-modal__name" id="death-modal-title">{notice.caseName}</div>
        <p className="death-modal__instruction">
          Take a moment. Then go back to it — there are other patients waiting.
        </p>
        <div className="death-modal__actions">
          <button type="button" className="death-modal__btn" onClick={onContinue} autoFocus>
            ↵&nbsp; continue shift
          </button>
          <button type="button" className="death-modal__btn death-modal__btn--ghost" onClick={onDebrief}>
            D&nbsp; debrief now
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * McGrath walks into the bay (M79) — uses the drop-#3 walk-cycle
 * frames (M65). She enters from the left, two-step cycle, lands at
 * her speaking position alongside the dialogue. The npc sprite is
 * placed in the speaker slot once she arrives.
 */
function ConsultantWalkIn() {
  const [walkFrame, setWalkFrame] = useState(0);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    // Cycle through the 4-frame walk (down_F0, down_F1, down_F0, down_F3).
    // Land at the speaker position after ~1 second.
    let i = 0;
    const interval = window.setInterval(() => {
      i += 1;
      if (i >= 8) {
        setArrived(true);
        window.clearInterval(interval);
        return;
      }
      setWalkFrame(i % 4);
    }, 110);
    return () => window.clearInterval(interval);
  }, []);

  const frameOrder = ['f1_down_F0', 'f1_down_F1', 'f1_down_F0', 'f1_down_F3'];
  const arrivedFrame = NPC_SPRITES.sister;

  const rows = arrived ? arrivedFrame : WALK_FRAMES[frameOrder[walkFrame % 4]!];
  if (!rows) return null;
  const svg = arrived ? npcFrameToSvg(rows, 3) : npcFrameToSvg(rows, 3);

  return (
    <div
      className={`consultant-interrupt__walkin ${arrived ? 'is-arrived' : 'is-walking'}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/**
 * Trigger-coded FX emote in the corner of the consultant interrupt
 * modal (M66). Maps each trigger to one of the drop-#3 phase-2 emotes
 * so the player can see the modal's *tone* before they read the line.
 *  trap_caught          → exclamation (sharp '!')
 *  deterioration_takeover → heart_pulse (urgent)
 *  unsafe_midshift      → relief_exhale ('step out, take a breath')
 */
function ConsultantInterruptEmote({
  trigger,
}: {
  trigger: 'trap_caught' | 'deterioration_takeover' | 'unsafe_midshift';
}) {
  const emoteId =
    trigger === 'trap_caught'
      ? 'exclamation'
      : trigger === 'deterioration_takeover'
        ? 'heart_pulse'
        : 'relief_exhale';
  const svg = useMemo(() => {
    const rows = FX_EMOTES[emoteId];
    return rows ? fxFrameToSvg(rows, 3) : null;
  }, [emoteId]);
  if (!svg) return null;
  return (
    <div
      className={`consultant-interrupt__emote consultant-interrupt__emote--${emoteId}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/**
 * Render the matching NPC sprite next to a history card (M43). Skip
 * for patient/records/gp_letter sources — those have no NPC voice.
 * The sprite is memoised by source so we're not re-rendering an SVG
 * string on every history-list update.
 */
function HistoryNpcSprite({
  source,
  silenced,
}: {
  source: HistoryItemT['source'];
  silenced: boolean;
}) {
  const id = npcSpriteIdForSource(source);
  const svg = useMemo(() => {
    if (!id) return null;
    const rows = NPC_SPRITES[id];
    if (!rows) return null;
    return npcFrameToSvg(rows, 2);
  }, [id]);
  if (!svg) return <span className="enc__npc enc__npc--placeholder" aria-hidden="true" />;
  return (
    <span
      className={`enc__npc ${silenced ? 'enc__npc--silenced' : ''}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/**
 * Inline diegetic prop sprite for a management action (M45). Maps
 * action.name + action.category onto a 16×16 prop (syringe, IV bag,
 * O2 mask, etc.) via propIdForAction. Sprite-less actions render
 * a placeholder slot so column widths stay aligned.
 */
function BranchPicker({
  choices,
  onPick,
}: {
  choices: { id: string; label: string }[];
  onPick: (id: string) => void;
}) {
  return (
    <div className="enc__branch-picker" role="group" aria-label="How do you ask?">
      <p className="enc__branch-picker-prompt">How do you ask?</p>
      <ul className="enc__branch-picker-options">
        {choices.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="enc__branch-picker-button"
              onClick={() => onPick(c.id)}
            >
              <span className="enc__branch-picker-marker">▸</span>
              {c.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function firstName(title: string): string {
  // Cases are titled e.g. "Anaphylaxis — adult, peanut at restaurant".
  // We don't have a firstName field, so fall back to a neutral pronoun.
  const m = title.match(/—\s*([A-Z][a-z]+)/);
  return m?.[1] ?? 'They';
}

// ExaminationPhase + ExaminationFindingRow extracted to ./phases/ExaminationPhase.tsx (M61).

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
      <IconCitation size={12} style={{ marginRight: 6 }} />
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

import {
  useEncounter,
  PHASE_ORDER,
  scoreEncounter,
  type EncounterPhase,
} from '../../state/encounter';
import type { CitationT } from '../../content/schema';

interface EncounterScreenProps {
  onExit: () => void;
}

export function EncounterScreen({ onExit }: EncounterScreenProps) {
  const phase = useEncounter((s) => s.phase);
  const caseData = useEncounter((s) => s.caseData);

  if (!caseData) {
    return (
      <div className="enc">
        <p>No case loaded.</p>
        <button onClick={onExit}>Back</button>
      </div>
    );
  }

  return (
    <div className="enc">
      <EncounterHeader onExit={onExit} />
      <PhaseProgress phase={phase} />
      <main className="enc__body">
        {phase === 'vignette' && <VignettePhase />}
        {phase === 'history' && <HistoryPhase />}
        {phase === 'examination' && <ExaminationPhase />}
        {phase === 'investigations' && <InvestigationsPhase />}
        {phase === 'differential' && <DifferentialPhase />}
        {phase === 'management' && <ManagementPhase />}
        {phase === 'disposition' && <DispositionPhase />}
        {phase === 'debrief' && <DebriefPhase />}
      </main>
      <PhaseFooter onExit={onExit} />
    </div>
  );
}

// ─── Header / progress / footer ──────────────────────────────────────────────

function EncounterHeader({ onExit }: { onExit: () => void }) {
  const c = useEncounter((s) => s.caseData)!;
  return (
    <header className="enc__head">
      <div>
        <div className="enc__head-title">{c.title}</div>
        <div className="enc__head-meta">
          {c.demographics.age_value} {c.demographics.age_unit} · {c.demographics.sex}
          {c.demographics.weight_kg ? ` · ${c.demographics.weight_kg} kg` : ''} · triage{' '}
          {c.triage_category}
        </div>
      </div>
      <button className="enc__exit" onClick={onExit} aria-label="Exit encounter">
        ← menu
      </button>
    </header>
  );
}

const PHASE_LABELS: Record<EncounterPhase, string> = {
  vignette: 'Arrival',
  history: 'History',
  examination: 'Examination',
  investigations: 'Investigations',
  differential: 'Differential',
  management: 'Management',
  disposition: 'Disposition',
  debrief: 'Debrief',
};

function PhaseProgress({ phase }: { phase: EncounterPhase }) {
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

function PhaseFooter({ onExit }: { onExit: () => void }) {
  const phase = useEncounter((s) => s.phase);
  const next = useEncounter((s) => s.next);
  const prev = useEncounter((s) => s.prev);
  const reset = useEncounter((s) => s.reset);
  const wdx = useEncounter((s) => s.workingDiagnosis);
  const disp = useEncounter((s) => s.dispositionPicked);

  const isFirst = phase === 'vignette';
  const isDebrief = phase === 'debrief';
  const cannotAdvance = (phase === 'differential' && !wdx) || (phase === 'disposition' && !disp);

  return (
    <footer className="enc__foot">
      <button onClick={prev} disabled={isFirst}>
        ← back
      </button>
      {!isDebrief ? (
        <button className="enc__primary" onClick={next} disabled={cannotAdvance}>
          {phase === 'disposition' ? 'See debrief' : 'next →'}
        </button>
      ) : (
        <button
          className="enc__primary"
          onClick={() => {
            reset();
            onExit();
          }}
        >
          ← back to menu
        </button>
      )}
    </footer>
  );
}

// ─── Phases ─────────────────────────────────────────────────────────────────

function VignettePhase() {
  const c = useEncounter((s) => s.caseData)!;
  return (
    <section className="enc__phase">
      <h2>Bay 2 — arrival</h2>
      <pre className="enc__vignette">{c.vignette}</pre>
      <details className="enc__details">
        <summary>Pre-existing PMH and meds (paramedic handover sheet)</summary>
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

function HistoryPhase() {
  const c = useEncounter((s) => s.caseData)!;
  const asked = useEncounter((s) => s.historyAsked);
  const ask = useEncounter((s) => s.ask);

  return (
    <section className="enc__phase">
      <h2>History</h2>
      <p className="enc__hint">Tap a topic to ask. You can ask all of them.</p>
      <ul className="enc__cards">
        {c.history.map((h) => {
          const isAsked = asked.has(h.id);
          return (
            <li key={h.id} className={`enc__card ${isAsked ? 'is-revealed' : ''}`}>
              <button className="enc__card-head" onClick={() => ask(h.id)} disabled={isAsked}>
                <span className="enc__chip">{h.source.replace('_', ' ')}</span>
                <span>{h.topic}</span>
              </button>
              {isAsked && <p className="enc__card-body">{h.response}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ExaminationPhase() {
  const c = useEncounter((s) => s.caseData)!;
  const examined = useEncounter((s) => s.examined);
  const examine = useEncounter((s) => s.examine);

  return (
    <section className="enc__phase">
      <h2>Examination</h2>
      <p className="enc__hint">Select a system to examine.</p>
      <ul className="enc__cards">
        {c.examination.map((e) => {
          const isExamined = examined.has(e.system);
          return (
            <li key={e.system} className={`enc__card ${isExamined ? 'is-revealed' : ''}`}>
              <button
                className="enc__card-head"
                onClick={() => examine(e.system)}
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

function InvestigationsPhase() {
  const c = useEncounter((s) => s.caseData)!;
  const ordered = useEncounter((s) => s.investigationsOrdered);
  const order = useEncounter((s) => s.order);

  return (
    <section className="enc__phase">
      <h2>Investigations</h2>
      <p className="enc__hint">
        Order what you need. Results appear immediately (the shift clock arrives in Milestone 4).
      </p>
      <ul className="enc__cards">
        {c.investigations.map((ix) => {
          const isOrdered = ordered.has(ix.id);
          return (
            <li key={ix.id} className={`enc__card ${isOrdered ? 'is-revealed' : ''}`}>
              <button className="enc__card-head" onClick={() => order(ix.id)} disabled={isOrdered}>
                <span className="enc__chip">{ix.category}</span>
                <span>{ix.name}</span>
                <span className="enc__chip enc__chip--muted">~{ix.turnaround_min} min</span>
              </button>
              {isOrdered && <pre className="enc__result">{ix.result_summary}</pre>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DifferentialPhase() {
  const c = useEncounter((s) => s.caseData)!;
  const chosen = useEncounter((s) => s.workingDiagnosis);
  const choose = useEncounter((s) => s.chooseDiagnosis);

  return (
    <section className="enc__phase">
      <h2>Differential — pick your working diagnosis</h2>
      <p className="enc__hint">
        Use the discriminator to test each. The &ldquo;must-not-miss&rdquo; item isn&rsquo;t always
        the answer — but you should rule it out actively.
      </p>
      <ul className="enc__cards">
        {c.differential.map((d) => {
          const isPicked = chosen === d.diagnosis;
          return (
            <li key={d.diagnosis} className={`enc__card ${isPicked ? 'is-revealed' : ''}`}>
              <button
                className="enc__card-head enc__card-head--toggle"
                onClick={() => choose(d.diagnosis)}
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

function ManagementPhase() {
  const c = useEncounter((s) => s.caseData)!;
  const picked = useEncounter((s) => s.managementPicked);
  const toggle = useEncounter((s) => s.toggleManagement);

  return (
    <section className="enc__phase">
      <h2>Management — tick what you do</h2>
      <p className="enc__hint">
        Some options are distractors. The debrief will score against the guideline.
      </p>
      <ul className="enc__cards">
        {c.management.map((m) => {
          const isPicked = picked.has(m.id);
          return (
            <li key={m.id} className={`enc__card ${isPicked ? 'is-picked' : ''}`}>
              <label className="enc__card-head enc__card-head--check">
                <input type="checkbox" checked={isPicked} onChange={() => toggle(m.id)} />
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

function DispositionPhase() {
  const c = useEncounter((s) => s.caseData)!;
  const chosen = useEncounter((s) => s.dispositionPicked);
  const choose = useEncounter((s) => s.chooseDisposition);

  return (
    <section className="enc__phase">
      <h2>Disposition — where does this patient go now?</h2>
      <ul className="enc__cards">
        {c.disposition_options.map((d) => {
          const isPicked = chosen === d.label;
          return (
            <li key={d.label} className={`enc__card ${isPicked ? 'is-revealed' : ''}`}>
              <button
                className="enc__card-head enc__card-head--toggle"
                onClick={() => choose(d.label)}
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

function DebriefPhase() {
  const c = useEncounter((s) => s.caseData)!;
  const state = useEncounter();
  const score = scoreEncounter(state);

  return (
    <section className="enc__phase">
      <h2>Debrief</h2>
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
          {score.mustNotDoChosen > 0 && (
            <li className="enc__score-warn">
              <strong>Patient safety:</strong> picked {score.mustNotDoChosen} trap action(s).
            </li>
          )}
        </ul>
      </div>

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

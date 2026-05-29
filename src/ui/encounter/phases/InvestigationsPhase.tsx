/**
 * Investigations phase (M61: extracted from EncounterScreen).
 *
 * Renders the orderable investigations list + the in-flight ECG drill
 * (M31/M47). When a result lands, surfaces it inside the diegetic
 * Results Envelope frame.
 */

import { useMemo, useState } from 'react';
import type { CaseRuntime } from '../../../sim/kernel';
import { ResultsEnvelope } from '../../../style/frames';
import { ECG_BANK } from '../../../content/ecg-challenges';

export function InvestigationsPhase({
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
            // M81: lab envelope 'Re:' shows the triage line, not the
            // diagnosis. Real UK lab envelopes carry patient identifiers
            // and the indication — not the final dx.
            re={cs.data.chief_complaint}
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
              {isResulted && ix.ecg_challenge_id && (
                <EcgInlineQuiz challengeId={ix.ecg_challenge_id} />
              )}
              {isResulted && <pre className="enc__result">{ix.result_summary}</pre>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Inline ECG-bank challenge (M31, expanded M47). When a case's ECG
 * investigation is tagged with an \`ecg_challenge_id\`, the resulted
 * card surfaces the full multi-step interpretation drill right here
 * — so the player exercises rhythm-recognition skill at the point of
 * clinical relevance rather than purely in the side-room daily-ECG
 * screen.
 *
 * The drill is gated behind a 'interpret the rhythm strip' toggle so
 * the rest of the investigation panel still reads as the textual
 * result envelope by default.
 */
function EcgInlineQuiz({ challengeId }: { challengeId: string }) {
  const ecg = useMemo(() => ECG_BANK.find((e) => e.id === challengeId), [challengeId]);
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    ecg ? ecg.steps.map(() => null) : [],
  );
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    ecg ? ecg.steps.map(() => false) : [],
  );

  if (!ecg) return null;
  const total = ecg.steps.length;
  const current = ecg.steps[step]!;
  const isStepRevealed = revealed[step] === true;
  const allDone = revealed.every(Boolean);
  const correctCount = revealed.reduce((acc, r, i) => {
    if (!r) return acc;
    return answers[i] === ecg.steps[i]!.correctIndex ? acc + 1 : acc;
  }, 0);

  function answer(idx: number) {
    if (isStepRevealed) return;
    setAnswers((a) => a.map((v, i) => (i === step ? idx : v)));
  }
  function reveal() {
    setRevealed((r) => r.map((v, i) => (i === step ? true : v)));
  }
  function next() {
    if (step < total - 1) setStep((s) => s + 1);
  }
  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        className="ecg-inline__toggle"
        onClick={() => setExpanded(true)}
      >
        ▾ interpret the rhythm strip first ({ecg.title})
      </button>
    );
  }

  const isCorrect = isStepRevealed && answers[step] === current.correctIndex;
  return (
    <div className="ecg-inline">
      <div className="ecg-inline__strip-head">
        <span className="ecg-inline__title">Rhythm strip — {ecg.title}</span>
        <button
          type="button"
          className="ecg-inline__close"
          onClick={() => {
            setExpanded(false);
          }}
          aria-label="Hide ECG drill"
        >
          ✕
        </button>
      </div>
      <pre className="ecg-inline__strip">{ecg.strip}</pre>
      <nav className="ecg-inline__progress" aria-label="ECG drill progress">
        {ecg.steps.map((_, i) => {
          const r = revealed[i] === true;
          const correct = r && answers[i] === ecg.steps[i]!.correctIndex;
          const cls = [
            'ecg-inline__dot',
            i === step ? 'is-active' : '',
            r && correct ? 'is-correct' : '',
            r && !correct ? 'is-wrong' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={i}
              type="button"
              className={cls}
              onClick={() => setStep(i)}
              aria-label={`Question ${i + 1}`}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>
      <p className="ecg-inline__prompt">{current.prompt}</p>
      <ul className="ecg-inline__options">
        {current.options.map((opt, i) => {
          const cls = [
            'ecg-inline__option',
            answers[step] === i ? 'is-picked' : '',
            isStepRevealed && i === current.correctIndex ? 'is-correct' : '',
            isStepRevealed && answers[step] === i && i !== current.correctIndex
              ? 'is-wrong'
              : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <li key={i}>
              <button
                type="button"
                className={cls}
                onClick={() => answer(i)}
                disabled={isStepRevealed}
              >
                {opt}
              </button>
            </li>
          );
        })}
      </ul>
      {isStepRevealed && (
        <div className={`ecg-inline__rationale ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
          <strong>{isCorrect ? '✓ Correct.' : '✗ Not quite.'}</strong> {current.rationale}
        </div>
      )}
      <div className="ecg-inline__nav">
        <button type="button" onClick={prev} disabled={step === 0}>
          ← back
        </button>
        {!isStepRevealed && (
          <button
            type="button"
            className="ecg-inline__reveal"
            onClick={reveal}
            disabled={answers[step] === null}
          >
            Reveal answer
          </button>
        )}
        {isStepRevealed && step < total - 1 && (
          <button type="button" className="ecg-inline__reveal" onClick={next}>
            next question →
          </button>
        )}
      </div>
      {allDone && (
        <div className="ecg-inline__summary">
          <strong>
            {correctCount}/{total} correct.
          </strong>{' '}
          {ecg.sources.length > 0 ? <em>Sources: {ecg.sources.join(' · ')}</em> : null}
        </div>
      )}
    </div>
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

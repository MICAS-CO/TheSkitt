import { useMemo, useState } from 'react';
import { pickTodaysChallenge } from '../../content/ecg-challenges';

const STORAGE_KEY = 'theSkitt.ecg.lastPlayed.v1';

interface Props {
  onExit: () => void;
}

/**
 * Daily ECG challenge screen (M15) — pulls today's rotating ECG from
 * the bank, walks the player through 3 steps, and shows a summary.
 * Tracks the date of the last completed challenge in localStorage so
 * we can surface a small "you've done today's" cue without coupling
 * to the main app state.
 */
export function EcgChallengeScreen({ onExit }: Props) {
  const ecg = useMemo(() => pickTodaysChallenge(), []);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => ecg.steps.map(() => null));
  const [revealed, setRevealed] = useState<boolean[]>(() => ecg.steps.map(() => false));
  const total = ecg.steps.length;
  const done = revealed.filter(Boolean).length === total;
  const correctCount = revealed.reduce((acc, r, i) => {
    if (!r) return acc;
    return answers[i] === ecg.steps[i]!.correctIndex ? acc + 1 : acc;
  }, 0);

  function answer(index: number) {
    if (revealed[step]) return;
    setAnswers((a) => a.map((v, i) => (i === step ? index : v)));
  }

  function reveal() {
    setRevealed((r) => r.map((v, i) => (i === step ? true : v)));
    if (step === total - 1) {
      try {
        window.localStorage.setItem(STORAGE_KEY, new Date().toISOString().slice(0, 10));
      } catch {
        // ignore
      }
    }
  }

  function next() {
    if (step < total - 1) setStep((s) => s + 1);
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  const current = ecg.steps[step]!;

  return (
    <div className="ecg">
      <header className="ecg__head">
        <div>
          <span className="ecg__eyebrow">DAILY ECG · {new Date().toLocaleDateString('en-GB')}</span>
          <h2 className="ecg__title">{ecg.title}</h2>
          <p className="ecg__context">{ecg.context}</p>
        </div>
        <button onClick={onExit} className="ecg__exit">
          ← menu
        </button>
      </header>

      <section className="ecg__strip-card" aria-label="Rhythm strip">
        <pre className="ecg__strip">{ecg.strip}</pre>
      </section>

      <nav className="ecg__progress" aria-label="Question progress">
        {ecg.steps.map((_, i) => (
          <button
            key={i}
            className={`ecg__progress-dot ${i === step ? 'is-active' : ''} ${
              revealed[i] ? (answers[i] === ecg.steps[i]!.correctIndex ? 'is-correct' : 'is-wrong') : ''
            }`}
            onClick={() => setStep(i)}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <section className="ecg__question">
        <h3 className="ecg__prompt">{current.prompt}</h3>
        <ul className="ecg__options">
          {current.options.map((opt, i) => {
            const picked = answers[step] === i;
            const isCorrect = i === current.correctIndex;
            const isRevealed = revealed[step];
            const cls = [
              'ecg__option',
              picked ? 'is-picked' : '',
              isRevealed && isCorrect ? 'is-correct' : '',
              isRevealed && picked && !isCorrect ? 'is-wrong' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <li key={i}>
                <button
                  className={cls}
                  onClick={() => answer(i)}
                  disabled={isRevealed}
                >
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>

        {revealed[step] && (
          <div className="ecg__rationale">
            <strong>Why:</strong> {current.rationale}
          </div>
        )}

        <div className="ecg__actions">
          <button onClick={prev} disabled={step === 0}>
            ← back
          </button>
          {!revealed[step] && (
            <button
              className="enc__primary"
              onClick={reveal}
              disabled={answers[step] === null}
            >
              reveal answer
            </button>
          )}
          {revealed[step] && step < total - 1 && (
            <button className="enc__primary" onClick={next}>
              next question →
            </button>
          )}
        </div>
      </section>

      {done && (
        <section className="ecg__summary">
          <h3>Done. {correctCount}/{total} correct.</h3>
          <ul>
            <li>Title: {ecg.title}</li>
            <li>Sources: {ecg.sources.join(' · ')}</li>
          </ul>
          <button onClick={onExit}>← back to menu</button>
        </section>
      )}
    </div>
  );
}

/**
 * Disposition phase (M61: extracted from EncounterScreen).
 *
 * Pick where the patient goes. Once picked, surfaces the criteria
 * (M11) + the one-line narrative epilogue (M56). Player can change
 * their pick before going to debrief.
 */

import type { CaseRuntime } from '../../../sim/kernel';

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

export function DispositionPhase({
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
              {hasPicked && (
                <>
                  <p className="enc__card-body">{d.criteria}</p>
                  {d.epilogue && <p className="enc__disposition-epilogue">{d.epilogue}</p>}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

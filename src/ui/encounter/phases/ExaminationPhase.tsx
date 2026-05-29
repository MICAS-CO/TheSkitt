/**
 * Examination phase (M61: extracted from EncounterScreen).
 *
 * Renders the systems list. Each system card has:
 *  - a base findings list (revealed on click)
 *  - an optional manoeuvres list (M40 — discoverable techniques per
 *    system that reveal their own findings only when performed)
 */

import type { CaseRuntime } from '../../../sim/kernel';
import { IconRedFlag } from '../../../style/icons';

function ExaminationFindingRow({
  f,
}: {
  f: { name: string; value?: string; pertinent_negative?: boolean; red_flag?: boolean };
}) {
  return (
    <li className={f.red_flag ? 'is-red-flag' : ''}>
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
  );
}

export function ExaminationPhase({
  cs,
  onExamine,
  onPerformManoeuvre,
}: {
  cs: CaseRuntime;
  onExamine: (s: string) => void;
  onPerformManoeuvre: (system: string, manoeuvreId: string) => void;
}) {
  return (
    <section className="enc__phase">
      <h2>Examination</h2>
      <p className="enc__hint">
        Select a system to examine. Some systems offer specific manoeuvres — performing them is
        the difference between a glance and a finding.
      </p>
      <ul className="enc__cards">
        {cs.data.examination.map((e) => {
          const isExamined = cs.examined.has(e.system);
          const manoeuvres = e.manoeuvres ?? [];
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
                <>
                  <ul className="enc__findings">
                    {e.findings.map((f, i) => (
                      <ExaminationFindingRow key={i} f={f} />
                    ))}
                  </ul>
                  {manoeuvres.length > 0 && (
                    <div className="enc__manoeuvres">
                      <p className="enc__manoeuvres-label">
                        Specific manoeuvres ({manoeuvres.length})
                      </p>
                      <ul className="enc__manoeuvres-list">
                        {manoeuvres.map((m) => {
                          const key = `${e.system}::${m.id}`;
                          const done = cs.performedManoeuvres.has(key);
                          return (
                            <li
                              key={m.id}
                              className={`enc__manoeuvre ${done ? 'is-done' : ''}`}
                            >
                              <button
                                type="button"
                                className="enc__manoeuvre-trigger"
                                onClick={() => onPerformManoeuvre(e.system, m.id)}
                                disabled={done}
                              >
                                <span className="enc__manoeuvre-marker">{done ? '✓' : '▸'}</span>
                                {m.label}
                              </button>
                              {done && (
                                <ul className="enc__findings enc__findings--manoeuvre">
                                  {m.findings.map((f, i) => (
                                    <ExaminationFindingRow key={i} f={f} />
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

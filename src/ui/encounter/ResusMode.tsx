import { useState } from 'react';
import type { CaseRuntime } from '../../sim/kernel';
import { IconMustDo } from '../../style/icons';

/**
 * Resus-mode encounter view (M13).
 *
 * For SLO-3 / resus cases, the management section is reorganised
 * spatially as an ABCDE action wheel rather than a flat checklist.
 * Each letter tile expands to show the management actions the author
 * tagged with that letter; actions left untagged appear in an "Other"
 * bucket. Taking an action invokes the same kernel.toggleAction —
 * sequence-aware penalties are not modelled here (covered by
 * scheduled deterioration clauses in the kernel).
 */

const LETTER_LABELS: Record<'A' | 'B' | 'C' | 'D' | 'E', string> = {
  A: 'Airway',
  B: 'Breathing',
  C: 'Circulation',
  D: 'Disability',
  E: 'Exposure',
};

export function ResusMode({
  cs,
  onAction,
}: {
  cs: CaseRuntime;
  onAction: (actionId: string) => void;
}) {
  const [activeLetter, setActiveLetter] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const buckets = bucketActions(cs);
  const protocol = cs.data.resus_protocol;

  return (
    <section className="resus" aria-label="Resus mode">
      <header className="resus__head">
        <div>
          <span className="resus__chip">RESUS</span>
          <h2 className="resus__title">
            {protocol ? PROTOCOL_LABELS[protocol] : 'Stabilisation tray'}
          </h2>
        </div>
        <p className="resus__hint">
          Work the ABCDE in order. Acting still ticks the clock — the kernel will fire any
          deterioration clauses configured for this case.
        </p>
      </header>

      <ol className="resus__wheel" role="tablist" aria-label="ABCDE tiles">
        {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
          const actions = buckets[letter];
          const taken = actions.filter((a) => cs.actions.has(a.id)).length;
          const total = actions.length;
          const mustDoLeft = actions.filter((a) => a.must_do && !cs.actions.has(a.id)).length;
          return (
            <li key={letter}>
              <button
                role="tab"
                aria-selected={activeLetter === letter}
                onClick={() => setActiveLetter(letter)}
                className={`resus__letter resus__letter--${letter} ${
                  activeLetter === letter ? 'is-active' : ''
                } ${mustDoLeft > 0 ? 'has-must-do' : ''}`}
              >
                <span className="resus__letter-glyph">{letter}</span>
                <span className="resus__letter-name">{LETTER_LABELS[letter]}</span>
                <span className="resus__letter-count">
                  {total === 0 ? '—' : `${taken}/${total}`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="resus__panel">
        <h3 className="resus__panel-title">{LETTER_LABELS[activeLetter]}</h3>
        {buckets[activeLetter].length === 0 ? (
          <p className="enc__hint">No author-tagged {activeLetter} actions on this case.</p>
        ) : (
          <ul className="enc__cards">
            {buckets[activeLetter].map((m) => {
              const isPicked = cs.actions.has(m.id);
              return (
                <li key={m.id} className={`enc__card ${isPicked ? 'is-picked' : ''}`}>
                  <label className="enc__card-head enc__card-head--check">
                    <input type="checkbox" checked={isPicked} onChange={() => onAction(m.id)} />
                    <span className="enc__chip">{m.category}</span>
                    <span>{m.name}</span>
                    {m.must_do && !isPicked && (
                      <span className="enc__chip enc__chip--attn">
                        <IconMustDo size={12} fill="#fff" />
                        <span style={{ marginLeft: 4 }}>must-do</span>
                      </span>
                    )}
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
        )}
      </div>

      {buckets.other.length > 0 && (
        <details className="resus__other">
          <summary>
            Other management actions ({buckets.other.length} not tagged ABCDE) — open if needed.
          </summary>
          <ul className="enc__cards">
            {buckets.other.map((m) => {
              const isPicked = cs.actions.has(m.id);
              return (
                <li key={m.id} className={`enc__card ${isPicked ? 'is-picked' : ''}`}>
                  <label className="enc__card-head enc__card-head--check">
                    <input type="checkbox" checked={isPicked} onChange={() => onAction(m.id)} />
                    <span className="enc__chip">{m.category}</span>
                    <span>{m.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}

function bucketActions(cs: CaseRuntime) {
  type Bucket = {
    A: typeof cs.data.management;
    B: typeof cs.data.management;
    C: typeof cs.data.management;
    D: typeof cs.data.management;
    E: typeof cs.data.management;
    other: typeof cs.data.management;
  };
  const out: Bucket = { A: [], B: [], C: [], D: [], E: [], other: [] };
  for (const m of cs.data.management) {
    if (m.resus_letter) out[m.resus_letter].push(m);
    else out.other.push(m);
  }
  return out;
}

const PROTOCOL_LABELS: Record<NonNullable<CaseRuntime['data']['resus_protocol']>, string> = {
  als_adult: 'ALS — adult (Resus Council UK)',
  apls_paeds: 'APLS — paediatric',
  atls: 'ATLS — trauma',
  choking_adult: 'Adult choking algorithm',
  choking_child: 'Paediatric choking algorithm',
};

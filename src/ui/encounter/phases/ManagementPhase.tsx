/**
 * Management phase (M61: extracted from EncounterScreen).
 *
 * Renders the drug-chart styled action list. Each row is a check
 * with a diegetic 16×16 prop sprite (M45), a sim-time stamp, a
 * trap-hint chip (M32 / settings-driven), and a sequence-error
 * indicator (M20). The list itself is gated by the player's prior
 * history-taking via M35 gated_by_history.
 */

import { useMemo } from 'react';
import type { CaseT } from '../../../content/schema';
import type { CaseRuntime } from '../../../sim/kernel';
import { IconTrap } from '../../../style/icons';
import { PROP_SPRITES, propFrameToSvg, propIdForAction } from '../../../style/propSprites';
import { hasPerk } from '../../../state/progression';

function trapHintsEnabled(): boolean {
  try {
    return window.localStorage.getItem('theSkitt.trapHints.v1') === '1';
  } catch {
    return false;
  }
}

function ActionPropSprite({ action }: { action: CaseT['management'][number] }) {
  const id = useMemo(() => propIdForAction(action), [action]);
  const svg = useMemo(() => {
    if (!id) return null;
    const rows = PROP_SPRITES[id];
    if (!rows) return null;
    return propFrameToSvg(rows, 1);
  }, [id]);
  if (!svg)
    return <span className="drugchart__prop drugchart__prop--placeholder" aria-hidden="true" />;
  return (
    <span
      className="drugchart__prop"
      aria-hidden="true"
      title={id?.replace(/_/g, ' ')}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function ManagementPhase({
  cs,
  onToggle,
}: {
  cs: CaseRuntime;
  onToggle: (id: string) => void;
}) {
  const trapHints = useMemo(() => trapHintsEnabled() || hasPerk('perk_trap_aware'), []);
  const trapHintsForced = useMemo(
    () => !trapHintsEnabled() && hasPerk('perk_trap_aware'),
    [],
  );
  const visibleManagement = cs.data.management.filter(
    (m) => !m.gated_by_history || m.gated_by_history.some((id) => cs.asked.has(id)),
  );
  const hiddenByGate = cs.data.management.length - visibleManagement.length;
  const hasStat = visibleManagement.some((m) => m.must_do && m.drug);
  return (
    <section className="enc__phase enc__phase--drugchart">
      <header className="drugchart__head">
        <div className="drugchart__head-meta">PRESCRIPTION &amp; ACTION CHART</div>
        <div className="drugchart__head-title">{cs.data.chief_complaint}</div>
        {hasStat && <span className="drugchart__stat-stamp">STAT</span>}
      </header>
      <p className="enc__hint">
        Tick what you give. The time column stamps each action with the sim-min you ticked it.
        Some options are distractors.
        {hiddenByGate > 0 && (
          <>
            {' '}
            <em>
              {hiddenByGate} more option{hiddenByGate === 1 ? '' : 's'} will appear once you ask
              the right history.
            </em>
          </>
        )}
        {trapHints && (
          <em>
            {' '}
            Trap hints are on {trapHintsForced ? '(via the Trap-aware perk)' : '(Settings)'}.
          </em>
        )}
      </p>
      <div className="drugchart__cols">
        <span className="drugchart__col-h drugchart__col-h--time">TIME</span>
        <span className="drugchart__col-h drugchart__col-h--name">DRUG · DOSE · ROUTE</span>
        <span className="drugchart__col-h drugchart__col-h--cat">CATEGORY</span>
      </div>
      <ul className="drugchart__rows">
        {visibleManagement.map((m) => {
          const isPicked = cs.actions.has(m.id);
          const atMin = cs.actionsAt.get(m.id);
          const sequenceError = cs.sequenceErrors.has(m.id);
          return (
            <li
              key={m.id}
              className={`drugchart__row ${isPicked ? 'is-given' : ''} ${
                sequenceError ? 'is-sequence-error' : ''
              }`}
            >
              <label className="drugchart__row-head">
                <span className="drugchart__row-time">
                  {atMin !== undefined ? `T+${atMin}m` : '—'}
                </span>
                <span className="drugchart__row-name">
                  <input type="checkbox" checked={isPicked} onChange={() => onToggle(m.id)} />
                  <ActionPropSprite action={m} />
                  <span>{m.name}</span>
                  {m.must_do && isPicked && <span className="drugchart__row-stat">STAT</span>}
                  {trapHints && m.must_not_do && !isPicked && (
                    <span
                      className="drugchart__row-trap"
                      title="examiner trap — flagged by your trap-hints setting"
                    >
                      <IconTrap size={12} fill="#E0A82E" />
                      trap
                    </span>
                  )}
                  {sequenceError && (
                    <span
                      className="drugchart__row-seq"
                      title="taken out of authored sequence"
                    >
                      ↯ out of sequence
                    </span>
                  )}
                </span>
                <span className="drugchart__row-cat">{m.category}</span>
              </label>
              {m.drug && (
                <p className="drugchart__row-dose">
                  {m.drug.amount} · {m.drug.route} · {m.drug.frequency}
                  {m.drug.paeds_dose ? ` · paeds: ${m.drug.paeds_dose}` : ''}
                </p>
              )}
              {m.detail && <p className="drugchart__row-detail">{m.detail}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

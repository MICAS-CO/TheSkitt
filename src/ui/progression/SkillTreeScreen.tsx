import { useMemo, useState } from 'react';
import {
  loadProgression,
  resetProgression,
  PERKS,
  sloLabel,
  type Progression,
} from '../../state/progression';

interface Props {
  onExit: () => void;
}

/**
 * Skill tree screen (M16). Cross-shift visualisation of the player's
 * total XP, per-SLO progress, and which perks they have unlocked vs
 * still locked. The data lives in localStorage; this screen is a
 * read view + a small 'reset' affordance for replay.
 */
export function SkillTreeScreen({ onExit }: Props) {
  const [version, setVersion] = useState(0);
  // version intentionally invalidates the memo when the player resets.
  const p = useMemo<Progression>(
    () => loadProgression(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  const slos = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="skilltree">
      <header className="skilltree__head">
        <div>
          <span className="skilltree__eyebrow">PROGRESSION</span>
          <h2 className="skilltree__title">
            Skill tree <span className="skilltree__total">· {p.totalXp} XP</span>
          </h2>
          <p className="skilltree__hint">
            Built across all your shifts. Per-SLO XP is split evenly between the SLOs each case
            tags.
          </p>
        </div>
        <button onClick={onExit}>← menu</button>
      </header>

      <section className="skilltree__sloblock">
        <h3>RCEM SLO mastery</h3>
        <ul className="skilltree__slo-list">
          {slos.map((s) => {
            const xp = p.perSloXp[s] ?? 0;
            const pct = Math.min(100, Math.round(xp / 4));
            return (
              <li key={s} className="skilltree__slo">
                <div className="skilltree__slo-head">
                  <span className="skilltree__slo-label">{sloLabel(s)}</span>
                  <span className="skilltree__slo-xp">{xp} XP</span>
                </div>
                <div
                  className="skilltree__slo-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={400}
                  aria-valuenow={xp}
                >
                  <span style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="skilltree__perks">
        <h3>Perks</h3>
        <ul className="skilltree__perk-list">
          {PERKS.map((perk) => {
            const unlocked = p.unlockedPerks.includes(perk.id);
            return (
              <li key={perk.id} className={`skilltree__perk ${unlocked ? 'is-unlocked' : 'is-locked'}`}>
                <div className="skilltree__perk-head">
                  <strong>{perk.title}</strong>
                  <span className="skilltree__perk-status">{unlocked ? '✓ unlocked' : 'locked'}</span>
                </div>
                <p>{perk.description}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="skilltree__cases">
        <h3>Cases completed ({p.caseIdsCompleted.length})</h3>
        {p.caseIdsCompleted.length === 0 ? (
          <p>None yet. Start a shift from the menu.</p>
        ) : (
          <ul>
            {p.caseIdsCompleted.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        )}
      </section>

      <footer className="skilltree__foot">
        <button onClick={onExit}>← back to menu</button>
        <button
          onClick={() => {
            const confirmed = confirm(
              'Reset all progression? This clears XP, completed cases, and unlocked perks.',
            );
            if (confirmed) {
              resetProgression();
              setVersion((v) => v + 1);
            }
          }}
        >
          Reset progression
        </button>
      </footer>
    </div>
  );
}

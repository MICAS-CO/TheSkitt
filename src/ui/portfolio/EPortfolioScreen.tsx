/**
 * E-portfolio (M83).
 *
 * The destination for completed shifts. Surfaces:
 *   - Block-by-block accessibility + keystone state
 *   - The full log of completed shifts (every attempt, in
 *     reverse-chronological order — failed keystone retries appear
 *     alongside successes)
 *   - A "replay" affordance per entry that re-runs the shift
 *
 * Replaces the pre-M82 Practice library button on the menu (per the
 * M81 design consultation: the front door is the rota; case-by-case
 * drilling lives inside the e-portfolio). Random-recall + per-case
 * granular drill are M84 scope.
 */

import { useMemo } from 'react';
import {
  getBlockProgress,
  loadRota,
  type CompletedShift,
  type RotaState,
} from '../../state/shiftRota';
import { BLOCKS, ROTA_ORDER } from '../../state/rotaOrder';

interface Props {
  /** Lookup for shift titles. Passed from App to avoid importing
   *  SHIFT_DEFS here directly (avoids a circular import). */
  shiftTitleById: Record<string, string>;
  onReplay: (episodeId: string) => void;
  /** M84: open the case library (CasePracticeScreen) for case-by-case
   *  drilling. The library was hidden from the menu at M82; this is
   *  its re-exposure point per the M81 design consultation. */
  onShowPractice: () => void;
  onExit: () => void;
}

export function EPortfolioScreen({
  shiftTitleById,
  onReplay,
  onShowPractice,
  onExit,
}: Props) {
  const rota: RotaState | null = useMemo(() => loadRota(), []);
  const blocks = useMemo(
    () => (rota ? getBlockProgress(rota, BLOCKS, ROTA_ORDER) : []),
    [rota],
  );

  if (!rota) {
    return (
      <div className="eportfolio">
        <header className="eportfolio__head">
          <h2 className="eportfolio__title">E-portfolio</h2>
          <button onClick={onExit}>← menu</button>
        </header>
        <p className="eportfolio__empty">
          No shifts on file yet. Finish a shift from the rota and it&rsquo;ll appear here.
        </p>
      </div>
    );
  }

  // Reverse-chronological — most recent attempt first.
  const entries = [...rota.completedShifts].reverse();

  // M84: random recall is a deterministic-ish pick from the distinct
  // episodes the player has attempted. The synthesis called it a
  // "warm-up button" — it just opens one of your prior shifts at
  // random. Disabled when nothing is on file yet.
  const attemptedEpisodeIds = Array.from(
    new Set(rota.completedShifts.map((c) => c.episodeId)),
  );
  function onRandomRecall() {
    if (attemptedEpisodeIds.length === 0) return;
    const pick =
      attemptedEpisodeIds[Math.floor(Math.random() * attemptedEpisodeIds.length)]!;
    onReplay(pick);
  }

  return (
    <div className="eportfolio">
      <header className="eportfolio__head">
        <div>
          <span className="eportfolio__eyebrow">RCEM e-portfolio</span>
          <h2 className="eportfolio__title">
            Your shifts on file
            <span className="eportfolio__count"> · {entries.length} attempt{entries.length === 1 ? '' : 's'}</span>
          </h2>
          <p className="eportfolio__hint">
            Every shift you finish lands here. Failed keystone attempts log too — the
            e-portfolio is the journey, not the trophy cabinet.
          </p>
        </div>
        <button onClick={onExit}>← menu</button>
      </header>

      <section className="eportfolio__blocks">
        <h3>Block progress</h3>
        <ul className="eportfolio__block-list">
          {blocks.map((b) => {
            const keystoneTitle = shiftTitleById[b.keystoneEpisodeId] ?? b.keystoneEpisodeId;
            const status = !b.accessible
              ? 'locked'
              : b.keystoneCleared
                ? 'cleared'
                : 'in-progress';
            return (
              <li key={b.blockIndex} className={`eportfolio__block eportfolio__block--${status}`}>
                <div className="eportfolio__block-head">
                  <strong>Block {b.blockIndex}</strong>
                  <span className="eportfolio__block-status">
                    {status === 'cleared'
                      ? '✓ keystone cleared'
                      : status === 'in-progress'
                        ? `${b.shiftsAttempted}/${b.shiftCount} attempted`
                        : 'locked — clear the previous keystone'}
                  </span>
                </div>
                <p className="eportfolio__block-keystone">
                  Keystone:{' '}
                  <span className="eportfolio__block-keystone-title">{keystoneTitle}</span>
                  {b.keystoneCleared ? '' : ' — clear at SHO band or better to unlock the next block.'}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="eportfolio__actions">
        <h3>Warm up</h3>
        <div className="eportfolio__action-row">
          <button
            className="eportfolio__action"
            onClick={onRandomRecall}
            // M84: disabled until at least 2 distinct shifts are on
            // file — random across a single pool of 1 is deterministic
            // and reads as broken. Round-1 reviewer caught this.
            disabled={attemptedEpisodeIds.length < 2}
            title={
              attemptedEpisodeIds.length === 0
                ? 'Random recall opens once you have shifts on file.'
                : attemptedEpisodeIds.length === 1
                  ? 'Random recall needs at least 2 different shifts on file. Try another one first.'
                  : `Random pick from ${attemptedEpisodeIds.length} attempted shifts.`
            }
          >
            <span className="eportfolio__action-eyebrow">Random recall</span>
            <span className="eportfolio__action-title">Roll the dice — drill any prior shift</span>
            <span className="eportfolio__action-meta">
              Pulls one shift at random from the episodes you&rsquo;ve already attempted.
              No rota implications.
            </span>
          </button>
          <button className="eportfolio__action" onClick={onShowPractice}>
            <span className="eportfolio__action-eyebrow">Case library</span>
            <span className="eportfolio__action-title">Drill a specific patient</span>
            <span className="eportfolio__action-meta">
              Browse the full case library by patient + diagnosis. Each one launches
              its home shift.
            </span>
          </button>
        </div>
      </section>

      <section className="eportfolio__log">
        <h3>Attempts log</h3>
        {entries.length === 0 ? (
          <p>Finish a shift and the entry appears here.</p>
        ) : (
          <ul className="eportfolio__entries">
            {entries.map((entry, i) => (
              <PortfolioEntry
                key={`${entry.episodeId}-${entry.completedIso}-${i}`}
                entry={entry}
                title={shiftTitleById[entry.episodeId] ?? entry.episodeId}
                onReplay={() => onReplay(entry.episodeId)}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="eportfolio__disclaimer">
        Study material. Not medical advice. Not a substitute for supervised clinical training.
      </p>
    </div>
  );
}

function PortfolioEntry({
  entry,
  title,
  onReplay,
}: {
  entry: CompletedShift;
  title: string;
  onReplay: () => void;
}) {
  const when = useMemo(() => formatWhen(entry.completedIso), [entry.completedIso]);
  return (
    <li className={`eportfolio__entry eportfolio__entry--${entry.band}`}>
      <div className="eportfolio__entry-main">
        <span className="eportfolio__entry-title">{title}</span>
        <span className="eportfolio__entry-when">{when}</span>
      </div>
      <div className="eportfolio__entry-side">
        <span className={`eportfolio__band eportfolio__band--${entry.band}`}>
          {entry.band}
        </span>
        <button className="eportfolio__entry-replay" onClick={onReplay}>
          replay →
        </button>
      </div>
    </li>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  // Compact relative format for recents, ISO date for older.
  const ageMs = Date.now() - d.getTime();
  const ageMin = Math.floor(ageMs / 60000);
  if (ageMin < 1) return 'just now';
  if (ageMin < 60) return `${ageMin}m ago`;
  const ageHr = Math.floor(ageMin / 60);
  if (ageHr < 24) return `${ageHr}h ago`;
  const ageDay = Math.floor(ageHr / 24);
  if (ageDay < 7) return `${ageDay}d ago`;
  return d.toISOString().slice(0, 10);
}

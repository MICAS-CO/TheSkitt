import { useEffect, useMemo, useState } from 'react';
import { useSim, scoreEpisode, type EpisodeReport, type PerCaseReport } from '../../state/sim';
import type { CitationT } from '../../content/schema';
import {
  applyCaseAward,
  computeCaseXp,
  loadProgression,
  saveProgression,
  type Progression,
  type PerCaseXp,
} from '../../state/progression';
import { memoFromEpisodeReport, saveLastShiftMemo } from '../../state/consultant';
import {
  Achievement,
  BADGES,
  badgeFrameToSvg,
  loadUnlocked,
  saveUnlocked,
  scanAchievements,
} from '../../state/achievements';

interface Props {
  onExit: () => void;
  onReplay: () => void;
}

export function EpisodeDebriefScreen({ onExit, onReplay }: Props) {
  useSim((s) => s.tick);
  const kernel = useSim((s) => s.kernel);
  const [awarded, setAwarded] = useState<{ awards: PerCaseXp[]; before: Progression; after: Progression } | null>(
    null,
  );
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const report = useMemo(() => (kernel ? scoreEpisode(kernel.getState()) : null), [kernel]);

  // Award XP once per shift end. Safe-by-construction: we de-dup case IDs
  // against the existing progression snapshot, so the only new XP comes
  // from cases not previously completed OR retries of previously
  // completed cases (which earn a smaller award since they don't get the
  // first-completion bonus).
  useEffect(() => {
    if (!kernel || !report || awarded) return;
    const ks = kernel.getState();
    const before = loadProgression();
    let progression = before;
    const awards: PerCaseXp[] = [];
    for (const c of [...report.cases, ...report.ambientCases]) {
      if (!c.attended) continue;
      const rt = ks.cases.get(c.caseId);
      if (!rt) continue;
      const award = computeCaseXp(
        { caseId: c.caseId, data: rt.data },
        c.score,
        before.caseIdsCompleted.includes(c.caseId),
      );
      awards.push(award);
      progression = applyCaseAward(progression, award);
    }
    if (awards.length > 0) {
      saveProgression(progression);
    }
    // M37: persist a co-worker memo for the next session's menu.
    saveLastShiftMemo(memoFromEpisodeReport(report));
    // M70: scan for newly-earned achievement badges. Persist + count
    // the total shifts played so the marathon badge eventually unlocks.
    const SHIFT_COUNT_KEY = 'theSkitt.shiftCount.v1';
    const totalShifts = (() => {
      try {
        const n = Number(window.localStorage.getItem(SHIFT_COUNT_KEY) ?? '0') + 1;
        window.localStorage.setItem(SHIFT_COUNT_KEY, String(n));
        return n;
      } catch {
        return 1;
      }
    })();
    const allAttended = [...report.cases, ...report.ambientCases].filter((c) => c.attended);
    const totalSeqErrors = allAttended.reduce((s, c) => s + c.score.sequenceErrors, 0);
    const branchesWithPositive = allAttended.filter((c) => c.score.rapport > 0).length;
    const totalBranchesAvail = allAttended.reduce((s, c) => s + c.score.branchesAvailable, 0);
    const unlocked = loadUnlocked();
    const newly = scanAchievements(
      {
        livesSaved: report.livesSaved,
        band: report.band,
        sequenceErrors: totalSeqErrors,
        totalShiftsPlayed: totalShifts,
        attendedCaseIds: allAttended.map((c) => c.caseId),
        branchesWithPositiveRapport: branchesWithPositive,
        branchesAvailable: totalBranchesAvail,
      },
      unlocked,
    );
    for (const id of newly) unlocked.add(id);
    if (newly.length > 0) saveUnlocked(unlocked);
    setAwarded({ awards, before, after: progression });
    setNewBadges(newly);
  }, [kernel, report, awarded]);

  if (!kernel || !report) return null;

  return (
    <div className="enc">
      <header className="enc__head">
        <div>
          <div className="enc__head-title">
            End of shift — {report.episodeTitle}{' '}
            <span className={`enc__chip enc__chip--state-${stateChip(report.band)}`}>
              {report.band}
            </span>
          </div>
          <div className="enc__head-meta">
            T+{report.clockMin}m / {report.shiftDurationMin}m · {report.cases.length} focus case
            {report.cases.length === 1 ? '' : 's'} · {report.arcs.length} arc
            {report.arcs.length === 1 ? '' : 's'}
          </div>
        </div>
        <button className="enc__exit" onClick={onExit}>
          ← menu
        </button>
      </header>

      <main className="ep-debrief">
        <Overall report={report} />
        {newBadges.length > 0 && <BadgesUnlockedPanel ids={newBadges} />}
        {awarded && awarded.awards.length > 0 && <XpPanel awarded={awarded} />}
        <CasesPanel cases={report.cases} title="Focus cases" />
        {report.ambientCases.length > 0 && (
          <CasesPanel cases={report.ambientCases} title="Ambient board" />
        )}
        {report.arcs.length > 0 && <ArcsPanel report={report} />}
        <ExaminerNotes report={report} />
        <SourcesPanel sources={report.sources} />

        <p className="enc__disclaimer">
          Study material. Not medical advice. Not a substitute for supervised clinical training.
        </p>
      </main>

      <footer className="enc__foot">
        <button onClick={onExit}>← back to menu</button>
        <button className="enc__primary" onClick={onReplay} title="Restart this shift from T+0">
          ↻ play this shift again
        </button>
      </footer>
    </div>
  );
}

function Overall({ report }: { report: EpisodeReport }) {
  return (
    <section className={`ep-debrief__overall ep-debrief__overall--${report.band}`}>
      <div className="ep-debrief__big">
        <div className="ep-debrief__pct">{report.overallPercent}%</div>
        <div className="ep-debrief__band">{report.band.toUpperCase()}</div>
      </div>
      <ul className="ep-debrief__overall-meta">
        <li>
          Cases attended: <strong>{report.cases.filter((c) => c.attended).length}</strong>/
          {report.cases.length}
        </li>
        <li>
          Per-case average: <strong>{report.averagePercent}%</strong>
        </li>
        <li>
          Patients safely managed: <strong>{report.livesSaved}</strong>
        </li>
        {report.livesLost > 0 && (
          <li className="ep-debrief__warn">
            Lives lost: <strong>{report.livesLost}</strong>
          </li>
        )}
        {report.unsafeCases > 0 && report.livesLost === 0 && (
          <li className="ep-debrief__warn">
            Unsafe-band cases: <strong>{report.unsafeCases}</strong>
          </li>
        )}
      </ul>
    </section>
  );
}

function BadgesUnlockedPanel({ ids }: { ids: string[] }) {
  const items = ids
    .map((id) => BADGES[id])
    .filter((b): b is Achievement => b !== undefined);
  if (items.length === 0) return null;
  return (
    <section className="ep-debrief__badges" aria-label="Badges unlocked">
      <h3 className="ep-debrief__badges-head">Unlocked this shift</h3>
      <div className="ep-debrief__badges-row">
        {items.map((b) => (
          <figure key={b.id} className="ep-debrief__badge">
            <div
              className="ep-debrief__badge-art"
              dangerouslySetInnerHTML={{ __html: badgeFrameToSvg(b.rows, 5) }}
            />
            <figcaption>
              <strong>{b.title}</strong>
              <span>{b.sub}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function XpPanel({
  awarded,
}: {
  awarded: { awards: PerCaseXp[]; before: Progression; after: Progression };
}) {
  const earned = awarded.after.totalXp - awarded.before.totalXp;
  const newPerks = awarded.after.unlockedPerks.filter((id) => !awarded.before.unlockedPerks.includes(id));
  return (
    <section className="ep-debrief__section ep-debrief__xp">
      <h3>
        XP earned this shift · <strong>+{earned}</strong>{' '}
        <span className="ep-debrief__xp-total">(total {awarded.after.totalXp})</span>
      </h3>
      <ul className="ep-debrief__xp-list">
        {awarded.awards.map((a) => (
          <li key={a.caseId}>
            <div className="ep-debrief__xp-row">
              <span>{a.caseTitle}</span>
              <strong>+{a.xp} XP</strong>
            </div>
            <ul className="ep-debrief__xp-breakdown">
              {a.breakdown.map((b, i) => (
                <li key={i} className={b.xp < 0 ? 'is-negative' : ''}>
                  {b.label}: {b.xp > 0 ? '+' : ''}
                  {b.xp}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {newPerks.length > 0 && (
        <div className="ep-debrief__perks-new">
          <strong>Unlocked perks:</strong> {newPerks.join(', ')}
        </div>
      )}
    </section>
  );
}

function CasesPanel({ cases, title }: { cases: PerCaseReport[]; title: string }) {
  return (
    <section className="ep-debrief__section">
      <h3>{title}</h3>
      <ul className="ep-debrief__case-list">
        {cases.map((c) => (
          <li key={c.caseId} className={`ep-debrief__case ep-debrief__case--${c.score.band}`}>
            <div className="ep-debrief__case-head">
              <span className="ep-debrief__case-title">{c.title}</span>
              <span className={`enc__chip enc__chip--state-${c.finalState}`}>{c.finalState}</span>
              <span className={`ep-debrief__case-band ep-debrief__case-band--${c.score.band}`}>
                {c.score.percent}% · {c.score.band}
              </span>
            </div>
            <div className="ep-debrief__case-meta">
              {c.chiefComplaint} · curriculum: {c.curriculumTags.slice(0, 5).join(', ')}
              {c.curriculumTags.length > 5 ? '…' : ''} · SLOs {c.slos.join(', ')}
            </div>
            <ul className="ep-debrief__case-stats">
              <li>
                Must-do: <strong>{c.score.mustDoDone}</strong>/{c.score.mustDoTotal}
              </li>
              <li>
                Working dx: <strong>{c.score.workingDxCorrect ? '✓' : '✗'}</strong>
              </li>
              <li>
                Disposition: <strong>{c.score.dispositionCorrect ? '✓' : '✗'}</strong>
              </li>
              {c.score.mustNotDoChosen > 0 && (
                <li className="ep-debrief__warn">
                  Traps picked: <strong>{c.score.mustNotDoChosen}</strong>
                </li>
              )}
              {c.score.sequenceErrors > 0 && (
                <li className="ep-debrief__warn">
                  Out-of-sequence: <strong>{c.score.sequenceErrors}</strong> action
                  {c.score.sequenceErrors === 1 ? '' : 's'}
                </li>
              )}
              {c.score.branchesAvailable > 0 && (
                <li>
                  Pivotal moments engaged: <strong>{c.score.branchesPicked}</strong>/
                  {c.score.branchesAvailable}
                  {c.score.rapport !== 0 ? ` · rapport ${c.score.rapport > 0 ? '+' : ''}${c.score.rapport}` : ''}
                </li>
              )}
              {c.score.workup.tracked && (
                <li
                  className={
                    c.score.workup.penaltyPercent > 0 ? 'ep-debrief__warn' : undefined
                  }
                >
                  Workup: <strong>{c.score.workup.essentialIxOrdered}</strong>/
                  {c.score.workup.essentialIxTotal} essential
                  {c.score.workup.extraIxOrdered > 0 && (
                    <>
                      {' · '}
                      <strong>{c.score.workup.extraIxOrdered}</strong> extra
                      {c.score.workup.penaltyPercent > 0 &&
                        ` (−${c.score.workup.penaltyPercent}%)`}
                    </>
                  )}
                </li>
              )}
              {!c.attended && (
                <li className="ep-debrief__warn">
                  <strong>Never attended</strong>
                </li>
              )}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ArcsPanel({ report }: { report: EpisodeReport }) {
  return (
    <section className="ep-debrief__section">
      <h3>Arcs</h3>
      <ul className="ep-debrief__arc-list">
        {report.arcs.map((a) => (
          <li key={a.arcId} className={`ep-debrief__arc ${a.revealed ? '' : 'is-missed'}`}>
            <span className="ep-debrief__arc-title">{a.title}</span>
            {a.revealed ? (
              <span className="ep-debrief__arc-status">
                ✓ revealed{a.revealedAtMin !== null ? ` at T+${a.revealedAtMin}m` : ''} ·{' '}
                {a.effectsApplied} effect{a.effectsApplied === 1 ? '' : 's'} applied
              </span>
            ) : (
              <span className="ep-debrief__arc-status">✗ never revealed</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExaminerNotes({ report }: { report: EpisodeReport }) {
  if (report.examinerNotes.length === 0) {
    return (
      <section className="ep-debrief__section">
        <h3>What the examiner wanted</h3>
        <p className="enc__hint">Clean run — no specific examiner feedback.</p>
      </section>
    );
  }
  return (
    <section className="ep-debrief__section">
      <h3>What the examiner wanted</h3>
      <ul className="ep-debrief__notes">
        {report.examinerNotes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </section>
  );
}

function SourcesPanel({ sources }: { sources: CitationT[] }) {
  return (
    <section className="ep-debrief__section">
      <h3>Sources cited across this shift</h3>
      <ul className="enc__sources">
        {sources.map((s, i) => (
          <li key={i}>
            <CitationLine c={s} />
          </li>
        ))}
      </ul>
    </section>
  );
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

function stateChip(band: EpisodeReport['band']): string {
  switch (band) {
    case 'excellent':
      return 'stable';
    case 'good':
      return 'admitted';
    case 'borderline':
      return 'deteriorating';
    case 'unsafe':
      return 'arrested';
  }
}

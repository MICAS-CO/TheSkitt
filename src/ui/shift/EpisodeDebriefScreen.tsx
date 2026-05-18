import { useSim, scoreEpisode, type EpisodeReport, type PerCaseReport } from '../../state/sim';
import type { CitationT } from '../../content/schema';

interface Props {
  onExit: () => void;
}

export function EpisodeDebriefScreen({ onExit }: Props) {
  useSim((s) => s.tick);
  const kernel = useSim((s) => s.kernel);
  if (!kernel) return null;

  const report = scoreEpisode(kernel.getState());

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
        <button className="enc__primary" onClick={onExit}>
          ← back to menu
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

/**
 * Recurring co-worker NPC (M37). Persists the most recent shift result
 * in localStorage and surfaces a 2-3 line consultant message on the
 * menu next time the player returns. The voice — Dr Aoife McGrath,
 * consultant in EM — stays identity-stable across the build; the
 * tone shifts by performance band.
 *
 * Per the game-design audit: 'A registrar who texts you between
 * shifts, a consultant who comments on your performance in debrief
 * in changing tone as your XP rises. This is the intrinsic narrative
 * agency the blueprint asks for and the build has nowhere.'
 *
 * Pure localStorage; safe in private mode (writes/reads no-op).
 */

import type { EpisodeReport } from './sim';

const KEY = 'theSkitt.lastShiftMemo.v1';
export const CONSULTANT_NAME = 'Dr Aoife McGrath';
export const CONSULTANT_ROLE = 'EM consultant';

export interface ShiftMemo {
  episodeId: string;
  episodeTitle: string;
  band: EpisodeReport['band'];
  livesSaved: number;
  livesLost: number;
  casesAttended: number;
  /** Curriculum tag bucket — e.g. the case-most-played's topic_id. */
  topTags: string[];
  /** Standout case for the consultant to point at — title only. */
  highlightCaseTitle: string | null;
  /** Net rapport across attended branching cases (M38). null when no
   *  branching cases were attended. The consultant comments on this
   *  bucket when present. */
  rapportBucket: 'warm' | 'neutral' | 'cold' | null;
  whenIso: string;
}

export function saveLastShiftMemo(memo: ShiftMemo): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memo));
  } catch {
    /* private mode — no-op */
  }
}

export function loadLastShiftMemo(): ShiftMemo | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ShiftMemo;
  } catch {
    return null;
  }
}

export function memoFromEpisodeReport(report: EpisodeReport, now: Date = new Date()): ShiftMemo {
  const allCases = [...report.cases, ...report.ambientCases];
  const attended = allCases.filter((c) => c.attended);
  const topTags = Array.from(
    new Set(attended.flatMap((c) => c.curriculumTags.slice(0, 2))),
  ).slice(0, 3);
  // Highlight: best-band attended case, else worst.
  const sortedByScore = [...attended].sort((a, b) => b.score.percent - a.score.percent);
  const highlight =
    report.band === 'excellent' || report.band === 'good'
      ? sortedByScore[0]
      : sortedByScore[sortedByScore.length - 1];
  // Rapport bucket (M38) — average across attended cases that had any
  // branching authored (branchesAvailable > 0). Skip cases without
  // branching so the bucket reflects relational moments, not noise.
  const branchingCases = attended.filter((c) => c.score.branchesAvailable > 0);
  let rapportBucket: ShiftMemo['rapportBucket'] = null;
  if (branchingCases.length > 0) {
    const avg =
      branchingCases.reduce((s, c) => s + c.score.rapport, 0) / branchingCases.length;
    rapportBucket = avg >= 1 ? 'warm' : avg <= -1 ? 'cold' : 'neutral';
  }
  return {
    episodeId: report.episodeId,
    episodeTitle: report.episodeTitle,
    band: report.band,
    livesSaved: report.livesSaved,
    livesLost: report.livesLost,
    casesAttended: attended.length,
    topTags,
    highlightCaseTitle: highlight?.title ?? null,
    rapportBucket,
    whenIso: now.toISOString(),
  };
}

export interface ConsultantMessage {
  greeting: string;
  body: string;
  signoff: string;
}

/**
 * M89 (Braintrust 10 round-2) — McGrath's voice evolves across the
 * rota. The same band of performance reads differently depending on
 * where the player is in the year-of-training the rota represents.
 * This helper appends a short, position-aware sentence to the band
 * body — never replacing it, just adding tone.
 *
 * Distinct beats at landmark positions (entry, block-1 keystone,
 * block-2 keystone, block-3 mid, block-3 final). Subtler atmospheric
 * beats at intermediate positions.
 */
function rotaPositionNote(rotaIndex: number | undefined, band: ShiftMemo['band']): string {
  if (rotaIndex === undefined || rotaIndex < 0) return '';
  // Landmark positions get specific beats. The unsafe band gets its
  // own specific tone; the others lean toward observation.
  if (rotaIndex === 0) {
    return band === 'unsafe'
      ? ' First shift on the floor. We start where we start. Come back in.'
      : ' First shift on the floor. The hardest one to read is yourself.';
  }
  if (rotaIndex === 4 && band !== 'unsafe') {
    return ' Block 1 cleared. The mileage starts to mean something from here.';
  }
  if (rotaIndex === 10 && band !== 'unsafe') {
    return " Halfway through what this rota was always going to teach you. Block 2 done.";
  }
  if (rotaIndex === 13) {
    // M89 round-1 reviewer flagged: safeguarding pattern misses
    // trigger Datix / safeguarding review, NOT a clinical M&M
    // (which is for morbidity / mortality). Corrected the
    // governance pathway names.
    return band === 'unsafe'
      ? " The Stan and Chloe pattern is the case the safeguarding review will write about, not the resus you missed."
      : " The Stan and Chloe pattern this week wasn't accidental. Read the safeguarding review when it lands.";
  }
  if (rotaIndex === 16) {
    return band === 'unsafe'
      ? " End of the rota. Mr Okafor was a system failure, not a personal one. We'll sit with this one."
      : " End of the rota. Sit a minute. You came in green; you leave knowing this floor.";
  }
  // Intermediate beats — block-aware atmospheric tone.
  if (rotaIndex >= 11) {
    return " You've been on the floor a while now. The pattern in this week's shifts isn't accidental.";
  }
  if (rotaIndex >= 5) {
    return ' Mid-rota. You should be feeling the workflow as muscle memory by now.';
  }
  return '';
}

/**
 * Compose a short consultant message keyed off the last shift memo.
 * Deterministic per memo — same input always renders the same lines,
 * so re-renders on the menu stay stable.
 *
 * M89: optional `rotaIndex` parameter shifts the tone of the body
 * based on where the player is in the rota's narrative arc.
 */
export function composeConsultantMessage(
  memo: ShiftMemo,
  playerFirstName?: string,
  rotaIndex?: number,
): ConsultantMessage {
  const sinceHours = hoursSince(memo.whenIso);
  const recency = sinceHours < 6 ? 'just now' : sinceHours < 24 ? 'earlier' : 'last shift';
  const greeting = `${CONSULTANT_NAME} — ${recency}${
    playerFirstName ? ` — for Dr ${playerFirstName}` : ''
  }`;

  const focus = memo.highlightCaseTitle ? `: ${memo.highlightCaseTitle}` : '';
  const tagBlurb = memo.topTags.length > 0 ? ` Around ${memo.topTags.slice(0, 2).join(' / ')}.` : '';
  // M38: rapport-bucket commentary added on top of the band line.
  const rapportLine =
    memo.rapportBucket === 'warm'
      ? ' Whatever you were doing in the room — the listening — keep it.'
      : memo.rapportBucket === 'cold'
        ? ' Word from the nursing notes: the patients felt rushed. Worth a thought next round.'
        : '';
  // M89: rota-position tone shift.
  const positionNote = rotaPositionNote(rotaIndex, memo.band);

  let body: string;
  switch (memo.band) {
    case 'excellent':
      body =
        `Good shift${focus}. ${
          memo.livesSaved > 0
            ? `You saved ${memo.livesSaved} clearly.`
            : 'Clean reasoning across the board.'
        }${tagBlurb} Keep that exam discipline up.${rapportLine}${positionNote}`;
      break;
    case 'good':
      body =
        `Solid shift${focus}. The bones were right;` +
        ` one or two cases want sharpening if you replay them.${tagBlurb}${rapportLine}${positionNote}`;
      break;
    case 'borderline':
      body =
        `That was a bumpy one${focus}. Worth a re-run when you've got 20 minutes —` +
        ` the sequencing on a couple of cases tripped you up.${tagBlurb}${rapportLine}${positionNote}`;
      break;
    case 'unsafe':
      body =
        `Sit down with me when you're ready${focus}. ${
          memo.livesLost > 0
            ? `${memo.livesLost} patient${memo.livesLost === 1 ? '' : 's'} arrested or worse — `
            : 'There were safety calls that landed badly — '
        }let's walk through what we'd do differently next time.${tagBlurb}${rapportLine}${positionNote}`;
      break;
  }

  const signoff =
    memo.band === 'unsafe'
      ? "— A. (I've left a coffee. No rush.)"
      : memo.band === 'excellent'
        ? '— A.'
        : '— A.';
  return { greeting, body, signoff };
}

function hoursSince(iso: string): number {
  try {
    const then = new Date(iso).getTime();
    return Math.floor((Date.now() - then) / 3_600_000);
  } catch {
    return Infinity;
  }
}

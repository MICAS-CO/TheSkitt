import { describe, expect, it } from 'vitest';
import {
  composeConsultantMessage,
  memoFromEpisodeReport,
  type ShiftMemo,
} from '../src/state/consultant';
import type { EpisodeReport, PerCaseReport } from '../src/state/sim';

function mkPerCase(overrides: Partial<PerCaseReport> & { caseId: string }): PerCaseReport {
  return {
    caseId: overrides.caseId,
    title: overrides.title ?? 'Test case',
    chiefComplaint: overrides.chiefComplaint ?? 'chest pain',
    finalState: overrides.finalState ?? 'discharged',
    curriculumTags: overrides.curriculumTags ?? ['RP2'],
    slos: overrides.slos ?? [3],
    attended: overrides.attended ?? true,
    score: overrides.score ?? {
      mustDoTotal: 5,
      mustDoDone: 5,
      mustNotDoChosen: 0,
      sequenceErrors: 0,
      rapport: 0,
      branchesPicked: 0,
      branchesAvailable: 0,
      workup: {
        tracked: false,
        essentialIxTotal: 0,
        essentialIxOrdered: 0,
        extraIxOrdered: 0,
        penaltyPercent: 0,
      },
      dispositionCorrect: true,
      workingDxCorrect: true,
      percent: 95,
      band: 'excellent',
      details: [],
    },
  };
}

function mkReport(overrides: Partial<EpisodeReport> = {}): EpisodeReport {
  return {
    episodeId: 'ep_test',
    episodeTitle: 'The hen-do shift',
    shiftEnded: true,
    clockMin: 20,
    shiftDurationMin: 20,
    cases: [mkPerCase({ caseId: 'case_a', title: 'Anaphylaxis — Beth' })],
    ambientCases: [],
    arcs: [],
    livesSaved: 1,
    livesLost: 0,
    unsafeCases: 0,
    averagePercent: 95,
    overallPercent: 95,
    band: 'excellent',
    examinerNotes: [],
    sources: [],
    ...overrides,
  };
}

describe('M37 — consultant memo + composer', () => {
  it('memoFromEpisodeReport captures band + lives + top tags + highlight', () => {
    const report = mkReport({
      cases: [
        mkPerCase({
          caseId: 'case_a',
          title: 'Anaphylaxis — Beth',
          curriculumTags: ['RP2', 'AP1'],
        }),
      ],
    });
    const memo = memoFromEpisodeReport(report, new Date('2026-05-19T22:00:00Z'));
    expect(memo.band).toBe('excellent');
    expect(memo.livesSaved).toBe(1);
    expect(memo.livesLost).toBe(0);
    expect(memo.casesAttended).toBe(1);
    expect(memo.highlightCaseTitle).toBe('Anaphylaxis — Beth');
    expect(memo.topTags).toContain('RP2');
    expect(memo.whenIso).toBe('2026-05-19T22:00:00.000Z');
  });

  it('only counts attended cases toward casesAttended', () => {
    const report = mkReport({
      cases: [
        mkPerCase({ caseId: 'a', attended: true }),
        mkPerCase({ caseId: 'b', attended: false }),
      ],
    });
    expect(memoFromEpisodeReport(report).casesAttended).toBe(1);
  });

  it('composeConsultantMessage adjusts tone per band', () => {
    const baseMemo: ShiftMemo = {
      episodeId: 'ep_test',
      episodeTitle: 'Test',
      band: 'excellent',
      livesSaved: 2,
      livesLost: 0,
      casesAttended: 2,
      topTags: ['RP2'],
      highlightCaseTitle: 'Anaphylaxis — Beth',
      whenIso: new Date(Date.now() - 1_000).toISOString(),
    };
    const excellent = composeConsultantMessage({ ...baseMemo, band: 'excellent' });
    const good = composeConsultantMessage({ ...baseMemo, band: 'good' });
    const borderline = composeConsultantMessage({ ...baseMemo, band: 'borderline' });
    const unsafe = composeConsultantMessage({
      ...baseMemo,
      band: 'unsafe',
      livesLost: 1,
      livesSaved: 0,
    });
    expect(excellent.body).toMatch(/saved|clean/i);
    expect(good.body).toMatch(/solid|sharpen/i);
    expect(borderline.body).toMatch(/bumpy|sequen|trip/i);
    expect(unsafe.body).toMatch(/arrested|safety|sit/i);
    // Signoff stays identity-stable
    expect(excellent.signoff).toMatch(/A\./);
    expect(unsafe.signoff).toMatch(/A\./);
  });

  it('greeting uses recency relative to whenIso', () => {
    const recent = composeConsultantMessage({
      episodeId: 'x',
      episodeTitle: 'x',
      band: 'good',
      livesSaved: 0,
      livesLost: 0,
      casesAttended: 1,
      topTags: [],
      highlightCaseTitle: null,
      whenIso: new Date(Date.now() - 1_000).toISOString(),
    });
    expect(recent.greeting).toMatch(/just now/);

    const yesterday = composeConsultantMessage({
      episodeId: 'x',
      episodeTitle: 'x',
      band: 'good',
      livesSaved: 0,
      livesLost: 0,
      casesAttended: 1,
      topTags: [],
      highlightCaseTitle: null,
      whenIso: new Date(Date.now() - 30 * 3_600_000).toISOString(),
    });
    expect(yesterday.greeting).toMatch(/last shift/);
  });
});

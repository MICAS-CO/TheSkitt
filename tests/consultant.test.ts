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
      differentialBreadth: {
        differentialsConsidered: 0,
        bonusPercent: 0,
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
    // No branching case attended → rapportBucket is null.
    expect(memo.rapportBucket).toBeNull();
  });

  it('rapport bucket is averaged across branching cases only (M38)', () => {
    const warmCase = mkPerCase({
      caseId: 'a',
      title: 'a',
      score: {
        mustDoTotal: 1,
        mustDoDone: 1,
        mustNotDoChosen: 0,
        sequenceErrors: 0,
        rapport: 2,
        branchesPicked: 1,
        branchesAvailable: 1,
        workup: {
          tracked: false,
          essentialIxTotal: 0,
          essentialIxOrdered: 0,
          extraIxOrdered: 0,
          penaltyPercent: 0,
        },
        differentialBreadth: {
          differentialsConsidered: 0,
          bonusPercent: 0,
        },
        dispositionCorrect: true,
        workingDxCorrect: true,
        percent: 100,
        band: 'excellent',
        details: [],
      },
    });
    // A non-branching case must be ignored for the bucket.
    const nonBranching = mkPerCase({
      caseId: 'b',
      title: 'b',
    });
    const memo = memoFromEpisodeReport(mkReport({ cases: [warmCase, nonBranching] }));
    expect(memo.rapportBucket).toBe('warm');

    const coldCase = { ...warmCase, score: { ...warmCase.score, rapport: -2 } };
    expect(memoFromEpisodeReport(mkReport({ cases: [coldCase] })).rapportBucket).toBe('cold');
  });

  it('consultant message references the rapport bucket when set (M38)', () => {
    const baseMemo: ShiftMemo = {
      episodeId: 'ep_test',
      episodeTitle: 'Test',
      band: 'good',
      livesSaved: 1,
      livesLost: 0,
      casesAttended: 2,
      topTags: ['RP2'],
      highlightCaseTitle: 'Anaphylaxis — Beth',
      rapportBucket: 'warm',
      whenIso: new Date(Date.now() - 1_000).toISOString(),
    };
    const warm = composeConsultantMessage(baseMemo);
    expect(warm.body).toMatch(/listening|keep it/i);
    const cold = composeConsultantMessage({ ...baseMemo, rapportBucket: 'cold' });
    expect(cold.body).toMatch(/rushed|nursing notes/i);
    const neutral = composeConsultantMessage({ ...baseMemo, rapportBucket: 'neutral' });
    expect(neutral.body).not.toMatch(/listening|rushed/i);
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
      rapportBucket: null,
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
      rapportBucket: null,
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
      rapportBucket: null,
      whenIso: new Date(Date.now() - 30 * 3_600_000).toISOString(),
    });
    expect(yesterday.greeting).toMatch(/last shift/);
  });
});

describe('M89 — rota-position aware voice', () => {
  const baseMemo: ShiftMemo = {
    episodeId: 'ep_test',
    episodeTitle: 'Test',
    band: 'good',
    livesSaved: 0,
    livesLost: 0,
    casesAttended: 1,
    topTags: [],
    highlightCaseTitle: null,
    rapportBucket: null,
    whenIso: new Date().toISOString(),
  };

  it('no rotaIndex: body is unchanged from base composition', () => {
    const a = composeConsultantMessage(baseMemo);
    const b = composeConsultantMessage(baseMemo, undefined, undefined);
    expect(a.body).toBe(b.body);
  });

  it('rotaIndex 0 (entry shift): voice mentions "first shift on the floor"', () => {
    const msg = composeConsultantMessage(baseMemo, undefined, 0);
    expect(msg.body.toLowerCase()).toContain('first shift on the floor');
  });

  it('rotaIndex 4 (block 1 keystone): voice mentions "block 1 cleared"', () => {
    const msg = composeConsultantMessage(baseMemo, undefined, 4);
    expect(msg.body.toLowerCase()).toContain('block 1');
  });

  it('rotaIndex 4 + unsafe band: no block-1-cleared celebration', () => {
    const unsafe: ShiftMemo = { ...baseMemo, band: 'unsafe', livesLost: 1 };
    const msg = composeConsultantMessage(unsafe, undefined, 4);
    expect(msg.body.toLowerCase()).not.toContain('block 1 cleared');
  });

  it('rotaIndex 10 (block 2 keystone): voice mentions "halfway"', () => {
    const msg = composeConsultantMessage(baseMemo, undefined, 10);
    expect(msg.body.toLowerCase()).toContain('halfway');
  });

  it('rotaIndex 13 (Chloe + Stan safeguarding crescendo): voice names the pattern', () => {
    const msg = composeConsultantMessage(baseMemo, undefined, 13);
    expect(msg.body.toLowerCase()).toContain('stan and chloe pattern');
  });

  it('rotaIndex 16 (final keystone, dissection): voice marks the rota ending', () => {
    const msg = composeConsultantMessage(baseMemo, undefined, 16);
    expect(msg.body.toLowerCase()).toContain('end of the rota');
  });

  it('rotaIndex 16 + unsafe: voice references Mr Okafor and frames as system failure', () => {
    const unsafe: ShiftMemo = { ...baseMemo, band: 'unsafe', livesLost: 1 };
    const msg = composeConsultantMessage(unsafe, undefined, 16);
    expect(msg.body.toLowerCase()).toContain('okafor');
    expect(msg.body.toLowerCase()).toContain('system failure');
  });

  it('intermediate block-2 position (e.g. 7): voice mentions "muscle memory" beat', () => {
    const msg = composeConsultantMessage(baseMemo, undefined, 7);
    expect(msg.body.toLowerCase()).toContain('muscle memory');
  });

  it('intermediate block-3 position (e.g. 14): voice mentions "pattern" theme', () => {
    const msg = composeConsultantMessage(baseMemo, undefined, 14);
    expect(msg.body.toLowerCase()).toContain('pattern');
  });

  it('out-of-bounds rotaIndex (negative): no position note appended', () => {
    const a = composeConsultantMessage(baseMemo, undefined, undefined);
    const b = composeConsultantMessage(baseMemo, undefined, -1);
    expect(a.body).toBe(b.body);
  });
});

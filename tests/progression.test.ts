import { describe, expect, it } from 'vitest';
import {
  applyCaseAward,
  computeCaseXp,
  emptyProgression,
  PERKS,
  type Progression,
} from '../src/state/progression';
import type { CaseT } from '../src/content/schema';
import type { ScoreReport } from '../src/state/sim';

function fakeCase(overrides: Partial<CaseT> = {}): { caseId: string; data: CaseT } {
  const data = {
    schema_version: 1,
    id: 'case_x',
    title: 'X',
    chief_complaint: 'x',
    vignette: 'x',
    topic_id: 't',
    curriculum_tags: ['RP2'],
    slos: [3],
    difficulty_band: 'CT2',
    paeds: false,
    demographics: { age_value: 30, age_unit: 'years', sex: 'female', pmh: [], medications: [], allergies: [] },
    triage_category: 2,
    initial_state: 'stable',
    history: [],
    examination: [],
    investigations: [],
    differential: [{ diagnosis: 'X', likelihood: 'top', discriminator: 'd' }],
    working_diagnosis: 'X',
    management: [
      { id: 'mx_must', category: 'monitoring', name: 'must', must_do: true, must_not_do: false },
      { id: 'mx_trap', category: 'drug', name: 'trap', must_do: false, must_not_do: true },
    ],
    disposition_options: [{ label: 'discharge', criteria: 'c', appropriate: true }],
    state_machine: { states: ['stable'], transitions: [] },
    pearls: [],
    pitfalls: [],
    sources: [{ type: 'rcem', ref: 'x' }],
    ...overrides,
  } as unknown as CaseT;
  return { caseId: data.id, data };
}

function fakeScore(overrides: Partial<ScoreReport> = {}): ScoreReport {
  return {
    mustDoTotal: 1,
    mustDoDone: 1,
    mustNotDoChosen: 0,
    dispositionCorrect: true,
    workingDxCorrect: true,
    percent: 100,
    band: 'excellent',
    details: [],
    ...overrides,
  };
}

describe('M16 — XP and progression', () => {
  it('perfect run awards 50 + 20 + 20 + 10 + 5 + 25 = 130 XP first time', () => {
    const award = computeCaseXp(fakeCase(), fakeScore(), false);
    expect(award.xp).toBe(130);
  });

  it('replay (already completed) drops the first-completion bonus', () => {
    const award = computeCaseXp(fakeCase(), fakeScore(), true);
    expect(award.xp).toBe(130 - 25);
  });

  it('safety penalty halts a perfect score when a trap is caught', () => {
    const score = fakeScore({ mustNotDoChosen: 1, band: 'unsafe' });
    const award = computeCaseXp(fakeCase(), score, false);
    // 50 + 20 + 20 + 0 (no excellent) + 0 (traps avoided 0) − 20 (safety) + 25 = 95
    expect(award.xp).toBe(95);
  });

  it('xp never goes negative even with multiple traps caught', () => {
    const score = fakeScore({
      mustDoDone: 0,
      mustNotDoChosen: 5,
      workingDxCorrect: false,
      dispositionCorrect: false,
      band: 'unsafe',
    });
    const award = computeCaseXp(fakeCase(), score, true);
    expect(award.xp).toBeGreaterThanOrEqual(0);
  });

  it('applyCaseAward splits XP across the case SLOs', () => {
    const award = { caseId: 'c', caseTitle: 't', xp: 100, slos: [1, 3], breakdown: [] };
    const next = applyCaseAward(emptyProgression(), award);
    expect(next.totalXp).toBe(100);
    expect(next.perSloXp[1]).toBe(50);
    expect(next.perSloXp[3]).toBe(50);
  });

  it('applyCaseAward dedupes case IDs', () => {
    const award = { caseId: 'c1', caseTitle: 't', xp: 50, slos: [1], breakdown: [] };
    const a = applyCaseAward(emptyProgression(), award);
    const b = applyCaseAward(a, award);
    expect(b.caseIdsCompleted).toEqual(['c1']);
    expect(b.totalXp).toBe(100);
  });

  it('perks unlock at threshold and stay unlocked', () => {
    let p: Progression = emptyProgression();
    p = applyCaseAward(p, { caseId: 'c1', caseTitle: '', xp: 1000, slos: [3], breakdown: [] });
    expect(p.unlockedPerks).toContain('perk_first_case');
    expect(p.unlockedPerks).toContain('perk_thousand_xp');
    expect(p.unlockedPerks).toContain('perk_resus_reflex');
  });

  it('every perk has a description and id-pattern conformant to perk_*', () => {
    for (const perk of PERKS) {
      expect(perk.id).toMatch(/^perk_[a-z_]+$/);
      expect(perk.title.length).toBeGreaterThan(0);
      expect(perk.description.length).toBeGreaterThan(0);
    }
  });
});

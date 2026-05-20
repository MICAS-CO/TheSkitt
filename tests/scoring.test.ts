import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case, Episode, type CaseT, type EpisodeT } from '../src/content/schema';
import { SimKernel, type CaseRuntime } from '../src/sim/kernel';
import { scoreCase } from '../src/state/sim';

function loadCase(): CaseT {
  return Case.parse(
    parseYaml(
      readFileSync(join(process.cwd(), 'content/cases/case_anaphylaxis_adult_peanut.yaml'), 'utf8'),
    ),
  );
}

function freshRuntime(): { kernel: SimKernel; cs: CaseRuntime; caseData: CaseT } {
  const caseData = loadCase();
  const episode: EpisodeT = Episode.parse({
    schema_version: 1,
    id: 'ep_score_test',
    title: 'Score test',
    learning_objectives: ['x'],
    curriculum_tags: ['RP2'],
    difficulty_band: 'CT2',
    shift_duration_min: 20,
    focus_cases: [caseData.id],
    scheduled_events: [],
  });
  const kernel = new SimKernel({ episode, cases: new Map([[caseData.id, caseData]]) });
  kernel.enterCase(caseData.id);
  const cs = kernel.getState().cases.get(caseData.id)!;
  return { kernel, cs, caseData };
}

describe('scoreCase — adult anaphylaxis', () => {
  it('returns excellent for a perfect run', () => {
    const { kernel, caseData } = freshRuntime();
    const id = caseData.id;
    const topDx = caseData.differential.find((d) => d.likelihood === 'top')!.diagnosis;
    const goodDisp = caseData.disposition_options.find((d) => d.appropriate)!.label;
    for (const m of caseData.management.filter((m) => m.must_do)) {
      kernel.toggleAction(id, m.id);
    }
    kernel.setWorkingDx(id, topDx);
    kernel.setDisposition(id, goodDisp);
    const cs = kernel.getState().cases.get(id)!;
    const r = scoreCase(cs);
    expect(r.percent).toBeGreaterThanOrEqual(95);
    expect(r.band).toBe('excellent');
    expect(r.workingDxCorrect).toBe(true);
    expect(r.dispositionCorrect).toBe(true);
  });

  it('flags unsafe when any must_not_do is picked', () => {
    const { kernel, caseData } = freshRuntime();
    const id = caseData.id;
    const trap = caseData.management.find((m) => m.must_not_do)!;
    for (const m of caseData.management.filter((m) => m.must_do)) {
      kernel.toggleAction(id, m.id);
    }
    kernel.toggleAction(id, trap.id);
    const cs = kernel.getState().cases.get(id)!;
    expect(scoreCase(cs).band).toBe('unsafe');
  });

  it('flags unsafe when patient arrests on the clock', () => {
    const { kernel, caseData } = freshRuntime();
    const id = caseData.id;
    // Do NOT give adrenaline; advance past the inaction-by trigger.
    kernel.advance(6); // requires a deterioration_if_not_x_by_t event, which this
    // episode doesn't have — instead drive via state transition.
    // The case YAML has a deteriorating → arrested transition if mx_adrenaline_im
    // not done by 5 min. The kernel's inaction_by trigger checks shift-clock time.
    const cs = kernel.getState().cases.get(id)!;
    expect(cs.state).toBe('arrested');
    expect(scoreCase(cs).band).toBe('unsafe');
  });

  it('reports missed must_do actions in the breakdown', () => {
    const { kernel, caseData } = freshRuntime();
    const id = caseData.id;
    // Pick only first 2 must_do actions
    const mustDo = caseData.management.filter((m) => m.must_do).slice(0, 2);
    for (const m of mustDo) kernel.toggleAction(id, m.id);
    const cs = kernel.getState().cases.get(id)!;
    const r = scoreCase(cs);
    expect(r.mustDoDone).toBe(2);
    expect(r.details.filter((d) => d.status === 'missed').length).toBeGreaterThan(0);
  });

  it('handles an empty run without crashing', () => {
    const { kernel, caseData } = freshRuntime();
    const cs = kernel.getState().cases.get(caseData.id)!;
    const r = scoreCase(cs);
    expect(r.mustDoDone).toBe(0);
    expect(r.workingDxCorrect).toBe(false);
    expect(r.dispositionCorrect).toBe(false);
  });

  it('workup metric is tracked when any ix has essential: true (M36)', () => {
    // Beth's anaphylaxis case has ix_tryptase marked essential (M36).
    const { kernel, caseData } = freshRuntime();
    kernel.enterCase(caseData.id);
    kernel.orderInvestigation(caseData.id, 'ix_tryptase');
    const cs = kernel.getState().cases.get(caseData.id)!;
    const r = scoreCase(cs);
    expect(r.workup.tracked).toBe(true);
    expect(r.workup.essentialIxTotal).toBeGreaterThanOrEqual(1);
    expect(r.workup.essentialIxOrdered).toBeGreaterThanOrEqual(1);
    expect(r.workup.extraIxOrdered).toBe(0);
    expect(r.workup.penaltyPercent).toBe(0);
  });

  it('ordering many extra ix triggers the workup penalty (M36)', () => {
    const { kernel, caseData } = freshRuntime();
    kernel.enterCase(caseData.id);
    // Order ALL Beth's ix — tryptase is essential, the other 5 are extras.
    for (const ix of caseData.investigations) {
      kernel.orderInvestigation(caseData.id, ix.id);
    }
    const cs = kernel.getState().cases.get(caseData.id)!;
    const r = scoreCase(cs);
    expect(r.workup.extraIxOrdered).toBeGreaterThan(2);
    // -2% per extra beyond a 2-ix free allowance, capped at -10%.
    const expected = Math.min(10, Math.max(0, (r.workup.extraIxOrdered - 2) * 2));
    expect(r.workup.penaltyPercent).toBe(expected);
  });

  it('cases without any essential markers are untracked (M36)', () => {
    // Synthetic case fixture: take a real case (Chloe), strip all
    // essential markers, and rename. All real content carries
    // essentials as of M51 so this is the only way to keep the
    // untracked-workup branch exercised by the test suite.
    const chloeYaml = readFileSync(
      join(process.cwd(), 'content/cases/case_paracetamol_od_chloe.yaml'),
      'utf8',
    );
    const stripped = chloeYaml
      .replace(/^\s+essential: true\s*$/gm, '')
      .replace(/^id: case_paracetamol_od_chloe/m, 'id: case_test_no_essentials');
    const fakeCase = Case.parse(parseYaml(stripped));
    const ep: EpisodeT = Episode.parse({
      schema_version: 1,
      id: 'ep_workup_untracked_test',
      title: 'Untracked workup',
      learning_objectives: ['x'],
      curriculum_tags: ['MHC1'],
      difficulty_band: 'CT2',
      shift_duration_min: 20,
      focus_cases: [fakeCase.id],
    });
    const k = new SimKernel({ episode: ep, cases: new Map([[fakeCase.id, fakeCase]]) });
    k.enterCase(fakeCase.id);
    for (const ix of fakeCase.investigations) {
      k.orderInvestigation(fakeCase.id, ix.id);
    }
    const r = scoreCase(k.getState().cases.get(fakeCase.id)!);
    expect(r.workup.tracked).toBe(false);
    expect(r.workup.penaltyPercent).toBe(0);
  });
});

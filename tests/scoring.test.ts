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
});

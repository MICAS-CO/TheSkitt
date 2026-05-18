import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case, type CaseT } from '../src/content/schema';
import { scoreEncounter } from '../src/state/encounter';

const ROOT = process.cwd();

function loadCase(): CaseT {
  const text = readFileSync(join(ROOT, 'content/cases/case_anaphylaxis_adult_peanut.yaml'), 'utf8');
  return Case.parse(parseYaml(text));
}

interface StateLike {
  caseData: CaseT;
  managementPicked: Set<string>;
  workingDiagnosis: string | null;
  dispositionPicked: string | null;
}

function score(state: StateLike) {
  return scoreEncounter(state as Parameters<typeof scoreEncounter>[0]);
}

describe('scoreEncounter — adult anaphylaxis', () => {
  const caseData = loadCase();
  const topDx = caseData.differential.find((d) => d.likelihood === 'top')!.diagnosis;
  const goodDisp = caseData.disposition_options.find((d) => d.appropriate)!.label;
  const badDisp = caseData.disposition_options.find((d) => !d.appropriate)!.label;
  const allMustDo = caseData.management.filter((m) => m.must_do).map((m) => m.id);
  const aMustNotDo = caseData.management.find((m) => m.must_not_do)!.id;

  it('returns 100% (excellent) for a perfect run', () => {
    const r = score({
      caseData,
      managementPicked: new Set(allMustDo),
      workingDiagnosis: topDx,
      dispositionPicked: goodDisp,
    });
    expect(r.percent).toBeGreaterThanOrEqual(95);
    expect(r.band).toBe('excellent');
    expect(r.workingDxCorrect).toBe(true);
    expect(r.dispositionCorrect).toBe(true);
    expect(r.mustNotDoChosen).toBe(0);
  });

  it('flags unsafe when a must_not_do action is taken even if everything else is right', () => {
    const r = score({
      caseData,
      managementPicked: new Set([...allMustDo, aMustNotDo]),
      workingDiagnosis: topDx,
      dispositionPicked: goodDisp,
    });
    expect(r.band).toBe('unsafe');
    expect(r.mustNotDoChosen).toBe(1);
  });

  it('marks disposition correct only for an appropriate option', () => {
    const ok = score({
      caseData,
      managementPicked: new Set(allMustDo),
      workingDiagnosis: topDx,
      dispositionPicked: goodDisp,
    });
    const bad = score({
      caseData,
      managementPicked: new Set(allMustDo),
      workingDiagnosis: topDx,
      dispositionPicked: badDisp,
    });
    expect(ok.dispositionCorrect).toBe(true);
    expect(bad.dispositionCorrect).toBe(false);
  });

  it('reports missed must_do actions in the breakdown', () => {
    const partial = allMustDo.slice(0, 2);
    const r = score({
      caseData,
      managementPicked: new Set(partial),
      workingDiagnosis: topDx,
      dispositionPicked: goodDisp,
    });
    expect(r.mustDoDone).toBe(2);
    expect(r.details.filter((d) => d.status === 'missed').length).toBeGreaterThan(0);
  });

  it('handles an empty run (nothing picked) without crashing', () => {
    const r = score({
      caseData,
      managementPicked: new Set(),
      workingDiagnosis: null,
      dispositionPicked: null,
    });
    expect(r.mustDoDone).toBe(0);
    expect(r.workingDxCorrect).toBe(false);
    expect(r.dispositionCorrect).toBe(false);
    expect(r.band).toBe('borderline');
  });
});

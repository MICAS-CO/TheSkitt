import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case, Episode, type CaseT, type EpisodeT } from '../src/content/schema';
import { SimKernel, type CaseRuntime } from '../src/sim/kernel';
import { countDifferentialsConsidered, scoreCase } from '../src/state/sim';

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
    // M85: max score with no differential breadth (no clues selected)
    // is 60 (must_do) + 15 (dx) + 15 (disp) = 90. Adding linked clues
    // for 3+ differentials would push to 100. This test exercises the
    // perfect-action / perfect-disposition path WITHOUT clue selection.
    expect(r.percent).toBeGreaterThanOrEqual(90);
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

  it('workup parsimony counts are tracked but no longer penalised (M85)', () => {
    const { kernel, caseData } = freshRuntime();
    kernel.enterCase(caseData.id);
    // Order ALL Beth's ix — tryptase is essential, the other 5 are extras.
    for (const ix of caseData.investigations) {
      kernel.orderInvestigation(caseData.id, ix.id);
    }
    const cs = kernel.getState().cases.get(caseData.id)!;
    const r = scoreCase(cs);
    // The count is still tracked for debrief display.
    expect(r.workup.extraIxOrdered).toBeGreaterThan(2);
    // M85 (Braintrust 06 synthesis): the penalty itself was declawed —
    // mildly punishing thoroughness trains against the FRCEM-shaped
    // behaviour the build is trying to teach.
    expect(r.workup.penaltyPercent).toBe(0);
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

describe('M85 — differential breadth scoring', () => {
  it('zero clues selected: 0 differentials considered, no bonus', () => {
    const { kernel, caseData } = freshRuntime();
    const id = caseData.id;
    kernel.setWorkingDx(id, caseData.differential.find((d) => d.likelihood === 'top')!.diagnosis);
    kernel.setDisposition(id, caseData.disposition_options.find((d) => d.appropriate)!.label);
    const cs = kernel.getState().cases.get(id)!;
    const r = scoreCase(cs);
    expect(r.differentialBreadth.differentialsConsidered).toBe(0);
    expect(r.differentialBreadth.bonusPercent).toBe(0);
  });

  it('selecting one history clue with one diagnosis support = 1 considered, no bonus', () => {
    const { kernel, caseData } = freshRuntime();
    const id = caseData.id;
    // hx_timeline: supports ['Anaphylaxis (IgE-mediated, peanut)']
    const hx = caseData.history.find((h) => (h.supports?.length ?? 0) === 1);
    expect(hx).toBeDefined();
    kernel.recordAsk(id, hx!.id);
    kernel.toggleClueSelection(id, `hx:${hx!.id}`);
    const cs = kernel.getState().cases.get(id)!;
    const r = scoreCase(cs);
    expect(r.differentialBreadth.differentialsConsidered).toBe(1);
    expect(r.differentialBreadth.bonusPercent).toBe(0);
  });

  it('a multi-support clue (anaphylaxis + scombroid) = 2 considered, +5 bonus', () => {
    const { kernel, caseData } = freshRuntime();
    const id = caseData.id;
    // hx_trigger supports BOTH 'Anaphylaxis...' and 'Scombroid...'
    const multi = caseData.history.find((h) => (h.supports?.length ?? 0) >= 2);
    expect(multi).toBeDefined();
    kernel.recordAsk(id, multi!.id);
    kernel.toggleClueSelection(id, `hx:${multi!.id}`);
    const cs = kernel.getState().cases.get(id)!;
    const r = scoreCase(cs);
    expect(r.differentialBreadth.differentialsConsidered).toBe(2);
    expect(r.differentialBreadth.bonusPercent).toBe(5);
  });

  it('breadth bonus boosts an otherwise-identical run', () => {
    // Demonstrates the substantive teaching beat: a player who took
    // time to consider broader differentials scores higher than an
    // identical run without that reasoning, even on the same actions.
    const { kernel, caseData } = freshRuntime();
    const id = caseData.id;
    const mustDos = caseData.management.filter((m) => m.must_do);
    for (const m of mustDos) kernel.toggleAction(id, m.id);
    kernel.setWorkingDx(id, caseData.differential.find((d) => d.likelihood === 'top')!.diagnosis);
    kernel.setDisposition(id, caseData.disposition_options.find((d) => d.appropriate)!.label);
    const without = scoreCase(kernel.getState().cases.get(id)!);
    // Select Beth's hx_trigger (2 supports — Anaphylaxis + Scombroid)
    // to engage the +5 breadth tier.
    const multiHx = caseData.history.find((h) => (h.supports?.length ?? 0) >= 2);
    expect(multiHx).toBeDefined();
    kernel.recordAsk(id, multiHx!.id);
    kernel.toggleClueSelection(id, `hx:${multiHx!.id}`);
    const withBreadth = scoreCase(kernel.getState().cases.get(id)!);
    expect(withBreadth.percent).toBeGreaterThan(without.percent);
    expect(withBreadth.differentialBreadth.bonusPercent).toBe(5);
  });
});

describe('M85 — countDifferentialsConsidered helper', () => {
  // Synthetic-data unit tests for the helper that drives the breadth
  // bonus. Bypasses YAML loading so the +10 (>=3) tier can be exercised
  // without depending on a particular case's clue diversity.

  function syntheticCs(supports: Record<string, string[]>): CaseRuntime {
    // Build a minimal CaseRuntime-shaped object with just the fields
    // the helper reads. Keys in `supports` are clue ids; values are the
    // diagnoses each clue references.
    const history = Object.entries(supports)
      .filter(([k]) => k.startsWith('hx:'))
      .map(([k, dx]) => ({
        id: k.slice(3),
        source: 'patient' as const,
        topic: 'synthetic',
        supports: dx,
      }));
    const examFindingsBySystem = new Map<string, Array<{ name: string; supports: string[] }>>();
    for (const [k, dx] of Object.entries(supports)) {
      if (!k.startsWith('ex:')) continue;
      const rest = k.slice(3);
      const sep = rest.indexOf(':');
      const system = rest.slice(0, sep);
      const findingName = rest.slice(sep + 1);
      const arr = examFindingsBySystem.get(system) ?? [];
      arr.push({ name: findingName, supports: dx });
      examFindingsBySystem.set(system, arr);
    }
    const examination = [...examFindingsBySystem.entries()].map(([system, findings]) => ({
      system,
      findings,
    }));
    const investigations = Object.entries(supports)
      .filter(([k]) => k.startsWith('ix:'))
      .map(([k, dx]) => ({ id: k.slice(3), name: 'synthetic', supports: dx }));
    return {
      data: { history, examination, investigations },
      selectedClueIds: new Set(Object.keys(supports)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }

  it('returns 0 when no clues are selected', () => {
    const cs = syntheticCs({});
    expect(countDifferentialsConsidered(cs)).toBe(0);
  });

  it('counts distinct supports across history / exam / investigation clues', () => {
    const cs = syntheticCs({
      'hx:h1': ['DxA'],
      'hx:h2': ['DxA', 'DxB'],
      'ex:airway:stridor': ['DxC'],
      'ix:ecg': ['DxD'],
    });
    expect(countDifferentialsConsidered(cs)).toBe(4);
  });

  it('deduplicates the same diagnosis appearing across multiple clues', () => {
    const cs = syntheticCs({
      'hx:h1': ['DxA'],
      'hx:h2': ['DxA'],
      'ex:cv:gallop': ['DxA'],
    });
    expect(countDifferentialsConsidered(cs)).toBe(1);
  });

  it('handles single-colon exam keys (system + finding name)', () => {
    const cs = syntheticCs({
      'ex:resp:wheeze': ['DxA'],
      'ex:cv:tachycardia': ['DxB'],
    });
    expect(countDifferentialsConsidered(cs)).toBe(2);
  });

  it('ignores selectedClueIds that do not match a content item', () => {
    const cs = syntheticCs({});
    // Manually inject orphan clue ids — the case data has nothing to
    // match. Helper should silently skip them.
    cs.selectedClueIds.add('hx:does_not_exist');
    cs.selectedClueIds.add('ex:ghost:finding');
    cs.selectedClueIds.add('ix:phantom');
    expect(countDifferentialsConsidered(cs)).toBe(0);
  });

  it('three or more distinct diagnoses considered = breadth tier hit', () => {
    const cs = syntheticCs({
      'hx:h1': ['DxA'],
      'hx:h2': ['DxB'],
      'hx:h3': ['DxC'],
    });
    expect(countDifferentialsConsidered(cs)).toBeGreaterThanOrEqual(3);
  });
});

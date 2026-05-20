import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Arc, Case, Episode } from '../src/content/schema';
import { SimKernel } from '../src/sim/kernel';
import { scoreEpisode } from '../src/state/sim';

const ROOT = process.cwd();

function load<T>(rel: string, schema: { parse: (raw: unknown) => T }): T {
  return schema.parse(parseYaml(readFileSync(join(ROOT, rel), 'utf8')));
}

function bootHendoWithAmbient() {
  const beth = load('content/cases/case_anaphylaxis_adult_peanut.yaml', Case);
  const sarah = load('content/cases/case_ectopic_minors_sarah.yaml', Case);
  const stan = load('content/cases/case_intox_stan_ambient.yaml', Case);
  const patel = load('content/cases/case_chest_pain_patel_ambient.yaml', Case);
  const arc = load('content/arcs/arc_hendo_dinner.yaml', Arc);
  const episode = load('content/episodes/ep_hendo_shift.yaml', Episode);
  const kernel = new SimKernel({
    episode,
    cases: new Map([
      [beth.id, beth],
      [sarah.id, sarah],
      [stan.id, stan],
      [patel.id, patel],
    ]),
    arcs: new Map([[arc.id, arc]]),
  });
  return { kernel, beth, sarah, stan, patel };
}

describe('Ambient board pressure (Milestone 8)', () => {
  it('episode has both ambient cases listed', () => {
    const { kernel } = bootHendoWithAmbient();
    const ep = kernel.getState().episode;
    expect(ep.ambient_cases).toHaveLength(2);
    expect(ep.ambient_cases).toEqual(
      expect.arrayContaining(['case_intox_stan_ambient', 'case_chest_pain_patel_ambient']),
    );
  });

  it('Stan deteriorates then arrests if his BM is never checked', () => {
    const { kernel, stan } = bootHendoWithAmbient();
    // Don't even enter Stan's case — he's left in a side room.
    kernel.advance(20);
    expect(kernel.getState().cases.get(stan.id)!.state).toBe('arrested');
  });

  it('Stan is saved if BM is checked and dextrose is given in time', () => {
    const { kernel, stan } = bootHendoWithAmbient();
    kernel.enterCase(stan.id);
    kernel.toggleAction(stan.id, 'mx_check_bm');
    kernel.toggleAction(stan.id, 'mx_iv_dextrose');
    kernel.advance(20);
    expect(kernel.getState().cases.get(stan.id)!.state).not.toBe('arrested');
  });

  it('Mrs Patel arrests in the waiting room if neither ECG nor aspirin happen', () => {
    const { kernel, patel } = bootHendoWithAmbient();
    kernel.advance(20);
    expect(kernel.getState().cases.get(patel.id)!.state).toBe('arrested');
  });

  it('Mrs Patel is saved if aspirin and PCI activation happen in time', () => {
    const { kernel, patel } = bootHendoWithAmbient();
    kernel.enterCase(patel.id);
    kernel.toggleAction(patel.id, 'mx_ecg_10min');
    kernel.toggleAction(patel.id, 'mx_aspirin');
    kernel.toggleAction(patel.id, 'mx_ppci_pathway');
    kernel.advance(20);
    expect(kernel.getState().cases.get(patel.id)!.state).not.toBe('arrested');
  });

  it('scoreEpisode separates focus and ambient cases', () => {
    const { kernel } = bootHendoWithAmbient();
    const r = scoreEpisode(kernel.getState());
    expect(r.cases).toHaveLength(2);
    expect(r.ambientCases).toHaveLength(2);
    expect(r.ambientCases.map((c) => c.caseId)).toEqual(
      expect.arrayContaining(['case_intox_stan_ambient', 'case_chest_pain_patel_ambient']),
    );
  });

  it('ambient deaths count as lives lost in the episode report', () => {
    const { kernel } = bootHendoWithAmbient();
    kernel.advance(20); // neglect everyone
    const r = scoreEpisode(kernel.getState());
    // All 4 cases arrest in this episode design — verify ambient count too
    expect(r.livesLost).toBe(4);
    expect(r.band).toBe('unsafe');
  });
});

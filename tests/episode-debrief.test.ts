import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Arc, Case, Episode, type CaseT } from '../src/content/schema';
import { SimKernel } from '../src/sim/kernel';
import { scoreEpisode } from '../src/state/sim';

const ROOT = process.cwd();

function load<T>(rel: string, schema: { parse: (raw: unknown) => T }): T {
  return schema.parse(parseYaml(readFileSync(join(ROOT, rel), 'utf8')));
}

function bootHendoShift() {
  const beth = load('content/cases/case_anaphylaxis_adult_peanut.yaml', Case);
  const sarah = load('content/cases/case_ectopic_minors_sarah.yaml', Case);
  const arc = load('content/arcs/arc_hendo_dinner.yaml', Arc);
  const episode = load('content/episodes/ep_hendo_shift.yaml', Episode);
  const kernel = new SimKernel({
    episode,
    cases: new Map([
      [beth.id, beth],
      [sarah.id, sarah],
    ]),
    arcs: new Map([[arc.id, arc]]),
  });
  return { kernel, beth, sarah };
}

function doPerfectRun(kernel: SimKernel, c: CaseT) {
  kernel.enterCase(c.id);
  const top = c.differential.find((d) => d.likelihood === 'top')!;
  const goodDisp = c.disposition_options.find((d) => d.appropriate)!;
  kernel.setWorkingDx(c.id, top.diagnosis);
  for (const m of c.management.filter((m) => m.must_do)) {
    kernel.toggleAction(c.id, m.id);
  }
  kernel.setDisposition(c.id, goodDisp.label);
}

describe('scoreEpisode — hen-do shift', () => {
  it('returns excellent band when both cases run perfectly', () => {
    const { kernel, beth, sarah } = bootHendoShift();
    // Beth needs adrenaline before T+5
    doPerfectRun(kernel, beth);
    // Sarah only arrives at T+5
    kernel.advance(6);
    doPerfectRun(kernel, sarah);
    // Ask Beth's partner history to reveal the arc deterministically
    kernel.recordAsk(beth.id, 'hx_partner');
    const report = scoreEpisode(kernel.getState());
    expect(report.band).toBe('excellent');
    expect(report.livesLost).toBe(0);
    expect(report.unsafeCases).toBe(0);
    expect(report.arcs[0]!.revealed).toBe(true);
  });

  it('drops to unsafe band and counts a life lost if Beth arrests', () => {
    const { kernel } = bootHendoShift();
    kernel.advance(20); // both deteriorate without intervention
    const report = scoreEpisode(kernel.getState());
    expect(report.band).toBe('unsafe');
    expect(report.livesLost).toBeGreaterThan(0);
    expect(report.examinerNotes.some((n) => n.toLowerCase().includes('fail the station'))).toBe(
      true,
    );
  });

  it('reports unrevealed arcs in examinerNotes', () => {
    const { kernel, beth } = bootHendoShift();
    doPerfectRun(kernel, beth);
    // Don't ask the partner history; don't advance past the T+9 fallback
    const report = scoreEpisode(kernel.getState());
    const arc = report.arcs[0]!;
    expect(arc.revealed).toBe(false);
    expect(report.examinerNotes.some((n) => n.includes('never revealed'))).toBe(true);
  });

  it('aggregates sources across both focus cases without duplicates', () => {
    const { kernel } = bootHendoShift();
    const report = scoreEpisode(kernel.getState());
    // Both cases cite Oxford Handbook 5e — should appear only once
    const oxford = report.sources.filter(
      (s) => s.type === 'textbook' && s.ref.includes('Oxford Handbook'),
    );
    expect(oxford).toHaveLength(1);
  });

  it('marks attended=false for cases the player never entered', () => {
    const { kernel, beth } = bootHendoShift();
    doPerfectRun(kernel, beth); // beth attended; sarah never entered
    const report = scoreEpisode(kernel.getState());
    const sarahReport = report.cases.find((c) => c.caseId.includes('sarah'))!;
    expect(sarahReport.attended).toBe(false);
  });
});

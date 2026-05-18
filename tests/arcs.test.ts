import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Arc, Case, Episode } from '../src/content/schema';
import { SimKernel } from '../src/sim/kernel';

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
  return { kernel, bethId: beth.id, sarahId: sarah.id, arcId: arc.id };
}

describe('SimKernel — arc reveals', () => {
  it('reveals the arc when the gating history question is asked on Beth', () => {
    const { kernel, bethId, arcId } = bootHendoShift();
    expect(kernel.getState().revealedArcIds.has(arcId)).toBe(false);
    kernel.recordAsk(bethId, 'hx_partner');
    expect(kernel.getState().revealedArcIds.has(arcId)).toBe(true);
  });

  it('unlocks Sarah’s history items when the arc reveals', () => {
    const { kernel, bethId, sarahId } = bootHendoShift();
    const sarahBefore = kernel.getState().cases.get(sarahId)!;
    expect(sarahBefore.unlockedHistoryIds.size).toBe(0);
    kernel.recordAsk(bethId, 'hx_partner');
    const sarahAfter = kernel.getState().cases.get(sarahId)!;
    expect(sarahAfter.unlockedHistoryIds.has('hx_friend_in_resus')).toBe(true);
    expect(sarahAfter.unlockedHistoryIds.has('hx_pain_started_earlier')).toBe(true);
  });

  it('falls back to the clock-time reveal at T+9 if the player never asks', () => {
    const { kernel, arcId, sarahId } = bootHendoShift();
    kernel.toggleAction(
      kernel.getState().cases.get('case_anaphylaxis_adult_peanut')!.caseId,
      'mx_adrenaline_im',
    ); // keep Beth alive past T+5
    kernel.advance(9);
    expect(kernel.getState().revealedArcIds.has(arcId)).toBe(true);
    expect(kernel.getState().cases.get(sarahId)!.unlockedHistoryIds.size).toBeGreaterThan(0);
  });

  it('only reveals the arc once even if multiple triggers match', () => {
    const { kernel, bethId, arcId } = bootHendoShift();
    kernel.recordAsk(bethId, 'hx_partner');
    kernel.advance(10); // clock fallback would also match
    const reveals = kernel.getState().log.filter((l) => l.text.startsWith('Arc reveal'));
    expect(reveals).toHaveLength(1);
    expect(kernel.getState().revealedArcIds.has(arcId)).toBe(true);
  });
});

describe('SimKernel — multi-case', () => {
  it('Sarah arrives as triaged at T+5 via the new_arrival event', () => {
    const { kernel, sarahId } = bootHendoShift();
    expect(kernel.getState().cases.get(sarahId)!.state).toBe('unseen');
    kernel.toggleAction('case_anaphylaxis_adult_peanut', 'mx_adrenaline_im'); // keep Beth alive
    kernel.advance(5);
    expect(kernel.getState().cases.get(sarahId)!.state).toBe('triaged');
  });

  it('runs both deterioration events on a single shift clock', () => {
    const { kernel, bethId, sarahId } = bootHendoShift();
    // Player neglects both cases — both deteriorate at their event times.
    kernel.advance(20);
    expect(kernel.getState().cases.get(bethId)!.state).toBe('arrested');
    expect(kernel.getState().cases.get(sarahId)!.state).toBe('arrested');
  });

  it('saves both cases when the right interventions are done in time', () => {
    const { kernel, bethId, sarahId } = bootHendoShift();
    // Beth: adrenaline early
    kernel.toggleAction(bethId, 'mx_adrenaline_im');
    // Sarah doesn't arrive until T+5 — but we can still act when she does
    kernel.advance(6); // Sarah now triaged
    kernel.toggleAction(sarahId, 'mx_serum_bhcg');
    kernel.toggleAction(sarahId, 'mx_call_gynae');
    kernel.advance(20);
    expect(kernel.getState().cases.get(bethId)!.state).not.toBe('arrested');
    expect(kernel.getState().cases.get(sarahId)!.state).not.toBe('arrested');
  });
});

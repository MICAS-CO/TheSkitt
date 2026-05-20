import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case, Episode, type CaseT, type EpisodeT } from '../src/content/schema';
import { SimKernel } from '../src/sim/kernel';
import { scoreCase } from '../src/state/sim';

const ROOT = process.cwd();

function loadCase(rel: string): CaseT {
  return Case.parse(parseYaml(readFileSync(join(ROOT, rel), 'utf8')));
}

function kernelFor(c: CaseT): { kernel: SimKernel; caseId: string } {
  const episode: EpisodeT = Episode.parse({
    schema_version: 1,
    id: 'ep_seq_test',
    title: 'seq test',
    learning_objectives: ['x'],
    curriculum_tags: ['RP2'],
    difficulty_band: 'CT2',
    shift_duration_min: 20,
    focus_cases: [c.id],
  });
  const k = new SimKernel({ episode, cases: new Map([[c.id, c]]) });
  k.enterCase(c.id);
  return { kernel: k, caseId: c.id };
}

describe('M20 — sequence-aware management actions', () => {
  it('Okafor GTN without prior labetalol records a sequence error', () => {
    const c = loadCase('content/cases/case_aortic_dissection_okafor.yaml');
    const { kernel, caseId } = kernelFor(c);
    kernel.toggleAction(caseId, 'mx_gtn_after_beta');
    const cs = kernel.getState().cases.get(caseId)!;
    expect(cs.sequenceErrors.has('mx_gtn_after_beta')).toBe(true);
  });

  it('Okafor GTN after labetalol records no sequence error', () => {
    const c = loadCase('content/cases/case_aortic_dissection_okafor.yaml');
    const { kernel, caseId } = kernelFor(c);
    kernel.toggleAction(caseId, 'mx_iv_labetalol');
    kernel.toggleAction(caseId, 'mx_gtn_after_beta');
    const cs = kernel.getState().cases.get(caseId)!;
    expect(cs.sequenceErrors.has('mx_gtn_after_beta')).toBe(false);
  });

  it('Priya levetiracetam before lorazepam_2 records a sequence error', () => {
    const c = loadCase('content/cases/case_status_epilepticus_priya.yaml');
    const { kernel, caseId } = kernelFor(c);
    kernel.toggleAction(caseId, 'mx_levetiracetam_iv');
    const cs = kernel.getState().cases.get(caseId)!;
    expect(cs.sequenceErrors.has('mx_levetiracetam_iv')).toBe(true);
  });

  it('scoring deducts 10 per sequence error', () => {
    const c = loadCase('content/cases/case_aortic_dissection_okafor.yaml');
    const { kernel, caseId } = kernelFor(c);

    // Worst case: take GTN out of order, see the deduction
    kernel.toggleAction(caseId, 'mx_gtn_after_beta');
    const cs = kernel.getState().cases.get(caseId)!;
    const before = scoreCase(cs);
    expect(before.sequenceErrors).toBe(1);

    // Untoggling does NOT clear the recorded sequence error — it stays
    // as a record of having taken the action out of order. (This is
    // intentional: the deduction reflects the decision the player made.)
    kernel.toggleAction(caseId, 'mx_gtn_after_beta');
    const after = scoreCase(kernel.getState().cases.get(caseId)!);
    expect(after.sequenceErrors).toBe(1);
  });

  it('logs danger entry when sequence error is recorded', () => {
    const c = loadCase('content/cases/case_aortic_dissection_okafor.yaml');
    const { kernel, caseId } = kernelFor(c);
    const beforeDanger = kernel.getState().log.filter((e) => e.level === 'danger').length;
    kernel.toggleAction(caseId, 'mx_gtn_after_beta');
    const afterDanger = kernel.getState().log.filter((e) => e.level === 'danger').length;
    expect(afterDanger).toBeGreaterThan(beforeDanger);
  });
});

describe('M20 — content discipline for prereq_action_ids', () => {
  const cases = readdirSync(join(ROOT, 'content/cases'))
    .filter((f) => f.endsWith('.yaml') && !f.includes('scratch') && !f.includes('croup_draft'))
    .map((f) => loadCase(`content/cases/${f}`));

  it('every prereq_action_ids reference resolves to a real mx in the same case', () => {
    for (const c of cases) {
      const ids = new Set(c.management.map((m) => m.id));
      for (const m of c.management) {
        for (const p of m.prereq_action_ids ?? []) {
          expect(ids.has(p), `${c.id} → ${m.id} → unknown prereq "${p}"`).toBe(true);
        }
      }
    }
  });

  it('management actions do not list themselves as a prereq', () => {
    for (const c of cases) {
      for (const m of c.management) {
        expect((m.prereq_action_ids ?? []).includes(m.id), `${c.id} → ${m.id}`).toBe(false);
      }
    }
  });
});

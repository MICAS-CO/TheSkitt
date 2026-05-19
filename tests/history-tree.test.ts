import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case, Episode, type CaseT, type EpisodeT } from '../src/content/schema';
import { SimKernel } from '../src/sim/kernel';

/**
 * M10 — dialogue-tree history.
 *
 * `HistoryItem` now supports prereq_history_ids (pull-driven gating) and
 * reveals (push-driven unlock). Asking an item with reveals adds those ids
 * to `unlockedHistoryIds`. UI gating logic lives in `EncounterScreen`; the
 * kernel just records the right state.
 */

const ROOT = process.cwd();

function loadCase(rel: string): CaseT {
  return Case.parse(parseYaml(readFileSync(join(ROOT, rel), 'utf8')));
}

function singleCaseKernel(caseData: CaseT): { kernel: SimKernel; caseId: string } {
  const episode: EpisodeT = Episode.parse({
    schema_version: 1,
    id: 'ep_history_tree_test',
    title: 'History tree test',
    learning_objectives: ['x'],
    curriculum_tags: ['RP2'],
    difficulty_band: 'CT2',
    shift_duration_min: 20,
    focus_cases: [caseData.id],
  });
  const kernel = new SimKernel({ episode, cases: new Map([[caseData.id, caseData]]) });
  kernel.enterCase(caseData.id);
  return { kernel, caseId: caseData.id };
}

describe('history dialogue tree — kernel-side', () => {
  it('recordAsk applies push-driven reveals to unlockedHistoryIds', () => {
    // Synthesise a minimal case with a reveals chain.
    const caseData: CaseT = Case.parse({
      schema_version: 1,
      id: 'case_test_reveals',
      title: 'Test reveals',
      chief_complaint: '?test',
      vignette: 'test',
      topic_id: 'anaphylaxis',
      curriculum_tags: ['RP2'],
      slos: [1],
      difficulty_band: 'CT2',
      paeds: false,
      demographics: {
        age_value: 30,
        age_unit: 'years',
        sex: 'female',
        pmh: [],
        medications: [],
        allergies: [],
      },
      triage_category: 2,
      initial_state: 'stable',
      history: [
        { id: 'hx_a', source: 'patient', topic: 'A?', response: 'a', reveals: ['hx_b'] },
        { id: 'hx_b', source: 'patient', topic: 'B?', response: 'b' },
      ],
      differential: [
        {
          diagnosis: 'X',
          likelihood: 'top',
          discriminator: 'd',
        },
      ],
      working_diagnosis: 'X',
      management: [{ id: 'mx_x', category: 'monitoring', name: 'mon', must_do: true }],
      disposition_options: [{ label: 'discharge', criteria: 'c', appropriate: true }],
      state_machine: {
        states: ['stable', 'discharged'],
        transitions: [],
      },
      sources: [{ type: 'rcem', ref: 'test' }],
    });

    const { kernel, caseId } = singleCaseKernel(caseData);
    const before = kernel.getState().cases.get(caseId)!;
    expect(before.unlockedHistoryIds.has('hx_b')).toBe(false);

    kernel.recordAsk(caseId, 'hx_a');

    const after = kernel.getState().cases.get(caseId)!;
    expect(after.asked.has('hx_a')).toBe(true);
    expect(after.unlockedHistoryIds.has('hx_b')).toBe(true);
  });

  it('asking an item with no reveals does not mutate unlockedHistoryIds', () => {
    const caseData = loadCase('content/cases/case_anaphylaxis_adult_peanut.yaml');
    const { kernel, caseId } = singleCaseKernel(caseData);
    const initialUnlocked = new Set(kernel.getState().cases.get(caseId)!.unlockedHistoryIds);

    kernel.recordAsk(caseId, 'hx_onset');

    const after = kernel.getState().cases.get(caseId)!;
    expect(after.asked.has('hx_onset')).toBe(true);
    expect([...after.unlockedHistoryIds].sort()).toEqual([...initialUnlocked].sort());
  });
});

describe('history dialogue tree — content discipline', () => {
  const cases = readdirSync(join(ROOT, 'content/cases'))
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => loadCase(`content/cases/${f}`));

  it('every prereq_history_ids id exists within the same case', () => {
    for (const c of cases) {
      const ids = new Set(c.history.map((h) => h.id));
      for (const h of c.history) {
        for (const p of h.prereq_history_ids ?? []) {
          expect(ids.has(p), `${c.id} → ${h.id} → prereq ${p}`).toBe(true);
        }
      }
    }
  });

  it('no history item lists itself as a prereq', () => {
    for (const c of cases) {
      for (const h of c.history) {
        expect((h.prereq_history_ids ?? []).includes(h.id), `${c.id} → ${h.id}`).toBe(false);
      }
    }
  });

  it('prereq chains are acyclic (topological sort exists)', () => {
    for (const c of cases) {
      const inDegree = new Map<string, number>();
      const adj = new Map<string, string[]>();
      for (const h of c.history) {
        inDegree.set(h.id, (h.prereq_history_ids ?? []).length);
        adj.set(h.id, []);
      }
      for (const h of c.history) {
        for (const p of h.prereq_history_ids ?? []) {
          adj.get(p)?.push(h.id);
        }
      }
      const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
      let visited = 0;
      while (queue.length > 0) {
        const id = queue.shift()!;
        visited++;
        for (const next of adj.get(id) ?? []) {
          inDegree.set(next, inDegree.get(next)! - 1);
          if (inDegree.get(next) === 0) queue.push(next);
        }
      }
      expect(visited, `${c.id} has a cycle in history prereqs`).toBe(c.history.length);
    }
  });

  it('top-level history (no prereqs) exists in every case so the tree is enterable', () => {
    for (const c of cases) {
      const hasTopLevel = c.history.some((h) => (h.prereq_history_ids?.length ?? 0) === 0);
      expect(hasTopLevel, `${c.id} has no top-level history items`).toBe(true);
    }
  });
});

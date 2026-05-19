import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify as yamlStringify } from 'yaml';
import { validateContent } from '../src/content/validator';

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'skitt-validate-'));
  mkdirSync(join(root, 'content/cases'), { recursive: true });
  mkdirSync(join(root, 'content/episodes'), { recursive: true });
  mkdirSync(join(root, 'content/arcs'), { recursive: true });
  return root;
}

const minimalCase = {
  schema_version: 1,
  id: 'case_a',
  title: 'Test',
  chief_complaint: 'Test',
  vignette: 'Test',
  topic_id: 'test',
  curriculum_tags: ['RP2'],
  slos: [1],
  difficulty_band: 'CT1',
  paeds: false,
  demographics: { age_value: 30, age_unit: 'years', sex: 'female' },
  triage_category: 3,
  initial_state: 'stable',
  differential: [{ diagnosis: 'X', likelihood: 'top', discriminator: 'y' }],
  working_diagnosis: 'X',
  management: [{ id: 'mx_x', category: 'observation', name: 'X' }],
  disposition_options: [{ label: 'Discharge', criteria: 'Stable', appropriate: true }],
  state_machine: { states: ['stable'], transitions: [] },
  sources: [{ type: 'rcem', ref: 'Test' }],
};

describe('validateContent', () => {
  it('reports zero errors for valid content', () => {
    const root = makeRoot();
    try {
      writeFileSync(join(root, 'content/cases/case_a.yaml'), yamlStringify(minimalCase));
      writeFileSync(
        join(root, 'content/episodes/ep_a.yaml'),
        yamlStringify({
          schema_version: 1,
          id: 'ep_a',
          title: 'Test',
          learning_objectives: ['x'],
          curriculum_tags: ['RP2'],
          difficulty_band: 'CT1',
          focus_cases: ['case_a'],
        }),
      );
      const report = validateContent(root);
      expect(report.ok).toBe(true);
      expect(report.cases).toBe(1);
      expect(report.episodes).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('flags an episode referencing an unknown case', () => {
    const root = makeRoot();
    try {
      writeFileSync(
        join(root, 'content/episodes/ep_a.yaml'),
        yamlStringify({
          schema_version: 1,
          id: 'ep_a',
          title: 'Test',
          learning_objectives: ['x'],
          curriculum_tags: ['RP2'],
          difficulty_band: 'CT1',
          focus_cases: ['case_does_not_exist'],
        }),
      );
      const report = validateContent(root);
      expect(report.ok).toBe(false);
      expect(report.errors.some((e) => e.message.includes('case_does_not_exist'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('flags duplicate case ids across files', () => {
    const root = makeRoot();
    try {
      writeFileSync(join(root, 'content/cases/a.yaml'), yamlStringify(minimalCase));
      writeFileSync(join(root, 'content/cases/b.yaml'), yamlStringify(minimalCase));
      const report = validateContent(root);
      expect(report.ok).toBe(false);
      expect(report.errors.some((e) => e.message.includes('duplicate'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('flags an arc whose case ref is unknown', () => {
    const root = makeRoot();
    try {
      writeFileSync(join(root, 'content/cases/case_a.yaml'), yamlStringify(minimalCase));
      writeFileSync(
        join(root, 'content/arcs/arc_a.yaml'),
        yamlStringify({
          schema_version: 1,
          id: 'arc_a',
          type: 'family_relation',
          title: 'x',
          internal_summary: 'x',
          cases: ['case_a', 'case_missing'],
          reveals: [{ id: 'r1', on: 'clock_time', t_min: 5 }],
        }),
      );
      const report = validateContent(root);
      expect(report.ok).toBe(false);
      expect(report.errors.some((e) => e.message.includes('case_missing'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reports a schema error with a helpful path', () => {
    const root = makeRoot();
    try {
      const bad = { ...minimalCase, slos: [13] }; // out of range
      writeFileSync(join(root, 'content/cases/case_a.yaml'), yamlStringify(bad));
      const report = validateContent(root);
      expect(report.ok).toBe(false);
      const err = report.errors.find((e) => e.path?.includes('slos'));
      expect(err).toBeDefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('flags a scheduled results_back referencing an unknown investigation', () => {
    const root = makeRoot();
    try {
      writeFileSync(join(root, 'content/cases/case_a.yaml'), yamlStringify(minimalCase));
      writeFileSync(
        join(root, 'content/episodes/ep_a.yaml'),
        yamlStringify({
          schema_version: 1,
          id: 'ep_a',
          title: 'Test',
          learning_objectives: ['x'],
          curriculum_tags: ['RP2'],
          difficulty_band: 'CT1',
          focus_cases: ['case_a'],
          scheduled_events: [
            {
              id: 'ev_x',
              type: 'results_back',
              t_min: 5,
              case_id: 'case_a',
              investigation_id: 'ix_does_not_exist',
            },
          ],
        }),
      );
      const report = validateContent(root);
      expect(report.ok).toBe(false);
      expect(report.errors.some((e) => e.message.includes('ix_does_not_exist'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('flags a deterioration_if_not_x_by_t with an unknown required_action_id', () => {
    const root = makeRoot();
    try {
      writeFileSync(join(root, 'content/cases/case_a.yaml'), yamlStringify(minimalCase));
      writeFileSync(
        join(root, 'content/episodes/ep_a.yaml'),
        yamlStringify({
          schema_version: 1,
          id: 'ep_a',
          title: 'Test',
          learning_objectives: ['x'],
          curriculum_tags: ['RP2'],
          difficulty_band: 'CT1',
          focus_cases: ['case_a'],
          scheduled_events: [
            {
              id: 'ev_x',
              type: 'deterioration_if_not_x_by_t',
              t_min: 5,
              case_id: 'case_a',
              required_action_ids: ['mx_does_not_exist'],
              new_state: 'deteriorating',
            },
          ],
        }),
      );
      const report = validateContent(root);
      expect(report.ok).toBe(false);
      expect(report.errors.some((e) => e.message.includes('mx_does_not_exist'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('flags a history item whose prereq_history_ids points at an unknown id', () => {
    const root = makeRoot();
    try {
      writeFileSync(
        join(root, 'content/cases/case_a.yaml'),
        yamlStringify({
          ...minimalCase,
          history: [
            { id: 'hx_a', source: 'patient', topic: 'A?', response: 'a' },
            {
              id: 'hx_b',
              source: 'patient',
              topic: 'B?',
              response: 'b',
              prereq_history_ids: ['hx_does_not_exist'],
            },
          ],
        }),
      );
      const report = validateContent(root);
      expect(report.ok).toBe(false);
      expect(
        report.errors.some((e) => e.message.includes('prereq_history_ids') && e.message.includes('hx_does_not_exist')),
      ).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('flags a history item that lists itself as a prereq', () => {
    const root = makeRoot();
    try {
      writeFileSync(
        join(root, 'content/cases/case_a.yaml'),
        yamlStringify({
          ...minimalCase,
          history: [
            {
              id: 'hx_a',
              source: 'patient',
              topic: 'A?',
              response: 'a',
              prereq_history_ids: ['hx_a'],
            },
          ],
        }),
      );
      const report = validateContent(root);
      expect(report.ok).toBe(false);
      expect(report.errors.some((e) => /cannot list itself/i.test(e.message))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('flags a history item whose reveals points at an unknown id', () => {
    const root = makeRoot();
    try {
      writeFileSync(
        join(root, 'content/cases/case_a.yaml'),
        yamlStringify({
          ...minimalCase,
          history: [
            {
              id: 'hx_a',
              source: 'patient',
              topic: 'A?',
              response: 'a',
              reveals: ['hx_does_not_exist'],
            },
          ],
        }),
      );
      const report = validateContent(root);
      expect(report.ok).toBe(false);
      expect(
        report.errors.some((e) => e.message.includes('reveals') && e.message.includes('hx_does_not_exist')),
      ).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('flags an arc history_asked reveal that points to an unknown history_id', () => {
    const root = makeRoot();
    try {
      writeFileSync(join(root, 'content/cases/case_a.yaml'), yamlStringify(minimalCase));
      writeFileSync(
        join(root, 'content/cases/case_b.yaml'),
        yamlStringify({ ...minimalCase, id: 'case_b' }),
      );
      writeFileSync(
        join(root, 'content/arcs/arc_a.yaml'),
        yamlStringify({
          schema_version: 1,
          id: 'arc_a',
          type: 'family_relation',
          title: 'x',
          internal_summary: 'x',
          cases: ['case_a', 'case_b'],
          reveals: [
            {
              id: 'r1',
              on: 'history_asked',
              in_case_id: 'case_a',
              history_id: 'hx_does_not_exist',
            },
          ],
        }),
      );
      const report = validateContent(root);
      expect(report.ok).toBe(false);
      expect(report.errors.some((e) => e.message.includes('hx_does_not_exist'))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

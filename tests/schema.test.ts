import { describe, expect, it } from 'vitest';
import {
  Arc,
  Case,
  Citation,
  CurriculumCode,
  Episode,
  ScheduledEvent,
  SloNumber,
} from '../src/content/schema';

describe('CurriculumCode', () => {
  it.each([
    'RP2',
    'RC4',
    'AP1',
    'AC1',
    'CP1',
    'CC13',
    'ObP3',
    'ObC19',
    'MuC10',
    'NeoC1',
    'EnvC10',
    'MHP1',
    'MHC8',
    'PalC7',
    'SaP1',
    'SaC4',
    'XC4',
    'OncP1',
    'OncC3',
    'OptP5',
  ])('accepts valid code %s', (code) => {
    expect(CurriculumCode.safeParse(code).success).toBe(true);
  });

  it.each(['rp2', 'RP', 'RP200', '2RP', 'RPP1', ''])('rejects invalid code %s', (code) => {
    expect(CurriculumCode.safeParse(code).success).toBe(false);
  });
});

describe('SloNumber', () => {
  it.each([1, 2, 12])('accepts %i', (n) => expect(SloNumber.safeParse(n).success).toBe(true));
  it.each([0, 13, -1, 1.5])('rejects %s', (n) =>
    expect(SloNumber.safeParse(n).success).toBe(false),
  );
});

describe('Citation', () => {
  it('accepts a NICE citation with id', () => {
    const result = Citation.safeParse({ type: 'nice', id: 'NG51', ref: 'Sepsis: recognition' });
    expect(result.success).toBe(true);
  });

  it('rejects a NICE citation with malformed id', () => {
    const result = Citation.safeParse({ type: 'nice', id: 'foo', ref: 'x' });
    expect(result.success).toBe(false);
  });

  it('accepts a textbook citation with chapter and page', () => {
    const result = Citation.safeParse({
      type: 'textbook',
      ref: 'Oxford Handbook of EM 5e',
      chapter: '2',
      page: '50',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown citation type', () => {
    const result = Citation.safeParse({ type: 'wikipedia', ref: 'x' });
    expect(result.success).toBe(false);
  });
});

describe('ScheduledEvent', () => {
  it('accepts a results_back event with valid fields', () => {
    const ev = ScheduledEvent.safeParse({
      id: 'ev1',
      type: 'results_back',
      t_min: 10,
      case_id: 'case_test',
      investigation_id: 'ix_vbg',
    });
    expect(ev.success).toBe(true);
  });

  it('rejects a results_back event missing case_id', () => {
    const ev = ScheduledEvent.safeParse({
      id: 'ev1',
      type: 'results_back',
      t_min: 10,
      investigation_id: 'ix_vbg',
    });
    expect(ev.success).toBe(false);
  });

  it('accepts arc_reveal with arc_id (and not case_id)', () => {
    const ev = ScheduledEvent.safeParse({
      id: 'ev1',
      type: 'arc_reveal',
      t_min: 6,
      arc_id: 'arc_foo',
      reveal_id: 'reveal_a',
    });
    expect(ev.success).toBe(true);
  });
});

const minimalCase = {
  schema_version: 1,
  id: 'case_test_minimal',
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

describe('Case', () => {
  it('round-trips a minimal valid case', () => {
    expect(Case.safeParse(minimalCase).success).toBe(true);
  });

  it('accepts a valid bay value', () => {
    for (const bay of ['resus', 'majors', 'minors', 'paeds', 'relatives', 'ambulatory', 'triage']) {
      expect(Case.safeParse({ ...minimalCase, bay }).success).toBe(true);
    }
  });

  it('rejects an unknown bay value', () => {
    expect(Case.safeParse({ ...minimalCase, bay: 'corridor' }).success).toBe(false);
  });

  it('rejects case with bad id format', () => {
    const bad = { ...minimalCase, id: 'NotACaseId' };
    expect(Case.safeParse(bad).success).toBe(false);
  });

  it('rejects case with empty curriculum_tags', () => {
    const bad = { ...minimalCase, curriculum_tags: [] };
    expect(Case.safeParse(bad).success).toBe(false);
  });

  it('rejects case with no sources', () => {
    const bad = { ...minimalCase, sources: [] };
    expect(Case.safeParse(bad).success).toBe(false);
  });

  it('rejects case with SLO out of range', () => {
    const bad = { ...minimalCase, slos: [13] };
    expect(Case.safeParse(bad).success).toBe(false);
  });
});

const minimalArc = {
  schema_version: 1,
  id: 'arc_test',
  type: 'family_relation',
  title: 'Test arc',
  internal_summary: 'For testing.',
  cases: ['case_a', 'case_b'],
  reveals: [{ id: 'r1', on: 'clock_time', t_min: 10 }],
};

describe('Arc', () => {
  it('round-trips a minimal valid arc', () => {
    expect(Arc.safeParse(minimalArc).success).toBe(true);
  });

  it('rejects arc with only one case', () => {
    const bad = { ...minimalArc, cases: ['case_a'] };
    expect(Arc.safeParse(bad).success).toBe(false);
  });

  it('rejects arc with no reveals', () => {
    const bad = { ...minimalArc, reveals: [] };
    expect(Arc.safeParse(bad).success).toBe(false);
  });

  it('rejects arc with bad id prefix', () => {
    const bad = { ...minimalArc, id: 'family_test' };
    expect(Arc.safeParse(bad).success).toBe(false);
  });
});

const minimalEpisode = {
  schema_version: 1,
  id: 'ep_test',
  title: 'Test episode',
  learning_objectives: ['LO1'],
  curriculum_tags: ['RP2'],
  difficulty_band: 'CT1',
  focus_cases: ['case_a'],
};

describe('Episode', () => {
  it('round-trips a minimal valid episode', () => {
    expect(Episode.safeParse(minimalEpisode).success).toBe(true);
  });

  it('rejects an episode with more than 3 focus cases', () => {
    const bad = { ...minimalEpisode, focus_cases: ['a', 'b', 'c', 'd'] };
    expect(Episode.safeParse(bad).success).toBe(false);
  });

  it('rejects an episode with zero focus cases', () => {
    const bad = { ...minimalEpisode, focus_cases: [] };
    expect(Episode.safeParse(bad).success).toBe(false);
  });

  it('rejects an episode with more than 4 ambient cases', () => {
    const bad = {
      ...minimalEpisode,
      ambient_cases: ['a', 'b', 'c', 'd', 'e'],
    };
    expect(Episode.safeParse(bad).success).toBe(false);
  });

  it('defaults ambient_cases and arcs to []', () => {
    const result = Episode.safeParse(minimalEpisode);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ambient_cases).toEqual([]);
      expect(result.data.arcs).toEqual([]);
      expect(result.data.shift_duration_min).toBe(20);
    }
  });
});

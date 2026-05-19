import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case, Episode, type CaseT, type EpisodeT } from '../src/content/schema';
import { SimKernel } from '../src/sim/kernel';

const ROOT = process.cwd();

function load<T>(rel: string, schema: { parse: (raw: unknown) => T }): T {
  return schema.parse(parseYaml(readFileSync(join(ROOT, rel), 'utf8')));
}

function makeKernel(): { kernel: SimKernel; caseId: string; episode: EpisodeT; caseData: CaseT } {
  const caseData = load('content/cases/case_anaphylaxis_adult_peanut.yaml', Case);
  // Build a single-case episode in-memory for these tests so they don't
  // couple to whatever episode the content tree happens to contain.
  const episode: EpisodeT = Episode.parse({
    schema_version: 1,
    id: 'ep_test',
    title: 'Kernel test',
    learning_objectives: ['x'],
    curriculum_tags: ['RP2'],
    difficulty_band: 'CT2',
    shift_duration_min: 20,
    focus_cases: [caseData.id],
    scheduled_events: [
      {
        id: 'ev_results',
        type: 'results_back',
        t_min: 10,
        case_id: caseData.id,
        investigation_id: 'ix_tryptase',
      },
      {
        id: 'ev_deteriorate',
        type: 'deterioration_if_not_x_by_t',
        t_min: 5,
        case_id: caseData.id,
        required_action_ids: ['mx_adrenaline_im'],
        new_state: 'arrested',
      },
    ],
  });
  const kernel = new SimKernel({ episode, cases: new Map([[caseData.id, caseData]]) });
  kernel.enterCase(caseData.id);
  return { kernel, caseId: caseData.id, episode, caseData };
}

describe('SimKernel — clock + events', () => {
  it('starts at T+0 with the shift log seeded', () => {
    const { kernel } = makeKernel();
    expect(kernel.getState().clockMin).toBe(0);
    expect(kernel.getState().log).toHaveLength(2); // handover + entered case
  });

  it('advances the clock by the requested minutes (clamped to shift duration)', () => {
    const { kernel } = makeKernel();
    kernel.advance(3);
    expect(kernel.getState().clockMin).toBe(3);
    kernel.advance(100);
    expect(kernel.getState().clockMin).toBe(20);
    expect(kernel.getState().isShiftOver).toBe(true);
  });

  it('does not advance once the shift is over', () => {
    const { kernel } = makeKernel();
    kernel.advance(25);
    const stoppedAt = kernel.getState().clockMin;
    kernel.advance(5);
    expect(kernel.getState().clockMin).toBe(stoppedAt);
  });

  it('fires the deterioration event at T+5 if required action not done', () => {
    const { kernel, caseId } = makeKernel();
    kernel.advance(5);
    const cs = kernel.getState().cases.get(caseId)!;
    expect(cs.state).toBe('arrested');
    expect(
      kernel.getState().log.some((l) => l.level === 'danger' && l.text.includes('deterioration')),
    ).toBe(true);
  });

  it('skips the deterioration event when the required action is done before T+5', () => {
    const { kernel, caseId } = makeKernel();
    kernel.toggleAction(caseId, 'mx_adrenaline_im');
    kernel.advance(5);
    const cs = kernel.getState().cases.get(caseId)!;
    expect(cs.state).not.toBe('arrested');
    // Adrenaline transition fires deteriorating → stable per the case YAML
    expect(cs.state).toBe('stable');
  });

  it('fires the scheduled results_back event at T+10', () => {
    const { kernel, caseId } = makeKernel();
    kernel.toggleAction(caseId, 'mx_adrenaline_im'); // avoid arrest
    kernel.advance(10);
    const cs = kernel.getState().cases.get(caseId)!;
    expect(cs.resulted.has('ix_tryptase')).toBe(true);
  });
});

describe('SimKernel — investigations', () => {
  it('does not result an investigation before its turnaround_min elapses', () => {
    const { kernel, caseId } = makeKernel();
    kernel.toggleAction(caseId, 'mx_adrenaline_im');
    kernel.orderInvestigation(caseId, 'ix_vbg'); // turnaround 5 min
    kernel.advance(3);
    expect(kernel.getState().cases.get(caseId)!.resulted.has('ix_vbg')).toBe(false);
  });

  it('results an investigation once turnaround_min has elapsed', () => {
    const { kernel, caseId } = makeKernel();
    kernel.toggleAction(caseId, 'mx_adrenaline_im');
    kernel.orderInvestigation(caseId, 'ix_vbg'); // ordered at T+0, turnaround 5
    kernel.advance(6);
    expect(kernel.getState().cases.get(caseId)!.resulted.has('ix_vbg')).toBe(true);
  });
});

describe('SimKernel — state transitions', () => {
  it('player action fires the deteriorating → stable transition', () => {
    const { kernel, caseId } = makeKernel();
    expect(kernel.getState().cases.get(caseId)!.state).toBe('deteriorating');
    kernel.toggleAction(caseId, 'mx_adrenaline_im');
    expect(kernel.getState().cases.get(caseId)!.state).toBe('stable');
  });

  it('terminal states are not transitioned out of', () => {
    const { kernel, caseId } = makeKernel();
    kernel.advance(5); // arrests
    expect(kernel.getState().cases.get(caseId)!.state).toBe('arrested');
    kernel.toggleAction(caseId, 'mx_adrenaline_im');
    expect(kernel.getState().cases.get(caseId)!.state).toBe('arrested');
  });
});

describe('SimKernel — subscribe/notify', () => {
  it('notifies subscribers on advance, action, and investigation order', () => {
    const { kernel, caseId } = makeKernel();
    let calls = 0;
    const unsub = kernel.subscribe(() => calls++);
    kernel.advance(1);
    kernel.toggleAction(caseId, 'mx_adrenaline_im');
    kernel.orderInvestigation(caseId, 'ix_vbg');
    unsub();
    kernel.advance(1);
    // The post-unsub advance should not have incremented calls
    expect(calls).toBe(3);
  });
});

describe('SimKernel — determinism', () => {
  it('two kernels driven the same way reach the same state', () => {
    const data = load('content/cases/case_anaphylaxis_adult_peanut.yaml', Case);
    const episode: EpisodeT = Episode.parse({
      schema_version: 1,
      id: 'ep_test',
      title: 'Determinism',
      learning_objectives: ['x'],
      curriculum_tags: ['RP2'],
      difficulty_band: 'CT2',
      shift_duration_min: 20,
      focus_cases: [data.id],
      scheduled_events: [],
    });
    const k1 = new SimKernel({ episode, cases: new Map([[data.id, data]]) });
    const k2 = new SimKernel({ episode, cases: new Map([[data.id, data]]) });
    [k1, k2].forEach((k) => {
      k.enterCase(data.id);
      k.advance(2);
      k.toggleAction(data.id, 'mx_a_to_e');
      k.advance(3);
      k.orderInvestigation(data.id, 'ix_vbg');
      k.advance(10);
    });
    expect(k1.getState().clockMin).toBe(k2.getState().clockMin);
    expect(k1.getState().cases.get(data.id)!.state).toBe(k2.getState().cases.get(data.id)!.state);
    expect([...k1.getState().cases.get(data.id)!.resulted]).toEqual([
      ...k2.getState().cases.get(data.id)!.resulted,
    ]);
  });
});

describe('SimKernel — branching dialogue (M34)', () => {
  it('records a chosen branch and applies its rapport delta', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { parse } = await import('yaml');
    const { Case, Episode } = await import('../src/content/schema');
    const chloe = Case.parse(
      parse(
        readFileSync(
          join(process.cwd(), 'content/cases/case_paracetamol_od_chloe.yaml'),
          'utf8',
        ),
      ),
    );
    const ep = Episode.parse({
      schema_version: 1,
      id: 'ep_chloe_branch_test',
      title: 'Chloe branch test',
      learning_objectives: ['x'],
      curriculum_tags: ['MHC1'],
      difficulty_band: 'CT2',
      shift_duration_min: 20,
      focus_cases: [chloe.id],
    });
    const k = new SimKernel({ episode: ep, cases: new Map([[chloe.id, chloe]]) });
    k.enterCase(chloe.id);
    // Unlock the gated item by asking its prereq.
    k.recordAsk(chloe.id, 'hx_chloe_ingestion');
    k.recordAsk(chloe.id, 'hx_chloe_intent');
    k.pickBranchChoice(chloe.id, 'hx_chloe_intent', 'compassionate');

    const cs = k.getState().cases.get(chloe.id)!;
    expect(cs.branchChoices.get('hx_chloe_intent')).toBe('compassionate');
    expect(cs.rapport).toBe(2);
  });

  it('recordManoeuvre is idempotent + survives serialise/restore (M40)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { parse } = await import('yaml');
    const { Case, Episode } = await import('../src/content/schema');
    const stan = Case.parse(
      parse(readFileSync(join(process.cwd(), 'content/cases/case_intox_stan_ambient.yaml'), 'utf8')),
    );
    const ep = Episode.parse({
      schema_version: 1,
      id: 'ep_stan_manoeuvre_test',
      title: 'Stan manoeuvre test',
      learning_objectives: ['x'],
      curriculum_tags: ['MHC1'],
      difficulty_band: 'CT2',
      shift_duration_min: 20,
      focus_cases: [stan.id],
    });
    const k = new SimKernel({ episode: ep, cases: new Map([[stan.id, stan]]) });
    k.enterCase(stan.id);
    k.recordExamine(stan.id, 'exposure');
    k.recordManoeuvre(stan.id, 'exposure', 'log_roll');
    const cs1 = k.getState().cases.get(stan.id)!;
    expect(cs1.performedManoeuvres.has('exposure::log_roll')).toBe(true);
    // Idempotent
    k.recordManoeuvre(stan.id, 'exposure', 'log_roll');
    expect(cs1.performedManoeuvres.size).toBe(1);

    const snap = k.serialize();
    const k2 = new SimKernel({ episode: ep, cases: new Map([[stan.id, stan]]), restore: snap });
    expect(k2.getState().cases.get(stan.id)!.performedManoeuvres.has('exposure::log_roll')).toBe(
      true,
    );
  });

  it('emits a trap_caught interrupt when must_not_do is ticked (M39)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { parse } = await import('yaml');
    const { Case, Episode } = await import('../src/content/schema');
    const amir = Case.parse(
      parse(readFileSync(join(process.cwd(), 'content/cases/case_paeds_dka_amir.yaml'), 'utf8')),
    );
    const ep = Episode.parse({
      schema_version: 1,
      id: 'ep_amir_interrupt_test',
      title: 'Amir interrupt test',
      learning_objectives: ['x'],
      curriculum_tags: ['EnC1'],
      difficulty_band: 'CT2',
      shift_duration_min: 20,
      focus_cases: [amir.id],
    });
    const k = new SimKernel({ episode: ep, cases: new Map([[amir.id, amir]]) });
    k.enterCase(amir.id);
    // Unlock the gated trap by asking paramedics first.
    k.recordAsk(amir.id, 'hx_paramedics');
    expect(k.getState().pendingInterrupt).toBeNull();
    // Tick the adult-bolus trap → McGrath should pause us.
    k.toggleAction(amir.id, 'mx_adult_bolus_20');
    const pending = k.getState().pendingInterrupt;
    expect(pending).not.toBeNull();
    expect(pending!.trigger).toBe('trap_caught');
    expect(pending!.line).toMatch(/walk me through/i);
    // Dismiss and verify state clears.
    k.dismissConsultantInterrupt();
    expect(k.getState().pendingInterrupt).toBeNull();
    // Ticking a SECOND trap on the same case must NOT re-fire — one per case.
    k.toggleAction(amir.id, 'mx_insulin_bolus');
    expect(k.getState().pendingInterrupt).toBeNull();
  });

  it('management gated_by_history references valid history ids (M35)', async () => {
    // Validate the M35 gating contract structurally: every gated_by
    // history id on Amir must exist on the case's history list.
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { parse } = await import('yaml');
    const { Case } = await import('../src/content/schema');
    const amir = Case.parse(
      parse(
        readFileSync(join(process.cwd(), 'content/cases/case_paeds_dka_amir.yaml'), 'utf8'),
      ),
    );
    const hxIds = new Set(amir.history.map((h) => h.id));
    const gated = amir.management.filter((m) => m.gated_by_history);
    expect(gated.length).toBeGreaterThan(0);
    for (const m of gated) {
      for (const h of m.gated_by_history ?? []) {
        expect(hxIds.has(h)).toBe(true);
      }
    }
  });

  it('picking the same branch twice is a no-op (idempotent)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { parse } = await import('yaml');
    const { Case, Episode } = await import('../src/content/schema');
    const chloe = Case.parse(
      parse(
        readFileSync(
          join(process.cwd(), 'content/cases/case_paracetamol_od_chloe.yaml'),
          'utf8',
        ),
      ),
    );
    const ep = Episode.parse({
      schema_version: 1,
      id: 'ep_chloe_idempotent_test',
      title: 'Chloe idempotent test',
      learning_objectives: ['x'],
      curriculum_tags: ['MHC1'],
      difficulty_band: 'CT2',
      shift_duration_min: 20,
      focus_cases: [chloe.id],
    });
    const k = new SimKernel({ episode: ep, cases: new Map([[chloe.id, chloe]]) });
    k.enterCase(chloe.id);
    k.recordAsk(chloe.id, 'hx_chloe_ingestion');
    k.recordAsk(chloe.id, 'hx_chloe_intent');
    k.pickBranchChoice(chloe.id, 'hx_chloe_intent', 'compassionate');
    // Try to overwrite — must be a no-op.
    k.pickBranchChoice(chloe.id, 'hx_chloe_intent', 'deflecting');
    const cs = k.getState().cases.get(chloe.id)!;
    expect(cs.branchChoices.get('hx_chloe_intent')).toBe('compassionate');
    expect(cs.rapport).toBe(2);
  });
});

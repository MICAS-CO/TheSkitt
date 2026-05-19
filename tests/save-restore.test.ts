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

function mkKernel() {
  const beth = load('content/cases/case_anaphylaxis_adult_peanut.yaml', Case);
  const sarah = load('content/cases/case_ectopic_minors_sarah.yaml', Case);
  const stan = load('content/cases/case_intox_stan_ambient.yaml', Case);
  const patel = load('content/cases/case_chest_pain_patel_ambient.yaml', Case);
  const arc = load('content/arcs/arc_hendo_dinner.yaml', Arc);
  const episode = load('content/episodes/ep_hendo_shift.yaml', Episode);
  const cases = new Map([
    [beth.id, beth],
    [sarah.id, sarah],
    [stan.id, stan],
    [patel.id, patel],
  ]);
  const arcs = new Map([[arc.id, arc]]);
  return { episode, cases, arcs, beth, sarah, stan };
}

describe('SimKernel — save / restore', () => {
  it('round-trips a clean kernel snapshot', () => {
    const { episode, cases, arcs } = mkKernel();
    const k1 = new SimKernel({ episode, cases, arcs });
    const snap = k1.serialize();
    expect(snap.v).toBe(1);
    expect(snap.clockMin).toBe(0);
    const k2 = new SimKernel({ episode, cases, arcs, restore: snap });
    expect(k2.getState().clockMin).toBe(0);
    expect(k2.getState().log).toHaveLength(1);
  });

  it('preserves clock advance + actions + ix orders + arc reveals across restore', () => {
    const { episode, cases, arcs, beth, sarah, stan } = mkKernel();
    const k1 = new SimKernel({ episode, cases, arcs });
    k1.enterCase(beth.id);
    k1.toggleAction(beth.id, 'mx_adrenaline_im');
    k1.recordAsk(beth.id, 'hx_partner'); // reveals the arc
    k1.advance(6); // Sarah arrives
    k1.enterCase(sarah.id);
    k1.orderInvestigation(sarah.id, 'ix_serum_bhcg');

    const snap = k1.serialize();
    const k2 = new SimKernel({ episode, cases, arcs, restore: snap });
    const s2 = k2.getState();

    expect(s2.clockMin).toBe(k1.getState().clockMin);
    expect(s2.cases.get(beth.id)!.actions.has('mx_adrenaline_im')).toBe(true);
    expect(s2.cases.get(beth.id)!.asked.has('hx_partner')).toBe(true);
    expect(s2.cases.get(sarah.id)!.state).toBe('triaged');
    expect(s2.cases.get(sarah.id)!.ordered.get('ix_serum_bhcg')).toBeDefined();
    expect(s2.revealedArcIds.has('arc_hendo_dinner')).toBe(true);
    // Sarah's gated history is unlocked
    expect(s2.cases.get(sarah.id)!.unlockedHistoryIds.has('hx_friend_in_resus')).toBe(true);
    // Stan still untouched in stable state
    expect(s2.cases.get(stan.id)!.state).toBe('stable');
  });

  it('restored kernel can continue advancing deterministically', () => {
    const { episode, cases, arcs, beth } = mkKernel();
    const k1 = new SimKernel({ episode, cases, arcs });
    k1.enterCase(beth.id);
    k1.toggleAction(beth.id, 'mx_adrenaline_im');
    k1.advance(3);

    const snap = k1.serialize();
    const k2 = new SimKernel({ episode, cases, arcs, restore: snap });
    k1.advance(10);
    k2.advance(10);
    expect(k2.getState().clockMin).toBe(k1.getState().clockMin);
    expect(k2.getState().cases.get(beth.id)!.state).toBe(k1.getState().cases.get(beth.id)!.state);
  });

  it('throws if the snapshot is for a different episode', () => {
    const { episode, cases, arcs } = mkKernel();
    const k1 = new SimKernel({ episode, cases, arcs });
    const snap = k1.serialize();
    const wrong = { ...snap, episodeId: 'ep_wrong_one' };
    expect(() => new SimKernel({ episode, cases, arcs, restore: wrong })).toThrow();
  });

  it('preserves sequenceErrors across serialize → restore (M20)', () => {
    // Build a small dissection-solo kernel — Okafor's GTN action
    // (mx_gtn_after_beta) has prereq_action_ids: [mx_iv_labetalol].
    // Taking GTN first triggers a sequence error; that record must
    // survive save/resume.
    const okafor = load('content/cases/case_aortic_dissection_okafor.yaml', Case);
    const ep = Episode.parse({
      schema_version: 1,
      id: 'ep_dissection_seq_test',
      title: 'Dissection seq test',
      learning_objectives: ['x'],
      curriculum_tags: ['CC2'],
      difficulty_band: 'ST3',
      shift_duration_min: 20,
      focus_cases: [okafor.id],
    });
    const cases = new Map([[okafor.id, okafor]]);

    const k1 = new SimKernel({ episode: ep, cases });
    k1.enterCase(okafor.id);
    // GTN BEFORE β-blockade → sequence error recorded.
    k1.toggleAction(okafor.id, 'mx_gtn_after_beta');
    const s1 = k1.getState().cases.get(okafor.id)!;
    expect(s1.sequenceErrors.has('mx_gtn_after_beta')).toBe(true);

    const snap = k1.serialize();
    const k2 = new SimKernel({ episode: ep, cases, restore: snap });
    const s2 = k2.getState().cases.get(okafor.id)!;
    expect(s2.sequenceErrors.has('mx_gtn_after_beta')).toBe(true);
    expect([...s2.sequenceErrors]).toEqual([...s1.sequenceErrors]);
  });

  it('older snapshots without sequenceErrors restore safely', () => {
    // Backwards-compat: a v:1 snapshot authored before M20 won't have
    // sequenceErrors in its per-case payload. Restore must default to
    // an empty Set without throwing.
    const { episode, cases, arcs, beth } = mkKernel();
    const k = new SimKernel({ episode, cases, arcs });
    const snap = k.serialize();
    // Simulate pre-M20 snapshot by stripping the field.
    const stripped = {
      ...snap,
      cases: snap.cases.map((c) => {
        const { sequenceErrors: _omit, ...rest } = c;
        void _omit;
        return rest;
      }),
    } as typeof snap;
    const k2 = new SimKernel({ episode, cases, arcs, restore: stripped });
    expect(k2.getState().cases.get(beth.id)!.sequenceErrors.size).toBe(0);
  });

  it('migrateSnapshot accepts a version-less raw object (pre-M59)', async () => {
    const { migrateSnapshot, SNAPSHOT_VERSION } = await import('../src/sim/kernel');
    const { episode, cases, arcs, beth } = mkKernel();
    const k = new SimKernel({ episode, cases, arcs });
    k.enterCase(beth.id);
    k.toggleAction(beth.id, 'mx_adrenaline_im');
    const snap = k.serialize() as unknown as Record<string, unknown>;
    // Strip the v field to simulate a pre-M59 payload.
    const versionless = { ...snap };
    delete versionless.v;
    const migrated = migrateSnapshot(versionless);
    expect(migrated.v).toBe(SNAPSHOT_VERSION);
    // And it must restore cleanly.
    const k2 = new SimKernel({ episode, cases, arcs, restore: versionless });
    expect(k2.getState().cases.get(beth.id)!.actions.has('mx_adrenaline_im')).toBe(true);
  });

  it('migrateSnapshot rejects a future version with a useful error', async () => {
    const { migrateSnapshot } = await import('../src/sim/kernel');
    expect(() => migrateSnapshot({ v: 99 })).toThrow(/newer than the kernel/i);
  });

  it('migrateSnapshot rejects non-object inputs', async () => {
    const { migrateSnapshot } = await import('../src/sim/kernel');
    expect(() => migrateSnapshot(null)).toThrow(/not a valid object/);
    expect(() => migrateSnapshot('string')).toThrow(/not a valid object/);
  });
});

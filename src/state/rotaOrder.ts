/**
 * M82/M83 — Rota ordering + block structure.
 *
 * The single, linear sequence of shifts the rota publishes (M82) plus
 * the 3-block structure with keystone gating (M83).
 *
 * Blocks gate access to the next block via a single keystone shift
 * per block. The keystone must be cleared at band >= 'good' (SHO
 * standard or better — see clearsKeystone in shiftRota.ts). Below
 * that band, the keystone stays in place for retry. Non-keystone
 * shifts advance unconditionally on completion.
 *
 * Keystone choices (M83 first cut; M84 may reshape):
 *  - Block 1 → ep_stroke_solo: witnessed LMCA stroke on apixaban.
 *    Combines anchoring on FAST + DOAC interaction + time-critical
 *    thrombolysis pathway. Proves the basics are loaded.
 *  - Block 2 → ep_seizure_solo: refractory status in a pregnant 28F
 *    with an SAH twist. NICE NG217 + MHRA valproate PPP + CT timing.
 *    Cognitive load + safety stack.
 *  - Block 3 → ep_dissection_solo: the textbook anchor-breaker the
 *    M81 design consultation explicitly named as a late-game pillar.
 *    Final keystone is graduation-flavoured rather than a real gate
 *    (no block 4 to unlock).
 *
 * The `focusCaseIds` for each shift duplicate the canonical YAML
 * `focus_cases` lists — inlined here so the migration scan and the
 * MenuView render don't pay the cost of parsing 18 episode YAMLs at
 * startup. The `tests/rotaOrder.consistency.test.ts` content test
 * walks every episode YAML and asserts the inlined values match.
 */

import type { RotaShiftRef } from './shiftRota';

export const ROTA_ORDER: ReadonlyArray<RotaShiftRef> = [
  // ─── Block 1 — gentle minors / clear presentations ──────────────
  { episodeId: 'ep_minors_day_entry', focusCaseIds: ['case_chest_pain_patel_ambient', 'case_intox_stan_ambient'], blockIndex: 1, isKeystone: false },
  { episodeId: 'ep_anaphylaxis_solo', focusCaseIds: ['case_anaphylaxis_adult_peanut'], blockIndex: 1, isKeystone: false },
  { episodeId: 'ep_ahf_solo', focusCaseIds: ['case_acute_heart_failure_ahmed'], blockIndex: 1, isKeystone: false },
  { episodeId: 'ep_htn_emergency_solo', focusCaseIds: ['case_htn_emergency_oduya'], blockIndex: 1, isKeystone: false },
  { episodeId: 'ep_stroke_solo', focusCaseIds: ['case_stroke_acute_williams'], blockIndex: 1, isKeystone: true },
  // ─── Block 2 — mid-difficulty solos + paeds + family doses ──────
  { episodeId: 'ep_overnight_sepsis_solo', focusCaseIds: ['case_sepsis_uti_morrison'], blockIndex: 2, isKeystone: false },
  { episodeId: 'ep_ugib_solo', focusCaseIds: ['case_ugib_variceal_kowalski'], blockIndex: 2, isKeystone: false },
  { episodeId: 'ep_paracetamol_solo', focusCaseIds: ['case_paracetamol_od_chloe'], blockIndex: 2, isKeystone: false },
  { episodeId: 'ep_paeds_dka_solo', focusCaseIds: ['case_paeds_dka_amir'], blockIndex: 2, isKeystone: false },
  // M88 (Braintrust 10 audit): Beth (case_anaphylaxis_adult_peanut) was
  // dropped from this shift to fix patient over-recurrence. Sam is the
  // sole focus case now.
  { episodeId: 'ep_birthday_party', focusCaseIds: ['case_anaphylaxis_paeds_sibling'], blockIndex: 2, isKeystone: false },
  { episodeId: 'ep_seizure_solo', focusCaseIds: ['case_status_epilepticus_priya'], blockIndex: 2, isKeystone: true },
  // ─── Block 3 — doubles + late-game anchor-breakers ──────────────
  { episodeId: 'ep_hendo_shift', focusCaseIds: ['case_anaphylaxis_adult_peanut', 'case_ectopic_minors_sarah'], blockIndex: 3, isKeystone: false },
  { episodeId: 'ep_overnight_metabolic', focusCaseIds: ['case_dka_marcus', 'case_sepsis_uti_morrison'], blockIndex: 3, isKeystone: false },
  { episodeId: 'ep_overnight_safety_net', focusCaseIds: ['case_paracetamol_od_chloe', 'case_intox_stan_ambient'], blockIndex: 3, isKeystone: false },
  // M88b (Braintrust 10 audit, deferred from M88): ep_doac_double was
  // dropped from the rota. Its dual-DOAC parallel teaching beat
  // (reperfusion vs reversal under time pressure) was valuable but
  // both constituent cases — Williams (LVO stroke) and Brennan (SDH
  // on apixaban) — already have solo homes in the rota
  // (ep_stroke_solo, ep_head_injury_doac), and using both in a third
  // dual-bill shift was the worst recurrence offender in the build.
  // The episode YAML, case files, and SHIFT_DEFS entry stay in place
  // — they're not deleted, just unreferenced from the rota — so a
  // future iteration with newly-authored stroke-on-DOAC + new SDH
  // case files can reintroduce the dual-bill without the recurrence
  // debt. See content/cases/AUDIT.md for the rule.
  { episodeId: 'ep_pe_solo', focusCaseIds: ['case_massive_pe_okonkwo'], blockIndex: 3, isKeystone: false },
  { episodeId: 'ep_head_injury_doac', focusCaseIds: ['case_head_injury_doac_brennan'], blockIndex: 3, isKeystone: false },
  { episodeId: 'ep_dissection_solo', focusCaseIds: ['case_aortic_dissection_okafor'], blockIndex: 3, isKeystone: true },
];

export const ROTA_ORDER_IDS: ReadonlyArray<string> = ROTA_ORDER.map((s) => s.episodeId);

export const TOTAL_BLOCKS = 3;

export interface BlockInfo {
  blockIndex: 1 | 2 | 3;
  shiftCount: number;
  keystoneEpisodeId: string;
  /** Indices in ROTA_ORDER that belong to this block. */
  positions: readonly number[];
}

export const BLOCKS: ReadonlyArray<BlockInfo> = (() => {
  const grouped = new Map<1 | 2 | 3, number[]>();
  ROTA_ORDER.forEach((s, i) => {
    const arr = grouped.get(s.blockIndex) ?? [];
    arr.push(i);
    grouped.set(s.blockIndex, arr);
  });
  return [1, 2, 3].map((bi) => {
    const positions = grouped.get(bi as 1 | 2 | 3) ?? [];
    if (positions.length === 0) {
      throw new Error(`Block ${bi} has no shifts in ROTA_ORDER`);
    }
    const keystones = positions
      .map((p) => ROTA_ORDER[p]!)
      .filter((s) => s.isKeystone);
    // M83 invariant: exactly one keystone per block. Multiple keystones
    // would silently desync `getBlockProgress` (which scans for "any
    // keystone cleared") from `advanceRota` (which checks the current
    // shift's isKeystone). Zero keystones would leave a block with no
    // gate. Round-1 reviewer caught this on the .find()-only check.
    if (keystones.length !== 1) {
      throw new Error(
        `Block ${bi} must have exactly one keystone shift; found ${keystones.length}`,
      );
    }
    return {
      blockIndex: bi as 1 | 2 | 3,
      shiftCount: positions.length,
      keystoneEpisodeId: keystones[0]!.episodeId,
      positions,
    };
  });
})();

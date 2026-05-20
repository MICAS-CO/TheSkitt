/**
 * M82 — Rota ordering.
 *
 * The single, linear sequence of shifts the rota publishes. Position 0
 * is the player's first published shift; subsequent positions appear
 * one at a time as the rota advances on debrief.
 *
 * The `focusCaseIds` for each shift duplicate the canonical YAML
 * `focus_cases` lists — inlined here so the migration scan and the
 * MenuView render don't pay the cost of parsing 18 episode YAMLs at
 * startup just to know which cases each shift contains. The
 * `tests/rotaOrder.consistency.test.ts` content test walks every
 * episode YAML and asserts the inlined values match — drift is
 * caught at CI time, not at runtime.
 *
 * Rough difficulty-ascending ordering across 3 blocks. The keystone
 * gating (1 keystone shift per block, blocks gate access to the next)
 * lands in M83. The definitive ordering — and any block-boundary
 * shuffling — lands in M84.
 */

import type { RotaShiftRef } from './shiftRota';

export const ROTA_ORDER: ReadonlyArray<RotaShiftRef> = [
  // Block 1 (M84): gentle minors / clear presentations.
  { episodeId: 'ep_minors_day_entry', focusCaseIds: ['case_chest_pain_patel_ambient', 'case_intox_stan_ambient'] },
  { episodeId: 'ep_anaphylaxis_solo', focusCaseIds: ['case_anaphylaxis_adult_peanut'] },
  { episodeId: 'ep_ahf_solo', focusCaseIds: ['case_acute_heart_failure_ahmed'] },
  { episodeId: 'ep_htn_emergency_solo', focusCaseIds: ['case_htn_emergency_oduya'] },
  { episodeId: 'ep_stroke_solo', focusCaseIds: ['case_stroke_acute_williams'] },
  // Block 2 (M84): mid-difficulty.
  { episodeId: 'ep_overnight_sepsis_solo', focusCaseIds: ['case_sepsis_uti_morrison'] },
  { episodeId: 'ep_ugib_solo', focusCaseIds: ['case_ugib_variceal_kowalski'] },
  { episodeId: 'ep_paracetamol_solo', focusCaseIds: ['case_paracetamol_od_chloe'] },
  { episodeId: 'ep_paeds_dka_solo', focusCaseIds: ['case_paeds_dka_amir'] },
  { episodeId: 'ep_birthday_party', focusCaseIds: ['case_anaphylaxis_adult_peanut', 'case_anaphylaxis_paeds_sibling'] },
  { episodeId: 'ep_seizure_solo', focusCaseIds: ['case_status_epilepticus_priya'] },
  // Block 3 (M84): doubles + late-game anchor-breakers.
  { episodeId: 'ep_hendo_shift', focusCaseIds: ['case_anaphylaxis_adult_peanut', 'case_ectopic_minors_sarah'] },
  { episodeId: 'ep_overnight_metabolic', focusCaseIds: ['case_dka_marcus', 'case_sepsis_uti_morrison'] },
  { episodeId: 'ep_overnight_safety_net', focusCaseIds: ['case_paracetamol_od_chloe', 'case_intox_stan_ambient'] },
  { episodeId: 'ep_doac_double', focusCaseIds: ['case_stroke_acute_williams', 'case_head_injury_doac_brennan'] },
  { episodeId: 'ep_pe_solo', focusCaseIds: ['case_massive_pe_okonkwo'] },
  { episodeId: 'ep_head_injury_doac', focusCaseIds: ['case_head_injury_doac_brennan'] },
  { episodeId: 'ep_dissection_solo', focusCaseIds: ['case_aortic_dissection_okafor'] },
];

export const ROTA_ORDER_IDS: ReadonlyArray<string> = ROTA_ORDER.map((s) => s.episodeId);

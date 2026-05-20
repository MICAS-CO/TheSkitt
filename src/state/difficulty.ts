/**
 * Difficulty tiering (M77) — wires the M74 character grade choice
 * (F1 / F2 / CT1) into actual gameplay rather than just narrative.
 *
 * The design spec (drop #3 audit-fixes-3.jsx ProductionReadinessSection):
 *
 *   tier  speed       ambient  herrings  pause      score
 *   F1    slow        low      1         unlimited  lenient
 *   F2    moderate    low      2         unlimited  lenient
 *   CT1   moderate    medium   2–3       30 s/min   standard
 *   ST3+  real-time   high     3–4       15 s/min   strict
 *   EXAM  real-time   max      4         none       pass/fail
 *
 * M77 wires the two highest-leverage axes (score band thresholds +
 * default trap-hints state) for the 3 grades the character creator
 * exposes. Pause-ratio limits + ambient-herring throttling are
 * intentionally deferred — they require kernel changes that would
 * touch a lot of existing tests.
 */

import { loadCharacter, type CharacterRole } from './character';

export interface TierConfig {
  /** Display label for UI surfaces. */
  label: string;
  /**
   * Band thresholds applied in scoreCase. Lower thresholds give more
   * generous bands; F1/F2 sit at lenient and CT1 at standard.
   */
  thresholds: { excellent: number; good: number };
  /**
   * Whether trap hints should default to ON for this tier when the
   * user hasn't explicitly toggled in Settings yet. F1 starts with
   * training wheels on; CT1 starts with them off.
   */
  trapHintsDefault: boolean;
  /** One-line tier blurb shown in the menu next to the character. */
  blurb: string;
}

export const TIERS: Record<CharacterRole, TierConfig> = {
  F1: {
    label: 'F1 — Foundation Year 1',
    thresholds: { excellent: 80, good: 65 },
    trapHintsDefault: true,
    blurb: 'Lenient scoring · trap hints on · unlimited pause.',
  },
  F2: {
    label: 'F2 — Foundation Year 2',
    thresholds: { excellent: 85, good: 70 },
    trapHintsDefault: true,
    blurb: 'Lenient scoring · trap hints on · unlimited pause.',
  },
  CT1: {
    label: 'CT1 — Core Trainee',
    thresholds: { excellent: 90, good: 75 },
    trapHintsDefault: false,
    blurb: 'Standard scoring · trap hints off · pause budget will land next.',
  },
};

/** Default thresholds (matches the pre-M77 hard-coded values). */
export const DEFAULT_THRESHOLDS = { excellent: 90, good: 75 } as const;

/**
 * Return the active difficulty tier from the character record. Falls
 * back to F1 if no character is on disk (the induction would normally
 * have created one — this is only ever reached in tests or by code
 * that runs before the first-run gate).
 */
export function getActiveTier(): TierConfig {
  const c = loadCharacter();
  if (!c) return TIERS.F1;
  return TIERS[c.role] ?? TIERS.F1;
}

/**
 * Compute the score band for a given percent under the active tier's
 * thresholds. `unsafe` is decided upstream from clinical safety
 * conditions and not affected by tier.
 */
export function bandForPercent(
  percent: number,
  thresholds: { excellent: number; good: number } = DEFAULT_THRESHOLDS,
): 'excellent' | 'good' | 'borderline' {
  if (percent >= thresholds.excellent) return 'excellent';
  if (percent >= thresholds.good) return 'good';
  return 'borderline';
}

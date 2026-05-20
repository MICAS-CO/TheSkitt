/**
 * Difficulty tiering (M77, renamed M81) — wires the character grade
 * choice into actual gameplay rather than just narrative.
 *
 * M81 renamed the grades from the UK-specific F1/F2/CT1 to
 * Intern/SHO/Registrar so the framing reads across the UK, Ireland,
 * Australia, and most Commonwealth/Anglosphere medical systems.
 *
 *   tier        speed       ambient  herrings  pause      score
 *   Intern      slow        low      1         unlimited  lenient
 *   SHO         moderate    low      2         unlimited  lenient
 *   Registrar   moderate    medium   2-3       30 s/min   standard
 *   (post-CCT)  real-time   high     3-4       15 s/min   strict
 *   (Exam)      real-time   max      4         none       pass/fail
 *
 * M77 wires the two highest-leverage axes (score band thresholds +
 * default trap-hints state) for the 3 grades the character creator
 * exposes. Pause-ratio limits + ambient-herring throttling are
 * intentionally deferred — they require kernel changes that would
 * touch a lot of existing tests.
 *
 * Registrar is the default — FRCEM SAQ content sits at CT-grade
 * equivalent, so it's the natural grade for the target audience.
 */

import { loadCharacter, type CharacterRole } from './character';

export interface TierConfig {
  /** Display label for UI surfaces. */
  label: string;
  /**
   * Band thresholds applied in scoreCase. Lower thresholds give more
   * generous bands; Intern/SHO sit at lenient and Registrar at
   * standard.
   */
  thresholds: { excellent: number; good: number };
  /**
   * Whether trap hints should default to ON for this tier when the
   * user hasn't explicitly toggled in Settings yet. Intern starts
   * with training wheels on; Registrar starts with them off.
   */
  trapHintsDefault: boolean;
  /** One-line tier blurb shown in the menu next to the character. */
  blurb: string;
}

export const TIERS: Record<CharacterRole, TierConfig> = {
  Intern: {
    label: 'Intern — first postgraduate year',
    thresholds: { excellent: 80, good: 65 },
    trapHintsDefault: true,
    blurb: 'Lenient scoring · trap hints on · unlimited pause.',
  },
  SHO: {
    label: 'SHO — senior house officer',
    thresholds: { excellent: 85, good: 70 },
    trapHintsDefault: true,
    blurb: 'Lenient scoring · trap hints on · unlimited pause.',
  },
  Registrar: {
    label: 'Registrar — EM specialty trainee',
    thresholds: { excellent: 90, good: 75 },
    trapHintsDefault: false,
    blurb: 'Standard scoring · trap hints off · pause budget will land next.',
  },
};

/** Default thresholds (matches the pre-M77 hard-coded values). */
export const DEFAULT_THRESHOLDS = { excellent: 90, good: 75 } as const;

/**
 * Return the active difficulty tier from the character record. Falls
 * back to Registrar if no character is on disk (the induction would
 * normally have created one — this is only ever reached in tests or
 * by code that runs before the first-run gate).
 */
export function getActiveTier(): TierConfig {
  const c = loadCharacter();
  if (!c) return TIERS.Registrar;
  return TIERS[c.role] ?? TIERS.Registrar;
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

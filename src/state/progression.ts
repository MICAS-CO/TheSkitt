/**
 * Cross-shift progression (M16) — XP, SLO mastery, perks.
 *
 * Persisted in localStorage. Awarded at end-of-case from the existing
 * scoreCase output. Cheap, deterministic, no schema change.
 */

import type { ScoreReport } from './sim';
import type { CaseT } from '../content/schema';

export interface Progression {
  v: 1;
  /** Total XP across all shifts. */
  totalXp: number;
  /** XP banked per RCEM SLO (1–12). */
  perSloXp: Record<number, number>;
  /** Cases the player has completed (deduped by case_id). */
  caseIdsCompleted: string[];
  /** Perks the player has unlocked (perk id list). */
  unlockedPerks: string[];
  /** ISO timestamp of last update. */
  updatedAt: string;
}

const STORAGE_KEY = 'theSkitt.progression.v1';

export function emptyProgression(): Progression {
  return {
    v: 1,
    totalXp: 0,
    perSloXp: {},
    caseIdsCompleted: [],
    unlockedPerks: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Quick check whether the player has unlocked a given perk. Reads
 * localStorage; safe in private-mode (returns false).
 */
export function hasPerk(id: string): boolean {
  try {
    return loadProgression().unlockedPerks.includes(id);
  } catch {
    return false;
  }
}

export function loadProgression(): Progression {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgression();
    const data = JSON.parse(raw) as Progression;
    if (data?.v !== 1) return emptyProgression();
    return data;
  } catch {
    return emptyProgression();
  }
}

export function saveProgression(p: Progression): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore (private mode)
  }
}

export function resetProgression(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── XP awarding ────────────────────────────────────────────────────────────

export interface PerCaseXp {
  caseId: string;
  caseTitle: string;
  xp: number;
  slos: number[];
  breakdown: { label: string; xp: number }[];
}

/**
 * Pure: compute the XP awarded for a single completed case.
 * Award model (out of 100 + bonuses):
 *   - mustDo:          (mustDoDone / mustDoTotal) × 50
 *   - working dx:      +20 if correct
 *   - disposition:     +20 if appropriate
 *   - excellent band:  +10 bonus
 *   - traps avoided:   +5 per trap avoided
 *   - safety penalty:  −20 per trap picked
 *   - first-time case: +25 first-completion bonus
 */
export function computeCaseXp(
  cs: { caseId: string; data: CaseT },
  score: ScoreReport,
  alreadyCompleted: boolean,
): PerCaseXp {
  const breakdown: PerCaseXp['breakdown'] = [];
  const mustDoFraction = score.mustDoTotal > 0 ? score.mustDoDone / score.mustDoTotal : 1;
  const mustDoXp = Math.round(50 * mustDoFraction);
  breakdown.push({ label: `must-do actions (${score.mustDoDone}/${score.mustDoTotal})`, xp: mustDoXp });
  if (score.workingDxCorrect) breakdown.push({ label: 'correct working diagnosis', xp: 20 });
  if (score.dispositionCorrect) breakdown.push({ label: 'appropriate disposition', xp: 20 });
  if (score.band === 'excellent') breakdown.push({ label: 'excellent band bonus', xp: 10 });
  const trapsTotal = cs.data.management.filter((m) => m.must_not_do).length;
  const trapsAvoided = trapsTotal - score.mustNotDoChosen;
  if (trapsAvoided > 0) {
    breakdown.push({ label: `traps avoided (${trapsAvoided})`, xp: trapsAvoided * 5 });
  }
  if (score.mustNotDoChosen > 0) {
    breakdown.push({
      label: `safety penalty (${score.mustNotDoChosen} traps caught)`,
      xp: -20 * score.mustNotDoChosen,
    });
  }
  if (!alreadyCompleted) breakdown.push({ label: 'first-completion bonus', xp: 25 });

  const xp = Math.max(0, breakdown.reduce((acc, b) => acc + b.xp, 0));
  return { caseId: cs.caseId, caseTitle: cs.data.title, xp, slos: cs.data.slos, breakdown };
}

/** Pure: fold a per-case award into a Progression snapshot, returning the new snapshot. */
export function applyCaseAward(p: Progression, award: PerCaseXp): Progression {
  const perSloXp = { ...p.perSloXp };
  for (const slo of award.slos) {
    perSloXp[slo] = (perSloXp[slo] ?? 0) + Math.round(award.xp / award.slos.length);
  }
  const caseIdsCompleted = p.caseIdsCompleted.includes(award.caseId)
    ? p.caseIdsCompleted
    : [...p.caseIdsCompleted, award.caseId];
  const next: Progression = {
    v: 1,
    totalXp: p.totalXp + award.xp,
    perSloXp,
    caseIdsCompleted,
    unlockedPerks: p.unlockedPerks,
    updatedAt: new Date().toISOString(),
  };
  // Re-evaluate perks against the new totals.
  next.unlockedPerks = PERKS.filter((perk) => perk.check(next)).map((p) => p.id);
  return next;
}

// ─── Perks ──────────────────────────────────────────────────────────────────

export interface Perk {
  id: string;
  title: string;
  description: string;
  /** True when the player has met the unlock condition. */
  check: (p: Progression) => boolean;
}

const SLO_LABELS: Record<number, string> = {
  1: 'SLO 1 — Complex stable patient',
  2: 'SLO 2 — Adult mental health crisis',
  3: 'SLO 3 — Resuscitation',
  4: 'SLO 4 — Major trauma',
  5: 'SLO 5 — Acute child',
  6: 'SLO 6 — Acutely injured child',
  7: 'SLO 7 — Mental health (child)',
  8: 'SLO 8 — Procedural sedation',
  9: 'SLO 9 — Procedures',
  10: 'SLO 10 — Leadership',
  11: 'SLO 11 — Education + supervision',
  12: 'SLO 12 — Research / quality improvement',
};

export const PERKS: Perk[] = [
  {
    id: 'perk_first_case',
    title: 'First admission',
    description: 'Complete your first case.',
    check: (p) => p.caseIdsCompleted.length >= 1,
  },
  {
    id: 'perk_resus_reflex',
    title: 'Resus reflexes',
    description:
      'Bank 200 XP in SLO 3 (Resuscitation). In play: deterioration timers add a +1 min grace warning before going critical, giving you a wider tone shift.',
    check: (p) => (p.perSloXp[3] ?? 0) >= 200,
  },
  {
    id: 'perk_complex_stable',
    title: 'Stable + complex',
    description: 'Bank 200 XP in SLO 1 (complex stable patient).',
    check: (p) => (p.perSloXp[1] ?? 0) >= 200,
  },
  {
    id: 'perk_trap_aware',
    title: 'Trap-aware',
    description:
      'Complete 5 different cases. In play: trap hints are forced on across all encounters — must_not_do actions flag themselves on the management chart even if you disabled trap hints in Settings.',
    check: (p) => p.caseIdsCompleted.length >= 5,
  },
  {
    id: 'perk_ten_cases',
    title: 'Acting senior',
    description: 'Complete 10 different cases.',
    check: (p) => p.caseIdsCompleted.length >= 10,
  },
  {
    id: 'perk_consultant',
    title: 'Acting EPIC',
    description:
      'Complete 15 different cases. The Emergency Physician in Charge of the floor.',
    check: (p) => p.caseIdsCompleted.length >= 15,
  },
  {
    id: 'perk_thousand_xp',
    title: 'Four-figure clinician',
    description: 'Bank 1000 total XP.',
    check: (p) => p.totalXp >= 1000,
  },
];

export function sloLabel(slo: number): string {
  return SLO_LABELS[slo] ?? `SLO ${slo}`;
}

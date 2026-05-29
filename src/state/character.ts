/**
 * Character + induction state (M74, renamed M81).
 *
 * Tiny localStorage-backed character record + the first-run gate
 * that drives the Skittstown ED induction tour.
 *
 * M81: training grades renamed from the UK-specific F1/F2/CT1 to
 * Intern/SHO/Registrar, which read in the UK, Ireland, Australia, and
 * most Commonwealth/Anglosphere medical systems. Pre-M81 character
 * records on localStorage are migrated on load.
 */

const STORAGE_KEY = 'theSkitt.character.v1';

export type CharacterRole = 'Intern' | 'SHO' | 'Registrar';

/** Migration map for pre-M81 saves where role was F1/F2/CT1. */
const LEGACY_ROLE_MAP: Record<string, CharacterRole> = {
  F1: 'Intern',
  F2: 'SHO',
  CT1: 'Registrar',
};

const VALID_ROLES: ReadonlyArray<CharacterRole> = ['Intern', 'SHO', 'Registrar'];

export interface Character {
  /** First name as the player chose. Used in NPC voice lines. */
  firstName: string;
  /** Last name. Used on the chart / consultant memo signature. */
  lastName: string;
  /** Training grade — sets the narrative framing and the difficulty
   *  tier (see state/difficulty.ts). */
  role: CharacterRole;
  /** True once the induction has been completed (or skipped). */
  inducted: boolean;
  /** ISO timestamp of character creation. */
  createdIso: string;
}

const FALLBACK: Character = {
  firstName: 'Sam',
  lastName: 'Carter',
  role: 'Registrar',
  inducted: false,
  createdIso: new Date(0).toISOString(),
};

function normaliseRole(raw: unknown): CharacterRole {
  if (typeof raw === 'string') {
    if (VALID_ROLES.includes(raw as CharacterRole)) return raw as CharacterRole;
    if (raw in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[raw]!;
  }
  // Corrupted / unknown role on an existing save: default to the
  // lenient end of the ladder. The constructor-level FALLBACK uses
  // Registrar because that's the right entry tier for a NEW player
  // on the FRCEM target audience — but a player with a corrupted
  // role string shouldn't be silently promoted from (probably) F1
  // to the strictest tier. Match the pre-M81 'fall back to easy'
  // behaviour for legacy/corrupt input.
  return 'Intern';
}

export function loadCharacter(): Character | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj.firstName === 'string' &&
      typeof obj.lastName === 'string'
    ) {
      return {
        firstName: obj.firstName,
        lastName: obj.lastName,
        role: normaliseRole(obj.role),
        inducted: obj.inducted === true,
        createdIso: typeof obj.createdIso === 'string' ? obj.createdIso : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCharacter(c: Character): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    // ignore quota
  }
}

export function clearCharacter(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getOrCreateCharacter(): Character {
  return loadCharacter() ?? { ...FALLBACK, createdIso: new Date().toISOString() };
}

export function characterDisplayName(c: Character): string {
  return `Dr ${c.firstName} ${c.lastName}`;
}

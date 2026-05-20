/**
 * Character + induction state (M74).
 *
 * Tiny localStorage-backed character record + the first-run gate
 * that drives the Skittstown ED induction tour.
 */

const STORAGE_KEY = 'theSkitt.character.v1';

export type CharacterRole = 'F1' | 'F2' | 'CT1';

export interface Character {
  /** First name as the player chose. Used in NPC voice lines. */
  firstName: string;
  /** Last name. Used on the chart / consultant memo signature. */
  lastName: string;
  /** Training grade — sets the narrative framing (and, later, the
   *  difficulty tier if/when authored). */
  role: CharacterRole;
  /** True once the induction has been completed (or skipped). */
  inducted: boolean;
  /** ISO timestamp of character creation. */
  createdIso: string;
}

const FALLBACK: Character = {
  firstName: 'Sam',
  lastName: 'Carter',
  role: 'F1',
  inducted: false,
  createdIso: new Date(0).toISOString(),
};

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
        role: ['F1', 'F2', 'CT1'].includes(obj.role) ? obj.role : 'F1',
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

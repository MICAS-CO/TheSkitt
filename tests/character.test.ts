import { describe, expect, it, beforeEach } from 'vitest';
import {
  characterDisplayName,
  clearCharacter,
  loadCharacter,
  saveCharacter,
} from '../src/state/character';

describe('M74/M81 — character module', () => {
  beforeEach(() => {
    clearCharacter();
  });

  it('returns null when nothing is saved', () => {
    expect(loadCharacter()).toBeNull();
  });

  it('round-trips a freshly-created character', () => {
    const created = new Date('2026-05-20T08:00:00Z').toISOString();
    const c = {
      firstName: 'Hannah',
      lastName: 'Kovač',
      role: 'Intern' as const,
      inducted: false,
      createdIso: created,
    };
    saveCharacter(c);
    expect(loadCharacter()).toEqual(c);
  });

  it('coerces unknown role to Intern on restore (lenient default for corrupted saves)', () => {
    window.localStorage.setItem(
      'theSkitt.character.v1',
      JSON.stringify({
        firstName: 'Test',
        lastName: 'Doctor',
        role: 'CONSULTANT', // not a valid role
        inducted: true,
        createdIso: '2026-01-01T00:00:00.000Z',
      }),
    );
    expect(loadCharacter()?.role).toBe('Intern');
  });

  it('characterDisplayName prepends Dr', () => {
    expect(
      characterDisplayName({
        firstName: 'Hannah',
        lastName: 'Kovač',
        role: 'Registrar',
        inducted: true,
        createdIso: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe('Dr Hannah Kovač');
  });

  it('clearCharacter removes the record', () => {
    saveCharacter({
      firstName: 'Test',
      lastName: 'Doctor',
      role: 'SHO',
      inducted: true,
      createdIso: '2026-01-01T00:00:00.000Z',
    });
    expect(loadCharacter()).not.toBeNull();
    clearCharacter();
    expect(loadCharacter()).toBeNull();
  });

  it('M81: migrates pre-M81 F1/F2/CT1 role values to Intern/SHO/Registrar', () => {
    for (const [legacy, expected] of [
      ['F1', 'Intern'],
      ['F2', 'SHO'],
      ['CT1', 'Registrar'],
    ] as const) {
      window.localStorage.setItem(
        'theSkitt.character.v1',
        JSON.stringify({
          firstName: 'Migrated',
          lastName: 'Save',
          role: legacy,
          inducted: true,
          createdIso: '2026-01-01T00:00:00.000Z',
        }),
      );
      expect(loadCharacter()?.role).toBe(expected);
    }
  });
});

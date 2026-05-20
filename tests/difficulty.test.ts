import { describe, expect, it, beforeEach } from 'vitest';
import { bandForPercent, getActiveTier, TIERS } from '../src/state/difficulty';
import { clearCharacter, saveCharacter, loadCharacter } from '../src/state/character';

describe('M77/M81 — difficulty tiering', () => {
  beforeEach(() => {
    clearCharacter();
  });

  it('TIERS has Intern / SHO / Registrar with ascending thresholds', () => {
    expect(TIERS.Intern.thresholds.excellent).toBe(80);
    expect(TIERS.SHO.thresholds.excellent).toBe(85);
    expect(TIERS.Registrar.thresholds.excellent).toBe(90);
    expect(TIERS.Intern.thresholds.good).toBeLessThan(TIERS.Registrar.thresholds.good);
  });

  it('Intern/SHO default trap hints ON; Registrar OFF', () => {
    expect(TIERS.Intern.trapHintsDefault).toBe(true);
    expect(TIERS.SHO.trapHintsDefault).toBe(true);
    expect(TIERS.Registrar.trapHintsDefault).toBe(false);
  });

  it('bandForPercent applies the thresholds', () => {
    // Registrar standard: 90/75
    expect(bandForPercent(92, TIERS.Registrar.thresholds)).toBe('excellent');
    expect(bandForPercent(80, TIERS.Registrar.thresholds)).toBe('good');
    expect(bandForPercent(60, TIERS.Registrar.thresholds)).toBe('borderline');
    // Intern lenient: 80/65
    expect(bandForPercent(82, TIERS.Intern.thresholds)).toBe('excellent');
    expect(bandForPercent(70, TIERS.Intern.thresholds)).toBe('good');
    expect(bandForPercent(60, TIERS.Intern.thresholds)).toBe('borderline');
    // Same percent (82) bands differently per tier — the point of the system.
    expect(bandForPercent(82, TIERS.Intern.thresholds)).toBe('excellent');
    expect(bandForPercent(82, TIERS.Registrar.thresholds)).toBe('good');
  });

  it('getActiveTier reads the saved character', () => {
    saveCharacter({
      firstName: 'Hannah',
      lastName: 'Kovač',
      role: 'Intern',
      inducted: true,
      createdIso: '2026-01-01T00:00:00.000Z',
    });
    expect(getActiveTier().label).toContain('Intern');
    saveCharacter({
      firstName: 'Hannah',
      lastName: 'Kovač',
      role: 'Registrar',
      inducted: true,
      createdIso: '2026-01-01T00:00:00.000Z',
    });
    expect(getActiveTier().label).toContain('Registrar');
  });

  it('getActiveTier falls back to Registrar when no character is on disk', () => {
    clearCharacter();
    expect(getActiveTier().label).toBe(TIERS.Registrar.label);
  });

  it('M81: pre-M81 character saves with role F1/F2/CT1 migrate to Intern/SHO/Registrar', () => {
    // Simulate a pre-M81 save written directly to localStorage with the
    // old enum value. loadCharacter() must normalise it.
    window.localStorage.setItem(
      'theSkitt.character.v1',
      JSON.stringify({
        firstName: 'Old',
        lastName: 'Save',
        role: 'F1',
        inducted: true,
        createdIso: '2026-01-01T00:00:00.000Z',
      }),
    );
    expect(loadCharacter()?.role).toBe('Intern');

    window.localStorage.setItem(
      'theSkitt.character.v1',
      JSON.stringify({
        firstName: 'Old',
        lastName: 'Save',
        role: 'CT1',
        inducted: true,
        createdIso: '2026-01-01T00:00:00.000Z',
      }),
    );
    expect(loadCharacter()?.role).toBe('Registrar');
  });
});

import { describe, expect, it, beforeEach } from 'vitest';
import { bandForPercent, getActiveTier, TIERS } from '../src/state/difficulty';
import { clearCharacter, saveCharacter } from '../src/state/character';

describe('M77 — difficulty tiering', () => {
  beforeEach(() => {
    clearCharacter();
  });

  it('TIERS has F1 / F2 / CT1 with ascending thresholds', () => {
    expect(TIERS.F1.thresholds.excellent).toBe(80);
    expect(TIERS.F2.thresholds.excellent).toBe(85);
    expect(TIERS.CT1.thresholds.excellent).toBe(90);
    expect(TIERS.F1.thresholds.good).toBeLessThan(TIERS.CT1.thresholds.good);
  });

  it('F1/F2 default trap hints ON; CT1 OFF', () => {
    expect(TIERS.F1.trapHintsDefault).toBe(true);
    expect(TIERS.F2.trapHintsDefault).toBe(true);
    expect(TIERS.CT1.trapHintsDefault).toBe(false);
  });

  it('bandForPercent applies the thresholds', () => {
    // CT1 standard: 90/75
    expect(bandForPercent(92, TIERS.CT1.thresholds)).toBe('excellent');
    expect(bandForPercent(80, TIERS.CT1.thresholds)).toBe('good');
    expect(bandForPercent(60, TIERS.CT1.thresholds)).toBe('borderline');
    // F1 lenient: 80/65
    expect(bandForPercent(82, TIERS.F1.thresholds)).toBe('excellent');
    expect(bandForPercent(70, TIERS.F1.thresholds)).toBe('good');
    expect(bandForPercent(60, TIERS.F1.thresholds)).toBe('borderline');
    // Same percent (82) bands differently per tier — the point of the system.
    expect(bandForPercent(82, TIERS.F1.thresholds)).toBe('excellent');
    expect(bandForPercent(82, TIERS.CT1.thresholds)).toBe('good');
  });

  it('getActiveTier reads the saved character', () => {
    saveCharacter({
      firstName: 'Hannah',
      lastName: 'Kovač',
      role: 'F1',
      inducted: true,
      createdIso: '2026-01-01T00:00:00.000Z',
    });
    expect(getActiveTier().label).toContain('F1');
    saveCharacter({
      firstName: 'Hannah',
      lastName: 'Kovač',
      role: 'CT1',
      inducted: true,
      createdIso: '2026-01-01T00:00:00.000Z',
    });
    expect(getActiveTier().label).toContain('CT1');
  });

  it('getActiveTier falls back to F1 when no character is on disk', () => {
    clearCharacter();
    expect(getActiveTier().label).toBe(TIERS.F1.label);
  });
});

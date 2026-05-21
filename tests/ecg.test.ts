import { describe, expect, it } from 'vitest';
import { ECG_BANK, pickTodaysChallenge } from '../src/content/ecg-challenges';

describe('M15 — daily ECG challenge bank', () => {
  it('every ECG challenge has 2–4 steps', () => {
    for (const e of ECG_BANK) {
      expect(e.steps.length, `${e.id} has wrong step count`).toBeGreaterThanOrEqual(2);
      expect(e.steps.length, `${e.id} has wrong step count`).toBeLessThanOrEqual(4);
    }
  });

  it('every step has a valid correctIndex against its options', () => {
    for (const e of ECG_BANK) {
      for (const s of e.steps) {
        expect(s.correctIndex, `${e.id} → ${s.prompt}`).toBeGreaterThanOrEqual(0);
        expect(s.correctIndex).toBeLessThan(s.options.length);
      }
    }
  });

  it('pickTodaysChallenge returns a stable selection per day', () => {
    const today = new Date('2026-06-01T12:00:00Z');
    const a = pickTodaysChallenge(today);
    const b = pickTodaysChallenge(today);
    expect(a.id).toBe(b.id);
  });

  it('different days produce different challenges within a week of bank size', () => {
    const day1 = pickTodaysChallenge(new Date('2026-06-01T12:00:00Z'));
    const day2 = pickTodaysChallenge(new Date('2026-06-02T12:00:00Z'));
    // With ≥2 challenges in the bank, two consecutive days should differ.
    if (ECG_BANK.length >= 2) {
      expect(day1.id).not.toBe(day2.id);
    }
  });

  it('every challenge cites at least one authoritative source', () => {
    for (const e of ECG_BANK) {
      expect(e.sources.length, `${e.id} has no sources`).toBeGreaterThan(0);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { ECG_BANK } from '../src/content/ecg-challenges';

describe('M47 — ECG bank wiring inside encounters', () => {
  it('every bank entry exposes a multi-step drill (>= 2 steps)', () => {
    for (const ecg of ECG_BANK) {
      expect(ecg.steps.length, `${ecg.id} step count`).toBeGreaterThanOrEqual(2);
      for (const step of ecg.steps) {
        expect(step.options.length, `${ecg.id} options`).toBeGreaterThanOrEqual(2);
        expect(step.correctIndex).toBeGreaterThanOrEqual(0);
        expect(step.correctIndex).toBeLessThan(step.options.length);
        expect(step.prompt.length).toBeGreaterThan(0);
        expect(step.rationale.length).toBeGreaterThan(0);
      }
    }
  });

  it('all ecg_challenge_id values referenced in cases resolve to a bank entry', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { parse } = await import('yaml');
    const { Case } = await import('../src/content/schema');
    const ids = new Set(ECG_BANK.map((e) => e.id));
    const dir = join(process.cwd(), 'content/cases');
    const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'));
    let wired = 0;
    for (const f of files) {
      const c = Case.parse(parse(readFileSync(join(dir, f), 'utf8')));
      for (const ix of c.investigations) {
        if (ix.ecg_challenge_id) {
          expect(ids, `${f}: ${ix.ecg_challenge_id}`).toContain(ix.ecg_challenge_id);
          wired++;
        }
      }
    }
    // Floor for the milestone: at least 3 cases wired (Patel, Okonkwo, Ahmed).
    expect(wired).toBeGreaterThanOrEqual(3);
  });

  it('the new AF-with-RVR-in-pulmonary-oedema bank entry is callable', () => {
    const ecg = ECG_BANK.find((e) => e.id === 'ecg_015_af_rvr_pulmonary_oedema');
    expect(ecg).toBeDefined();
    expect(ecg!.steps).toHaveLength(3);
    // Step 1 correct option must be the AF entry.
    expect(ecg!.steps[0]!.options[ecg!.steps[0]!.correctIndex]).toMatch(/atrial fibrillation/i);
  });
});

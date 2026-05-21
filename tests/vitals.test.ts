import { describe, expect, it } from 'vitest';
import { deriveVitals, news2 } from '../src/sim/vitals';

describe('NEWS2 scoring (RCP May 2017)', () => {
  it('a normal patient scores 0', () => {
    const v = { hr: 70, rr: 16, spo2: 98, on_o2: false, bp_sys: 120, bp_dia: 70, gcs: 15, temp_c: 36.6 };
    expect(news2(v).total).toBe(0);
  });

  it('SpO2 91 + RR 25 + HR 135 + BP 88 + GCS 13 + temp 39.5 scores high', () => {
    const v = { hr: 135, rr: 25, spo2: 91, on_o2: false, bp_sys: 88, bp_dia: 50, gcs: 13, temp_c: 39.5 };
    const score = news2(v);
    // RR 25 = 3, SpO2 91 = 3, HR 135 = 3, BP 88 = 3, GCS<15 = 3, Temp 39.5 = 2
    expect(score.rr).toBe(3);
    expect(score.spo2).toBe(3);
    expect(score.hr).toBe(3);
    expect(score.bp_sys).toBe(3);
    expect(score.acvpu).toBe(3);
    expect(score.temp).toBe(2);
    expect(score.total).toBe(17);
  });

  it('supplemental oxygen adds 2', () => {
    const v = { hr: 70, rr: 16, spo2: 98, on_o2: true, bp_sys: 120, bp_dia: 70, gcs: 15, temp_c: 36.6 };
    expect(news2(v).total).toBe(2);
  });

  it('SpO2 95 alone scores 1', () => {
    const v = { hr: 70, rr: 16, spo2: 95, on_o2: false, bp_sys: 120, bp_dia: 70, gcs: 15, temp_c: 36.6 };
    expect(news2(v).total).toBe(1);
  });
});

describe('content vitals discipline', () => {
  // Lazy import to avoid loading content in the basic NEWS2 tests.
  it('every authored case carries baseline vitals', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { parse } = await import('yaml');
    const { Case } = await import('../src/content/schema');

    const root = process.cwd();
    const files = readdirSync(join(root, 'content/cases')).filter((f) => f.endsWith('.yaml'));
    for (const f of files) {
      const c = Case.parse(parse(readFileSync(join(root, 'content/cases', f), 'utf8')));
      expect(c.vitals, `${c.id} has no vitals authored`).toBeDefined();
      expect(c.vitals?.baseline.hr, `${c.id} baseline missing hr`).toBeDefined();
      expect(c.vitals?.baseline.rr, `${c.id} baseline missing rr`).toBeDefined();
      expect(c.vitals?.baseline.spo2, `${c.id} baseline missing spo2`).toBeDefined();
      expect(c.vitals?.baseline.bp_sys, `${c.id} baseline missing bp_sys`).toBeDefined();
      expect(c.vitals?.baseline.gcs, `${c.id} baseline missing gcs`).toBeDefined();
    }
  });

  it('every deteriorating-state vitals lands in NEWS2 AMBER+ (total ≥ 5)', async () => {
    // RCP NEWS2 banding: 0-4 LOW, 5-6 MEDIUM (AMBER — urgent review),
    // 7+ HIGH (RED — immediate response). M97 audit: every case
    // explicitly kernel-flagged as `deteriorating` should produce at
    // least a MEDIUM-band NEWS2, otherwise the simulation lies to the
    // clinical reasoning — the state machine says "deteriorating" but
    // the vitals strip says "go back to your cuppa". The previous bar
    // (total ≥ 3 OR maxParam ≥ 3) let `case_stroke_acute_williams`
    // pass at NEWS2=4 GREEN because GCS-14 alone tripped maxParam.
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { parse } = await import('yaml');
    const { Case } = await import('../src/content/schema');

    const root = process.cwd();
    const files = readdirSync(join(root, 'content/cases')).filter((f) => f.endsWith('.yaml'));
    for (const f of files) {
      const c = Case.parse(parse(readFileSync(join(root, 'content/cases', f), 'utf8')));
      if (!c.vitals?.deteriorating) continue;
      const v = deriveVitals('deteriorating', c.vitals);
      const s = news2(v);
      expect(
        s.total,
        `${c.id} deteriorating: NEWS2 total ${s.total} — below the AMBER (5+) bar that flags genuine clinical concern`,
      ).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('deriveVitals state layering', () => {
  it('uses generic fallback when no authored vitals', () => {
    const v = deriveVitals('stable', undefined);
    expect(v.hr).toBeGreaterThan(0);
    expect(v.bp_sys).toBeGreaterThan(0);
  });

  it('uses baseline when state is stable and vitals are authored', () => {
    const v = deriveVitals('stable', {
      baseline: { hr: 80, rr: 14, spo2: 98, bp_sys: 120, bp_dia: 70, gcs: 15, temp_c: 36.6 },
      deteriorating: { hr: 130, bp_sys: 80 },
    });
    expect(v.hr).toBe(80);
    expect(v.bp_sys).toBe(120);
  });

  it('layers state override on top of baseline when state is deteriorating', () => {
    const v = deriveVitals('deteriorating', {
      baseline: { hr: 80, rr: 14, spo2: 98, bp_sys: 120, bp_dia: 70, gcs: 15, temp_c: 36.6 },
      deteriorating: { hr: 130, bp_sys: 80 },
    });
    expect(v.hr).toBe(130);
    expect(v.bp_sys).toBe(80);
    // Unchanged baseline values pass through.
    expect(v.spo2).toBe(98);
    expect(v.gcs).toBe(15);
  });

  it('zeroes vitals on arrested state when no authored override', () => {
    const v = deriveVitals('arrested', {
      baseline: { hr: 80, bp_sys: 120 },
    });
    expect(v.hr).toBe(0);
    expect(v.bp_sys).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { Case, type CaseT } from '../src/content/schema';

const ROOT = process.cwd();

/**
 * Enumerate at test-time, not module load, so we don't race with the
 * new-scripts test that creates and removes a temp case file in the
 * content directory.
 */
function loadCases(): CaseT[] {
  return readdirSync(join(ROOT, 'content/cases'))
    .filter((f) => f.endsWith('.yaml') && !f.includes('scratch'))
    .map((f) => {
      try {
        return Case.parse(parse(readFileSync(join(ROOT, 'content/cases', f), 'utf8')));
      } catch {
        return null;
      }
    })
    .filter((c): c is CaseT => c !== null);
}

describe('M13 — resus mode content discipline', () => {
  const cases = loadCases();
  it('cases tagged with a resus_protocol have at least 3 management actions with resus_letter', () => {
    for (const c of cases) {
      if (!c.resus_protocol) continue;
      const tagged = c.management.filter((m) => m.resus_letter !== undefined);
      expect(
        tagged.length,
        `${c.id} (resus_protocol=${c.resus_protocol}) only tags ${tagged.length} actions with resus_letter; expected ≥ 3`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('any case with resus_protocol carries baseline vitals (sanity for the panel display)', () => {
    for (const c of cases) {
      if (!c.resus_protocol) continue;
      expect(c.vitals, `${c.id} resus-tagged but has no vitals`).toBeDefined();
    }
  });

  it('at least one case per resus_protocol value is present in the content library', () => {
    const tagged = new Set(cases.map((c) => c.resus_protocol).filter(Boolean));
    expect(tagged.has('als_adult')).toBe(true);
    expect(tagged.has('apls_paeds')).toBe(true);
  });
});

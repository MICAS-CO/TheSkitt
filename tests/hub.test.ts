import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case } from '../src/content/schema';

const ROOT = process.cwd();
const CASES_DIR = join(ROOT, 'content/cases');

describe('Hub view — bay assignments', () => {
  // Exclude transient test scratch files and CLI-generated skeleton drafts —
  // the rule applies to authored cases only.
  const files = readdirSync(CASES_DIR)
    .filter((f) => f.endsWith('.yaml'))
    .filter((f) => !f.includes('scratch') && !f.includes('_draft'));

  it.each(files)('case %s has a bay assignment (required for hub view)', (file) => {
    const raw = readFileSync(join(CASES_DIR, file), 'utf8');
    const parsed = Case.parse(parseYaml(raw));
    expect(parsed.bay).toBeDefined();
    expect(['resus', 'majors', 'minors', 'paeds', 'relatives', 'ambulatory', 'triage']).toContain(
      parsed.bay!,
    );
  });

  it('every authored case maps to exactly one bay', () => {
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const raw = readFileSync(join(CASES_DIR, file), 'utf8');
      const parsed = Case.parse(parseYaml(raw));
      expect(typeof parsed.bay).toBe('string');
    }
  });
});

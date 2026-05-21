import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { Case } from '../src/content/schema';

describe('M56 — disposition epilogues', () => {
  it('every disposition_option carries an epilogue', () => {
    const dir = join(process.cwd(), 'content/cases');
    const files = readdirSync(dir).filter(
      (f) => f.endsWith('.yaml') && !f.includes('scratch') && !f.includes('draft'),
    );
    const missing: string[] = [];
    let total = 0;
    for (const f of files) {
      const c = Case.parse(parse(readFileSync(join(dir, f), 'utf8')));
      for (const d of c.disposition_options) {
        total++;
        if (!d.epilogue || d.epilogue.trim().length === 0) {
          missing.push(`${c.id} :: ${d.label}`);
        }
      }
    }
    if (missing.length) {
      throw new Error(
        `Epilogue missing on ${missing.length}/${total} disposition options:\n  ${missing.join('\n  ')}`,
      );
    }
    // Floor: we expect ≥ 50 disposition options in the catalogue.
    expect(total).toBeGreaterThanOrEqual(50);
  });
});

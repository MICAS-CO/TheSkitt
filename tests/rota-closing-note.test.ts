/**
 * M90 (Braintrust 10 round-2) — narrative-thread closing note at the
 * final-keystone debrief.
 *
 * Tests the component's conditional rendering + voice variants. The
 * component itself is a small piece of UI; the harder pedagogical
 * question (does the closing note land?) is reviewer-judged, not
 * unit-testable.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case } from '../src/content/schema';

const ROOT = process.cwd();

describe('M90 — Okafor case NTS-themed pearls + pitfalls', () => {
  const okafor = Case.parse(
    parseYaml(
      readFileSync(join(ROOT, 'content/cases/case_aortic_dissection_okafor.yaml'), 'utf8'),
    ),
  );

  it('case includes the M90 CRM pearl about speaking up across hierarchies', () => {
    expect(okafor.pearls.some((p) => /crew resource management|crm/i.test(p))).toBe(true);
    expect(okafor.pearls.some((p) => /speak up|across hierarchies/i.test(p))).toBe(true);
  });

  it('case includes the swiss-cheese / Just Culture NTS pearls', () => {
    expect(okafor.pearls.some((p) => /swiss-cheese|james reason/i.test(p))).toBe(true);
    expect(okafor.pearls.some((p) => /just culture/i.test(p))).toBe(true);
  });

  it('case includes the deferring-to-the-team NTS pitfall', () => {
    expect(okafor.pitfalls.some((p) => /deferring|team that owns/i.test(p))).toBe(true);
  });

  it('case includes the personal-vs-system-failure debrief pitfall', () => {
    expect(
      okafor.pitfalls.some((p) => /personal cognitive failure|system.*failure/i.test(p)),
    ).toBe(true);
  });
});

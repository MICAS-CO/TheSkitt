import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { Case } from '../src/content/schema';
import {
  PROP_SPRITES,
  propFrameToSvg,
  propIdForAction,
} from '../src/style/propSprites';

describe('M45 — encounter prop sprites', () => {
  it('all props are 16×16 paint-by-string grids', () => {
    for (const [id, rows] of Object.entries(PROP_SPRITES)) {
      expect(rows.length, `${id} rows`).toBe(16);
      for (const row of rows) {
        expect(row.length, `${id} row width`).toBe(16);
      }
    }
  });

  it('propFrameToSvg returns crisp-edge SVG with at least one rect', () => {
    const svg = propFrameToSvg(PROP_SPRITES.syringe_adrenaline!);
    expect(svg).toMatch(/^<svg/);
    expect(svg).toMatch(/shape-rendering="crispEdges"/);
    expect(svg).toMatch(/<rect /);
  });

  it('propIdForAction picks the most specific sprite per action name', () => {
    const beth = Case.parse(
      parse(
        readFileSync(
          join(process.cwd(), 'content/cases/case_anaphylaxis_adult_peanut.yaml'),
          'utf8',
        ),
      ),
    );
    // Find Beth's IM adrenaline action.
    const adrenaline = beth.management.find((m) => /adrenaline/i.test(m.name));
    expect(adrenaline).toBeDefined();
    expect(propIdForAction(adrenaline!)).toBe('syringe_adrenaline');
  });

  it('propIdForAction falls back to category when no name regex hits', () => {
    const fake = {
      id: 'mx_test',
      name: 'Some generic procedure',
      category: 'drug' as const,
      detail: '',
      must_do: false,
      must_not_do: false,
    };
    expect(propIdForAction(fake)).toBe('drug_chart');
    expect(propIdForAction({ ...fake, category: 'fluid' as const })).toBe('iv_bag_saline');
    expect(propIdForAction({ ...fake, category: 'monitoring' as const })).toBe('ecg_dots');
    expect(propIdForAction({ ...fake, category: 'escalation' as const })).toBe('nurse_call_btn');
    expect(propIdForAction({ ...fake, category: 'safety_net' as const })).toBeNull();
  });
});

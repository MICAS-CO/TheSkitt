/**
 * M82 — Content-side consistency check.
 *
 * ROTA_ORDER inlines each shift's focus_cases for the rota migration
 * scan and the MenuView render — so we don't pay the cost of parsing
 * 18 episode YAMLs at startup. The risk is drift: an author edits an
 * episode YAML's focus_cases without updating ROTA_ORDER, and the
 * migration logic silently behaves incorrectly. This test walks every
 * ROTA_ORDER entry, parses the matching episode YAML, and asserts the
 * focusCaseIds match exactly. Round-1 reviewer requested this guard.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Episode } from '../src/content/schema';
import { ROTA_ORDER } from '../src/state/rotaOrder';

const ROOT = process.cwd();

describe('M82 — ROTA_ORDER consistency with episode YAMLs', () => {
  for (const entry of ROTA_ORDER) {
    it(`${entry.episodeId} focusCaseIds match the YAML focus_cases`, () => {
      const path = join(ROOT, 'content/episodes', `${entry.episodeId}.yaml`);
      const raw = readFileSync(path, 'utf8');
      const ep = Episode.parse(parseYaml(raw));
      expect(entry.focusCaseIds).toEqual(ep.focus_cases);
    });
  }

  it('every rota entry is a unique episodeId', () => {
    const ids = ROTA_ORDER.map((e) => e.episodeId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

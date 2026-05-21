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
import { BLOCKS, ROTA_ORDER } from '../src/state/rotaOrder';

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

describe('M83 — block + keystone invariants', () => {
  it('every rota entry has blockIndex in {1, 2, 3}', () => {
    for (const entry of ROTA_ORDER) {
      expect([1, 2, 3]).toContain(entry.blockIndex);
    }
  });

  it('BLOCKS derives one entry per block index', () => {
    expect(BLOCKS.map((b) => b.blockIndex)).toEqual([1, 2, 3]);
  });

  it('each block has exactly one keystone shift', () => {
    for (const b of BLOCKS) {
      const keystones = b.positions
        .map((p) => ROTA_ORDER[p]!)
        .filter((s) => s.isKeystone);
      expect(keystones.length).toBe(1);
    }
  });

  it('BLOCKS positions match a contiguous slice of ROTA_ORDER', () => {
    // Block ordering should match rota ordering: block 1's positions
    // come first, then block 2's, then block 3's. M84 may re-order
    // within blocks but the block-1-then-2-then-3 invariant should hold.
    let expected = 0;
    for (const b of BLOCKS) {
      for (const pos of b.positions) {
        expect(pos).toBe(expected);
        expected += 1;
      }
    }
    expect(expected).toBe(ROTA_ORDER.length);
  });
});

/**
 * M88 (Braintrust 10) — Akin pre-shift handover content invariants.
 *
 * The handovers file is content-authored; a typo or schema-mismatch
 * would render to a blank UI panel without obvious cause. These
 * tests guard the basic shape + a few authoring rules:
 *
 *   - schema parses cleanly
 *   - rota_index values are unique
 *   - every rota_index falls within ROTA_ORDER bounds
 *   - the entry-shift handover (position 0) is authored (M88 ships
 *     this one paragraph)
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { AkinHandovers } from '../src/content/schema';
import { ROTA_ORDER } from '../src/state/rotaOrder';

const ROOT = process.cwd();

const handoversYaml = readFileSync(
  join(ROOT, 'content/narrative/akin_handovers.yaml'),
  'utf8',
);

describe('M88 — Akin handovers content', () => {
  const parsed = AkinHandovers.parse(parseYaml(handoversYaml));

  it('schema parses cleanly', () => {
    expect(parsed.schema_version).toBe(1);
    expect(Array.isArray(parsed.handovers)).toBe(true);
  });

  it('rota_index values are unique', () => {
    const indices = parsed.handovers.map((h) => h.rota_index);
    expect(new Set(indices).size).toBe(indices.length);
  });

  it('every rota_index falls within ROTA_ORDER bounds', () => {
    const max = ROTA_ORDER.length - 1;
    for (const h of parsed.handovers) {
      expect(h.rota_index).toBeGreaterThanOrEqual(0);
      expect(h.rota_index).toBeLessThanOrEqual(max);
    }
  });

  it('M88 ships the entry-shift handover (position 0)', () => {
    const entry = parsed.handovers.find((h) => h.rota_index === 0);
    expect(entry).toBeDefined();
    expect(entry!.text.length).toBeGreaterThan(100);
    // The dual-register voice contract: clinical content + slice-of-
    // life observation in the same paragraph. The position-0 text
    // should include both a "bed state" reference (clinical) and at
    // least one observational micro-beat. Loose textual check; the
    // craft is hand-reviewed.
    expect(entry!.text.toLowerCase()).toMatch(/bed state|bed manager|trolley|waiting room/);
  });

  it('all authored handovers have non-trivial text', () => {
    for (const h of parsed.handovers) {
      expect(h.text.trim().length).toBeGreaterThan(40);
    }
  });

  it('M89 ships full coverage — every rota position has an authored handover', () => {
    const authored = new Set(parsed.handovers.map((h) => h.rota_index));
    for (let i = 0; i < ROTA_ORDER.length; i++) {
      expect(authored.has(i), `rota position ${i} (${ROTA_ORDER[i]!.episodeId}) is missing a handover`).toBe(true);
    }
  });

  it('keystone handovers (positions 4, 10, 16) are longer than other positions', () => {
    // The keystones get the heaviest pedagogical weight in the NTS
    // arc. Their handovers should be more substantial than the
    // intermediate position-1-3 / 5-9 / 11-15 atmospheric beats.
    const keystoneIndices = [4, 10, 16];
    const keystoneLengths = keystoneIndices.map(
      (i) => parsed.handovers.find((h) => h.rota_index === i)!.text.length,
    );
    for (const len of keystoneLengths) {
      expect(len).toBeGreaterThan(400);
    }
  });

  it('final keystone (position 16) references the dissection patient', () => {
    // The block-3 final keystone is the NTS-thread crescendo. Akin's
    // voice should reference Mr Okafor specifically — that's the
    // landed beat that connects the latent failures across the rota.
    const final = parsed.handovers.find((h) => h.rota_index === 16)!;
    expect(final.text.toLowerCase()).toContain('okafor');
  });
});

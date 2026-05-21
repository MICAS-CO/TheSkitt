import { describe, expect, it } from 'vitest';
import {
  NPC_SPRITES,
  npcFrameToSvg,
  npcSpriteIdForSource,
} from '../src/style/npcSprites';

describe('M43 — NPC sprite library', () => {
  it('all NPC sprites are 16 wide × 24 tall paint-by-string grids', () => {
    for (const [id, rows] of Object.entries(NPC_SPRITES)) {
      expect(rows.length, `${id} rows`).toBe(24);
      for (const row of rows) {
        expect(row.length, `${id} row width`).toBe(16);
      }
    }
  });

  it('npcFrameToSvg returns crisp-edge SVG with at least one rect', () => {
    const svg = npcFrameToSvg(NPC_SPRITES.paramedic!, 2);
    expect(svg).toMatch(/^<svg/);
    expect(svg).toMatch(/shape-rendering="crispEdges"/);
    expect(svg).toMatch(/<rect /);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('npcSpriteIdForSource maps the four NPC-bearing sources', () => {
    expect(npcSpriteIdForSource('paramedic')).toBe('paramedic');
    expect(npcSpriteIdForSource('triage_note')).toBe('triage_nurse');
    expect(npcSpriteIdForSource('nurse')).toBe('sister');
    expect(npcSpriteIdForSource('family')).toBe('worried_partner');
  });

  it('npcSpriteIdForSource returns null for sources with no NPC', () => {
    expect(npcSpriteIdForSource('patient')).toBeNull();
    expect(npcSpriteIdForSource('records')).toBeNull();
    expect(npcSpriteIdForSource('gp_letter')).toBeNull();
  });

  it('npcSpriteIdForSource honours overrides when valid', () => {
    expect(npcSpriteIdForSource('family', 'bereaved_relative')).toBe('bereaved_relative');
    // Unknown override falls through to source default.
    expect(npcSpriteIdForSource('family', 'not_a_real_npc')).toBe('worried_partner');
  });
});

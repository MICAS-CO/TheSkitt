import { describe, expect, it } from 'vitest';
import { WORLD_TILES, worldFrameToSvg } from '../src/style/worldSprites';

describe('M46 — world tiles parked for future overworld', () => {
  it('all world tiles are 16×16 paint-by-string grids', () => {
    for (const [id, rows] of Object.entries(WORLD_TILES)) {
      expect(rows.length, `${id} rows`).toBe(16);
      for (const row of rows) {
        expect(row.length, `${id} row width`).toBe(16);
      }
    }
  });

  it('worldFrameToSvg renders any tile to crisp-edge SVG', () => {
    const svg = worldFrameToSvg(WORLD_TILES.trolley_occupied!);
    expect(svg).toMatch(/^<svg/);
    expect(svg).toMatch(/shape-rendering="crispEdges"/);
    expect(svg).toMatch(/<rect /);
  });

  it('the catalogue includes the expected eleven tiles', () => {
    const ids = Object.keys(WORLD_TILES).sort();
    expect(ids).toEqual(
      [
        'lino_floor',
        'lino_scuff',
        'wall_teal',
        'wall_resus_stripe',
        'curtain',
        'trolley_empty',
        'trolley_occupied',
        'drip_stand',
        'monitor_wall',
        'handgel',
        'sharps_bin',
      ].sort(),
    );
  });
});

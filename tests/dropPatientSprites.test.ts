import { describe, expect, it } from 'vitest';
import {
  DROP_PATIENT_SPRITES,
  dropFrameToSvg,
  dropPatientFrames,
} from '../src/style/dropPatientSprites';
import { spriteSvgFor } from '../src/style/sprites';

describe('M75 — drop #3 patient sprite catalogue', () => {
  it('exposes 13 archetypes with upright + supine + 4 state recipes each', () => {
    const ids = Object.keys(DROP_PATIENT_SPRITES);
    expect(ids.length).toBeGreaterThanOrEqual(13);
    for (const id of ids) {
      const bp = DROP_PATIENT_SPRITES[id]!;
      expect(bp.upright.length).toBeGreaterThanOrEqual(24);
      expect(bp.supine.length).toBeGreaterThanOrEqual(24);
      expect(Object.keys(bp.states).sort()).toEqual(
        ['arrested', 'deteriorating', 'postResus', 'triaged'],
      );
    }
  });

  it('dropPatientFrames returns frames for each state', () => {
    for (const state of ['stable', 'triaged', 'deteriorating', 'arrested', 'post_resus']) {
      const frames = dropPatientFrames('doherty', state);
      expect(frames, `state ${state}`).not.toBeNull();
      expect(frames!.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('dropFrameToSvg returns crisp-edge SVG', () => {
    const frames = dropPatientFrames('tom', 'stable')!;
    const svg = dropFrameToSvg(frames[0]!);
    expect(svg).toMatch(/^<svg/);
    expect(svg).toMatch(/shape-rendering="crispEdges"/);
    expect(svg).toMatch(/<rect/);
  });

  it('spriteSvgFor routes case_sepsis_uti_morrison → doherty', () => {
    const a = spriteSvgFor('case_sepsis_uti_morrison', 'stable', 0, 1);
    const b = dropFrameToSvg(dropPatientFrames('doherty', 'stable')![0]!, 1);
    expect(a).toBe(b);
  });

  it('spriteSvgFor routes case_ugib_variceal_kowalski → tom', () => {
    const a = spriteSvgFor('case_ugib_variceal_kowalski', 'stable', 0, 1);
    const b = dropFrameToSvg(dropPatientFrames('tom', 'stable')![0]!, 1);
    expect(a).toBe(b);
  });

  it('unmapped cases fall through to the hand-authored registry', () => {
    // Beth has a hand-authored sprite; no drop mapping. The drop module
    // should NOT serve her.
    expect(dropPatientFrames('beth', 'stable')).toBeNull();
    // But spriteSvgFor for Beth's case still returns the hand-authored one.
    const svg = spriteSvgFor('case_anaphylaxis_adult_peanut', 'stable', 0, 1);
    expect(svg).not.toBeNull();
    expect(svg).toMatch(/<rect/);
  });

  it('every authored case in the catalogue has a sprite (M76)', async () => {
    const { readdirSync } = await import('node:fs');
    const { join } = await import('node:path');
    const dir = join(process.cwd(), 'content/cases');
    const files = readdirSync(dir).filter(
      (f) => f.endsWith('.yaml') && !f.includes('scratch') && !f.includes('draft'),
    );
    const missing: string[] = [];
    for (const f of files) {
      const caseId = f.replace(/\.yaml$/, '');
      const svg = spriteSvgFor(caseId, 'stable', 0, 1);
      if (!svg) missing.push(caseId);
    }
    if (missing.length) {
      throw new Error(`Sprite missing for ${missing.length} case(s): ${missing.join(', ')}`);
    }
  });
});

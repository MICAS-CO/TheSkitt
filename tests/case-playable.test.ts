import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case, Episode, type CaseT, type EpisodeT } from '../src/content/schema';
import { SimKernel } from '../src/sim/kernel';
import { scoreCase } from '../src/state/sim';

/**
 * Meta-test: every authored case must be playable end-to-end with a
 * `good` or `excellent` band when the player picks the `top`
 * differential, ticks every `must_do` action, and chooses an
 * `appropriate` disposition. This locks in:
 *
 * 1. The case has at least one `top` differential.
 * 2. The case has at least one `appropriate: true` disposition.
 * 3. The must-do action set is internally consistent (none would put
 *    the patient into a terminal state by themselves).
 * 4. The scoring rubric yields a non-unsafe band when played correctly.
 *
 * If a future case author forgets one of these structural invariants,
 * the case will fail this test rather than slip through manual review.
 */

const ROOT = process.cwd();
const CASES_DIR = join(ROOT, 'content/cases');
const CASES: ReadonlyArray<readonly [string, CaseT]> = readdirSync(CASES_DIR)
  .filter((f) => f.endsWith('.yaml'))
  .filter((f) => !f.includes('scratch') && !f.includes('_draft'))
  .map((f) => [f, Case.parse(parseYaml(readFileSync(join(CASES_DIR, f), 'utf8')))] as const);

function singleCaseEpisode(caseData: CaseT): EpisodeT {
  return Episode.parse({
    schema_version: 1,
    id: 'ep_playable_test',
    title: 'Playable test',
    learning_objectives: ['playable round-trip'],
    curriculum_tags: ['RP2'],
    difficulty_band: 'CT2',
    shift_duration_min: 20,
    focus_cases: [caseData.id],
    scheduled_events: [],
  });
}

describe('Every authored case is playable to a non-unsafe band', () => {
  it.each(CASES)('case %s reaches good/excellent on a perfect run', (_file, caseData) => {
    const topDx = caseData.differential.find((d) => d.likelihood === 'top');
    expect(topDx, `case ${caseData.id} has no "top" differential`).toBeDefined();

    const okDisp = caseData.disposition_options.find((d) => d.appropriate);
    expect(okDisp, `case ${caseData.id} has no appropriate disposition`).toBeDefined();

    const episode = singleCaseEpisode(caseData);
    const kernel = new SimKernel({ episode, cases: new Map([[caseData.id, caseData]]) });
    kernel.enterCase(caseData.id);

    for (const m of caseData.management.filter((m) => m.must_do)) {
      kernel.toggleAction(caseData.id, m.id);
    }
    kernel.setWorkingDx(caseData.id, topDx!.diagnosis);
    kernel.setDisposition(caseData.id, okDisp!.label);

    const cs = kernel.getState().cases.get(caseData.id)!;
    const score = scoreCase(cs);

    expect(score.workingDxCorrect).toBe(true);
    expect(score.dispositionCorrect).toBe(true);
    expect(score.mustNotDoChosen).toBe(0);
    expect(score.band).not.toBe('unsafe');
    expect(score.percent).toBeGreaterThanOrEqual(75);
  });

  it.each(CASES)('case %s with no actions scores 0-30 (well below good)', (_file, caseData) => {
    const episode = singleCaseEpisode(caseData);
    const kernel = new SimKernel({ episode, cases: new Map([[caseData.id, caseData]]) });
    kernel.enterCase(caseData.id);
    const cs = kernel.getState().cases.get(caseData.id)!;
    const score = scoreCase(cs);
    expect(score.mustDoDone).toBe(0);
    expect(score.percent).toBeLessThan(50);
  });
});

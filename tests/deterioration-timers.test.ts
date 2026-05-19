import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case, Episode, type CaseT, type EpisodeT } from '../src/content/schema';
import { SimKernel } from '../src/sim/kernel';

const ROOT = process.cwd();

/**
 * M14 — the UI surfaces upcoming `deterioration_if_not_x_by_t` events
 * with their countdown to the player. The kernel itself stores unfired
 * events in `state.unfiredEvents`; the UI filter is straightforward.
 * This suite confirms the data the UI relies on stays correct.
 */
describe('M14 — deterioration timers', () => {
  function loadBeth(): CaseT {
    return Case.parse(
      parseYaml(readFileSync(join(ROOT, 'content/cases/case_anaphylaxis_adult_peanut.yaml'), 'utf8')),
    );
  }

  function bethEp(): EpisodeT {
    return Episode.parse({
      schema_version: 1,
      id: 'ep_det_timer_test',
      title: 'Det timer test',
      learning_objectives: ['x'],
      curriculum_tags: ['RP2'],
      difficulty_band: 'CT2',
      shift_duration_min: 20,
      focus_cases: ['case_anaphylaxis_adult_peanut'],
      scheduled_events: [
        {
          id: 'ev_test_det',
          type: 'deterioration_if_not_x_by_t',
          t_min: 5,
          case_id: 'case_anaphylaxis_adult_peanut',
          required_action_ids: ['mx_adrenaline_im'],
          new_state: 'arrested',
        },
      ],
    });
  }

  it('unfiredEvents exposes the deterioration clause until it fires', () => {
    const beth = loadBeth();
    const k = new SimKernel({ episode: bethEp(), cases: new Map([[beth.id, beth]]) });
    const ks = k.getState();
    const detEvents = ks.unfiredEvents.filter((e) => e.type === 'deterioration_if_not_x_by_t');
    expect(detEvents).toHaveLength(1);
    expect(detEvents[0]!.case_id).toBe('case_anaphylaxis_adult_peanut');
  });

  it('clears the deterioration clause from unfiredEvents after firing', () => {
    const beth = loadBeth();
    const k = new SimKernel({ episode: bethEp(), cases: new Map([[beth.id, beth]]) });
    k.enterCase(beth.id);
    k.advance(6); // past the T+5 event
    const ks = k.getState();
    const detEvents = ks.unfiredEvents.filter((e) => e.type === 'deterioration_if_not_x_by_t');
    expect(detEvents).toHaveLength(0);
  });

  it('does not fire deterioration when the required action is taken before T+t_min', () => {
    const beth = loadBeth();
    const k = new SimKernel({ episode: bethEp(), cases: new Map([[beth.id, beth]]) });
    k.enterCase(beth.id);
    k.toggleAction(beth.id, 'mx_adrenaline_im');
    k.advance(6);
    const cs = k.getState().cases.get(beth.id)!;
    expect(cs.state).not.toBe('arrested');
  });
});

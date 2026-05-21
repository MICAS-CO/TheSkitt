/**
 * M87 (Braintrust 06 Tier 2) — content-side mirror invariant.
 *
 * Deterioration logic lives in two places:
 *   1. Episode `scheduled_events` with `type: deterioration_if_not_x_by_t`.
 *   2. Case `state_machine.transitions` with `trigger.on: 'inaction_by'`.
 *
 * The M86 audit (Braintrust 06 timer-pedagogy synthesis) showed the
 * two can drift: editing one source and forgetting the other was the
 * round-1 bug. Round-1 reviewer asked for a standing test.
 *
 * M86's first attempt was too aggressive — it asserted strict identity
 * across the two sources, which failed because some cases use the
 * sources COMPLEMENTARY rather than redundant (e.g. Beth's case event
 * requires `[adrenaline]` only, but her state-machine `inaction_by`
 * requires `[adrenaline, supine]` — same min, layered conditions, not
 * drift).
 *
 * The M87 invariant distinguishes drift from complementarity:
 *
 *   For each episode `deterioration_if_not_x_by_t` event on a case
 *   with min M:
 *     If the case state machine has ANY `inaction_by` transition with
 *     the same `min: M` AND overlapping `required_actions`
 *     (overlap = the two sets share >= 1 element), then those
 *     transitions' `to`-state MUST equal the event's `new_state`.
 *
 * This catches "you changed the event's new_state but forgot to
 * update the state machine" (or vice versa). It does NOT flag
 * intentional layering (different required actions, same destination)
 * or single-source events (only the episode event exists, no
 * state-machine mirror at all).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case, Episode } from '../src/content/schema';

const ROOT = process.cwd();
const EP_DIR = join(ROOT, 'content/episodes');
const CASE_DIR = join(ROOT, 'content/cases');

interface EventDescriptor {
  episodeId: string;
  eventId: string;
  caseId: string;
  tMin: number;
  newState: string;
  requiredActions: string[];
}

function collectDeteriorationEvents(): EventDescriptor[] {
  const out: EventDescriptor[] = [];
  for (const fn of readdirSync(EP_DIR)) {
    if (!fn.endsWith('.yaml')) continue;
    const ep = Episode.parse(parseYaml(readFileSync(join(EP_DIR, fn), 'utf8')));
    for (const ev of ep.scheduled_events ?? []) {
      if (ev.type !== 'deterioration_if_not_x_by_t') continue;
      out.push({
        episodeId: ep.id,
        eventId: ev.id,
        caseId: ev.case_id,
        tMin: ev.t_min,
        newState: ev.new_state,
        requiredActions: [...ev.required_action_ids],
      });
    }
  }
  return out;
}

function setsOverlap(a: ReadonlyArray<string>, b: ReadonlyArray<string>): boolean {
  const bs = new Set(b);
  for (const x of a) if (bs.has(x)) return true;
  return false;
}

describe('M87 — deterioration event ↔ case state machine drift detection', () => {
  const events = collectDeteriorationEvents();

  it('inventory: at least one deterioration event exists across the rota', () => {
    expect(events.length).toBeGreaterThan(0);
  });

  for (const ev of events) {
    it(`${ev.episodeId}:${ev.eventId} — co-located case state-machine transitions agree on new_state`, () => {
      const caseYaml = readFileSync(join(CASE_DIR, `${ev.caseId}.yaml`), 'utf8');
      const c = Case.parse(parseYaml(caseYaml));
      const colocated = c.state_machine.transitions.filter((t) => {
        if (t.trigger.on !== 'inaction_by') return false;
        if (t.trigger.min !== ev.tMin) return false;
        return setsOverlap(t.trigger.required_actions, ev.requiredActions);
      });
      // Zero co-located transitions = the episode event is the sole
      // authority. That's a valid design choice — don't flag it.
      // Any co-located transition that DISAGREES on the destination
      // state IS the drift signal.
      for (const t of colocated) {
        // The colocated filter already narrowed trigger.on to
        // 'inaction_by'; restate the guard so TypeScript's narrowing
        // survives the .filter() boundary.
        const trig = t.trigger.on === 'inaction_by' ? t.trigger : null;
        if (!trig) continue;
        expect(
          t.to,
          `Drift detected for ${ev.eventId} on ${ev.caseId}: episode event ` +
            `sets new_state='${ev.newState}' at min:${ev.tMin}, but case state ` +
            `machine has an inaction_by transition (from=${t.from}, ` +
            `required=${trig.required_actions.join(',')}) going to ` +
            `'${t.to}'. The two sources have drifted — update one to match ` +
            `the other, or differentiate the required_actions so the test ` +
            `recognises them as complementary rather than redundant.`,
        ).toBe(ev.newState);
      }
    });
  }
});

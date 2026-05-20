import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Case, type CaseT } from '../src/content/schema';

/**
 * State-machine sanity tests for every authored case.
 *
 * Catches the class of authoring bug where the case's own state
 * machine routes the player INTO a non-terminal state and then
 * provides no way out — a "dead-end deteriorating" pattern. The
 * Oduya hypertensive emergency case had this bug before audit; this
 * test would have caught it automatically.
 *
 * Episode-driven state changes (new_arrival, deterioration_if_not_x
 * _by_t, arc_reveal) live outside the case file and are NOT in
 * scope here — only case-internal transitions are checked.
 */

const CASES_DIR = join(process.cwd(), 'content/cases');
const CASES: ReadonlyArray<readonly [string, CaseT]> = readdirSync(CASES_DIR)
  .filter((f) => f.endsWith('.yaml'))
  .filter((f) => !f.includes('scratch') && !f.includes('_draft'))
  .map((f) => [f, Case.parse(parseYaml(readFileSync(join(CASES_DIR, f), 'utf8')))] as const);

/** States that are terminal in the kernel — no outbound transitions expected. */
const TERMINAL = new Set<string>(['arrested', 'admitted', 'discharged', 'deceased']);

describe('state-machine reachability', () => {
  it.each(CASES)(
    'case %s: no non-terminal dead-end state (reachable by case-internal transition with no exit)',
    (_file, caseData) => {
      const transitions = caseData.state_machine.transitions;
      const reachedByInternal = new Set<string>();
      for (const t of transitions) reachedByInternal.add(t.to);

      const deadEnds: string[] = [];
      for (const state of reachedByInternal) {
        if (TERMINAL.has(state)) continue; // terminal states are expected to lack outbound
        const hasOutbound = transitions.some((t) => t.from === state);
        if (!hasOutbound) deadEnds.push(state);
      }

      expect(
        deadEnds,
        `case ${caseData.id} routes the player into non-terminal state(s) [${deadEnds.join(', ')}] with no outbound transitions — player would be stranded.`,
      ).toEqual([]);
    },
  );

  it.each(CASES)(
    'case %s: at least one transition leads to a success state (admitted or discharged)',
    (_file, caseData) => {
      const successStates = new Set(['admitted', 'discharged']);
      const successTransitions = caseData.state_machine.transitions.filter((t) =>
        successStates.has(t.to),
      );
      expect(
        successTransitions.length,
        `case ${caseData.id} has no transition reaching admitted/discharged — player has no success path`,
      ).toBeGreaterThan(0);
    },
  );
});

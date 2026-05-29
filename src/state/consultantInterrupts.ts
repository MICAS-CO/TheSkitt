/**
 * Dr McGrath bedside interrupts (M39, rewritten M81). She speaks during
 * shifts when specific safety-critical or rapport-collapse beats fire.
 * Each interrupt is composed deterministically from case context so
 * the line lands as a presence in the room, not a generic alert.
 *
 * Triggers (emitted from src/sim/kernel.ts):
 *  - trap_caught: player toggles a must_not_do action ON.
 *  - deterioration_takeover: a deterioration event fires while
 *    required actions remain unticked — McGrath steps in.
 *  - unsafe_midshift: clock reaches the mid-point with at least one
 *    case already arrested / deceased — she pulls the player aside.
 *
 * Each trigger fires at most once per case (kernel guards via
 * cs.consultantInterruptsFired).
 *
 * M81 reframing: caseName is now the patient's chief_complaint (e.g.
 * "Fall at home, knock to the head, on apixaban") rather than the
 * diagnosis-bearing clinical title. McGrath wouldn't name the
 * diagnosis to the trainee mid-shift — that's the player's job to
 * reach — so the lines refer to the case by complaint or generically.
 */

export interface InterruptContext {
  /** The case's chief_complaint (player-facing triage line). */
  caseName: string;
  /** The action label that triggered (trap_caught only). */
  actionName?: string;
  /** Required action labels still missing at deterioration fire. */
  missingActionLabels?: string[];
  /** Mode label (e.g. 'arrested') the case just transitioned to. */
  newState?: string;
}

export interface ComposedInterrupt {
  line: string;
  aside?: string;
}

export function composeTrapCaughtInterrupt(ctx: InterruptContext): ComposedInterrupt {
  const action = ctx.actionName ?? 'that';
  return {
    line: `Hold on — ${action}? Walk me through your thinking. What's your cue for this one?`,
    aside:
      "(I'm not stopping you — I want to hear the reasoning. If it's the right call we'll go. If not, we untick.)",
  };
}

export function composeDeteriorationTakeoverInterrupt(ctx: InterruptContext): ComposedInterrupt {
  const missing = ctx.missingActionLabels?.[0];
  const newState = ctx.newState ?? 'deteriorating';
  const missingLine = missing
    ? `${missing} should have been in five minutes ago.`
    : "The bundle didn't go in.";
  const verb = newState === 'arrested' ? 'arresting' : 'sliding';
  return {
    line: `They're ${verb} — I've got this, you watch. ${missingLine}`,
    aside: "(Stay in the room. We'll debrief this one properly afterwards.)",
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function composeUnsafeMidshiftInterrupt(_ctx: InterruptContext): ComposedInterrupt {
  return {
    line: `Step out with me a sec — that one hasn't gone the way we'd want. Take a breath. I'll cover for five.`,
    aside: "(Coffee on the desk. Come back when you're ready. No rush.)",
  };
}

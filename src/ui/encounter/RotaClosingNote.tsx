/**
 * M90 (Braintrust 10 round-2) — narrative-thread closing note at the
 * final-keystone debrief. Renders only when the player has just
 * completed the dissection shift (rota position 16, Mr Okafor) —
 * the final keystone of the rota.
 *
 * This is the deliberate landing place for the NTS narrative arc
 * Akin and McGrath have been seeding across all 17 shifts: small
 * frictions in block 1, accumulated near-miss energy in block 2,
 * the Stan + Chloe safeguarding pattern in block 3 mid, and the
 * latent failures coalescing at the dissection. The closing note
 * is in McGrath's voice — she connects the dots and names the
 * shape of the year the player just played through.
 *
 * Renders below the M87 ReasoningRead in DebriefPhase. Conditional
 * on `caseId === 'case_aortic_dissection_okafor'`.
 */

import type { ScoreReport } from '../../state/sim';

interface Props {
  caseId: string;
  score: ScoreReport;
}

const FINAL_KEYSTONE_CASE_ID = 'case_aortic_dissection_okafor';

export function RotaClosingNote({ caseId, score }: Props) {
  // Lock to the dissection final keystone only. Hook-free pure
  // function so the early-return doesn't trip rules-of-hooks.
  if (caseId !== FINAL_KEYSTONE_CASE_ID) return null;

  // Three voice variants: keystone-cleared-well, keystone-borderline,
  // keystone-failed (unsafe). The pedagogical message lands either
  // way — the variance is in McGrath's tone, not in whether she
  // names the system-failure framing.
  const tone: 'cleared' | 'borderline' | 'failed' =
    score.band === 'unsafe' ? 'failed' : score.band === 'borderline' ? 'borderline' : 'cleared';

  // M90 voice — McGrath speaking, post-shift, post-dissection. NHS
  // governance accuracy: M&Ms are written by clinicians (consultant
  // or senior registrar), not by charge nurses; round-1 reviewer
  // flagged the original draft for attributing the M&M to Akin.
  // McGrath is the consultant; she authors the M&M. Safeguarding
  // misses are referenced through safeguarding reviews / Datix, not
  // M&Ms — that's a separate governance pathway.
  let body: string;
  switch (tone) {
    case 'cleared':
      body =
        "End of the rota. Mr Okafor is on his way to theatre because you held the cath lab for sixty seconds and read the ECG yourself. " +
        "That sixty seconds is the entire competency this year of training has been building toward. " +
        "Three weeks ago we lost a patient who looked exactly like this, and the audit blamed the registrar. The audit was wrong. " +
        "What you just did — speaking up across hierarchies inside a system that was already labelling the patient a STEMI — is the Crew Resource Management beat FRCEM tests for. " +
        "I'll be writing tonight's M&M up over the weekend. You're in it. Then go home.";
      break;
    case 'borderline':
      body =
        "End of the rota. Mr Okafor pulled through — barely — and there are things in the debrief breakdown above worth sitting with. " +
        "Most missed-dissection deaths in the M&M literature are not single-clinician failures; they're a chain. Anchored team, imaging delay, hierarchy friction, the on-call SpR in a strategic meeting again. " +
        "You operated inside that chain tonight. The Just Culture frame the workplace assessments use is: who saw which link, who could have spoken across it, what would make the next chain shorter. " +
        "I'll draft the M&M this weekend. Bring questions to the next governance round.";
      break;
    case 'failed':
      body =
        "End of the rota. Sit down. " +
        "Mr Okafor was a system failure as much as a clinical one. The chain that ended on this trolley started in block 2 with a near-miss that didn't make it into a formal report, and it ran through every late-block shift you played — the safeguarding pattern, the stroke pathway, the andexanet bottleneck. " +
        "I will not pretend the personal-failure framing doesn't matter; it does, and we'll go through the ECG and the ADD-RS together when you're ready. " +
        "But the Just Culture work is the bigger task. I'll be writing the M&M; you'll have copies of the safeguarding review on Chloe and Stan too. Come to the next governance round with what you'd say.";
      break;
  }

  return (
    <aside className={`rota-closing-note rota-closing-note--${tone}`} aria-label="McGrath's rota-closing note">
      <header className="rota-closing-note__head">
        <span className="rota-closing-note__eyebrow">End of the rota — McGrath</span>
      </header>
      <p className="rota-closing-note__body">{body}</p>
    </aside>
  );
}

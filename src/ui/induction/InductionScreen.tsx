/**
 * Skittstown ED Induction (M74).
 *
 * Two phases:
 *   1. Character creation — first name + last name + grade (Intern/SHO/Registrar)
 *   2. Induction tour — Dr Aoife McGrath walks you through the systems
 *      the simulation models: the board, the patient panel, history
 *      tone, examinations + manoeuvres, investigations + ECG, the
 *      differential, the drug chart, disposition, the clock, resus
 *      mode, and her own role.
 *
 * Skip-able at any beat (re-onboarding existing players would be
 * annoying). Persists `Character.inducted = true` on completion or
 * skip so the App's first-run gate doesn't re-fire.
 */

import { useState } from 'react';
import { NPC_SPRITES, npcFrameToSvg } from '../../style/npcSprites';
import { Character, CharacterRole, saveCharacter } from '../../state/character';

interface Props {
  onComplete: (c: Character) => void;
}

type Phase = 'create' | 'tour';

const ROLES: { value: CharacterRole; title: string; sub: string }[] = [
  { value: 'Intern', title: 'Intern — first postgraduate year', sub: 'New doctor, four months in. Lenient scoring, unlimited pause.' },
  { value: 'SHO', title: 'SHO — senior house officer', sub: 'Acute med + a rotation or two done. Lenient scoring.' },
  { value: 'Registrar', title: 'Registrar — EM specialty trainee', sub: 'You are the registrar tonight. Standard scoring, trap hints off.' },
];

export function InductionScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('create');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<CharacterRole>('Registrar');

  function startInduction() {
    if (!firstName.trim() || !lastName.trim()) return;
    setPhase('tour');
  }

  function finish(c: Character) {
    saveCharacter(c);
    onComplete(c);
  }

  if (phase === 'create') {
    const canStart = firstName.trim().length > 0 && lastName.trim().length > 0;
    return (
      <div className="induction" role="dialog" aria-modal="true">
        <div className="induction__panel">
          <div className="induction__eyebrow">· FOUNDATION TRUST INDUCTION ·</div>
          <h1 className="induction__title">Skittstown General — Emergency Department</h1>
          <p className="induction__intro">
            Welcome to Skittstown ED. <em>The Skitt</em> to everyone who works here. Before
            we put you in scrubs, occupational health needs a name on the badge.
          </p>
          <div className="induction__form">
            <label className="induction__field">
              <span>First name</span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
                maxLength={32}
                placeholder="Hannah"
              />
            </label>
            <label className="induction__field">
              <span>Last name</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={32}
                placeholder="Kovač"
              />
            </label>
            <fieldset className="induction__roles">
              <legend>Grade</legend>
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`induction__role ${role === r.value ? 'is-picked' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                  />
                  <span className="induction__role-title">{r.title}</span>
                  <span className="induction__role-sub">{r.sub}</span>
                </label>
              ))}
            </fieldset>
          </div>
          <div className="induction__actions">
            <button
              type="button"
              className="induction__primary"
              onClick={startInduction}
              disabled={!canStart}
            >
              Sign in →
            </button>
            <button
              type="button"
              className="induction__ghost"
              onClick={() => {
                const fallback: Character = {
                  firstName: 'Hannah',
                  lastName: 'Kovač',
                  role: 'Registrar',
                  inducted: true,
                  createdIso: new Date().toISOString(),
                };
                finish(fallback);
              }}
            >
              Skip — I&rsquo;ve done this before
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tour phase
  return (
    <InductionTour
      firstName={firstName}
      lastName={lastName}
      role={role}
      onFinish={() =>
        finish({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
          inducted: true,
          createdIso: new Date().toISOString(),
        })
      }
    />
  );
}

interface Beat {
  title: string;
  speaker: 'mcgrath' | 'narrator' | 'sister';
  body: string;
  /** Mechanic the beat is teaching, surfaced as a chip on the panel. */
  mechanic?: string;
}

function tourBeats(firstName: string, role: CharacterRole): Beat[] {
  const intro =
    role === 'Registrar'
      ? "You're the registrar tonight — you've done this dance before. Bear with me, Skittstown does it differently."
      : role === 'SHO'
        ? "SHO grade, so you're not strictly green any more. I'll keep it brisk."
        : "Intern means I'm officially supposed to assume you know nothing. I'll talk to you like a colleague anyway.";

  return [
    {
      title: 'The doctors\' mess',
      speaker: 'mcgrath',
      body: `Sit a minute, Dr ${firstName}. I'm Aoife McGrath, EM consultant. I'll be supervising you tonight. ${intro} Let me walk you through how we work.`,
    },
    {
      title: 'The board',
      speaker: 'mcgrath',
      body:
        "Patients arrive there. Each card on the board is one of yours. Triage colour, name, time on the clock since they arrived. Pick one and walk to them. Don't try to do them all at once — the trap junior doctors fall into in their first week.",
      mechanic: 'Shift board — pick a patient',
    },
    {
      title: 'The patient panel',
      speaker: 'mcgrath',
      body:
        "On the right of your screen, when you're with a patient: monitor + portrait. NEWS2 colours change as they get sicker — green 0-4, amber 5-6, red 7 plus. The portrait shows what the bedside shows: clammy, mottled, flushed, cyanosed. Trust it. The vitals interpolate in real time — that climb from 88 to 124 isn't instant any more than it is in real life.",
      mechanic: 'NEWS2 traffic light + interpolated vitals',
    },
    {
      title: 'History',
      speaker: 'mcgrath',
      body:
        "History first. Some questions have a tone fork — the way you ask matters. Compassionate questions earn rapport; rapport unlocks disclosures the patient wouldn't otherwise give you. Dismissive questions cost you information. Real cost — the patient or the paramedic literally stops volunteering things.",
      mechanic: 'Branching dialogue + rapport',
    },
    {
      title: 'Examination',
      speaker: 'mcgrath',
      body:
        "Systems first — A, B, C, D, E, plus anything case-specific. Some systems have manoeuvres listed beneath. Log-roll. Pronator drift. Cranial nerves II–XII. Pelvic exam if it's an obstetric case. The manoeuvres are gated — performing them uncovers findings the eye-ball-and-auscultate misses. The Disco Elysium version of bedside teaching, if you've played that.",
      mechanic: 'Discoverable manoeuvres',
    },
    {
      title: 'Investigations',
      speaker: 'mcgrath',
      body:
        "Order what you'd order. Don't shotgun every test we have — the score includes a parsimony metric. Cases mark essential investigations; miss them and you lose a band. Some investigations open an ECG drill at the bedside — three steps, identify the rhythm, name the concern, pick the action. Those are timed, like real ECGs are.",
      mechanic: 'Essentials + ECG-in-encounter',
    },
    {
      title: 'Differential',
      speaker: 'mcgrath',
      body:
        "Make a working dx. Pick from a list weighted top / must-not-miss / worth-considering / unlikely. The must-not-miss is the one the next monthly M&M will look back at and ask why nobody flagged. Lock it in even if it's not top — that's how you stop yourself anchoring.",
      mechanic: 'Differentials with likelihood weighting',
    },
    {
      title: 'The drug chart',
      speaker: 'mcgrath',
      body:
        "Tick what you give. The sim-time stamps each tick. Some options are deliberate traps — designed to look correct but be wrong for this patient. Apixaban patient gets a thrombolytic? No. DKA gets a bicarb push? No. The traps are gated behind the history that makes them tempting — you won't see them until you've earned the wrong-reflex. Settings has a 'trap hints' toggle if you want training wheels.",
      mechanic: 'Drug chart + gated traps',
    },
    {
      title: 'Disposition',
      speaker: 'mcgrath',
      body:
        "Decide where they go. Theatre, HDU, AMU, GP letter, discharge. Each option has a rationale beneath once you pick. Then there's a one-line coda — what happens next. That coda is the case telling you whether you got it right.",
      mechanic: 'Disposition + epilogue',
    },
    {
      title: 'The clock',
      speaker: 'mcgrath',
      body:
        "Shifts are 20 minutes of sim-time, real-time-ish. Pause if you need to. Some patients have deterioration timers — if the must-do bundle isn't in by T+X, they get worse. The clock isn't there to rush you; it's there to keep you in the muscle memory of an actual shift.",
      mechanic: 'Shift clock + deterioration timers',
    },
    {
      title: 'Resus mode',
      speaker: 'mcgrath',
      body:
        "If a patient arrests, switch to resus mode — top-right button on the encounter. Adult ALS algorithm built in: shockable / non-shockable rhythm split, drugs at the right intervals, 4 Hs and 4 Ts as a checklist. Don't switch unless you have to — it locks the rest of the interface.",
      mechanic: 'Resus mode',
    },
    {
      title: 'Me',
      speaker: 'mcgrath',
      body:
        "I might pop in if you tick a trap or if a patient slides hard. Step into the bay, ask you to walk me through your thinking. I'm not stopping you — I'm there to hear the reasoning. If it's the right call we go. If not, we untick. I'll also leave a short memo on the menu at the start of your next shift. Don't take it personally — it's how I help.",
      mechanic: 'Consultant interrupts + post-shift memo',
    },
    {
      title: 'Ready?',
      speaker: 'mcgrath',
      body: `Right. That's the tour. There's a board out there with patients on it, Dr ${firstName}. The badge sticker is by the door — bay 2 is anaphylaxis, the paramedic crew's ten minutes out. Go on.`,
    },
  ];
}

function InductionTour({
  firstName,
  role,
  onFinish,
}: {
  firstName: string;
  lastName: string;
  role: CharacterRole;
  onFinish: () => void;
}) {
  const beats = tourBeats(firstName.trim(), role);
  const [step, setStep] = useState(0);
  const beat = beats[step]!;
  const isLast = step === beats.length - 1;

  const mcgrathSvg = NPC_SPRITES.sister
    ? npcFrameToSvg(NPC_SPRITES.sister, 4)
    : null;

  function next() {
    if (isLast) {
      onFinish();
    } else {
      setStep((s) => s + 1);
    }
  }
  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <div className="induction induction--tour" role="dialog" aria-modal="true">
      <div className="induction__tour">
        <header className="induction__tour-head">
          <div>
            <div className="induction__eyebrow">· SKITTSTOWN ED INDUCTION ·</div>
            <h1 className="induction__title">{beat.title}</h1>
          </div>
          <div className="induction__progress">
            {beats.map((_, i) => (
              <span
                key={i}
                className={`induction__dot ${i === step ? 'is-active' : ''} ${
                  i < step ? 'is-past' : ''
                }`}
              />
            ))}
          </div>
        </header>
        <div className="induction__tour-body">
          {mcgrathSvg && (
            <div className="induction__npc" dangerouslySetInnerHTML={{ __html: mcgrathSvg }} aria-hidden="true" />
          )}
          <div className="induction__speech">
            <div className="induction__speaker">
              {beat.speaker === 'mcgrath'
                ? 'Dr Aoife McGrath · ED consultant'
                : beat.speaker === 'sister'
                  ? 'Marian, sister'
                  : 'Skittstown ED'}
            </div>
            <p>{beat.body}</p>
            {beat.mechanic && (
              <div className="induction__mechanic">
                <strong>System:</strong> {beat.mechanic}
              </div>
            )}
          </div>
        </div>
        <div className="induction__tour-foot">
          <button
            type="button"
            className="induction__ghost"
            onClick={prev}
            disabled={step === 0}
          >
            ← back
          </button>
          <span className="induction__step-count">
            {step + 1} / {beats.length}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="induction__ghost"
              onClick={onFinish}
              title="Skip the rest of the induction"
            >
              Skip
            </button>
            <button type="button" className="induction__primary" onClick={next} autoFocus>
              {isLast ? `Start your shift, Dr ${firstName.trim() || 'Kovač'} →` : 'next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

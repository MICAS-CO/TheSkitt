/**
 * Case Practice Library (M63).
 *
 * Per audit #6 — players who want to drill one specific diagnosis
 * after losing a patient need a focused practice mode. This screen
 * is a flat grid of all 17 cases keyed by patient + diagnosis,
 * each linking to the most-focused episode that exercises the case.
 *
 * Most cases route to their dedicated solo episode (ep_X_solo).
 * The four cases without a 1-case episode (Sam = ep_birthday_party,
 * Sarah = ep_hendo_shift, Marcus = ep_overnight_metabolic, Patel =
 * ep_hendo_shift) route to the smallest episode they appear in;
 * a future pass could author dedicated solo episodes for them.
 */

interface CaseEntry {
  caseId: string;
  patient: string;
  diagnosis: string;
  difficulty: string;
  episodeId: string;
  /** Optional note when the linked episode isn't a 1-case shift. */
  shared?: string;
}

const CASES: CaseEntry[] = [
  {
    caseId: 'case_anaphylaxis_adult_peanut',
    patient: 'Beth Cartwright · 28F',
    diagnosis: 'Anaphylaxis — adult, peanut',
    difficulty: 'CT2',
    episodeId: 'ep_anaphylaxis_solo',
  },
  {
    caseId: 'case_anaphylaxis_paeds_sibling',
    patient: 'Sam Cartwright · 8M',
    diagnosis: 'Anaphylaxis — paediatric',
    difficulty: 'ST3',
    episodeId: 'ep_birthday_party',
    shared: 'in shift with Beth (his sister)',
  },
  {
    caseId: 'case_ectopic_minors_sarah',
    patient: 'Sarah Hassan · 31F',
    diagnosis: 'Ruptured ectopic pregnancy',
    difficulty: 'CT2',
    episodeId: 'ep_hendo_shift',
    shared: 'in shift with Beth (the hen-do)',
  },
  {
    caseId: 'case_chest_pain_patel_ambient',
    patient: 'Anjali Patel · 72F',
    diagnosis: 'Anterior STEMI (atypical presentation)',
    difficulty: 'CT2',
    episodeId: 'ep_hendo_shift',
    shared: 'in shift as the ambient pivot to Beth',
  },
  {
    caseId: 'case_dka_marcus',
    patient: 'Marcus Brooks · 19M',
    diagnosis: 'Severe DKA — first-presentation T1DM',
    difficulty: 'ST3',
    episodeId: 'ep_overnight_metabolic',
    shared: 'in shift with Mrs Morrison (urosepsis)',
  },
  {
    caseId: 'case_paeds_dka_amir',
    patient: 'Amir Khan · 8M',
    diagnosis: 'Severe paediatric DKA — first-presentation',
    difficulty: 'ST3',
    episodeId: 'ep_paeds_dka_solo',
  },
  {
    caseId: 'case_acute_heart_failure_ahmed',
    patient: 'Yusuf Ahmed · 78M',
    diagnosis: 'Acute decompensated heart failure',
    difficulty: 'ST3',
    episodeId: 'ep_ahf_solo',
  },
  {
    caseId: 'case_aortic_dissection_okafor',
    patient: 'Chukwuma Okafor · 52M',
    diagnosis: 'Type A aortic dissection',
    difficulty: 'ST3',
    episodeId: 'ep_dissection_solo',
  },
  {
    caseId: 'case_head_injury_doac_brennan',
    patient: 'Margaret Brennan · 81F',
    diagnosis: 'Head injury on DOAC',
    difficulty: 'CT2',
    episodeId: 'ep_head_injury_doac',
  },
  {
    caseId: 'case_htn_emergency_oduya',
    patient: 'Emeka Oduya · 56M',
    diagnosis: 'Hypertensive emergency + PRES',
    difficulty: 'CT2',
    episodeId: 'ep_htn_emergency_solo',
  },
  {
    caseId: 'case_intox_stan_ambient',
    patient: 'Stan Williams · 58M',
    diagnosis: 'Intoxication + occult head injury',
    difficulty: 'ST3',
    episodeId: 'ep_overnight_safety_net',
    shared: 'in the overnight safety-net shift with Chloe',
  },
  {
    caseId: 'case_massive_pe_okonkwo',
    patient: 'Chioma Okonkwo · 34F',
    diagnosis: 'High-risk pulmonary embolism',
    difficulty: 'ST3',
    episodeId: 'ep_pe_solo',
  },
  {
    caseId: 'case_paracetamol_od_chloe',
    patient: 'Chloe Davies · 19F',
    diagnosis: 'Staggered paracetamol overdose',
    difficulty: 'ST3',
    episodeId: 'ep_paracetamol_solo',
  },
  {
    caseId: 'case_sepsis_uti_morrison',
    patient: 'Annie Morrison · 84F',
    diagnosis: 'Urosepsis + septic shock',
    difficulty: 'CT2',
    episodeId: 'ep_overnight_sepsis_solo',
  },
  {
    caseId: 'case_status_epilepticus_priya',
    patient: 'Priya Sharma · 28F',
    diagnosis: 'Refractory status epilepticus + SAH',
    difficulty: 'ST3',
    episodeId: 'ep_seizure_solo',
  },
  {
    caseId: 'case_stroke_acute_williams',
    patient: 'Robert Williams · 72M',
    diagnosis: 'Acute LMCA stroke on apixaban',
    difficulty: 'CT2',
    episodeId: 'ep_stroke_solo',
  },
  {
    caseId: 'case_ugib_variceal_kowalski',
    patient: 'Tomasz Kowalski · 54M',
    diagnosis: 'Massive variceal UGIB (Child-Pugh C)',
    difficulty: 'ST3',
    episodeId: 'ep_ugib_solo',
  },
];

interface Props {
  onPick: (episodeId: string) => void;
  onExit: () => void;
}

export function CasePracticeScreen({ onPick, onExit }: Props) {
  return (
    <div className="practice">
      <header className="practice__head">
        <div>
          <h2>Practice library</h2>
          <p>Drill any patient on their most-focused shift. Solo where possible; connected shift where not.</p>
        </div>
        <button type="button" onClick={onExit} className="practice__exit">
          ← back to menu
        </button>
      </header>
      <ul className="practice__grid">
        {CASES.map((c) => (
          <li key={c.caseId} className="practice__card">
            <div className="practice__chip">{c.difficulty}</div>
            <h3 className="practice__patient">{c.patient}</h3>
            <p className="practice__diagnosis">{c.diagnosis}</p>
            {c.shared && <p className="practice__shared">{c.shared}</p>}
            <button
              type="button"
              className="practice__start"
              onClick={() => onPick(c.episodeId)}
            >
              Practice this case →
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

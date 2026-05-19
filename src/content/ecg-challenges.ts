/**
 * Daily ECG challenge bank (M15).
 *
 * Hand-authored, cited against UK practice (Resus Council UK 2021,
 * NICE NG196/CG126 where relevant). One per day-of-week rotation.
 * Three steps each: rhythm → critical abnormality → immediate action.
 */
export interface EcgStep {
  prompt: string;
  options: string[];
  correctIndex: number;
  rationale: string;
}

export interface EcgChallenge {
  id: string;
  title: string;
  /** Short clinical context surfacing the patient. */
  context: string;
  /** ASCII / text rendering of the rhythm (no SVG yet). */
  strip: string;
  steps: EcgStep[];
  sources: string[];
}

export const ECG_BANK: EcgChallenge[] = [
  {
    id: 'ecg_001_complete_heart_block',
    title: 'Mobitz II vs complete heart block in syncope',
    context:
      '76 y/o woman, recurrent syncope. HR 38, BP 132/78, GCS 15. Reports two collapses in the last 24 h.',
    strip:
      'Lead II rhythm strip:\n  P P P P P P P P P P P P\n  | | | | | | | | | | | |\n  Q---Q-----Q---Q-----Q---\n\nP waves regular at 90/min; QRS narrow,\nregular at 38/min, with no consistent\nrelationship to the P waves.',
    steps: [
      {
        prompt: 'Identify the rhythm.',
        options: [
          'Sinus bradycardia',
          'Mobitz type I (Wenckebach) AV block',
          'Mobitz type II AV block',
          'Complete (third-degree) AV block',
        ],
        correctIndex: 3,
        rationale:
          'P waves and QRS complexes are dissociated — no relationship between atria and ventricles. Atrial rate ~90, ventricular escape ~38, narrow complex (junctional escape). This is complete AV block.',
      },
      {
        prompt: 'What is the immediate concern?',
        options: [
          'Cardiogenic shock from rate dependence',
          'Asystole / sudden cardiac death from escape rhythm failure',
          'Atrial fibrillation with rapid ventricular response',
          'Pulmonary embolism',
        ],
        correctIndex: 1,
        rationale:
          'Complete heart block with syncope is a Class I indication for pacing. The escape can fail at any moment, producing asystole and sudden death.',
      },
      {
        prompt: 'Immediate intervention?',
        options: [
          'Permanent pacemaker insertion — refer cardiology now',
          'IV adenosine 6 mg',
          'IV atropine 500 mcg and observe in majors',
          'IV digoxin loading dose',
        ],
        correctIndex: 0,
        rationale:
          'Per Resus Council UK / ESC pacing: symptomatic complete AV block requires permanent pacing. Atropine is unlikely to work in infranodal block and only buys minutes; transcutaneous pacing as a bridge while cardiology mobilises.',
      },
    ],
    sources: ['ESC 2021 Pacing Guidelines', 'Resus Council UK 2021 — Adult Bradycardia algorithm'],
  },
  {
    id: 'ecg_002_anterior_stemi',
    title: 'Chest pain with widespread ST elevation',
    context:
      '64 y/o man, central crushing chest pain 90 minutes, sweaty. HR 96, BP 142/82, SpO2 95%.',
    strip:
      '12-lead summary:\n  V1: ST↑ 4 mm, hyperacute T\n  V2: ST↑ 5 mm\n  V3: ST↑ 4 mm\n  V4: ST↑ 3 mm\n  I, aVL: ST↑ 1 mm\n  II, III, aVF: ST↓ 1 mm (reciprocal)\n  Q wave forming V1–V3',
    steps: [
      {
        prompt: 'Identify the ECG diagnosis.',
        options: [
          'Pericarditis',
          'Anterior STEMI (LAD territory)',
          'Inferior STEMI (RCA territory)',
          'Left bundle branch block',
        ],
        correctIndex: 1,
        rationale:
          'ST elevation V1–V4 with reciprocal inferior ST depression and Q waves forming = anterior STEMI from LAD occlusion.',
      },
      {
        prompt: 'Door-to-balloon target for primary PCI?',
        options: ['≤30 min', '≤60 min', '≤90 min', '≤120 min'],
        correctIndex: 2,
        rationale:
          'NICE NG185 / ESC 2023: primary PCI target ≤120 min from first medical contact, ≤90 min where on-site PCI is available. Thrombolysis only if PCI cannot be delivered within 120 min.',
      },
      {
        prompt: 'Most appropriate immediate management?',
        options: [
          'Aspirin 300 mg, dual antiplatelet, activate PPCI pathway',
          'IV thrombolysis (tenecteplase) within 30 min',
          'High-dose aspirin and admit CCU for observation',
          'IV beta-blocker before transfer',
        ],
        correctIndex: 0,
        rationale:
          'Activate primary PCI: aspirin 300 mg chewed, second antiplatelet (prasugrel/ticagrelor per local pathway), heparin per cath lab protocol, transfer for emergent PCI. Routine pre-hospital IV beta-blockade is not recommended (COMMIT).',
      },
    ],
    sources: ['NICE NG185 ACS 2020', 'ESC 2023 STEMI guidelines'],
  },
  {
    id: 'ecg_003_torsades',
    title: 'Wide irregular tachycardia after antiemetic',
    context:
      '32 y/o woman, breast cancer, vomiting on chemotherapy. Received IV ondansetron + IV haloperidol earlier today. Just collapsed.',
    strip:
      'Lead II rhythm strip:\n  Polymorphic wide-complex tachycardia.\n  QRS axis twists around isoelectric line.\n  Rate ~260/min, irregular.\n  Prior ECG: QTc 540 ms.',
    steps: [
      {
        prompt: 'Identify the rhythm.',
        options: [
          'Monomorphic ventricular tachycardia',
          'Polymorphic VT — torsades de pointes',
          'Ventricular fibrillation',
          'Atrial fibrillation with aberrancy',
        ],
        correctIndex: 1,
        rationale:
          'Polymorphic VT with twisting axis on a background of long QT (drug-induced — ondansetron + haloperidol both prolong QT). Classic torsades.',
      },
      {
        prompt: 'First-line drug treatment (assuming a pulse)?',
        options: [
          'IV amiodarone 300 mg',
          'IV magnesium sulphate 2 g over 10 min',
          'IV adenosine 6 mg',
          'IV lignocaine 100 mg',
        ],
        correctIndex: 1,
        rationale:
          'IV magnesium 2 g over 10 min is first-line for torsades whether or not magnesium is low. Amiodarone can prolong QT further. Stop offending drugs; correct K+ ≥ 4.5 and Mg ≥ 1.0.',
      },
      {
        prompt: 'If torsades is recurrent and refractory to magnesium?',
        options: [
          'IV phenytoin loading',
          'Overdrive pacing OR isoprenaline infusion to shorten QT',
          'Synchronised DC cardioversion at 50 J',
          'IV bisoprolol bolus',
        ],
        correctIndex: 1,
        rationale:
          'Recurrent torsades: shorten QT by increasing the heart rate — overdrive pacing (atrial or ventricular) or isoprenaline. Avoid further QT-prolonging drugs.',
      },
    ],
    sources: ['Resus Council UK ALS — Periarrest Arrhythmias', 'BNF / MHRA QT-prolongation alerts'],
  },
  {
    id: 'ecg_004_hyperkalaemia',
    title: 'Renal failure, peaked T waves',
    context:
      '68 y/o man, missed dialysis x2. Drowsy, K+ 7.4 on VBG. HR 48, BP 102/64. RR 22.',
    strip:
      '12-lead summary:\n  Sinus bradycardia 46/min\n  P waves flattening\n  PR prolonged (240 ms)\n  Tall peaked T waves V2–V5\n  QRS widening (120 ms) — sine-wave forming\n  No discrete ST segment',
    steps: [
      {
        prompt: 'Most urgent intervention (membrane stabilisation)?',
        options: [
          'IV calcium gluconate 10% 10 mL (or calcium chloride 10% 10 mL)',
          'IV insulin 10 units actrapid + 50 mL 50% dextrose',
          'Nebulised salbutamol 10 mg',
          'Calcium resonium / patiromer',
        ],
        correctIndex: 0,
        rationale:
          'Any ECG changes in hyperkalaemia → IV calcium FIRST to stabilise the myocardium. Insulin/dextrose and salbutamol shift potassium intracellularly afterwards. Calcium does not lower K+ but buys minutes.',
      },
      {
        prompt: 'Definitive treatment for K+ 7.4 with ECG changes?',
        options: [
          'Wait for diuresis',
          'Sodium bicarbonate 8.4% IV',
          'Emergent haemodialysis (call renal)',
          'Repeat insulin / dextrose every 30 min',
        ],
        correctIndex: 2,
        rationale:
          'Persistent severe hyperkalaemia with ECG changes in a dialysis-dependent patient → emergent dialysis. Insulin/dextrose buys time only; calcium protects only briefly.',
      },
      {
        prompt: 'Which ECG sign is the latest / pre-arrest pattern?',
        options: ['Peaked T waves', 'PR prolongation', 'Sine-wave QRS', 'Bradycardia'],
        correctIndex: 2,
        rationale:
          'Hyperkalaemia ECG progression: peaked T → PR prolongation → P-wave loss → QRS widening → sine wave → asystole/VF. Sine wave is peri-arrest.',
      },
    ],
    sources: ['Renal Association UK 2023 — Hyperkalaemia', 'Resus Council UK ALS appendix'],
  },
  {
    id: 'ecg_005_pe_pattern',
    title: 'Pleuritic chest pain, S1Q3T3',
    context:
      '47 y/o, day-7 post-laparoscopic hysterectomy. Sudden SOB and pleuritic L chest pain. HR 124, BP 92/58, SpO2 86% RA.',
    strip:
      '12-lead summary:\n  Sinus tachycardia 124/min\n  S wave in lead I (deep)\n  Q wave + T-wave inversion in lead III (S1Q3T3)\n  TWI in V1–V3 (RV strain)\n  RBBB pattern emerging',
    steps: [
      {
        prompt: 'Most likely diagnosis given the clinical context?',
        options: [
          'Inferior STEMI',
          'Massive pulmonary embolism',
          'Pneumothorax',
          'Pericarditis',
        ],
        correctIndex: 1,
        rationale:
          'Post-op + sudden SOB + hypotension + SpO2 86% + S1Q3T3 + RV strain = high pretest PE. D-dimer not indicated; clinical instability warrants direct imaging or empirical thrombolysis if peri-arrest.',
      },
      {
        prompt: 'Most appropriate first investigation?',
        options: [
          'D-dimer assay',
          'CT pulmonary angiogram (or bedside echo if too unstable to scan)',
          'Wells score then D-dimer',
          'V/Q scan',
        ],
        correctIndex: 1,
        rationale:
          'High pre-test probability + haemodynamic instability — CTPA directly (or bedside RV-focused echo if patient is too unstable to leave resus). D-dimer is for low-probability patients to rule out, not to confirm here.',
      },
      {
        prompt: 'Patient now peri-arrest with SBP 70 — best management?',
        options: [
          'IV thrombolysis (alteplase 50 mg bolus + 50 mg over 1 h)',
          'IV unfractionated heparin only',
          'IV adrenaline infusion + observe',
          'Transfer to CT for definitive imaging first',
        ],
        correctIndex: 0,
        rationale:
          'High-risk (massive) PE with shock or peri-arrest = systemic thrombolysis (alteplase). Do not delay for imaging if peri-arrest. Bedside echo confirming RV strain is enough.',
      },
    ],
    sources: ['ESC 2019 PE guidelines', 'Resus Council UK ALS — peri-arrest PE'],
  },
  {
    id: 'ecg_006_avnrt',
    title: 'Sudden palpitations in a young woman',
    context:
      '26 y/o, palpitations on and off for years, this one onset 25 min ago. HR 188, BP 118/74, GCS 15.',
    strip:
      '12-lead summary:\n  Narrow-complex regular tachycardia 188/min\n  No discrete P waves visible\n  Pseudo-R in V1, pseudo-S in II/III/aVF\n  Sudden onset and offset reported',
    steps: [
      {
        prompt: 'Most likely rhythm?',
        options: [
          'Sinus tachycardia',
          'AV-nodal re-entrant tachycardia (AVNRT)',
          'Atrial flutter with 2:1 block',
          'Ventricular tachycardia',
        ],
        correctIndex: 1,
        rationale:
          'Narrow complex regular, ~180/min, no obvious P, pseudo-R in V1: AVNRT. Sinus tachy is typically slower with visible P. AVRT (orthodromic via accessory pathway) looks similar; AVNRT is more common.',
      },
      {
        prompt: 'First intervention (stable patient)?',
        options: [
          'Synchronised DC cardioversion at 100 J',
          'Vagal manoeuvres (Valsalva, modified Valsalva)',
          'IV adenosine 6 mg bolus',
          'IV verapamil 5 mg bolus',
        ],
        correctIndex: 1,
        rationale:
          'Stable AVNRT — vagal first. Modified Valsalva (REVERT trial) terminates ~43% vs ~17% for standard. Then adenosine if vagals fail.',
      },
      {
        prompt: 'Vagal failed. Best second-line drug?',
        options: [
          'IV adenosine 6 mg fast push, followed by 12 mg if no effect',
          'IV amiodarone 300 mg over 20 min',
          'IV digoxin 500 mcg over 30 min',
          'IV lignocaine 100 mg',
        ],
        correctIndex: 0,
        rationale:
          'Adenosine 6 mg → 12 mg → 12 mg, rapid push followed by saline flush, central-large-vein cannula. Warn the patient about transient asystole. Avoid in known asthma (use verapamil).',
      },
    ],
    sources: ['Resus Council UK ALS — Tachycardia algorithm', 'REVERT trial 2015'],
  },
  {
    id: 'ecg_008_atrial_flutter',
    title: 'Tachycardia at exactly 150 — sawtooth or coincidence?',
    context:
      '68 y/o man, palpitations 4 h, mild SOB. HR 150, BP 132/82, GCS 15. PMH: hypertension, mild renal impairment.',
    strip:
      '12-lead summary:\n  Narrow-complex regular tachycardia 150/min\n  Sawtooth flutter waves visible in II/III/aVF\n  P:QRS = 2:1\n  Atrial rate ~300/min\n  No ST-segment change',
    steps: [
      {
        prompt: 'Most likely rhythm?',
        options: [
          'Sinus tachycardia',
          'AVNRT',
          'Atrial flutter with 2:1 AV block',
          'Ventricular tachycardia',
        ],
        correctIndex: 2,
        rationale:
          'Narrow, regular, exactly 150/min, sawtooth pattern in inferior leads — atrial flutter with 2:1 block. The classic "150 ± a few bpm" should always raise atrial flutter as the prime differential.',
      },
      {
        prompt: 'A new-onset, haemodynamically stable atrial flutter — first-line?',
        options: [
          'IV digoxin 500 mcg slow',
          'Rate control (IV bisoprolol or diltiazem) + anticoagulation per CHA₂DS₂-VASc + plan electrical cardioversion / TOE-guided',
          'Synchronised DC cardioversion now without anticoagulation',
          'IV adenosine 6 mg bolus to cardiovert',
        ],
        correctIndex: 1,
        rationale:
          'Stable atrial flutter <48 h still carries embolic risk per UK guidance; anticoagulate per CHA₂DS₂-VASc, rate-control while planning rhythm strategy. Adenosine only unmasks flutter — does not cardiovert.',
      },
      {
        prompt: 'If patient becomes hypotensive (SBP 80) and drowsy — next step?',
        options: [
          'IV amiodarone 300 mg over 20 min',
          'Synchronised DC cardioversion (75–100 J biphasic, anaesthetic input)',
          'IV verapamil 5 mg bolus',
          'Vagal manoeuvres',
        ],
        correctIndex: 1,
        rationale:
          'Adverse features (shock, syncope, MI, heart failure) → synchronised DC cardioversion per Resus Council UK tachycardia algorithm. Stable patient = drug. Unstable patient = electricity.',
      },
    ],
    sources: [
      'Resus Council UK 2021 — Adult Tachycardia algorithm',
      'NICE NG196 atrial fibrillation 2021 (applies to flutter)',
    ],
  },
  {
    id: 'ecg_009_third_degree_inferior',
    title: 'Inferior STEMI with bradycardia',
    context:
      '58 y/o man, central crushing pain 50 min, sweaty, nauseated. HR 42, BP 86/54, SpO2 97%. Diaphoretic, mildly confused.',
    strip:
      '12-lead summary:\n  Bradycardia ~42/min\n  Lead II/III/aVF: ST↑ 3 mm with Q waves\n  Reciprocal ST↓ in I/aVL\n  V1: ST↑ 1 mm (RV involvement)\n  Complete AV block — P waves dissociated from narrow escape',
    steps: [
      {
        prompt: 'ECG diagnosis?',
        options: [
          'Inferior STEMI + RV infarct + complete AV block',
          'Anterior STEMI',
          'Pericarditis',
          'Left bundle branch block',
        ],
        correctIndex: 0,
        rationale:
          'Inferior ST elevation (II/III/aVF) + V1 ST elevation = right coronary artery occlusion proximal to AV nodal branch. Bradyarrhythmia + RV infarction = hypotension. Always check V4R when inferior STEMI bradycardia/hypotension to confirm.',
      },
      {
        prompt: 'BP 86/54, drowsy — first haemodynamic intervention?',
        options: [
          'GTN 800 mcg sublingual',
          'IV fluid 250–500 mL crystalloid bolus (RV infarct preload-dependent)',
          'IV furosemide 40 mg',
          'IV morphine 5 mg',
        ],
        correctIndex: 1,
        rationale:
          'RV infarction is preload-dependent. Cautious crystalloid bolus + avoid nitrates / diuretics / morphine that drop preload. Activate primary PCI as you fluid-resuscitate.',
      },
      {
        prompt: 'Most appropriate definitive treatment?',
        options: [
          'Thrombolysis with tenecteplase',
          'Primary PCI — activate cath lab now',
          'Conservative management — ACS pathway, troponin in 3 h',
          'Beta-blocker + ACE inhibitor on the ward',
        ],
        correctIndex: 1,
        rationale:
          'STEMI = primary PCI within 120 min. Atropine 500 mcg may bridge bradycardia; transcutaneous pacing if escape fails. Avoid GTN/morphine/IV nitrates in RV infarct.',
      },
    ],
    sources: ['NICE NG185 ACS 2020', 'ESC 2023 STEMI guidelines'],
  },
  {
    id: 'ecg_010_wpw_af',
    title: 'Irregular wide-complex tachycardia in a young patient',
    context:
      '22 y/o woman, sudden palpitations 30 min, mild light-headedness. HR irregularly 200–260, BP 102/68, GCS 15.',
    strip:
      '12-lead summary:\n  Irregular, irregular tachycardia\n  Wide complexes (QRS 140 ms), variable morphology\n  Rate fluctuates 200–260/min\n  Some narrow complexes interspersed (variable conduction)\n  Prior ECG (1 year ago): short PR + delta wave',
    steps: [
      {
        prompt: 'Most likely diagnosis?',
        options: [
          'Atrial fibrillation with rate-related aberrancy',
          'AF in pre-excited (WPW) conduction via accessory pathway',
          'Polymorphic VT',
          'Idioventricular rhythm',
        ],
        correctIndex: 1,
        rationale:
          'Irregularly irregular + wide + extreme tachycardia (>250) + history of delta waves = AF conducting via an accessory pathway (pre-excited AF). The pathway has no AV-node refractoriness, so rates >250 are possible and risk VF.',
      },
      {
        prompt: 'Worst drug to give in this rhythm?',
        options: [
          'IV amiodarone',
          'IV procainamide',
          'IV adenosine, verapamil, beta-blocker or digoxin (all AV-node blockers)',
          'Synchronised DC cardioversion',
        ],
        correctIndex: 2,
        rationale:
          'AV-node blockers (adenosine, verapamil, beta-blocker, digoxin) divert conduction down the accessory pathway, accelerate ventricular rates and can precipitate VF in pre-excited AF. This is the FRCEM trap.',
      },
      {
        prompt: 'Safest definitive ED management of haemodynamically stable pre-excited AF?',
        options: [
          'IV verapamil',
          'IV amiodarone bolus then infusion (or synchronised DC cardioversion if unstable)',
          'Vagal manoeuvres only',
          'Discharge for outpatient cardiology',
        ],
        correctIndex: 1,
        rationale:
          'Stable: IV amiodarone or IV procainamide; cardiology input + plan for accessory-pathway ablation. Unstable: synchronised DC cardioversion. Never AV-node blockers.',
      },
    ],
    sources: ['Resus Council UK ALS — Periarrest Arrhythmias', 'ESC 2019 SVT guidelines'],
  },
  {
    id: 'ecg_011_brugada_phenocopy',
    title: 'Syncope, fever, suspicious right precordial ECG',
    context:
      '34 y/o man, fever 39.4°C, viral URTI, syncopal episode at home. Family history of sudden death in his uncle aged 38.',
    strip:
      '12-lead summary:\n  Sinus rhythm 96/min\n  V1: coved ST elevation ≥2 mm with negative T wave\n  V2: coved ST elevation 2.5 mm with negative T wave\n  QRS 100 ms\n  No reciprocal change\n  (Type 1 Brugada pattern)',
    steps: [
      {
        prompt: 'Pattern recognition?',
        options: [
          'Anterior STEMI',
          'Type 1 Brugada ECG pattern',
          'Hyperkalaemia',
          'Hypothermia (Osborn J waves)',
        ],
        correctIndex: 1,
        rationale:
          'Coved ST elevation ≥2 mm + negative T wave in V1–V2 = Type 1 Brugada. The "Brugada phenocopy" (fever, electrolyte derangement, drugs) can unmask the same pattern. Family history of sudden death raises pre-test probability.',
      },
      {
        prompt: 'Immediate ED priority?',
        options: [
          'Discharge with safety-net — viral illness',
          'Antipyrese aggressively + cardiac monitoring + cardiology referral',
          'Thrombolysis for STEMI',
          'IV beta-blocker for tachyarrhythmia prophylaxis',
        ],
        correctIndex: 1,
        rationale:
          'Aggressive antipyrese (paracetamol, cooling) reduces VF risk in Brugada phenocopy. Continuous cardiac monitoring + urgent cardiology — they will decide ICD per recent syncope + family history.',
      },
      {
        prompt: 'Which drug class must this patient avoid?',
        options: [
          'Beta-blockers',
          'Sodium-channel blockers (flecainide, propafenone, TCAs, cocaine)',
          'ACE inhibitors',
          'Statins',
        ],
        correctIndex: 1,
        rationale:
          'Sodium-channel blockers can convert latent Brugada to Type 1 and provoke VF. The "Brugadadrugs" reference website lists exhaustive contraindications — share with the patient at discharge.',
      },
    ],
    sources: ['ESC 2022 Ventricular Arrhythmias / SCD guidelines', 'brugadadrugs.org'],
  },
  {
    id: 'ecg_007_hyperacute_t_lad',
    title: 'Chest pain with normal-looking ECG',
    context:
      '54 y/o smoker, central chest pain 40 min, sweaty. Troponin pending. HR 88, BP 138/82, SpO2 98%.',
    strip:
      '12-lead summary:\n  Sinus rhythm 88/min, normal axis\n  No ST elevation by classical criteria\n  V2–V4: prominent, broad-based, symmetric T waves\n  R wave progression preserved\n  No reciprocal change\n  (de Winter / hyperacute T pattern)',
    steps: [
      {
        prompt: 'How do you read this ECG?',
        options: [
          'Normal — discharge home with safety-net advice',
          'Anterior STEMI equivalent — de Winter T-wave / hyperacute T pattern',
          'Hyperkalaemia',
          'Early repolarisation — common benign variant',
        ],
        correctIndex: 1,
        rationale:
          'de Winter (or hyperacute T) is a STEMI equivalent: upsloping ST depression at the J point with tall symmetric T waves V2–V4, indicating LAD proximal occlusion. Without recognising it, the patient is misdiagnosed as NSTEMI and treated too slowly.',
      },
      {
        prompt: 'Disposition?',
        options: [
          'Discharge with GTN spray; outpatient cardiology',
          'NSTEMI pathway — admit ward, troponin trend, angiogram within 72 h',
          'Activate primary PCI pathway as a STEMI equivalent',
          'Repeat ECG in 30 min and decide then',
        ],
        correctIndex: 2,
        rationale:
          'Hyperacute T / de Winter is treated as STEMI: door-to-balloon ≤120 min, primary PCI pathway. Waiting for ST elevation that may never come is the trap.',
      },
      {
        prompt: 'Antiplatelet choice for primary PCI per current UK pathway?',
        options: [
          'Aspirin alone',
          'Aspirin + prasugrel (or ticagrelor)',
          'Clopidogrel alone',
          'Aspirin + low-dose unfractionated heparin only',
        ],
        correctIndex: 1,
        rationale:
          'Per NICE NG185 / ESC 2023: aspirin 300 mg + prasugrel/ticagrelor pre-cath lab unless contraindicated. Heparin is given per cath-lab protocol.',
      },
    ],
    sources: ['de Winter et al, NEJM 2008', 'NICE NG185 ACS 2020'],
  },
];

/**
 * Pick today's challenge by day-of-week (rotates through the bank).
 */
export function pickTodaysChallenge(now: Date = new Date()): EcgChallenge {
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return ECG_BANK[dayOfYear % ECG_BANK.length]!;
}

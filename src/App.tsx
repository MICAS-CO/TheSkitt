import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { parse as parseYaml } from 'yaml';
// M78: Phaser is the heaviest dependency in the boot bundle (~1.5 MB).
// The hub view is the only consumer, so lazy-load it.
const PhaserGame = lazy(() =>
  import('./ui/PhaserGame').then((m) => ({ default: m.PhaserGame })),
);
import { ShiftView } from './ui/shift/ShiftView';
import { useSim, loadShift, clearSavedShift, type SavedShift } from './state/sim';
import {
  composeConsultantMessage,
  CONSULTANT_ROLE,
  loadLastShiftMemo,
} from './state/consultant';
import { Arc, Case, Episode, type ArcT, type CaseT, type EpisodeT } from './content/schema';
import { SimKernel } from './sim/kernel';
// M78: lazy-load every menu-secondary route. Each becomes its own chunk,
// loaded only when the user clicks through. The main bundle stays focused
// on the menu + induction + active shift, which is what first-paint needs.
const EcgChallengeScreen = lazy(() =>
  import('./ui/ecg/EcgChallengeScreen').then((m) => ({ default: m.EcgChallengeScreen })),
);
const SkillTreeScreen = lazy(() =>
  import('./ui/progression/SkillTreeScreen').then((m) => ({ default: m.SkillTreeScreen })),
);
const SettingsScreen = lazy(() =>
  import('./ui/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
);
import { isStyleGuideRequested } from './ui/styleguide/url-gate';
const AssetLibraryScreen = lazy(() =>
  import('./ui/styleguide/AssetLibraryScreen').then((m) => ({ default: m.AssetLibraryScreen })),
);
const CasePracticeScreen = lazy(() =>
  import('./ui/practice/CasePracticeScreen').then((m) => ({ default: m.CasePracticeScreen })),
);
const InductionScreen = lazy(() =>
  import('./ui/induction/InductionScreen').then((m) => ({ default: m.InductionScreen })),
);
import { loadCharacter } from './state/character';
import { TIERS } from './state/difficulty';

// Solo shift (Milestone 4)
import bethYaml from '../content/cases/case_anaphylaxis_adult_peanut.yaml?raw';
import soloEpYaml from '../content/episodes/ep_anaphylaxis_solo.yaml?raw';

// Hen-do shift (Milestone 5)
import sarahYaml from '../content/cases/case_ectopic_minors_sarah.yaml?raw';
import arcYaml from '../content/arcs/arc_hendo_dinner.yaml?raw';
import hendoEpYaml from '../content/episodes/ep_hendo_shift.yaml?raw';

// Ambient board pressure (Milestone 8)
import stanYaml from '../content/cases/case_intox_stan_ambient.yaml?raw';
import patelYaml from '../content/cases/case_chest_pain_patel_ambient.yaml?raw';

// Sepsis solo (post-M8, authored from the new-case CLI skeleton)
import morrisonYaml from '../content/cases/case_sepsis_uti_morrison.yaml?raw';
import sepsisEpYaml from '../content/episodes/ep_overnight_sepsis_solo.yaml?raw';

// Overnight metabolic — DKA + sepsis 2-case
import marcusYaml from '../content/cases/case_dka_marcus.yaml?raw';
import metabolicEpYaml from '../content/episodes/ep_overnight_metabolic.yaml?raw';

// Family anaphylaxis — Beth + Sam (adult + paeds)
import samYaml from '../content/cases/case_anaphylaxis_paeds_sibling.yaml?raw';
import familyArcYaml from '../content/arcs/arc_family_peanut_party.yaml?raw';
import birthdayEpYaml from '../content/episodes/ep_birthday_party.yaml?raw';

// Stroke solo
import williamsYaml from '../content/cases/case_stroke_acute_williams.yaml?raw';
import strokeEpYaml from '../content/episodes/ep_stroke_solo.yaml?raw';

// Status epilepticus solo (with SAH twist)
import priyaYaml from '../content/cases/case_status_epilepticus_priya.yaml?raw';
import seizureEpYaml from '../content/episodes/ep_seizure_solo.yaml?raw';

// Head injury — DOAC reasoning (anticoagulated mechanical fall)
import brennanYaml from '../content/cases/case_head_injury_doac_brennan.yaml?raw';
import headInjuryEpYaml from '../content/episodes/ep_head_injury_doac.yaml?raw';

// DOAC double-bill — Williams + Brennan on the same shift
import doacDoubleEpYaml from '../content/episodes/ep_doac_double.yaml?raw';

// Aortic dissection — Type A masquerading as STEMI
import okaforYaml from '../content/cases/case_aortic_dissection_okafor.yaml?raw';
import dissectionEpYaml from '../content/episodes/ep_dissection_solo.yaml?raw';

// Variceal UGIB in a Child-Pugh C cirrhotic
import kowalskiYaml from '../content/cases/case_ugib_variceal_kowalski.yaml?raw';
import ugibEpYaml from '../content/episodes/ep_ugib_solo.yaml?raw';

// Massive PE — post-op + COCP + family thrombophilia stack
import okonkwoYaml from '../content/cases/case_massive_pe_okonkwo.yaml?raw';
import peEpYaml from '../content/episodes/ep_pe_solo.yaml?raw';

// Acute heart failure — wet-and-warm cardiogenic pulmonary oedema
import ahmedYaml from '../content/cases/case_acute_heart_failure_ahmed.yaml?raw';
import ahfEpYaml from '../content/episodes/ep_ahf_solo.yaml?raw';

// Hypertensive emergency — encephalopathy + PRES + AKI
import oduyaYaml from '../content/cases/case_htn_emergency_oduya.yaml?raw';
import htnEpYaml from '../content/episodes/ep_htn_emergency_solo.yaml?raw';

// Paracetamol overdose — staggered + safeguarding parallel
import chloeYaml from '../content/cases/case_paracetamol_od_chloe.yaml?raw';
import paracetamolEpYaml from '../content/episodes/ep_paracetamol_solo.yaml?raw';

// Overnight safety-net — Chloe + Stan with the missed-MH-follow-up arc
import safetyNetArcYaml from '../content/arcs/arc_overnight_safety_net.yaml?raw';
import safetyNetEpYaml from '../content/episodes/ep_overnight_safety_net.yaml?raw';

// Paediatric DKA — first presentation, BSPED 2020 dose-bands
import amirYaml from '../content/cases/case_paeds_dka_amir.yaml?raw';
import paedsDkaEpYaml from '../content/episodes/ep_paeds_dka_solo.yaml?raw';

type View = 'menu' | 'shift' | 'hub' | 'ecg' | 'skilltree' | 'settings' | 'styleguide' | 'practice' | 'induction';

const SUBTITLES: Record<View, string> = {
  menu: 'Episodic UK FRCEM study RPG · 17 shifts, 17 cases, 3 arcs',
  shift: 'Shift in progress',
  hub: 'ED hub (preview)',
  ecg: 'Daily ECG challenge',
  skilltree: 'Skill tree — progression across shifts',
  settings: 'Settings — preferences and local data',
  styleguide: 'Visual Style Guide — internal asset library',
  practice: 'Practice library — drill any patient',
  induction: 'Skittstown ED — induction',
};

interface ShiftPack {
  episode: EpisodeT;
  cases: CaseT[];
  arcs: ArcT[];
}

const SOLO_SHIFT: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(soloEpYaml)),
  cases: [Case.parse(parseYaml(bethYaml))],
  arcs: [],
});

const HENDO_SHIFT: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(hendoEpYaml)),
  cases: [
    Case.parse(parseYaml(bethYaml)),
    Case.parse(parseYaml(sarahYaml)),
    Case.parse(parseYaml(stanYaml)),
    Case.parse(parseYaml(patelYaml)),
  ],
  arcs: [Arc.parse(parseYaml(arcYaml))],
});

const SEPSIS_SOLO: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(sepsisEpYaml)),
  cases: [Case.parse(parseYaml(morrisonYaml))],
  arcs: [],
});

const METABOLIC_SHIFT: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(metabolicEpYaml)),
  cases: [Case.parse(parseYaml(marcusYaml)), Case.parse(parseYaml(morrisonYaml))],
  arcs: [],
});

const FAMILY_SHIFT: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(birthdayEpYaml)),
  cases: [Case.parse(parseYaml(bethYaml)), Case.parse(parseYaml(samYaml))],
  arcs: [Arc.parse(parseYaml(familyArcYaml))],
});

const STROKE_SOLO: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(strokeEpYaml)),
  cases: [Case.parse(parseYaml(williamsYaml))],
  arcs: [],
});

const SEIZURE_SOLO: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(seizureEpYaml)),
  cases: [Case.parse(parseYaml(priyaYaml))],
  arcs: [],
});

const HEAD_INJURY_DOAC: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(headInjuryEpYaml)),
  cases: [Case.parse(parseYaml(brennanYaml))],
  arcs: [],
});

const DOAC_DOUBLE: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(doacDoubleEpYaml)),
  cases: [Case.parse(parseYaml(williamsYaml)), Case.parse(parseYaml(brennanYaml))],
  arcs: [],
});

const DISSECTION_SOLO: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(dissectionEpYaml)),
  cases: [Case.parse(parseYaml(okaforYaml))],
  arcs: [],
});

const UGIB_SOLO: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(ugibEpYaml)),
  cases: [Case.parse(parseYaml(kowalskiYaml))],
  arcs: [],
});

const PE_SOLO: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(peEpYaml)),
  cases: [Case.parse(parseYaml(okonkwoYaml))],
  arcs: [],
});

const AHF_SOLO: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(ahfEpYaml)),
  cases: [Case.parse(parseYaml(ahmedYaml))],
  arcs: [],
});

const HTN_EMERGENCY_SOLO: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(htnEpYaml)),
  cases: [Case.parse(parseYaml(oduyaYaml))],
  arcs: [],
});

const PARACETAMOL_SOLO: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(paracetamolEpYaml)),
  cases: [Case.parse(parseYaml(chloeYaml))],
  arcs: [],
});

const OVERNIGHT_SAFETY_NET: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(safetyNetEpYaml)),
  cases: [Case.parse(parseYaml(chloeYaml)), Case.parse(parseYaml(stanYaml))],
  arcs: [Arc.parse(parseYaml(safetyNetArcYaml))],
});

const PAEDS_DKA_SOLO: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(paedsDkaEpYaml)),
  cases: [Case.parse(parseYaml(amirYaml))],
  arcs: [],
});

/**
 * Pick today's rotating "case of the day" by day-of-year mod the
 * number of shifts (M33). Mirrors the daily ECG bank's rotation.
 */
function pickShiftOfTheDay(shifts: { id: string }[], now: Date = new Date()): string {
  if (shifts.length === 0) return '';
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return shifts[dayOfYear % shifts.length]!.id;
}

interface ShiftDef {
  id: string;
  title: string;
  eyebrow: string;
  meta: string;
  variant?: 'primary' | 'secondary';
  factory: () => ShiftPack;
}

const SHIFT_DEFS: ShiftDef[] = [
  {
    id: 'ep_hendo_shift',
    title: 'The hen-do',
    eyebrow: 'Shift · ST3 · 20 min · 2 cases · 1 arc',
    meta: 'Anaphylaxis (resus) + ectopic pregnancy (minors), connected by shared incident. NICE NG126 · Resus Council UK 2021 · RCOG GTG 21',
    variant: 'primary',
    factory: HENDO_SHIFT,
  },
  {
    id: 'ep_birthday_party',
    title: 'Family anaphylaxis — adult + paeds',
    eyebrow: 'Shift · ST3 · 20 min · 2 cases · 1 arc',
    meta: 'Beth + her 8y/o brother Sam. Resus Council UK 2021 algorithm, two dose bands, one shift.',
    factory: FAMILY_SHIFT,
  },
  {
    id: 'ep_overnight_metabolic',
    title: 'Overnight: metabolic resus',
    eyebrow: 'Shift · ST3 · 20 min · 2 cases',
    meta: 'New-onset DKA + urosepsis on the same shift. JBDS-IP + NICE NG51. Two time-critical bundles in parallel.',
    factory: METABOLIC_SHIFT,
  },
  {
    id: 'ep_overnight_sepsis_solo',
    title: 'Overnight: sepsis solo',
    eyebrow: 'Shift · CT2 · 20 min · 1 case',
    meta: 'Urosepsis with evolving septic shock. NICE NG51 + Sepsis Six + advance care plan.',
    factory: SEPSIS_SOLO,
  },
  {
    id: 'ep_stroke_solo',
    title: 'Stroke onset — thrombolysis window',
    eyebrow: 'Shift · CT2 · 20 min · 1 case',
    meta: 'Witnessed LMCA stroke on apixaban. NICE NG128 + DOAC contraindication + thrombectomy referral.',
    factory: STROKE_SOLO,
  },
  {
    id: 'ep_seizure_solo',
    title: 'First seizure — status pathway',
    eyebrow: 'Shift · ST3 · 20 min · 1 case',
    meta: 'Refractory status in a pregnant 28-y/o. NICE NG217 (2022) + MHRA Valproate PPP + a CT twist.',
    factory: SEIZURE_SOLO,
  },
  {
    id: 'ep_head_injury_doac',
    title: 'Head injury — DOAC reasoning',
    eyebrow: 'Shift · CT2 · 20 min · 1 case',
    meta: 'Anticoagulated faller, GCS 15 on arrival. NICE NG232 + Canadian C-spine + NICE TA697 andexanet.',
    factory: HEAD_INJURY_DOAC,
  },
  {
    id: 'ep_doac_double',
    title: 'DOAC double-bill — clot and bleed',
    eyebrow: 'Shift · ST3 · 20 min · 2 cases',
    meta: 'Williams (ischaemic LVO on apixaban) + Brennan (SDH on apixaban) on the same shift. Reperfusion vs reversal in parallel.',
    factory: DOAC_DOUBLE,
  },
  {
    id: 'ep_dissection_solo',
    title: 'Aortic dissection — the anchor-breaker',
    eyebrow: 'Shift · ST3 · 20 min · 1 case',
    meta: 'Type A AD masquerading as inferior STEMI. Cath lab pre-alerted, the call is yours. ADD-RS + ESC 2024 + IRAD mortality clock.',
    factory: DISSECTION_SOLO,
  },
  {
    id: 'ep_ugib_solo',
    title: 'Variceal UGIB — Sepsis Six of the liver',
    eyebrow: 'Shift · ST3 · 20 min · 1 case',
    meta: 'Massive haematemesis in a Child-Pugh C cirrhotic. NICE CG141 + BSG 2015 + HALT-IT. Restrictive Hb 7–8, terlipressin + ceftriaxone bundle.',
    factory: UGIB_SOLO,
  },
  {
    id: 'ep_pe_solo',
    title: 'Massive PE — shock and the thrombolysis decision',
    eyebrow: 'Shift · ST3 · 20 min · 1 case',
    meta: 'Post-op + COCP shock-state PE with RV strain. NICE NG158 + ESC 2019. The bedside-echo + DVT scan pivot lets you start reperfusion without leaving resus.',
    factory: PE_SOLO,
  },
  {
    id: 'ep_ahf_solo',
    title: 'Acute heart failure — pre-op diuretic-hold decomp',
    eyebrow: 'Shift · ST3 · 20 min · 1 case',
    meta: 'Wet-and-warm cardiogenic pulmonary oedema in a 78y/o off-diuretic for elective surgery. NICE NG106 + ESC 2021 + 3CPO. CPAP + GTN + furosemide bundle; no fluid, no morphine.',
    factory: AHF_SOLO,
  },
  {
    id: 'ep_htn_emergency_solo',
    title: 'Hypertensive emergency — controlled BP reduction',
    eyebrow: 'Shift · CT2 · 20 min · 1 case',
    meta: 'BP 226/132 with encephalopathy + PRES + AKI Stage 2 + grade IV retinopathy. NICE NG136 + RCEM + ESH 2023. 10-25% reduction in 1 h — discipline over speed.',
    factory: HTN_EMERGENCY_SOLO,
  },
  {
    id: 'ep_paracetamol_solo',
    title: 'Paracetamol overdose — staggered, safeguarding parallel',
    eyebrow: 'Shift · ST3 · 20 min · 1 case',
    meta: '19 y/o student, ~16 g paracetamol spread over 5 hours. The staggered-vs-acute trap (nomogram doesn’t apply; NAC regardless of level) + the NICE NG225 parallel safeguarding pathway.',
    factory: PARACETAMOL_SOLO,
  },
  {
    id: 'ep_overnight_safety_net',
    title: 'Overnight — the safety net',
    eyebrow: 'Shift · ST3 · 25 min · 2 cases · 1 arc',
    meta: 'Chloe (staggered paracetamol) + Stan (intoxicated witnessed fall). The arc surfaces the shared system-failure: each had prior ED visits with no MH follow-up. NICE NG225 thinking applied across two presentations.',
    factory: OVERNIGHT_SAFETY_NET,
  },
  {
    id: 'ep_paeds_dka_solo',
    title: 'Paediatric DKA — BSPED-vs-JBDS dose bands',
    eyebrow: 'Shift · ST3 · 25 min · 1 case · paeds',
    meta: '8 y/o new-onset T1DM, severe DKA (pH 7.04, ketones 5.6). Tests the paediatric-vs-adult dose-band discipline: 10 mL/kg saline bolus, 48-h deficit, insulin H+1 after fluids. Cerebral oedema vigilance.',
    factory: PAEDS_DKA_SOLO,
  },
  {
    id: 'ep_anaphylaxis_solo',
    title: 'Anaphylaxis solo',
    eyebrow: 'Shift · CT2 · 20 min · 1 case',
    meta: 'Single-case milestone-4 build. Adult anaphylaxis on the clock.',
    factory: SOLO_SHIFT,
  },
];

const KNOWN_SHIFTS: Record<string, () => ShiftPack> = Object.fromEntries(
  SHIFT_DEFS.map((s) => [s.id, s.factory]),
);

export function App() {
  // M46: hidden ?style-guide=1 URL gate opens the Asset Library without
  // exposing it on the menu. Design uses this to verify drops in-browser.
  // M74: first-run gate. If no character is on disk yet (and they
  // didn't ask for the style guide), drop into Skittstown induction.
  const [view, setView] = useState<View>(() => {
    if (isStyleGuideRequested()) return 'styleguide';
    const c = loadCharacter();
    if (!c || !c.inducted) return 'induction';
    return 'menu';
  });
  const [saved, setSaved] = useState<SavedShift | null>(null);
  const initSim = useSim((s) => s.init);
  const destroySim = useSim((s) => s.destroy);

  // Look for a saved shift on mount and after every menu return.
  useEffect(() => {
    if (view === 'menu') setSaved(loadShift());
  }, [view]);

  function startShift(pack: ShiftPack) {
    clearSavedShift();
    const kernel = new SimKernel({
      episode: pack.episode,
      cases: new Map(pack.cases.map((c) => [c.id, c])),
      arcs: new Map(pack.arcs.map((a) => [a.id, a])),
    });
    initSim(kernel);
    setView('shift');
  }

  function resumeSavedShift() {
    if (!saved) return;
    const make = KNOWN_SHIFTS[saved.snapshot.episodeId];
    if (!make) {
      clearSavedShift();
      setSaved(null);
      return;
    }
    const pack = make();
    const kernel = new SimKernel({
      episode: pack.episode,
      cases: new Map(pack.cases.map((c) => [c.id, c])),
      arcs: new Map(pack.arcs.map((a) => [a.id, a])),
      restore: saved.snapshot,
    });
    initSim(kernel);
    setView('shift');
  }

  function exitShift() {
    destroySim();
    setView('menu');
  }

  function replayShift(episodeId: string) {
    const make = KNOWN_SHIFTS[episodeId];
    if (!make) {
      exitShift();
      return;
    }
    destroySim();
    clearSavedShift();
    startShift(make());
  }

  function clearAndForget() {
    clearSavedShift();
    setSaved(null);
  }

  return (
    <div className="app">
      <header className="app__header">
        <img
          className="app__icon"
          src="/app-icon.svg"
          alt=""
          aria-hidden="true"
          width={36}
          height={36}
        />
        <h1 className="app__title">The Skitt</h1>
        <p className="app__subtitle">{SUBTITLES[view]}</p>
      </header>

      <main className="app__stage">
        {view === 'menu' && (
          <MenuView
            shifts={SHIFT_DEFS}
            onStart={(id) => {
              const def = SHIFT_DEFS.find((s) => s.id === id);
              if (def) startShift(def.factory());
            }}
            onShowHub={() => setView('hub')}
            onShowEcg={() => setView('ecg')}
            onShowPractice={() => setView('practice')}
            onShowSkillTree={() => setView('skilltree')}
            onShowSettings={() => setView('settings')}
            saved={saved}
            onResume={resumeSavedShift}
            onClearSave={clearAndForget}
          />
        )}
        {view === 'shift' && <ShiftView onExit={exitShift} onReplay={replayShift} />}
        {view === 'hub' && (
          <Suspense fallback={<div className="app__loading">Loading hub…</div>}>
            <PhaserGame />
          </Suspense>
        )}
        {view === 'ecg' && (
          <Suspense fallback={<div className="app__loading">Loading ECG drill…</div>}>
            <EcgChallengeScreen onExit={() => setView('menu')} />
          </Suspense>
        )}
        {view === 'skilltree' && (
          <Suspense fallback={<div className="app__loading">Loading skill tree…</div>}>
            <SkillTreeScreen onExit={() => setView('menu')} />
          </Suspense>
        )}
        {view === 'settings' && (
          <Suspense fallback={<div className="app__loading">Loading settings…</div>}>
            <SettingsScreen onExit={() => setView('menu')} />
          </Suspense>
        )}
        {view === 'styleguide' && (
          <Suspense fallback={<div className="app__loading">Loading style guide…</div>}>
            <AssetLibraryScreen onExit={() => setView('menu')} />
          </Suspense>
        )}
        {view === 'practice' && (
          <Suspense fallback={<div className="app__loading">Loading case library…</div>}>
            <CasePracticeScreen
              onPick={(episodeId) => {
                const def = SHIFT_DEFS.find((s) => s.id === episodeId);
                if (def) startShift(def.factory());
              }}
              onExit={() => setView('menu')}
            />
          </Suspense>
        )}
        {view === 'induction' && (
          <Suspense fallback={<div className="app__loading">Loading induction…</div>}>
            <InductionScreen onComplete={() => setView('menu')} />
          </Suspense>
        )}
      </main>

      <footer className="app__footer">
        <span>v0.0.1</span>
        {view === 'hub' && (
          <button className="app__back" onClick={() => setView('menu')}>
            ← back to menu
          </button>
        )}
        <span className="app__disclaimer">
          Study material for UK FRCEM candidates. Not medical advice. Not a substitute for
          supervised clinical training.
        </span>
        <a
          className="app__tcr-mark"
          href="https://thecase.report"
          target="_blank"
          rel="noopener noreferrer"
          title="A TheCase.Report project"
        >
          <img src="/tcr-lockup.svg" alt="TheCase.Report" />
        </a>
      </footer>
    </div>
  );
}

function MenuView({
  shifts,
  onStart,
  onShowHub,
  onShowEcg,
  onShowPractice,
  onShowSkillTree,
  onShowSettings,
  saved,
  onResume,
  onClearSave,
}: {
  shifts: ShiftDef[];
  onStart: (id: string) => void;
  onShowHub: () => void;
  onShowEcg: () => void;
  onShowPractice: () => void;
  onShowSkillTree: () => void;
  onShowSettings: () => void;
  saved: SavedShift | null;
  onResume: () => void;
  onClearSave: () => void;
}) {
  const dailyShiftId = useMemo(() => pickShiftOfTheDay(shifts), [shifts]);
  const consultantMemo = useMemo(() => loadLastShiftMemo(), []);
  const character = useMemo(() => loadCharacter(), []);
  const consultantMessage = useMemo(
    () => (consultantMemo ? composeConsultantMessage(consultantMemo, character?.firstName) : null),
    [consultantMemo, character],
  );
  const tier = character ? TIERS[character.role] : null;
  return (
    <div className="menu">
      <div className="menu__inner">
        <h2 className="menu__title">Shift menu</h2>
        {character && tier && (
          <div className="menu__badge" aria-label="Active doctor + difficulty tier">
            <span className="menu__badge-name">
              Dr {character.firstName} {character.lastName}
            </span>
            <span className="menu__badge-tier">{tier.label}</span>
            <span className="menu__badge-blurb">{tier.blurb}</span>
          </div>
        )}
        {consultantMessage && (
          <aside className={`menu__memo menu__memo--${consultantMemo!.band}`} aria-label="Note from your consultant">
            <header className="menu__memo-head">
              <span className="menu__memo-name">{consultantMessage.greeting}</span>
              <span className="menu__memo-role">{CONSULTANT_ROLE}</span>
            </header>
            <p className="menu__memo-body">{consultantMessage.body}</p>
            <p className="menu__memo-signoff">{consultantMessage.signoff}</p>
          </aside>
        )}
        <p className="menu__copy">
          Pick a shift. Each runs on a 20-minute simulated clock. <strong>The hen-do</strong> and{' '}
          <strong>First seizure</strong> are the showcase shifts;{' '}
          <strong>Family anaphylaxis</strong> is the paeds + adult parallel-dose-bands lesson.
        </p>
        {saved && (
          <div className="menu__resume">
            <div className="menu__resume-body">
              <strong>Shift in progress</strong> — {savedShiftTitle(saved.snapshot.episodeId)} at T+
              {saved.snapshot.clockMin}m. Saved {timeAgo(saved.savedAt)}.
            </div>
            <div className="menu__resume-actions">
              <button className="enc__primary" onClick={onResume}>
                Resume
              </button>
              <button onClick={onClearSave}>Discard</button>
            </div>
          </div>
        )}
        <div className="menu__cards">
          {shifts.map((s) => {
            const isToday = s.id === dailyShiftId;
            return (
              <button
                key={s.id}
                className={`menu__card menu__card--${s.variant ?? 'secondary'} ${
                  isToday ? 'menu__card--today' : ''
                }`}
                onClick={() => onStart(s.id)}
              >
                {isToday && <span className="menu__card-today-badge">TODAY&rsquo;S PICK</span>}
                <span className="menu__card-eyebrow">{s.eyebrow}</span>
                <span className="menu__card-title">{s.title}</span>
                <span className="menu__card-meta">{s.meta}</span>
              </button>
            );
          })}
          <button className="menu__card menu__card--secondary" onClick={onShowHub}>
            <span className="menu__card-eyebrow">Preview</span>
            <span className="menu__card-title">ED hub layout</span>
            <span className="menu__card-meta">Placeholder Phaser scene from Milestone 1</span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onShowEcg}>
            <span className="menu__card-eyebrow">Daily</span>
            <span className="menu__card-title">ECG challenge</span>
            <span className="menu__card-meta">
              14-day rotation — one ECG-interpretation set per day, with cited sources.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onShowPractice}>
            <span className="menu__card-eyebrow">Practice</span>
            <span className="menu__card-title">Case library</span>
            <span className="menu__card-meta">
              Drill any of the 17 patients on their most-focused shift — perfect for re-running a case you lost.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onShowSkillTree}>
            <span className="menu__card-eyebrow">Progression</span>
            <span className="menu__card-title">Skill tree</span>
            <span className="menu__card-meta">XP, SLO mastery and unlocked perks across shifts.</span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onShowSettings}>
            <span className="menu__card-eyebrow">Preferences</span>
            <span className="menu__card-title">Settings</span>
            <span className="menu__card-meta">
              Audio default, sim speed, motion preference, trap hints, local data.
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function savedShiftTitle(episodeId: string): string {
  return SHIFT_DEFS.find((s) => s.id === episodeId)?.title ?? episodeId;
}

function timeAgo(ts: number): string {
  const secs = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

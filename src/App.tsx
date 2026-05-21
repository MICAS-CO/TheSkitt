import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { parse as parseYaml } from 'yaml';
// M78: Phaser is the heaviest dependency in the boot bundle (~1.5 MB).
// The hub view is the only consumer, so lazy-load it.
const PhaserGame = lazy(() =>
  import('./ui/PhaserGame').then((m) => ({ default: m.PhaserGame })),
);
import { ShiftView } from './ui/shift/ShiftView';
import { useSim, loadShift, clearSavedShift, scoreEpisode, type SavedShift } from './state/sim';
import {
  composeConsultantMessage,
  CONSULTANT_ROLE,
  loadLastShiftMemo,
} from './state/consultant';
import { advanceRota, getOrInitRota, saveRota, type RotaState } from './state/shiftRota';
import { ROTA_ORDER, ROTA_ORDER_IDS } from './state/rotaOrder';
import { loadProgression } from './state/progression';
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
const EPortfolioScreen = lazy(() =>
  import('./ui/portfolio/EPortfolioScreen').then((m) => ({ default: m.EPortfolioScreen })),
);
const InductionScreen = lazy(() =>
  import('./ui/induction/InductionScreen').then((m) => ({ default: m.InductionScreen })),
);
import { loadCharacter } from './state/character';
import { getActiveTier, tierPolicy, TIERS } from './state/difficulty';

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

// M88 (Braintrust 10 audit): the birthday-party shift was reshaped
// from Beth+Sam (adult + paeds parallel) to Sam-only paeds. Beth was
// removed to fix patient over-recurrence. arc_family_peanut_party
// was retired alongside; the YAML file is kept for reference but no
// episode references it any more.
import samYaml from '../content/cases/case_anaphylaxis_paeds_sibling.yaml?raw';
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

// M82 — Entry shift wrapping the two existing minors-floor "ambient"
// cases (Patel chest pain + Stan intox) as a deliberately-gentle first
// day on the floor. See dev_loop/braintrust/02-design-consultation
// synthesis Q1 — the rota's entry shift establishes the e-portfolio
// loop, McGrath's tone, and the nurse-in-charge before any resus.
import minorsDayEntryEpYaml from '../content/episodes/ep_minors_day_entry.yaml?raw';

type View = 'menu' | 'shift' | 'hub' | 'ecg' | 'skilltree' | 'settings' | 'styleguide' | 'practice' | 'induction' | 'eportfolio';

const SUBTITLES: Record<View, string> = {
  menu: 'Episodic FRCEM study RPG · 17 shifts, 17 cases, 3 arcs',
  shift: 'Shift in progress',
  hub: 'ED hub (preview)',
  ecg: 'Daily ECG challenge',
  skilltree: 'Skill tree — progression across shifts',
  settings: 'Settings — preferences and local data',
  styleguide: 'Visual Style Guide — internal asset library',
  practice: 'Practice library — drill any patient',
  induction: 'Skittstown ED — induction',
  eportfolio: 'E-portfolio — shifts on file',
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

// M82 — Entry shift: Patel + Stan as focus cases on a minors-floor day.
const MINORS_DAY_ENTRY: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(minorsDayEntryEpYaml)),
  cases: [Case.parse(parseYaml(patelYaml)), Case.parse(parseYaml(stanYaml))],
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

// M88: factory renamed from FAMILY_SHIFT to PAEDS_ANAPH_SHIFT after the
// Beth cull. Sam is the sole focus case; no arcs.
const PAEDS_ANAPH_SHIFT: () => ShiftPack = () => ({
  episode: Episode.parse(parseYaml(birthdayEpYaml)),
  cases: [Case.parse(parseYaml(samYaml))],
  arcs: [],
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

// M82: pickShiftOfTheDay was the M33-era "case of the day" rotator the
// menu used to highlight one shift from the buffet. The rota replaced
// the buffet, so the daily-rotation concept is gone.

interface ShiftDef {
  id: string;
  title: string;
  eyebrow: string;
  meta: string;
  variant?: 'primary' | 'secondary';
  factory: () => ShiftPack;
}

const SHIFT_DEFS: ShiftDef[] = [
  // M82 — Entry shift on the rota. Deliberately gentle. Position 0.
  {
    id: 'ep_minors_day_entry',
    title: 'First day shift — minors floor',
    eyebrow: 'Shift · CT1 · 20 min · 2 cases',
    meta: 'Settling in. Mrs Patel "just indigestion" + Stan, frequent flyer. Looking past the chief complaint when the presentation says "nothing".',
    variant: 'primary',
    factory: MINORS_DAY_ENTRY,
  },
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
    title: 'Paediatric anaphylaxis — the birthday party',
    eyebrow: 'Shift · ST3 · 20 min · 1 case',
    meta: 'Sam, 8, peanut anaphylaxis at a friend\'s birthday party. Mum at the bedside. Resus Council UK 2021 paeds algorithm, 300 mcg dose band.',
    factory: PAEDS_ANAPH_SHIFT,
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
      // M87 — deterioration policy derived from the player's current
      // tier. Intern gets 2x time on deterioration + no inaction-
      // driven arrests; SHO gets 1.5x time; Registrar is unchanged.
      difficulty: tierPolicy(getActiveTier()),
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
      difficulty: tierPolicy(getActiveTier()),
    });
    initSim(kernel);
    setView('shift');
  }

  function exitShift() {
    // M82: if the shift actually finished (clock ran out or the player
    // ended-early-debrief), advance the rota and log the completion.
    // Early-exit without finishing is a no-op on the rota.
    const k = useSim.getState().kernel;
    if (k && k.getState().isShiftOver) {
      try {
        const report = scoreEpisode(k.getState());
        const current = getOrInitRota(
          ROTA_ORDER,
          loadProgression().caseIdsCompleted,
        );
        const advanced = advanceRota(current, ROTA_ORDER, {
          episodeId: report.episodeId,
          band: report.band,
          completedIso: new Date().toISOString(),
        });
        saveRota(advanced);
      } catch (e) {
        // Never block menu return on a rota-write failure — but DO
        // surface the error so a malformed scoreEpisode or quota-full
        // localStorage write is debuggable rather than silently
        // swallowed.
        console.error('M82: failed to advance rota on shift exit', e);
      }
    }
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
            onShowSkillTree={() => setView('skilltree')}
            onShowSettings={() => setView('settings')}
            onShowEportfolio={() => setView('eportfolio')}
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
              // M84: the practice library is reached FROM the e-portfolio.
              // Exiting returns there, not to the front-door menu — the
              // back-stack matches the way the player got in.
              onExit={() => setView('eportfolio')}
            />
          </Suspense>
        )}
        {view === 'eportfolio' && (
          <Suspense fallback={<div className="app__loading">Loading e-portfolio…</div>}>
            <EPortfolioScreen
              shiftTitleById={Object.fromEntries(SHIFT_DEFS.map((s) => [s.id, s.title]))}
              onReplay={(episodeId) => {
                const def = SHIFT_DEFS.find((s) => s.id === episodeId);
                if (def) startShift(def.factory());
              }}
              onShowPractice={() => setView('practice')}
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
          Study material for FRCEM candidates. Not medical advice. Not a substitute for
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
  onShowSkillTree,
  onShowSettings,
  onShowEportfolio,
  saved,
  onResume,
  onClearSave,
}: {
  shifts: ShiftDef[];
  onStart: (id: string) => void;
  onShowHub: () => void;
  onShowEcg: () => void;
  onShowSkillTree: () => void;
  onShowSettings: () => void;
  onShowEportfolio: () => void;
  saved: SavedShift | null;
  onResume: () => void;
  onClearSave: () => void;
}) {
  // M82: load (or migrate) the rota. Existing players whose progression
  // already records completed cases are auto-advanced past those rota
  // positions — see state/shiftRota.ts.
  const rota: RotaState = useMemo(
    () => getOrInitRota(ROTA_ORDER, loadProgression().caseIdsCompleted),
    [],
  );
  const currentShift = useMemo(() => {
    const id = ROTA_ORDER_IDS[rota.currentShiftIndex];
    return id ? shifts.find((s) => s.id === id) ?? null : null;
  }, [rota.currentShiftIndex, shifts]);
  const currentRotaEntry = ROTA_ORDER[rota.currentShiftIndex] ?? null;
  // M83: the current shift is a keystone retry when it's a keystone
  // AND there's at least one prior completion of it on the log (the
  // player has tried and missed the band gate).
  const currentKeystoneRetry =
    !!currentRotaEntry &&
    currentRotaEntry.isKeystone &&
    rota.completedShifts.some((c) => c.episodeId === currentRotaEntry.episodeId);
  const nextRotaEntry = ROTA_ORDER[rota.currentShiftIndex + 1] ?? null;
  // M83: when today's shift is a keystone, the next position is gated
  // by clearing it at SHO band+ — regardless of whether the gate is
  // a block boundary or a mid-block keystone. Earlier we keyed off
  // `nextRotaEntry.blockIndex !== currentRotaEntry.blockIndex` which
  // implicitly assumed keystones are the LAST shift of their block.
  // Round-1 reviewer caught the brittleness; M84 may reshape ordering.
  const nextIsGated =
    !!currentRotaEntry && currentRotaEntry.isKeystone && !!nextRotaEntry;
  const nextCrossesBlock =
    nextIsGated && nextRotaEntry!.blockIndex !== currentRotaEntry!.blockIndex;
  const nextShiftTitle = useMemo(() => {
    if (!nextRotaEntry) return null;
    return shifts.find((s) => s.id === nextRotaEntry.episodeId)?.title ?? null;
  }, [nextRotaEntry, shifts]);
  const totalShifts = ROTA_ORDER_IDS.length;
  const completedCount = rota.completedShifts.length;

  const consultantMemo = useMemo(() => loadLastShiftMemo(), []);
  const character = useMemo(() => loadCharacter(), []);
  // M89: pass the rota index of the JUST-COMPLETED shift so McGrath's
  // voice can pick up the rota-position tone. The memo's episodeId
  // points at the shift she's commenting on; that's the position
  // whose tone she carries.
  const consultantMessage = useMemo(() => {
    if (!consultantMemo) return null;
    const ridx = ROTA_ORDER_IDS.indexOf(consultantMemo.episodeId);
    return composeConsultantMessage(
      consultantMemo,
      character?.firstName,
      ridx >= 0 ? ridx : undefined,
    );
  }, [consultantMemo, character]);
  const tier = character ? TIERS[character.role] : null;
  return (
    <div className="menu">
      <div className="menu__inner">
        <h2 className="menu__title">Your rota</h2>
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
          You&rsquo;re on shift {Math.min(rota.currentShiftIndex + 1, totalShifts)} of {totalShifts}.
          {completedCount > 0
            ? ` ${completedCount} attempt${completedCount === 1 ? '' : 's'} on file in your e-portfolio.`
            : ' The e-portfolio fills as you finish shifts.'}
          {currentRotaEntry?.isKeystone && (
            <>
              {' '}
              <strong>Today is a keystone shift</strong> — clear it at SHO band or better
              {nextRotaEntry ? ` to unlock block ${nextRotaEntry.blockIndex}` : ''}.
            </>
          )}
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
          {currentShift && (
            <button
              key={currentShift.id}
              className={`menu__card menu__card--primary menu__card--today ${
                currentRotaEntry?.isKeystone ? 'menu__card--keystone' : ''
              }`}
              onClick={() => onStart(currentShift.id)}
            >
              <span className="menu__card-today-badge">
                {currentKeystoneRetry
                  ? 'RETRY · KEYSTONE'
                  : currentRotaEntry?.isKeystone
                    ? 'TODAY · KEYSTONE'
                    : 'TODAY’S SHIFT'}
              </span>
              <span className="menu__card-eyebrow">{currentShift.eyebrow}</span>
              <span className="menu__card-title">{currentShift.title}</span>
              <span className="menu__card-meta">{currentShift.meta}</span>
            </button>
          )}
          {nextShiftTitle && (
            // Peek at the next position. When today's shift is a keystone,
            // the next position is gated — hide the title. The rota
            // teaches what's coming without spoiling what's locked. The
            // block-boundary case gets an extra refinement in the eyebrow.
            <div
              className="menu__card menu__card--secondary menu__card--locked"
              aria-disabled="true"
            >
              <span className="menu__card-eyebrow">
                {nextCrossesBlock
                  ? `Block ${nextRotaEntry?.blockIndex} (locked)`
                  : nextIsGated
                    ? 'Locked'
                    : 'Next on the rota'}
              </span>
              <span className="menu__card-title">
                {nextIsGated ? '— sealed until the keystone clears' : nextShiftTitle}
              </span>
              <span className="menu__card-meta">
                {nextIsGated
                  ? 'Clear today’s keystone at SHO band or better to unlock the next position.'
                  : 'Published after you debrief today’s shift.'}
              </span>
            </div>
          )}
          {!currentShift && (
            <div className="menu__card menu__card--secondary" aria-disabled="true">
              <span className="menu__card-eyebrow">Rota complete</span>
              <span className="menu__card-title">All shifts on file</span>
              <span className="menu__card-meta">
                Open the e-portfolio to revisit individual shifts.
              </span>
            </div>
          )}
          <button className="menu__card menu__card--secondary" onClick={onShowEportfolio}>
            <span className="menu__card-eyebrow">Portfolio</span>
            <span className="menu__card-title">E-portfolio</span>
            <span className="menu__card-meta">
              {completedCount > 0
                ? `${completedCount} attempt${completedCount === 1 ? '' : 's'} on file. Replay any.`
                : 'Empty for now. Finish a shift to file your first attempt.'}
            </span>
          </button>
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

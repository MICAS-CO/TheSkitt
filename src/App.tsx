import { useEffect, useState } from 'react';
import { parse as parseYaml } from 'yaml';
import { PhaserGame } from './ui/PhaserGame';
import { ShiftView } from './ui/shift/ShiftView';
import { useSim, loadShift, clearSavedShift, type SavedShift } from './state/sim';
import { Arc, Case, Episode, type ArcT, type CaseT, type EpisodeT } from './content/schema';
import { SimKernel } from './sim/kernel';

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

type View = 'menu' | 'shift' | 'hub';

const SUBTITLES: Record<View, string> = {
  menu: 'Episodic UK FRCEM study RPG · 12 shifts, 13 cases',
  shift: 'Shift in progress',
  hub: 'ED hub (preview)',
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

const KNOWN_SHIFTS: Record<string, () => ShiftPack> = {
  ep_anaphylaxis_solo: SOLO_SHIFT,
  ep_hendo_shift: HENDO_SHIFT,
  ep_overnight_sepsis_solo: SEPSIS_SOLO,
  ep_overnight_metabolic: METABOLIC_SHIFT,
  ep_birthday_party: FAMILY_SHIFT,
  ep_stroke_solo: STROKE_SOLO,
  ep_seizure_solo: SEIZURE_SOLO,
  ep_head_injury_doac: HEAD_INJURY_DOAC,
  ep_doac_double: DOAC_DOUBLE,
  ep_dissection_solo: DISSECTION_SOLO,
  ep_ugib_solo: UGIB_SOLO,
  ep_pe_solo: PE_SOLO,
};

export function App() {
  const [view, setView] = useState<View>('menu');
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
        <h1 className="app__title">The Skitt</h1>
        <p className="app__subtitle">{SUBTITLES[view]}</p>
      </header>

      <main className="app__stage">
        {view === 'menu' && (
          <MenuView
            onStartHendo={() => startShift(HENDO_SHIFT())}
            onStartSolo={() => startShift(SOLO_SHIFT())}
            onStartSepsis={() => startShift(SEPSIS_SOLO())}
            onStartMetabolic={() => startShift(METABOLIC_SHIFT())}
            onStartFamily={() => startShift(FAMILY_SHIFT())}
            onStartStroke={() => startShift(STROKE_SOLO())}
            onStartSeizure={() => startShift(SEIZURE_SOLO())}
            onStartHeadInjury={() => startShift(HEAD_INJURY_DOAC())}
            onStartDoacDouble={() => startShift(DOAC_DOUBLE())}
            onStartDissection={() => startShift(DISSECTION_SOLO())}
            onStartUgib={() => startShift(UGIB_SOLO())}
            onStartPe={() => startShift(PE_SOLO())}
            onShowHub={() => setView('hub')}
            saved={saved}
            onResume={resumeSavedShift}
            onClearSave={clearAndForget}
          />
        )}
        {view === 'shift' && <ShiftView onExit={exitShift} onReplay={replayShift} />}
        {view === 'hub' && <PhaserGame />}
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
      </footer>
    </div>
  );
}

function MenuView({
  onStartHendo,
  onStartSolo,
  onStartSepsis,
  onStartMetabolic,
  onStartFamily,
  onStartStroke,
  onStartSeizure,
  onStartHeadInjury,
  onStartDoacDouble,
  onStartDissection,
  onStartUgib,
  onStartPe,
  onShowHub,
  saved,
  onResume,
  onClearSave,
}: {
  onStartHendo: () => void;
  onStartSolo: () => void;
  onStartSepsis: () => void;
  onStartMetabolic: () => void;
  onStartFamily: () => void;
  onStartStroke: () => void;
  onStartSeizure: () => void;
  onStartHeadInjury: () => void;
  onStartDoacDouble: () => void;
  onStartDissection: () => void;
  onStartUgib: () => void;
  onStartPe: () => void;
  onShowHub: () => void;
  saved: SavedShift | null;
  onResume: () => void;
  onClearSave: () => void;
}) {
  return (
    <div className="menu">
      <div className="menu__inner">
        <h2 className="menu__title">Shift menu</h2>
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
          <button className="menu__card menu__card--primary" onClick={onStartHendo}>
            <span className="menu__card-eyebrow">Shift · ST3 · 20 min · 2 cases · 1 arc</span>
            <span className="menu__card-title">The hen-do</span>
            <span className="menu__card-meta">
              Anaphylaxis (resus) + ectopic pregnancy (minors), connected by shared incident. NICE
              NG126 · Resus Council UK 2021 · RCOG GTG 21
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onStartFamily}>
            <span className="menu__card-eyebrow">Shift · ST3 · 20 min · 2 cases · 1 arc</span>
            <span className="menu__card-title">Family anaphylaxis — adult + paeds</span>
            <span className="menu__card-meta">
              Beth + her 8y/o brother Sam. Resus Council UK 2021 algorithm, two dose bands, one
              shift.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onStartMetabolic}>
            <span className="menu__card-eyebrow">Shift · ST3 · 20 min · 2 cases</span>
            <span className="menu__card-title">Overnight: metabolic resus</span>
            <span className="menu__card-meta">
              New-onset DKA + urosepsis on the same shift. JBDS-IP + NICE NG51. Two time-critical
              bundles in parallel.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onStartSepsis}>
            <span className="menu__card-eyebrow">Shift · CT2 · 20 min · 1 case</span>
            <span className="menu__card-title">Overnight: sepsis solo</span>
            <span className="menu__card-meta">
              Urosepsis with evolving septic shock. NICE NG51 + Sepsis Six + advance care plan.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onStartStroke}>
            <span className="menu__card-eyebrow">Shift · CT2 · 20 min · 1 case</span>
            <span className="menu__card-title">Stroke onset — thrombolysis window</span>
            <span className="menu__card-meta">
              Witnessed LMCA stroke on apixaban. NICE NG128 + DOAC contraindication + thrombectomy
              referral.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onStartSeizure}>
            <span className="menu__card-eyebrow">Shift · ST3 · 20 min · 1 case</span>
            <span className="menu__card-title">First seizure — status pathway</span>
            <span className="menu__card-meta">
              Refractory status in a pregnant 28-y/o. NICE NG217 (2022) + MHRA Valproate PPP + a CT
              twist.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onStartHeadInjury}>
            <span className="menu__card-eyebrow">Shift · CT2 · 20 min · 1 case</span>
            <span className="menu__card-title">Head injury — DOAC reasoning</span>
            <span className="menu__card-meta">
              Anticoagulated faller, GCS 15 on arrival. NICE NG232 + Canadian C-spine + NICE TA697
              andexanet.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onStartDoacDouble}>
            <span className="menu__card-eyebrow">Shift · ST3 · 20 min · 2 cases</span>
            <span className="menu__card-title">DOAC double-bill — clot and bleed</span>
            <span className="menu__card-meta">
              Williams (ischaemic LVO on apixaban) + Brennan (SDH on apixaban) on the same shift.
              Reperfusion vs reversal in parallel.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onStartDissection}>
            <span className="menu__card-eyebrow">Shift · ST3 · 20 min · 1 case</span>
            <span className="menu__card-title">Aortic dissection — the anchor-breaker</span>
            <span className="menu__card-meta">
              Type A AD masquerading as inferior STEMI. Cath lab pre-alerted, the call is yours.
              ADD-RS + ESC 2024 + IRAD mortality clock.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onStartUgib}>
            <span className="menu__card-eyebrow">Shift · ST3 · 20 min · 1 case</span>
            <span className="menu__card-title">Variceal UGIB — Sepsis Six of the liver</span>
            <span className="menu__card-meta">
              Massive haematemesis in a Child-Pugh C cirrhotic. NICE CG141 + BSG 2015 + HALT-IT.
              Restrictive Hb 7–8, terlipressin + ceftriaxone bundle.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onStartPe}>
            <span className="menu__card-eyebrow">Shift · ST3 · 20 min · 1 case</span>
            <span className="menu__card-title">
              Massive PE — shock and the thrombolysis decision
            </span>
            <span className="menu__card-meta">
              Post-op + COCP shock-state PE with RV strain. NICE NG158 + ESC 2019. The bedside-echo
              + DVT scan pivot lets you start reperfusion without leaving resus.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onStartSolo}>
            <span className="menu__card-eyebrow">Shift · CT2 · 20 min · 1 case</span>
            <span className="menu__card-title">Anaphylaxis solo</span>
            <span className="menu__card-meta">
              Single-case milestone-4 build. Adult anaphylaxis on the clock.
            </span>
          </button>
          <button className="menu__card menu__card--secondary" onClick={onShowHub}>
            <span className="menu__card-eyebrow">Preview</span>
            <span className="menu__card-title">ED hub layout</span>
            <span className="menu__card-meta">Placeholder Phaser scene from Milestone 1</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const SHIFT_TITLES: Record<string, string> = {
  ep_anaphylaxis_solo: 'Anaphylaxis solo',
  ep_hendo_shift: 'The hen-do',
  ep_overnight_sepsis_solo: 'Overnight: sepsis solo',
  ep_overnight_metabolic: 'Overnight: metabolic resus',
  ep_birthday_party: 'Family anaphylaxis — adult + paeds',
  ep_stroke_solo: 'Stroke onset — thrombolysis window',
  ep_seizure_solo: 'First seizure — status pathway',
  ep_head_injury_doac: 'Head injury — DOAC reasoning',
  ep_doac_double: 'DOAC double-bill — clot and bleed',
  ep_dissection_solo: 'Aortic dissection — the anchor-breaker',
  ep_ugib_solo: 'Variceal UGIB — Sepsis Six of the liver',
  ep_pe_solo: 'Massive PE — shock and the thrombolysis decision',
};

function savedShiftTitle(episodeId: string): string {
  return SHIFT_TITLES[episodeId] ?? episodeId;
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

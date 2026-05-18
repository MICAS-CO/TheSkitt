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

type View = 'menu' | 'shift' | 'hub';

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

const KNOWN_SHIFTS: Record<string, () => ShiftPack> = {
  ep_anaphylaxis_solo: SOLO_SHIFT,
  ep_hendo_shift: HENDO_SHIFT,
  ep_overnight_sepsis_solo: SEPSIS_SOLO,
  ep_overnight_metabolic: METABOLIC_SHIFT,
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

  function clearAndForget() {
    clearSavedShift();
    setSaved(null);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">The Skitt</h1>
        <p className="app__subtitle">
          {view === 'menu'
            ? 'Episodic EM RPG — milestone 5'
            : view === 'shift'
              ? 'Shift in progress'
              : 'ED hub (preview)'}
        </p>
      </header>

      <main className="app__stage">
        {view === 'menu' && (
          <MenuView
            onStartHendo={() => startShift(HENDO_SHIFT())}
            onStartSolo={() => startShift(SOLO_SHIFT())}
            onStartSepsis={() => startShift(SEPSIS_SOLO())}
            onStartMetabolic={() => startShift(METABOLIC_SHIFT())}
            onShowHub={() => setView('hub')}
            saved={saved}
            onResume={resumeSavedShift}
            onClearSave={clearAndForget}
          />
        )}
        {view === 'shift' && <ShiftView onExit={exitShift} />}
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
  onShowHub,
  saved,
  onResume,
  onClearSave,
}: {
  onStartHendo: () => void;
  onStartSolo: () => void;
  onStartSepsis: () => void;
  onStartMetabolic: () => void;
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
          Pick a shift. The hen-do shift is the milestone-5 build — two cases on one clock with a
          narrative arc connecting them.
        </p>
        {saved && (
          <div className="menu__resume">
            <div className="menu__resume-body">
              <strong>Shift in progress</strong> — {saved.snapshot.episodeId} at T+
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

function timeAgo(ts: number): string {
  const secs = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

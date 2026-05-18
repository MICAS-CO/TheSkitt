import { useState } from 'react';
import { parse as parseYaml } from 'yaml';
import { PhaserGame } from './ui/PhaserGame';
import { ShiftView } from './ui/shift/ShiftView';
import { useSim } from './state/sim';
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

export function App() {
  const [view, setView] = useState<View>('menu');
  const initSim = useSim((s) => s.init);
  const destroySim = useSim((s) => s.destroy);

  function startShift(pack: ShiftPack) {
    const kernel = new SimKernel({
      episode: pack.episode,
      cases: new Map(pack.cases.map((c) => [c.id, c])),
      arcs: new Map(pack.arcs.map((a) => [a.id, a])),
    });
    initSim(kernel);
    setView('shift');
  }

  function exitShift() {
    destroySim();
    setView('menu');
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
            onShowHub={() => setView('hub')}
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
  onShowHub,
}: {
  onStartHendo: () => void;
  onStartSolo: () => void;
  onShowHub: () => void;
}) {
  return (
    <div className="menu">
      <div className="menu__inner">
        <h2 className="menu__title">Shift menu</h2>
        <p className="menu__copy">
          Pick a shift. The hen-do shift is the milestone-5 build — two cases on one clock with a
          narrative arc connecting them.
        </p>
        <div className="menu__cards">
          <button className="menu__card menu__card--primary" onClick={onStartHendo}>
            <span className="menu__card-eyebrow">Shift · ST3 · 20 min · 2 cases · 1 arc</span>
            <span className="menu__card-title">The hen-do</span>
            <span className="menu__card-meta">
              Anaphylaxis (resus) + ectopic pregnancy (minors), connected by shared incident. NICE
              NG126 · Resus Council UK 2021 · RCOG GTG 21
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

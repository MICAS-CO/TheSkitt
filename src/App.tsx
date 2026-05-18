import { useState } from 'react';
import { parse as parseYaml } from 'yaml';
import { PhaserGame } from './ui/PhaserGame';
import { EncounterScreen } from './ui/encounter/EncounterScreen';
import { useSim } from './state/sim';
import { Case, Episode } from './content/schema';
import { SimKernel } from './sim/kernel';
import anaphylaxisYaml from '../content/cases/case_anaphylaxis_adult_peanut.yaml?raw';
import episodeYaml from '../content/episodes/ep_anaphylaxis_solo.yaml?raw';

type View = 'menu' | 'encounter' | 'hub';

export function App() {
  const [view, setView] = useState<View>('menu');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const initSim = useSim((s) => s.init);
  const destroySim = useSim((s) => s.destroy);

  function beginAnaphylaxisShift() {
    const caseData = Case.parse(parseYaml(anaphylaxisYaml));
    const episode = Episode.parse(parseYaml(episodeYaml));
    const kernel = new SimKernel({
      episode,
      cases: new Map([[caseData.id, caseData]]),
    });
    kernel.enterCase(caseData.id);
    initSim(kernel);
    setActiveCaseId(caseData.id);
    setView('encounter');
  }

  function exitEncounter() {
    destroySim();
    setActiveCaseId(null);
    setView('menu');
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">The Skitt</h1>
        <p className="app__subtitle">
          {view === 'menu'
            ? 'Episodic EM RPG — milestone 4'
            : view === 'encounter'
              ? 'Shift in progress'
              : 'ED hub (preview)'}
        </p>
      </header>

      <main className="app__stage">
        {view === 'menu' && (
          <MenuView onPlay={beginAnaphylaxisShift} onShowHub={() => setView('hub')} />
        )}
        {view === 'encounter' && activeCaseId && (
          <EncounterScreen caseId={activeCaseId} onExit={exitEncounter} />
        )}
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

function MenuView({ onPlay, onShowHub }: { onPlay: () => void; onShowHub: () => void }) {
  return (
    <div className="menu">
      <div className="menu__inner">
        <h2 className="menu__title">Shift menu</h2>
        <p className="menu__copy">
          Milestone 4 ships a 20-minute single-case shift on the simulation kernel. The clock runs
          while you work; act on adrenaline before T+5 or the patient arrests.
        </p>
        <div className="menu__cards">
          <button className="menu__card menu__card--primary" onClick={onPlay}>
            <span className="menu__card-eyebrow">Shift · CT2 · 20 min</span>
            <span className="menu__card-title">Anaphylaxis — adult, peanut at restaurant</span>
            <span className="menu__card-meta">
              Resus Council UK 2021 · NICE CG134 · 4 scheduled events
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

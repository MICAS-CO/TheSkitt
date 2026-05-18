import { useState } from 'react';
import { PhaserGame } from './ui/PhaserGame';
import { EncounterScreen } from './ui/encounter/EncounterScreen';
import { useEncounter } from './state/encounter';
import { loadCaseFromYaml } from './content/runtime';
import anaphylaxisYaml from '../content/cases/case_anaphylaxis_adult_peanut.yaml?raw';

type View = 'menu' | 'encounter' | 'hub';

export function App() {
  const [view, setView] = useState<View>('menu');
  const start = useEncounter((s) => s.start);

  function beginAnaphylaxis() {
    start(loadCaseFromYaml(anaphylaxisYaml));
    setView('encounter');
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">The Skitt</h1>
        <p className="app__subtitle">
          {view === 'menu'
            ? 'Episodic EM RPG — milestone 3'
            : view === 'encounter'
              ? 'Encounter'
              : 'ED hub (preview)'}
        </p>
      </header>

      <main className="app__stage">
        {view === 'menu' && <MenuView onPlay={beginAnaphylaxis} onShowHub={() => setView('hub')} />}
        {view === 'encounter' && <EncounterScreen onExit={() => setView('menu')} />}
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
          Milestone 3 ships one playable case. The shift clock arrives in Milestone 4.
        </p>
        <div className="menu__cards">
          <button className="menu__card menu__card--primary" onClick={onPlay}>
            <span className="menu__card-eyebrow">Case · CT2 · SLOs 1, 3</span>
            <span className="menu__card-title">Anaphylaxis — adult, peanut at restaurant</span>
            <span className="menu__card-meta">
              Resus Council UK 2021 · NICE CG134 · Oxford Handbook 5e Ch 2
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

import { PhaserGame } from './ui/PhaserGame';

export function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">The Skitt</h1>
        <p className="app__subtitle">Episodic EM RPG — milestone 1 scaffold</p>
      </header>
      <main className="app__stage">
        <PhaserGame />
      </main>
      <footer className="app__footer">
        <span>v0.0.1</span>
        <span className="app__disclaimer">
          Study material for UK FRCEM candidates. Not medical advice. Not a substitute for
          supervised clinical training.
        </span>
      </footer>
    </div>
  );
}

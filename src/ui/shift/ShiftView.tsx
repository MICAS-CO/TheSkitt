import { useEffect, useState } from 'react';
import {
  useSim,
  useRealTimeClock,
  loadSavedSpeed,
  saveSpeed,
  SIM_SPEEDS,
  type SimSpeedKey,
} from '../../state/sim';
import { ShiftBoardScreen } from './ShiftBoardScreen';
import { ShiftHubScreen } from './ShiftHubScreen';
import { EpisodeDebriefScreen } from './EpisodeDebriefScreen';
import { EncounterScreen, type Section } from '../encounter/EncounterScreen';

interface Props {
  onExit: () => void;
  onReplay: (episodeId: string) => void;
}

export type ShiftViewMode = 'board' | 'hub' | 'encounter' | 'episode_debrief';

export function ShiftView({ onExit, onReplay }: Props) {
  useSim((s) => s.tick);
  const kernel = useSim((s) => s.kernel);
  const [focusedCaseId, setFocusedCaseId] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [mode, setMode] = useState<ShiftViewMode>('board');
  const [speedKey, setSpeedKey] = useState<SimSpeedKey>(() => loadSavedSpeed());

  const ks = kernel?.getState();
  const isRunning = ks?.isRunning ?? false;
  const isShiftOver = ks?.isShiftOver ?? false;

  useRealTimeClock(kernel, isRunning && !isShiftOver, SIM_SPEEDS[speedKey].value);

  // Persist speed when it changes.
  useEffect(() => {
    saveSpeed(speedKey);
  }, [speedKey]);

  // Spacebar toggles play/pause when not focused on form controls.
  useEffect(() => {
    if (!kernel) return;
    function onKey(e: KeyboardEvent) {
      if (e.code !== 'Space') return;
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      if (['INPUT', 'TEXTAREA', 'BUTTON', 'A', 'SELECT'].includes(tag)) return;
      if (!kernel || kernel.getState().isShiftOver) return;
      e.preventDefault();
      if (kernel.getState().isRunning) kernel.pause();
      else kernel.start();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kernel]);

  // Auto-jump to episode debrief when the shift ends.
  useEffect(() => {
    if (isShiftOver && mode !== 'episode_debrief') {
      // Pause the kernel just in case.
      kernel?.pause();
      setMode('episode_debrief');
      setFocusedCaseId(null);
    }
  }, [isShiftOver, mode, kernel]);

  if (!kernel || !ks) {
    return (
      <div className="enc">
        <p>No shift loaded.</p>
        <button onClick={onExit}>Back</button>
      </div>
    );
  }

  function enterCase(id: string) {
    if (kernel) kernel.enterCase(id);
    setFocusedCaseId(id);
    setMode('encounter');
  }

  function setSectionFor(id: string, section: Section) {
    setSections((p) => ({ ...p, [id]: section }));
  }

  function backToBoard() {
    setFocusedCaseId(null);
    setMode('board');
  }

  function finishShift() {
    kernel?.pause();
    setFocusedCaseId(null);
    setMode('episode_debrief');
  }

  if (mode === 'episode_debrief') {
    return <EpisodeDebriefScreen onExit={onExit} onReplay={() => onReplay(ks.episode.id)} />;
  }

  if (mode === 'encounter' && focusedCaseId) {
    return (
      <EncounterScreen
        caseId={focusedCaseId}
        section={sections[focusedCaseId] ?? 'history'}
        onSectionChange={(s) => setSectionFor(focusedCaseId, s)}
        onBackToBoard={backToBoard}
        onExit={onExit}
        speedKey={speedKey}
        onSpeedChange={setSpeedKey}
      />
    );
  }

  if (mode === 'hub') {
    return (
      <ShiftHubScreen
        onEnterCase={enterCase}
        onFinishShift={finishShift}
        onSwitchToBoard={() => setMode('board')}
        onExit={onExit}
        speedKey={speedKey}
        onSpeedChange={setSpeedKey}
      />
    );
  }

  return (
    <ShiftBoardScreen
      onEnterCase={enterCase}
      onFinishShift={finishShift}
      onSwitchToHub={() => setMode('hub')}
      onExit={onExit}
      speedKey={speedKey}
      onSpeedChange={setSpeedKey}
    />
  );
}

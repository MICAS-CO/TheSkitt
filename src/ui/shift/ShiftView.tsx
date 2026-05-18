import { useEffect, useState } from 'react';
import { useSim, useRealTimeClock } from '../../state/sim';
import { ShiftBoardScreen } from './ShiftBoardScreen';
import { EpisodeDebriefScreen } from './EpisodeDebriefScreen';
import { EncounterScreen, type Phase } from '../encounter/EncounterScreen';

interface Props {
  onExit: () => void;
}

type ShiftViewMode = 'board' | 'encounter' | 'episode_debrief';

export function ShiftView({ onExit }: Props) {
  useSim((s) => s.tick);
  const kernel = useSim((s) => s.kernel);
  const [focusedCaseId, setFocusedCaseId] = useState<string | null>(null);
  const [phases, setPhases] = useState<Record<string, Phase>>({});
  const [mode, setMode] = useState<ShiftViewMode>('board');

  const ks = kernel?.getState();
  const isRunning = ks?.isRunning ?? false;
  const isShiftOver = ks?.isShiftOver ?? false;

  useRealTimeClock(kernel, isRunning && !isShiftOver);

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

  function setPhaseFor(id: string, phase: Phase) {
    setPhases((p) => ({ ...p, [id]: phase }));
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
    return <EpisodeDebriefScreen onExit={onExit} />;
  }

  if (mode === 'encounter' && focusedCaseId) {
    return (
      <EncounterScreen
        caseId={focusedCaseId}
        phase={phases[focusedCaseId] ?? 'vignette'}
        onPhaseChange={(p) => setPhaseFor(focusedCaseId, p)}
        onBackToBoard={backToBoard}
        onExit={onExit}
      />
    );
  }

  return <ShiftBoardScreen onEnterCase={enterCase} onFinishShift={finishShift} onExit={onExit} />;
}

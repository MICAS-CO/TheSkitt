import { useEffect, useState } from 'react';
import { useSim, useRealTimeClock } from '../../state/sim';
import { ShiftBoardScreen } from './ShiftBoardScreen';
import { EncounterScreen, type Phase } from '../encounter/EncounterScreen';

interface Props {
  onExit: () => void;
}

export function ShiftView({ onExit }: Props) {
  useSim((s) => s.tick);
  const kernel = useSim((s) => s.kernel);
  const [focusedCaseId, setFocusedCaseId] = useState<string | null>(null);
  const [phases, setPhases] = useState<Record<string, Phase>>({});

  const ks = kernel?.getState();
  const isRunning = ks?.isRunning ?? false;
  const isShiftOver = ks?.isShiftOver ?? false;

  // Drive the real-time clock at the shift level so it keeps running
  // across board/encounter navigation.
  useRealTimeClock(kernel, isRunning && !isShiftOver);

  // When shift ends, force the focused case to debrief
  useEffect(() => {
    if (isShiftOver && focusedCaseId) {
      setPhases((p) => (p[focusedCaseId] === 'debrief' ? p : { ...p, [focusedCaseId]: 'debrief' }));
    }
  }, [isShiftOver, focusedCaseId]);

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
  }

  function setPhaseFor(id: string, phase: Phase) {
    setPhases((p) => ({ ...p, [id]: phase }));
  }

  if (focusedCaseId) {
    return (
      <EncounterScreen
        caseId={focusedCaseId}
        phase={phases[focusedCaseId] ?? 'vignette'}
        onPhaseChange={(p) => setPhaseFor(focusedCaseId, p)}
        onBackToBoard={() => setFocusedCaseId(null)}
        onExit={onExit}
      />
    );
  }

  return <ShiftBoardScreen onEnterCase={enterCase} onExit={onExit} />;
}

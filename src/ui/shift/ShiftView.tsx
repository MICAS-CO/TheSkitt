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

/**
 * M85 — sections that pause the real-time clock. The synthesis
 * argument is that slow-brain differential reasoning shouldn't be
 * subject to wall-clock pressure (it pushes the player toward
 * premature closure / pattern-matching). Management + Disposition +
 * Debrief remain wall-clock active because by then the player has
 * committed to a working diagnosis — the clock pressure is now about
 * EXECUTION speed (the textbook-justified time-critical mechanic).
 */
const REASONING_SECTIONS: ReadonlySet<Section> = new Set<Section>([
  'history',
  'examination',
  'investigations',
  'differential',
]);

export function ShiftView({ onExit, onReplay }: Props) {
  useSim((s) => s.tick);
  const kernel = useSim((s) => s.kernel);
  const [focusedCaseId, setFocusedCaseId] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, Section>>({});
  // M85 (round 2): resus-mode toggle lifted from EncounterScreen so
  // ShiftView's autoPaused logic can see it. Resus mode is by definition
  // time-critical (the player is actively running a resus), so the
  // reasoning-section pause must NOT apply while resus is active.
  const [resusByCaseId, setResusByCaseId] = useState<Record<string, boolean>>({});
  // M88 (round 2 fix): Akin handover dismiss state lives here so it
  // survives board ↔ encounter navigation. Round-1 reviewer caught
  // that putting it inside PreShiftHandover or ShiftBoardScreen made
  // the component remount and reset on every board re-entry.
  const [handoverDismissed, setHandoverDismissed] = useState(false);
  const [mode, setMode] = useState<ShiftViewMode>('board');
  const [speedKey, setSpeedKey] = useState<SimSpeedKey>(() => loadSavedSpeed());

  const ks = kernel?.getState();
  const isRunning = ks?.isRunning ?? false;
  const isShiftOver = ks?.isShiftOver ?? false;
  const autoPaused = ks?.autoPaused ?? false;

  // M85: real-time clock advances only when the player has not paused
  // AND the UI is not in a reasoning section. Triage-budget pressure
  // persists on the board / management / disposition; differential
  // reasoning gets infinite real time. See Braintrust 06 synthesis.
  useRealTimeClock(
    kernel,
    isRunning && !isShiftOver && !autoPaused,
    SIM_SPEEDS[speedKey].value,
  );

  // M85: push the auto-pause state to the kernel whenever the player
  // moves between board / hub / encounter / debrief or changes the
  // section within an encounter. REASONING_SECTIONS sits on slow-brain
  // work; everything else is wall-clock active.
  const focusedSection: Section | null = focusedCaseId
    ? (sections[focusedCaseId] ?? 'history')
    : null;
  const focusedResusActive = focusedCaseId ? !!resusByCaseId[focusedCaseId] : false;
  useEffect(() => {
    if (!kernel) return;
    // Reasoning-section pause is suppressed when resus mode is active:
    // resus is by definition the time-critical loop the player is
    // managing live, so wall-clock pressure must apply.
    const inReasoning =
      mode === 'encounter' &&
      focusedSection !== null &&
      REASONING_SECTIONS.has(focusedSection) &&
      !focusedResusActive;
    kernel.setAutoPaused(inReasoning);
  }, [kernel, mode, focusedSection, focusedResusActive]);

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
    const localCaseId = focusedCaseId;
    return (
      <EncounterScreen
        caseId={focusedCaseId}
        section={sections[focusedCaseId] ?? 'history'}
        onSectionChange={(s) => setSectionFor(localCaseId, s)}
        resusActive={!!resusByCaseId[focusedCaseId]}
        onResusToggle={() =>
          setResusByCaseId((p) => ({ ...p, [localCaseId]: !p[localCaseId] }))
        }
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
      handoverDismissed={handoverDismissed}
      onHandoverDismissChange={setHandoverDismissed}
    />
  );
}

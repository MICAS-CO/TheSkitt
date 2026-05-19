import { useState } from 'react';
import {
  SIM_SPEEDS,
  type SimSpeedKey,
  loadSavedSpeed,
  saveSpeed,
  clearSavedShift,
  loadShift,
  type SavedShift,
} from '../../state/sim';
import { loadAudioEnabled, saveAudioEnabled } from '../../sim/audio';
import { loadProgression, resetProgression, type Progression } from '../../state/progression';

interface Props {
  onExit: () => void;
}

const REDUCE_MOTION_KEY = 'theSkitt.reduceMotion.v1';
const TRAP_HINTS_KEY = 'theSkitt.trapHints.v1';

function loadBool(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
function saveBool(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // ignore (private mode)
  }
}

/**
 * Settings screen (M27) — surfaces the preferences already persisted
 * in localStorage in one place, plus a couple of new toggles. No
 * server / network; everything is browser-local.
 */
export function SettingsScreen({ onExit }: Props) {
  const [audioOn, setAudioOn] = useState<boolean>(() => loadAudioEnabled());
  const [speed, setSpeed] = useState<SimSpeedKey>(() => loadSavedSpeed());
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => loadBool(REDUCE_MOTION_KEY));
  const [trapHints, setTrapHints] = useState<boolean>(() => loadBool(TRAP_HINTS_KEY));
  const [progression, setProgression] = useState<Progression>(() => loadProgression());
  const [savedShift, setSavedShift] = useState<SavedShift | null>(() => loadShift());
  const [confirmStatus, setConfirmStatus] = useState<string>('');

  function toggleAudio() {
    const next = !audioOn;
    setAudioOn(next);
    saveAudioEnabled(next);
  }

  function setSpeedKey(k: SimSpeedKey) {
    setSpeed(k);
    saveSpeed(k);
  }

  function toggleReduceMotion() {
    const next = !reduceMotion;
    setReduceMotion(next);
    saveBool(REDUCE_MOTION_KEY, next);
    if (next) document.documentElement.classList.add('skitt--reduce-motion');
    else document.documentElement.classList.remove('skitt--reduce-motion');
  }

  function toggleTrapHints() {
    const next = !trapHints;
    setTrapHints(next);
    saveBool(TRAP_HINTS_KEY, next);
  }

  function doResetProgression() {
    if (!confirm('Reset all XP, completed cases, and unlocked perks?')) return;
    resetProgression();
    setProgression(loadProgression());
    setConfirmStatus('Progression cleared.');
  }

  function doDiscardShift() {
    if (!confirm('Discard the saved in-progress shift?')) return;
    clearSavedShift();
    setSavedShift(null);
    setConfirmStatus('Saved shift discarded.');
  }

  function doResetEverything() {
    if (
      !confirm(
        'Wipe ALL local data — audio prefs, speed, reduce-motion, trap-hints, progression, saved shift. This cannot be undone.',
      )
    )
      return;
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
    setAudioOn(false);
    setSpeed('normal');
    setReduceMotion(false);
    setTrapHints(false);
    setProgression(loadProgression());
    setSavedShift(null);
    setConfirmStatus('All local data wiped.');
  }

  return (
    <div className="settings">
      <header className="settings__head">
        <div>
          <span className="settings__eyebrow">PREFERENCES</span>
          <h2 className="settings__title">Settings</h2>
          <p className="settings__hint">
            Everything here lives in your browser. Nothing is sent off-device.
          </p>
        </div>
        <button onClick={onExit}>← menu</button>
      </header>

      {confirmStatus && (
        <div className="settings__toast" role="status">
          {confirmStatus}
        </div>
      )}

      <section className="settings__section">
        <h3>Encounter</h3>

        <div className="settings__row">
          <div>
            <div className="settings__label">Monitor audio default</div>
            <div className="settings__sub">
              When on, the cardiac monitor beep auto-starts when you enter an encounter. Otherwise
              opt-in per encounter via the ♪ button on the patient panel.
            </div>
          </div>
          <button
            type="button"
            className={`settings__toggle ${audioOn ? 'is-on' : ''}`}
            onClick={toggleAudio}
            aria-pressed={audioOn}
          >
            {audioOn ? 'On' : 'Off'}
          </button>
        </div>

        <div className="settings__row">
          <div>
            <div className="settings__label">Default sim speed</div>
            <div className="settings__sub">
              How fast the in-game clock advances. Slow = 1 sim-min per ~6 real-sec; fast = 1 per
              ~1 real-sec. Tunable per-shift; this is just the default.
            </div>
          </div>
          <select
            value={speed}
            onChange={(e) => setSpeedKey(e.target.value as SimSpeedKey)}
            className="settings__select"
          >
            {(Object.keys(SIM_SPEEDS) as SimSpeedKey[]).map((k) => (
              <option key={k} value={k}>
                {SIM_SPEEDS[k].label}
              </option>
            ))}
          </select>
        </div>

        <div className="settings__row">
          <div>
            <div className="settings__label">Trap hints</div>
            <div className="settings__sub">
              When on, examiner-trap actions (must_not_do) flag themselves on the management list.
              Off by default so traps stay traps — useful for revision warm-up.
            </div>
          </div>
          <button
            type="button"
            className={`settings__toggle ${trapHints ? 'is-on' : ''}`}
            onClick={toggleTrapHints}
            aria-pressed={trapHints}
          >
            {trapHints ? 'On' : 'Off'}
          </button>
        </div>
      </section>

      <section className="settings__section">
        <h3>Accessibility</h3>

        <div className="settings__row">
          <div>
            <div className="settings__label">Reduce motion</div>
            <div className="settings__sub">
              Suppresses pulsing alerts, animated chips and slide-in transitions. Honoured by your
              OS&rsquo;s prefers-reduced-motion already; this is a manual override.
            </div>
          </div>
          <button
            type="button"
            className={`settings__toggle ${reduceMotion ? 'is-on' : ''}`}
            onClick={toggleReduceMotion}
            aria-pressed={reduceMotion}
          >
            {reduceMotion ? 'On' : 'Off'}
          </button>
        </div>
      </section>

      <section className="settings__section">
        <h3>Local data</h3>

        <div className="settings__row settings__row--inline">
          <div>
            <div className="settings__label">Progression</div>
            <div className="settings__sub">
              {progression.totalXp} XP · {progression.caseIdsCompleted.length} cases completed ·{' '}
              {progression.unlockedPerks.length} perks unlocked.
            </div>
          </div>
          <button type="button" onClick={doResetProgression}>
            Reset progression
          </button>
        </div>

        <div className="settings__row settings__row--inline">
          <div>
            <div className="settings__label">Saved shift</div>
            <div className="settings__sub">
              {savedShift
                ? `In progress — ${savedShift.snapshot.episodeId} at T+${savedShift.snapshot.clockMin}m.`
                : 'No saved shift.'}
            </div>
          </div>
          <button type="button" onClick={doDiscardShift} disabled={!savedShift}>
            Discard
          </button>
        </div>

        <div className="settings__row settings__row--inline">
          <div>
            <div className="settings__label">Reset everything</div>
            <div className="settings__sub">
              Wipes all local data — audio, speed, motion, trap-hints, progression, saved shift.
            </div>
          </div>
          <button type="button" className="settings__danger" onClick={doResetEverything}>
            Wipe local data
          </button>
        </div>
      </section>

      <p className="settings__disclaimer">
        Study material. Not medical advice. Not a substitute for supervised clinical training.
      </p>
    </div>
  );
}

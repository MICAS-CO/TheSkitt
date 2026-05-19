import { useEffect, useRef, useState } from 'react';
import type { CaseRuntime } from '../../sim/kernel';
import { deriveVitals, news2 } from '../../sim/vitals';
import { MonitorAudio, loadAudioEnabled, saveAudioEnabled } from '../../sim/audio';
import { frameCountFor, spriteSvgFor } from '../../style/sprites';

/**
 * Persistent patient panel — portrait + live vitals strip.
 * Stays visible across all encounter sections so the player sees the
 * patient evolve as time passes, deterioration clauses fire, or
 * interventions are taken.
 */
export function PatientPanel({ cs }: { cs: CaseRuntime }) {
  const v = deriveVitals(cs.state, cs.data.vitals);
  const score = news2(v);
  const newsBand = score.total >= 7 ? 'red' : score.total >= 5 ? 'amber' : 'green';
  const [audioOn, setAudioOn] = useState<boolean>(() => loadAudioEnabled());
  const audioRef = useRef<MonitorAudio | null>(null);

  useEffect(() => {
    if (!audioOn) {
      audioRef.current?.stop();
      audioRef.current = null;
      return;
    }
    if (!audioRef.current) audioRef.current = new MonitorAudio();
    audioRef.current.ensure();
    audioRef.current.update(v.hr ?? 0, score.total, cs.state === 'arrested');
    return () => {
      // Don't stop on every render — only on unmount or audio-toggle off.
    };
  }, [audioOn, v.hr, score.total, cs.state]);

  useEffect(() => {
    return () => {
      audioRef.current?.stop();
      audioRef.current = null;
    };
  }, []);

  function toggleAudio() {
    const next = !audioOn;
    setAudioOn(next);
    saveAudioEnabled(next);
  }

  return (
    <aside className="patient-panel" aria-label="Patient panel">
      <div className="patient-panel__toolbar">
        <button
          type="button"
          className={`patient-panel__audio-toggle ${audioOn ? 'is-on' : ''}`}
          onClick={toggleAudio}
          aria-pressed={audioOn}
          title={audioOn ? 'Mute monitor' : 'Unmute monitor'}
        >
          {audioOn ? '♪ monitor on' : '♪ monitor off'}
        </button>
      </div>
      <PatientPortrait caseId={cs.caseId} state={cs.state} hr={v.hr ?? 80} rr={v.rr ?? 16} />
      <div className="patient-panel__vitals">
        <div className={`patient-panel__news patient-panel__news--${newsBand}`}>
          <div className="patient-panel__news-label">NEWS2</div>
          <div className="patient-panel__news-value">{score.total}</div>
        </div>
        <ul className="vitals-strip">
          <Vital label="HR" value={fmtHr(v.hr)} unit="bpm" score={score.hr} />
          <Vital label="RR" value={fmtNum(v.rr)} unit="/min" score={score.rr} />
          <Vital
            label="SpO2"
            value={fmtPct(v.spo2)}
            unit={v.on_o2 ? ' on O2' : ' RA'}
            score={score.spo2 + score.o2}
          />
          <Vital label="BP" value={fmtBp(v.bp_sys, v.bp_dia)} unit="mmHg" score={score.bp_sys} />
          <Vital label="GCS" value={fmtNum(v.gcs)} unit="/15" score={score.acvpu} />
          {v.temp_c !== undefined && (
            <Vital label="Temp" value={v.temp_c.toFixed(1)} unit="°C" score={score.temp} />
          )}
          {v.bm !== undefined && (
            <Vital label="BM" value={v.bm.toFixed(1)} unit="mmol/L" score={0} />
          )}
        </ul>
      </div>
    </aside>
  );
}

function Vital({
  label,
  value,
  unit,
  score,
}: {
  label: string;
  value: string;
  unit: string;
  score: number;
}) {
  const tone = score >= 3 ? 'red' : score >= 2 ? 'amber' : score >= 1 ? 'soft' : 'normal';
  return (
    <li className={`vitals-strip__item is-${tone}`}>
      <span className="vitals-strip__label">{label}</span>
      <span className="vitals-strip__value">
        {value}
        <span className="vitals-strip__unit">{unit}</span>
      </span>
    </li>
  );
}

function fmtNum(n: number | undefined): string {
  return n === undefined ? '—' : String(n);
}
function fmtHr(n: number | undefined): string {
  return n === undefined ? '—' : n === 0 ? '—' : String(n);
}
function fmtPct(n: number | undefined): string {
  return n === undefined ? '—' : n === 0 ? '—' : `${n}%`;
}
function fmtBp(sys: number | undefined, dia: number | undefined): string {
  if (sys === undefined && dia === undefined) return '—';
  if (sys === 0 && dia === 0) return 'unrecordable';
  return `${sys ?? '—'}/${dia ?? '—'}`;
}

/**
 * Patient portrait — prefers authored pixel-art sprites (from
 * Claude Design's style guide) when one exists for this case, with a
 * frame loop driven by the patient's RR. Falls back to a CSS silhouette
 * (head + torso on a trolley) for cases without authored sprite art.
 */
function PatientPortrait({
  caseId,
  state,
  hr,
  rr,
}: {
  caseId: string;
  state: CaseRuntime['state'];
  hr: number;
  rr: number;
}) {
  const breath = rr > 0 ? Math.min(60 / Math.max(rr, 6), 5) : 0; // s per breath, capped
  const pulse = hr > 0 ? Math.max(0.4, 60 / Math.max(hr, 30)) : 0; // s per beat
  const frameCount = frameCountFor(caseId, state);
  const [frameIndex, setFrameIndex] = useState(0);

  // Animate sprite frames in sync with RR (breaths per minute).
  useEffect(() => {
    if (frameCount <= 1) return;
    const periodMs = Math.max(600, 60000 / Math.max(8, rr));
    const id = setInterval(() => setFrameIndex((i) => (i + 1) % frameCount), periodMs / frameCount);
    return () => clearInterval(id);
  }, [frameCount, rr]);

  const svg = spriteSvgFor(caseId, state, frameIndex, 6);

  if (svg) {
    return (
      <div className={`patient-portrait patient-portrait--sprite patient-portrait--${state}`}>
        <div
          className="patient-portrait__sprite"
          dangerouslySetInnerHTML={{ __html: svg }}
          aria-hidden="true"
        />
        {state === 'arrested' && (
          <div className="patient-portrait__overlay" aria-hidden="true">
            asystole
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`patient-portrait patient-portrait--${state}`}>
      <div className="patient-portrait__bed" />
      <div
        className="patient-portrait__body"
        style={
          {
            '--breath': `${breath}s`,
            '--pulse': `${pulse}s`,
          } as React.CSSProperties
        }
      >
        <div className="patient-portrait__head" aria-hidden="true" />
        <div className="patient-portrait__torso" aria-hidden="true" />
      </div>
      {state === 'arrested' && (
        <div className="patient-portrait__overlay" aria-hidden="true">
          asystole
        </div>
      )}
    </div>
  );
}

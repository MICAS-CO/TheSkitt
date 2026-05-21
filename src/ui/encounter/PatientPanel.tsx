import { useEffect, useRef, useState } from 'react';
import type { CaseRuntime } from '../../sim/kernel';
import { deriveVitals, news2 } from '../../sim/vitals';
import { MonitorAudio, loadAudioEnabled, saveAudioEnabled } from '../../sim/audio';
import { frameCountFor, spriteSvgFor } from '../../style/sprites';
import { Monitor, VitalsStripFrame, type VitalReading } from '../../style/frames';
import { FX_PARTICLES, fxFrameToSvg } from '../../style/fxSprites';
import { bayLabelFor } from '../../game/layout';
import type { CaseStateT } from '../../content/schema';

/**
 * Persistent patient panel — portrait + live vitals strip.
 * Stays visible across all encounter sections so the player sees the
 * patient evolve as time passes, deterioration clauses fire, or
 * interventions are taken.
 *
 * M93: the Monitor wrapper is now framed as a diegetic BAY MONITOR
 * feed. The optional `clockMin` prop drives the OSD chip overlay
 * showing which bay the patient occupies and how many minutes into
 * the shift the kernel is at. Falls back gracefully if either is
 * absent (e.g. asset library preview).
 */
export function PatientPanel({
  cs,
  clockMin,
}: {
  cs: CaseRuntime;
  clockMin?: number;
}) {
  const target = deriveVitals(cs.state, cs.data.vitals);
  // M41: interpolate displayed vitals toward the kernel target over a
  // wall-clock window so the player sees the patient deteriorate /
  // recover in real time rather than jump-cutting between baseline and
  // critical. The kernel itself stays speed-agnostic; this is pure UI.
  const v = useInterpolatedVitals(target);
  const score = news2(v);
  const newsBand = score.total >= 7 ? 'red' : score.total >= 5 ? 'amber' : 'green';
  const trends = useVitalsTrends(target, v);
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

  const readings: VitalReading[] = [
    {
      label: 'HR',
      value: fmtHr(v.hr) + trendArrow(trends.hr),
      unit: 'bpm',
      tone: paramTone(score.hr),
    },
    {
      label: 'RR',
      value: fmtNum(v.rr) + trendArrow(trends.rr),
      unit: '/min',
      tone: paramTone(score.rr),
    },
    {
      label: 'SpO₂',
      value: fmtPct(v.spo2) + trendArrow(trends.spo2),
      unit: v.on_o2 ? 'O2' : 'RA',
      tone: paramTone(score.spo2 + score.o2),
    },
    {
      label: 'BP',
      value: fmtBp(v.bp_sys, v.bp_dia) + trendArrow(trends.bp_sys),
      unit: 'mmHg',
      tone: paramTone(score.bp_sys),
    },
    { label: 'GCS', value: fmtNum(v.gcs), unit: '/15', tone: paramTone(score.acvpu) },
  ];
  if (v.temp_c !== undefined)
    readings.push({
      label: 'Temp',
      value: v.temp_c.toFixed(1),
      unit: '°C',
      tone: paramTone(score.temp),
    });
  if (v.bm !== undefined)
    readings.push({ label: 'BM', value: v.bm.toFixed(1), unit: 'mmol/L', tone: paramTone(0) });

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
      <Monitor
        width={320}
        height={220}
        sticker="CardioVis · v3.2"
        cornerLabel={bayMonitorLabel(cs, clockMin)}
        style={{ width: '100%' }}
      >
        <div className="patient-panel__portrait-slot">
          <PatientPortrait caseId={cs.caseId} state={cs.state} hr={v.hr ?? 80} rr={v.rr ?? 16} />
          <PatientFxOverlay caseId={cs.caseId} state={cs.state} hr={v.hr} rr={v.rr} />
        </div>
      </Monitor>
      <div className="patient-panel__vitals">
        <div className={`patient-panel__news patient-panel__news--${newsBand}`}>
          <div className="patient-panel__news-label">NEWS2</div>
          <div className="patient-panel__news-value">{score.total}</div>
        </div>
        <VitalsStripFrame vitals={readings} width={540} height={120} style={{ width: '100%' }} />
      </div>
    </aside>
  );
}

/** Map a NEWS2 sub-score (0–3) to the design's NEWS2 traffic-light hex. */
/**
 * Vital-sign interpolation hook (M41). Lerps a render-state vitals
 * object toward the kernel-derived target. The rates below are tuned
 * so a step from baseline to deteriorating takes ~6-10s of wall-clock
 * — fast enough to feel like a deterioration in real time, slow
 * enough that the player notices the change.
 */
type VitalsT = ReturnType<typeof deriveVitals>;
const PER_SEC: Record<string, number> = {
  hr: 8, // bpm/sec
  rr: 3, // breaths/sec
  spo2: 4, // %/sec
  bp_sys: 8, // mmHg/sec
  bp_dia: 6,
  gcs: 1,
  temp_c: 0.3,
  bm: 0.5,
};

function useInterpolatedVitals(target: VitalsT): VitalsT {
  const [display, setDisplay] = useState<VitalsT>(target);
  const lastTickRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function step() {
      const now = performance.now();
      const dt = Math.min(0.2, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      setDisplay((prev) => {
        const next: VitalsT = { ...prev };
        let changed = false;
        for (const key of Object.keys(PER_SEC) as (keyof VitalsT)[]) {
          const t = target[key] as number | undefined;
          const c = prev[key] as number | undefined;
          if (t === undefined) {
            if (c !== undefined) {
              (next[key] as number | undefined) = undefined;
              changed = true;
            }
            continue;
          }
          if (c === undefined) {
            (next[key] as number) = t;
            changed = true;
            continue;
          }
          const delta = t - c;
          if (Math.abs(delta) < 0.05) {
            if (c !== t) {
              (next[key] as number) = t;
              changed = true;
            }
            continue;
          }
          const max = PER_SEC[key as string]! * dt;
          const step = Math.sign(delta) * Math.min(Math.abs(delta), max);
          (next[key] as number) = c + step;
          changed = true;
        }
        // Booleans / non-numeric — adopt target directly.
        if (prev.on_o2 !== target.on_o2) {
          next.on_o2 = target.on_o2;
          changed = true;
        }
        return changed ? next : prev;
      });
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target]);

  return display;
}

/** Returns a direction sign per vital while it's mid-interpolation. */
function useVitalsTrends(
  target: VitalsT,
  display: VitalsT,
): Record<string, 1 | -1 | 0> {
  const trends: Record<string, 1 | -1 | 0> = {};
  for (const key of ['hr', 'rr', 'spo2', 'bp_sys'] as const) {
    const t = target[key];
    const d = display[key];
    if (t === undefined || d === undefined) {
      trends[key] = 0;
      continue;
    }
    const diff = t - d;
    trends[key] = Math.abs(diff) < 1 ? 0 : diff > 0 ? 1 : -1;
  }
  return trends;
}

function trendArrow(dir: 1 | -1 | 0): string {
  // Inline triangles in the value string so the strip frame can render
  // them inside the value cell without a layout change. ▲ ▼ ─.
  return dir === 1 ? ' ▲' : dir === -1 ? ' ▼' : '';
}

function paramTone(s: number): string {
  if (s >= 3) return '#C8362A';
  if (s >= 2) return '#E0A82E';
  if (s >= 1) return '#E0A82E';
  return '#5BBF8F';
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
 * Compose the bay-monitor OSD label from the patient's bay assignment
 * and the kernel clock.
 *
 * BT 17 round 3 fixes:
 * - Format the kernel's relative tick counter as a simulated wall-
 *   clock time of day (shift starts 07:00), instead of "0m" / "18m"
 *   which read as non-diegetic. A real CCTV monitor shows a clock.
 * - When the case has no bay (patient still in the triage queue /
 *   waiting room), the OSD reads "WAITING ROOM CCTV · {time}"
 *   instead of "BAY MONITOR · TRIAGE QUEUE · {time}" — calling an
 *   unbayed feed a bay monitor was internally inconsistent.
 */
const SHIFT_START_HOUR = 7;
function formatShiftClock(clockMin: number): string {
  const total = SHIFT_START_HOUR * 60 + Math.max(0, Math.floor(clockMin));
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function bayMonitorLabel(cs: CaseRuntime, clockMin?: number): string {
  const bayId = cs.data?.bay;
  const time = clockMin === undefined ? null : formatShiftClock(clockMin);
  if (!bayId) {
    return time ? `WAITING ROOM CCTV · ${time}` : 'WAITING ROOM CCTV';
  }
  const bay = bayLabelFor(bayId);
  return time ? `BAY MONITOR · ${bay} · ${time}` : `BAY MONITOR · ${bay}`;
}

/**
 * Patient portrait — prefers authored pixel-art sprites (from
 * Claude Design's style guide) when one exists for this case, with a
 * frame loop driven by the patient's RR. Falls back to a CSS silhouette
 * (head + torso on a trolley) for cases without authored sprite art.
 */

/**
 * FX particle overlay on the patient portrait (M73). Maps the case
 * diagnosis bucket + current state + vital triggers to 0–2 absolutely-
 * positioned particles that animate gently over the portrait.
 *
 * Picks per state:
 *   deteriorating + anaphylaxis → urticaria_flare (chest + neck)
 *   deteriorating + clammy/shock → sweat_drop (forehead)
 *   deteriorating + intox/vomit → vomit_bowl beside trolley
 *   any state + HR > 130 → pulse_ring (subtle, pulsing)
 *   arrested/deceased → no FX (sprite already mottled)
 *
 * Particles are aria-hidden — the NEWS2 panel + vitals strip already
 * carry the semantic information for screen readers.
 */
const DIAGNOSIS_FX: Record<string, string> = {
  case_anaphylaxis_adult_peanut: 'urticaria_flare',
  case_anaphylaxis_paeds_sibling: 'urticaria_flare',
  case_paracetamol_od_chloe: 'vomit_bowl',
  case_intox_stan_ambient: 'vomit_bowl',
  case_chest_pain_patel_ambient: 'sweat_drop',
  case_acute_heart_failure_ahmed: 'sweat_drop',
  case_dka_marcus: 'sweat_drop',
  case_paeds_dka_amir: 'sweat_drop',
  case_ectopic_minors_sarah: 'sweat_drop',
  case_massive_pe_okonkwo: 'sweat_drop',
  case_aortic_dissection_okafor: 'sweat_drop',
  case_ugib_variceal_kowalski: 'blood_splat',
  case_sepsis_uti_morrison: 'sweat_drop',
  case_status_epilepticus_priya: 'sweat_drop',
  case_stroke_acute_williams: 'sweat_drop',
  case_head_injury_doac_brennan: 'sweat_drop',
  case_htn_emergency_oduya: 'sweat_drop',
};

function PatientFxOverlay({
  caseId,
  state,
  hr,
}: {
  caseId: string;
  state: CaseStateT;
  hr: number | undefined;
  rr: number | undefined;
}) {
  // No FX when arrested / deceased — the supine + mottled sprite carries
  // the visual weight, and a particle on top would be noise.
  if (state === 'arrested' || state === 'deceased') return null;

  const showStateFx = state === 'deteriorating' || state === 'unseen';
  const stateFxId = showStateFx ? DIAGNOSIS_FX[caseId] : null;
  const showPulse = hr !== undefined && hr > 130;

  const stateRows = stateFxId ? FX_PARTICLES[stateFxId] : null;
  const stateSvg = stateRows ? fxFrameToSvg(stateRows, 3) : null;
  const pulseRows = FX_PARTICLES.pulse_ring;
  const pulseSvg = showPulse && pulseRows ? fxFrameToSvg(pulseRows, 2) : null;

  if (!stateSvg && !pulseSvg) return null;
  return (
    <div className="patient-panel__fx" aria-hidden="true">
      {stateSvg && (
        <span
          className={`patient-panel__fx-particle patient-panel__fx-particle--${stateFxId}`}
          dangerouslySetInnerHTML={{ __html: stateSvg }}
        />
      )}
      {pulseSvg && (
        <span
          className="patient-panel__fx-particle patient-panel__fx-particle--pulse"
          dangerouslySetInnerHTML={{ __html: pulseSvg }}
        />
      )}
    </div>
  );
}

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

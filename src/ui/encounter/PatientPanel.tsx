import type { CaseRuntime } from '../../sim/kernel';
import { deriveVitals, news2 } from '../../sim/vitals';

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
  return (
    <aside className="patient-panel" aria-label="Patient panel">
      <PatientPortrait state={cs.state} hr={v.hr ?? 80} rr={v.rr ?? 16} />
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
 * CSS-driven patient portrait — keys off the runtime state for colour /
 * posture, and uses the HR + RR to drive a breathing animation cadence.
 * Replaceable with sprite art (see /assets/sprites/patients/<name>/) once
 * the design pipeline lands those.
 */
function PatientPortrait({
  state,
  hr,
  rr,
}: {
  state: CaseRuntime['state'];
  hr: number;
  rr: number;
}) {
  const breath = rr > 0 ? Math.min(60 / Math.max(rr, 6), 5) : 0; // seconds per breath, capped
  const pulse = hr > 0 ? Math.max(0.4, 60 / Math.max(hr, 30)) : 0; // seconds per beat
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

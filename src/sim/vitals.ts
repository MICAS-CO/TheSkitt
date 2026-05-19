import type { CaseStateT, VitalsT, VitalsValuesT } from '../content/schema';

/**
 * Derive the current vitals for a case based on:
 *  1. Author-provided `case.vitals` (baseline + per-state overrides), or
 *  2. Generic defaults keyed by state when no author data exists.
 *
 * All UI rendering of vitals + NEWS2 should go through this — keeps the
 * "live patient" feel consistent across cases that have / haven't been
 * vitalled-up yet.
 */
export function deriveVitals(
  state: CaseStateT,
  authored: VitalsT | undefined,
): VitalsValuesT {
  // Generic fallbacks per state. Conservative — only used when the case
  // hasn't authored vitals at all.
  const FALLBACK: Record<CaseStateT, VitalsValuesT> = {
    unseen: { hr: 90, rr: 18, spo2: 97, bp_sys: 130, bp_dia: 78, gcs: 15, temp_c: 36.8 },
    triaged: { hr: 92, rr: 19, spo2: 96, bp_sys: 128, bp_dia: 76, gcs: 15, temp_c: 36.8 },
    stable: { hr: 88, rr: 16, spo2: 97, bp_sys: 124, bp_dia: 76, gcs: 15, temp_c: 36.8 },
    deteriorating: { hr: 124, rr: 28, spo2: 90, bp_sys: 92, bp_dia: 58, gcs: 13, temp_c: 38.2 },
    arrested: { hr: 0, rr: 0, spo2: 0, bp_sys: 0, bp_dia: 0, gcs: 3, temp_c: 36.0 },
    admitted: { hr: 84, rr: 14, spo2: 97, bp_sys: 126, bp_dia: 74, gcs: 15, temp_c: 37.0 },
    discharged: { hr: 76, rr: 14, spo2: 98, bp_sys: 122, bp_dia: 72, gcs: 15, temp_c: 36.8 },
    deceased: { hr: 0, rr: 0, spo2: 0, bp_sys: 0, bp_dia: 0, gcs: 3, temp_c: 36.0 },
  };
  if (!authored) return FALLBACK[state];
  const base = authored.baseline;
  // Build a layered view: baseline → state override.
  let layered: VitalsValuesT = { ...base };
  if (state === 'deteriorating' && authored.deteriorating) {
    layered = { ...layered, ...stripUndef(authored.deteriorating) };
  } else if (state === 'arrested' && authored.arrested) {
    layered = { ...layered, ...stripUndef(authored.arrested) };
  } else if (state === 'arrested' && !authored.arrested) {
    layered = { ...layered, hr: 0, bp_sys: 0, bp_dia: 0, spo2: 0, rr: 0, gcs: 3 };
  } else if (state === 'admitted' || state === 'discharged') {
    // Post-resus / discharged: assume the patient is back to baseline if
    // nothing more specific authored.
    layered = base;
  }
  return layered;
}

function stripUndef(v: VitalsValuesT): VitalsValuesT {
  const out: VitalsValuesT = {};
  for (const [k, val] of Object.entries(v)) {
    if (val !== undefined && val !== null) (out as Record<string, unknown>)[k] = val;
  }
  return out;
}

/**
 * NEWS2 score per RCP National Early Warning Score 2 (2017).
 * The scale-2 SpO2 chart for chronic hypercapnic patients is NOT applied —
 * scale 1 only. We add 2 for supplemental oxygen when `on_o2` is true.
 *
 * Returns the total score and a per-parameter breakdown for tooltipping.
 */
export interface NewsBreakdown {
  total: number;
  rr: number;
  spo2: number;
  o2: number;
  temp: number;
  bp_sys: number;
  hr: number;
  acvpu: number;
}

export function news2(v: VitalsValuesT): NewsBreakdown {
  const rr = scoreRR(v.rr);
  const spo2 = scoreSpO2Scale1(v.spo2);
  const o2 = v.on_o2 ? 2 : 0;
  const temp = scoreTemp(v.temp_c);
  const bp_sys = scoreBP(v.bp_sys);
  const hr = scoreHR(v.hr);
  const acvpu = scoreACVPU(v.gcs);
  return {
    total: rr + spo2 + o2 + temp + bp_sys + hr + acvpu,
    rr,
    spo2,
    o2,
    temp,
    bp_sys,
    hr,
    acvpu,
  };
}

// ─── NEWS2 parameter scoring (RCP NEWS2 score chart, May 2017) ──────────────

function scoreRR(rr: number | undefined): number {
  if (rr === undefined) return 0;
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3;
}

function scoreSpO2Scale1(spo2: number | undefined): number {
  if (spo2 === undefined) return 0;
  if (spo2 <= 91) return 3;
  if (spo2 <= 93) return 2;
  if (spo2 <= 95) return 1;
  return 0;
}

function scoreTemp(t: number | undefined): number {
  if (t === undefined) return 0;
  if (t <= 35.0) return 3;
  if (t <= 36.0) return 1;
  if (t <= 38.0) return 0;
  if (t <= 39.0) return 1;
  return 2;
}

function scoreBP(sys: number | undefined): number {
  if (sys === undefined) return 0;
  if (sys <= 90) return 3;
  if (sys <= 100) return 2;
  if (sys <= 110) return 1;
  if (sys <= 219) return 0;
  return 3;
}

function scoreHR(hr: number | undefined): number {
  if (hr === undefined) return 0;
  if (hr <= 40) return 3;
  if (hr <= 50) return 1;
  if (hr <= 90) return 0;
  if (hr <= 110) return 1;
  if (hr <= 130) return 2;
  return 3;
}

function scoreACVPU(gcs: number | undefined): number {
  if (gcs === undefined) return 0;
  return gcs < 15 ? 3 : 0;
}

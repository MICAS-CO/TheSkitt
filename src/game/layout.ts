export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/**
 * Phaser overworld palette — tracks Claude Design's locked palette
 * (see src/style/palette.ts). Hex stored as 0x integers for Phaser.
 *
 * Zone tints chosen so each bay reads as a distinct in-world surface
 * while keeping inside the locked ramps: resus = alert-300 (blood-red
 * shadow), paeds = teal-200 (clinical), majors = teal-300 (deep night
 * bay), minors = lino-300 (warm low-lit corridor), etc.
 */
export const PALETTE = {
  bg: 0x0d2120, // teal-night bg
  floor: 0x15302f, // teal-400
  border: 0x264a48, // teal-200/dark
  resus: 0x7a1e16, // alert-300
  majors: 0x2b5f5d, // teal-300
  minors: 0x3d8885, // teal-200
  paeds: 0x4fa3a0, // teal-100
  relatives: 0x9c8d5c, // paper-300 (warm waiting room)
  triage: 0x6b6862, // lino-400
  ambulatory: 0x3d8885, // teal-200
  station: 0x15302f, // teal-400 (counter at front)
  text: 0xf1ece3, // lino-50
  muted: 0xa29f98, // lino-300
  accent: 0x5bbf8f, // mon-ok
  // Patient-state colours mirror the encounter UI's vitals chips.
  patient_stable: 0x5bbf8f, // mon-ok
  patient_deteriorating: 0xe0a82e, // mon-warn
  patient_arrested: 0xc8362a, // mon-crit
  patient_admitted: 0x4fa3a0, // teal-100
  patient_discharged: 0x86e0b5, // mon-trace
  patient_unseen: 0x6b6862, // lino-400
  patient_triaged: 0xc4c1ba, // lino-200
} as const;

export interface Zone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
}

export const ED_ZONES: readonly Zone[] = [
  { id: 'resus', label: 'RESUS', x: 20, y: 80, w: 260, h: 200, color: PALETTE.resus },
  { id: 'majors', label: 'MAJORS', x: 290, y: 80, w: 440, h: 200, color: PALETTE.majors },
  { id: 'paeds', label: 'PAEDS', x: 740, y: 80, w: 240, h: 200, color: PALETTE.paeds },
  {
    id: 'relatives',
    label: "RELATIVES' ROOM",
    x: 990,
    y: 80,
    w: 270,
    h: 200,
    color: PALETTE.relatives,
  },
  {
    id: 'station',
    label: "NURSES' STATION",
    x: 20,
    y: 290,
    w: 1240,
    h: 70,
    color: PALETTE.station,
  },
  { id: 'minors', label: 'MINORS', x: 20, y: 370, w: 600, h: 220, color: PALETTE.minors },
  { id: 'triage', label: 'TRIAGE', x: 630, y: 370, w: 300, h: 220, color: PALETTE.triage },
  {
    id: 'ambulatory',
    label: 'AMBULATORY / SDEC',
    x: 940,
    y: 370,
    w: 320,
    h: 220,
    color: PALETTE.ambulatory,
  },
] as const;

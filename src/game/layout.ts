export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const PALETTE = {
  bg: 0x0f1115,
  floor: 0x1a1d24,
  border: 0x2a3140,
  resus: 0x6b2d2d,
  majors: 0x3a4a6b,
  minors: 0x2f6b4a,
  paeds: 0x6b4a8a,
  relatives: 0x8a6b3a,
  triage: 0x4a4a4a,
  ambulatory: 0x3a6b6b,
  station: 0x3a4a3a,
  text: 0xe8e8e8,
  muted: 0x8a93a3,
  accent: 0x7adb7a,
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

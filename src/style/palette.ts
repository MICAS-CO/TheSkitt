/**
 * The Skitt locked palette + state ramps.
 *
 * Ported from Claude Design's `palette-data.js` (Visual Style Guide
 * Phase 1). Hex values are the contract — pixel sprites, SVG icons,
 * and CSS must hold these exactly. Any visual addition draws from
 * this file so the look stays consistent across React DOM, Phaser
 * canvas, and authored sprite art.
 */

export interface PaletteStop {
  hex: string;
  name: string;
  use: string;
}

export interface PaletteRamp {
  id: string;
  name: string;
  role: string;
  stops: PaletteStop[];
}

export const PALETTE_RAMPS: PaletteRamp[] = [
  {
    id: 'lino',
    name: 'Floor & wall · lino',
    role: 'Department surfaces. Warm fluoro at the top, cool clinical at the bottom.',
    stops: [
      { hex: '#F1ECE3', name: 'lino-50', use: 'lit floor under strip light' },
      { hex: '#DCD6CB', name: 'lino-100', use: 'mid floor' },
      { hex: '#C4C1BA', name: 'lino-200', use: 'shadow floor / wall mid' },
      { hex: '#A29F98', name: 'lino-300', use: 'shadow / scuff' },
      { hex: '#6B6862', name: 'lino-400', use: 'deep shadow / skirting' },
    ],
  },
  {
    id: 'teal',
    name: 'Department · scrubs teal',
    role: 'Staff, walls in majors, hand-gel pump, calm clinical chrome.',
    stops: [
      { hex: '#7FCBC8', name: 'teal-50', use: 'specular highlight on scrubs' },
      { hex: '#4FA3A0', name: 'teal-100', use: 'scrubs body / sign accent' },
      { hex: '#3D8885', name: 'teal-200', use: 'wall mid / drape' },
      { hex: '#2B5F5D', name: 'teal-300', use: 'wall shadow / curtain' },
      { hex: '#15302F', name: 'teal-400', use: 'monitor bezel / night bay' },
    ],
  },
  {
    id: 'alert',
    name: 'Alert · blood red',
    role: 'Resus signage, red flag, deterioration prompts. Use sparingly.',
    stops: [
      { hex: '#E85045', name: 'alert-50', use: 'urticaria highlight' },
      { hex: '#C8362A', name: 'alert-100', use: 'resus stripe / red flag glyph' },
      { hex: '#A22B23', name: 'alert-200', use: 'sign body' },
      { hex: '#7A1E16', name: 'alert-300', use: 'sign shadow / blood' },
      { hex: '#4D110B', name: 'alert-400', use: 'deep shadow / outline' },
    ],
  },
  {
    id: 'monitor',
    name: 'Monitor · vitals',
    role: 'NEWS2 traffic light. Green ok · amber ≥5 · red ≥7.',
    stops: [
      { hex: '#5BBF8F', name: 'mon-ok', use: 'NEWS2 0-4' },
      { hex: '#E0A82E', name: 'mon-warn', use: 'NEWS2 5-6' },
      { hex: '#C8362A', name: 'mon-crit', use: 'NEWS2 ≥7 / periarrest' },
      { hex: '#1A2A28', name: 'mon-glass', use: 'screen background' },
      { hex: '#86E0B5', name: 'mon-trace', use: 'ECG trace bright' },
    ],
  },
  {
    id: 'paper',
    name: 'Diegetic paper',
    role: 'Clipboards, drug charts, results. NHS yellow + cream + carbon.',
    stops: [
      { hex: '#FBF7E8', name: 'paper-50', use: 'clipboard sheet' },
      { hex: '#F4E9A6', name: 'paper-100', use: 'NHS drug chart yellow' },
      { hex: '#E0D49A', name: 'paper-200', use: 'drug chart shadow / fold' },
      { hex: '#9C8D5C', name: 'paper-300', use: 'biro blue-black' },
      { hex: '#2B2A25', name: 'paper-400', use: 'pencil / printed text' },
    ],
  },
];

/** Quick-access named tokens for code that doesn't want to grep ramps. */
export const C = {
  lino50: '#F1ECE3',
  lino100: '#DCD6CB',
  lino200: '#C4C1BA',
  lino300: '#A29F98',
  lino400: '#6B6862',
  teal50: '#7FCBC8',
  teal100: '#4FA3A0',
  teal200: '#3D8885',
  teal300: '#2B5F5D',
  teal400: '#15302F',
  alert50: '#E85045',
  alert100: '#C8362A',
  alert200: '#A22B23',
  alert300: '#7A1E16',
  alert400: '#4D110B',
  monOk: '#5BBF8F',
  monWarn: '#E0A82E',
  monCrit: '#C8362A',
  monGlass: '#1A2A28',
  monTrace: '#86E0B5',
  paper50: '#FBF7E8',
  paper100: '#F4E9A6',
  paper200: '#E0D49A',
  paper300: '#9C8D5C',
  paper400: '#2B2A25',
} as const;

/** Inclusive skin-tone base ramps (shadow → specular). */
export const SKIN_RAMPS: Array<{ name: string; stops: string[] }> = [
  { name: 'porcelain', stops: ['#FFF0DC', '#F6DCC2', '#ECBF9F', '#C99680', '#8E5E48'] },
  { name: 'fair', stops: ['#FAE2C8', '#E8C39E', '#C99973', '#9A6E4F', '#5E3F2A'] },
  { name: 'olive', stops: ['#E8C8A6', '#C99B72', '#9A6E48', '#6E4A2E', '#3F2818'] },
  { name: 'brown', stops: ['#C99878', '#9C6E4A', '#6E4828', '#452a15', '#221208'] },
  { name: 'deep', stops: ['#86563A', '#5C381F', '#3A2210', '#221208', '#0F0805'] },
];

/** State tints overlaying any skin ramp (shadow → specular). */
export const STATE_TINTS: Array<{
  id: 'stable' | 'flushed' | 'clammy' | 'mottled' | 'cyanosed' | 'jaundiced';
  label: string;
  stops: string[];
  note?: string;
}> = [
  { id: 'stable', label: 'Stable', stops: ['#c99680', '#ecbf9f', '#f6dcc2', '#fff0dc'] },
  {
    id: 'flushed',
    label: 'Flushed',
    stops: ['#e87a72', '#f29991', '#fbbab2', '#ffd2c8'],
    note: 'anaphylaxis · sepsis · febrile',
  },
  {
    id: 'clammy',
    label: 'Clammy / pale',
    stops: ['#b5a59a', '#d2c4b8', '#e6dccf', '#f0ebdc'],
    note: 'shock · MI · GI bleed',
  },
  {
    id: 'mottled',
    label: 'Mottled',
    stops: ['#7c6e74', '#9a8a8e', '#b5a4a6', '#c8b9bb'],
    note: 'periarrest · agonal',
  },
  {
    id: 'cyanosed',
    label: 'Cyanosed',
    stops: ['#5a6a8a', '#7e8eae', '#9aaccd', '#b6c4dd'],
    note: 'PE · hypoxia · tension PTX',
  },
  {
    id: 'jaundiced',
    label: 'Jaundiced',
    stops: ['#b89438', '#dcc46a', '#f0dc8a', '#f9ecb2'],
    note: 'hepatic failure · cholangitis',
  },
];

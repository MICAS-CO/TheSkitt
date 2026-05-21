/**
 * Pixel-art portrait engine — ported from Claude Design's
 * `pixel-sprites.js` (Visual Style Guide Phase 1).
 *
 * Three-layer model per portrait:
 *   1) base silhouette + clothing (per-patient sprite rows)
 *   2) skin-state tint overlay     (per-state substitution map)
 *   3) per-state diffs             (eyes/mouth/props/urticaria/tube/sweat)
 *
 * Sprites are 24×32 base resolution and rendered as crisp-edge SVG.
 *
 * Beth Cartwright (anaphylaxis, peanut, hen-do) is the first patient
 * fully authored. Additional patients will land sprite sets as the
 * design pipeline delivers them.
 */

import type { CaseStateT } from '../content/schema';
import { dropFrameToSvg, dropPatientFrames } from './dropPatientSprites';

type PaletteMap = Record<string, string | null>;

// Single-character keys → hex (or null for transparent)
const PAL: PaletteMap = {
  '.': null, // transparent
  '#': '#1a1310', // outline darkest
  '~': '#3a2a22', // soft outline / closed-eye line

  // Beth hair (brown bob)
  k: '#2a1c10',
  h: '#4a3220',
  H: '#6e4a2e',
  j: '#8a5e3a', // hair highlight tip

  // Skin — base layer (substituted per-state)
  s: '#c99680', // shadow
  S: '#ecbf9f', // mid
  L: '#f6dcc2', // highlight
  l: '#fff0dc', // specular

  // State tints (drop into s/S/L/l slots via substSkin)
  // flushed
  F: '#e87a72',
  f: '#f29991',
  g: '#fbbab2',
  G: '#ffd2c8', // flushed specular
  // clammy / pale (shock)
  C: '#b5a59a',
  c: '#d2c4b8',
  d: '#e6dccf',
  D: '#f0ebdc',
  // mottled (arrested)
  M: '#7c6e74',
  m: '#9a8a8e',
  n: '#b5a4a6',
  N: '#c8b9bb',
  // cyanosed
  B: '#5a6a8a',
  b: '#7e8eae',
  V: '#9aaccd',
  v: '#b6c4dd',

  // Eyes / mouth
  e: '#0d0a08', // pupil
  w: '#f0e8d8', // sclera
  O: '#a04050', // lip mid
  o: '#7a2030', // lip shadow
  q: '#5e2030', // open mouth interior
  r: '#f29991', // swollen lip pink

  // Dress (Beth — hen-do pink)
  p: '#8a2548',
  P: '#c7416f',
  Q: '#e472a0',
  R: '#f49ec0', // sparkle

  // Hospital gown / sheet
  W: '#e8e4d8', // sheet mid
  Y: '#cfc9b8', // sheet shadow
  X: '#f4f7f9', // gown highlight

  // Tubes / wires / urticaria / sweat
  U: '#d04848', // urticaria red
  u: '#e8786a', // urticaria halo
  T: '#7a92a8', // ET tube
  t: '#b2c0ce', // ET tube highlight
  Z: '#5a5a5a', // ECG lead
  A: '#a4d4e8', // sweat
  a: '#e0f0f8', // sweat highlight
  I: '#dcc46a', // jaundice
  i: '#f0dc8a',

  // Williams (M44) — grey-going-white hair + navy pyjama top.
  // Remapped from the design drop's G/g/v/V to avoid clashing with the
  // existing flushed-G/g and cyanosed-V/v tints already in use above.
  K: '#d6d4cd', // grey hair light
  J: '#9c9a93', // grey hair mid
  E: '#0c1c3c', // pyjama navy dark
  y: '#1b2f5a', // pyjama navy mid

  // Patient sprites M72 — Chloe (paracetamol OD), Stan (intox + fall),
  // Patel (atypical STEMI). New clothing slots use free digit chars
  // so they don't collide with the skin / mouth / state-tint slots.
  '0': '#3a2818', // stan jumper shadow (dark brown)
  '4': '#5e4028', // stan jumper mid (warm brown)
  '5': '#7e5a40', // stan jumper highlight
  '6': '#5e2c1e', // patel saree shadow (burgundy)
  '7': '#a04a3c', // patel saree mid
  '8': '#e4be5c', // patel saree gold trim
  '9': '#cfc9b8', // chloe gown subtle stripe
};

// ─── Beth ───────────────────────────────────────────────────────────────────

const bethUprightInhale = [
  '........................', // 0
  '........................', // 1
  '..........kkkk..........', // 2
  '.........khhhhhk........', // 3
  '........khhHHHHhk.......', // 4
  '.......khHHHHHHHhk......', // 5
  '.......khHHHjjHHHhk.....', // 6
  '.......khHsssssHHhk.....', // 7  forehead emerges
  '.......khsSSSSSsHhk.....', // 8
  '.......khSSLLLLSSHk.....', // 9
  '.......hSSLwewewLSk.....', // 10  eyes
  '.......hSSLLLLLLLSk.....', // 11
  '.......hSSLLLLLLLSk.....', // 12
  '.......hSSLLLeLLLSk.....', // 13  nose
  '.......hSSLLLLLLLSk.....', // 14
  '.......hsSSLOOOLSSk.....', // 15  mouth (closed)
  '........hsSSSSSSsk......', // 16
  '........hssssssh........', // 17  chin
  '.........SSSSSk.........', // 18  neck
  '........QPPPPPPQ........', // 19  strap
  '.......pPPPPPPPPp.......', // 20
  '......pPPRPPPPPRPPp.....', // 21  dress collar w/ sparkle
  '.....pPPPPPPPPPPPPPp....', // 22  chest top INHALE (raised)
  '.....pPPQQQQQQQQQPPp....', // 23
  '....pPPQQQQQQQQQQQPPp...', // 24
  '....pPPQQQQQQQQQQQPPp...', // 25
  '....pPPQQQQQQQQQQQPPp...', // 26
  '....pPPPQQQQQQQQQPPPp...', // 27
  '....pPPPPQQQQQQQPPPPp...', // 28
  '....pPPPPPPPPPPPPPPPp...', // 29
  '....ppppppppppppppppp...', // 30
  '........................', // 31
];

const bethUprightExhale = bethUprightInhale.slice();
bethUprightExhale[22] = '......pPPPPPPPPPPPPPp...';
bethUprightExhale[23] = '......pPPQQQQQQQQQPPp...';
bethUprightExhale[24] = '.....pPPQQQQQQQQQQQPPp..';

const bethSupineBase = [
  '........................', // 0
  '........................', // 1
  '..............kkkk......', // 2
  '............khhhhhhk....', // 3
  '...........khhHHHHHhk...', // 4
  '..........khHHHHHHHHhk..', // 5
  '..........khHHHjjHHHhk..', // 6
  '..........khsssssHHHhk..', // 7
  '..........khsSSSSsHHhk..', // 8
  '.........hSSSLLLLSSHk...', // 9
  '........hSSLL~~LLSSHk...', // 10  half-closed eyes
  '.......hSSLLLLLLLLSSk...', // 11
  '.......hSSLLLLLLLLSSk...', // 12
  '.......hSSLLLeeLLLSSk...', // 13  nose
  '.......hSSLLqqqqLLSSk...', // 14  open slack mouth
  '.......hSSLqqqqqqLSSk...', // 15
  '........hsSSSSSSSsk.....', // 16
  '..........hssssh........', // 17  neck slack
  '........WWWWWWWWWWW.....', // 18  sheet edge
  '.......WWWWWWWWWWWWW....', // 19
  '......WWWWWWWWWWWWWWW...', // 20
  '.....WWWWWWWWWWWWWWWWW..', // 21
  '.....WWWWWWWWWWWWWWWWW..', // 22
  '.....WWWWWWWWWWWWWWWWW..', // 23
  '.....WYWYWYWYWYWYWYWWW..', // 24  sheet weave
  '.....WWWWWWWWWWWWWWWWW..', // 25
  '.....WWWWWWWWWWWWWWWWW..', // 26
  '.....WWWWWWWWWWWWWWWWW..', // 27
  '.....WWWWWWWWWWWWWWWWW..', // 28
  '......WWWWWWWWWWWWWWW...', // 29
  '........................', // 30
  '........................', // 31
];

interface SpriteDiff {
  row: number;
  col: number;
  ch: string;
}

function substSkin(rows: string[], map: Record<string, string>): string[] {
  return rows.map((row) => {
    let out = '';
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]!;
      out += map[ch] !== undefined ? map[ch] : ch;
    }
    return out;
  });
}

function applyDiffs(rows: string[], diffs: SpriteDiff[]): string[] {
  const grid = rows.map((r) => r.split(''));
  for (const d of diffs) {
    if (grid[d.row] && d.col < grid[d.row]!.length) {
      grid[d.row]![d.col] = d.ch;
    }
  }
  return grid.map((r) => r.join(''));
}

function bethStable(): string[][] {
  return [bethUprightInhale, bethUprightExhale];
}

function bethTriaged(): string[][] {
  const diffs: SpriteDiff[] = [
    { row: 9, col: 11, ch: 'k' },
    { row: 9, col: 12, ch: 'k' },
    { row: 9, col: 14, ch: 'k' },
    { row: 9, col: 15, ch: 'k' },
    { row: 15, col: 11, ch: 'o' },
    { row: 15, col: 12, ch: 'O' },
    { row: 15, col: 13, ch: 'o' },
  ];
  return [applyDiffs(bethUprightInhale, diffs), applyDiffs(bethUprightExhale, diffs)];
}

function bethDeteriorating(): string[][] {
  const map = { s: 'F', S: 'f', L: 'g', l: 'G' };
  const diffs: SpriteDiff[] = [
    // swollen upper + lower lip
    { row: 14, col: 11, ch: 'r' },
    { row: 14, col: 12, ch: 'r' },
    { row: 14, col: 13, ch: 'r' },
    { row: 15, col: 10, ch: 'r' },
    { row: 15, col: 11, ch: 'O' },
    { row: 15, col: 12, ch: 'O' },
    { row: 15, col: 13, ch: 'O' },
    { row: 15, col: 14, ch: 'r' },
    { row: 16, col: 11, ch: 'r' },
    { row: 16, col: 12, ch: 'r' },
    { row: 16, col: 13, ch: 'r' },
    // sweat droplet on temple
    { row: 9, col: 17, ch: 'A' },
    { row: 10, col: 17, ch: 'a' },
    // urticaria on neck
    { row: 18, col: 11, ch: 'U' },
    { row: 18, col: 13, ch: 'U' },
    { row: 19, col: 10, ch: 'u' },
    { row: 19, col: 14, ch: 'u' },
  ];
  return [
    applyDiffs(substSkin(bethUprightInhale, map), diffs),
    applyDiffs(substSkin(bethUprightExhale, map), diffs),
  ];
}

function bethArrested(): string[][] {
  const map = { s: 'M', S: 'm', L: 'n', l: 'N' };
  return [substSkin(bethSupineBase, map)];
}

function bethPostResus(): string[][] {
  const map = { s: 'C', S: 'c', L: 'd', l: 'D' };
  const diffs: SpriteDiff[] = [
    { row: 10, col: 12, ch: '~' },
    { row: 10, col: 13, ch: '~' },
    { row: 10, col: 14, ch: '~' },
    { row: 10, col: 15, ch: '~' },
    // ET tube exits mouth right and tapes to cheek
    { row: 14, col: 11, ch: 'T' },
    { row: 14, col: 12, ch: 'T' },
    { row: 14, col: 13, ch: 'T' },
    { row: 14, col: 14, ch: 'T' },
    { row: 14, col: 15, ch: 't' },
    { row: 15, col: 15, ch: 'T' },
    { row: 15, col: 16, ch: 'T' },
    { row: 13, col: 16, ch: 'T' },
    // ECG lead on sheet
    { row: 18, col: 11, ch: 'Z' },
    { row: 19, col: 11, ch: 'Z' },
    { row: 20, col: 12, ch: 'Z' },
    { row: 21, col: 13, ch: 'Z' },
  ];
  return [applyDiffs(substSkin(bethSupineBase, map), diffs)];
}

// ─── Williams (M44) ─────────────────────────────────────────────────────────
// Older man, grey-white short hair, navy pyjama top. Grid is 24×32 to
// match Beth so the patient-panel layout doesn't shift between cases.
// The drop's G/g/v/V have been remapped to K/J/E/y above so they don't
// collide with the existing tint slots.

const williamsUpright = [
  '........................',
  '........................',
  '.........KKKKKK.........',
  '........KJJJJJJJK.......',
  '........#JJJJJJ#........',
  '........#sssss#H........',
  '........ksSSSSSk........',
  '........ksSLLLSk........',
  '........kSLLLLLSk.......',
  '.......ksSLwewewLSk.....',
  '.......ksSLLLLLLLSk.....',
  '.......ksSLL~~LLSSk.....',
  '.......ksSLLeLLLSk......',
  '.......ksSLLLLLLSk......',
  '.......ksSSLOOLSSk......',
  '........ksSSSSSk........',
  '........ksssssh.........',
  '.........SSSSk..........',
  '.........EyyyE..........',
  '........EyyyyyyE........',
  '.......EyyyyyyyyE.......',
  '......EyyyyyyyyyyE......',
  '.....EyyyyyyyyyyyyE.....',
  '.....EyyrrrrrrrryyE.....',
  '.....EyyyyyyyyyyyyE.....',
  '.....EyyyyyyyyyyyyE.....',
  '.....EyyyyyyyyyyyyE.....',
  '.....EyyyyyyyyyyyyE.....',
  '.....EyyyyyyyyyyyyE.....',
  '.....EyyyyyyyyyyyyE.....',
  '.....EEEEEEEEEEEEEE.....',
  '........................',
];

const williamsUprightExhale = williamsUpright.slice();
williamsUprightExhale[18] = '........EyyyyyyE........';
williamsUprightExhale[19] = '.......EyyyyyyyyE.......';

const williamsSupine = [
  '........................',
  '........................',
  '..............KKKK......',
  '............KJJJJJJK....',
  '...........#JJJJJJ#.....',
  '..........#sssssss#.....',
  '..........ksSSSSSSsk....',
  '..........ksSLLLLLSsk...',
  '.........ksSLL~~LLSSk...',
  '.........ksSLLLLLLLSk...',
  '.........ksSLLLLLLLSk...',
  '.........ksSLLeeLLLSk...',
  '.........ksSLLqqqLLSk...',
  '.........ksSLqqqqqLSk...',
  '..........ksSSSSSSsk....',
  '...........hsssssh......',
  '..........WWWWWWWWW.....',
  '.........WWWWWWWWWWW....',
  '........WWWWWWWWWWWWW...',
  '.......WWWWWWWWWWWWWWW..',
  '.......WWWWWWWWWWWWWWW..',
  '.......WYWYWYWYWYWYWWW..',
  '.......WWWWWWWWWWWWWWW..',
  '.......WWWWWWWWWWWWWWW..',
  '.......WWWWWWWWWWWWWWW..',
  '.......WWWWWWWWWWWWWWW..',
  '.......WWWWWWWWWWWWWWW..',
  '.......WWWWWWWWWWWWWWW..',
  '.......WWWWWWWWWWWWWWW..',
  '........WWWWWWWWWWWWW...',
  '........................',
  '........................',
];

function williamsStable(): string[][] {
  return [williamsUpright, williamsUprightExhale];
}

function williamsTriaged(): string[][] {
  // Drawn brow + flat mouth — concerned but not yet focal.
  const diffs: SpriteDiff[] = [
    { row: 9, col: 10, ch: 'k' },
    { row: 9, col: 16, ch: 'k' },
    { row: 14, col: 11, ch: 'O' },
    { row: 14, col: 12, ch: 'O' },
    { row: 14, col: 13, ch: 'O' },
  ];
  return [applyDiffs(williamsUpright, diffs), applyDiffs(williamsUprightExhale, diffs)];
}

function williamsDeteriorating(): string[][] {
  // Right-sided facial droop (from viewer's left) + right eye half-closed.
  // The stroke beat: the visual cue mirrors the clinical pronator-drift
  // / facial-droop manoeuvre findings (M40) on case_stroke_acute_williams.
  const diffs: SpriteDiff[] = [
    { row: 14, col: 14, ch: '.' },
    { row: 14, col: 15, ch: '.' },
    { row: 15, col: 14, ch: 'O' },
    { row: 15, col: 15, ch: 'O' },
    { row: 16, col: 14, ch: 'o' },
    { row: 16, col: 15, ch: 'o' },
    { row: 9, col: 15, ch: '~' },
    { row: 9, col: 16, ch: '~' },
  ];
  return [applyDiffs(williamsUpright, diffs), applyDiffs(williamsUprightExhale, diffs)];
}

function williamsArrested(): string[][] {
  // Switch skin tint to mottled (M/m/n/N already in PAL).
  return [substSkin(williamsSupine, { s: 'M', S: 'm', L: 'n', l: 'N' })];
}

function williamsPostResus(): string[][] {
  // Clammy skin + ET tube exiting the right corner of the mouth + ECG lead.
  const supineClammy = substSkin(williamsSupine, { s: 'C', S: 'c', L: 'd', l: 'D' });
  const diffs: SpriteDiff[] = [
    { row: 12, col: 11, ch: 'T' },
    { row: 12, col: 12, ch: 'T' },
    { row: 12, col: 13, ch: 'T' },
    { row: 12, col: 14, ch: 'T' },
    { row: 12, col: 15, ch: 't' },
    { row: 13, col: 15, ch: 'T' },
    { row: 16, col: 11, ch: 'Z' },
    { row: 17, col: 11, ch: 'Z' },
  ];
  return [applyDiffs(supineClammy, diffs)];
}

// ─── Chloe (M72) ────────────────────────────────────────────────────────────
// 19F, paracetamol OD. Long dark hair past shoulders, hospital gown (W/9
// for subtle stripe), small frame. The triaged → deteriorating arc adds
// closed eyes + lip pallor. Arrested = supine + mottled.

const chloeUpright = [
  '........................', // 0
  '........................', // 1
  '.......kkkkkkkkkk.......', // 2  hair top
  '......khhhhhhhhhhk......', // 3
  '......khhhHHHHhhhk......', // 4
  '......khhHHHHHHhhk......', // 5
  '......khsssssssHhk......', // 6  forehead
  '......khsSSSSSSsHk......', // 7
  '......khSSLLLLSSHk......', // 8
  '......khSLwewewLSk......', // 9  eyes (open)
  '......khSLLLLLLLSk......', // 10
  '......khSLLLLLLLSk......', // 11
  '......khSLLLeLLLSk......', // 12  nose
  '......khSLLLLLLLSk......', // 13
  '......khSLLOOOLLSk......', // 14  closed mouth
  '......hkSSSSSSSSkh......', // 15  hair tucks past chin
  '......hhsssssssshh......', // 16
  '.......hhSSSSSShh.......', // 17
  '.......hh99WWW9hh.......', // 18  gown collar + stripe
  '......WWWWWWWWWWWW......', // 19  gown body
  '.....WWWWWWWWWWWWWW.....', // 20  INHALE
  '.....WWWWWW99WWWWWW.....', // 21
  '....WWWWWWWWWWWWWWWW....', // 22
  '....WWWWWW99WWWWWWWW....', // 23
  '....WWWWWWWWWWWWWWWW....', // 24
  '....WWWWWW99WWWWWWWW....', // 25
  '....WWWWWWWWWWWWWWWW....', // 26
  '....WWWWWWWWWWWWWWWW....', // 27
  '....WWWWWWWWWWWWWWWW....', // 28
  '....WWWWWWWWWWWWWWWW....', // 29
  '....WWWWWWWWWWWWWWWW....', // 30
  '........................', // 31
];
const chloeUprightExhale = chloeUpright.slice();
chloeUprightExhale[20] = '......WWWWWWWWWWWWWW....';

const chloeSupine = [
  '........................', // 0
  '........................', // 1
  '............kkkkkkk.....', // 2  hair fanned on pillow
  '..........khhhhhhhhk....', // 3
  '..........khhhHHHHhk....', // 4
  '..........khhHHHHHhk....', // 5
  '..........khsssssHHhk...', // 6
  '..........khsSSSSsHHhk..', // 7
  '..........hSSSLLLLSSHk..', // 8
  '..........hSSLL~~LLSSHk.', // 9  half-closed eyes
  '..........hSSLLLLLLLSSk.', // 10
  '..........hSSLLLLLLLSSk.', // 11
  '..........hSSLLLeeLLLSk.', // 12
  '..........hSSLLqqqqLLSk.', // 13  slack mouth
  '..........hSSLqqqqqqLSk.', // 14
  '...........hsSSSSSSSsk..', // 15
  '............hssssssh....', // 16
  '..........WWWWWWWWWWW...', // 17  sheet edge
  '........WWWWWWWWWWWWWWW.', // 18
  '......WWWWWWWWWWWWWWWWW.', // 19
  '.....WWWWWWWWWWWWWWWWWW.', // 20
  '.....WWWWWWWWWWWWWWWWWW.', // 21
  '.....WWWWWYWYWYWYWWWWWW.', // 22  sheet weave
  '.....WWWWWWWWWWWWWWWWWW.', // 23
  '.....WWWWWWWWWWWWWWWWWW.', // 24
  '.....WWWWWWWWWWWWWWWWWW.', // 25
  '.....WWWWWWWWWWWWWWWWWW.', // 26
  '.....WWWWWWWWWWWWWWWWWW.', // 27
  '.....WWWWWWWWWWWWWWWWWW.', // 28
  '......WWWWWWWWWWWWWWWW..', // 29
  '........................', // 30
  '........................', // 31
];

function chloeStable(): string[][] {
  return [chloeUpright, chloeUprightExhale];
}

function chloeTriaged(): string[][] {
  // Eyes mostly closed, drowsy.
  const diffs: SpriteDiff[] = [
    { row: 9, col: 9, ch: '~' },
    { row: 9, col: 10, ch: '~' },
    { row: 9, col: 13, ch: '~' },
    { row: 9, col: 14, ch: '~' },
  ];
  return [applyDiffs(chloeUpright, diffs), applyDiffs(chloeUprightExhale, diffs)];
}

function chloeDeteriorating(): string[][] {
  // Clammy + nausea hint (vomit bowl prop would render separately).
  const supineClammy = substSkin(chloeSupine, { s: 'C', S: 'c', L: 'd', l: 'D' });
  return [supineClammy];
}

function chloeArrested(): string[][] {
  return [substSkin(chloeSupine, { s: 'M', S: 'm', L: 'n', l: 'N' })];
}

function chloePostResus(): string[][] {
  const map = { s: 'C', S: 'c', L: 'd', l: 'D' };
  const diffs: SpriteDiff[] = [
    // NAC infusion line into right cubital fossa
    { row: 17, col: 9, ch: 'T' },
    { row: 18, col: 9, ch: 'T' },
    { row: 19, col: 8, ch: 't' },
    // small jaundice patch on the sclera (acetaminophen toxicity marker)
    { row: 12, col: 16, ch: 'I' },
    { row: 12, col: 17, ch: 'I' },
  ];
  return [applyDiffs(substSkin(chloeSupine, map), diffs)];
}

// ─── Stan (M72) ─────────────────────────────────────────────────────────────
// 58M, intox + occult head injury. Short greying hair, weathered face,
// brown wool jumper (chars 0/4/5). Forehead lac visible as red on
// deteriorating; supine + log-rolled later.

const stanUpright = [
  '........................', // 0
  '........................', // 1
  '.........KJKJKJK........', // 2  greying hair
  '........KJJJJJJJK.......', // 3
  '........#JJJJJJJ#.......', // 4
  '........#sssssss#.......', // 5  forehead
  '........ksSSSSSSsk......', // 6
  '........ksSLLLLLSk......', // 7
  '........ksSL~ww~LSk.....', // 8  brow shadow (age)
  '.......ksSLwewewLSk.....', // 9  eyes
  '.......ksSLLLLLLLSk.....', // 10
  '.......ksSLL~~LLLSk.....', // 11  crow's feet
  '.......ksSLLLeLLLSk.....', // 12  nose
  '.......ksSLLLLLLLSk.....', // 13
  '.......ksSL~~~~~LSk.....', // 14  stubble across upper lip
  '.......ksSLLOOOLLSk.....', // 15  mouth
  '.......khssssssshk......', // 16
  '........khsssssshk......', // 17  chin + stubble
  '........SSSSSSSSk.......', // 18  neck
  '.......04444444440......', // 19  jumper collar
  '......0444555554440.....', // 20  INHALE (raised)
  '.....044455555555440....', // 21
  '....04444555555555440...', // 22  jumper body
  '....044455555555555440..', // 23
  '....044555555555555440..', // 24
  '....044555555555555440..', // 25
  '....044555555555555440..', // 26
  '....044555555555555440..', // 27
  '....044555555555555440..', // 28
  '....044444444444444440..', // 29
  '....00000000000000000...', // 30
  '........................', // 31
];
const stanUprightExhale = stanUpright.slice();
stanUprightExhale[20] = '.......04444554444440...';
stanUprightExhale[21] = '......044455555555440...';

const stanSupine = [
  '........................', // 0
  '........................', // 1
  '............KJKJKJK.....', // 2
  '...........KJJJJJJK.....', // 3
  '..........#JJJJJJJ#.....', // 4
  '..........#sssssss#.....', // 5
  '..........ksSSSSSSsk....', // 6
  '..........ksSLLLLLSsk...', // 7
  '..........kSSLL~~LLSSk..', // 8  half-closed eyes
  '..........kSSLLLLLLLSSk.', // 9
  '..........kSSLL~~LLLSk..', // 10
  '..........kSSLLLeeLLSk..', // 11
  '..........kSSL~~~~~LSk..', // 12  stubble
  '..........kSSLqqqqqLSk..', // 13  open slack mouth
  '..........kSSqqqqqqqSk..', // 14
  '...........ksSSSSSSsk...', // 15
  '............hsssssh.....', // 16
  '..........WWWWWWWWWWW...', // 17  sheet edge
  '........WWWWWWWWWWWWWWW.', // 18
  '.......WWWWWWWWWWWWWWWWW', // 19
  '......WWWWWWWWWWWWWWWWWW', // 20
  '.....WWWWWWWWWWWWWWWWWWW', // 21
  '.....WWWWWYWYWYWYWYWWWWW', // 22  sheet weave
  '.....WWWWWWWWWWWWWWWWWWW', // 23
  '.....WWWWWWWWWWWWWWWWWWW', // 24
  '.....WWWWWWWWWWWWWWWWWWW', // 25
  '.....WWWWWWWWWWWWWWWWWWW', // 26
  '.....WWWWWWWWWWWWWWWWWWW', // 27
  '.....WWWWWWWWWWWWWWWWWWW', // 28
  '......WWWWWWWWWWWWWWWW..', // 29
  '........................', // 30
  '........................', // 31
];

function stanStable(): string[][] {
  return [stanUpright, stanUprightExhale];
}

function stanTriaged(): string[][] {
  // Closed eyes + slumped — alcohol gaze.
  const diffs: SpriteDiff[] = [
    { row: 9, col: 11, ch: '~' },
    { row: 9, col: 12, ch: '~' },
    { row: 9, col: 14, ch: '~' },
    { row: 9, col: 15, ch: '~' },
  ];
  return [applyDiffs(stanUpright, diffs), applyDiffs(stanUprightExhale, diffs)];
}

function stanDeteriorating(): string[][] {
  // Forehead laceration visible (the M40 manoeuvre payoff) — small red gash
  // on left brow area + clammy skin tint.
  const map = { s: 'C', S: 'c', L: 'd', l: 'D' };
  const diffs: SpriteDiff[] = [
    // Laceration over left eyebrow (from viewer's right)
    { row: 5, col: 15, ch: 'r' },
    { row: 6, col: 15, ch: 'r' },
    { row: 6, col: 16, ch: 'r' },
    // Sweat droplet on temple
    { row: 7, col: 17, ch: 'A' },
    { row: 8, col: 17, ch: 'a' },
  ];
  return [
    applyDiffs(substSkin(stanUpright, map), diffs),
    applyDiffs(substSkin(stanUprightExhale, map), diffs),
  ];
}

function stanArrested(): string[][] {
  return [substSkin(stanSupine, { s: 'M', S: 'm', L: 'n', l: 'N' })];
}

function stanPostResus(): string[][] {
  const map = { s: 'C', S: 'c', L: 'd', l: 'D' };
  const diffs: SpriteDiff[] = [
    // Forehead dressing (white square)
    { row: 4, col: 11, ch: 'W' },
    { row: 4, col: 12, ch: 'W' },
    { row: 4, col: 13, ch: 'W' },
    { row: 5, col: 11, ch: 'W' },
    { row: 5, col: 12, ch: 'W' },
    { row: 5, col: 13, ch: 'W' },
    // ECG lead on chest
    { row: 17, col: 11, ch: 'Z' },
    { row: 18, col: 11, ch: 'Z' },
    // IV cannula L ACF
    { row: 17, col: 9, ch: 'T' },
    { row: 18, col: 9, ch: 'T' },
  ];
  return [applyDiffs(substSkin(stanSupine, map), diffs)];
}

// ─── Patel (M72) ────────────────────────────────────────────────────────────
// 72F atypical STEMI. Grey/black bun, traditional saree wrap
// (chars 6/7/8 — burgundy + gold trim). Stoic, sitting upright.

const patelUpright = [
  '........................', // 0
  '........................', // 1
  '..........kkkkkkk.......', // 2  hair bun at top
  '.........kkkbbbkkk......', // 3
  '........kkbbbbbbbkk.....', // 4
  '........#bbbbbbbbb#.....', // 5  bun outline (b reused as eye-bb)
  '........#sssssssss......', // 6  forehead
  '........ksSSSSSSSSk.....', // 7
  '........ksSLLLLLLSk.....', // 8
  '.......ksSLwewewLSk.....', // 9  eyes
  '.......ksSLLLLLLLSk.....', // 10
  '.......ksSLL~~LLLSk.....', // 11  age lines
  '.......ksSLLLeLLLSk.....', // 12  nose
  '.......ksSLLLLLLLSk.....', // 13
  '.......ksSLLOOOLLSk.....', // 14  composed mouth
  '........ksSSSSSSSk......', // 15
  '........kssssssssk......', // 16  chin
  '.........SSSSSSk........', // 17  neck
  '.......6666666666.......', // 18  saree top edge
  '......6677777777766.....', // 19  saree body (burgundy + mid)
  '.....667777777777766....', // 20  INHALE
  '....66777887888777766...', // 21  gold trim across chest
  '....667777777777777766..', // 22
  '....677777887777887776..', // 23  gold motif
  '....67777777777777767...', // 24
  '....66777777777777776...', // 25
  '....66777777777777776...', // 26
  '....66777777777777776...', // 27
  '....66677777777777666...', // 28
  '....66666666666666666...', // 29
  '....66666666666666666...', // 30
  '........................', // 31
];
const patelUprightExhale = patelUpright.slice();
patelUprightExhale[20] = '.....66777777777766.....';
patelUprightExhale[21] = '....66777887888777766...';

const patelSupine = [
  '........................', // 0
  '........................', // 1
  '............kkkkk.......', // 2
  '...........kkbbbkk......', // 3
  '...........kkbbbbk......', // 4
  '..........#bbbbbb#......', // 5
  '..........#sssssss#.....', // 6
  '..........ksSSSSSSsk....', // 7
  '..........ksSLLLLLSsk...', // 8
  '..........kSSL~~~~LSk...', // 9
  '..........kSSLLLLLLSk...', // 10
  '..........kSSLLLeLLSk...', // 11
  '..........kSSLLLLLLSk...', // 12
  '..........kSSLqqqqqSk...', // 13
  '..........kSSLqqqqqqSk..', // 14
  '...........ksSSSSSSsk...', // 15
  '............hssssssh....', // 16
  '..........WWWWWWWWWWW...', // 17
  '........WWWWWWWWWWWWWWW.', // 18
  '......WWWWWWWWWWWWWWWWWW', // 19
  '.....WWWWWWWWWWWWWWWWWWW', // 20
  '.....WWWWWWWWWWWWWWWWWWW', // 21
  '.....WWWWWYWYWYWYWYWWWWW', // 22
  '.....WWWWWWWWWWWWWWWWWWW', // 23
  '.....WWWWWWWWWWWWWWWWWWW', // 24
  '.....WWWWWWWWWWWWWWWWWWW', // 25
  '.....WWWWWWWWWWWWWWWWWWW', // 26
  '.....WWWWWWWWWWWWWWWWWWW', // 27
  '.....WWWWWWWWWWWWWWWWWWW', // 28
  '......WWWWWWWWWWWWWWWW..', // 29
  '........................', // 30
  '........................', // 31
];

function patelStable(): string[][] {
  return [patelUpright, patelUprightExhale];
}

function patelTriaged(): string[][] {
  // Subtle pallor + slight wince — but she IS stoic, so the change is small.
  const diffs: SpriteDiff[] = [
    { row: 11, col: 12, ch: 'k' }, // brow drawn
    { row: 11, col: 13, ch: 'k' },
    { row: 14, col: 11, ch: 'o' },
    { row: 14, col: 14, ch: 'o' },
  ];
  return [applyDiffs(patelUpright, diffs), applyDiffs(patelUprightExhale, diffs)];
}

function patelDeteriorating(): string[][] {
  // Clammy + diaphoresis on forehead. The atypical-STEMI presentation
  // finally shows on her face — she stops masking.
  const map = { s: 'C', S: 'c', L: 'd', l: 'D' };
  const diffs: SpriteDiff[] = [
    // Sweat droplets on the forehead — three of them
    { row: 6, col: 9, ch: 'A' },
    { row: 7, col: 9, ch: 'a' },
    { row: 6, col: 17, ch: 'A' },
    { row: 7, col: 17, ch: 'a' },
    // Open mouth (laboured breathing now)
    { row: 14, col: 12, ch: 'q' },
    { row: 14, col: 13, ch: 'q' },
    { row: 14, col: 14, ch: 'q' },
  ];
  return [
    applyDiffs(substSkin(patelUpright, map), diffs),
    applyDiffs(substSkin(patelUprightExhale, map), diffs),
  ];
}

function patelArrested(): string[][] {
  return [substSkin(patelSupine, { s: 'M', S: 'm', L: 'n', l: 'N' })];
}

function patelPostResus(): string[][] {
  const map = { s: 'C', S: 'c', L: 'd', l: 'D' };
  const diffs: SpriteDiff[] = [
    // Defib pad mark on chest (visible above sheet)
    { row: 16, col: 12, ch: 'r' },
    { row: 16, col: 13, ch: 'r' },
    // ECG leads
    { row: 17, col: 11, ch: 'Z' },
    { row: 18, col: 12, ch: 'Z' },
    // Oxygen via NRB (visible across mouth area)
    { row: 13, col: 12, ch: 'I' },
    { row: 13, col: 13, ch: 'I' },
    { row: 13, col: 14, ch: 'I' },
    { row: 14, col: 12, ch: 'I' },
    { row: 14, col: 13, ch: 'I' },
    { row: 14, col: 14, ch: 'I' },
  ];
  return [applyDiffs(substSkin(patelSupine, map), diffs)];
}

// ─── Renderer ───────────────────────────────────────────────────────────────

/** Render sprite rows to a crisp-edge SVG string. */
export function frameToSvg(rows: string[], scale = 4): string {
  if (rows.length === 0) return '';
  const w = rows[0]!.length;
  const h = rows.length;
  let svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ` +
    `shape-rendering="crispEdges" style="image-rendering:pixelated;` +
    `width:${w * scale}px;height:${h * scale}px;display:block">`;
  for (let y = 0; y < h; y++) {
    const row = rows[y]!;
    let x = 0;
    while (x < row.length) {
      const ch = row[x]!;
      const col = PAL[ch];
      if (col == null) {
        x++;
        continue;
      }
      let runEnd = x + 1;
      while (runEnd < row.length && row[runEnd] === ch) runEnd++;
      svg += `<rect x="${x}" y="${y}" width="${runEnd - x}" height="1" fill="${col}"/>`;
      x = runEnd;
    }
  }
  svg += '</svg>';
  return svg;
}

// ─── Sprite registry per patient ────────────────────────────────────────────

/**
 * Map case_id → sprite state factories. As Claude Design ships sprite
 * sets for additional patients, add entries here. Cases without a
 * registered sprite fall back to the CSS silhouette portrait.
 */
export const PATIENT_SPRITES: Record<
  string,
  Partial<Record<CaseStateT | 'post_resus', () => string[][]>>
> = {
  case_anaphylaxis_adult_peanut: {
    stable: bethStable,
    triaged: bethTriaged,
    unseen: bethStable,
    deteriorating: bethDeteriorating,
    arrested: bethArrested,
    deceased: bethArrested,
    admitted: bethPostResus,
    discharged: bethStable,
    post_resus: bethPostResus,
  },
  case_stroke_acute_williams: {
    stable: williamsStable,
    triaged: williamsTriaged,
    unseen: williamsStable,
    deteriorating: williamsDeteriorating,
    arrested: williamsArrested,
    deceased: williamsArrested,
    admitted: williamsPostResus,
    discharged: williamsStable,
    post_resus: williamsPostResus,
  },
  case_paracetamol_od_chloe: {
    stable: chloeStable,
    triaged: chloeTriaged,
    unseen: chloeStable,
    deteriorating: chloeDeteriorating,
    arrested: chloeArrested,
    deceased: chloeArrested,
    admitted: chloePostResus,
    discharged: chloeStable,
    post_resus: chloePostResus,
  },
  case_intox_stan_ambient: {
    stable: stanStable,
    triaged: stanTriaged,
    unseen: stanStable,
    deteriorating: stanDeteriorating,
    arrested: stanArrested,
    deceased: stanArrested,
    admitted: stanPostResus,
    discharged: stanStable,
    post_resus: stanPostResus,
  },
  case_chest_pain_patel_ambient: {
    stable: patelStable,
    triaged: patelTriaged,
    unseen: patelStable,
    deteriorating: patelDeteriorating,
    arrested: patelArrested,
    deceased: patelArrested,
    admitted: patelPostResus,
    discharged: patelStable,
    post_resus: patelPostResus,
  },
};

/**
 * Returns the rendered SVG markup for a patient at a given case state,
 * or null if the patient has no authored sprite yet.
 *
 * Two registries (M75): drop-#3's curated archetypes win where mapped
 * via CASE_TO_DROP_ID — they're rendered with their own self-contained
 * PAL via the dropPatientSprites module. Cases not in the drop map
 * fall through to PATIENT_SPRITES (the hand-authored Beth + Williams +
 * Chloe + Stan + Patel from sprites.ts).
 */
export function spriteSvgFor(
  caseId: string,
  state: CaseStateT,
  frameIndex = 0,
  scale = 6,
): string | null {
  // 1. Drop-#3 mapped patient first.
  const dropId = CASE_TO_DROP_ID[caseId];
  if (dropId) {
    const frames = dropPatientFrames(dropId, state);
    if (frames) {
      const frame = frames[frameIndex % frames.length];
      if (frame) return dropFrameToSvg(frame, scale);
    }
  }
  // 2. Hand-authored fallback (Beth, Williams, Chloe, Stan, Patel).
  const reg = PATIENT_SPRITES[caseId];
  if (!reg) return null;
  const factory = reg[state];
  if (!factory) return null;
  const frames = factory();
  const frame = frames[frameIndex % frames.length];
  if (!frame) return null;
  return frameToSvg(frame, scale);
}

/** Returns the number of animation frames for the given state. */
export function frameCountFor(caseId: string, state: CaseStateT): number {
  const dropId = CASE_TO_DROP_ID[caseId];
  if (dropId) {
    const frames = dropPatientFrames(dropId, state);
    if (frames) return frames.length;
  }
  const reg = PATIENT_SPRITES[caseId];
  if (!reg) return 0;
  const factory = reg[state];
  if (!factory) return 0;
  return factory().length;
}

/**
 * Per-case mapping into the drop-#3 archetype catalogue (M75/M76).
 *
 * The drop designs 15 patient sprites (Beth + Williams + 13 archetypes —
 * design's note in extras-sections.jsx: "15 patients × 5 states ≈ 30
 * sprites + 75 diffs"). The Skitt has 17 authored cases. M76 maps all
 * 17 cases to a sprite by accepting mild demographic looseness on the
 * weaker matches — supine + post-resus views read generic enough that
 * small age / gender differences don't break the simulation.
 *
 * STRONG matches (clinical condition + demographic align):
 *   doherty (81F urosepsis)       → case_sepsis_uti_morrison (84F)
 *   tom     (45M variceal)        → case_ugib_variceal_kowalski (54M)
 *   sarah   (32F PPH)             → case_ectopic_minors_sarah (31F ectopic)
 *   ahmed   (58M STEMI)           → case_htn_emergency_oduya (56M cardiovascular crisis)
 *   marcus  (26M chest stab)      → case_dka_marcus (19M DKA — name match,
 *                                    same gender, adult young man)
 *   joan    (74F hypothermia)     → case_head_injury_doac_brennan (81F faller)
 *   liam    (28M MH crisis)       → case_status_epilepticus_priya (28F status —
 *                                    same age, accept gender swap)
 *   ravi    (67M COPD)            → case_acute_heart_failure_ahmed (78M AHF)
 *
 * ACCEPTABLE matches (same body system or visual register, mild
 * demographic looseness):
 *   maya    (19F DKA)             → case_massive_pe_okonkwo (34F PE — female
 *                                    adult in respiratory distress; condition
 *                                    differs but skin-tint substitutions
 *                                    carry the clinical state)
 *   ruby    (6F asthma)           → case_anaphylaxis_paeds_sibling (Sam, 8M —
 *                                    paediatric respiratory crisis; gender
 *                                    differs but both are small children
 *                                    on the trolley with airway involvement)
 *   leo     (2M febrile)          → case_paeds_dka_amir (8M DKA — smaller
 *                                    paediatric sprite available; age gap
 *                                    is the cost)
 *   jake    (22M polytrauma)      → case_aortic_dissection_okafor (52M
 *                                    dissection — male catastrophic vascular;
 *                                    big age gap accepted)
 *
 * Unmapped drop archetype:
 *   connor (19M opioid OD)        — no remaining case; stays in the
 *                                    catalogue for future content
 *                                    (when Chloe gets a second hand-authored
 *                                    sprite or a new opioid-OD case lands).
 *
 * Five cases are hand-authored in sprites.ts (Beth, Williams, Chloe,
 * Stan, Patel) and stay served from PATIENT_SPRITES. The 12 above are
 * served from dropPatientSprites.ts. Total sprite coverage: 17 / 17.
 */
export const CASE_TO_DROP_ID: Record<string, string> = {
  case_sepsis_uti_morrison: 'doherty',
  case_ugib_variceal_kowalski: 'tom',
  case_ectopic_minors_sarah: 'sarah',
  case_acute_heart_failure_ahmed: 'ravi',
  case_head_injury_doac_brennan: 'joan',
  case_paeds_dka_amir: 'leo',
  case_anaphylaxis_paeds_sibling: 'ruby',
  case_dka_marcus: 'marcus',
  case_status_epilepticus_priya: 'liam',
  case_htn_emergency_oduya: 'ahmed',
  case_aortic_dissection_okafor: 'jake',
  case_massive_pe_okonkwo: 'maya',
};

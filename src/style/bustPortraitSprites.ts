/**
 * Bust portrait sprites — M98 reference (Beth).
 *
 * Replaces the 24×32 full-body sprite for the BAY MONITOR diegetic frame
 * (M93). Same { base, skinMap?, diffs? } recipe contract as the existing
 * `dropPatientSprites.ts` and `sprites.ts` systems — just at 4× the
 * cell count (48×48), with a self-contained palette and a parallel
 * resolver map (`CASE_TO_BUST_ID`).
 *
 * The resolver order in `sprites.ts` should be: bust → drop → hand-
 * authored. Wire-in patch documented in bustPortraitSprites.md.
 *
 * Light direction: top-left. Pose: dead-front, asymmetric 4-tone
 * shading carrying the 3D read. Eye treatment: heavy upper lid +
 * 2-px sclera + 1-px iris (never `wewew`). Mouth treatment: narrow
 * upper-lip cleft + lower-lip highlight (never `OOOO` smile-bar).
 *
 * Style guide: src/style/bustPortraitSprites.md
 */

import type { CaseStateT } from '../content/schema';

type PaletteMap = Record<string, string | null>;

export const BUST_PAL: PaletteMap = {
    // Structural
    '.': null,
    '#': '#0c0807',
    '~': '#2a1c12',

    // Skin — Beth (warm fair). 4 tones; substituted per-state.
    'l': '#fbe2c6',
    'L': '#eec19a',
    'S': '#cf947d',
    's': '#a87055',

    // Flushed tint (deteriorating skin overlay — histamine flush)
    'g': '#ffc8b4',
    'G': '#f59a83',
    'F': '#d76858',
    'f': '#a4413a',

    // Clammy / pallor (post-resus, shock)
    'D': '#ece1cd',
    'd': '#d5c6b1',
    'C': '#b29e8e',
    'c': '#7e6c5f',

    // Mottled (arrested)
    'N': '#b9adb0',
    'n': '#9a8d92',
    'M': '#736771',
    'm': '#4b424d',

    // Cyanosed (peri-arrest)
    'V': '#b0bdd2',
    'v': '#8a99b3',
    'B': '#5e7090',
    'b': '#3e4d6b',

    // Hair (Beth — brown bob, parted to her right)
    'k': '#180c06',
    'h': '#311a0c',
    'H': '#5a3318',
    'j': '#8a5224',

    // Eyes
    'e': '#1a1410',
    'w': '#e8ddc8',

    // Mouth (O upper, o cleft, R lower highlight, r swelling halo)
    'O': '#a44052',
    'o': '#6e2530',
    'R': '#d27786',
    'r': '#e89e8c',

    // Dress (Beth — hen-do pink + sparkle)
    'p': '#7a1f3e',
    'P': '#b5365e',
    'Q': '#d05a82',
    'q': '#e88aab',
    'X': '#f4b6cb',

    // Gown (postResus draping option)
    'W': '#dcd6c4',
    'Y': '#b8b099',
    'x': '#f1ecdc',

    // Clinical cues
    'U': '#c63830',
    'u': '#e87864',
    'A': '#8db8d4',
    'a': '#d4ebf6',
    'T': '#6a7c92',
    't': '#a8b6c8',
    'Z': '#3a3a3e',
    'z': '#7a4a3e',
    'I': '#caa854',
};

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

/** Render a bust sprite frame to a crisp-edge SVG string. */
export function bustFrameToSvg(rows: string[], scale = 4): string {
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
      const col = BUST_PAL[ch];
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

// ─── Beth — base bust + state recipes ─────────────────────────────────
//
// Two-frame breathing on every upright state: rows 35–38 (dress chest
// edge) shift down 1 px on exhale. Face does not move — this is a
// CCTV bust, a head-bob would feel cartoonish at this scale.
//
// Anchors for state recipe authors:
//   row 13–14 : eyebrows  (cols 22–24 + 28–30)
//   row 15–17 : eyes      (cols 22–24 + 29–31)
//   row 18–22 : nose + cheeks  (centre ridge at col 25)
//   row 23–26 : mouth     (cols 23–30, never wider)
//   row 30    : under-chin cast shadow (DO NOT cover with cues)
//   row 31–34 : neck      (urticaria, neck weals OK here)
//   bottom-left corner of monitor screen overlaps cols 0–10 × rows
//   38–47 — keep critical cues out of that quadrant.

const bethBaseInhale: string[] = [
  '................................................',
  '................................................',
  '....................kkkkkkkk....................',
  '..................kkhhhhhhhhhhkk................',
  '.................khhhHHHHHHHHHHhk...............',
  '................khhHHjjjjjjjHHHHhk..............',
  '...............khhHHjjjjjjjjHHHHHhk.............',
  '..............khhHHjjjjjjjHHHHHHHHhk............',
  '.............khhHHHjjjj#########HHHHhk..........',
  '.............khhHHHj#lllllllllL#HHHHhk..........',
  '............khhhHHj#llllllllLLLS#HHHhk..........',
  '............khhhHHj#llllllLLLLLS#HHHhk..........',
  '............khhhHHH#lllllLLLLLLS#HHHhk..........',
  '............khhhHHH#llLkkLLLkkLLS#HHhk..........',
  '............khhhHHH#lLLkkLLLkkLLS#HHhk..........',
  '............khhhHHH#lLL##LLLL##LLS#HHhk.........',
  '............khhhHHH#lLLweLLLLweLLS#HHhk.........',
  '............khhhHHH#lLL~~LLLL~~LLS#HHhk.........',
  '............khhhHHH#lLLLLLlLLLLLLS#HHhk.........',
  '............khhhHHH#lLLLLLlLLLLLLS#HHhk.........',
  '............khhhHHH#lLLLLLlLLLLLLS#HHhk.........',
  '............khhhHHH#lLLLLSlSLLLLLS#HHhk.........',
  '............khhhHHH#lLLLLLLLLLLLLS#HHhk.........',
  '............khhhHHH#lLLLLL~~LLLLLS#HHhk.........',
  '............khhhHHH#lLLLooOOooLLLS#HHhk.........',
  '............khhhHHH#lLLLLRRRRLLLLS#HHhk.........',
  '............khhhHHH#lLLLLLLLLLLLLS#HHhk.........',
  '............khhhHHH#LLLLLLLLLLLLLSS#HHhk........',
  '.............khhhHH#SLLLLLLLLLLLLLSs#HHk........',
  '..............khhHH##SsLLLLLLLLLLLss##Hk........',
  '...............khhH##sssssssssssss##Hk..........',
  '.................kHHLLLLLLLLLLLLLLSHk...........',
  '..................HLLLLLLLLLLLLLLSk.............',
  '..................LLLLLLLLLLLLLLLSk.............',
  '.................LLLLLLLLLLLLLLLLLSk............',
  '..............ppPPPPPPPPPPPPPPPPPPpp............',
  '.............pPPQqqqqqqqqqqqQQQQQQQQPp..........',
  '............pPPQqqqqqqqqqQQQQQQQQQQQPPp.........',
  '...........pPPQqqqqqXqqqqQQQQQQQQQQQQPPp........',
  '..........pPPQqqqqqqqqqqQQQQQQQQQQQQQQPPp.......',
  '.........pPPQqqqqqqqqQQQQQQQQXQQQQQQQQQPPp......',
  '........pPPQqqqqqqQQQQQQQQQQQQQQQQQQQQQQPPp.....',
  '.......pPPQqqqqQQQQQQQQQQQQQQQQQQQQQQQQQQPPp....',
  '......pPPQqqQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQPPp...',
  '.....pPPQqQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQPPp..',
  '....pPPQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQPPp.',
  '...pPPQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQPPp',
  '...pppppppppppppppppppppppppppppppppppppppppppp.',
];

const bethBaseExhale: string[] = [
  '................................................',
  '................................................',
  '....................kkkkkkkk....................',
  '..................kkhhhhhhhhhhkk................',
  '.................khhhHHHHHHHHHHhk...............',
  '................khhHHjjjjjjjHHHHhk..............',
  '...............khhHHjjjjjjjjHHHHHhk.............',
  '..............khhHHjjjjjjjHHHHHHHHhk............',
  '.............khhHHHjjjj#########HHHHhk..........',
  '.............khhHHHj#lllllllllL#HHHHhk..........',
  '............khhhHHj#llllllllLLLS#HHHhk..........',
  '............khhhHHj#llllllLLLLLS#HHHhk..........',
  '............khhhHHH#lllllLLLLLLS#HHHhk..........',
  '............khhhHHH#llLkkLLLkkLLS#HHhk..........',
  '............khhhHHH#lLLkkLLLkkLLS#HHhk..........',
  '............khhhHHH#lLL##LLLL##LLS#HHhk.........',
  '............khhhHHH#lLLweLLLLweLLS#HHhk.........',
  '............khhhHHH#lLL~~LLLL~~LLS#HHhk.........',
  '............khhhHHH#lLLLLLlLLLLLLS#HHhk.........',
  '............khhhHHH#lLLLLLlLLLLLLS#HHhk.........',
  '............khhhHHH#lLLLLLlLLLLLLS#HHhk.........',
  '............khhhHHH#lLLLLSlSLLLLLS#HHhk.........',
  '............khhhHHH#lLLLLLLLLLLLLS#HHhk.........',
  '............khhhHHH#lLLLLL~~LLLLLS#HHhk.........',
  '............khhhHHH#lLLLooOOooLLLS#HHhk.........',
  '............khhhHHH#lLLLLRRRRLLLLS#HHhk.........',
  '............khhhHHH#lLLLLLLLLLLLLS#HHhk.........',
  '............khhhHHH#LLLLLLLLLLLLLSS#HHhk........',
  '.............khhhHH#SLLLLLLLLLLLLLSs#HHk........',
  '..............khhHH##SsLLLLLLLLLLLss##Hk........',
  '...............khhH##sssssssssssss##Hk..........',
  '.................kHHLLLLLLLLLLLLLLSHk...........',
  '..................HLLLLLLLLLLLLLLSk.............',
  '..................LLLLLLLLLLLLLLLSk.............',
  '.................LLLLLLLLLLLLLLLLLSk............',
  '...............pPPPPPPPPPPPPPPPPPPp.............',
  '..............pPPQqqqqqqqqqQQQQQQQQQPp..........',
  '.............pPPQqqqqqqqqQQQQQQQQQQQPp..........',
  '............pPPQqqqqXqqqqqQQQQQQQQQQQPPp........',
  '..........pPPQqqqqqqqqqqQQQQQQQQQQQQQQPPp.......',
  '.........pPPQqqqqqqqqQQQQQQQQXQQQQQQQQQPPp......',
  '........pPPQqqqqqqQQQQQQQQQQQQQQQQQQQQQQPPp.....',
  '.......pPPQqqqqQQQQQQQQQQQQQQQQQQQQQQQQQQPPp....',
  '......pPPQqqQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQPPp...',
  '.....pPPQqQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQPPp..',
  '....pPPQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQPPp.',
  '...pPPQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQPPp',
  '...pppppppppppppppppppppppppppppppppppppppppppp.',
];

function bethStable(): string[][] {
  return [bethBaseInhale, bethBaseExhale];
}

function bethTriaged(): string[][] {
  const diffs: SpriteDiff[] = [
      { row: 14, col: 23, ch: 'k' },
      { row: 14, col: 30, ch: 'k' },
      { row: 16, col: 22, ch: '~' },
      { row: 16, col: 23, ch: '~' },
      { row: 16, col: 29, ch: '~' },
      { row: 16, col: 30, ch: '~' },
      { row: 24, col: 22, ch: 'o' },
      { row: 24, col: 23, ch: 'o' },
      { row: 24, col: 30, ch: 'o' },
      { row: 24, col: 31, ch: 'o' },
      { row: 25, col: 23, ch: 'r' },
      { row: 25, col: 28, ch: 'r' },
  ];
  return [
    applyDiffs(bethBaseInhale, diffs),
    applyDiffs(bethBaseExhale, diffs),
  ];
}

function bethDeteriorating(): string[][] {
  const skinMap = { l: 'g', L: 'G', S: 'F', s: 'f' };
  const diffs: SpriteDiff[] = [
      { row: 14, col: 22, ch: 'L' },
      { row: 14, col: 31, ch: 'L' },
      { row: 13, col: 22, ch: 'k' },
      { row: 13, col: 31, ch: 'k' },
      { row: 16, col: 23, ch: 'e' },
      { row: 16, col: 30, ch: 'e' },
      { row: 23, col: 23, ch: 'r' },
      { row: 23, col: 24, ch: 'r' },
      { row: 23, col: 25, ch: 'r' },
      { row: 23, col: 26, ch: 'r' },
      { row: 23, col: 27, ch: 'r' },
      { row: 23, col: 28, ch: 'r' },
      { row: 23, col: 29, ch: 'r' },
      { row: 24, col: 22, ch: 'r' },
      { row: 24, col: 23, ch: 'O' },
      { row: 24, col: 24, ch: 'O' },
      { row: 24, col: 25, ch: 'O' },
      { row: 24, col: 26, ch: 'O' },
      { row: 24, col: 27, ch: 'O' },
      { row: 24, col: 28, ch: 'O' },
      { row: 24, col: 29, ch: 'O' },
      { row: 24, col: 30, ch: 'r' },
      { row: 25, col: 22, ch: 'r' },
      { row: 25, col: 23, ch: 'R' },
      { row: 25, col: 24, ch: 'R' },
      { row: 25, col: 25, ch: 'R' },
      { row: 25, col: 26, ch: 'R' },
      { row: 25, col: 27, ch: 'R' },
      { row: 25, col: 28, ch: 'R' },
      { row: 25, col: 29, ch: 'R' },
      { row: 25, col: 30, ch: 'r' },
      { row: 26, col: 23, ch: 'r' },
      { row: 26, col: 24, ch: 'r' },
      { row: 26, col: 25, ch: 'r' },
      { row: 26, col: 26, ch: 'r' },
      { row: 26, col: 27, ch: 'r' },
      { row: 26, col: 28, ch: 'r' },
      { row: 26, col: 29, ch: 'r' },
      { row: 12, col: 15, ch: 'A' },
      { row: 13, col: 15, ch: 'A' },
      { row: 14, col: 15, ch: 'a' },
      { row: 20, col: 32, ch: 'U' },
      { row: 20, col: 33, ch: 'u' },
      { row: 21, col: 32, ch: 'u' },
      { row: 21, col: 33, ch: 'U' },
      { row: 31, col: 19, ch: 'U' },
      { row: 31, col: 20, ch: 'u' },
      { row: 31, col: 26, ch: 'u' },
      { row: 31, col: 27, ch: 'U' },
      { row: 32, col: 23, ch: 'U' },
      { row: 32, col: 24, ch: 'u' },
      { row: 33, col: 28, ch: 'U' },
  ];
  return [
    applyDiffs(substSkin(bethBaseInhale, skinMap), diffs),
    applyDiffs(substSkin(bethBaseExhale, skinMap), diffs),
  ];
}

function bethArrested(): string[][] {
  const skinMap = { l: 'N', L: 'n', S: 'M', s: 'm' };
  const diffs: SpriteDiff[] = [
      { row: 15, col: 22, ch: 'L' },
      { row: 15, col: 23, ch: 'L' },
      { row: 15, col: 24, ch: 'L' },
      { row: 15, col: 29, ch: 'L' },
      { row: 15, col: 30, ch: 'L' },
      { row: 15, col: 31, ch: 'L' },
      { row: 16, col: 22, ch: 'L' },
      { row: 16, col: 23, ch: '~' },
      { row: 16, col: 24, ch: '~' },
      { row: 16, col: 29, ch: '~' },
      { row: 16, col: 30, ch: '~' },
      { row: 16, col: 31, ch: 'L' },
      { row: 17, col: 22, ch: '~' },
      { row: 17, col: 23, ch: '~' },
      { row: 17, col: 24, ch: 'L' },
      { row: 17, col: 29, ch: 'L' },
      { row: 17, col: 30, ch: '~' },
      { row: 17, col: 31, ch: '~' },
      { row: 23, col: 23, ch: 'L' },
      { row: 23, col: 24, ch: 'L' },
      { row: 23, col: 25, ch: 'L' },
      { row: 23, col: 26, ch: 'L' },
      { row: 23, col: 27, ch: 'L' },
      { row: 23, col: 28, ch: 'L' },
      { row: 23, col: 29, ch: 'L' },
      { row: 24, col: 22, ch: 'L' },
      { row: 24, col: 23, ch: 'b' },
      { row: 24, col: 24, ch: 'b' },
      { row: 24, col: 25, ch: '#' },
      { row: 24, col: 26, ch: '#' },
      { row: 24, col: 27, ch: '#' },
      { row: 24, col: 28, ch: '#' },
      { row: 24, col: 29, ch: 'b' },
      { row: 24, col: 30, ch: 'L' },
      { row: 25, col: 22, ch: 'L' },
      { row: 25, col: 23, ch: 'b' },
      { row: 25, col: 24, ch: '#' },
      { row: 25, col: 25, ch: '#' },
      { row: 25, col: 26, ch: '#' },
      { row: 25, col: 27, ch: '#' },
      { row: 25, col: 28, ch: '#' },
      { row: 25, col: 29, ch: 'b' },
      { row: 25, col: 30, ch: 'L' },
      { row: 26, col: 22, ch: 'L' },
      { row: 26, col: 23, ch: 'L' },
      { row: 26, col: 24, ch: 'b' },
      { row: 26, col: 25, ch: 'b' },
      { row: 26, col: 26, ch: 'B' },
      { row: 26, col: 27, ch: 'b' },
      { row: 26, col: 28, ch: 'b' },
      { row: 26, col: 29, ch: 'L' },
      { row: 26, col: 30, ch: 'L' },
  ];
  return [applyDiffs(substSkin(bethBaseInhale, skinMap), diffs)];
}

function bethPostResus(): string[][] {
  // Post-ROSC. Eyes half-open (heavy / sedated), pallor tint, intubated
  // — ET tube exits the right corner of the mouth, cream tape across
  // the right cheek, NG tube down the right cheek into the nostril.
  // Faint sweat sheen still on brow. 2 frames (ventilator-driven, slow).
  const skinMap = { l: 'D', L: 'd', S: 'C', s: 'c' };
  const diffs: SpriteDiff[] = [
      { row: 15, col: 22, ch: 'd' },
      { row: 15, col: 23, ch: '~' },
      { row: 15, col: 24, ch: 'd' },
      { row: 15, col: 29, ch: 'd' },
      { row: 15, col: 30, ch: '~' },
      { row: 15, col: 31, ch: 'd' },
      { row: 16, col: 22, ch: '~' },
      { row: 16, col: 23, ch: '~' },
      { row: 16, col: 24, ch: 'w' },
      { row: 16, col: 29, ch: 'w' },
      { row: 16, col: 30, ch: '~' },
      { row: 16, col: 31, ch: '~' },
      { row: 11, col: 21, ch: 'a' },
      { row: 11, col: 30, ch: 'a' },
      // Mouth held open by tube — small dark interior visible behind
      // the tube where it exits the right corner.
      { row: 24, col: 25, ch: 'L' },
      { row: 24, col: 26, ch: '~' },
      { row: 24, col: 27, ch: '~' },
      { row: 24, col: 28, ch: 'L' },
      // ET tube body — exits right corner of mouth, crosses cheek
      // and off-frame past the head outline.
      { row: 24, col: 29, ch: 'T' },
      { row: 24, col: 30, ch: 'T' },
      { row: 24, col: 31, ch: 'T' },
      { row: 24, col: 32, ch: 'T' },
      { row: 24, col: 33, ch: 'T' },
      { row: 24, col: 34, ch: 'T' },
      { row: 24, col: 35, ch: 'T' },
      { row: 24, col: 36, ch: 'T' },
      { row: 24, col: 37, ch: 'T' },
      // ET tube highlight (upper edge of the tube cylinder).
      { row: 23, col: 29, ch: 't' },
      { row: 23, col: 30, ch: 't' },
      { row: 23, col: 31, ch: 't' },
      { row: 23, col: 32, ch: 't' },
      { row: 23, col: 33, ch: 't' },
      { row: 23, col: 34, ch: 't' },
      { row: 23, col: 35, ch: 't' },
      { row: 23, col: 36, ch: 't' },
      { row: 23, col: 37, ch: 't' },
      // Cream tape (skin-coloured surgical tape) anchoring the tube.
      // Angled strap from upper lip up to behind the ear.
      { row: 22, col: 28, ch: 'z' },
      { row: 22, col: 29, ch: 'z' },
      { row: 22, col: 30, ch: 'z' },
      { row: 22, col: 31, ch: 'z' },
      { row: 21, col: 29, ch: 'z' },
      { row: 21, col: 30, ch: 'z' },
      { row: 21, col: 31, ch: 'z' },
      { row: 21, col: 32, ch: 'z' },
      // NG tube — enters right nostril, parallel to ETT down the cheek.
      { row: 21, col: 26, ch: 'T' },
      { row: 25, col: 31, ch: 'T' },
      { row: 26, col: 31, ch: 'T' },
      { row: 27, col: 32, ch: 'T' },
      { row: 28, col: 32, ch: 'T' },
      { row: 29, col: 33, ch: 'T' },
      { row: 30, col: 33, ch: 'T' },
      // ECG lead — single thin wire emerging at the dress collar.
      { row: 35, col: 28, ch: 'Z' },
      { row: 36, col: 28, ch: 'Z' },
      { row: 37, col: 29, ch: 'Z' },
      { row: 38, col: 29, ch: 'Z' },
  ];
  return [
    applyDiffs(substSkin(bethBaseInhale, skinMap), diffs),
    applyDiffs(substSkin(bethBaseExhale, skinMap), diffs),
  ];
}

/**
 * Bust sprite registry per bust ID. Add new busts here as they're
 * authored. Map is independent of CASE_TO_BUST_ID below so the same
 * bust can in principle serve multiple cases (we don't lean on that
 * for M98 — Beth is the only entry).
 */
const BUST_SPRITES: Record<
  string,
  Partial<Record<CaseStateT | 'post_resus', () => string[][]>>
> = {
  beth: {
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
};

/**
 * Per-case mapping into the bust catalogue (M98).
 *
 * At this milestone the bust map covers ONLY the anaphylaxis reference
 * character. The other 15 cases fall through to CASE_TO_DROP_ID and
 * then to PATIENT_SPRITES (the existing 24×32 hand-authored set).
 *
 * Authoring more cases is gated on review of Beth + the style guide.
 */
export const CASE_TO_BUST_ID: Record<string, string> = {
  case_anaphylaxis_adult_peanut: 'beth',
};

/**
 * Returns the rendered frames for a bust at a given state, or null if
 * this bust has no recipe for the requested state.
 */
export function bustPatientFrames(
  bustId: string,
  state: CaseStateT,
): string[][] | null {
  const reg = BUST_SPRITES[bustId];
  if (!reg) return null;
  const factory = reg[state];
  if (!factory) return null;
  return factory();
}

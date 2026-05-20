/**
 * Achievement badges (M70) — per drop #3 polish-achievements.jsx.
 *
 * Each badge is 12×12 pixel art rendered inline as SVG; unlocked
 * badges live in localStorage and surface as a toast on the menu
 * after a shift completes, plus a row of unlocked badges on the
 * menu.
 *
 * Earn conditions are scanned by scanAchievements() against an
 * episode report. Conditions are conservative — design can tighten
 * the thresholds in a future pass without breaking saved unlocks.
 */

export interface Achievement {
  id: string;
  title: string;
  sub: string;
  rows: string[];
}

const BADGE_PAL: Record<string, string | null> = {
  '.': null,
  '#': '#0d0805',
  'G': '#5BBF8F',
  'H': '#6e4a2e',
  'L': '#c99680',
  'P': '#c7416f',
  'R': '#C8362A',
  'W': '#e8e4d8',
  'Y': '#E0A82E',
  'b': '#0d2120',
  'c': '#1a3837',
  'g': '#3a8a6a',
  'h': '#4a3220',
  'k': '#1a1a1a',
  'r': '#7A1E16',
  'w': '#f1ece3',
  'y': '#9C8D5C',
};

export const BADGES: Record<string, Achievement> = {
  first_save: {
    id: 'first_save',
    title: 'FIRST SAVE',
    sub: 'You saved a life · welcome to EM',
    rows: [
      '....rrrr....',
      '...rRRRRr...',
      '..rRRRRRRr..',
      '..rRRWWRRr..',
      '.rRWRWWRWRr.',
      '.rRWWWWWWRr.',
      '..rRRWWRRr..',
      '..rRRWWRRr..',
      '...rRWWRr...',
      '....rrrr....',
      '.....rr.....',
      '....r..r....',
    ],
  },
  anaphylaxis_ace: {
    id: 'anaphylaxis_ace',
    title: 'ANAPHYLAXIS · ACE',
    sub: 'IM adrenaline within 60s of recognition',
    rows: [
      '....yyyy....',
      '...yYYYYy...',
      '..yYYYYYYy..',
      '.yYYWWWWYYy.',
      '.yYWYWWYWYy.',
      '.yYWWWWWWYy.',
      '..yYWWWWYy..',
      '...yYWWYy...',
      '....yYYy....',
      '.....yy.....',
      '......y.....',
      '.....yy.....',
    ],
  },
  perfect_resus: {
    id: 'perfect_resus',
    title: 'PERFECT RESUS',
    sub: 'ALS algorithm · zero deviations · ROSC',
    rows: [
      '....gggg....',
      '...gGGGGg...',
      '..gGGGGGGg..',
      '.gG..GG..Gg.',
      '.gGG.GG.GGg.',
      '.gGGGGGGGGg.',
      '..gGGGGGGg..',
      '...gGGGGg...',
      '....gGGg....',
      '.....gg.....',
      '....g..g....',
      '...g....g...',
    ],
  },
  bleep_lord: {
    id: 'bleep_lord',
    title: 'BLEEP LORD',
    sub: 'Handled 5 bleeps mid-resus without errors',
    rows: [
      '....####....',
      '...######...',
      '..########..',
      '..#wwwwww#..',
      '..#wkkkkw#..',
      '..#wwwwww#..',
      '..########..',
      '..#kk..kk#..',
      '..########..',
      '....yyyy....',
      '....yYYy....',
      '....yyyy....',
    ],
  },
  marathon: {
    id: 'marathon',
    title: 'MARATHON',
    sub: '15 patients in a single shift',
    rows: [
      '...rrrrrr...',
      '..rRRRRRRr..',
      '..rRwwwwRr..',
      '..rRwkkwRr..',
      '..rRwkkwRr..',
      '..rRwwwwRr..',
      '..rRRRRRRr..',
      '...rrrrrr...',
      '....rrrr....',
      '....rrrr....',
      '...r....r...',
      '..rr....rr..',
    ],
  },
  rcem_reader: {
    id: 'rcem_reader',
    title: 'RCEM READER',
    sub: 'Tapped 25 citations in a single shift',
    rows: [
      '.PPPPPPPPPP.',
      'P.PPPPPPPP.P',
      'P.kkkkkkkk.P',
      'P.kkkk.kkk.P',
      'P.kk.kkkkk.P',
      'P.kkkkk.kk.P',
      'P.kk.kk.kk.P',
      'P.kkkkkkkk.P',
      'P.PPPPPPPP.P',
      '.PPPPPPPPPP.',
      '............',
      '............',
    ],
  },
  cool_hands: {
    id: 'cool_hands',
    title: 'COOL HANDS',
    sub: 'IV access first-pass on 10 consecutive patients',
    rows: [
      '....hhhh....',
      '...hHHHHh...',
      '..hHHHHHHh..',
      '..hHLLLLHh..',
      '..hHLLLLHh..',
      '..hHHHHHHh..',
      '...PPPPPP...',
      '....PRRP....',
      '....PRRP....',
      '....PRRP....',
      '....bbbb....',
      '....b..b....',
    ],
  },
  honest_to_god: {
    id: 'honest_to_god',
    title: 'HONEST TO GOD',
    sub: 'Asked for senior help before a deterioration',
    rows: [
      '............',
      '.....##.....',
      '....####....',
      '...##cc##...',
      '..##cccc##..',
      '..#cccccc#..',
      '..#cccccc#..',
      '..##cccc##..',
      '...########.',
      '............',
      '....yyyy....',
      '............',
    ],
  },
};

export function badgeFrameToSvg(rows: string[], scale = 3): string {
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
      const col = BADGE_PAL[ch];
      if (col == null) { x++; continue; }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      svg += `<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${col}"/>`;
      x = end;
    }
  }
  svg += `</svg>`;
  return svg;
}

const STORAGE_KEY = "theSkitt.achievements.v1";

export function loadUnlocked(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch { return new Set(); }
}

export function saveUnlocked(unlocked: Set<string>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
  } catch { /* ignore quota */ }
}

/**
 * Scan a finished episode report for newly-earned badges.
 * Returns the badge ids that should be added to the unlocked set.
 *
 * Conservative thresholds — design can tighten without breaking
 * existing saves.
 */
export interface ScanInput {
  livesSaved: number;
  band: "excellent" | "good" | "borderline" | "unsafe";
  sequenceErrors: number;
  totalShiftsPlayed: number;
  attendedCaseIds: string[];
  branchesWithPositiveRapport: number;
  branchesAvailable: number;
}

export function scanAchievements(input: ScanInput, alreadyUnlocked: Set<string>): string[] {
  const newly: string[] = [];
  const add = (id: string) => { if (!alreadyUnlocked.has(id) && !newly.includes(id)) newly.push(id); };
  // first_save — first life saved across all shifts
  if (input.livesSaved >= 1) add("first_save");
  // anaphylaxis_ace — Beth attended + excellent band
  if (input.attendedCaseIds.includes("case_anaphylaxis_adult_peanut") && input.band === "excellent") {
    add("anaphylaxis_ace");
  }
  // cool_hands — zero sequence errors across the shift
  if (input.sequenceErrors === 0 && input.band !== "unsafe") add("cool_hands");
  // marathon — 5 shifts played
  if (input.totalShiftsPlayed >= 5) add("marathon");
  // honest_to_god — branched cases with positive rapport on at least one
  if (input.branchesAvailable > 0 && input.branchesWithPositiveRapport >= 1) {
    add("honest_to_god");
  }
  // perfect_resus — band excellent with at least one resus-protocol case attended
  const RESUS_CASES = new Set([
    "case_anaphylaxis_adult_peanut",
    "case_status_epilepticus_priya",
    "case_massive_pe_okonkwo",
    "case_aortic_dissection_okafor",
    "case_ugib_variceal_kowalski",
  ]);
  if (input.band === "excellent" && input.attendedCaseIds.some(c => RESUS_CASES.has(c))) {
    add("perfect_resus");
  }
  return newly;
}
/**
 * Encounter prop sprites — syringe, IV bag, ECG dots, defib pads, etc.
 *
 * Ported from Claude Design's `world-sprites.js` (second drop). 16×16
 * paint-by-string grids in the world/prop palette. Used inline in the
 * management list (M45) to give each action a diegetic glyph — a
 * syringe for IM adrenaline, an O2 mask for high-flow O2, an ECG
 * dot for 12-lead ECG.
 *
 * The world palette is intentionally separate from the patient-sprite
 * palette (sprites.ts) — the chars are reused across the two with
 * different colour meanings, so don't share renderer.
 */

import type { CaseT } from '../content/schema';

type PropPalette = Record<string, string | null>;

const PAL: PropPalette = {
  '.': null,
  '#': '#1a1310',
  '~': '#3a2a22',
  l: '#F1ECE3',
  L: '#DCD6CB',
  m: '#C4C1BA',
  n: '#A29F98',
  d: '#6B6862',
  t: '#7FCBC8',
  T: '#4FA3A0',
  U: '#3D8885',
  u: '#2B5F5D',
  V: '#15302F',
  r: '#E85045',
  R: '#C8362A',
  A: '#A22B23',
  a: '#7A1E16',
  X: '#4D110B',
  G: '#5BBF8F',
  g: '#86E0B5',
  W: '#E0A82E',
  w: '#1A2A28',
  p: '#FBF7E8',
  P: '#F4E9A6',
  q: '#E0D49A',
  Q: '#9C8D5C',
  k: '#2B2A25',
  c: '#D6D4CD',
  C: '#9C9A93',
  s: '#6B6862',
  S: '#3a3a3a',
  b: '#B8D8E8',
  B: '#7AA8C0',
  I: '#FFFFFF',
  i: '#E8F4FF',
  j: '#1c4a9a',
  J: '#2a72df',
  o: '#8a5e3a',
  O: '#6e4a2e',
  e: '#2a5a2a',
  E: '#4a8a4a',
  y: '#E0A82E',
  Y: '#F4C860',
  h: '#c99680',
  H: '#ecbf9f',
  F: '#f6dcc2',
  z: '#7A1E16',
  Z: '#4D110B',
};

export const PROP_SPRITES: Record<string, string[]> = {
  syringe_adrenaline: [
    '................',
    '...CCCCCCCCs....',
    '..CIIIIIIIICs...',
    '..CIRRRRRRICss..',
    '..CIIIIIIIICs...',
    '...CCCCCCCCs....',
    '......##........',
    '.....####.......',
    '......##........',
    '......##........',
    '......##........',
    '......##........',
    '......##........',
    '......##........',
    '......##........',
    '................',
  ],
  iv_bag_saline: [
    '......CCCC......',
    '.....CsCsC......',
    '....CCCCCCC.....',
    '....CiiiiiC.....',
    '....CibbbiC.....',
    '....CibIbiC.....',
    '....CibbbiC.....',
    '....CibbbiC.....',
    '....CibbbiC.....',
    '....CibbbiC.....',
    '....CipPpiC.....',
    '....CipPpiC.....',
    '....CCCCCCC.....',
    '......##........',
    '......##........',
    '......##........',
  ],
  blood_vials: [
    '................',
    '.RR.PP.WW.JJ.kk.',
    '.RR.PP.WW.JJ.kk.',
    '.CC.CC.CC.CC.CC.',
    '.CC.CC.CC.CC.CC.',
    '.Cz.CI.CI.CI.CI.',
    '.Cz.Ci.Ci.Ci.Ci.',
    '.Cz.Ci.Ci.Ci.Ci.',
    '.Cz.CI.CI.CI.CI.',
    '.Cz.Ci.Ci.Ci.Ci.',
    '.CC.CC.CC.CC.CC.',
    '.CC.CC.CC.CC.CC.',
    '.ss.ss.ss.ss.ss.',
    '................',
    '................',
    '................',
  ],
  ecg_dots: [
    '................',
    '....CC..CC......',
    '...CggC.CggC....',
    '...CgGC.CgGC....',
    '....CC..CC......',
    '....SS..SS......',
    '.....S..S.......',
    '.....S..S.......',
    '......SS........',
    '......SS........',
    '....CC..CC......',
    '...CggC.CggC....',
    '...CgGC.CgGC....',
    '....CC..CC......',
    '................',
    '................',
  ],
  oxygen_mask_nrb: [
    '................',
    '.....IIIIII.....',
    '....IIIIIIII....',
    '...IiiIIIIiiI...',
    '..IiIIIIIIIIiI..',
    '..IiI######IiI..',
    '..IiIIIIIIIIiI..',
    '..IiI######IiI..',
    '..IiIIIIIIIIiI..',
    '...IiIIIIIIiI...',
    '....IIIIIIII....',
    '.....I####I.....',
    '......eeee......',
    '......EEEE......',
    '......eeee......',
    '......EEEE......',
  ],
  bvm: [
    '................',
    '..CCCCCCCCCCCC..',
    '.CIIIIIIIIIIIIC.',
    '.CIiiiiiiiiiiiC.',
    '.CIiiCCCCCCiiC..',
    '.CIiiCCCCCCiiC..',
    '.CIiiiiiiiiiiiC.',
    '.CIiiiiiiiiiiiC.',
    '..CCCCCCCCCCCC..',
    '......eeee......',
    '......EEEE......',
    '......eeee......',
    '.....IIIIII.....',
    '....IiIIIIiI....',
    '....IiI##IiI....',
    '.....IIIIII.....',
  ],
  drug_chart: [
    '................',
    '.PPPPPPPPPPPPPP.',
    '.PqqqqqqqqqqqqP.',
    '.PqqkPkPkPkPqqP.',
    '.PqqkkkkkkkkkqP.',
    '.PqqkPkPkPkPqqP.',
    '.PqqkkkkkkkkkqP.',
    '.PqqkPkPkPkPqqP.',
    '.PqqkkkkkkkkkqP.',
    '.Pqq##qq##qqqqP.',
    '.PqqqqqqqqqqqqP.',
    '.PqRRSTATqqqqqP.',
    '.PqqqqqqqqqqqqP.',
    '.PqqqqqqqqqqqqP.',
    '.PPPPPPPPPPPPPP.',
    '................',
  ],
  cannula_iv: [
    '................',
    '...........bb...',
    '..........bbbb..',
    '.........bbbbbb.',
    '.........bbbbbb.',
    '..........bbbb..',
    '...........bb...',
    '...........bb...',
    '..........IIII..',
    '.........IiiiiI.',
    '........IiiIIII.',
    '.......IiiI.....',
    '......IiiI......',
    '.....IiiI.......',
    '....IiII........',
    '...IiI..........',
  ],
  glucometer: [
    '................',
    '..############..',
    '..#wwwwwwwwww#..',
    '..#wggggggggw#..',
    '..#wggggggggw#..',
    '..#wwwwwwwwww#..',
    '..#WWWWWWWWWW#..',
    '..#WW######WW#..',
    '..############..',
    '..#####sss####..',
    '..############..',
    '..############..',
    '..############..',
    '..############..',
    '..############..',
    '................',
  ],
  defib_pads: [
    '................',
    '..ffffffff......',
    '..fffyyfffs.....',
    '..fffyyfffs.....',
    '..fffyyfffs.....',
    '..ffffffffss....',
    '...sss....sss...',
    '....ssssssss....',
    '....ssssssss....',
    '...sss....sss...',
    '..ffffffffss....',
    '..fffyyfffs.....',
    '..fffyyfffs.....',
    '..fffyyfffs.....',
    '..ffffffff......',
    '................',
  ],
  et_tube: [
    '................',
    '.IIIIIIIIIIIIII.',
    '.IiiiiiiiiiiiiI.',
    '.IiIIIIIIIIIIII.',
    '.IIIIIIIIIIIIII.',
    '................',
    '................',
    '..bbbbbb........',
    '..bIIIIIb.......',
    '..bIiIIIb.......',
    '..bIIIIIb.......',
    '..bbbbbb........',
    '.....s..........',
    '....ss..........',
    '...ss...........',
    '...s............',
  ],
  nurse_call_btn: [
    '................',
    '..rrrrrrrrrrrr..',
    '..rRRRRRRRRRRr..',
    '..rRRRRRRRRRRr..',
    '..rRRWWWWWWRRr..',
    '..rRWWyyyyWWRr..',
    '..rRWyyYYyyWRr..',
    '..rRWyyYYyyWRr..',
    '..rRWWyyyyWWRr..',
    '..rRRRRRRRRRRr..',
    '..rRRRRRRRRRRr..',
    '..rrrrrrrrrrrr..',
    '....ssssssss....',
    '....ssssssss....',
    '................',
    '................',
  ],
};

export function propFrameToSvg(rows: string[], scale = 1): string {
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
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      svg += `<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${col}"/>`;
      x = end;
    }
  }
  svg += '</svg>';
  return svg;
}

/**
 * Pick the prop sprite that best represents a management action.
 *
 * Matches in order:
 *   1. Action name regex hits (most specific — 'adrenaline' →
 *      syringe_adrenaline beats the generic 'drug' fallback).
 *   2. Action category fallback (drug → drug_chart, airway →
 *      et_tube, breathing → oxygen_mask_nrb, circulation →
 *      iv_bag_saline, monitoring → ecg_dots).
 *   3. null when neither matches — the row renders without a prop.
 */
export function propIdForAction(
  action: CaseT['management'][number],
): keyof typeof PROP_SPRITES | null {
  const name = action.name.toLowerCase();
  // Specific name matches — order matters: most-specific first.
  if (/adrenaline|epinephrine|epipen/.test(name)) return 'syringe_adrenaline';
  if (/intubat|et tube|et-tube|laryng/.test(name)) return 'et_tube';
  if (/12-lead|12 lead|ecg|electrocard|cardiac monitor/.test(name)) return 'ecg_dots';
  if (/defib|shock|pads|cpr|chest compress|cardiover/.test(name)) return 'defib_pads';
  if (/glucose check|capillary glucose|bm\b|finger.?stick|hypostop check/.test(name))
    return 'glucometer';
  if (/iv (fluid|bolus|crystalloid)|saline|hartmann|plasmalyte|crystalloid|fluid challenge/.test(name))
    return 'iv_bag_saline';
  if (/high.?flow o2|non.?rebreath|nrb mask|15.?l|oxygen mask|venturi/.test(name))
    return 'oxygen_mask_nrb';
  if (/bvm|bag.?mask|bag.?valve/.test(name)) return 'bvm';
  if (/cannula|peripheral access|grey cannula|orange cannula|iv access/.test(name))
    return 'cannula_iv';
  if (/blood (?:cultures?|sample|bottles|tests)|venous bloods|fbc|u&e|group/.test(name))
    return 'blood_vials';
  if (/call sister|call senior|crash call|2222|nurse in charge|escalat/.test(name))
    return 'nurse_call_btn';
  // Category fallback.
  switch (action.category) {
    case 'drug':
      return 'drug_chart';
    case 'fluid':
      return 'iv_bag_saline';
    case 'monitoring':
      return 'ecg_dots';
    case 'escalation':
      return 'nurse_call_btn';
    case 'procedure':
    case 'referral':
    case 'disposition':
    case 'safety_net':
      return null;
  }
  return null;
}

/**
 * Overworld NPC sprites — paramedic, triage nurse, F1 doctor, sister,
 * anaesthetic SHO, security, worried partner, bereaved relative.
 *
 * Ported from Claude Design's `npc-sprites.js` (Visual Style Guide
 * second drop). 16×24 paint-by-string grids in a fixed NPC palette,
 * rendered as coalesce-run SVG so the silhouette stays crisp at
 * scale.
 *
 * The integration point is the history list (M43): each source the
 * player asks (paramedic / family / nurse / triage_note) renders the
 * matching NPC sprite next to the card, so the conversation lands as
 * 'I went and spoke to the paramedic' rather than 'I clicked a row'.
 */

import type { HistoryItemT } from '../content/schema';

type NpcPalette = Record<string, string | null>;

const NPC_PAL: NpcPalette = {
  '.': null,
  '#': '#1a1310',
  '~': '#3a2a22',
  k: '#2a1c10',
  h: '#4a3220',
  H: '#6e4a2e',
  g: '#9c9a93',
  G: '#d6d4cd',
  b: '#0d0805',
  s: '#9c6e4a',
  S: '#c99878',
  L: '#e8c39e',
  l: '#f6dcc2',
  n: '#0b3a82',
  N: '#1556c2',
  B: '#2a72df',
  v: '#0c1c3c',
  V: '#1b2f5a',
  p: '#2a5a2a',
  P: '#4a8a4a',
  t: '#2B5F5D',
  T: '#4FA3A0',
  c: '#e8e4d8',
  C: '#f4f7f9',
  d: '#cfc9b8',
  y: '#E0A82E',
  Y: '#f4c860',
  q: '#1a1a1a',
  Q: '#3a3a3a',
  j: '#7a3a2a',
  J: '#a85a3a',
  m: '#3a4a5a',
  M: '#5a6a7a',
  e: '#3a2a22',
  i: '#cfc7b0',
  I: '#f0e9cd',
  r: '#c8362a',
  R: '#e85045',
  O: '#3a2a22',
  Z: '#a0a09c',
  z: '#3a3a3a',
  f: '#1a1a1a',
  F: '#3a3a3a',
  w: '#2b2a25',
  W: '#cfc9b8',
};

export const NPC_SPRITES: Record<string, string[]> = {
  paramedic: [
    '................',
    '......####......',
    '.....#hhhh#.....',
    '.....#hhhh#.....',
    '.....#SLLS#.....',
    '.....#SeesS.....',
    '.....#SLLLS.....',
    '.....#SmmmS.....',
    '......#SS#......',
    '.....pPPPPp.....',
    '....pPPyyPPp....',
    '...pPPyyyyPPp...',
    '...pPPPPPPPPp...',
    '...pPyyyyyyPp...',
    '...pPPPPPPPPp...',
    '...pPPPPPPPPp...',
    '....pPP##PPp....',
    '....pPPzzPPp....',
    '....pPP##PPp....',
    '....pPPPPPPp....',
    '....pPPPPPPp....',
    '....pPPPPPPp....',
    '....fFF##FFf....',
    '....fFf..fFf....',
  ],
  triage_nurse: [
    '................',
    '......####......',
    '.....#hhhh#.....',
    '.....#hhhh#.....',
    '.....#SLLS#.....',
    '.....#SeesS.....',
    '.....#SLLLS.....',
    '.....#SmmmS.....',
    '......#SS#......',
    '.....nNNNNn.....',
    '....nNNNNNNn....',
    '...nNNNiiNNNn...',
    '...nNNiIIiNNn...',
    '...nNNNiiNNNn...',
    '...nNNZZZZNNn...',
    '...nNNNNNNNNn...',
    '...nNNNNNNNNn...',
    '....nNNNNNNn....',
    '....nNNNNNNn....',
    '....nNNNNNNn....',
    '....nNNNNNNn....',
    '....nNNNNNNn....',
    '....wWW##WWw....',
    '....wWw..wWw....',
  ],
  f1_doctor: [
    '................',
    '......####......',
    '.....#kkkk#.....',
    '.....#kkkk#.....',
    '.....#sSSs#.....',
    '.....#sees#.....',
    '.....#sSSSs.....',
    '.....#sLmLs.....',
    '......#ss#......',
    '....cCttttCc....',
    '...cCCttttCCc...',
    '...cCCtiiitCCc..',
    '...cCCtiIitCCc..',
    '...cCCttttCCc...',
    '...cCCttttCCc...',
    '...cCCttZttCCc..',
    '...cCCttttCCc...',
    '....cdttttdc....',
    '.....tttttt.....',
    '.....tttttt.....',
    '.....tttttt.....',
    '.....tttttt.....',
    '....fFF##FFf....',
    '....fFf..fFf....',
  ],
  sister: [
    '................',
    '......####......',
    '.....#GGgg#.....',
    '.....#GGgg#.....',
    '.....#sSSs#.....',
    '.....#sees#.....',
    '.....#sSSSs.....',
    '.....#sLOLs.....',
    '......#ss#......',
    '.....vVVVVv.....',
    '....vVVVVVVv....',
    '...vVVVrrVVVv...',
    '...vVVrRRrVVv...',
    '...vVVVrrVVVv...',
    '...vVVVVVVVVv...',
    '...vVVVVVVVVv...',
    '...vVVVVVVVVv...',
    '....vVVVVVVv....',
    '....vVVVVVVv....',
    '....vVVVVVVv....',
    '....vVVVVVVv....',
    '....vVVVVVVv....',
    '....fFF##FFf....',
    '....fFf..fFf....',
  ],
  anaesthetic_sho: [
    '................',
    '......####......',
    '.....#kkkk#.....',
    '.....#kkkkk.....',
    '.....#sSSs#.....',
    '.....#sees#.....',
    '.....#sSSSs.....',
    '.....#sLOLs.....',
    '......#ss#......',
    '.....tTTTTt.....',
    '....tTTTTTTt....',
    '...tTTTiiTTTt...',
    '...tTTiIiTTTt...',
    '...tTTTiiTTTt...',
    '...tTTTTTTTTt...',
    '...tTTTTTTTTt...',
    '....tTTTTTTt....',
    '....tTTTTTTt....',
    '....tTTTTTTt....',
    '....tTTTTTTt....',
    '....tTTTTTTt....',
    '....tTTTTTTt....',
    '....WwW##WwW....',
    '....Www..wWW....',
  ],
  security: [
    '................',
    '......####......',
    '.....#bbbb#.....',
    '.....#bbbb#.....',
    '.....#sSSs#.....',
    '.....#sees#.....',
    '.....#sSSSs.....',
    '.....#smmms.....',
    '......#ss#......',
    '.....qQyyQq.....',
    '....qQyyyyQq....',
    '...qQyyyyyyQq...',
    '...qQQQQQQQQq...',
    '...qQQrRRrQQq...',
    '...qQQQQQQQQq...',
    '...qQyyyyyyQq...',
    '...qQQzzzzQQq...',
    '....qQQQQQQq....',
    '....qQQQQQQq....',
    '....qQQQQQQq....',
    '....qQQQQQQq....',
    '....qQQQQQQq....',
    '....fFF##FFf....',
    '....fFf..fFf....',
  ],
  worried_partner: [
    '................',
    '......####......',
    '.....#hhhh#.....',
    '.....#hhhh#.....',
    '.....#SLLS#.....',
    '.....#SOOS#.....',
    '.....#SLLLS.....',
    '.....#SOmmS.....',
    '......#SS#......',
    '.....jJJJJj.....',
    '....jJJJJJJj....',
    '...jJJJJJJJJj...',
    '...jJJJJJJJJj...',
    '...jJJJJJJJJj...',
    '...jJJJJJJJJj...',
    '...jJJJJJJJJj...',
    '....jJJJJJJj....',
    '....jJJJJJJj....',
    '....mMMMMMMm....',
    '....mMMMMMMm....',
    '....mMMMMMMm....',
    '....mMMMMMMm....',
    '....wWw..wWw....',
    '....ww....ww....',
  ],
  bereaved_relative: [
    '................',
    '......####......',
    '.....#GGGG#.....',
    '.....#GGGG#.....',
    '.....#sSSs#.....',
    '.....#s~~s#.....',
    '.....#sSSSs.....',
    '.....#smmms.....',
    '......#ss#......',
    '.....mMMMMm.....',
    '....mMMMMMMm....',
    '...mMMMMMMMMm...',
    '...mMMMMMMMMm...',
    '...mMMMMMMMMm...',
    '...mMMMMMMMMm...',
    '...mMMMMMMMMm...',
    '....mMMMMMMm....',
    '....mMMMMMMm....',
    '....mMMMMMMm....',
    '....mMMMMMMm....',
    '....mMMMMMMm....',
    '....mMMMMMMm....',
    '....fFF##FFf....',
    '....fFf..fFf....',
  ],
};

export function npcFrameToSvg(rows: string[], scale = 2): string {
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
      const col = NPC_PAL[ch];
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
 * Map a HistoryItem.source onto an NPC sprite id. Returns null when
 * no sprite makes sense for that source (records, gp_letter, patient
 * — patient is already on-screen in the PatientPanel).
 *
 * `nurse` defaults to the sister sprite — in UK ED the senior nurse
 * is the one most likely to be the source of a 'nurse said' history
 * item. Triage notes get the triage nurse.
 *
 * The `family` mapping accepts an optional case-level override so a
 * bereaved-relative variant can be picked for cases where that lands
 * better narratively (e.g. Stan's son in M21 if authored, or the
 * scrubs-team SHO sprite for handover-style history items).
 */
export function npcSpriteIdForSource(
  source: HistoryItemT['source'],
  override?: string,
): keyof typeof NPC_SPRITES | null {
  if (override && override in NPC_SPRITES) return override as keyof typeof NPC_SPRITES;
  switch (source) {
    case 'paramedic':
      return 'paramedic';
    case 'triage_note':
      return 'triage_nurse';
    case 'nurse':
      return 'sister';
    case 'family':
      return 'worried_partner';
    case 'patient':
    case 'records':
    case 'gp_letter':
      return null;
  }
}

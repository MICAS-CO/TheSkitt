/**
 * 16×16 pixel-art status icons — ported from Claude Design's
 * `icons.jsx` (Visual Style Guide Phase 1).
 *
 * Each glyph is a paint-by-string grid rendered as crisp-edge SVG.
 * '.' transparent · 'x' full fill · 'o' half-tone (50% opacity).
 */

import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  fill?: string;
  title?: string;
  style?: CSSProperties;
  className?: string;
}

function makeIcon(rows: string[], defaultColor: string) {
  return function Icon({ size = 16, fill = defaultColor, title, style, className }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
        role={title ? 'img' : 'presentation'}
        aria-label={title}
      >
        {title && <title>{title}</title>}
        {rows.flatMap((row, y) =>
          [...row].map((ch, x) => {
            if (ch === 'x') return <rect key={`${x},${y}`} x={x} y={y} width="1" height="1" fill={fill} />;
            if (ch === 'o')
              return <rect key={`${x},${y}`} x={x} y={y} width="1" height="1" fill={fill} opacity="0.5" />;
            return null;
          }),
        )}
      </svg>
    );
  };
}

export const IconRedFlag = makeIcon(
  [
    '.xx.............',
    '.xxxxxxxx.......',
    '.xxxxxxxxxx.....',
    '.xxxxxxxxxxx....',
    '.xxxxxxxxxxx....',
    '.xxxxxxxxxx.....',
    '.xxxxxxxx.......',
    '.xxxxx..........',
    '.xx.............',
    '.xx.............',
    '.xx.............',
    '.xx.............',
    '.xx.............',
    '.xx.............',
    'xxxx............',
    '................',
  ],
  '#C8362A',
);

export const IconMustDo = makeIcon(
  [
    '................',
    '.xxxxxxxxxxxx...',
    '.x..........x...',
    '.x....xx....x...',
    '.x...xxxx...x...',
    '.x..xxxxxx..x...',
    '.x.xxxxxxxx.x...',
    '.xxxx....xxxx...',
    '.x.xx....xx.x...',
    '.x..xx..xx..x...',
    '.x...xxxx...x...',
    '.x..xx..xx..x...',
    '.x.xx....xx.x...',
    '.xxxx....xxxx...',
    '.xxxxxxxxxxxx...',
    '................',
  ],
  '#4FA3A0',
);

export const IconTrap = makeIcon(
  [
    '................',
    'x..x..x..x..x...',
    'xxxxxxxxxxxxx...',
    'xxxxxxxxxxxxx...',
    '.xxxxxxxxxxx....',
    '..xxxxxxxxx.....',
    '...xxxxxxx......',
    '....xxxxx.......',
    '....xxxxx.......',
    '...xxxxxxx......',
    '..xxxxxxxxx.....',
    '.xxxxxxxxxxx....',
    'xxxxxxxxxxxxx...',
    'xxxxxxxxxxxxx...',
    'x..x..x..x..x...',
    '................',
  ],
  '#E0A82E',
);

export const IconCountdown = makeIcon(
  [
    '.xxxxxxxxxx.....',
    '.xxxxxxxxxx.....',
    '..xxxxxxxx......',
    '...xxoxxx.......',
    '....xoox........',
    '.....xx.........',
    '.....xx.........',
    '.....xx.........',
    '....xxxx........',
    '...xxooxx.......',
    '..xxooooxx......',
    '.xxooooooxx.....',
    '.xxxxxxxxxx.....',
    '.xxxxxxxxxx.....',
    '................',
    '................',
  ],
  '#7A1E16',
);

export const IconTrendUp = makeIcon(
  [
    '................',
    '......xx........',
    '.....xxxx.......',
    '....xxxxxx......',
    '...xxxxxxxx.....',
    '..xxxxxxxxxx....',
    '....xxxxxx......',
    '....xxxxxx......',
    '....xxxxxx......',
    '....xxxxxx......',
    '....xxxxxx......',
    '....xxxxxx......',
    '....xxxxxx......',
    '................',
    '................',
    '................',
  ],
  '#C8362A',
);

export const IconTrendDown = makeIcon(
  [
    '................',
    '....xxxxxx......',
    '....xxxxxx......',
    '....xxxxxx......',
    '....xxxxxx......',
    '....xxxxxx......',
    '....xxxxxx......',
    '....xxxxxx......',
    '..xxxxxxxxxx....',
    '...xxxxxxxx.....',
    '....xxxxxx......',
    '.....xxxx.......',
    '......xx........',
    '................',
    '................',
    '................',
  ],
  '#5BBF8F',
);

export const IconNewInfo = makeIcon(
  [
    '................',
    '..xxxxxxxxxxxx..',
    '..x..........x..',
    '..x.xxxxxxxx.x..',
    '..x.x......x.x..',
    '..x.x.xxxx.x.x..',
    '..x.x......x.x..',
    '..x.x.xxxx.x.x..',
    '..x.x......x.x..',
    '..x.x.xxxx.x.x..',
    '..x.x......x.x..',
    '..x.xxxxxxxx.x..',
    '..x..........x..',
    '..xxxxxxxxxxxx..',
    '...........xxx..',
    '...........xxx..',
  ],
  '#2B5F5D',
);

export const IconCitation = makeIcon(
  [
    '................',
    '...xxxx.........',
    '..xx..xx........',
    '.xx....xx.......',
    '.xx....xx.......',
    '..xx.xxxx.......',
    '...xxxxxx.......',
    '.....xxxx.......',
    '....xxxx........',
    '...xxxxxx.......',
    '..xxxx.xx.......',
    '..xx....xx......',
    '..xx....xx......',
    '...xx..xx.......',
    '....xxxx........',
    '................',
  ],
  '#4D110B',
);

import { CSSProperties } from 'react';
import { ED_ZONES, GAME_HEIGHT, GAME_WIDTH, PALETTE, type Zone } from '../../game/layout';

export interface FloorplanPatient {
  caseId: string;
  title: string;
  bay: string;
  state: string;
  triageCategory: number;
  isAmbient: boolean;
}

interface Props {
  /** Patients to render in their bays. Empty array → static layout (menu preview). */
  patients?: FloorplanPatient[];
  /** Optional clock readout for the title bar. */
  clockLabel?: string;
  /** Fired when a patient card is clicked. */
  onCaseClick?: (caseId: string) => void;
}

/**
 * M92: replaces the Phaser department hub with a static SVG floorplan.
 * No walk-around, no avatar — bays are rendered as zones from `ED_ZONES`
 * and live patient cards are absolutely positioned inside their bay.
 * Cards are real HTML buttons so they keep keyboard focus and a11y for
 * free. The bay geometry comes from the same `ED_ZONES` table the
 * Phaser scene used, so `tests/layout.test.ts` still covers the
 * floorplan shape.
 */
export function EdFloorplan({ patients = [], clockLabel, onCaseClick }: Props) {
  const isLive = patients.length > 0;
  const byBay = new Map<string, FloorplanPatient[]>();
  for (const p of patients) {
    const arr = byBay.get(p.bay) ?? [];
    arr.push(p);
    byBay.set(p.bay, arr);
  }

  return (
    <div
      className="ed-floorplan"
      data-testid="ed-floorplan"
      role="img"
      aria-label={
        isLive
          ? `Department floorplan with ${patients.length} active patient${patients.length === 1 ? '' : 's'}`
          : 'Department floorplan — placeholder layout'
      }
    >
      <svg
        className="ed-floorplan__svg"
        viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <rect
          x={8}
          y={60}
          width={GAME_WIDTH - 16}
          height={600}
          fill={toCss(PALETTE.floor)}
          stroke={toCss(PALETTE.border)}
          strokeWidth={2}
        />

        <text
          x={20}
          y={28}
          fill="var(--text)"
          fontFamily="var(--font-mono)"
          fontSize={20}
        >
          THE SKITT — ED
        </text>
        <text
          x={GAME_WIDTH - 20}
          y={28}
          textAnchor="end"
          fill="var(--status-ok)"
          fontFamily="var(--font-mono)"
          fontSize={14}
        >
          {clockLabel ?? '07:00 · SHIFT'}
        </text>

        {ED_ZONES.map((zone) => (
          <g key={zone.id}>
            <rect
              x={zone.x}
              y={zone.y}
              width={zone.w}
              height={zone.h}
              fill={toCss(zone.color)}
              fillOpacity={0.85}
              stroke={toCss(PALETTE.border)}
              strokeWidth={2}
            />
            <text
              x={zone.x + 10}
              y={zone.y + 22}
              fill="#ffffff"
              fontFamily="var(--font-mono)"
              fontSize={13}
            >
              {zone.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="ed-floorplan__overlay">
        {ED_ZONES.map((zone) => {
          const inZone = byBay.get(zone.id) ?? [];
          if (inZone.length === 0) return null;
          return inZone.map((patient, i) => (
            <PatientCard
              key={patient.caseId}
              patient={patient}
              zone={zone}
              index={i}
              onClick={() => onCaseClick?.(patient.caseId)}
            />
          ));
        })}
      </div>
    </div>
  );
}

interface CardProps {
  patient: FloorplanPatient;
  zone: Zone;
  index: number;
  onClick: () => void;
}

const CARD_HEIGHT = 40;
const CARD_GAP = 6;
const CARD_PAD = 10;

function PatientCard({ patient, zone, index, onClick }: CardProps) {
  const cardX = zone.x + CARD_PAD;
  const cardY = zone.y + 30 + index * (CARD_HEIGHT + CARD_GAP);
  const cardWidth = Math.min(zone.w - 2 * CARD_PAD, 200);

  // BT 16 round 1 finding: a hardcoded height percentage overflows on
  // small viewports — 5.55% of a 450px-tall container is ~25px, but
  // the clamped font + padding + gap need ~28-32px minimum. Anchor
  // only the top coordinate; let content size the card vertically.
  const style: CSSProperties = {
    left: `${(cardX / GAME_WIDTH) * 100}%`,
    top: `${(cardY / GAME_HEIGHT) * 100}%`,
    width: `${(cardWidth / GAME_WIDTH) * 100}%`,
  };

  // BT 16 round 1 finding: HTML `disabled` removes the button from the
  // a11y tree entirely. For deceased patients we want the card to stay
  // focusable and announced (so screen-reader users can tell the bay
  // is occupied by a deceased patient). aria-disabled + a no-op
  // onClick handler keeps the element in the focus order.
  const alive = patient.state !== 'deceased';
  return (
    <button
      type="button"
      className={`ed-floorplan__card ed-floorplan__card--${patient.state}`}
      style={style}
      onClick={() => {
        if (!alive) return;
        onClick();
      }}
      aria-disabled={!alive}
      aria-label={`${patient.title} in ${zone.label}, ${patient.state}, triage category ${patient.triageCategory}${patient.isAmbient ? ', ambient' : ''}`}
    >
      <span className="ed-floorplan__card-title">{shortTitle(patient.title)}</span>
      <span className="ed-floorplan__card-meta">
        {patient.state} · T{patient.triageCategory}
        {patient.isAmbient ? ' · ambient' : ''}
      </span>
    </button>
  );
}

function shortTitle(t: string): string {
  if (t.length <= 26) return t;
  return t.slice(0, 25) + '…';
}

function toCss(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}

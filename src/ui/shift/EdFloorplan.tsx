import { CSSProperties, useMemo } from 'react';
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
 * No walk-around, no avatar. Bays are rendered as SVG zones from
 * `ED_ZONES`; live patient cards are real HTML `<button>` elements
 * stacked inside per-bay overlay wrappers so they keep keyboard focus
 * and a11y for free. The bay geometry comes from the same `ED_ZONES`
 * table the Phaser scene used, so `tests/layout.test.ts` still covers
 * the floorplan shape.
 *
 * BT 16 round 2 hardening:
 * - Root container uses `role="region"` (a labelled landmark), NOT
 *   `role="img"` — the latter strips the interactive button subtree
 *   from JAWS/NVDA's a11y tree.
 * - Deceased patients are NOT click-blocked. Per the M91 NHS
 *   workflow, the clinician must still enter the case to verify
 *   death, finish notes, and sticker the M&M folder.
 * - Cards are not individually absolute-positioned. Each bay gets an
 *   absolute wrapper sized to the zone's bbox; cards flex-stack
 *   inside with a real CSS gap. Stops them physically overlapping
 *   when the container scales down.
 */
export function EdFloorplan({ patients = [], clockLabel, onCaseClick }: Props) {
  const isLive = patients.length > 0;
  const byBay = useMemo(() => {
    const m = new Map<string, FloorplanPatient[]>();
    for (const p of patients) {
      const arr = m.get(p.bay) ?? [];
      arr.push(p);
      m.set(p.bay, arr);
    }
    return m;
  }, [patients]);

  return (
    <div
      className="ed-floorplan"
      data-testid="ed-floorplan"
      role="region"
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
        role="img"
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
          return (
            <BayCardStack
              key={zone.id}
              zone={zone}
              patients={inZone}
              onCaseClick={onCaseClick}
            />
          );
        })}
      </div>
    </div>
  );
}

interface BayCardStackProps {
  zone: Zone;
  patients: FloorplanPatient[];
  onCaseClick?: (caseId: string) => void;
}

const CARD_PAD = 10;

function BayCardStack({ zone, patients, onCaseClick }: BayCardStackProps) {
  // Position the wrapper as a percentage of the floorplan's coordinate
  // space (matching the SVG viewBox) so it tracks the bay rect through
  // any container scale. The cards inside flex-stack with a real CSS
  // gap, so they never overlap regardless of viewport size.
  const left = ((zone.x + CARD_PAD) / GAME_WIDTH) * 100;
  const top = ((zone.y + 30) / GAME_HEIGHT) * 100;
  const width = (Math.min(zone.w - 2 * CARD_PAD, 200) / GAME_WIDTH) * 100;
  const height = ((zone.h - 40) / GAME_HEIGHT) * 100;

  const style: CSSProperties = {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    maxHeight: `${height}%`,
  };

  return (
    <div className="ed-floorplan__bay-stack" style={style}>
      {patients.map((patient) => (
        <PatientCard
          key={patient.caseId}
          patient={patient}
          zoneLabel={zone.label}
          onClick={() => onCaseClick?.(patient.caseId)}
        />
      ))}
    </div>
  );
}

interface CardProps {
  patient: FloorplanPatient;
  zoneLabel: string;
  onClick: () => void;
}

function PatientCard({ patient, zoneLabel, onClick }: CardProps) {
  // WCAG 2.5.3 (Label in Name): visible text must be part of the
  // accessible name so voice-control users saying "click {visible}"
  // succeed. Don't override with aria-label; instead append a
  // visually-hidden span carrying the extra state / triage detail.
  return (
    <button
      type="button"
      className={`ed-floorplan__card ed-floorplan__card--${patient.state}`}
      onClick={onClick}
    >
      <span className="ed-floorplan__card-title">{shortTitle(patient.title)}</span>
      <span className="ed-floorplan__card-meta" aria-hidden="true">
        {patient.state} · T{patient.triageCategory}
        {patient.isAmbient ? ' · ambient' : ''}
      </span>
      <span className="visually-hidden">
        {' '}
        in {zoneLabel}, {patient.state}, triage category {patient.triageCategory}
        {patient.isAmbient ? ', ambient' : ''}
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

/**
 * Charge Nurse Akin's pre-shift handover (M88, Braintrust 10 round 2).
 *
 * Renders above the shift board on shift start. Lookups Akin's
 * handover line for the current rota position from
 * `content/narrative/akin_handovers.yaml`. If the position has no
 * authored handover, renders nothing — so the component is safe to
 * mount on every shift regardless of authoring coverage.
 *
 * Design intent: dual-register voice. Each handover paragraph pairs
 * clinical handover content (bed state, staffing, the floor's
 * weather) with one slice-of-life observation that lands as dry EM
 * gallows humour. The seriousness and the comedy are spoken by the
 * same character in the same paragraph — Disco-style. The build is
 * earning its Disco-influenced badge.
 *
 * Optional `bed_state` colour drives a subtle border-left cue
 * (green / amber / red / black) — the in-fiction acuity weather.
 */

import { useMemo } from 'react';
import { AkinHandovers, type AkinHandoverT } from '../../content/schema';
import { parse as parseYaml } from 'yaml';
import handoversYaml from '../../../content/narrative/akin_handovers.yaml?raw';

interface Props {
  rotaIndex: number;
  /** Dismiss state lifted from the parent (ShiftView) so the
   *  handover stays collapsed across board ↔ encounter navigation.
   *  Round-1 reviewer caught the local-state remount bug. */
  dismissed: boolean;
  onDismissChange: (dismissed: boolean) => void;
}

const PARSED = AkinHandovers.parse(parseYaml(handoversYaml));

export function PreShiftHandover({ rotaIndex, dismissed, onDismissChange }: Props) {
  const handover = useMemo<AkinHandoverT | null>(
    () => PARSED.handovers.find((h) => h.rota_index === rotaIndex) ?? null,
    [rotaIndex],
  );

  if (!handover) return null;
  if (dismissed) {
    return (
      <button
        className="akin-handover akin-handover--collapsed"
        onClick={() => onDismissChange(false)}
        aria-label="Re-open charge nurse handover"
      >
        Akin&rsquo;s handover (re-open)
      </button>
    );
  }

  const bedStateClass = handover.bed_state ? `akin-handover--${handover.bed_state}` : '';
  return (
    <aside className={`akin-handover ${bedStateClass}`} aria-label="Charge nurse handover">
      <header className="akin-handover__head">
        <span className="akin-handover__name">Charge Nurse Akin</span>
        {handover.bed_state && (
          <span className="akin-handover__bed-state">bed state · {handover.bed_state}</span>
        )}
        <button
          className="akin-handover__dismiss"
          onClick={() => onDismissChange(true)}
          aria-label="Dismiss handover"
        >
          ×
        </button>
      </header>
      <div className="akin-handover__body">
        {handover.text.split(/\n\n+/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </aside>
  );
}

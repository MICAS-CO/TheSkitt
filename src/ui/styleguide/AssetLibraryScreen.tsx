/**
 * Hidden Visual Style Guide / Asset Library (M46).
 *
 * Reached via the `?style-guide=1` URL query parameter. Not surfaced
 * in the menu — design uses it to verify asset drops in-browser, but
 * end-users never see it.
 *
 * Renders every asset the codebase knows about: locked palette ramps,
 * status icons, frame components, patient sprites, NPC sprites,
 * encounter props, and parked world tiles. Each section is its own
 * <section> so design can deep-link a particular asset by anchor.
 */

import { PALETTE_RAMPS } from '../../style/palette';
import { IconCitation, IconCountdown, IconMustDo, IconNewInfo, IconRedFlag, IconTrap, IconTrendDown, IconTrendUp } from '../../style/icons';
import { PATIENT_SPRITES, spriteSvgFor } from '../../style/sprites';
import { NPC_SPRITES, npcFrameToSvg } from '../../style/npcSprites';
import { PROP_SPRITES, propFrameToSvg } from '../../style/propSprites';
import { WORLD_TILES, worldFrameToSvg } from '../../style/worldSprites';
import type { CaseStateT } from '../../content/schema';

export function AssetLibraryScreen({ onExit }: { onExit: () => void }) {
  return (
    <div className="asset-lib">
      <header className="asset-lib__head">
        <div>
          <h1>Visual Style Guide</h1>
          <p>
            Hidden asset library — reached via <code>?style-guide=1</code>. Every
            authored asset rendered live from source.
          </p>
        </div>
        <button type="button" onClick={onExit}>
          ← back to menu
        </button>
      </header>

      <PaletteSection />
      <IconsSection />
      <PatientSpritesSection />
      <NpcSpritesSection />
      <PropSpritesSection />
      <WorldTilesSection />
    </div>
  );
}

function PaletteSection() {
  return (
    <section className="asset-lib__section" id="palette">
      <h2>Palette ramps</h2>
      <div className="asset-lib__ramps">
        {PALETTE_RAMPS.map((r) => (
          <div key={r.id} className="asset-lib__ramp">
            <h3>{r.name}</h3>
            <p className="asset-lib__caption">{r.role}</p>
            <ol className="asset-lib__stops">
              {r.stops.map((s) => (
                <li key={s.hex} title={s.use}>
                  <span className="asset-lib__swatch" style={{ background: s.hex }} />
                  <code>{s.hex}</code>
                  <span className="asset-lib__stop-name">{s.name}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

function IconsSection() {
  const icons: { name: string; Icon: typeof IconRedFlag }[] = [
    { name: 'IconRedFlag', Icon: IconRedFlag },
    { name: 'IconMustDo', Icon: IconMustDo },
    { name: 'IconTrap', Icon: IconTrap },
    { name: 'IconCountdown', Icon: IconCountdown },
    { name: 'IconTrendUp', Icon: IconTrendUp },
    { name: 'IconTrendDown', Icon: IconTrendDown },
    { name: 'IconNewInfo', Icon: IconNewInfo },
    { name: 'IconCitation', Icon: IconCitation },
  ];
  return (
    <section className="asset-lib__section" id="icons">
      <h2>Status icons</h2>
      <div className="asset-lib__grid">
        {icons.map(({ name, Icon }) => (
          <figure key={name}>
            <Icon size={48} fill="#fff" />
            <figcaption>{name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function PatientSpritesSection() {
  const states: CaseStateT[] = ['stable', 'triaged', 'deteriorating', 'arrested'];
  return (
    <section className="asset-lib__section" id="patients">
      <h2>Patient sprites ({Object.keys(PATIENT_SPRITES).length} cases)</h2>
      {Object.keys(PATIENT_SPRITES).map((caseId) => (
        <div key={caseId} className="asset-lib__patient">
          <h3>{caseId}</h3>
          <div className="asset-lib__grid">
            {states.map((s) => {
              const svg = spriteSvgFor(caseId, s, 0, 4);
              if (!svg) return null;
              return (
                <figure key={s}>
                  <div dangerouslySetInnerHTML={{ __html: svg }} />
                  <figcaption>{s}</figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function NpcSpritesSection() {
  return (
    <section className="asset-lib__section" id="npcs">
      <h2>NPC sprites ({Object.keys(NPC_SPRITES).length})</h2>
      <div className="asset-lib__grid">
        {Object.entries(NPC_SPRITES).map(([id, rows]) => (
          <figure key={id}>
            <div dangerouslySetInnerHTML={{ __html: npcFrameToSvg(rows, 3) }} />
            <figcaption>{id.replace(/_/g, ' ')}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function PropSpritesSection() {
  return (
    <section className="asset-lib__section" id="props">
      <h2>Encounter props ({Object.keys(PROP_SPRITES).length})</h2>
      <div className="asset-lib__grid">
        {Object.entries(PROP_SPRITES).map(([id, rows]) => (
          <figure key={id}>
            <div dangerouslySetInnerHTML={{ __html: propFrameToSvg(rows, 3) }} />
            <figcaption>{id.replace(/_/g, ' ')}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function WorldTilesSection() {
  return (
    <section className="asset-lib__section" id="world">
      <h2>World tiles ({Object.keys(WORLD_TILES).length}) — parked</h2>
      <p className="asset-lib__caption">
        Not yet wired into gameplay. Available for a future overworld
        composition pass.
      </p>
      <div className="asset-lib__grid">
        {Object.entries(WORLD_TILES).map(([id, rows]) => (
          <figure key={id}>
            <div dangerouslySetInnerHTML={{ __html: worldFrameToSvg(rows, 3) }} />
            <figcaption>{id.replace(/_/g, ' ')}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/**
 * Helper: check whether the current URL contains ?style-guide=1.
 * Used by <App> to route around the menu without exposing a button.
 */
export function isStyleGuideRequested(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('style-guide') === '1';
  } catch {
    return false;
  }
}


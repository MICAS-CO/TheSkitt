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
import { EXTRA_PATIENT_SPRITES, extraPatientToSvg } from '../../style/extraPatientSprites';
import { EXTRA_EQUIPMENT } from '../../style/extraEquipment';
import { EXTRA_WORLD_TILES } from '../../style/extraWorldTiles';
import { FX_PARTICLES, FX_ALERTS, FX_EMOTES, fxFrameToSvg } from '../../style/fxSprites';
import { WALK_FRAMES } from '../../style/walkCycles';
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
      <ExtraPatientSpritesSection />
      <NpcSpritesSection />
      <PropSpritesSection />
      <ExtraEquipmentSection />
      <WorldTilesSection />
      <ExtraWorldTilesSection />
      <FxSection />
      <WalkCycleSection />
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

function ExtraPatientSpritesSection() {
  return (
    <section className="asset-lib__section" id="extra-patients">
      <h2>Extra patient archetypes ({Object.keys(EXTRA_PATIENT_SPRITES).length}) — drop #3</h2>
      <p className="asset-lib__caption">
        Character designs from the latest design drop. Names overlap with case names
        (Ahmed / Sarah / Marcus) but the archetypes are different presentations — not
        wired to PATIENT_SPRITES. Use these as a library for future case authoring.
      </p>
      {Object.entries(EXTRA_PATIENT_SPRITES).map(([pid, frames]) => (
        <div key={pid} className="asset-lib__patient">
          <h3>{pid}</h3>
          <div className="asset-lib__grid">
            {Object.entries(frames).map(([state, rows]) => (
              <figure key={state}>
                <div dangerouslySetInnerHTML={{ __html: extraPatientToSvg(rows, 4) }} />
                <figcaption>{state}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function ExtraEquipmentSection() {
  return (
    <section className="asset-lib__section" id="extra-equipment">
      <h2>Extension equipment ({Object.keys(EXTRA_EQUIPMENT).length}) — drop #3</h2>
      <p className="asset-lib__caption">
        Authored against the existing PROP_SPRITES palette (no new colour keys).
        Adrenaline ampule + hydrocort vial + saline bag etc.
      </p>
      <div className="asset-lib__grid">
        {Object.entries(EXTRA_EQUIPMENT).map(([id, rows]) => (
          <figure key={id}>
            <div dangerouslySetInnerHTML={{ __html: propFrameToSvg(rows, 3) }} />
            <figcaption>{id.replace(/_/g, ' ')}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function ExtraWorldTilesSection() {
  return (
    <section className="asset-lib__section" id="extra-world">
      <h2>Extra world tiles ({Object.keys(EXTRA_WORLD_TILES).length}) — drop #3</h2>
      <p className="asset-lib__caption">
        Trolleys (40×20) + 10 environment tiles (16×16). Doors, blood, resus floor,
        nursing station, computer terminal, signs, pillar, suction outlet.
      </p>
      <div className="asset-lib__grid">
        {Object.entries(EXTRA_WORLD_TILES).map(([id, rows]) => (
          <figure key={id}>
            <div dangerouslySetInnerHTML={{ __html: worldFrameToSvg(rows, 3) }} />
            <figcaption>{id.replace(/_/g, ' ')}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function FxSection() {
  const sections: { title: string; sprites: Record<string, string[]> }[] = [
    { title: 'Particles', sprites: FX_PARTICLES },
    { title: 'Alerts', sprites: FX_ALERTS },
    { title: 'Emotes', sprites: FX_EMOTES },
  ];
  return (
    <section className="asset-lib__section" id="fx">
      <h2>FX sprites — drop #3</h2>
      <p className="asset-lib__caption">
        Particles (sweat, blood, sparkle, defib bolt, etc.) · alerts (crash call,
        pager, pre-alert) · emotes (exclamation, question, ellipsis, heart_pulse,
        relief_exhale). For event toasts + state-change feedback.
      </p>
      {sections.map((s) => (
        <div key={s.title} className="asset-lib__patient">
          <h3>{s.title} ({Object.keys(s.sprites).length})</h3>
          <div className="asset-lib__grid">
            {Object.entries(s.sprites).map(([id, rows]) => (
              <figure key={id}>
                <div dangerouslySetInnerHTML={{ __html: fxFrameToSvg(rows, 4) }} />
                <figcaption>{id.replace(/_/g, ' ')}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function WalkCycleSection() {
  return (
    <section className="asset-lib__section" id="walk-cycle">
      <h2>F1 doctor walk cycle ({Object.keys(WALK_FRAMES).length} frames) — drop #3</h2>
      <p className="asset-lib__caption">
        4-direction × 4-frame standard. Renders via the NPC palette (NPC sprite
        renderer). Currently authored: down step + side stance + alias frames per
        the design&rsquo;s &lsquo;pose reuse — saves animation memory&rsquo; pattern.
      </p>
      <div className="asset-lib__grid">
        {Object.entries(WALK_FRAMES).map(([id, rows]) => (
          <figure key={id}>
            <div
              dangerouslySetInnerHTML={{
                __html: npcFrameToSvg(rows, 3),
              }}
            />
            <figcaption>{id}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// isStyleGuideRequested moved to ./url-gate.ts (M64 code-split) so the
// gate check stays in the main bundle while this screen is lazy-loaded.


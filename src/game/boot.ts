/**
 * Phaser entry point. Lives in a separate module so it can be dynamically
 * imported by the React mount (`PhaserGame.tsx`) — keeps Phaser (~1.5 MB)
 * out of the initial bundle for users who never open the ED hub.
 */

import Phaser from 'phaser';
import { EDScene, type EDSceneData } from './scenes/EDScene';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE } from './layout';

export interface BootOptions {
  parent: HTMLElement;
  /** Patient list and click handler for the live hub view. Empty array → static layout. */
  sceneData?: EDSceneData;
}

export async function bootGame(opts: BootOptions): Promise<Phaser.Game> {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: opts.parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: numberToCssColor(PALETTE.bg),
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [EDScene],
  });

  // Start the scene with the provided data — Phaser merges init data when
  // scene.start(key, data) is called after AUTO boot.
  game.scene.start('ed', opts.sceneData ?? { patients: [] });

  return game;
}

function numberToCssColor(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}

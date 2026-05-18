/**
 * Phaser entry point. Lives in a separate module so it can be dynamically
 * imported by the React mount (`PhaserGame.tsx`) — keeps Phaser (~1.5 MB)
 * out of the initial bundle for users who never open the ED hub.
 */

import Phaser from 'phaser';
import { EDScene } from './scenes/EDScene';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE } from './layout';

export async function bootGame(parent: HTMLElement): Promise<Phaser.Game> {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
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
}

function numberToCssColor(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}

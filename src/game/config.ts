import Phaser from 'phaser';
import { EDScene } from './scenes/EDScene';
import { GAME_WIDTH, GAME_HEIGHT, PALETTE } from './layout';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
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
  };
}

function numberToCssColor(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}

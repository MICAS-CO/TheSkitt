import Phaser from 'phaser';
import { ED_ZONES, GAME_HEIGHT, GAME_WIDTH, PALETTE } from '../layout';

export class EDScene extends Phaser.Scene {
  constructor() {
    super('ed');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(toCss(PALETTE.bg));

    this.add
      .rectangle(GAME_WIDTH / 2, (60 + 600) / 2, GAME_WIDTH - 16, 600, PALETTE.floor)
      .setStrokeStyle(2, PALETTE.border);

    this.add
      .text(20, 22, 'THE SKITT — Hello, ED', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e8e8e8',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(GAME_WIDTH - 20, 22, '07:00 · SHIFT START', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#7adb7a',
      })
      .setOrigin(1, 0.5);

    for (const zone of ED_ZONES) {
      this.add
        .rectangle(zone.x + zone.w / 2, zone.y + zone.h / 2, zone.w, zone.h, zone.color, 0.85)
        .setStrokeStyle(2, PALETTE.border);

      this.add
        .text(zone.x + 10, zone.y + 10, zone.label, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#ffffff',
        })
        .setOrigin(0, 0);
    }

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 30,
        'Placeholder department layout · Study tool, not clinical guidance',
        {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#8a93a3',
        },
      )
      .setOrigin(0.5, 0.5);
  }
}

function toCss(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}

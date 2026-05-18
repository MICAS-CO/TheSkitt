import Phaser from 'phaser';
import { ED_ZONES, GAME_HEIGHT, GAME_WIDTH, PALETTE } from '../layout';

export interface HubPatient {
  caseId: string;
  title: string;
  bay: string;
  state: string;
  triageCategory: number;
  isAmbient: boolean;
}

export interface EDSceneData {
  /** Live patients to render in their bays. Empty array → static "Hello, ED" layout. */
  patients: HubPatient[];
  /** Clock readout for the title bar (e.g. "T+5m / 20m"). */
  clockLabel?: string;
  /** Fired when a patient card is clicked. */
  onCaseClick?: (caseId: string) => void;
}

const STATE_COLOR: Record<string, number> = {
  stable: PALETTE.patient_stable,
  deteriorating: PALETTE.patient_deteriorating,
  arrested: PALETTE.patient_arrested,
  deceased: PALETTE.patient_arrested,
  admitted: PALETTE.patient_admitted,
  discharged: PALETTE.patient_discharged,
  unseen: PALETTE.patient_unseen,
  triaged: PALETTE.patient_triaged,
};

export class EDScene extends Phaser.Scene {
  private sceneData: EDSceneData = { patients: [] };

  constructor() {
    super('ed');
  }

  init(data?: EDSceneData): void {
    this.sceneData = data ?? { patients: [] };
  }

  create(): void {
    this.cameras.main.setBackgroundColor(toCss(PALETTE.bg));

    this.add
      .rectangle(GAME_WIDTH / 2, (60 + 600) / 2, GAME_WIDTH - 16, 600, PALETTE.floor)
      .setStrokeStyle(2, PALETTE.border);

    this.add
      .text(20, 22, 'THE SKITT — ED', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#e8e8e8',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(GAME_WIDTH - 20, 22, this.sceneData.clockLabel ?? '07:00 · SHIFT', {
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

    // Render patient cards in their bays
    this.renderPatients();

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 30,
        this.sceneData.patients.length === 0
          ? 'Placeholder department layout · Study tool, not clinical guidance'
          : 'Tap a patient to enter their bay · Study tool, not clinical guidance',
        {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#8a93a3',
        },
      )
      .setOrigin(0.5, 0.5);
  }

  private renderPatients(): void {
    const byBay = new Map<string, HubPatient[]>();
    for (const p of this.sceneData.patients) {
      const arr = byBay.get(p.bay) ?? [];
      arr.push(p);
      byBay.set(p.bay, arr);
    }

    for (const zone of ED_ZONES) {
      const inZone = byBay.get(zone.id) ?? [];
      if (inZone.length === 0) continue;
      this.renderPatientsInZone(zone, inZone);
    }
  }

  private renderPatientsInZone(
    zone: { x: number; y: number; w: number; h: number },
    patients: HubPatient[],
  ): void {
    const cardWidth = Math.min(zone.w - 20, 200);
    const cardHeight = 40;
    const startY = zone.y + 30;
    const gap = 6;
    patients.forEach((p, i) => {
      const cardX = zone.x + 10;
      const cardY = startY + i * (cardHeight + gap);
      const color = STATE_COLOR[p.state] ?? PALETTE.muted;

      const card = this.add
        .rectangle(cardX + cardWidth / 2, cardY + cardHeight / 2, cardWidth, cardHeight, 0x0f1115)
        .setStrokeStyle(2, color)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(cardX + 8, cardY + 6, this.shortTitle(p), {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#e8e8e8',
        })
        .setOrigin(0, 0);

      this.add
        .text(
          cardX + 8,
          cardY + 22,
          `${p.state} · T${p.triageCategory}${p.isAmbient ? ' · ambient' : ''}`,
          {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#8a93a3',
          },
        )
        .setOrigin(0, 0);

      // Pulsing border for deteriorating / arrested states
      if (p.state === 'deteriorating' || p.state === 'arrested') {
        this.tweens.add({
          targets: card,
          alpha: { from: 1, to: 0.5 },
          duration: 700,
          yoyo: true,
          repeat: -1,
        });
      }

      card.on('pointerdown', () => {
        this.sceneData.onCaseClick?.(p.caseId);
      });
    });
  }

  private shortTitle(p: HubPatient): string {
    const t = p.title;
    if (t.length <= 26) return t;
    return t.slice(0, 25) + '…';
  }
}

function toCss(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}

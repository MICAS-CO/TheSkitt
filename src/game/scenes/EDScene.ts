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

interface PatientToken {
  caseId: string;
  rect: Phaser.GameObjects.Rectangle;
  cx: number;
  cy: number;
  /** Original stroke colour, so we can restore after un-highlighting. */
  baseStroke: number;
}

export class EDScene extends Phaser.Scene {
  private sceneData: EDSceneData = { patients: [] };
  private avatar?: Phaser.GameObjects.Container;
  private avatarVx = 0;
  private avatarVy = 0;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private patientTokens: PatientToken[] = [];
  private nearestPatient: PatientToken | null = null;
  private prompt?: Phaser.GameObjects.Text;

  constructor() {
    super('ed');
  }

  init(data?: EDSceneData): void {
    this.sceneData = data ?? { patients: [] };
    this.patientTokens = [];
    this.nearestPatient = null;
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

    // Phaser-resident avatar (M17): a placeholder square the player walks
    // between bays. Walking up to a patient highlights them; pressing E
    // (or Space) opens that encounter. Click still works on mobile / mouse.
    this.spawnAvatar();
    this.cursors = this.input.keyboard?.createCursorKeys();
    const kb = this.input.keyboard;
    if (kb) {
      this.wasd = {
        W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      kb.on('keydown-SPACE', () => this.interact());
      kb.on('keydown-E', () => this.interact());
    }

    this.prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, this.staticHelpText(), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#8a93a3',
      })
      .setOrigin(0.5, 0.5);
  }

  override update(_time: number, deltaMs: number): void {
    if (!this.avatar) return;
    const speed = 0.25; // px / ms
    let vx = 0;
    let vy = 0;
    if (this.cursors?.left?.isDown || this.wasd?.A.isDown) vx -= 1;
    if (this.cursors?.right?.isDown || this.wasd?.D.isDown) vx += 1;
    if (this.cursors?.up?.isDown || this.wasd?.W.isDown) vy -= 1;
    if (this.cursors?.down?.isDown || this.wasd?.S.isDown) vy += 1;
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }
    this.avatarVx = vx * speed;
    this.avatarVy = vy * speed;
    this.avatar.x = clamp(this.avatar.x + this.avatarVx * deltaMs, 30, GAME_WIDTH - 30);
    this.avatar.y = clamp(this.avatar.y + this.avatarVy * deltaMs, 60, GAME_HEIGHT - 60);

    this.updateNearestPatient();
  }

  private interact(): void {
    if (this.nearestPatient) this.sceneData.onCaseClick?.(this.nearestPatient.caseId);
  }

  private spawnAvatar(): void {
    const startX = GAME_WIDTH / 2;
    const startY = 330; // mid-corridor by the nurses' station
    const container = this.add.container(startX, startY);
    const body = this.add.rectangle(0, 6, 22, 28, 0x4fa3a0).setStrokeStyle(2, 0x2b5f5d);
    const head = this.add.circle(0, -14, 9, 0xd4ad8c).setStrokeStyle(1, 0xa6815d);
    const label = this.add.text(0, 24, 'YOU', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
    });
    label.setOrigin(0.5, 0);
    container.add([body, head, label]);
    this.avatar = container;
  }

  private updateNearestPatient(): void {
    if (!this.avatar) return;
    const ax = this.avatar.x;
    const ay = this.avatar.y;
    let best: PatientToken | null = null;
    let bestDist = Infinity;
    for (const tok of this.patientTokens) {
      const dx = tok.cx - ax;
      const dy = tok.cy - ay;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 90 && d < bestDist) {
        best = tok;
        bestDist = d;
      }
    }
    if (best !== this.nearestPatient) {
      if (this.nearestPatient) {
        this.nearestPatient.rect.setStrokeStyle(2, this.nearestPatient.baseStroke);
      }
      this.nearestPatient = best;
      if (best) {
        best.rect.setStrokeStyle(4, 0xffffff);
      }
    }
    if (this.prompt) {
      this.prompt.setText(
        this.nearestPatient
          ? `Press E (or Space) to enter ${this.shortLabel(this.nearestPatient.caseId)} · arrows/WASD to move`
          : this.staticHelpText(),
      );
    }
  }

  private shortLabel(caseId: string): string {
    return this.patientTokens.find((t) => t.caseId === caseId)
      ? this.sceneData.patients.find((p) => p.caseId === caseId)?.title ?? caseId
      : caseId;
  }

  private staticHelpText(): string {
    return this.sceneData.patients.length === 0
      ? 'Placeholder department layout · Arrows/WASD to walk · Study tool, not clinical guidance'
      : 'Arrows/WASD to walk · click or press E near a patient to enter their bay · Study tool, not clinical guidance';
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

      this.patientTokens.push({
        caseId: p.caseId,
        rect: card,
        cx: cardX + cardWidth / 2,
        cy: cardY + cardHeight / 2,
        baseStroke: color,
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

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

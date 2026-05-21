/**
 * Web-Audio monitor beep texture for the encounter screen (M15).
 *
 * Synthesises the QRS-tick a ward monitor makes — a single sine pip at
 * ~880 Hz, retriggered every (60 / HR) seconds. Higher HR → faster
 * cadence; NEWS2 ≥ 7 OR arrested → ITU-style alarm tone overlay.
 *
 * Audio is **off by default** and opt-in: the user must toggle it on
 * from the encounter UI (browsers also require a user gesture before
 * playback can start). Persists in localStorage.
 */

const AUDIO_KEY = 'theSkitt.audio.enabled.v1';

export function loadAudioEnabled(): boolean {
  try {
    return window.localStorage.getItem(AUDIO_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveAudioEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(AUDIO_KEY, enabled ? '1' : '0');
  } catch {
    // ignore (private mode)
  }
}

export class MonitorAudio {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private alarmTimer: ReturnType<typeof setTimeout> | null = null;
  private state: { hr: number; alarming: boolean; arrested: boolean } = {
    hr: 0,
    alarming: false,
    arrested: false,
  };

  /** Lazily create the AudioContext on first user gesture. */
  ensure(): void {
    if (this.ctx) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
  }

  /** Update the audio cadence to reflect current patient state. */
  update(hr: number, news2: number, arrested: boolean): void {
    const alarming = news2 >= 7 || arrested;
    this.state = { hr: Math.max(0, hr), alarming, arrested };
    this.restart();
  }

  private restart(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.alarmTimer) clearTimeout(this.alarmTimer);
    this.timer = null;
    this.alarmTimer = null;
    if (!this.ctx || this.state.arrested || this.state.hr === 0) {
      // In asystole we still play a flat-line tone (continuous low pip).
      if (this.ctx && this.state.arrested) this.startFlatline();
      return;
    }
    this.scheduleNext();
    if (this.state.alarming) this.scheduleAlarm();
  }

  private scheduleNext(): void {
    if (!this.ctx) return;
    this.tick();
    const period = (60 / Math.max(30, this.state.hr)) * 1000;
    this.timer = setTimeout(() => this.scheduleNext(), period);
  }

  private scheduleAlarm(): void {
    if (!this.ctx) return;
    this.alarmTone();
    this.alarmTimer = setTimeout(() => this.scheduleAlarm(), 1200);
  }

  private tick(): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = this.state.alarming ? 1100 : 880;
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.09);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  private alarmTone(): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1760;
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  private startFlatline(): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.value = 0.05;
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    this.timer = setTimeout(() => {
      try {
        osc.stop();
      } catch {
        // already stopped
      }
    }, 6000);
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.alarmTimer) clearTimeout(this.alarmTimer);
    this.timer = null;
    this.alarmTimer = null;
    if (this.ctx) {
      try {
        void this.ctx.close();
      } catch {
        // ignore
      }
      this.ctx = null;
    }
  }
}

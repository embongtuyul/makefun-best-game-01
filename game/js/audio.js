// Synthesized sound effects, no audio files: every sound is a WebAudio
// oscillator or a burst of filtered noise. The context is created lazily on
// the first user gesture, so a headless load stays silent and error-free.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Create (or resume) the audio context. Call from a user gesture.
  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (err) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  // One oscillator blip, optionally sliding to another frequency.
  tone(freq, dur, type = 'sine', vol = 0.12, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // A short burst of noise, for pops and thuds.
  noise(dur, vol = 0.15, lowpass = 1200) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  // A shot, pitched by tower kind.
  shoot(kind) {
    if (kind === 'sunbloom') this.tone(880, 0.07, 'triangle', 0.06, 660);
    else if (kind === 'thornvine') this.tone(220, 0.12, 'sawtooth', 0.07, 110);
    else if (kind === 'frostbell') this.tone(1320, 0.12, 'sine', 0.06, 1760);
    else this.tone(520, 0.14, 'square', 0.05, 260);
  }

  // An enemy popping.
  pop() {
    this.noise(0.09, 0.12, 900);
    this.tone(420, 0.08, 'sine', 0.08, 180);
  }

  // A tower planted.
  place() {
    this.tone(180, 0.12, 'sine', 0.16, 90);
    this.noise(0.06, 0.08, 500);
  }

  // A tower upgraded.
  upgrade() {
    this.tone(523, 0.09, 'triangle', 0.12);
    setTimeout(() => this.tone(784, 0.14, 'triangle', 0.12), 70);
  }

  // A tower sold.
  sell() {
    this.tone(660, 0.08, 'triangle', 0.1, 880);
  }

  // An enemy reaching the Heartlight.
  leak() {
    this.tone(140, 0.3, 'sawtooth', 0.14, 60);
  }

  // A wave horn: two rising notes.
  horn() {
    this.tone(392, 0.16, 'triangle', 0.14);
    setTimeout(() => this.tone(523, 0.22, 'triangle', 0.14), 140);
  }

  // A click on a button.
  click() {
    this.tone(700, 0.05, 'sine', 0.07);
  }

  // The victory arpeggio.
  win() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.22, 'triangle', 0.13), i * 130);
    });
  }

  // The defeat descent.
  lose() {
    [392, 330, 262, 196].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.28, 'sine', 0.13), i * 160);
    });
  }
}

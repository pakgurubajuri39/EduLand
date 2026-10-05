/**
 * Synthesized Web Audio API sound effects & dynamic ambient soundscapes for EduLand Builder Jump
 * Includes:
 * 1. Sound Effects: cardstock pops, book shimmers, thermal whooshes, spring boings, hurt, victory.
 * 2. Lively Village Music: procedural acoustic marimba / kalimba melody & village rhythm.
 * 3. Soothing Gameplay Soundscape: procedural filtered paper-rustling winds & calming harmonic drone.
 * 4. Dynamic crossfader between Village Hub and Gameplay.
 */

export type AmbientMode = 'VILLAGE' | 'GAMEPLAY' | 'SILENT';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private currentMode: AmbientMode = 'SILENT';

  // SFX nodes
  private gliderOsc: OscillatorNode | null = null;
  private gliderGain: GainNode | null = null;

  // Ambient Master Nodes
  private ambientMasterGain: GainNode | null = null;
  private villageGain: GainNode | null = null;
  private gameplayGain: GainNode | null = null;

  // Village Music Engine Nodes & State
  private villageInterval: number | null = null;
  private villageStep: number = 0;
  private isVillagePlaying: boolean = false;

  // Gameplay Paper-Rustle Soundscape Nodes
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private isGameplaySoundscapeRunning: boolean = false;

  // Listeners for UI state
  private listeners: Set<() => void> = new Set();

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- Volume & Master Controls ---

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientMasterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.masterVolume;
      this.ambientMasterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.ambientMasterGain) {
      const target = muted ? 0 : this.masterVolume;
      this.ambientMasterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
    if (muted && this.gliderGain && this.ctx) {
      this.gliderGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    this.notify();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getCurrentMode(): AmbientMode {
    return this.currentMode;
  }

  // --- Ambient Routing & Setup ---

  private ensureAmbientSetup() {
    this.initCtx();
    const ctx = this.ctx;
    if (!ctx) return;

    if (!this.ambientMasterGain) {
      this.ambientMasterGain = ctx.createGain();
      this.ambientMasterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, ctx.currentTime);
      this.ambientMasterGain.connect(ctx.destination);

      // Village master branch
      this.villageGain = ctx.createGain();
      this.villageGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.villageGain.connect(this.ambientMasterGain);

      // Gameplay paper-rustle master branch
      this.gameplayGain = ctx.createGain();
      this.gameplayGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.gameplayGain.connect(this.ambientMasterGain);
    }
  }

  // --- Transition Controller (Crossfading) ---

  public transitionTo(mode: AmbientMode, duration: number = 1.2) {
    this.ensureAmbientSetup();
    const ctx = this.ctx;
    if (!ctx || !this.villageGain || !this.gameplayGain) return;

    this.currentMode = mode;

    const now = ctx.currentTime;
    const timeConstant = duration * 0.4;

    if (mode === 'VILLAGE') {
      // Start village loops if not already
      this.startVillageMusic();
      // Fade in village, fade out gameplay
      this.villageGain.gain.setTargetAtTime(0.25, now, timeConstant);
      this.gameplayGain.gain.setTargetAtTime(0.0001, now, timeConstant);
    } else if (mode === 'GAMEPLAY') {
      // Start gameplay rustle soundscape if not already
      this.startGameplaySoundscape();
      // Fade in gameplay, fade out village
      this.villageGain.gain.setTargetAtTime(0.0001, now, timeConstant);
      this.gameplayGain.gain.setTargetAtTime(0.28, now, timeConstant);
    } else {
      // SILENT
      this.villageGain.gain.setTargetAtTime(0.0001, now, timeConstant);
      this.gameplayGain.gain.setTargetAtTime(0.0001, now, timeConstant);
    }

    this.notify();
  }

  // --- 1. Procedural Lively Village Music Generator ---

  private startVillageMusic() {
    if (this.isVillagePlaying) return;
    this.isVillagePlaying = true;

    // Rhythmic 16-step pentatonic melody loop (Kalimba / Marimba wooden tones)
    const melodyScale = [
      261.63, // C4
      293.66, // D4
      329.63, // E4
      392.0,  // G4
      440.0,  // A4
      523.25, // C5
      587.33, // D5
      659.25, // E5
    ];

    const melodyPattern = [
      0, 2, 4, 3, 2, 0, 3, 4,
      5, 4, 3, 2, 4, 3, 1, 0,
    ];

    const bassPattern = [
      130.81, 0, 196.0, 0, 174.61, 0, 196.0, 0,
      130.81, 0, 220.0, 0, 196.0, 0, 164.81, 0,
    ];

    const stepTimeMs = 210; // ~142 BPM cheerful folk tempo

    this.villageInterval = window.setInterval(() => {
      if (this.currentMode !== 'VILLAGE' || !this.ctx || !this.villageGain) return;

      const now = this.ctx.currentTime;
      const noteIdx = melodyPattern[this.villageStep];
      const bassFreq = bassPattern[this.villageStep];

      // Play Wooden Kalimba / Marimba Note
      if (noteIdx !== undefined) {
        this.playKalimbaNote(melodyScale[noteIdx], now, 0.16);
      }

      // Play Warm Bass Note
      if (bassFreq > 0) {
        this.playVillageBassNote(bassFreq, now, 0.18);
      }

      // Light paper shakers / snap percussion on beats 2, 6, 10, 14
      if (this.villageStep % 4 === 2) {
        this.playPaperPercussion(now, 0.08);
      }

      this.villageStep = (this.villageStep + 1) % melodyPattern.length;
    }, stepTimeMs);
  }

  private playKalimbaNote(freq: number, time: number, gainVal: number) {
    if (!this.ctx || !this.villageGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, time);
    filter.Q.setValueAtTime(3.0, time);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.villageGain);

    osc.start(time);
    osc.stop(time + 0.38);
  }

  private playVillageBassNote(freq: number, time: number, gainVal: number) {
    if (!this.ctx || !this.villageGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

    osc.connect(gain);
    gain.connect(this.villageGain);

    osc.start(time);
    osc.stop(time + 0.42);
  }

  private playPaperPercussion(time: number, gainVal: number) {
    if (!this.ctx || !this.villageGain) return;

    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.villageGain);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.045);
  }

  // --- 2. Procedural Soothing Gameplay Paper-Rustling Soundscape ---

  private startGameplaySoundscape() {
    if (this.isGameplaySoundscapeRunning) return;
    this.ensureAmbientSetup();
    const ctx = this.ctx;
    if (!ctx || !this.gameplayGain) return;

    this.isGameplaySoundscapeRunning = true;

    // A. Create continuous looping filtered paper-rustle noise buffer
    const bufferDuration = 2.0;
    const bufferSize = ctx.sampleRate * bufferDuration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    // Pink-noise curve for soft paper texture
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      data[i] = (b0 + b1 + b2 + b3 + b4) * 0.12;
    }

    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;

    // Dual-stage filter for paper rustling
    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.setValueAtTime(1100, ctx.currentTime);
    this.noiseFilter.Q.setValueAtTime(1.8, ctx.currentTime);

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.18, ctx.currentTime);

    // Connect noise path
    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.gameplayGain);

    this.noiseSource.start();

    // B. Warm Soothing Drone (C3 + G3 + E4 fifths/octaves with soft sine waves)
    this.droneOsc1 = ctx.createOscillator();
    this.droneOsc2 = ctx.createOscillator();
    this.droneGain = ctx.createGain();

    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.setValueAtTime(130.81, ctx.currentTime); // C3

    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.setValueAtTime(196.0, ctx.currentTime); // G3

    this.droneGain.gain.setValueAtTime(0.12, ctx.currentTime);

    this.droneOsc1.connect(this.droneGain);
    this.droneOsc2.connect(this.droneGain);
    this.droneGain.connect(this.gameplayGain);

    this.droneOsc1.start();
    this.droneOsc2.start();
  }

  /**
   * Dynamically modulates the paper rustling intensity based on player motion (gliding vs running)
   */
  public setGameplayActivity(isGliding: boolean, isMoving: boolean) {
    if (!this.ctx || !this.noiseGain || !this.noiseFilter) return;

    const now = this.ctx.currentTime;
    if (isGliding) {
      // Swell paper flutter frequency & volume when soaring
      this.noiseGain.gain.setTargetAtTime(0.35, now, 0.08);
      this.noiseFilter.frequency.setTargetAtTime(1650, now, 0.1);
    } else if (isMoving) {
      this.noiseGain.gain.setTargetAtTime(0.22, now, 0.12);
      this.noiseFilter.frequency.setTargetAtTime(1200, now, 0.12);
    } else {
      // Gentle calm breeze
      this.noiseGain.gain.setTargetAtTime(0.14, now, 0.2);
      this.noiseFilter.frequency.setTargetAtTime(950, now, 0.2);
    }
  }

  // --- Sound Effects (SFX) ---

  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(540, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playGliderFlutter(active: boolean) {
    if (this.isMuted || !active) {
      if (this.gliderGain && this.ctx) {
        this.gliderGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
      return;
    }

    this.initCtx();
    const ctx = this.ctx;
    if (!ctx) return;

    if (!this.gliderOsc) {
      this.gliderOsc = ctx.createOscillator();
      this.gliderGain = ctx.createGain();

      this.gliderOsc.type = 'sine';
      this.gliderOsc.frequency.setValueAtTime(140, ctx.currentTime);
      this.gliderGain.gain.setValueAtTime(0, ctx.currentTime);

      this.gliderOsc.connect(this.gliderGain);
      this.gliderGain.connect(ctx.destination);
      this.gliderOsc.start();
    }

    if (this.gliderOsc && this.gliderGain) {
      this.gliderOsc.frequency.setValueAtTime(130 + Math.sin(Date.now() / 80) * 20, ctx.currentTime);
      this.gliderGain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.05);
    }
  }

  public stopGlider() {
    if (this.gliderGain && this.ctx) {
      this.gliderGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public playPopUpBridge() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(480, now);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start();
    osc1.stop(now + 0.09);

    [320, 480, 640].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(0.12, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.22);
    });
  }

  public playCreaseTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playBridgeCollapse() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playAccordionBounce() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.38);
  }

  public playBookPickup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6 shimmer

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.2, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.3);
    });
  }

  public playThermalUpdraft() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  public playPestGliderBounce() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  public playHurt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  public playLevelVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [
      { f: 523.25, t: 0.0 }, // C5
      { f: 659.25, t: 0.12 }, // E5
      { f: 783.99, t: 0.24 }, // G5
      { f: 1046.5, t: 0.36 }, // C6
      { f: 1318.5, t: 0.52 }, // E6
    ];

    chords.forEach(({ f, t }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.22, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + 0.55);
    });
  }

  public playBuildingPopUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [261.63, 329.63, 392.0, 523.25, 659.25].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  }

  public playButton() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }
}

export const sound = new SoundEngine();

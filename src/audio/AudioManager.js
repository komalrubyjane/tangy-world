import { audioManifest } from './audioManifest';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.filterNode = null;
    this.isInitialized = true;
    this.isMuted = true;
  }

  init() {
    this.isInitialized = true;
    this.isMuted = true;
    return;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (!this.masterGain || !this.ctx) return;
    
    const targetGain = muted ? 0 : 0.8;
    this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
  }

  setFilterCutoff(freq) {
    if (!this.filterNode || !this.ctx) return;
    const clampedFreq = Math.max(300, Math.min(16000, freq));
    this.filterNode.frequency.setTargetAtTime(clampedFreq, this.ctx.currentTime, 0.1);
  }

  // Synthesize Procedural Vinyl Crackle & Room Tone
  startAnalogueAmbience() {
    if (!this.ctx) return;

    // 1. Warm 55Hz Sub Drone
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.droneOsc.connect(droneGain);
    droneGain.connect(this.musicGain);
    this.droneOsc.start();

    // 2. Vinyl Crackle Noise Generator
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Dust crackle pops
      if (Math.random() > 0.992) {
        output[i] = (Math.random() * 2 - 1) * 0.4;
      } else {
        output[i] = (Math.random() * 2 - 1) * 0.015; // Low tape hiss
      }
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2500, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.musicGain);
    this.noiseNode.start();
  }

  // SFX: Microphone Drop Thump & Chime
  playMicDrop() {
    if (!this.isInitialized || this.isMuted) return;

    // Low Sub Thump
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, this.ctx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start();
    sub.stop(this.ctx.currentTime + 0.3);

    // Metallic Chime
    const chime = this.ctx.createOscillator();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(1400, this.ctx.currentTime);
    chime.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.2);

    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    chime.connect(chimeGain);
    chimeGain.connect(this.sfxGain);
    chime.start();
    chime.stop(this.ctx.currentTime + 0.2);
  }

  // SFX: Realistic Paper Page Turn
  playPageTurn() {
    if (!this.isInitialized || this.isMuted) return;

    const bufferSize = this.ctx.sampleRate * 0.25; // 250ms paper flap
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const paperFilter = this.ctx.createBiquadFilter();
    paperFilter.type = 'bandpass';
    paperFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    paperFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    noiseSrc.connect(paperFilter);
    paperFilter.connect(gain);
    gain.connect(this.sfxGain);
    noiseSrc.start();
  }

  // SFX: Ticket Punch Click
  playTicketClick() {
    if (!this.isInitialized || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  crossfadeSection(sectionName) {
    if (!this.isInitialized || !this.droneOsc) return;
    const data = audioManifest.ambience[sectionName];
    if (!data) return;

    // Smoothly shift ambient drone frequency
    this.droneOsc.frequency.setTargetAtTime(data.freq, this.ctx.currentTime, 0.5);
  }
}

export const audioManager = new AudioManager();

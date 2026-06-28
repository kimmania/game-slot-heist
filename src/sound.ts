// Muteable synthesized sound effects using Web Audio API
let ctx: AudioContext | null = null;
let _muted = false;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(v: boolean) {
  _muted = v;
}

export function isMuted() {
  return _muted;
}

function play(freq: number, duration: number, type: OscillatorType = 'square', vol = 0.15, slideTo?: number, detune = 0) {
  if (_muted) return;
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  if (detune !== 0) o.detune.value = detune;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo !== undefined) {
    o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + duration);
  }
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + duration + 0.02);
}

export function spinTick() {
  play(880, 0.04, 'square', 0.05, 660);
}

export function reelStop() {
  play(520, 0.12, 'triangle', 0.12, 180);
}

export function winChime() {
  if (_muted) return;
  const c = getCtx();
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.08, c.currentTime + i * 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.08 + 0.3);
    o.connect(g);
    g.connect(c.destination);
    o.start(c.currentTime + i * 0.08);
    o.stop(c.currentTime + i * 0.08 + 0.35);
  });
}

export function vaultUnlock() {
  play(420, 0.15, 'sawtooth', 0.1, 800);
  setTimeout(() => play(800, 0.2, 'triangle', 0.08), 80);
}

export function vaultBuzzer() {
  play(200, 0.3, 'sawtooth', 0.12, 100);
  setTimeout(() => play(150, 0.5, 'sawtooth', 0.1), 150);
}

export function wheelTick() {
  play(1200, 0.03, 'square', 0.04, 900);
}

export function wheelWin() {
  if (_muted) return;
  const c = getCtx();
  const notes = [440, 554, 659, 880];
  notes.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.1, c.currentTime + i * 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.1 + 0.4);
    o.connect(g);
    g.connect(c.destination);
    o.start(c.currentTime + i * 0.1);
    o.stop(c.currentTime + i * 0.1 + 0.5);
  });
}

export function buttonClick() {
  play(600, 0.06, 'square', 0.06, 400);
}

export function coinBlip() {
  play(880, 0.04, 'sine', 0.05);
}

export function vaultClick() {
  play(1500, 0.04, 'square', 0.06, undefined, 0.01);
}

export function laserZap() {
  play(200, 0.18, 'sawtooth', 0.1, 600, 0.01);
}

export function metalClank() {
  play(120, 0.22, 'square', 0.14, 40, 0.02);
}

export function cashRegister() {
  play(1800, 0.05, 'square', 0.07, undefined, 0.0);
  setTimeout(() => play(1300, 0.08, 'square', 0.09), 60);
  setTimeout(() => play(2200, 0.04, 'sine', 0.06), 140);
}

// =============================================================================
// AUDIO — AudioContext único, beeps + chiptune, respeita autoplay/visibility
// =============================================================================
let ctx = null;
let masterGain = null;
let musicPlaying = false;
let musicNodes = [];
let scheduledTimeout = null;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.85;
  masterGain.connect(ctx.destination);
  return ctx;
}

export function resumeAudio() {
  ensureCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

/** Beep curto (efeito de jogo) */
export function playBeep(freq, type = 'sine', dur = 90) {
  const ac = ensureCtx();
  if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(0.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur / 1000);
    o.start();
    o.stop(ac.currentTime + dur / 1000 + 0.02);
  } catch (e) { /* silencioso */ }
}

// ── Chiptune ──
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
const BPM = 140;
const BEAT = 60 / BPM;

const MELODY = [
  [76,.5],[76,.25],[79,.25],[76,.5],[74,.5],
  [76,.5],[76,.25],[81,.25],[79,1],
  [76,.5],[76,.25],[79,.25],[76,.5],[74,.5],
  [72,.5],[71,.25],[72,.25],[74,1],
  [76,.5],[76,.25],[79,.25],[76,.5],[74,.5],
  [76,.5],[79,.25],[81,.25],[83,.5],[81,.5],
  [79,.5],[76,.25],[74,.25],[72,.5],[71,.5],
  [69,.5],[71,.25],[72,.25],[74,1],
];
const BASS = [
  [52,1],[55,1],[52,1],[50,1],
  [52,1],[55,1],[52,1],[50,1],
  [48,1],[52,1],[48,1],[50,1],
  [48,1],[52,1],[50,1],[48,1],
];
const COUNTER = [
  [83,.25],[81,.25],[79,.25],[76,.5],[null,.25],
  [81,.25],[79,.25],[76,.25],[74,.5],[null,.25],
  [83,.25],[84,.25],[83,.25],[81,.5],[null,.25],
  [79,.25],[76,.25],[74,.25],[72,.5],[null,.5],
];

function playNote(ac, freq, startTime, dur, type, vol, detune = 0) {
  const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 2200;
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  o.connect(f); f.connect(g); g.connect(masterGain);
  const att = 0.008, rel = dur * 0.35;
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(vol, startTime + att);
  g.gain.setValueAtTime(vol, startTime + dur - rel);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
  o.start(startTime); o.stop(startTime + dur + 0.05);
  musicNodes.push(o, g);
}

function playDrum(ac, startTime, type) {
  if (type === 'kick') {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(180, startTime);
    o.frequency.exponentialRampToValueAtTime(40, startTime + .12);
    g.gain.setValueAtTime(.6, startTime);
    g.gain.exponentialRampToValueAtTime(.0001, startTime + .18);
    o.connect(g); g.connect(masterGain);
    o.start(startTime); o.stop(startTime + .2);
    musicNodes.push(o, g);
  } else if (type === 'snare') {
    const buf = ac.createBuffer(1, ac.sampleRate * .1, ac.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = .5;
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(.18, startTime);
    g.gain.exponentialRampToValueAtTime(.0001, startTime + .09);
    src.start(startTime); src.stop(startTime + .12);
    musicNodes.push(src, g);
  } else if (type === 'hat') {
    const buf = ac.createBuffer(1, ac.sampleRate * .04, ac.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 7000;
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(.07, startTime);
    g.gain.exponentialRampToValueAtTime(.0001, startTime + .035);
    src.start(startTime); src.stop(startTime + .05);
    musicNodes.push(src, g);
  }
}

function scheduleMusic() {
  if (!musicPlaying) return;
  const ac = ensureCtx(); if (!ac) return;
  const loopDur = MELODY.reduce((s, [, d]) => s + d * BEAT, 0);
  const now = ac.currentTime + 0.05;

  let t = now;
  for (let rep = 0; rep < 2; rep++) {
    for (const [n, d] of MELODY) { playNote(ac, NOTE(n), t, d * BEAT * .88, 'square', .08); t += d * BEAT; }
  }
  t = now;
  const bassLoop = loopDur * 2; let bi = 0;
  while (t < now + bassLoop) {
    const [n, d] = BASS[bi % BASS.length];
    playNote(ac, NOTE(n), t, d * BEAT * .7, 'sawtooth', .06, -5);
    t += d * BEAT; bi++;
  }
  t = now + BEAT * 2;
  for (let rep = 0; rep < 4; rep++) {
    for (const [n, d] of COUNTER) {
      if (n !== null) playNote(ac, NOTE(n), t, d * BEAT * .75, 'triangle', .045);
      t += d * BEAT;
    }
  }
  const bars = Math.round(loopDur * 2 / BEAT / 4);
  for (let bar = 0; bar < bars; bar++) {
    const bt = now + bar * 4 * BEAT;
    playDrum(ac, bt, 'kick');
    playDrum(ac, bt + BEAT, 'hat');
    playDrum(ac, bt + BEAT * 1.5, 'hat');
    playDrum(ac, bt + BEAT * 2, 'snare');
    playDrum(ac, bt + BEAT * 2.5, 'hat');
    playDrum(ac, bt + BEAT * 3, 'hat');
    playDrum(ac, bt + BEAT * 3.5, 'kick');
  }

  scheduledTimeout = setTimeout(() => { if (musicPlaying) scheduleMusic(); }, loopDur * 2 * 1000 - 600);
}

export function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  resumeAudio();
  scheduleMusic();
}

export function stopMusic() {
  musicPlaying = false;
  if (scheduledTimeout) { clearTimeout(scheduledTimeout); scheduledTimeout = null; }
  musicNodes.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch (e) {} });
  musicNodes = [];
}

export const isMusicPlaying = () => musicPlaying;

// Pausa quando aba fica oculta
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend?.();
  else if (musicPlaying) ctx.resume?.();
});

// =============================================================================
// MAIN — wiring de eventos, loop principal, atalhos de teclado
// =============================================================================
import { CONFIG, CLASS_STEPS } from './config.js';
import { state } from './state.js';
import { canvas, draw, resizeCanvas, chartResize } from './render.js';
import { reset, vision, moveRobot, moveObjects, collide, setLogCallback } from './sim.js';
import { updateUI, addLog, toast } from './ui.js';
import { startMusic, stopMusic, isMusicPlaying, resumeAudio } from './audio.js';

const $ = id => document.getElementById(id);

setLogCallback(addLog);

// ── Botões ──
function togglePause() {
  state.paused = !state.paused;
  const a = $('btnPlay'), b = $('btnPlay2');
  a.innerHTML = state.paused ? '<span aria-hidden="true">▶</span> CONTINUAR' : '<span aria-hidden="true">⏸</span> PAUSAR';
  a.setAttribute('aria-label', state.paused ? 'Continuar' : 'Pausar');
  b.textContent = state.paused ? 'Continuar' : 'Pausar';
}
function cycleSpeed() {
  if (state.explainMode) return;
  state.speedIdx = (state.speedIdx + 1) % CONFIG.SPEEDS.length;
  $('btnSpeed').innerHTML = `<span aria-hidden="true">⚡</span> ${CONFIG.SPEED_LABELS[state.speedIdx].toUpperCase()}`;
  $('btnSpeed2').textContent = CONFIG.SPEED_LABELS[state.speedIdx];
}
function doReset() {
  reset();
  // CORREÇÃO: garante que o pause volte a "Pausar"
  state.paused = false;
  $('btnPlay').innerHTML = '<span aria-hidden="true">⏸</span> PAUSAR';
  $('btnPlay2').textContent = 'Pausar';
  updateUI();
}
function toggleTeacher() {
  state.explainMode = !state.explainMode;
  const btn = $('btnTeacher');
  btn.classList.toggle('active-mode', state.explainMode);
  btn.setAttribute('aria-pressed', String(state.explainMode));
  const cls = $('classroom');
  if (state.explainMode) {
    cls.hidden = false;
    cls.classList.add('open');
    $('class-arena-inner').appendChild(canvas);
    resizeCanvas();
    state.currentStep = 0;
    state.synapsePackets = [];
    $('class-speed-badge').textContent = `🐢 MODO LENTO — ${Math.round(CONFIG.TEACHER_SPEED_FACTOR * 100)}% VELOCIDADE`;
  } else {
    cls.classList.remove('open');
    cls.hidden = true;
    $('arena-wrap').appendChild(canvas);
    resizeCanvas();
  }
  updateUI();
}
function toggleMusicBtn() {
  resumeAudio();
  const btn = $('btnMusic');
  if (isMusicPlaying()) {
    stopMusic();
    btn.classList.remove('active-mode');
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = '<span aria-hidden="true">🎵</span> MÚSICA';
  } else {
    startMusic();
    btn.classList.add('active-mode');
    btn.setAttribute('aria-pressed', 'true');
    btn.innerHTML = '<span aria-hidden="true">🔇</span> MÚSICA';
  }
}
function toggleFS() {
  const el = document.documentElement;
  const isFS = document.fullscreenElement || document.webkitFullscreenElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (!req) { toast('Tela cheia não suportada neste dispositivo'); return; }
  (isFS ? exit.call(document) : req.call(el)).catch(() => toast('Tela cheia bloqueada pelo navegador'));
}

// ── Wiring ──
['btnPlay', 'btnPlay2'].forEach(id => $(id).addEventListener('click', togglePause));
['btnSpeed', 'btnSpeed2'].forEach(id => $(id).addEventListener('click', cycleSpeed));
['btnReset', 'btnReset2'].forEach(id => $(id).addEventListener('click', doReset));
$('btnTeacher').addEventListener('click', toggleTeacher);
$('class-close-btn').addEventListener('click', toggleTeacher);
$('btnMusic').addEventListener('click', toggleMusicBtn);
$('clearLog').addEventListener('click', () => { $('log').innerHTML = ''; });
$('btnFS').addEventListener('click', toggleFS);

$('nav-next').addEventListener('click', () => {
  state.currentStep = Math.min(state.currentStep + 1, CLASS_STEPS.length - 1);
  updateUI();
});
$('nav-prev').addEventListener('click', () => {
  state.currentStep = Math.max(state.currentStep - 1, 0);
  updateUI();
});

document.addEventListener('fullscreenchange', () => setTimeout(() => { resizeCanvas(); chartResize(); }, 60));
document.addEventListener('webkitfullscreenchange', () => setTimeout(() => { resizeCanvas(); chartResize(); }, 60));
window.addEventListener('resize', () => setTimeout(() => { resizeCanvas(); chartResize(); }, 80));

// ── Atalhos de teclado ──
document.addEventListener('keydown', (e) => {
  if (e.target.matches?.('input,textarea')) return;
  if (e.code === 'Space') { e.preventDefault(); togglePause(); }
  else if (e.key === 'ArrowRight' && state.explainMode) {
    state.currentStep = Math.min(state.currentStep + 1, CLASS_STEPS.length - 1); updateUI();
  } else if (e.key === 'ArrowLeft' && state.explainMode) {
    state.currentStep = Math.max(state.currentStep - 1, 0); updateUI();
  } else if (e.key.toLowerCase() === 'r') doReset();
  else if (e.key.toLowerCase() === 's') cycleSpeed();
  else if (e.key.toLowerCase() === 't') toggleTeacher();
  else if (e.key.toLowerCase() === 'm') toggleMusicBtn();
});

// Auto-avanço dos passos da sala de aula
let stepAutoTimer = 0;
function autoAdvanceStep() {
  if (!state.explainMode) return;
  stepAutoTimer++;
  if (stepAutoTimer < 300) return;
  stepAutoTimer = 0;
  if (state.lastNear && state.currentStep < 3) state.currentStep++;
}

// ── Loop principal ──
function mainLoop() {
  if (!state.paused) {
    const baseSteps = state.explainMode ? 1 : CONFIG.SPEEDS[state.speedIdx];
    for (let i = 0; i < baseSteps; i++) {
      if (state.tick % 4 === 0) vision();
      moveRobot(); moveObjects(); collide();
    }
    if (state.explainMode) autoAdvanceStep();
    if (state.tick % 3 === 0) updateUI();
  }
  draw();
  requestAnimationFrame(mainLoop);
}

// ── Boot ──
window.addEventListener('load', () => {
  resizeCanvas();
  chartResize();
  doReset();
  updateUI();
  // Garante que o primeiro gesto destrava o áudio (autoplay policy)
  ['click', 'keydown', 'touchstart'].forEach(ev =>
    document.addEventListener(ev, resumeAudio, { once: true, passive: true }));
  requestAnimationFrame(mainLoop);
  toast('🎓 Combate Neural v6 — Pressione Espaço para pausar · T para sala de aula');
});

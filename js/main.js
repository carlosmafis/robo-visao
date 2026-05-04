// =============================================================================
// MAIN v7 — orquestra sidebar + 4 modos + loop principal
// =============================================================================
import { CONFIG, CLASS_STEPS, MODES } from './config.js';
import { state, saveWeightsToLocalStorage, competitor, resetCompetitionAll } from './state.js';
import { canvas, draw, resizeCanvas, chartResize } from './render.js';
import { reset, vision, moveRobot, moveObjects, collide, setLogCallback } from './sim.js';
import { updateUI, addLog, toast } from './ui.js';
import { startMusic, stopMusic, isMusicPlaying, resumeAudio } from './audio.js';
import { initSidebar, setActiveMode } from './sidebar.js';
import { spawnCompetitor, despawnCompetitor } from './competition.js';
import { startWebcam, stopWebcam, importTrainedWeights, isWebcamRunning } from './webcam.js';

const $ = id => document.getElementById(id);

setLogCallback(addLog);

function togglePause() {
  state.paused = !state.paused;
  const a = $('btnPlay');
  if (a) a.innerHTML = state.paused ? '<span aria-hidden="true">▶</span> CONTINUAR' : '<span aria-hidden="true">⏸</span> PAUSAR';
}
function cycleSpeed() {
  if (state.mode === 'class') return;
  state.speedIdx = (state.speedIdx + 1) % CONFIG.SPEEDS.length;
  const b = $('btnSpeed');
  if (b) b.innerHTML = `<span aria-hidden="true">⚡</span> ${CONFIG.SPEED_LABELS[state.speedIdx].toUpperCase()}`;
}
function doReset() {
  reset();
  state.paused = false;
  const a = $('btnPlay');
  if (a) a.innerHTML = '<span aria-hidden="true">⏸</span> PAUSAR';
  if (state.mode === 'compete') spawnCompetitor();
  updateUI();
}
function toggleMusicBtn() {
  resumeAudio();
  const btn = $('btnMusic');
  if (!btn) return;
  if (isMusicPlaying()) {
    stopMusic();
    btn.classList.remove('active-mode');
    btn.innerHTML = '<span aria-hidden="true">🎵</span> MÚSICA';
  } else {
    startMusic();
    btn.classList.add('active-mode');
    btn.innerHTML = '<span aria-hidden="true">🔇</span> MÚSICA';
  }
}
function toggleFS() {
  const el = document.documentElement;
  const isFS = document.fullscreenElement;
  if (isFS) document.exitFullscreen();
  else el.requestFullscreen?.().catch(() => toast('Tela cheia bloqueada'));
}

// ── Wiring básico ──
$('btnPlay')?.addEventListener('click', togglePause);
$('btnSpeed')?.addEventListener('click', cycleSpeed);
$('btnReset')?.addEventListener('click', doReset);
$('btnMusic')?.addEventListener('click', toggleMusicBtn);
$('btnFS')?.addEventListener('click', toggleFS);
$('clearLog')?.addEventListener('click', () => { const log = $('log'); if (log) log.innerHTML = ''; });

// Sala de aula nav
$('nav-next')?.addEventListener('click', () => {
  state.currentStep = Math.min(state.currentStep + 1, CLASS_STEPS.length - 1);
  updateUI();
});
$('nav-prev')?.addEventListener('click', () => {
  state.currentStep = Math.max(state.currentStep - 1, 0);
  updateUI();
});

// ── Wiring competição ──
$('btn-comp-reset')?.addEventListener('click', () => {
  resetCompetitionAll();
  spawnCompetitor();
  // Recria objetos para arena limpa
  reset();
  // Garante competidor ativo após reset()
  spawnCompetitor();
  updateUI();
  setTimeout(() => { resizeCanvas(); chartResize(); updateUI(); }, 60);
  toast('🔄 Duelo reiniciado — Robô A (η=0.05) vs Robô B (η=' + CONFIG.COMPETITOR_LR + ')');
});

// ── Wiring webcam ──
$('btn-vision-start')?.addEventListener('click', async () => {
  if (isWebcamRunning()) {
    stopWebcam();
    $('btn-vision-start').textContent = '▶ INICIAR CÂMERA';
  } else {
    const ok = await startWebcam();
    if (ok) $('btn-vision-start').textContent = '⏹ PARAR CÂMERA';
  }
});
$('btn-vision-import')?.addEventListener('click', () => {
  importTrainedWeights();
  toast('🧠 Pesos do treino aplicados à webcam');
});
$('btn-vision-save')?.addEventListener('click', () => {
  if (saveWeightsToLocalStorage()) toast('💾 Snapshot dos pesos salvo localmente');
});

// ── Sidebar wiring ──
initSidebar((mode) => {
  // Recolocar canvas no container correto
  const target =
    mode === 'class'   ? $('class-arena-inner') :
    mode === 'compete' ? $('compete-arena-inner') :
                         $('arena-wrap');

  if (target && canvas.parentElement !== target) target.appendChild(canvas);

  // Habilitar / desabilitar competidor
  if (mode === 'compete' && !competitor.enabled) {
    // Entrar no modo: zera placar/telemetria de A e B para um duelo justo
    resetCompetitionAll();
    reset();
    spawnCompetitor();
  }
  if (mode !== 'compete' && competitor.enabled) despawnCompetitor();

  // Webcam
  if (mode === 'vision') {
    // não inicia auto — usuário aciona
  } else if (isWebcamRunning()) {
    stopWebcam();
    const b = $('btn-vision-start'); if (b) b.textContent = '▶ INICIAR CÂMERA';
  }

  // Dois ticks de resize: o canvas do gráfico só ganha tamanho após o
  // browser aplicar o `hidden=false` na view recém-aberta.
  setTimeout(() => { resizeCanvas(); chartResize(); updateUI(); }, 60);
  setTimeout(() => { resizeCanvas(); chartResize(); updateUI(); }, 240);
});

// ── Resize global ──
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev =>
  document.addEventListener(ev, () => setTimeout(() => { resizeCanvas(); chartResize(); }, 60)));
window.addEventListener('resize', () => setTimeout(() => { resizeCanvas(); chartResize(); }, 80));

// ── Atalhos ──
document.addEventListener('keydown', (e) => {
  if (e.target.matches?.('input,textarea')) return;
  if (e.code === 'Space') { e.preventDefault(); togglePause(); }
  else if (e.key === 'ArrowRight' && state.mode === 'class') {
    state.currentStep = Math.min(state.currentStep + 1, CLASS_STEPS.length - 1); updateUI();
  } else if (e.key === 'ArrowLeft' && state.mode === 'class') {
    state.currentStep = Math.max(state.currentStep - 1, 0); updateUI();
  } else if (e.key.toLowerCase() === 'r') doReset();
  else if (e.key.toLowerCase() === 's') cycleSpeed();
  else if (e.key.toLowerCase() === 'm') toggleMusicBtn();
  else if (['1', '2', '3', '4'].includes(e.key)) {
    const idx = parseInt(e.key, 10) - 1;
    setActiveMode(MODES[idx].id);
  }
});

// ── Auto-advance steps na sala de aula ──
let stepAutoTimer = 0;
function autoAdvanceStep() {
  if (state.mode !== 'class') return;
  stepAutoTimer++;
  if (stepAutoTimer < 300) return;
  stepAutoTimer = 0;
  if (state.lastNear && state.currentStep < 3) state.currentStep++;
}

// ── Auto-save dos pesos a cada 30 colisões aprendidas ──
let lastSavedLearn = 0;
function autoSaveWeights() {
  if (state.tick % 600 === 0) {
    if (saveWeightsToLocalStorage()) lastSavedLearn = Date.now();
  }
}

// ── Loop principal ──
function mainLoop() {
  if (!state.paused && state.mode !== 'vision') {
    const baseSteps = state.mode === 'class' ? 1 : CONFIG.SPEEDS[state.speedIdx];
    for (let i = 0; i < baseSteps; i++) {
      if (state.tick % 4 === 0) vision();
      moveRobot(); moveObjects(); collide();
    }
    if (state.mode === 'class') autoAdvanceStep();
    if (state.tick % 3 === 0) updateUI();
    autoSaveWeights();
  }
  if (state.mode !== 'vision') draw();
  requestAnimationFrame(mainLoop);
}

// ── Boot ──
window.addEventListener('load', () => {
  resizeCanvas();
  chartResize();
  doReset();
  setActiveMode('train');
  updateUI();
  ['click', 'keydown', 'touchstart'].forEach(ev =>
    document.addEventListener(ev, resumeAudio, { once: true, passive: true }));
  requestAnimationFrame(mainLoop);
  toast(`🚀 Combate Neural ${CONFIG.VERSION} — Use a sidebar para alternar modos · 1-4 atalhos`);
});

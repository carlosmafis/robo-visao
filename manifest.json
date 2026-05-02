// =============================================================================
// WEBCAM — Visão Real: classifica cor dominante via webcam usando o perceptron
// =============================================================================
import { RULES } from './config.js';
import { NN, loadWeightsFromLocalStorage } from './state.js';
import { rgbToHsv, forward } from './neural.js';

const $ = id => document.getElementById(id);

let video = null, stream = null, sampleCanvas = null, sampleCtx = null;
let running = false, rafId = 0;
let lastFrame = { rgb: [0, 0, 0], hsv: { h: 0, s: 0, v: 0 }, probs: [], winnerIdx: -1 };

const SAMPLE_SIZE = 80; // resolução interna pra média

function buildSampleCanvas() {
  if (sampleCanvas) return;
  sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = SAMPLE_SIZE;
  sampleCanvas.height = SAMPLE_SIZE;
  sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
}

function getCenterColor() {
  const w = video.videoWidth, h = video.videoHeight;
  if (!w || !h) return null;
  // Pega o quadrado central
  const side = Math.min(w, h);
  const sx = (w - side) / 2, sy = (h - side) / 2;
  // Crop central pequeno (1/3) pra focar no que o usuário aponta
  const cropSide = Math.floor(side / 3);
  const cx = sx + (side - cropSide) / 2;
  const cy = sy + (side - cropSide) / 2;
  sampleCtx.drawImage(video, cx, cy, cropSide, cropSide, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const data = sampleCtx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
  let R = 0, G = 0, B = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    R += data[i]; G += data[i + 1]; B += data[i + 2]; n++;
  }
  return [Math.round(R / n), Math.round(G / n), Math.round(B / n)];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function loop() {
  if (!running) return;
  const rgb = getCenterColor();
  if (rgb) {
    const [r, g, b] = rgb;
    const hsv = rgbToHsv(r, g, b);
    // Entrada para a rede: distância = 0 (objeto "na cara")
    const x = [hsv.h / 360, hsv.s, hsv.v, 1];
    const probs = forward(x);
    const winnerIdx = probs.reduce((iMax, v, i, a) => v > a[iMax] ? i : iMax, 0);
    lastFrame = { rgb, hsv, probs, winnerIdx };
    renderFrame();
  }
  rafId = requestAnimationFrame(loop);
}

function renderFrame() {
  const { rgb, hsv, probs, winnerIdx } = lastFrame;
  const hex = rgbToHex(...rgb);
  const swatch = $('vision-swatch');
  if (swatch) swatch.style.background = hex;
  const hexEl = $('vision-hex'); if (hexEl) hexEl.textContent = hex.toUpperCase();
  const rgbEl = $('vision-rgb'); if (rgbEl) rgbEl.textContent = `RGB(${rgb.join(', ')})`;
  const hsvEl = $('vision-hsv'); if (hsvEl) hsvEl.textContent = `H ${Math.round(hsv.h)}° · S ${Math.round(hsv.s * 100)}% · V ${Math.round(hsv.v * 100)}%`;
  const decEl = $('vision-decision');
  if (decEl) {
    if (winnerIdx >= 0) {
      const r = RULES[winnerIdx];
      const conf = Math.round(probs[winnerIdx] * 100);
      decEl.innerHTML = `
        <span class="vd-dot" style="background:${r.hex};box-shadow:0 0 14px ${r.hex}"></span>
        <span class="vd-name" style="color:${r.hex}">${r.name}</span>
        <span class="vd-conf">${conf}% de confiança</span>`;
      decEl.style.borderColor = r.hex;
    }
  }
  const list = $('vision-probs');
  if (list && !list.dataset.built) {
    list.dataset.built = '1';
    RULES.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'vp-row';
      row.innerHTML = `
        <span class="vp-dot" style="background:${r.hex};box-shadow:0 0 6px ${r.hex}"></span>
        <span class="vp-name">${r.name}</span>
        <div class="vp-bg"><div class="vp-fill" id="vp-fill-${i}" style="background:${r.hex};box-shadow:0 0 8px ${r.hex}"></div></div>
        <span class="vp-pct" id="vp-pct-${i}" style="color:${r.hex}">0%</span>`;
      list.appendChild(row);
    });
  }
  if (list) {
    RULES.forEach((_, i) => {
      const pct = Math.round((probs[i] || 0) * 100);
      const f = document.getElementById(`vp-fill-${i}`);
      const p = document.getElementById(`vp-pct-${i}`);
      if (f) f.style.width = pct + '%';
      if (p) p.textContent = pct + '%';
    });
  }
}

export async function startWebcam() {
  if (running) return true;
  buildSampleCanvas();
  if (!video) {
    video = $('vision-video');
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    running = true;
    setStatus('🟢 Câmera ativa · classificando em tempo real');
    loop();
    return true;
  } catch (e) {
    setStatus(`❌ Erro ao acessar câmera: ${e.message}`);
    return false;
  }
}

export function stopWebcam() {
  running = false;
  cancelAnimationFrame(rafId);
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  if (video) video.srcObject = null;
  setStatus('⏸ Câmera desligada');
}

export function isWebcamRunning() { return running; }

function setStatus(msg) {
  const el = $('vision-status');
  if (el) el.textContent = msg;
}

export function importTrainedWeights() {
  // Os pesos do modo Treino vivem em NN.W (memória). Aqui apenas confirmamos
  // que o NN compartilhado já está atualizado, mas também tentamos snapshot do localStorage.
  const snap = loadWeightsFromLocalStorage();
  let info = '';
  if (snap) {
    snap.W.forEach((row, i) => row.forEach((w, j) => { NN.W[i][j] = w; }));
    snap.b.forEach((b, i) => { NN.b[i] = b; });
    info = `(snapshot de ${new Date(snap.timestamp).toLocaleTimeString()})`;
  }
  setStatus(`✓ Pesos do treino importados ${info}`);
}

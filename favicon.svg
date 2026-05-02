// =============================================================================
// TELEMETRY — Sparkline acurácia + barras por cor
// =============================================================================
import { telemetry } from './state.js';
import { RULES } from './config.js';

const $ = id => document.getElementById(id);

let sparkCtx = null, sparkW = 0, sparkH = 0;

function ensureSpark() {
  const c = $('telemetry-spark');
  if (!c) return null;
  if (!sparkCtx) sparkCtx = c.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = c.offsetWidth || 260, h = c.offsetHeight || 50;
  if (w !== sparkW || h !== sparkH) {
    sparkW = w; sparkH = h;
    c.width = w * dpr; c.height = h * dpr;
    sparkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return sparkCtx;
}

export function drawAccuracySpark() {
  const g = ensureSpark();
  if (!g) return;
  const w = sparkW, h = sparkH;
  g.clearRect(0, 0, w, h);
  // Grid sutil
  g.strokeStyle = 'rgba(0,255,163,.06)'; g.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (i / 4) * h;
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
  }
  // 50% line
  g.strokeStyle = 'rgba(255,216,58,.18)'; g.setLineDash([2, 4]);
  g.beginPath(); g.moveTo(0, h * 0.5); g.lineTo(w, h * 0.5); g.stroke();
  g.setLineDash([]);

  const data = telemetry.accuracyHistory;
  if (data.length < 2) {
    g.fillStyle = 'rgba(154,217,192,.45)';
    g.font = '9px "Share Tech Mono"';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Aguardando dados...', w / 2, h / 2);
    return;
  }
  // Área
  g.beginPath();
  data.forEach((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - v * (h - 4) - 2;
    i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  });
  g.lineTo(w, h); g.lineTo(0, h); g.closePath();
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, 'rgba(0,255,163,.32)'); gr.addColorStop(1, 'rgba(0,255,163,.02)');
  g.fillStyle = gr; g.fill();
  // Linha
  g.beginPath();
  data.forEach((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - v * (h - 4) - 2;
    i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  });
  g.strokeStyle = '#00ffa3'; g.lineWidth = 1.6;
  g.shadowColor = '#00ffa3'; g.shadowBlur = 6; g.stroke(); g.shadowBlur = 0;

  // Pct atual
  const last = data[data.length - 1];
  g.fillStyle = '#00ffa3';
  g.font = 'bold 11px "Orbitron"';
  g.textAlign = 'right'; g.textBaseline = 'top';
  g.fillText(`${Math.round(last * 100)}%`, w - 6, 4);
}

export function updatePerClassBars() {
  const wrap = $('per-class-bars');
  if (!wrap) return;
  if (!wrap.children.length) {
    RULES.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'pcb-row';
      row.innerHTML = `
        <span class="pcb-dot" style="background:${r.hex};box-shadow:0 0 6px ${r.hex}"></span>
        <span class="pcb-name">${r.name}</span>
        <div class="pcb-bg"><div class="pcb-fill" id="pcb-fill-${i}" style="background:${r.hex}"></div></div>
        <span class="pcb-val" id="pcb-val-${i}" style="color:${r.hex}">—</span>
      `;
      wrap.appendChild(row);
    });
  }
  RULES.forEach((_, i) => {
    const c = telemetry.perClass[i];
    const acc = c.total > 0 ? c.hits / c.total : 0;
    const fill = document.getElementById(`pcb-fill-${i}`);
    const val = document.getElementById(`pcb-val-${i}`);
    if (fill) fill.style.width = `${Math.round(acc * 100)}%`;
    if (val) val.textContent = c.total > 0 ? `${Math.round(acc * 100)}% (${c.hits}/${c.total})` : '—';
  });
  // Resumo
  const sum = $('telemetry-summary');
  if (sum) {
    const overall = telemetry.total > 0 ? Math.round(telemetry.hits / telemetry.total * 100) : 0;
    sum.innerHTML = `
      <span><b>${telemetry.hits}</b>/<b>${telemetry.total}</b> acertos</span>
      <span>·</span>
      <span><b>${overall}%</b> geral</span>
      <span>·</span>
      <span>janela móvel: <b>${telemetry.windowSize}</b></span>
    `;
  }
}

export function updateTelemetry() {
  drawAccuracySpark();
  updatePerClassBars();
}

// =============================================================================
// MATH-LIVE — visualização da matemática em tempo real
// Mostra: vetor x → multiplicação por W → logits z → softmax → decisão
// =============================================================================
import { state, NN } from './state.js';
import { RULES } from './config.js';

const $ = id => document.getElementById(id);

function color(v, scale = 1) {
  const t = Math.max(-1, Math.min(1, v / scale));
  if (t >= 0) return `rgba(0,255,163,${0.15 + t * 0.55})`;
  return `rgba(255,59,111,${0.15 + (-t) * 0.55})`;
}

export function buildMathLive() {
  const root = $('math-live');
  if (!root || root.dataset.built) return;
  root.dataset.built = '1';
  root.innerHTML = `
    <div class="ml-section">
      <div class="ml-label">① VETOR DE ENTRADA <span class="ml-eq">x = [H/360, S, V, prox]</span></div>
      <div class="ml-row" id="ml-x-row"></div>
    </div>
    <div class="ml-section">
      <div class="ml-label">② MATRIZ DE PESOS  <span class="ml-eq">W [classes × 4]</span> · cor = força</div>
      <div class="ml-matrix" id="ml-W"></div>
    </div>
    <div class="ml-section">
      <div class="ml-label">③ LOGITS  <span class="ml-eq">z_i = Σ W[i][j]·x[j] + b[i]</span></div>
      <div class="ml-z-row" id="ml-z"></div>
    </div>
    <div class="ml-section">
      <div class="ml-label">④ SOFTMAX → PROBABILIDADES  <span class="ml-eq">p_i = e^z_i / Σ e^z</span></div>
      <div class="ml-p-list" id="ml-p"></div>
    </div>
    <div class="ml-section">
      <div class="ml-label">⑤ DECISÃO  <span class="ml-eq">argmax(p)</span></div>
      <div class="ml-decision" id="ml-dec">aguardando alvo…</div>
    </div>
  `;
}

export function updateMathLive() {
  buildMathLive();
  const xRow = $('ml-x-row');
  const Wel = $('ml-W');
  const zRow = $('ml-z');
  const pRow = $('ml-p');
  const dec = $('ml-dec');
  if (!xRow) return;

  const x = NN.lastInput;
  const z = NN.lastLogits;
  const p = NN.lastProbs;
  const labels = ['H', 'S', 'V', 'D'];
  const has = !!state.lastNear;

  // ① vetor x
  xRow.innerHTML = '';
  for (let j = 0; j < 4; j++) {
    const cell = document.createElement('div');
    cell.className = 'ml-x-cell' + (has ? ' lit' : '');
    cell.style.background = has ? color(x[j], 1) : 'transparent';
    cell.innerHTML = `<div class="ml-x-lbl">${labels[j]}</div><div class="ml-x-val">${(x[j] || 0).toFixed(2)}</div>`;
    xRow.appendChild(cell);
  }

  // ② matriz W (compacta)
  if (!Wel.dataset.built || Wel.children.length !== RULES.length * 5) {
    Wel.innerHTML = '';
    Wel.dataset.built = '1';
    // header
    Wel.appendChild(makeHd(''));
    labels.forEach(l => Wel.appendChild(makeHd(l)));
    RULES.forEach((r, i) => {
      const lbl = document.createElement('div');
      lbl.className = 'ml-W-lbl';
      lbl.innerHTML = `<span class="ml-W-dot" style="background:${r.hex};box-shadow:0 0 5px ${r.hex}"></span>${r.name.slice(0, 4)}`;
      Wel.appendChild(lbl);
      for (let j = 0; j < 4; j++) {
        const c = document.createElement('div');
        c.className = 'ml-W-cell';
        c.id = `ml-W-${i}-${j}`;
        Wel.appendChild(c);
      }
    });
  }
  RULES.forEach((_, i) => {
    for (let j = 0; j < 4; j++) {
      const c = $(`ml-W-${i}-${j}`);
      if (!c) continue;
      const w = NN.W[i][j];
      c.style.background = color(w, 1.2);
      c.textContent = w.toFixed(2);
      // destaque na linha vencedora
      if (has && i === argmax(p)) c.classList.add('winner'); else c.classList.remove('winner');
    }
  });

  // ③ logits
  zRow.innerHTML = '';
  RULES.forEach((r, i) => {
    const cell = document.createElement('div');
    cell.className = 'ml-z-cell';
    cell.style.borderColor = r.hex + '66';
    cell.innerHTML = `<div class="ml-z-lbl" style="color:${r.hex}">${r.name.slice(0, 4)}</div>
                      <div class="ml-z-val">${(z[i] || 0).toFixed(2)}</div>`;
    zRow.appendChild(cell);
  });

  // ④ softmax
  pRow.innerHTML = '';
  const winIdx = has ? argmax(p) : -1;
  RULES.forEach((r, i) => {
    const pct = Math.round((p[i] || 0) * 100);
    const cell = document.createElement('div');
    cell.className = 'ml-p-cell' + (i === winIdx ? ' winner' : '');
    cell.style.borderColor = r.hex;
    cell.innerHTML = `
      <div class="ml-p-name" style="color:${r.hex}">${r.name.slice(0, 4)}</div>
      <div class="ml-p-bar-bg"><div class="ml-p-bar-fill" style="width:${pct}%;background:${r.hex};box-shadow:0 0 8px ${r.hex}"></div></div>
      <div class="ml-p-pct" style="color:${r.hex}">${pct}%</div>`;
    pRow.appendChild(cell);
  });

  // ⑤ decisão
  if (has && winIdx >= 0) {
    const r = RULES[winIdx];
    const conf = Math.round((p[winIdx] || 0) * 100);
    dec.innerHTML = `
      <span class="ml-dec-dot" style="background:${r.hex};box-shadow:0 0 12px ${r.hex}"></span>
      <span class="ml-dec-name" style="color:${r.hex}">${r.name}</span>
      <span class="ml-dec-conf">${conf}% confiança</span>
      <span class="ml-dec-action">→ ${r.action}</span>`;
  } else {
    dec.innerHTML = '<span class="ml-dec-idle">⏳ Nenhum alvo no raio de detecção</span>';
  }
}

function makeHd(t) { const d = document.createElement('div'); d.className = 'ml-W-hd'; d.textContent = t; return d; }
function argmax(a) { let m = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[m]) m = i; return m; }

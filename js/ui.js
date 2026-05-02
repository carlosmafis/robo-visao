// =============================================================================
// UI — atualização do DOM (painel normal + sala de aula + heatmap)
// =============================================================================
import { CONFIG, RULES, CLASS_STEPS } from './config.js';
import { state, adaptive, NN } from './state.js';
import { rgbToHsv, scoreColor, margin } from './neural.js';
import { dist, fmt } from './render.js';
import { drawChart } from './render.js';

const $ = id => document.getElementById(id);

// Cache de elementos para evitar lookups por frame
const els = {
  pts: $('pts'), col: $('col'), fug: $('fug'), dmg: $('dmg'),
  best: $('best'), learn: $('learn-count'),
  w: [0, 1, 2, 3].map(i => $('w' + i)),
  hval: $('hval'), sval: $('sval'), vval: $('vval'), dval: $('dval'),
  nearNone: $('near-none'), nearInfo: $('near-info'),
  scoresPanel: $('scores-panel'),
  decBox: $('dec-box'), decName: $('dec-name'), decSub: $('dec-sub'), decMargin: $('dec-margin'),
  confPct: $('conf-pct'), confBar: $('conf-bar'),
  log: $('log'),
  heatmap: $('weight-heatmap'),
  // Classroom
  ctd: $('class-tick-display'),
  csNum: $('class-step-num'), csTitle: $('class-step-title'),
  csDesc: $('class-step-desc'), csFormula: $('class-step-formula'),
  cActList: $('class-act-list'),
  cDecBox: $('class-dec-box'), cDecName: $('class-dec-name'), cDecRationale: $('class-dec-rationale'),
  navPrev: $('nav-prev'), navNext: $('nav-next'),
};

// ── LOG ──
export function addLog(msg, color) {
  const div = document.createElement('div');
  div.className = 'log-entry';
  const t = document.createElement('span'); t.className = 'log-time'; t.textContent = fmt(state.tick);
  const m = document.createElement('span'); m.className = 'log-msg'; m.textContent = msg;
  m.style.color = color || 'var(--neon)';
  div.appendChild(t); div.appendChild(m);
  els.log.insertBefore(div, els.log.firstChild);
  while (els.log.children.length > CONFIG.MAX_LOG_ENTRIES) els.log.removeChild(els.log.lastChild);
}

// ── HEATMAP da matriz NN.W (n_classes × 4) ──
function colorForWeight(w) {
  const t = Math.max(-1, Math.min(1, w));
  if (t >= 0) {
    const a = t;
    return `rgba(0,255,163,${.15 + a * .85})`;
  } else {
    return `rgba(255,59,111,${.15 + (-t) * .85})`;
  }
}
let heatmapBuilt = false;
function ensureHeatmap() {
  if (heatmapBuilt) return;
  els.heatmap.innerHTML = '';
  // Header row
  els.heatmap.appendChild(makeCell('hm-row-lbl', '·'));
  ['H', 'S', 'V', 'D'].forEach(l => els.heatmap.appendChild(makeCell('hm-row-lbl', l)));
  // Data rows
  RULES.forEach((rule, i) => {
    const lbl = document.createElement('div');
    lbl.className = 'hm-row-lbl';
    const dot = document.createElement('span');
    dot.className = 'dot'; dot.style.background = rule.hex; dot.style.boxShadow = `0 0 6px ${rule.hex}`;
    lbl.appendChild(dot);
    const txt = document.createElement('span'); txt.textContent = rule.name.slice(0, 4);
    lbl.appendChild(txt);
    els.heatmap.appendChild(lbl);
    for (let j = 0; j < 4; j++) {
      const c = document.createElement('div');
      c.className = 'hm-cell';
      c.id = `hm-${i}-${j}`;
      els.heatmap.appendChild(c);
    }
  });
  heatmapBuilt = true;
}
function makeCell(cls, text) { const d = document.createElement('div'); d.className = cls; d.textContent = text; return d; }
function updateHeatmap() {
  ensureHeatmap();
  RULES.forEach((_, i) => {
    for (let j = 0; j < 4; j++) {
      const cell = $(`hm-${i}-${j}`);
      if (!cell) continue;
      const w = NN.W[i][j];
      cell.style.background = colorForWeight(w);
      cell.textContent = w.toFixed(1);
      cell.title = `W[${RULES[i].name}][${['H','S','V','D'][j]}] = ${w.toFixed(3)}`;
    }
  });
}

// ── Rede sináptica pequena ──
function drawSynapsesSmall() {
  const svg = document.getElementById('neural-svg-small');
  if (!svg) return;
  svg.innerHTML = '';
  if (!state.lastNear) return;
  const inputs = document.querySelectorAll('#neural-viz-small .neuron[id^="n-"]');
  const outputs = document.querySelectorAll('#neural-output-small .neuron');
  const pRect = document.getElementById('panel').getBoundingClientRect();
  inputs.forEach(inp => {
    const ir = inp.getBoundingClientRect();
    outputs.forEach(out => {
      const or = out.getBoundingClientRect();
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', ir.left - pRect.left + ir.width / 2);
      line.setAttribute('y1', ir.top - pRect.top + ir.height / 2);
      line.setAttribute('x2', or.left - pRect.left + or.width / 2);
      line.setAttribute('y2', or.top - pRect.top + or.height / 2);
      line.setAttribute('stroke', 'rgba(0,255,163,.18)');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('style', 'animation:synapse-flow 1.6s ease-in-out infinite');
      svg.appendChild(line);
    });
  });
}
function updateNeuralVizSmall() {
  const out = document.getElementById('neural-output-small');
  if (!state.lastNear) {
    out.innerHTML = '<div class="none-msg">AGUARDANDO...</div>';
    ['n-h', 'n-s', 'n-v', 'n-d'].forEach(id => $(id).classList.remove('active'));
    return;
  }
  const rr = parseInt(state.lastNear.rule.hex.slice(1, 3), 16);
  const gg = parseInt(state.lastNear.rule.hex.slice(3, 5), 16);
  const bb = parseInt(state.lastNear.rule.hex.slice(5, 7), 16);
  const { h, s, v } = rgbToHsv(rr, gg, bb);
  const d = dist(state.robot, state.lastNear);
  $('nv-h').textContent = Math.round(h) + '°';
  $('nv-s').textContent = Math.round(s * 100) + '%';
  $('nv-v').textContent = Math.round(v * 100) + '%';
  $('nv-d').textContent = Math.round(d) + 'px';
  $('n-h').classList.toggle('active', h / 360 > .3);
  $('n-s').classList.toggle('active', s > .3);
  $('n-v').classList.toggle('active', v > .3);
  $('n-d').classList.toggle('active', d / CONFIG.DETECT_R < .7);

  out.innerHTML = '';
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:2px;';
  RULES.forEach((rule, i) => {
    const sc = Math.round((state.lastScores[i] || 0) * 100);
    const active = sc > 30;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:2px;padding:1px;';
    const dot = document.createElement('div');
    dot.className = 'neuron' + (active ? ' active' : '');
    dot.style.fontSize = '6px';
    if (active) {
      dot.style.background = rule.hex + '33';
      dot.style.borderColor = rule.hex;
      dot.style.boxShadow = `0 0 8px ${rule.hex}88`;
    }
    dot.textContent = rule.name[0];
    dot.title = `${rule.name}: ${sc}%`;
    const span = document.createElement('span');
    span.style.cssText = `font-size:7px;color:${rule.hex};font-family:'Orbitron',sans-serif;font-weight:700`;
    span.textContent = sc + '%';
    row.appendChild(dot); row.appendChild(span);
    grid.appendChild(row);
  });
  out.appendChild(grid);
  setTimeout(drawSynapsesSmall, 50);
}

// ── REDE GRANDE (Sala de Aula) ──
const NN_LAYOUT = {
  input: [
    { x: 40, y: 40, lbl: 'H' }, { x: 40, y: 88, lbl: 'S' },
    { x: 40, y: 136, lbl: 'V' }, { x: 40, y: 184, lbl: 'D' },
  ],
  hidden: [
    { x: 190, y: 25 }, { x: 190, y: 65 }, { x: 190, y: 105 },
    { x: 190, y: 145 }, { x: 190, y: 185 }, { x: 190, y: 210 },
  ],
  output: [], // gerado a partir de RULES
};
RULES.forEach((_, i) => {
  const yStep = 200 / (RULES.length - 1 || 1);
  NN_LAYOUT.output.push({ x: 340, y: 15 + i * yStep });
});

function spawnPackets() {
  if (!state.lastNear || !state.explainMode) return;
  const rr = parseInt(state.lastNear.rule.hex.slice(1, 3), 16);
  const gg = parseInt(state.lastNear.rule.hex.slice(3, 5), 16);
  const bb = parseInt(state.lastNear.rule.hex.slice(5, 7), 16);
  const { h, s, v } = rgbToHsv(rr, gg, bb);
  const inputVals = [h / 360, s, v, dist(state.robot, state.lastNear) / CONFIG.DETECT_R];
  NN_LAYOUT.input.forEach((inp, ii) => {
    if (inputVals[ii] > .15) NN_LAYOUT.hidden.forEach(hid => {
      if (Math.random() < .4) state.synapsePackets.push({ x1: inp.x, y1: inp.y, x2: hid.x, y2: hid.y, t: Math.random(), dur: 1.8 + Math.random() * 1.4, color: '#00ffa3', weight: inputVals[ii] });
    });
  });
  NN_LAYOUT.hidden.forEach(hid => {
    NN_LAYOUT.output.forEach((out, oi) => {
      if (Math.random() < .35) state.synapsePackets.push({ x1: hid.x, y1: hid.y, x2: out.x, y2: out.y, t: Math.random(), dur: 1.4 + Math.random(), color: RULES[oi].hex, weight: .5 + Math.random() * .5 });
    });
  });
}

function svgEl(name, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function updateClassroomNeural() {
  if (!state.explainMode) return;
  const svg = document.getElementById('class-neural-svg');
  if (!svg) return;
  svg.innerHTML = '';
  const has = !!state.lastNear;
  const rr = has ? parseInt(state.lastNear.rule.hex.slice(1, 3), 16) : 0;
  const gg = has ? parseInt(state.lastNear.rule.hex.slice(3, 5), 16) : 0;
  const bb = has ? parseInt(state.lastNear.rule.hex.slice(5, 7), 16) : 0;
  const hsv = has ? rgbToHsv(rr, gg, bb) : { h: 0, s: 0, v: 0 };
  const inputVals = [hsv.h / 360, hsv.s, hsv.v, has ? dist(state.robot, state.lastNear) / CONFIG.DETECT_R : 0];
  const scores = has ? state.lastScores : RULES.map(() => 0);

  // Axônios
  NN_LAYOUT.input.forEach((inp, ii) => {
    NN_LAYOUT.hidden.forEach(hid => {
      svg.appendChild(svgEl('line', { x1: inp.x, y1: inp.y, x2: hid.x, y2: hid.y, stroke: '#00ffa3', 'stroke-width': .8, opacity: .1 + inputVals[ii] * .15 }));
    });
  });
  NN_LAYOUT.hidden.forEach(hid => {
    NN_LAYOUT.output.forEach((out, oi) => {
      const sc = scores[oi] || 0;
      svg.appendChild(svgEl('line', { x1: hid.x, y1: hid.y, x2: out.x, y2: out.y, stroke: RULES[oi].hex, 'stroke-width': .7 + sc * 1.2, opacity: .08 + sc * .25 }));
    });
  });

  // Pacotes
  state.teacherPhase += 0.018;
  state.packetSpawnTimer++;
  if (state.packetSpawnTimer > 40 && has) { state.packetSpawnTimer = 0; spawnPackets(); }
  state.synapsePackets = state.synapsePackets.filter(p => {
    p.t += 1 / (p.dur * 60);
    if (p.t > 1) return false;
    const ex = p.x1 + (p.x2 - p.x1) * p.t, ey = p.y1 + (p.y2 - p.y1) * p.t;
    const alpha = Math.sin(p.t * Math.PI);
    svg.appendChild(svgEl('circle', { cx: ex, cy: ey, r: 2.5 + p.weight * 1.5, fill: p.color, opacity: alpha * .85 }));
    svg.appendChild(svgEl('circle', { cx: ex, cy: ey, r: 1.5, fill: 'white', opacity: alpha * .7 }));
    return true;
  });

  // Neurônios
  const drawNeuron = (x, y, label, active, color, valueStr, R = 12) => {
    const c = color || '#00ffa3';
    svg.appendChild(svgEl('circle', { cx: x, cy: y, r: R + 6, fill: c, opacity: active ? .18 : .04 }));
    const circle = svgEl('circle', {
      cx: x, cy: y, r: R,
      fill: active ? c + '33' : 'rgba(0,0,0,.5)',
      stroke: active ? c : 'rgba(0,255,163,.25)',
      'stroke-width': active ? 2 : 1
    });
    if (active) {
      const pulse = svgEl('animate', { attributeName: 'r', values: `${R};${R + 4};${R}`, dur: '1s', repeatCount: 'indefinite' });
      circle.appendChild(pulse);
    }
    svg.appendChild(circle);
    svg.appendChild(svgEl('text', {
      x, y: y + 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'font-family': 'Orbitron,sans-serif', 'font-size': 7, 'font-weight': 700,
      fill: active ? c : 'rgba(154,217,192,.5)',
    })).textContent = label;
    if (valueStr !== undefined) {
      svg.appendChild(svgEl('text', {
        x, y: y + R + 14, 'text-anchor': 'middle',
        'font-family': 'Share Tech Mono,monospace', 'font-size': 7,
        fill: active ? c : 'rgba(154,217,192,.45)',
      })).textContent = valueStr;
    }
  };
  const inputLabels = ['H', 'S', 'V', 'D'];
  NN_LAYOUT.input.forEach((p, i) => {
    const v = inputVals[i];
    drawNeuron(p.x, p.y, inputLabels[i], v > .15, '#5ad9ff', v.toFixed(2));
  });
  NN_LAYOUT.hidden.forEach((p, i) => {
    const act = scores.reduce((a, b) => a + b, 0) > 0;
    drawNeuron(p.x, p.y, 'h' + (i + 1), act, '#00ffa3', undefined, 9);
  });
  NN_LAYOUT.output.forEach((p, i) => {
    const sc = scores[i] || 0;
    drawNeuron(p.x, p.y, RULES[i].name.slice(0, 3), sc > .15, RULES[i].hex, Math.round(sc * 100) + '%', 11);
  });
}

// ── PAINEL CLASSROOM ──
function updateClassroomPanel() {
  if (!state.explainMode) return;
  if (els.ctd) els.ctd.textContent = 'T: ' + fmt(state.tick) + ' · 🐢 ' + Math.round(CONFIG.TEACHER_SPEED_FACTOR * 100) + '%';
  const step = CLASS_STEPS[state.currentStep];
  els.csNum.textContent = step.num;
  els.csTitle.textContent = step.title;
  els.csDesc.textContent = step.desc;
  els.csFormula.textContent = step.formula;
  els.navPrev.disabled = state.currentStep === 0;
  els.navNext.disabled = state.currentStep === CLASS_STEPS.length - 1;

  if (!state.lastNear) {
    ['h', 's', 'v', 'd'].forEach(k => {
      $('chsv-' + k).classList.remove('lit');
      $('chsv-' + k + 'v').textContent = '—';
    });
    els.cActList.innerHTML = '<div style="font-size:9px;color:var(--ink-mute)">Aguardando alvo no raio de detecção...</div>';
    els.cDecName.textContent = '🔍 EXPLORANDO';
    els.cDecRationale.textContent = `Nenhum alvo detectado.\nRaio de detecção: ${CONFIG.DETECT_R}px`;
    els.cDecBox.style.background = 'rgba(0,255,163,.04)';
    return;
  }
  const rr = parseInt(state.lastNear.rule.hex.slice(1, 3), 16);
  const gg = parseInt(state.lastNear.rule.hex.slice(3, 5), 16);
  const bb = parseInt(state.lastNear.rule.hex.slice(5, 7), 16);
  const { h, s, v } = rgbToHsv(rr, gg, bb);
  const d = Math.round(dist(state.robot, state.lastNear));
  $('chsv-hv').textContent = Math.round(h) + '°';
  $('chsv-sv').textContent = Math.round(s * 100) + '%';
  $('chsv-vv').textContent = Math.round(v * 100) + '%';
  $('chsv-dv').textContent = d + 'px';
  $('chsv-hm').textContent = h < 30 || h > 330 ? 'vermelho' : h < 75 ? 'amarelo' : h < 165 ? 'verde' : h < 195 ? 'ciano' : h < 270 ? 'azul' : 'magenta';
  $('chsv-sm').textContent = s > .7 ? 'muito vívido' : s > .4 ? 'saturado' : 'pálido';
  $('chsv-vm').textContent = v > .7 ? 'bem iluminado' : v > .4 ? 'médio' : 'escuro';
  $('chsv-dm').textContent = d < 50 ? 'muito próximo' : d < 80 ? 'próximo' : 'distante';
  ['h', 's', 'v', 'd'].forEach(k => $('chsv-' + k).classList.add('lit'));

  els.cActList.innerHTML = '';
  RULES.forEach((r, i) => {
    const sc = Math.round((state.lastScores[i] || 0) * 100);
    const row = document.createElement('div');
    row.className = 'class-act-row';
    row.innerHTML = `
      <div class="class-act-dot" style="background:${r.hex};color:${r.hex}"></div>
      <div class="class-act-name">${r.name}</div>
      <div class="class-act-bar-bg"><div class="class-act-bar" style="width:${sc}%;background:${r.hex};color:${r.hex}"></div></div>
      <div class="class-act-pct" style="color:${r.hex}">${sc}%</div>`;
    els.cActList.appendChild(row);
  });
  const r = state.lastNear.rule;
  els.cDecName.textContent = (r.flee ? '⚠ FUGIR DE ' : '✓ CAPTURAR ') + r.name;
  els.cDecRationale.textContent =
    `Cor detectada: ${r.name} (H=${Math.round(h)}°)\n` +
    `Regra: ${r.flee ? 'cor perigosa → fugir' : 'cor valiosa → perseguir'}\n` +
    `Ação: ${r.action} · ${r.pts > 0 ? '+' : ''}${r.pts} pts\n` +
    `Pesos didáticos: H=${adaptive.weights[0].toFixed(2)} S=${adaptive.weights[1].toFixed(2)} V=${adaptive.weights[2].toFixed(2)} D=${adaptive.weights[3].toFixed(2)}`;
  els.cDecBox.style.background = r.flee ? 'rgba(255,59,111,.1)' : 'rgba(0,255,163,.08)';
  els.cDecBox.style.borderColor = r.flee ? 'rgba(255,59,111,.5)' : 'rgba(0,255,163,.35)';
  els.cDecName.style.color = r.flee ? '#ff3b6f' : '#00ffa3';
}

// ── PAINEL NORMAL ──
export function updateUI() {
  els.pts.textContent = state.score;
  els.col.textContent = state.collected;
  els.fug.textContent = state.fled_c;
  els.dmg.textContent = state.dmg;
  els.learn.textContent = adaptive.learnCount;
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem(CONFIG.RECORD_KEY, String(state.best));
  }
  els.best.textContent = state.best;
  adaptive.weights.forEach((w, i) => { if (els.w[i]) els.w[i].textContent = w.toFixed(2); });

  if (state.lastNear) {
    const rr = parseInt(state.lastNear.rule.hex.slice(1, 3), 16);
    const gg = parseInt(state.lastNear.rule.hex.slice(3, 5), 16);
    const bb = parseInt(state.lastNear.rule.hex.slice(5, 7), 16);
    const { h, s, v } = rgbToHsv(rr, gg, bb);
    els.nearNone.style.display = 'none';
    els.nearInfo.hidden = false;
    els.hval.textContent = Math.round(h);
    els.sval.textContent = Math.round(s * 100);
    els.vval.textContent = Math.round(v * 100);
    els.dval.textContent = Math.round(dist(state.robot, state.lastNear));
  } else {
    els.nearNone.style.display = 'block';
    els.nearInfo.hidden = true;
  }

  els.scoresPanel.innerHTML = '';
  RULES.forEach((c, i) => {
    const pct = Math.round((state.lastScores[i] || 0) * 100);
    const g = document.createElement('div');
    g.className = 'bar-group';
    g.innerHTML = `
      <div class="bar-header">
        <span class="bar-name"><span class="bar-dot" style="background:${c.hex}"></span>${c.name}</span>
        <span class="bar-pct">${pct}%</span>
      </div>
      <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${c.hex};box-shadow:0 0 5px ${c.hex}"></div></div>`;
    els.scoresPanel.appendChild(g);
  });

  if (state.robot?.target) {
    const r = state.robot.target.rule;
    const probs = state.lastScores;
    const bi = probs.reduce((iMax, v, i, a) => v > a[iMax] ? i : iMax, 0);
    const conf = Math.round((probs[bi] || 0) * 100);
    const m = Math.round(margin(probs) * 100);
    const second = probs.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v)[1];
    els.decName.textContent = (r.flee ? '⚠ FUGIR DE ' : 'TARGET: ') + r.name;
    els.decSub.textContent = `${r.action} · ${r.pts > 0 ? '+' : ''}${r.pts} pts`;
    els.decMargin.textContent = second
      ? `2ª: ${RULES[second.i].name} ${Math.round(second.v * 100)}% · margem ${m}%`
      : '';
    els.decBox.style.background = r.flee ? 'rgba(255,59,111,.08)' : 'rgba(0,255,163,.06)';
    els.decBox.style.borderColor = r.flee ? 'rgba(255,59,111,.4)' : 'rgba(0,255,163,.3)';
    els.confPct.textContent = conf + '%';
    els.confBar.style.width = conf + '%';
    els.confBar.style.background = r.flee ? '#ff3b6f' : '#00ffa3';
  } else {
    els.decName.textContent = 'ESCANEANDO...';
    els.decSub.textContent = 'Aguardando detecção';
    els.decMargin.textContent = '';
    els.decBox.style.background = 'rgba(0,255,163,.04)';
    els.decBox.style.borderColor = 'rgba(0,255,163,.18)';
    els.confPct.textContent = '—';
    els.confBar.style.width = '0%';
  }
  updateNeuralVizSmall();
  updateHeatmap();
  drawChart();
  updateClassroomPanel();
  updateClassroomNeural();
}

// ── Toast helper ──
let toastTimer = null;
export function toast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

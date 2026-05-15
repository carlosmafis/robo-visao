// =============================================================================
// UI v7 — painel principal + sala de aula (com Math Live integrado) + telemetria
// =============================================================================
import { CONFIG, RULES, CLASS_STEPS } from './config.js';
import { ukey, getCurrentUser } from './auth.js';
import { state, adaptive, NN, telemetry, competitor } from './state.js';
import { rgbToHsv, margin } from './neural.js';
import { dist, fmt, drawChart, drawCompeteChart } from './render.js';
import { updateMathLive } from './mathLive.js';
import { updateTelemetry } from './telemetry.js';

const $ = id => document.getElementById(id);

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
  ctd: $('class-tick-display'),
  csNum: $('class-step-num'), csTitle: $('class-step-title'),
  csDesc: $('class-step-desc'), csFormula: $('class-step-formula'),
  cActList: $('class-act-list'),
  cDecBox: $('class-dec-box'), cDecName: $('class-dec-name'), cDecRationale: $('class-dec-rationale'),
  navPrev: $('nav-prev'), navNext: $('nav-next'),
  // Compete
  compScoreA: $('comp-score-a'), compScoreB: $('comp-score-b'),
  compAccA: $('comp-acc-a'), compAccB: $('comp-acc-b'),
  compHitsA: $('comp-hits-a'), compHitsB: $('comp-hits-b'),
  // Pilot HUD
  phUser: $('ph-user'), phPts: $('ph-pts'), phBest: $('ph-best'),
};

export function addLog(msg, color) {
  const log = els.log; if (!log) return;
  const div = document.createElement('div');
  div.className = 'log-entry';
  const t = document.createElement('span'); t.className = 'log-time'; t.textContent = fmt(state.tick);
  const m = document.createElement('span'); m.className = 'log-msg'; m.textContent = msg;
  m.style.color = color || 'var(--neon)';
  div.appendChild(t); div.appendChild(m);
  log.insertBefore(div, log.firstChild);
  while (log.children.length > CONFIG.MAX_LOG_ENTRIES) log.removeChild(log.lastChild);
}

// ── Heatmap ──
function colorForWeight(w) {
  const t = Math.max(-1, Math.min(1, w));
  if (t >= 0) return `rgba(0,255,163,${.15 + t * .85})`;
  return `rgba(255,59,111,${.15 + (-t) * .85})`;
}
let heatmapBuilt = false;
function ensureHeatmap() {
  if (heatmapBuilt || !els.heatmap) return;
  els.heatmap.innerHTML = '';
  els.heatmap.appendChild(makeCell('hm-row-lbl', '·'));
  ['H', 'S', 'V', 'D'].forEach(l => els.heatmap.appendChild(makeCell('hm-row-lbl', l)));
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
  if (!els.heatmap) return;
  ensureHeatmap();
  RULES.forEach((_, i) => {
    for (let j = 0; j < 4; j++) {
      const cell = $(`hm-${i}-${j}`);
      if (!cell) continue;
      const w = NN.W[i][j];
      cell.style.background = colorForWeight(w);
      cell.textContent = w.toFixed(1);
    }
  });
}

// ── Painel classroom (decisão + ativações) ──
function updateClassroomPanel() {
  if (state.mode !== 'class') return;
  if (els.ctd) els.ctd.textContent = 'T: ' + fmt(state.tick) + ' · 🐢 ' + Math.round(CONFIG.TEACHER_SPEED_FACTOR * 100) + '%';
  const step = CLASS_STEPS[state.currentStep];
  if (els.csNum) {
    els.csNum.textContent = step.num;
    els.csTitle.textContent = step.title;
    els.csDesc.textContent = step.desc;
    els.csFormula.textContent = step.formula;
    els.navPrev.disabled = state.currentStep === 0;
    els.navNext.disabled = state.currentStep === CLASS_STEPS.length - 1;
  }

  if (!state.lastNear) {
    ['h', 's', 'v', 'd'].forEach(k => {
      const el = $('chsv-' + k); if (el) el.classList.remove('lit');
      const v = $('chsv-' + k + 'v'); if (v) v.textContent = '—';
    });
    if (els.cActList) els.cActList.innerHTML = '<div style="font-size:9px;color:var(--ink-mute)">Aguardando alvo no raio de detecção...</div>';
    if (els.cDecName) {
      els.cDecName.textContent = '🔍 EXPLORANDO';
      els.cDecRationale.textContent = `Nenhum alvo detectado.\nRaio de detecção: ${CONFIG.DETECT_R}px`;
      els.cDecBox.style.background = 'rgba(0,255,163,.04)';
    }
    return;
  }
  const rr = parseInt(state.lastNear.rule.hex.slice(1, 3), 16);
  const gg = parseInt(state.lastNear.rule.hex.slice(3, 5), 16);
  const bb = parseInt(state.lastNear.rule.hex.slice(5, 7), 16);
  const { h, s, v } = rgbToHsv(rr, gg, bb);
  const d = Math.round(dist(state.robot, state.lastNear));
  const set = (id, t) => { const el = $(id); if (el) el.textContent = t; };
  set('chsv-hv', Math.round(h) + '°');
  set('chsv-sv', Math.round(s * 100) + '%');
  set('chsv-vv', Math.round(v * 100) + '%');
  set('chsv-dv', d + 'px');
  ['h', 's', 'v', 'd'].forEach(k => { const el = $('chsv-' + k); if (el) el.classList.add('lit'); });

  if (els.cActList) {
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
  }
  const r = state.lastNear.rule;
  if (els.cDecName) {
    els.cDecName.textContent = (r.flee ? '⚠ FUGIR DE ' : '✓ CAPTURAR ') + r.name;
    els.cDecRationale.textContent =
      `Cor detectada: ${r.name} (H=${Math.round(h)}°)\n` +
      `Regra: ${r.flee ? 'cor perigosa → fugir' : 'cor valiosa → perseguir'}\n` +
      `Ação: ${r.action} · ${r.pts > 0 ? '+' : ''}${r.pts} pts`;
    els.cDecBox.style.background = r.flee ? 'rgba(255,59,111,.1)' : 'rgba(0,255,163,.08)';
    els.cDecBox.style.borderColor = r.flee ? 'rgba(255,59,111,.5)' : 'rgba(0,255,163,.35)';
    els.cDecName.style.color = r.flee ? '#ff3b6f' : '#00ffa3';
  }
}

function updateCompetePanel() {
  if (state.mode !== 'compete') return;
  if (els.compScoreA) els.compScoreA.textContent = state.score;
  if (els.compScoreB) els.compScoreB.textContent = competitor.score;
  const accA = telemetry.total > 0 ? Math.round(telemetry.hits / telemetry.total * 100) : 0;
  const accB = competitor.total > 0 ? Math.round(competitor.hits / competitor.total * 100) : 0;
  if (els.compAccA) els.compAccA.textContent = accA + '%';
  if (els.compAccB) els.compAccB.textContent = accB + '%';
  if (els.compHitsA) els.compHitsA.textContent = `${telemetry.hits}/${telemetry.total}`;
  if (els.compHitsB) els.compHitsB.textContent = `${competitor.hits}/${competitor.total}`;
  drawCompeteChart();
}

export function updateUI() {
  if (!els.pts) return;
  els.pts.textContent = state.score;
  els.col.textContent = state.collected;
  els.fug.textContent = state.fled_c;
  els.dmg.textContent = state.dmg;
  els.learn.textContent = adaptive.learnCount;
  if (state.mode === 'pilot') {
    // Recorde exclusivo do modo Pilotar (por apelido)
    if (state.score > state.pilotBest) {
      state.pilotBest = state.score;
      localStorage.setItem(ukey(CONFIG.PILOT_RECORD_KEY), String(state.pilotBest));
    }
    els.best.textContent = state.pilotBest;
    if (els.phUser) els.phUser.textContent = getCurrentUser() || '—';
    if (els.phPts) els.phPts.textContent = state.score;
    if (els.phBest) els.phBest.textContent = state.pilotBest;
  } else {
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(ukey(CONFIG.RECORD_KEY), String(state.best));
    }
    els.best.textContent = state.best;
  }
  adaptive.weights.forEach((w, i) => { if (els.w[i]) els.w[i].textContent = w.toFixed(2); });

  if (state.lastNear && els.nearInfo) {
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
  } else if (els.nearNone) {
    els.nearNone.style.display = 'block';
    if (els.nearInfo) els.nearInfo.hidden = true;
  }

  if (els.scoresPanel) {
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
  }

  if (state.robot?.target && els.decName) {
    const r = state.robot.target.rule;
    const probs = state.lastScores;
    const bi = probs.reduce((iMax, v, i, a) => v > a[iMax] ? i : iMax, 0);
    const conf = Math.round((probs[bi] || 0) * 100);
    const m = Math.round(margin(probs) * 100);
    const second = probs.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v)[1];
    els.decName.textContent = (r.flee ? '⚠ FUGIR DE ' : 'TARGET: ') + r.name;
    els.decSub.textContent = `${r.action} · ${r.pts > 0 ? '+' : ''}${r.pts} pts`;
    els.decMargin.textContent = second
      ? `2ª: ${RULES[second.i].name} ${Math.round(second.v * 100)}% · margem ${m}%` : '';
    els.decBox.style.background = r.flee ? 'rgba(255,59,111,.08)' : 'rgba(0,255,163,.06)';
    els.decBox.style.borderColor = r.flee ? 'rgba(255,59,111,.4)' : 'rgba(0,255,163,.3)';
    els.confPct.textContent = conf + '%';
    els.confBar.style.width = conf + '%';
    els.confBar.style.background = r.flee ? '#ff3b6f' : '#00ffa3';
  } else if (els.decName) {
    els.decName.textContent = 'ESCANEANDO...';
    els.decSub.textContent = 'Aguardando detecção';
    els.decMargin.textContent = '';
    els.decBox.style.background = 'rgba(0,255,163,.04)';
    els.decBox.style.borderColor = 'rgba(0,255,163,.18)';
    els.confPct.textContent = '—';
    els.confBar.style.width = '0%';
  }
  updateHeatmap();
  drawChart();
  updateTelemetry();
  if (state.mode === 'class') {
    updateClassroomPanel();
    updateMathLive();
  }
  if (state.mode === 'compete') updateCompetePanel();
}

let toastTimer = null;
export function toast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// =============================================================================
// COMPETITION — 2 robôs treinando em paralelo (A vs B)
// Compartilham o mesmo arena/objects, mas têm posições e pesos independentes.
// =============================================================================
import { CONFIG, RULES } from './config.js';
import { state, NN, NN_B, competitor, recordCompetitorOutcome, resetCompetitor } from './state.js';
import { rgbToHsv, buildInput } from './neural.js';
import { burst, addFloat } from './render.js';
import { playBeep } from './audio.js';

const { ROBOT_R, OBJ_R, DETECT_R } = CONFIG;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rand = (a, b) => Math.random() * (b - a) + a;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Forward específico para a rede B (LR mais agressivo)
function forwardB(x) {
  const z = NN_B.W.map((row, i) => row.reduce((a, w, j) => a + w * x[j], 0) + NN_B.b[i]);
  const max = Math.max(...z);
  const exps = z.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  const probs = exps.map(e => e / sum);
  NN_B.lastProbs = probs;
  return probs;
}

function trueClass(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const { h } = rgbToHsv(r, g, b);
  for (let i = 0; i < RULES.length; i++) {
    if (RULES[i].hueRanges.some(([a, b]) => h >= a && h <= b)) return i;
  }
  return 0;
}

function learnB(classIdx, reward, x) {
  const η = CONFIG.COMPETITOR_LR;
  const [lo, hi] = CONFIG.WEIGHT_CLAMP;
  for (let j = 0; j < 4; j++) {
    NN_B.W[classIdx][j] = clamp(NN_B.W[classIdx][j] + η * reward * x[j], lo, hi);
  }
  NN_B.b[classIdx] = clamp(NN_B.b[classIdx] + η * reward * 0.5, lo, hi);
}

export function spawnCompetitor() {
  resetCompetitor();
  competitor.enabled = true;
  competitor.robot = {
    x: state.W * 0.7, y: state.H * 0.5,
    vx: 0, vy: 0, angle: 0, target: null, state: 'idle', bt: 0,
  };
}

export function despawnCompetitor() {
  competitor.enabled = false;
  competitor.robot = null;
}

export function stepCompetitor() {
  if (!competitor.enabled || !competitor.robot) return;
  const r = competitor.robot;

  // Visão B
  let nearest = null, nd = Infinity;
  for (const o of state.objects) {
    const d = dist(r, o);
    if (d < DETECT_R && d < nd) { nearest = o; nd = d; }
  }
  if (nearest) {
    const x = buildInput(nearest.rule.hex, nd);
    forwardB(x);
    r.target = nearest;
    r.state = nearest.rule.flee ? 'flee' : 'chase';
  } else {
    r.target = null; r.state = 'idle';
  }

  const MV = 3.6, AC = 0.32, FR = 0.9;
  if (r.state === 'idle') { r.vx += rand(-.2, .2); r.vy += rand(-.2, .2); }
  else if (r.state === 'chase' && r.target) {
    const dx = r.target.x - r.x, dy = r.target.y - r.y, d = Math.hypot(dx, dy) || 1;
    r.vx += dx / d * AC; r.vy += dy / d * AC; r.angle = Math.atan2(dy, dx);
  } else if (r.state === 'flee' && r.target) {
    const dx = r.x - r.target.x, dy = r.y - r.target.y, d = Math.hypot(dx, dy) || 1;
    r.vx += dx / d * AC; r.vy += dy / d * AC;
  }
  r.vx *= FR; r.vy *= FR;
  const spd = Math.hypot(r.vx, r.vy);
  if (spd > MV) { r.vx = r.vx / spd * MV; r.vy = r.vy / spd * MV; }
  r.x = clamp(r.x + r.vx, ROBOT_R, state.W - ROBOT_R);
  r.y = clamp(r.y + r.vy, ROBOT_R, state.H - ROBOT_R);
  r.bt++;
}

// Chamado pela sim quando B colide com objeto (gerenciado internamente aqui)
export function checkCompetitorCollisions() {
  if (!competitor.enabled || !competitor.robot) return;
  const r = competitor.robot;
  for (let i = state.objects.length - 1; i >= 0; i--) {
    const o = state.objects[i];
    if (dist(r, o) < ROBOT_R + OBJ_R - 5) {
      competitor.score += o.rule.pts;
      const x = buildInput(o.rule.hex, 0);
      const probs = forwardB(x);
      const predicted = probs.reduce((iMax, v, idx, arr) => v > arr[iMax] ? idx : iMax, 0);
      const truth = trueClass(o.rule.hex);
      const correct = predicted === truth;
      learnB(truth, correct ? +1 : -1, x);
      recordCompetitorOutcome(correct);

      // ── Efeitos premium do Robô B (laranja distintivo) ──
      const isFlee = o.rule.flee;
      // Glitch leve no arena (B usa tom dourado/laranja para diferenciar de A)
      state.glitchEffect = Math.max(state.glitchEffect, 0.32);
      state.glitchColor = isFlee ? '255,80,40' : '255,170,58';
      // Partículas
      burst(o.x, o.y, isFlee ? 'rgba(255,90,40,' : 'rgba(255,170,58,', 18);
      // Floating points (em laranja para identificar o agente)
      addFloat(o.x, o.y - 22, (o.rule.pts > 0 ? '+' : '') + o.rule.pts + ' [B]', isFlee ? '#ff6428' : '#ffaa3a');
      // Beep mais grave / alternativo
      playBeep(isFlee ? 130 : 540, 'triangle', 110);

      // remove objeto (ele foi consumido por B)
      state.objects.splice(i, 1);
    }
  }
}

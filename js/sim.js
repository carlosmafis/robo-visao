// =============================================================================
// SIM v7 — lógica + integração com telemetria e competição
// =============================================================================
import { CONFIG, RULES } from './config.js';
import { state, adaptive, NN, recordOutcome, competitor } from './state.js';
import { burst, addFloat, resizeCanvas, canvas } from './render.js';
import { playBeep } from './audio.js';
import { buildInput, forward, learn, argmax, trueClass } from './neural.js';
import { stepCompetitor, checkCompetitorCollisions } from './competition.js';

const { ROBOT_R, OBJ_R, DETECT_R } = CONFIG;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rand = (a, b) => Math.random() * (b - a) + a;

let logCallback = null;
export function setLogCallback(cb) { logCallback = cb; }

export function spawnObject() {
  const rule = RULES[Math.floor(Math.random() * RULES.length)];
  let x, y, tries = 0;
  do {
    x = rand(OBJ_R + 16, state.W - OBJ_R - 16);
    y = rand(OBJ_R + 16, state.H - OBJ_R - 16);
    tries++;
  } while (state.robot && dist({ x, y }, state.robot) < 140 && tries < 20);
  return {
    x, y,
    vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5),
    rule, pt: 0,
    born: Date.now(), ttl: rand(6000, 10000),
    pulse: Math.random() * Math.PI * 2,
  };
}

export function reset() {
  resizeCanvas();
  state.robot = { x: state.W / 2, y: state.H / 2, vx: 0, vy: 0, angle: 0, target: null, state: 'idle', bt: 0 };
  state.objects = [];
  state.score = 0; state.collected = 0; state.fled_c = 0; state.dmg = 0; state.tick = 0;
  state.lastNear = null; state.lastScores = []; state.scoreHistory = [];
  adaptive.weights = [1, 1, 1, 1];
  adaptive.learnCount = 0;
  state.radarAngle = 0; state.radarPulses = []; state.robotBobble = 0;
  state.paused = false;
  for (let i = 0; i < CONFIG.N_OBJECTS; i++) state.objects.push(spawnObject());
  const log = document.getElementById('log');
  if (log) log.innerHTML = '';
}

export function vision() {
  let nearest = null, nd = Infinity;
  for (const o of state.objects) {
    const d = dist(state.robot, o);
    if (d < DETECT_R && d < nd) { nearest = o; nd = d; }
  }
  state.lastNear = nearest;
  if (nearest) {
    const d = dist(state.robot, nearest);
    const x = buildInput(nearest.rule.hex, d);
    const probs = forward(x);
    state.lastScores = probs;
    state.robot.target = nearest;

    // O robô usa a PREDIÇÃO DA REDE para decidir a ação.
    // Durante os primeiros ticks a rede ainda é aleatória, então para garantir
    // que o robô não fique preso fugindo de tudo enquanto aprende, usamos uma
    // regra de confiança: só confia na rede se a margem (diferença entre 1ª e 2ª
    // classe) for suficiente. Caso contrário, usa a regra real como fallback.
    const best = argmax(probs);
    const sorted = probs.slice().sort((a, b) => b - a);
    const confidence = sorted[0] - sorted[1]; // margem de confiança

    const CONFIDENCE_THRESHOLD = 0.15; // rede precisa ter pelo menos 15% de margem
    if (confidence >= CONFIDENCE_THRESHOLD) {
      // Rede confiante: usa a predição para decidir flee/chase
      state.robot.state = RULES[best].flee ? 'flee' : 'chase';
    } else {
      // Rede incerta: usa a regra verdadeira como professor (modo exploração)
      state.robot.state = nearest.rule.flee ? 'flee' : 'chase';
    }
  } else {
    state.lastScores = [];
    state.robot.state = 'idle';
    state.robot.target = null;
  }
}

export function moveRobot() {
  const slowMode = state.mode === 'class';
  const MV = slowMode ? 2.2 : 3.8, AC = slowMode ? 0.22 : 0.35, FR = 0.90;
  const r = state.robot;
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
  r.x = Math.max(ROBOT_R, Math.min(state.W - ROBOT_R, r.x + r.vx));
  r.y = Math.max(ROBOT_R, Math.min(state.H - ROBOT_R, r.y + r.vy));
  r.bt++; state.tick++;
  state.robotBobble += state.mode === 'class' ? .03 : .06;

  // Integra competidor
  stepCompetitor();
}

export function moveObjects() {
  const slow = state.mode === 'class' ? .65 : .5;
  for (const o of state.objects) {
    o.x += o.vx * slow; o.y += o.vy * slow;
    if (o.x < OBJ_R || o.x > state.W - OBJ_R) o.vx *= -1;
    if (o.y < OBJ_R || o.y > state.H - OBJ_R) o.vy *= -1;
    o.pt++; o.pulse += .06;
  }
}

export function collide() {
  const now = Date.now();
  state.objects = state.objects.filter(o => {
    const d = dist(state.robot, o), exp = (now - o.born) > o.ttl;
    if (d < ROBOT_R + OBJ_R - 5) {
      state.score += o.rule.pts;
      const x = buildInput(o.rule.hex, 0);
      const probs = forward(x);
      const predicted = argmax(probs);
      const truth = trueClass(o.rule.hex);
      const correct = predicted === truth;

      // Aprendizado corrigido:
      // - Sempre reforça a classe verdadeira (+)
      // - Se errou, penaliza a classe predita incorretamente (-)
      learn(predicted, truth, x);
      recordOutcome(truth, correct);

      state.glitchEffect = .4;
      state.glitchColor = o.rule.flee ? '255,59,111' : '0,255,163';
      canvas.classList.add('hit');
      setTimeout(() => canvas.classList.remove('hit'), 90);
      playBeep(o.rule.flee ? 160 : 700, 'sine', 100);
      burst(o.x, o.y, o.rule.flee ? 'rgba(255,59,111,' : 'rgba(0,255,163,');
      addFloat(o.x, o.y - 22, (o.rule.pts > 0 ? '+' : '') + o.rule.pts, o.rule.flee ? '#ff3b6f' : '#00ffa3');
      state.scoreHistory.push(state.score);
      if (state.scoreHistory.length > CONFIG.MAX_HISTORY) state.scoreHistory.shift();
      if (o.rule.pts < 0) {
        state.dmg++;
        logCallback?.(`[DANO] ${o.rule.name} ${o.rule.pts} pts · pred:${RULES[predicted].name}`, '#ff3b6f');
      } else {
        state.collected++;
        logCallback?.(`[CAPTURA] ${o.rule.name} +${o.rule.pts} pts · pred:${RULES[predicted].name} ${correct ? '✓' : '✗'}`, '#00ffa3');
      }
      if (state.mode === 'class') state.currentStep = 4;
      return false;
    }
    if (exp) {
      state.fled_c++;
      logCallback?.(`[EXPIROU] ${o.rule.name}`, 'rgba(154,217,192,.4)');
      return false;
    }
    return true;
  });
  // Competidor consome objetos também
  checkCompetitorCollisions();
  while (state.objects.length < CONFIG.N_OBJECTS) state.objects.push(spawnObject());
}

export { dist };

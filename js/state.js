// =============================================================================
// STATE v7 — estado global + telemetria + competidor
// =============================================================================
import { CONFIG, RULES } from './config.js';

const seedW = () => RULES.map(() => Array(4).fill(0).map(() => (Math.random() - 0.5) * 0.3));
const seedB = () => RULES.map(() => 0);

function biasedSeed(W, b) {
  RULES.forEach((rule, i) => {
    const ranges = rule.hueRanges;
    const center = ranges[0][0] === 0 && ranges.length > 1
      ? 5
      : (ranges[0][0] + ranges[0][1]) / 2;
    const huePref = center / 360;
    W[i][0] = 0.6 - Math.abs(huePref - 0.5) * 0.4 + (Math.random() - 0.5) * 0.1;
    W[i][1] = 0.4 + (Math.random() - 0.5) * 0.2;
    W[i][2] = 0.3 + (Math.random() - 0.5) * 0.2;
    W[i][3] = 0.2 + (Math.random() - 0.5) * 0.2;
    b[i] = -0.3 - Math.abs(huePref - 0.5) * 0.5;
  });
}

export const adaptive = { weights: [1, 1, 1, 1], learnCount: 0 };

export const NN = {
  W: seedW(), b: seedB(),
  lastInput: [0, 0, 0, 0],
  lastLogits: RULES.map(() => 0),
  lastProbs: RULES.map(() => 0),
};
biasedSeed(NN.W, NN.b);

// Telemetria de aprendizado
export const telemetry = {
  hits: 0,
  total: 0,
  accuracyHistory: [],          // [{t, acc}]
  perClass: RULES.map(() => ({ hits: 0, total: 0 })),
  windowSize: 20,
  recent: [],                   // últimos N acertos (1) ou erros (0)
};

export function resetTelemetry() {
  telemetry.hits = 0;
  telemetry.total = 0;
  telemetry.accuracyHistory.length = 0;
  telemetry.perClass = RULES.map(() => ({ hits: 0, total: 0 }));
  telemetry.recent.length = 0;
}

export function recordOutcome(classIdx, correct) {
  telemetry.total++;
  telemetry.perClass[classIdx].total++;
  if (correct) {
    telemetry.hits++;
    telemetry.perClass[classIdx].hits++;
  }
  telemetry.recent.push(correct ? 1 : 0);
  if (telemetry.recent.length > telemetry.windowSize) telemetry.recent.shift();
  const winAcc = telemetry.recent.reduce((a, b) => a + b, 0) / telemetry.recent.length;
  telemetry.accuracyHistory.push(winAcc);
  if (telemetry.accuracyHistory.length > CONFIG.TELEMETRY_MAX) telemetry.accuracyHistory.shift();
}

// ── Competidor (robô B com pesos próprios) ──
export const NN_B = {
  W: seedW(), b: seedB(),
  lastProbs: RULES.map(() => 0),
};
biasedSeed(NN_B.W, NN_B.b);

export const competitor = {
  enabled: false,
  // Robô B vive no mesmo arena, posição independente
  robot: null,
  score: 0, hits: 0, total: 0,
  accuracyHistory: [],
  recent: [],
};

export function resetCompetitor() {
  competitor.score = 0;
  competitor.hits = 0;
  competitor.total = 0;
  competitor.accuracyHistory.length = 0;
  competitor.recent.length = 0;
  // Reseed
  NN_B.W = seedW(); NN_B.b = seedB(); biasedSeed(NN_B.W, NN_B.b);
}

// Reset COMPLETO da competição: zera tanto A quanto B (placar, telemetria, pesos)
// para que o duelo comece em pé de igualdade.
export function resetCompetitionAll() {
  // Robô A: zera score visível e telemetria de aprendizado
  state.score = 0;
  state.collected = 0;
  state.fled_c = 0;
  state.dmg = 0;
  state.scoreHistory.length = 0;
  resetTelemetry();
  // Reseed pesos do A para que ambos comecem do mesmo ponto-base aleatório
  NN.W = seedW(); NN.b = seedB(); biasedSeed(NN.W, NN.b);
  adaptive.weights = [1, 1, 1, 1];
  adaptive.learnCount = 0;
  // Robô B
  resetCompetitor();
}

export function recordCompetitorOutcome(correct) {
  competitor.total++;
  if (correct) competitor.hits++;
  competitor.recent.push(correct ? 1 : 0);
  if (competitor.recent.length > 20) competitor.recent.shift();
  const acc = competitor.recent.reduce((a, b) => a + b, 0) / competitor.recent.length;
  competitor.accuracyHistory.push(acc);
  if (competitor.accuracyHistory.length > CONFIG.TELEMETRY_MAX) competitor.accuracyHistory.shift();
}

export const state = {
  W: 0, H: 0,
  robot: null,
  objects: [],
  score: 0, collected: 0, fled_c: 0, dmg: 0, tick: 0,
  lastNear: null,
  lastScores: [],
  scoreHistory: [],
  glitchEffect: 0, glitchColor: '255,59,111',
  radarAngle: 0, radarPulses: [],
  robotBobble: 0,
  particles: [], floatLabels: [],
  speedIdx: 0,
  paused: false,
  mode: 'train',                 // train | class | compete | vision
  currentStep: 0,
  synapsePackets: [],
  teacherPhase: 0,
  packetSpawnTimer: 0,
  best: parseInt(localStorage.getItem(CONFIG.RECORD_KEY) || '0', 10),
};

// Helpers para snapshot/restore de pesos (export para webcam)
export function snapshotWeights() {
  return {
    W: NN.W.map(r => r.slice()),
    b: NN.b.slice(),
    learnCount: adaptive.learnCount,
    timestamp: Date.now(),
    version: CONFIG.VERSION,
  };
}

export function saveWeightsToLocalStorage() {
  try {
    localStorage.setItem(CONFIG.WEIGHTS_KEY, JSON.stringify(snapshotWeights()));
    return true;
  } catch { return false; }
}

export function loadWeightsFromLocalStorage() {
  try {
    const raw = localStorage.getItem(CONFIG.WEIGHTS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

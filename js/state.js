// =============================================================================
// STATE v7 — estado global + telemetria + competidor
// =============================================================================
import { CONFIG, RULES } from './config.js';
import { ukey } from './auth.js';

const seedW = () => RULES.map(() => Array(4).fill(0).map(() => (Math.random() - 0.5) * 0.3));
const seedB = () => RULES.map(() => 0);

function biasedSeed(W, b) {
  RULES.forEach((rule, i) => {
    // Inicialização neutra: pequenos valores aleatórios sem favorecimento por posição de hue.
    // O peso H (W[i][0]) recebia antes um viés que favorecia Ciano (hue=180°, centro do espectro),
    // fazendo-o dominar o softmax desde o início. Agora todos partem do mesmo patamar.
    W[i][0] = 0.25 + (Math.random() - 0.5) * 0.2;  // H — viés neutro uniforme
    W[i][1] = 0.20 + (Math.random() - 0.5) * 0.2;  // S
    W[i][2] = 0.15 + (Math.random() - 0.5) * 0.2;  // V
    W[i][3] = 0.10 + (Math.random() - 0.5) * 0.2;  // proximidade
    b[i]    = -0.1 + (Math.random() - 0.5) * 0.1;  // bias leve negativo uniforme
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
  NN_B.W = seedW(); NN_B.b = seedB(); biasedSeed(NN_B.W, NN_B.b);
}

export function resetCompetitionAll() {
  state.score = 0;
  state.collected = 0;
  state.fled_c = 0;
  state.dmg = 0;
  state.scoreHistory.length = 0;
  resetTelemetry();
  NN.W = seedW(); NN.b = seedB(); biasedSeed(NN.W, NN.b);
  adaptive.weights = [1, 1, 1, 1];
  adaptive.learnCount = 0;
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
  mode: 'train',
  currentStep: 0,
  synapsePackets: [],
  teacherPhase: 0,
  packetSpawnTimer: 0,
  best: parseInt(localStorage.getItem(ukey(CONFIG.RECORD_KEY)) || '0', 10),
};

// Recarrega o recorde do usuário atual após login
export function refreshUserState() {
  state.best = parseInt(localStorage.getItem(ukey(CONFIG.RECORD_KEY)) || '0', 10);
}

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
    localStorage.setItem(ukey(CONFIG.WEIGHTS_KEY), JSON.stringify(snapshotWeights()));
    return true;
  } catch { return false; }
}

export function loadWeightsFromLocalStorage() {
  try {
    const raw = localStorage.getItem(ukey(CONFIG.WEIGHTS_KEY));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

// ── Progresso completo (pesos + placar + recorde) ──
const PROGRESS_KEY = 'cn7_progress';

export function saveProgress() {
  try {
    const payload = {
      weights: snapshotWeights(),
      best: state.best,
      score: state.score,
      collected: state.collected,
      fled_c: state.fled_c,
      dmg: state.dmg,
      timestamp: Date.now(),
    };
    localStorage.setItem(ukey(PROGRESS_KEY), JSON.stringify(payload));
    localStorage.setItem(ukey(CONFIG.RECORD_KEY), String(state.best));
    return true;
  } catch { return false; }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(ukey(PROGRESS_KEY));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.weights?.W && data.weights?.b) {
      NN.W = data.weights.W.map(r => r.slice());
      NN.b = data.weights.b.slice();
      adaptive.learnCount = data.weights.learnCount || 0;
    }
    if (typeof data.best === 'number') state.best = data.best;
    if (typeof data.score === 'number') state.score = data.score;
    if (typeof data.collected === 'number') state.collected = data.collected;
    if (typeof data.fled_c === 'number') state.fled_c = data.fled_c;
    if (typeof data.dmg === 'number') state.dmg = data.dmg;
    return data;
  } catch { return null; }
}

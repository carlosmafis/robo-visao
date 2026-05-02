// =============================================================================
// STATE — estado global compartilhado
// =============================================================================
import { CONFIG, RULES } from './config.js';

// Pesos adaptativos exibidos no painel (atalho didático: H, S, V, D)
export const adaptive = {
  weights: [1, 1, 1, 1],
  learnCount: 0,
};

// ── Rede neural real ──
// Matriz W [n_classes × 4]  +  vetor de bias [n_classes]
// Inicializada perto de zero (treina-se em runtime)
export const NN = {
  W: RULES.map(() => Array(4).fill(0).map(() => (Math.random() - 0.5) * 0.3)),
  b: RULES.map(() => 0),
  lastInput: [0, 0, 0, 0],
  lastLogits: RULES.map(() => 0),
  lastProbs: RULES.map(() => 0),
};

// Inicializa pesos com viés didático: cada classe "gosta" do seu matiz central
(function seedWeights() {
  RULES.forEach((rule, i) => {
    const ranges = rule.hueRanges;
    const center = ranges[0][0] === 0 && ranges.length > 1
      ? 5 // vermelho ~ 0°
      : (ranges[0][0] + ranges[0][1]) / 2;
    const huePref = center / 360;
    // peso de matiz proporcional à distância do alvo
    NN.W[i][0] = 0.6 - Math.abs(huePref - 0.5) * 0.4 + (Math.random() - 0.5) * 0.1;
    NN.W[i][1] = 0.4 + (Math.random() - 0.5) * 0.2;  // saturação ajuda
    NN.W[i][2] = 0.3 + (Math.random() - 0.5) * 0.2;  // brilho
    NN.W[i][3] = 0.2 + (Math.random() - 0.5) * 0.2;  // proximidade
    NN.b[i] = -0.3 - Math.abs(huePref - 0.5) * 0.5;  // bias inicial baseado em distância de cor
  });
})();

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
  explainMode: false,
  currentStep: 0,
  synapsePackets: [],
  teacherPhase: 0,
  packetSpawnTimer: 0,
  best: parseInt(localStorage.getItem(CONFIG.RECORD_KEY) || '0', 10),
};

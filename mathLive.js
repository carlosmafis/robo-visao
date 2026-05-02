// =============================================================================
// CONFIG v7 — Premium Edition
// =============================================================================
export const CONFIG = {
  VERSION: 'v7.0',
  ROBOT_R: 18,
  OBJ_R: 12,
  DETECT_R: 110,
  N_OBJECTS: 8,
  SPEEDS: [1, 2, 4],
  SPEED_LABELS: ['Normal', 'Rápido', 'Turbo'],
  TEACHER_SPEED_FACTOR: 0.4,
  MAX_LOG_ENTRIES: 60,
  MAX_HISTORY: 80,
  STEP_TIME_S: 5,
  LEARNING_RATE: 0.05,
  WEIGHT_CLAMP: [-1.5, 1.5],
  ADAPT_CLAMP: [0.5, 1.5],
  RECORD_KEY: 'cn7_highscore',
  WEIGHTS_KEY: 'cn7_weights',          // pesos exportáveis para webcam
  TELEMETRY_MAX: 60,                    // pontos do gráfico de acurácia
  COMPETITOR_LR: 0.12,                  // robô B aprende mais agressivo
};

// ── Regras de cor ──
export const RULES = [
  { name: 'VERMELHO', hex: '#ff2255', action: 'CAPTURAR',  pts: +10, flee: false, hueRanges: [[0, 15], [345, 360]], minS: .30, minV: .20 },
  { name: 'LARANJA',  hex: '#ff8a1a', action: 'APROXIMAR', pts: +6,  flee: false, hueRanges: [[15, 40]],            minS: .35, minV: .25 },
  { name: 'AMARELO',  hex: '#ffdd00', action: 'ALERTAR',   pts: -8,  flee: true,  hueRanges: [[40, 75]],            minS: .35, minV: .30 },
  { name: 'VERDE',    hex: '#00ff88', action: 'APROXIMAR', pts: +8,  flee: false, hueRanges: [[75, 165]],           minS: .25, minV: .20 },
  { name: 'CIANO',    hex: '#00eeff', action: 'DESVIAR',   pts: -3,  flee: true,  hueRanges: [[165, 195]],          minS: .30, minV: .30 },
  { name: 'AZUL',     hex: '#0099ff', action: 'RECUAR',    pts: -5,  flee: true,  hueRanges: [[195, 270]],          minS: .25, minV: .15 },
  { name: 'MAGENTA',  hex: '#ff22ff', action: 'CAPTURAR',  pts: +15, flee: false, hueRanges: [[270, 345]],          minS: .30, minV: .20 },
];

export const CLASS_STEPS = [
  {
    num: 'PASSO 1 / 5', title: '🔍 Percepção — O Robô Detecta',
    desc: 'O sensor radar varre 360° continuamente.\nQuando um objeto entra no raio de detecção\n(≤ 110px), o sistema captura sua cor.',
    formula: 'Raio de detecção = 110 px\nMétodo = Distância Euclidiana\nd = √( (Δx)² + (Δy)² )'
  },
  {
    num: 'PASSO 2 / 5', title: '🎨 Conversão RGB → HSV',
    desc: 'A cor capturada (RGB) é convertida para\no espaço HSV — mais próximo da percepção\nhumana e ideal para classificação neural.',
    formula: 'H = Matiz (0–360°) → IDENTIFICA a cor\nS = Saturação (0–1) → intensidade\nV = Brilho (0–1) → luminosidade'
  },
  {
    num: 'PASSO 3 / 5', title: '⚡ Sinapses — Propagação Neural',
    desc: 'As 4 entradas (H, S, V, Distância) são\nmultiplicadas por uma matriz de pesos W (7×4).\nCada saída é a soma ponderada.',
    formula: 'z_i = Σ_j ( W[i][j] · x[j] ) + b[i]\nOnde i = classe (cor), j = entrada\nx = [H/360, S, V, 1 − D/Rdet]'
  },
  {
    num: 'PASSO 4 / 5', title: '🏆 Softmax — Probabilidade por Classe',
    desc: 'Aplicamos softmax: cada saída vira\numa probabilidade entre 0 e 1.\nA classe vencedora é argmax.',
    formula: 'p_i = exp(z_i) / Σ_k exp(z_k)\nDecisão = argmax(p)\nMargem = p₁ − p₂'
  },
  {
    num: 'PASSO 5 / 5', title: '🧬 Aprendizado Hebbian',
    desc: 'Após cada colisão, atualizamos os pesos\nda classe vencedora na direção das entradas.\nReforço positivo se acertou, negativo se errou.',
    formula: 'ΔW[c][j] = η · r · x[j]\nW[c][j] = clamp( W[c][j] + ΔW, −1.5, +1.5 )\nη = 0.05  ·  r ∈ {−1, +1}'
  },
];

export const MODES = [
  { id: 'train',   icon: '🤖', label: 'Treino',       title: 'Arena de Treino' },
  { id: 'class',   icon: '🎓', label: 'Sala de Aula', title: 'Sala de Aula — IA Adaptativa' },
  { id: 'compete', icon: '⚔️', label: 'Competição',   title: 'Modo Competição — A vs B' },
  { id: 'vision',  icon: '📷', label: 'Visão Real',   title: 'Visão Real — Webcam' },
];

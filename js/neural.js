// =============================================================================
// NEURAL — Perceptron multi-classe + Softmax + Aprendizado Hebbian
// =============================================================================
import { CONFIG, RULES } from './config.js';
import { NN, adaptive } from './state.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** RGB(0–255) → HSV (h:0–360, s:0–1, v:0–1) */
export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0, s = mx === 0 ? 0 : d / mx, v = mx;
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s, v };
}

/** Constrói o vetor de entrada normalizado [0..1] para a rede */
export function buildInput(hex, distPx) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const { h, s, v } = rgbToHsv(r, g, b);
  const proximity = 1 - Math.min(1, distPx / CONFIG.DETECT_R);
  return [h / 360, s, v, proximity];
}

/** Forward pass: x → logits z → softmax p */
export function forward(x) {
  // Pesos adaptativos didáticos modulam o ganho de cada entrada
  const xMod = x.map((xi, j) => xi * adaptive.weights[j]);
  const z = NN.W.map((row, i) => row.reduce((a, w, j) => a + w * xMod[j], 0) + NN.b[i]);
  const max = Math.max(...z);
  const exps = z.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  const probs = exps.map(e => e / sum);
  NN.lastInput = x.slice();
  NN.lastLogits = z;
  NN.lastProbs = probs;
  return probs;
}

/** Argmax → índice da classe vencedora */
export const argmax = arr => arr.reduce((iMax, v, i, a) => v > a[iMax] ? i : iMax, 0);

/** Margem entre a 1ª e 2ª melhores classes (medida de incerteza) */
export function margin(probs) {
  const sorted = probs.slice().sort((a, b) => b - a);
  return sorted[0] - sorted[1];
}

/**
 * Aprendizado Hebbian de classe (perceptron-like):
 *  ΔW[c][j] = η · reward · x[j]
 * Atualiza tanto a matriz W (rede real) quanto os pesos
 * adaptativos didáticos.
 */
export function learn(classIdx, reward, x) {
  const η = CONFIG.LEARNING_RATE;
  const [lo, hi] = CONFIG.WEIGHT_CLAMP;

  for (let j = 0; j < 4; j++) {
    NN.W[classIdx][j] = clamp(NN.W[classIdx][j] + η * reward * x[j], lo, hi);
  }
  NN.b[classIdx] = clamp(NN.b[classIdx] + η * reward * 0.5, lo, hi);

  // Pesos adaptativos didáticos (ganho global por dimensão de entrada)
  const [aLo, aHi] = CONFIG.ADAPT_CLAMP;
  for (let j = 0; j < adaptive.weights.length; j++) {
    adaptive.weights[j] = clamp(adaptive.weights[j] + η * reward * x[j] * 0.3, aLo, aHi);
  }
  adaptive.learnCount++;
}

/** Atalho usado pela UI: dado um hex e a distância, retorna probs */
export function scoreColor(hex, distPx = 0) {
  return forward(buildInput(hex, distPx));
}

/**
 * Determina a classe REAL pretendida (rótulo) de uma cor por suas faixas HSV
 * — usado como verdade-base para o aprendizado por reforço.
 */
export function trueClass(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const { h } = rgbToHsv(r, g, b);
  for (let i = 0; i < RULES.length; i++) {
    if (RULES[i].hueRanges.some(([a, b]) => h >= a && h <= b)) return i;
  }
  return 0;
}

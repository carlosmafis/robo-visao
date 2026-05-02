// =============================================================================
// RENDER v7 — Premium: robô com gradiente metálico, íris colorida pela classe,
// alvos com halo dinâmico, partículas refinadas, suporta robô B (competição)
// =============================================================================
import { CONFIG, RULES } from './config.js';
import { state, adaptive, NN, NN_B, competitor, telemetry } from './state.js';
import { rgbToHsv } from './neural.js';

const { ROBOT_R, OBJ_R, DETECT_R } = CONFIG;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fmt = t => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');

export const canvas = document.getElementById('arena');
export const ctx = canvas.getContext('2d');

// ──────────────────────────────────────────────────────────────────────────────
// ROBÔ PREMIUM — desenhado em canvas (não SVG), permite íris dinâmica por frame
// ──────────────────────────────────────────────────────────────────────────────
function drawPremiumRobot(rx, ry, opts = {}) {
  const {
    state: rState = 'idle',
    irisHex = null,        // cor da íris (cor predita); se null usa stateColor
    bobble = 0,
    isB = false,           // robô competidor: visual ligeiramente diferente
    tick = 0,
  } = opts;

  const stateColor =
    rState === 'chase' ? '#00ffa3' :
    rState === 'flee'  ? '#ff3b6f' :
                         '#5ad9ff';
  const accent = isB ? '#ffaa3a' : stateColor;
  const iris = irisHex || stateColor;
  const bobY = Math.sin(bobble) * 2.5;

  ctx.save();
  ctx.translate(rx, ry + bobY);

  // ── Sombra elíptica ──
  ctx.save();
  ctx.scale(1, 0.22);
  const sg = ctx.createRadialGradient(0, 28, 1, 0, 28, 28);
  sg.addColorStop(0, 'rgba(0,0,0,0.35)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(0, 28, 26, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── Halo de estado ──
  const haloAlpha = 0.12 + 0.07 * Math.sin(tick * 0.08);
  const haloR = 30;
  const hg = ctx.createRadialGradient(0, 0, haloR * 0.4, 0, 0, haloR);
  hg.addColorStop(0, hexToRGBA(accent, haloAlpha * 1.6));
  hg.addColorStop(1, hexToRGBA(accent, 0));
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(0, 0, haloR, 0, Math.PI * 2); ctx.fill();

  // ── Antenas + LED no topo ──
  const ledOn = (Math.sin(tick * 0.18) + 1) * 0.5;  // 0..1
  ctx.strokeStyle = hexToRGBA(accent, 0.85);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-6, -18); ctx.lineTo(-9, -26);
  ctx.moveTo(6, -18);  ctx.lineTo(9, -26);
  ctx.stroke();
  // LEDs
  ['#ff3b6f', accent].forEach((c, i) => {
    const lx = i === 0 ? -9 : 9;
    ctx.shadowColor = c; ctx.shadowBlur = 10 + ledOn * 6;
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(lx, -27, 1.7 + ledOn * 0.6, 0, Math.PI * 2); ctx.fill();
  });
  ctx.shadowBlur = 0;

  // ── Cabeça (gradiente metálico) ──
  const headGrad = ctx.createLinearGradient(-10, -22, 10, -10);
  headGrad.addColorStop(0, '#1a2540');
  headGrad.addColorStop(0.5, '#2a3a60');
  headGrad.addColorStop(1, '#101830');
  ctx.fillStyle = headGrad;
  ctx.strokeStyle = hexToRGBA(accent, 0.9);
  ctx.lineWidth = 1.6;
  roundRect(ctx, -10, -22, 20, 14, 3.5); ctx.fill(); ctx.stroke();

  // Visor (faixa escura)
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  roundRect(ctx, -8, -20, 16, 7, 2); ctx.fill();
  ctx.strokeStyle = hexToRGBA(accent, 0.5); ctx.lineWidth = 0.6; ctx.stroke();

  // ── Olhos (íris colorida pela classe predita) ──
  const eyeY = -16.5;
  [-3.8, 3.8].forEach((ex, i) => {
    // sclera/aro
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(ex, eyeY, 2.6, 0, Math.PI * 2); ctx.fill();
    // íris (gradiente radial colorido)
    const ig = ctx.createRadialGradient(ex - 0.4, eyeY - 0.4, 0.3, ex, eyeY, 2.4);
    ig.addColorStop(0, lighten(iris, 0.35));
    ig.addColorStop(0.6, iris);
    ig.addColorStop(1, darken(iris, 0.4));
    ctx.fillStyle = ig;
    ctx.shadowColor = iris; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(ex, eyeY, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // pupila
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(ex, eyeY, 0.9, 0, Math.PI * 2); ctx.fill();
    // brilho especular
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(ex - 0.6, eyeY - 0.7, 0.55, 0, Math.PI * 2); ctx.fill();
  });

  // ── Pescoço ──
  ctx.fillStyle = '#0e1530';
  ctx.fillRect(-3, -8, 6, 3);

  // ── Corpo (gradiente metálico maior) ──
  const bodyGrad = ctx.createLinearGradient(-14, -5, 14, 16);
  bodyGrad.addColorStop(0, '#1c2748');
  bodyGrad.addColorStop(0.5, '#2e4070');
  bodyGrad.addColorStop(1, '#0f1730');
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = hexToRGBA(accent, 0.95);
  ctx.lineWidth = 1.8;
  roundRect(ctx, -14, -5, 28, 22, 4); ctx.fill(); ctx.stroke();

  // Painel central (medalhão)
  const coreR = 6;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath(); ctx.arc(0, 5, coreR + 1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = hexToRGBA(accent, 0.85); ctx.lineWidth = 1.2; ctx.stroke();
  // Núcleo pulsante
  const pulse = 0.7 + 0.3 * Math.sin(tick * 0.12);
  const cg = ctx.createRadialGradient(0, 5, 0, 0, 5, coreR);
  cg.addColorStop(0, hexToRGBA(iris, 0.95));
  cg.addColorStop(0.6, hexToRGBA(iris, 0.55 * pulse));
  cg.addColorStop(1, hexToRGBA(iris, 0));
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(0, 5, coreR, 0, Math.PI * 2); ctx.fill();
  // Anéis
  ctx.strokeStyle = hexToRGBA(iris, 0.5);
  ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.arc(0, 5, coreR - 1.5, 0, Math.PI * 2); ctx.stroke();

  // Detalhes laterais (vents)
  ctx.fillStyle = hexToRGBA(accent, 0.35);
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-13, -2 + i * 5, 2.5, 1.5);
    ctx.fillRect(10.5, -2 + i * 5, 2.5, 1.5);
  }

  // Braços
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = hexToRGBA(accent, 0.7); ctx.lineWidth = 1.2;
  roundRect(ctx, -19, -3, 5, 14, 2); ctx.fill(); ctx.stroke();
  roundRect(ctx, 14, -3, 5, 14, 2); ctx.fill(); ctx.stroke();

  // Pés
  roundRect(ctx, -10, 18, 8, 6, 2); ctx.fill(); ctx.stroke();
  roundRect(ctx, 2, 18, 8, 6, 2); ctx.fill(); ctx.stroke();

  // Identificador A/B
  if (isB) {
    ctx.fillStyle = '#ffaa3a';
    ctx.font = 'bold 7px Orbitron, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ffaa3a'; ctx.shadowBlur = 6;
    ctx.fillText('B', 0, 5);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}
function hexToRGBA(hex, a = 1) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function lighten(hex, amt) {
  const h = hex.replace('#', '');
  const r = Math.min(255, parseInt(h.slice(0, 2), 16) + Math.round(255 * amt));
  const g = Math.min(255, parseInt(h.slice(2, 4), 16) + Math.round(255 * amt));
  const b = Math.min(255, parseInt(h.slice(4, 6), 16) + Math.round(255 * amt));
  return `rgb(${r},${g},${b})`;
}
function darken(hex, amt) {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - Math.round(255 * amt));
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - Math.round(255 * amt));
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - Math.round(255 * amt));
  return `rgb(${r},${g},${b})`;
}

// ──────────────────────────────────────────────────────────────────────────────
// PARTÍCULAS
// ──────────────────────────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, col, v = 0.5) {
    this.x = x ?? Math.random() * (state.W || 400);
    this.y = y ?? Math.random() * (state.H || 400);
    this.vx = (Math.random() - .5) * v;
    this.vy = (Math.random() - .5) * v;
    this.life = Math.random() * .5 + .5;
    this.maxLife = this.life;
    this.size = Math.random() * 1.5 + .5;
    this.col = col || 'rgba(0,255,163,';
    this.ambient = !x && !y;
  }
  update() { this.x += this.vx; this.y += this.vy; this.life -= this.ambient ? .004 : .022; }
  draw() {
    ctx.fillStyle = this.col + (this.life / this.maxLife * (this.ambient ? .22 : .65)) + ')';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
  }
}
export function burst(x, y, col, n = 16) {
  for (let i = 0; i < n; i++) {
    const p = new Particle(x, y, col, 2.5 + Math.random() * 3.5);
    p.size = Math.random() * 3 + 1;
    state.particles.push(p);
  }
}
export function addFloat(x, y, text, color) {
  state.floatLabels.push({ x, y, text, color, life: 1, vy: -.7 });
}

// ──────────────────────────────────────────────────────────────────────────────
// RESIZE
// ──────────────────────────────────────────────────────────────────────────────
export function resizeCanvas() {
  const wrap = canvas.parentElement;
  state.W = wrap.clientWidth || 400;
  state.H = wrap.clientHeight || 400;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = state.W * dpr;
  canvas.height = state.H * dpr;
  canvas.style.width = state.W + 'px';
  canvas.style.height = state.H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.particles = state.particles.filter(p => !p.ambient);
  for (let i = 0; i < 22; i++) state.particles.push(new Particle());
}

// ── Radar ──
function updateRadar() {
  state.radarAngle += 0.032;
  if (state.radarAngle >= Math.PI * 2) {
    state.radarAngle -= Math.PI * 2;
    state.radarPulses.push({ r: ROBOT_R + 2, alpha: 1 });
  }
  state.radarPulses = state.radarPulses.filter(p => { p.r += 1.8; p.alpha -= .014; return p.alpha > 0 && p.r < DETECT_R + 20; });
}
function drawRadar(rx, ry, hasTarget, isB = false) {
  const c = isB
    ? (hasTarget ? '255,170,40' : '170,90,20')
    : (hasTarget ? '0,255,163' : '0,140,70');
  const glow = isB ? (hasTarget ? '#ffaa28' : '#aa5a14') : (hasTarget ? '#00ffa3' : '#00aa55');
  state.radarPulses.forEach(p => {
    ctx.beginPath(); ctx.arc(rx, ry, p.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${c},${p.alpha * .35})`; ctx.lineWidth = 1; ctx.stroke();
  });
  const TRAIL = Math.PI * .38, steps = 14;
  for (let i = 0; i < steps; i++) {
    const frac = (steps - i) / steps;
    ctx.beginPath(); ctx.moveTo(rx, ry);
    ctx.arc(rx, ry, DETECT_R, state.radarAngle - TRAIL * frac, state.radarAngle - TRAIL * (frac - 1 / steps));
    ctx.closePath();
    ctx.fillStyle = `rgba(${c},${frac * (hasTarget ? .12 : .04)})`;
    ctx.fill();
  }
  const ex = rx + Math.cos(state.radarAngle) * DETECT_R, ey = ry + Math.sin(state.radarAngle) * DETECT_R;
  ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = hasTarget ? 12 : 5;
  ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(ex, ey);
  ctx.strokeStyle = `rgba(${c},${hasTarget ? .85 : .55})`;
  ctx.lineWidth = hasTarget ? 1.8 : 1.2; ctx.stroke();
  ctx.restore();
}

// ── Objetos premium (com halo radial) ──
function drawObject(o) {
  const inR = dist(state.robot, o) < DETECT_R, pulse = 1 + .12 * Math.sin(o.pulse), r = OBJ_R * pulse;
  const rr = parseInt(o.rule.hex.slice(1, 3), 16);
  const gg = parseInt(o.rule.hex.slice(3, 5), 16);
  const bb = parseInt(o.rule.hex.slice(5, 7), 16);

  // Halo externo radial premium
  const haloR = r + (inR ? 22 : 14);
  const haloAlpha = inR ? 0.32 : 0.16;
  const hg = ctx.createRadialGradient(o.x, o.y, r * 0.5, o.x, o.y, haloR);
  hg.addColorStop(0, `rgba(${rr},${gg},${bb},${haloAlpha})`);
  hg.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(o.x, o.y, haloR, 0, Math.PI * 2); ctx.fill();

  if (inR && !o.rule.flee) {
    ctx.save(); ctx.setLineDash([3, 6]); ctx.strokeStyle = o.rule.hex + '55'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(state.robot.x, state.robot.y); ctx.lineTo(o.x, o.y); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }

  // Hexágono com gradiente
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.pulse * .5);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  fg.addColorStop(0, `rgba(${rr},${gg},${bb},0.85)`);
  fg.addColorStop(0.7, `rgba(${rr},${gg},${bb},0.4)`);
  fg.addColorStop(1, `rgba(${rr},${gg},${bb},0.15)`);
  ctx.fillStyle = fg; ctx.fill();
  ctx.strokeStyle = o.rule.hex; ctx.lineWidth = 2;
  ctx.shadowColor = o.rule.hex; ctx.shadowBlur = inR ? 14 : 7; ctx.stroke(); ctx.shadowBlur = 0;
  // Centro
  ctx.beginPath(); ctx.arc(0, 0, r * .42, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,0.18)`; ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.font = `bold ${Math.round(r * .7)}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(o.rule.flee ? '✕' : '+', 0, 0);
  ctx.restore();

  ctx.fillStyle = `rgba(${rr},${gg},${bb},.75)`; ctx.font = '7px "Share Tech Mono"';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(o.rule.name, o.x, o.y + OBJ_R + 6);
  const ttlPct = 1 - (Date.now() - o.born) / o.ttl, bw = 18, bx = o.x - bw / 2, by = o.y - OBJ_R - 9;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx, by, bw, 3);
  ctx.fillStyle = ttlPct > .4 ? o.rule.hex : '#ff3b6f';
  ctx.fillRect(bx, by, bw * ttlPct, 3);

  if (state.mode === 'class' && state.lastNear === o) {
    const { h, s, v } = rgbToHsv(rr, gg, bb);
    ctx.save();
    ctx.font = 'bold 9px "Share Tech Mono"';
    [`H:${Math.round(h)}°`, `S:${Math.round(s * 100)}%`, `V:${Math.round(v * 100)}%`].forEach((lbl, i) => {
      const ty = o.y - OBJ_R - 28 - i * 13;
      const tw = ctx.measureText(lbl).width + 8;
      ctx.fillStyle = 'rgba(0,0,0,.78)'; ctx.strokeStyle = o.rule.hex; ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(o.x - tw / 2, ty - 7, tw, 14, 2) : ctx.rect(o.x - tw / 2, ty - 7, tw, 14);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = o.rule.hex; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, o.x, ty);
    });
    ctx.restore();
  }
}

// ── HUD ──
function drawHUD() {
  ctx.save(); ctx.setLineDash([2, 6]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,255,163,.18)';
  ctx.beginPath(); ctx.arc(state.robot.x, state.robot.y, DETECT_R, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]); ctx.restore();

  // Raio do competidor
  if (competitor.enabled && competitor.robot) {
    ctx.save(); ctx.setLineDash([2, 6]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,170,58,.22)';
    ctx.beginPath(); ctx.arc(competitor.robot.x, competitor.robot.y, DETECT_R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }

  ctx.save(); ctx.font = '8px "Share Tech Mono"'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const info = [
    `X:${String(Math.round(state.robot.x)).padStart(4, ' ')} Y:${String(Math.round(state.robot.y)).padStart(4, ' ')}`,
    `T:${fmt(state.tick)} W:[${adaptive.weights.map(w => w.toFixed(1)).join(' ')}]`,
    `MODO: ${state.robot.state.toUpperCase()}`
  ];
  info.forEach((line, i) => {
    ctx.fillStyle = i === 2 && state.robot.state === 'flee' ? 'rgba(255,59,111,.65)'
      : i === 2 && state.robot.state === 'chase' ? 'rgba(0,255,163,.7)'
      : 'rgba(154,217,192,.55)';
    ctx.fillText(line, 8, 8 + i * 11);
  });
  ctx.restore();

  if (state.mode === 'class' && state.robot.target) {
    ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,216,58,.5)'; ctx.lineWidth = 1.3;
    ctx.shadowColor = '#ffd83a'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(state.robot.x, state.robot.y);
    ctx.lineTo(state.robot.target.x, state.robot.target.y); ctx.stroke();
    ctx.shadowBlur = 0; ctx.setLineDash([]); ctx.restore();
  }

  state.floatLabels = state.floatLabels.filter(fl => {
    fl.y += fl.vy; fl.life -= .022; if (fl.life <= 0) return false;
    ctx.save(); ctx.globalAlpha = fl.life; ctx.font = 'bold 12px "Orbitron",sans-serif';
    ctx.fillStyle = fl.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = fl.color; ctx.shadowBlur = 7;
    ctx.fillText(fl.text, fl.x, fl.y); ctx.restore(); return true;
  });
}

// ── Helper: cor predita atual (para a íris) ──
function predictedHex(probsArr) {
  if (!probsArr || !probsArr.length) return null;
  let m = 0;
  for (let i = 1; i < probsArr.length; i++) if (probsArr[i] > probsArr[m]) m = i;
  return RULES[m].hex;
}

// ── Frame ──
export function draw() {
  ctx.fillStyle = '#060b1a'; ctx.fillRect(0, 0, state.W, state.H);
  ctx.save(); ctx.strokeStyle = 'rgba(0,255,163,.045)'; ctx.lineWidth = 1;
  for (let x = 0; x < state.W; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, state.H); ctx.stroke(); }
  for (let y = 0; y < state.H; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(state.W, y); ctx.stroke(); }
  ctx.restore();
  state.particles.forEach(p => { p.update(); p.draw(); });
  if (Math.random() < .22 && state.particles.filter(p => p.ambient).length < 26) state.particles.push(new Particle());
  state.particles = state.particles.filter(p => p.life > 0);
  updateRadar();
  drawRadar(state.robot.x, state.robot.y, !!state.lastNear);
  for (const o of state.objects) drawObject(o);

  // Robô principal (íris = cor predita atual)
  drawPremiumRobot(state.robot.x, state.robot.y, {
    state: state.robot.state,
    irisHex: predictedHex(state.lastScores),
    bobble: state.robotBobble,
    tick: state.tick,
  });

  // Robô B (íris baseada na rede B)
  if (competitor.enabled && competitor.robot) {
    drawRadar(competitor.robot.x, competitor.robot.y, !!competitor.robot.target, true);
    drawPremiumRobot(competitor.robot.x, competitor.robot.y, {
      state: competitor.robot.state,
      irisHex: predictedHex(NN_B.lastProbs),
      bobble: state.robotBobble * 1.2 + 1.5,
      tick: state.tick + 30,
      isB: true,
    });
  }

  drawHUD();
  if (state.glitchEffect > 0) {
    ctx.fillStyle = `rgba(${state.glitchColor},${state.glitchEffect * .09})`;
    ctx.fillRect(0, 0, state.W, state.H);
    if (state.glitchEffect > .3) {
      const gy = Math.random() * state.H;
      ctx.fillStyle = `rgba(${state.glitchColor},${state.glitchEffect * .2})`;
      ctx.fillRect(0, gy, state.W, 2 + Math.random() * 4);
    }
    state.glitchEffect -= .03;
  }
}

// ── Chart ──
const chartCanvas = document.getElementById('chart');
const chartCtx = chartCanvas ? chartCanvas.getContext('2d') : null;
let chartW = 0, chartH = 0;
export function chartResize() {
  if (!chartCanvas) return;
  chartW = chartCanvas.offsetWidth || 270;
  chartH = chartCanvas.offsetHeight || 50;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  chartCanvas.width = chartW * dpr;
  chartCanvas.height = chartH * dpr;
  chartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
export function drawChart() {
  if (!chartCtx) return;
  if (!chartW) chartResize();
  const g = chartCtx, cW = chartW, cH = chartH;
  g.clearRect(0, 0, cW, cH);
  const h = state.scoreHistory;
  if (h.length < 2) { g.fillStyle = 'rgba(0,255,163,.04)'; g.fillRect(0, 0, cW, cH); return; }
  const mn = Math.min(...h), mx = Math.max(...h), range = mx - mn || 1;
  g.fillStyle = 'rgba(0,255,163,.04)'; g.fillRect(0, 0, cW, cH);
  g.beginPath();
  h.forEach((v, i) => {
    const x = (i / (h.length - 1)) * cW;
    const y = cH - ((v - mn) / range) * (cH - 4) - 2;
    i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  });
  g.lineTo(cW, cH); g.lineTo(0, cH); g.closePath();
  const gr = g.createLinearGradient(0, 0, 0, cH);
  gr.addColorStop(0, 'rgba(0,255,163,.3)'); gr.addColorStop(1, 'rgba(0,255,163,.02)');
  g.fillStyle = gr; g.fill();
  g.beginPath();
  h.forEach((v, i) => {
    const x = (i / (h.length - 1)) * cW;
    const y = cH - ((v - mn) / range) * (cH - 4) - 2;
    i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  });
  g.strokeStyle = '#00ffa3'; g.lineWidth = 1.5;
  g.shadowColor = '#00ffa3'; g.shadowBlur = 5; g.stroke(); g.shadowBlur = 0;
}

// Sparkline para a tab Competição (acurácia A vs B)
const compCanvas = () => document.getElementById('compete-chart');
let cChartCtx = null, cW = 0, cH = 0;
export function drawCompeteChart() {
  const c = compCanvas();
  if (!c) return;
  if (!cChartCtx) cChartCtx = c.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = c.offsetWidth || 400, h = c.offsetHeight || 120;
  if (w !== cW || h !== cH) {
    cW = w; cH = h;
    c.width = w * dpr; c.height = h * dpr;
    cChartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const g = cChartCtx;
  g.clearRect(0, 0, w, h);
  // grid
  g.strokeStyle = 'rgba(0,255,163,.08)'; g.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (i / 4) * h;
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
  }
  g.strokeStyle = 'rgba(255,216,58,.15)'; g.setLineDash([2, 4]);
  g.beginPath(); g.moveTo(0, h * 0.5); g.lineTo(w, h * 0.5); g.stroke();
  g.setLineDash([]);

  // Séries (telemetry da rede A em verde, competitor B em laranja)
  const drawSeries = (data, color) => {
    if (!data || data.length < 2) return;
    g.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - v * (h - 4) - 2;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    });
    g.strokeStyle = color; g.lineWidth = 1.8;
    g.shadowColor = color; g.shadowBlur = 6; g.stroke(); g.shadowBlur = 0;
  };
  drawSeries(telemetry.accuracyHistory, '#00ffa3');
  drawSeries(competitor.accuracyHistory, '#ffaa3a');

  // Legenda + valores atuais
  g.font = 'bold 10px "Orbitron", sans-serif';
  g.textBaseline = 'top';
  const accA = telemetry.recent.length
    ? Math.round((telemetry.recent.reduce((a, b) => a + b, 0) / telemetry.recent.length) * 100) : 0;
  const accB = competitor.recent.length
    ? Math.round((competitor.recent.reduce((a, b) => a + b, 0) / competitor.recent.length) * 100) : 0;
  g.fillStyle = '#00ffa3'; g.textAlign = 'left';
  g.fillText(`● A  ${accA}%`, 8, 6);
  g.fillStyle = '#ffaa3a'; g.textAlign = 'right';
  g.fillText(`B  ${accB}% ●`, w - 8, 6);

  // Eixo 50%
  g.fillStyle = 'rgba(255,216,58,.5)';
  g.font = '8px "Share Tech Mono"';
  g.textAlign = 'left';
  g.fillText('50%', 4, h * 0.5 - 4);
}

export { fmt, dist, RULES };

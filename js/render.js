// =============================================================================
// RENDER — desenho do canvas (robô, objetos, radar, partículas, HUD)
// =============================================================================
import { CONFIG, RULES } from './config.js';
import { state, adaptive } from './state.js';
import { rgbToHsv } from './neural.js';

const { ROBOT_R, OBJ_R, DETECT_R } = CONFIG;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fmt = t => String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');

// ── Canvas ──
export const canvas = document.getElementById('arena');
export const ctx = canvas.getContext('2d');

// ── Robô SVG (gerado uma vez por estado, com revoke) ──
function buildRobotImage(stateName) {
  const bodyCol = stateName === 'chase' ? '#00ffa3' : stateName === 'flee' ? '#ff3b6f' : '#5ad9ff';
  const eyeCol = stateName === 'flee' ? '#ffd83a' : '#00ffa3';
  const antCol = stateName === 'flee' ? '#ffd83a' : '#00ffa3';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -26 40 52" width="80" height="104">
  <defs>
    <filter id="g"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="bg" cx="35%" cy="30%"><stop offset="0%" stop-color="${bodyCol}" stop-opacity=".5"/><stop offset="100%" stop-color="${bodyCol}" stop-opacity=".1"/></radialGradient>
    <radialGradient id="hg" cx="35%" cy="25%"><stop offset="0%" stop-color="${bodyCol}" stop-opacity=".6"/><stop offset="100%" stop-color="${bodyCol}" stop-opacity=".12"/></radialGradient>
  </defs>
  <line x1="-5" y1="-18" x2="-8" y2="-25" stroke="${antCol}" stroke-width="1.2" opacity=".8"/>
  <circle cx="-8" cy="-25.5" r="1.5" fill="${antCol}" opacity=".9" filter="url(#g)"/>
  <line x1="5" y1="-18" x2="8" y2="-25" stroke="${antCol}" stroke-width="1.2" opacity=".8"/>
  <circle cx="8" cy="-25.5" r="1.5" fill="${antCol}" opacity=".9" filter="url(#g)"/>
  <rect x="-9" y="-22" width="18" height="13" rx="3" fill="url(#hg)" stroke="${bodyCol}" stroke-width="1.5" filter="url(#g)"/>
  <rect x="-7" y="-19" width="14" height="5" rx="1.5" fill="rgba(0,0,0,.7)" stroke="${eyeCol}" stroke-width=".8"/>
  <circle cx="-3.5" cy="-16.5" r="2.2" fill="${eyeCol}" opacity=".95" filter="url(#g)"/>
  <circle cx="3.5" cy="-16.5" r="2.2" fill="${eyeCol}" opacity=".95" filter="url(#g)"/>
  <circle cx="-2.8" cy="-17.1" r=".7" fill="white" opacity=".7"/>
  <circle cx="4.2" cy="-17.1" r=".7" fill="white" opacity=".7"/>
  <rect x="-13" y="-5" width="26" height="20" rx="3" fill="url(#bg)" stroke="${bodyCol}" stroke-width="1.8" filter="url(#g)"/>
  <circle cx="0" cy="3" r="5.5" fill="rgba(0,0,0,.6)" stroke="${bodyCol}" stroke-width="1.2"/>
  <circle cx="0" cy="3" r="3.5" fill="${bodyCol}" opacity=".7" filter="url(#g)"/>
  <circle cx="0" cy="3" r="1.8" fill="white" opacity=".5"/>
  <rect x="-12" y="2" width="3" height="8" rx="1" fill="${bodyCol}" opacity=".2" stroke="${bodyCol}" stroke-width=".5"/>
  <rect x="9" y="2" width="3" height="8" rx="1" fill="${bodyCol}" opacity=".2" stroke="${bodyCol}" stroke-width=".5"/>
  <rect x="-18" y="-4" width="6" height="14" rx="2.5" fill="url(#bg)" stroke="${bodyCol}" stroke-width="1.3"/>
  <rect x="12" y="-4" width="6" height="14" rx="2.5" fill="url(#bg)" stroke="${bodyCol}" stroke-width="1.3"/>
  <rect x="-10" y="19" width="8" height="12" rx="2" fill="url(#bg)" stroke="${bodyCol}" stroke-width="1.3"/>
  <rect x="2" y="19" width="8" height="12" rx="2" fill="url(#bg)" stroke="${bodyCol}" stroke-width="1.3"/>
</svg>`;
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  img.src = url;
  img.onload = () => URL.revokeObjectURL(url);   // libera memória
  return img;
}
const robotImgs = { idle: buildRobotImage('idle'), chase: buildRobotImage('chase'), flee: buildRobotImage('flee') };

// ── Partículas ──
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
export function burst(x, y, col, n = 12) {
  for (let i = 0; i < n; i++) {
    const p = new Particle(x, y, col, 2.5 + Math.random() * 3);
    p.size = Math.random() * 3 + 1;
    state.particles.push(p);
  }
}
export function addFloat(x, y, text, color) {
  state.floatLabels.push({ x, y, text, color, life: 1, vy: -.7 });
}

// ── Resize ──
export function resizeCanvas() {
  const wrap = canvas.parentElement;
  state.W = wrap.clientWidth || 400;
  state.H = wrap.clientHeight || 400;
  // Suporte a retina
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
function drawRadar(rx, ry, hasTarget) {
  const c = hasTarget ? '0,255,163' : '0,140,70';
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
  ctx.save(); ctx.shadowColor = hasTarget ? '#00ffa3' : '#00aa55'; ctx.shadowBlur = hasTarget ? 12 : 5;
  ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(ex, ey);
  ctx.strokeStyle = hasTarget ? 'rgba(0,255,163,.85)' : 'rgba(0,140,70,.55)';
  ctx.lineWidth = hasTarget ? 1.8 : 1.2; ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.shadowColor = '#00ffa3'; ctx.shadowBlur = hasTarget ? 16 : 5;
  ctx.beginPath(); ctx.arc(ex, ey, hasTarget ? 3 : 1.8, 0, Math.PI * 2);
  ctx.fillStyle = hasTarget ? '#00ffa3' : '#00aa55'; ctx.fill();
  ctx.restore();
}

// ── Robô ──
function drawRobot(rx, ry) {
  const bobY = Math.sin(state.robotBobble) * 2.5;
  const img = robotImgs[state.robot.state] || robotImgs.idle;
  const WR = 52, HR = 68;
  ctx.save(); ctx.translate(rx, ry + bobY);
  ctx.save(); ctx.scale(1, .2);
  ctx.beginPath(); ctx.ellipse(0, HR * .46 + 10, WR * .35, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0,0,0,${.22 - Math.abs(bobY) * .02})`; ctx.fill();
  ctx.restore();
  const rc = state.robot.state === 'flee' ? '255,59,111' : state.robot.state === 'chase' ? '0,255,163' : '90,217,255';
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, WR * .52, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${rc},${.1 + .07 * Math.sin(state.tick * .08)})`; ctx.lineWidth = 2.5;
  ctx.shadowColor = `rgba(${rc},1)`; ctx.shadowBlur = 8; ctx.stroke(); ctx.restore();
  ctx.shadowColor = `rgba(${rc},1)`; ctx.shadowBlur = 16;
  if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, -WR / 2, -HR / 2, WR, HR);
  ctx.shadowBlur = 0; ctx.restore();
}

// ── Objetos ──
function drawObject(o) {
  const inR = dist(state.robot, o) < DETECT_R, pulse = 1 + .1 * Math.sin(o.pulse), r = OBJ_R * pulse;
  const rr = parseInt(o.rule.hex.slice(1, 3), 16);
  const gg = parseInt(o.rule.hex.slice(3, 5), 16);
  const bb = parseInt(o.rule.hex.slice(5, 7), 16);
  if (inR && !o.rule.flee) {
    ctx.save(); ctx.setLineDash([3, 6]); ctx.strokeStyle = o.rule.hex + '55'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(state.robot.x, state.robot.y); ctx.lineTo(o.x, o.y); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
  if (inR) {
    ctx.beginPath(); ctx.arc(o.x, o.y, r + 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rr},${gg},${bb},.1)`; ctx.fill();
  }
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.pulse * .5);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = `rgba(${rr},${gg},${bb},.22)`; ctx.fill();
  ctx.strokeStyle = o.rule.hex; ctx.lineWidth = 2;
  ctx.shadowColor = o.rule.hex; ctx.shadowBlur = inR ? 10 : 5; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(0, 0, r * .52, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${rr},${gg},${bb},.45)`; ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.8)'; ctx.font = `bold ${Math.round(r * .65)}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(o.rule.flee ? '✕' : '+', 0, 0);
  ctx.restore();
  ctx.fillStyle = `rgba(${rr},${gg},${bb},.65)`; ctx.font = '7px "Share Tech Mono"';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(o.rule.name, o.x, o.y + OBJ_R + 5);
  const ttlPct = 1 - (Date.now() - o.born) / o.ttl, bw = 18, bx = o.x - bw / 2, by = o.y - OBJ_R - 9;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx, by, bw, 3);
  ctx.fillStyle = ttlPct > .4 ? o.rule.hex : '#ff3b6f';
  ctx.fillRect(bx, by, bw * ttlPct, 3);

  if (state.explainMode && state.lastNear === o) {
    const { h, s, v } = rgbToHsv(rr, gg, bb);
    ctx.save();
    ctx.font = 'bold 9px "Share Tech Mono"';
    [`H:${Math.round(h)}°`, `S:${Math.round(s * 100)}%`, `V:${Math.round(v * 100)}%`].forEach((lbl, i) => {
      const ty = o.y - OBJ_R - 28 - i * 13;
      const tw = ctx.measureText(lbl).width + 8;
      ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.strokeStyle = o.rule.hex; ctx.lineWidth = .8;
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

  if (state.explainMode && state.robot.target) {
    ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,216,58,.5)'; ctx.lineWidth = 1.3;
    ctx.shadowColor = '#ffd83a'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(state.robot.x, state.robot.y);
    ctx.lineTo(state.robot.target.x, state.robot.target.y); ctx.stroke();
    ctx.shadowBlur = 0; ctx.setLineDash([]); ctx.restore();
    ctx.save(); ctx.font = 'bold 9px "Share Tech Mono"';
    const badge = '🎓 SALA DE AULA ATIVA — MODO LENTO';
    const bw = ctx.measureText(badge).width + 18;
    ctx.fillStyle = 'rgba(0,40,20,.92)'; ctx.strokeStyle = '#00ffa3'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(state.W / 2 - bw / 2, 6, bw, 22, 3) : ctx.rect(state.W / 2 - bw / 2, 6, bw, 22);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#00ffa3'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(badge, state.W / 2, 18);
    ctx.restore();
  }

  state.floatLabels = state.floatLabels.filter(fl => {
    fl.y += fl.vy; fl.life -= .022; if (fl.life <= 0) return false;
    ctx.save(); ctx.globalAlpha = fl.life; ctx.font = 'bold 12px "Orbitron",sans-serif';
    ctx.fillStyle = fl.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = fl.color; ctx.shadowBlur = 7;
    ctx.fillText(fl.text, fl.x, fl.y); ctx.restore(); return true;
  });
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
  drawRobot(state.robot.x, state.robot.y);
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

// ── Chart cacheado ──
const chartCanvas = document.getElementById('chart');
const chartCtx = chartCanvas.getContext('2d');
let chartW = 0, chartH = 0;
export function chartResize() {
  chartW = chartCanvas.offsetWidth || 270;
  chartH = chartCanvas.offsetHeight || 50;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  chartCanvas.width = chartW * dpr;
  chartCanvas.height = chartH * dpr;
  chartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
export function drawChart() {
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

export { fmt, dist, RULES };

// =============================================================================
// PILOT — Modo jogo: usuário controla o robô com setas/WASD ou joystick virtual
// =============================================================================
import { state } from './state.js';
import { CONFIG } from './config.js';

const keys = { up: false, down: false, left: false, right: false };
// Vetor analógico do joystick virtual (componentes em [-1,1])
const joy = { x: 0, y: 0, active: false };

// ── Teclado ──
window.addEventListener('keydown', (e) => {
  if (e.target.matches?.('input,textarea')) return;
  if (state.mode !== 'pilot') return;
  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w')   { keys.up = true;    e.preventDefault(); }
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') { keys.down = true;  e.preventDefault(); }
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') { keys.left = true;  e.preventDefault(); }
  if (e.key === 'ArrowRight'|| e.key.toLowerCase() === 'd') { keys.right = true; e.preventDefault(); }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w')   keys.up = false;
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keys.down = false;
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = false;
  if (e.key === 'ArrowRight'|| e.key.toLowerCase() === 'd') keys.right = false;
});

// ── Joystick virtual ──
function initJoystick() {
  const wrap = document.getElementById('pilot-joystick');
  const base = document.getElementById('pilot-joy-base');
  const stick = document.getElementById('pilot-joy-stick');
  if (!wrap || !base || !stick) return;

  let activeId = null;
  let cx = 0, cy = 0, radius = 50;

  const recalc = () => {
    const r = base.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
    radius = r.width / 2 - 12;
  };

  const setStick = (dx, dy) => {
    stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  };

  const onStart = (e) => {
    if (state.mode !== 'pilot') return;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    activeId = e.changedTouches ? t.identifier : 'mouse';
    recalc();
    joy.active = true;
    wrap.classList.add('active');
    onMove(e);
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!joy.active) return;
    let p;
    if (e.changedTouches) {
      for (const tt of e.changedTouches) if (tt.identifier === activeId) { p = tt; break; }
      if (!p) return;
    } else { p = e; }
    let dx = p.clientX - cx;
    let dy = p.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > radius) { dx = dx / d * radius; dy = dy / d * radius; }
    setStick(dx, dy);
    joy.x = dx / radius;
    joy.y = dy / radius;
    e.preventDefault();
  };

  const onEnd = (e) => {
    if (!joy.active) return;
    if (e.changedTouches) {
      let found = false;
      for (const tt of e.changedTouches) if (tt.identifier === activeId) { found = true; break; }
      if (!found) return;
    }
    joy.active = false;
    joy.x = 0; joy.y = 0;
    activeId = null;
    setStick(0, 0);
    wrap.classList.remove('active');
  };

  wrap.addEventListener('touchstart', onStart, { passive: false });
  wrap.addEventListener('touchmove',  onMove,  { passive: false });
  wrap.addEventListener('touchend',   onEnd);
  wrap.addEventListener('touchcancel',onEnd);
  wrap.addEventListener('mousedown',  onStart);
  window.addEventListener('mousemove',onMove);
  window.addEventListener('mouseup',  onEnd);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJoystick);
} else {
  initJoystick();
}

export function isPilotActive() { return state.mode === 'pilot'; }

export function pilotDriveRobot() {
  const r = state.robot;
  if (!r) return;
  const ROBOT_R = CONFIG.ROBOT_R;
  const AC = 0.55, MV = 4.5, FR = 0.86;
  let ax = 0, ay = 0;
  if (keys.up) ay -= 1;
  if (keys.down) ay += 1;
  if (keys.left) ax -= 1;
  if (keys.right) ax += 1;
  // Joystick sobrepõe se estiver ativo (analógico)
  if (joy.active && (Math.abs(joy.x) > 0.05 || Math.abs(joy.y) > 0.05)) {
    ax = joy.x;
    ay = joy.y;
  } else {
    const len = Math.hypot(ax, ay) || 1;
    ax = ax / len; ay = ay / len;
  }
  r.vx += ax * AC;
  r.vy += ay * AC;
  r.vx *= FR; r.vy *= FR;
  const spd = Math.hypot(r.vx, r.vy);
  if (spd > MV) { r.vx = r.vx / spd * MV; r.vy = r.vy / spd * MV; }
  if (spd > 0.05) r.angle = Math.atan2(r.vy, r.vx);
  r.x = Math.max(ROBOT_R, Math.min(state.W - ROBOT_R, r.x + r.vx));
  r.y = Math.max(ROBOT_R, Math.min(state.H - ROBOT_R, r.y + r.vy));
  r.bt++; state.tick++;
  state.robotBobble += 0.06;
}

// =============================================================================
// PILOT — Modo jogo: usuário controla o robô com as setas
// =============================================================================
import { state } from './state.js';
import { CONFIG } from './config.js';

const keys = { up: false, down: false, left: false, right: false };

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
  const len = Math.hypot(ax, ay) || 1;
  r.vx += (ax / len) * AC;
  r.vy += (ay / len) * AC;
  r.vx *= FR; r.vy *= FR;
  const spd = Math.hypot(r.vx, r.vy);
  if (spd > MV) { r.vx = r.vx / spd * MV; r.vy = r.vy / spd * MV; }
  if (spd > 0.05) r.angle = Math.atan2(r.vy, r.vx);
  r.x = Math.max(ROBOT_R, Math.min(state.W - ROBOT_R, r.x + r.vx));
  r.y = Math.max(ROBOT_R, Math.min(state.H - ROBOT_R, r.y + r.vy));
  r.bt++; state.tick++;
  state.robotBobble += 0.06;
}

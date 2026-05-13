// =============================================================================
// SIDEBAR — navegação entre os 4 modos, retrátil
// =============================================================================
import { MODES } from './config.js';
import { state } from './state.js';

const $ = id => document.getElementById(id);

let onChange = () => {};

export function initSidebar(handler) {
  onChange = handler;
  const sb = $('sidebar');
  const toggle = $('sidebar-toggle');
  const items = sb.querySelectorAll('.sb-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      const mode = item.dataset.mode;
      setActiveMode(mode);
    });
  });
  toggle.addEventListener('click', () => {
    sb.classList.toggle('collapsed');
    document.body.classList.toggle('sb-collapsed', sb.classList.contains('collapsed'));
  });
  // Auto-collapse no mobile
  if (window.innerWidth < 768) {
    sb.classList.add('collapsed');
    document.body.classList.add('sb-collapsed');
  }
}

export function setActiveMode(mode) {
  if (!MODES.find(m => m.id === mode)) return;
  state.mode = mode;
  // Update sidebar selection
  document.querySelectorAll('.sb-item').forEach(el => {
    el.classList.toggle('active', el.dataset.mode === mode);
    el.setAttribute('aria-current', el.dataset.mode === mode ? 'page' : 'false');
  });
  // Show only the selected view (pilot reusa o layout do treino)
  const viewMode = mode === 'pilot' ? 'train' : mode;
  document.querySelectorAll('.view').forEach(v => {
    v.hidden = v.dataset.view !== viewMode;
  });
  document.body.classList.toggle('pilot-mode', mode === 'pilot');
  // Update title
  const m = MODES.find(x => x.id === mode);
  const titleEl = $('mode-title');
  if (titleEl) titleEl.textContent = m.title;
  onChange(mode);
}

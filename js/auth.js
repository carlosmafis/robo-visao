// =============================================================================
// AUTH — Cadastro simples por apelido + namespace de progresso
// =============================================================================
const USER_KEY = 'cn7_current_user';
const USERS_KEY = 'cn7_users';

let currentUser = localStorage.getItem(USER_KEY) || null;

export function getCurrentUser() { return currentUser; }

export function ukey(base) {
  return currentUser ? `${base}__${currentUser}` : base;
}

function listUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}

function addUser(name) {
  const users = listUsers();
  if (!users.includes(name)) {
    users.push(name);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

export function setCurrentUser(name) {
  currentUser = name;
  localStorage.setItem(USER_KEY, name);
  addUser(name);
  updateUserBadge();
}

export function logout() {
  currentUser = null;
  localStorage.removeItem(USER_KEY);
  location.reload();
}

function updateUserBadge() {
  const el = document.getElementById('user-badge');
  if (el) el.innerHTML = currentUser
    ? `👤 <strong>${currentUser}</strong> <button id="btn-logout" class="icon-btn" style="margin-left:6px;height:24px;padding:0 8px;font-size:10px">SAIR</button>`
    : '';
  document.getElementById('btn-logout')?.addEventListener('click', logout);
}

function buildModal() {
  const wrap = document.createElement('div');
  wrap.id = 'auth-overlay';
  wrap.innerHTML = `
    <div id="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <h2 id="auth-title">🤖 COMBATE NEURAL</h2>
      <p class="auth-sub">Entre com um apelido para salvar seu progresso</p>
      <input id="auth-input" type="text" maxlength="20" placeholder="Seu apelido"
             autocomplete="off" autocapitalize="off" />
      <div id="auth-users"></div>
      <button id="auth-go" type="button">ENTRAR ▶</button>
      <p class="auth-hint">Sem senha · seus dados ficam no seu navegador</p>
    </div>`;
  document.body.appendChild(wrap);

  const input = wrap.querySelector('#auth-input');
  const go = wrap.querySelector('#auth-go');
  const usersEl = wrap.querySelector('#auth-users');

  const users = listUsers();
  if (users.length) {
    usersEl.innerHTML = '<span class="auth-users-lbl">Continuar como:</span>' +
      users.map(u => `<button class="auth-user-chip" data-user="${u}" type="button">${u}</button>`).join('');
    usersEl.querySelectorAll('.auth-user-chip').forEach(b => {
      b.addEventListener('click', () => finish(b.dataset.user));
    });
  }

  function finish(name) {
    name = (name || '').trim();
    if (name.length < 2) { input.focus(); return; }
    setCurrentUser(name);
    wrap.remove();
    onLoginResolve?.(name);
  }
  go.addEventListener('click', () => finish(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(input.value); }
  });
  setTimeout(() => input.focus(), 50);
}

let onLoginResolve = null;
export function ensureUser() {
  return new Promise((resolve) => {
    if (currentUser) { updateUserBadge(); resolve(currentUser); return; }
    onLoginResolve = resolve;
    buildModal();
  });
}

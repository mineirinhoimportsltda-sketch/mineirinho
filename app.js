// ══════════════════════════════════════════
// APP.JS — Router, nav, session
// ══════════════════════════════════════════

// Current user session
let currentUser = null;

// ── AUTH ──
async function checkAuth() {
  const sess = sessionStorage.getItem('user');
  if (sess) {
    currentUser = JSON.parse(sess);
    return true;
  }
  return false;
}

async function login(username, password) {
  const users = await dbGet('usuarios');
  const user = users.find(u => u.username === username && u.password === password && u.ativo);
  if (user) {
    // First run: create admin if no users
    currentUser = user;
    sessionStorage.setItem('user', JSON.stringify(user));
    return true;
  }
  return false;
}

async function firstTimeSetup() {
  const users = await dbGet('usuarios');
  if (!users || users.length === 0) {
    await dbAdd('usuarios', {
      id: 1,
      nome: 'Administrador',
      username: 'admin',
      password: '1234',
      perfil: 'admin',
      ativo: true,
      permissoes: { cadastro: true, lancamento: true, relatorios: true, configuracoes: true }
    });
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem('user');
  currentUser = null;
  showLogin();
}

// ── LOGIN SCREEN ──
function showLogin() {
  document.getElementById('app').style.display = 'none';
  let loginEl = document.getElementById('login-screen');
  if (!loginEl) {
    loginEl = document.createElement('div');
    loginEl.id = 'login-screen';
    loginEl.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);">
        <div style="width:380px">
          <div style="text-align:center;margin-bottom:32px">
            <div style="width:56px;height:56px;background:linear-gradient(135deg,var(--accent-blue),var(--accent-purple));border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px">💰</div>
            <h1 style="font-size:22px;font-weight:800">FinanceiroApp</h1>
            <p style="color:var(--text-secondary);font-size:13px;margin-top:4px">Controle Financeiro Profissional</p>
          </div>
          <div class="card">
            <div class="form-group">
              <label class="form-label">Usuário</label>
              <input type="text" class="form-control" id="login-user" value="admin" placeholder="admin">
            </div>
            <div class="form-group">
              <label class="form-label">Senha</label>
              <input type="password" class="form-control" id="login-pass" value="1234" placeholder="••••••">
            </div>
            <div id="login-error" class="alert alert-danger" style="display:none"></div>
            <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="doLogin()">
              🔐 Entrar
            </button>
            <p style="text-align:center;color:var(--text-muted);font-size:12px;margin-top:12px">Login padrão: admin / 1234</p>
          </div>
        </div>
      </div>`;
    document.body.appendChild(loginEl);
  }
  loginEl.style.display = 'block';
  document.getElementById('login-user').addEventListener('keydown', e => e.key === 'Enter' && doLogin());
  document.getElementById('login-pass').addEventListener('keydown', e => e.key === 'Enter' && doLogin());
}

async function doLogin() {
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;
  const ok = await login(user, pass);
  if (ok) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    updateUserInfo();
    navigate('dashboard');
  } else {
    const err = document.getElementById('login-error');
    err.textContent = 'Usuário ou senha inválidos';
    err.style.display = 'block';
  }
}

// ── NAVIGATION ──
const PAGES = {
  dashboard: { label: 'Dashboard', icon: '📊', fn: renderDashboard },
  receitas: { label: 'Lançar Receita', icon: '💚', fn: renderReceitas },
  despesas: { label: 'Lançar Despesa', icon: '❤️', fn: renderDespesas },
  contas_receber: { label: 'Contas a Receber', icon: '📥', fn: renderContasReceber },
  contas_pagar: { label: 'Contas a Pagar', icon: '📤', fn: renderContasPagar },
  extrato: { label: 'Extrato Comparativo', icon: '📋', fn: renderExtrato },
  transferencias: { label: 'Transferências', icon: '🔄', fn: renderTransferencias },
  cartao: { label: 'Cartão de Crédito', icon: '💳', fn: renderCartao },
  poupanca: { label: 'Poupança', icon: '🏦', fn: renderPoupanca },
  relatorios: { label: 'Relatórios', icon: '📑', fn: renderRelatorios },
  graficos: { label: 'Gráficos', icon: '📈', fn: renderGraficos },
  conciliacao: { label: 'Conciliação Bancária', icon: '🔍', fn: renderConciliacao },
  centros_custo: { label: 'Centro de Custo', icon: '🏢', fn: renderCentrosCusto },
  cadastros: { label: 'Cadastros', icon: '⚙️', fn: renderCadastros },
  usuarios: { label: 'Usuários', icon: '👥', fn: renderUsuarios },
  backup: { label: 'Backup', icon: '💾', fn: renderBackup },
};

let currentPage = '';

function navigate(page) {
  currentPage = page;
  // Update nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  // Update topbar title
  const p = PAGES[page];
  document.getElementById('page-title').textContent = p ? p.label : page;
  // Render
  const content = document.getElementById('content');
  content.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-muted)">Carregando...</div>';
  if (p && p.fn) p.fn(content);
}

function updateUserInfo() {
  if (currentUser) {
    document.getElementById('user-name').textContent = currentUser.nome;
  }
}

// ── INIT ──
async function init() {
  await openDB();
  await seedData();
  await firstTimeSetup();
  
  const authed = await checkAuth();
  if (!authed) {
    showLogin();
  } else {
    document.getElementById('app').style.display = 'flex';
    updateUserInfo();
    navigate('dashboard');
  }
}

window.addEventListener('DOMContentLoaded', init);

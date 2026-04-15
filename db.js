// ══════════════════════════════════════════
// DB.JS — IndexedDB wrapper + seed data
// ══════════════════════════════════════════

const DB_NAME = 'FinanceiroApp';
const DB_VERSION = 1;
let db;

const STORES = {
  empresa: 'empresa',
  usuarios: 'usuarios',
  contas: 'contas',
  clientes: 'clientes',
  fornecedores: 'fornecedores',
  formas_pagamento: 'formas_pagamento',
  categorias_receita: 'categorias_receita',
  categorias_despesa: 'categorias_despesa',
  centros_custo: 'centros_custo',
  receitas: 'receitas',
  parcelas_receita: 'parcelas_receita',
  despesas: 'despesas',
  parcelas_despesa: 'parcelas_despesa',
  poupanca: 'poupanca',
  transferencias: 'transferencias',
  cartao_credito: 'cartao_credito',
  faturas_cartao: 'faturas_cartao',
  lancamentos_cartao: 'lancamentos_cartao',
};

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      // Create all stores
      Object.values(STORES).forEach(name => {
        if (!d.objectStoreNames.contains(name)) {
          d.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
        }
      });
    };
  });
}

async function dbGet(store, id) {
  const d = await openDB();
  return new Promise((res, rej) => {
    const tx = d.transaction(store, 'readonly');
    const req = id !== undefined ? tx.objectStore(store).get(id) : tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function dbPut(store, data) {
  const d = await openDB();
  return new Promise((res, rej) => {
    const tx = d.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(data);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function dbAdd(store, data) {
  const d = await openDB();
  return new Promise((res, rej) => {
    const tx = d.transaction(store, 'readwrite');
    const req = tx.objectStore(store).add(data);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function dbDelete(store, id) {
  const d = await openDB();
  return new Promise((res, rej) => {
    const tx = d.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function dbClear(store) {
  const d = await openDB();
  return new Promise((res, rej) => {
    const tx = d.transaction(store, 'readwrite');
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
}

// ── SEED DEFAULT DATA ──
async function seedData() {
  const empresa = await dbGet('empresa');
  if (empresa && empresa.length > 0) return; // Already seeded

  // Empresa
  await dbAdd('empresa', { id: 1, nome: 'Minha Empresa', cnpj: '', email: '', telefone: '', endereco: '' });

  // Contas
  await dbAdd('contas', { id: 1, nome: 'Conta Principal', banco: 'Inter', agencia: '', conta: '', tipo: 'corrente', saldo_inicial: 0, ativo: true });
  await dbAdd('contas', { id: 2, nome: 'Nubank', banco: 'Nubank', agencia: '', conta: '', tipo: 'corrente', saldo_inicial: 0, ativo: true });
  await dbAdd('contas', { id: 3, nome: 'Caixa', banco: '', agencia: '', conta: '', tipo: 'caixa', saldo_inicial: 0, ativo: true });

  // Clientes
  await dbAdd('clientes', { id: 1, nome: 'Padrão', cpf_cnpj: '', email: '', telefone: '', ativo: true });

  // Fornecedores
  await dbAdd('fornecedores', { id: 1, nome: 'Padrão', cpf_cnpj: '', email: '', telefone: '', ativo: true });

  // Formas de pagamento
  await dbAdd('formas_pagamento', { id: 1, nome: 'Dinheiro', ativo: true });
  await dbAdd('formas_pagamento', { id: 2, nome: 'PIX', ativo: true });
  await dbAdd('formas_pagamento', { id: 3, nome: 'Cartão Débito', ativo: true });
  await dbAdd('formas_pagamento', { id: 4, nome: 'Cartão Crédito', ativo: true });
  await dbAdd('formas_pagamento', { id: 5, nome: 'Boleto', ativo: true });
  await dbAdd('formas_pagamento', { id: 6, nome: 'Transferência', ativo: true });
  await dbAdd('formas_pagamento', { id: 7, nome: 'TED/DOC', ativo: true });

  // Categorias receita
  await dbAdd('categorias_receita', { id: 1, nome: 'Vendas', ativo: true });
  await dbAdd('categorias_receita', { id: 2, nome: 'Salário', ativo: true });
  await dbAdd('categorias_receita', { id: 3, nome: 'Serviços', ativo: true });
  await dbAdd('categorias_receita', { id: 4, nome: 'Investimentos', ativo: true });
  await dbAdd('categorias_receita', { id: 5, nome: 'Outros', ativo: true });

  // Categorias despesa
  await dbAdd('categorias_despesa', { id: 1, nome: 'Aluguel', subcategoria: 'Única', ativo: true });
  await dbAdd('categorias_despesa', { id: 2, nome: 'Alimentação', subcategoria: 'Geral', ativo: true });
  await dbAdd('categorias_despesa', { id: 3, nome: 'Saúde', subcategoria: 'Geral', ativo: true });
  await dbAdd('categorias_despesa', { id: 4, nome: 'Transporte', subcategoria: 'Geral', ativo: true });
  await dbAdd('categorias_despesa', { id: 5, nome: 'Internet', subcategoria: 'Serviços', ativo: true });
  await dbAdd('categorias_despesa', { id: 6, nome: 'Despesas Administrativas', subcategoria: 'Administrativa', ativo: true });
  await dbAdd('categorias_despesa', { id: 7, nome: 'Impostos', subcategoria: 'Fiscal', ativo: true });
  await dbAdd('categorias_despesa', { id: 8, nome: 'Folha de Pagamento', subcategoria: 'RH', ativo: true });
  await dbAdd('categorias_despesa', { id: 9, nome: 'Outros', subcategoria: 'Geral', ativo: true });

  // Centros de custo
  await dbAdd('centros_custo', { id: 1, nome: 'Administrativo', codigo: '001', ativo: true });
  await dbAdd('centros_custo', { id: 2, nome: 'Comercial', codigo: '002', ativo: true });
  await dbAdd('centros_custo', { id: 3, nome: 'Operacional', codigo: '003', ativo: true });

  // Cartões
  await dbAdd('cartao_credito', { id: 1, nome: 'Nubank', bandeira: 'Mastercard', limite: 5000, dia_fechamento: 3, dia_vencimento: 10, conta_id: 2, ativo: true });

  console.log('Seed data loaded ✓');
}

// ── HELPERS ──
function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('pt-BR');
}

function parseCurrency(str) {
  if (typeof str === 'number') return str;
  return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split('T')[0];
}

function isoToInput(str) { return str ? str.split('T')[0] : ''; }

function getMonthYear(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// Toast notifications
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

// Modal helpers
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// Confirm dialog
function confirmDialog(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-header"><h2>⚠️ Confirmação</h2></div>
        <div class="modal-body"><p style="color:var(--text-secondary)">${msg}</p></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="conf-no">Cancelar</button>
          <button class="btn btn-danger" id="conf-yes">Confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#conf-yes').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#conf-no').onclick = () => { overlay.remove(); resolve(false); };
  });
}

// Number input mask
function maskCurrency(input) {
  input.addEventListener('input', function() {
    let v = this.value.replace(/\D/g, '');
    v = (parseInt(v) / 100).toFixed(2);
    this.value = v === 'NaN' ? '' : v;
  });
}

// Print
function printSection(html, title) {
  const w = window.open('', '', 'width=900,height=700');
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #000; }
    h2 { margin-bottom: 16px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #1a1a2e; color: #fff; padding: 8px; text-align: left; font-size: 11px; }
    td { padding: 6px 8px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) td { background: #f9f9f9; }
    .total { font-weight: bold; font-size: 13px; }
    .green { color: #10b981; } .red { color: #ef4444; }
    @media print { button { display: none !important; } }
  </style></head><body>
  <h2>${title}</h2>${html}
  <script>window.onload=()=>window.print()<\/script>
  </body></html>`);
  w.document.close();
}

// Export to CSV
function exportCSV(data, filename) {
  if (!data.length) { toast('Nenhum dado para exportar', 'warning'); return; }
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

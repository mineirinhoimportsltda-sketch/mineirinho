// ══════════════════════════════════════════
// CADASTROS.JS
// ══════════════════════════════════════════

async function renderCadastros(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-title">⚙️ Cadastros</div>
      <div class="tabs" id="cad-tabs">
        <div class="tab active" data-tab="empresa" onclick="switchCadTab('empresa')">🏢 Empresa</div>
        <div class="tab" data-tab="contas" onclick="switchCadTab('contas')">🏦 Contas</div>
        <div class="tab" data-tab="clientes" onclick="switchCadTab('clientes')">👤 Clientes</div>
        <div class="tab" data-tab="fornecedores" onclick="switchCadTab('fornecedores')">🏭 Fornecedores</div>
        <div class="tab" data-tab="formas" onclick="switchCadTab('formas')">💳 Formas Pgto</div>
        <div class="tab" data-tab="cat-receita" onclick="switchCadTab('cat-receita')">💚 Cat. Receita</div>
        <div class="tab" data-tab="cat-despesa" onclick="switchCadTab('cat-despesa')">❤️ Cat. Despesa</div>
        <div class="tab" data-tab="cartoes" onclick="switchCadTab('cartoes')">💳 Cartões</div>
      </div>
      <div id="cad-content"></div>
    </div>`;
  switchCadTab('empresa');
}

async function switchCadTab(tab) {
  document.querySelectorAll('#cad-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const c = document.getElementById('cad-content');
  switch (tab) {
    case 'empresa': renderCadEmpresa(c); break;
    case 'contas': renderCadContas(c); break;
    case 'clientes': renderCadList(c, 'clientes', 'Clientes', ['nome','cpf_cnpj','email','telefone']); break;
    case 'fornecedores': renderCadList(c, 'fornecedores', 'Fornecedores', ['nome','cpf_cnpj','email','telefone']); break;
    case 'formas': renderCadSimple(c, 'formas_pagamento', 'Formas de Pagamento'); break;
    case 'cat-receita': renderCadSimple(c, 'categorias_receita', 'Categorias de Receita'); break;
    case 'cat-despesa': renderCadCatDespesa(c); break;
    case 'cartoes': renderCadCartoes(c); break;
  }
}

async function renderCadEmpresa(c) {
  const empresa = (await dbGet('empresa'))[0] || {};
  c.innerHTML = `
    <div class="card" style="max-width:600px">
      <div class="card-title">Dados da Empresa</div>
      <div class="form-row cols-2">
        <div class="form-group"><label class="form-label">Nome da Empresa</label><input type="text" class="form-control" id="emp-nome" value="${empresa.nome||''}"></div>
        <div class="form-group"><label class="form-label">CNPJ</label><input type="text" class="form-control" id="emp-cnpj" value="${empresa.cnpj||''}"></div>
        <div class="form-group"><label class="form-label">E-mail</label><input type="text" class="form-control" id="emp-email" value="${empresa.email||''}"></div>
        <div class="form-group"><label class="form-label">Telefone</label><input type="text" class="form-control" id="emp-tel" value="${empresa.telefone||''}"></div>
      </div>
      <div class="form-group"><label class="form-label">Endereço</label><input type="text" class="form-control" id="emp-end" value="${empresa.endereco||''}"></div>
      <button class="btn btn-primary" onclick="salvarEmpresa()">💾 Salvar</button>
    </div>`;
}

async function salvarEmpresa() {
  const empresa = (await dbGet('empresa'))[0] || { id: 1 };
  await dbPut('empresa', { ...empresa, nome: document.getElementById('emp-nome').value, cnpj: document.getElementById('emp-cnpj').value, email: document.getElementById('emp-email').value, telefone: document.getElementById('emp-tel').value, endereco: document.getElementById('emp-end').value });
  toast('Dados salvos!', 'success');
}

async function renderCadContas(c) {
  const contas = await dbGet('contas');
  c.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-header" style="margin-bottom:0">
        <div></div>
        <button class="btn btn-primary btn-sm" onclick="openModalConta()">+ Nova Conta</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Banco</th><th>Tipo</th><th>Saldo Inicial</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            ${contas.map(ct => `<tr>
              <td>${ct.nome}</td><td>${ct.banco||'-'}</td><td>${ct.tipo}</td>
              <td class="td-mono">${formatCurrency(ct.saldo_inicial)}</td>
              <td><span class="badge ${ct.ativo?'badge-green':'badge-gray'}">${ct.ativo?'Ativo':'Inativo'}</span></td>
              <td><div class="action-btns">
                <button class="btn-icon btn-icon-red" onclick="excluirCad('contas',${ct.id},renderCadContas.bind(null,document.getElementById('cad-content')))">🗑️</button>
              </div></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="modal-conta" class="modal-overlay" style="display:none">
      <div class="modal" style="max-width:450px">
        <div class="modal-header"><h2>🏦 Nova Conta</h2><button class="modal-close" onclick="closeModal('modal-conta')">✕</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Nome *</label><input type="text" class="form-control" id="ct-nome"></div>
          <div class="form-row cols-2">
            <div class="form-group"><label class="form-label">Banco</label><input type="text" class="form-control" id="ct-banco"></div>
            <div class="form-group"><label class="form-label">Tipo</label>
              <select class="form-control" id="ct-tipo"><option value="corrente">Corrente</option><option value="poupanca">Poupança</option><option value="caixa">Caixa</option><option value="investimento">Investimento</option></select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Saldo Inicial</label><input type="number" step="0.01" class="form-control" id="ct-saldo" value="0"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-conta')">Cancelar</button>
          <button class="btn btn-primary" onclick="salvarConta()">💾 Salvar</button>
        </div>
      </div>
    </div>`;
}

function openModalConta() { openModal('modal-conta'); }
async function salvarConta() {
  const nome = document.getElementById('ct-nome').value;
  if (!nome) { toast('Nome obrigatório!', 'error'); return; }
  await dbAdd('contas', { nome, banco: document.getElementById('ct-banco').value, tipo: document.getElementById('ct-tipo').value, saldo_inicial: parseFloat(document.getElementById('ct-saldo').value)||0, ativo: true });
  closeModal('modal-conta');
  toast('Conta salva!', 'success');
  renderCadContas(document.getElementById('cad-content'));
}

async function renderCadList(c, store, title, fields) {
  const items = await dbGet(store);
  const labels = { nome: 'Nome', cpf_cnpj: 'CPF/CNPJ', email: 'E-mail', telefone: 'Telefone' };
  c.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:flex-end">
        <button class="btn btn-primary btn-sm" onclick="openModalCadItem('${store}','${title}','${fields.join(',')}')">+ Novo</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>${fields.map(f => `<th>${labels[f]||f}</th>`).join('')}<th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            ${items.map(item => `<tr>
              ${fields.map(f => `<td>${item[f]||'-'}</td>`).join('')}
              <td><span class="badge ${item.ativo?'badge-green':'badge-gray'}">${item.ativo?'Ativo':'Inativo'}</span></td>
              <td><button class="btn-icon btn-icon-red" onclick="excluirCad('${store}',${item.id},()=>renderCadList(document.getElementById('cad-content'),'${store}','${title}','${fields}'.split(',')))">🗑️</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

let _cadItemCallback = null;
function openModalCadItem(store, title, fieldsStr) {
  const fields = fieldsStr.split(',');
  const labels = { nome: 'Nome', cpf_cnpj: 'CPF/CNPJ', email: 'E-mail', telefone: 'Telefone' };
  let overlay = document.getElementById('modal-cad-item');
  if (!overlay) { overlay = document.createElement('div'); overlay.id = 'modal-cad-item'; overlay.className = 'modal-overlay'; document.body.appendChild(overlay); }
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header"><h2>${title}</h2><button class="modal-close" onclick="document.getElementById('modal-cad-item').style.display='none'">✕</button></div>
      <div class="modal-body">
        ${fields.map(f => `<div class="form-group"><label class="form-label">${labels[f]||f}</label><input type="text" class="form-control" id="cad-${f}" placeholder="${labels[f]||f}"></div>`).join('')}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('modal-cad-item').style.display='none'">Cancelar</button>
        <button class="btn btn-primary" onclick="salvarCadItem('${store}','${fieldsStr}')">💾 Salvar</button>
      </div>
    </div>`;
  overlay.style.display = 'flex';
  _cadItemCallback = () => { const c = document.getElementById('cad-content'); renderCadList(c, store, title, fields); };
}

async function salvarCadItem(store, fieldsStr) {
  const fields = fieldsStr.split(',');
  const obj = { ativo: true };
  for (const f of fields) { obj[f] = document.getElementById('cad-'+f)?.value || ''; }
  if (!obj.nome) { toast('Nome obrigatório!', 'error'); return; }
  await dbAdd(store, obj);
  document.getElementById('modal-cad-item').style.display = 'none';
  toast('Salvo!', 'success');
  if (_cadItemCallback) _cadItemCallback();
}

async function renderCadSimple(c, store, title) {
  const items = await dbGet(store);
  c.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;gap:8px;align-items:flex-end">
        <div class="form-group" style="flex:1;margin-bottom:0"><input type="text" class="form-control" id="cad-simple-nome" placeholder="Nome..."></div>
        <button class="btn btn-primary" onclick="salvarCadSimple('${store}')">+ Adicionar</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            ${items.map(it => `<tr>
              <td>${it.nome}</td>
              <td><span class="badge ${it.ativo?'badge-green':'badge-gray'}">${it.ativo?'Ativo':'Inativo'}</span></td>
              <td><button class="btn-icon btn-icon-red" onclick="excluirCad('${store}',${it.id},()=>renderCadSimple(document.getElementById('cad-content'),'${store}','${title}'))">🗑️</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

async function salvarCadSimple(store) {
  const nome = document.getElementById('cad-simple-nome').value;
  if (!nome) { toast('Digite o nome!', 'error'); return; }
  await dbAdd(store, { nome, ativo: true });
  document.getElementById('cad-simple-nome').value = '';
  toast('Adicionado!', 'success');
  const c = document.getElementById('cad-content');
  const titles = { formas_pagamento: 'Formas de Pagamento', categorias_receita: 'Categorias de Receita' };
  renderCadSimple(c, store, titles[store]||'');
}

async function renderCadCatDespesa(c) {
  const items = await dbGet('categorias_despesa');
  c.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;gap:8px;align-items:flex-end">
        <div class="form-group" style="flex:1;margin-bottom:0"><input type="text" class="form-control" id="cat-desp-nome" placeholder="Categoria..."></div>
        <div class="form-group" style="flex:1;margin-bottom:0"><input type="text" class="form-control" id="cat-desp-sub" placeholder="Sub-categoria..."></div>
        <button class="btn btn-primary" onclick="salvarCatDespesa()">+ Adicionar</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Categoria</th><th>Sub-categoria</th><th>Ações</th></tr></thead>
          <tbody>
            ${items.map(it => `<tr>
              <td>${it.nome}</td><td>${it.subcategoria||'-'}</td>
              <td><button class="btn-icon btn-icon-red" onclick="excluirCad('categorias_despesa',${it.id},()=>renderCadCatDespesa(document.getElementById('cad-content')))">🗑️</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

async function salvarCatDespesa() {
  const nome = document.getElementById('cat-desp-nome').value;
  const sub = document.getElementById('cat-desp-sub').value;
  if (!nome) { toast('Digite a categoria!', 'error'); return; }
  await dbAdd('categorias_despesa', { nome, subcategoria: sub, ativo: true });
  toast('Adicionado!', 'success');
  renderCadCatDespesa(document.getElementById('cad-content'));
}

async function renderCadCartoes(c) {
  const cartoes = await dbGet('cartao_credito');
  const contas = await dbGet('contas');
  c.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:flex-end">
        <button class="btn btn-primary btn-sm" onclick="openModalCartao()">+ Novo Cartão</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Bandeira</th><th>Limite</th><th>Fechamento</th><th>Vencimento</th><th>Ações</th></tr></thead>
          <tbody>
            ${cartoes.map(ct => `<tr>
              <td>${ct.nome}</td><td>${ct.bandeira}</td><td class="td-mono">${formatCurrency(ct.limite)}</td>
              <td>Dia ${ct.dia_fechamento}</td><td>Dia ${ct.dia_vencimento}</td>
              <td><button class="btn-icon btn-icon-red" onclick="excluirCad('cartao_credito',${ct.id},()=>renderCadCartoes(document.getElementById('cad-content')))">🗑️</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <div id="modal-cartao" class="modal-overlay" style="display:none">
      <div class="modal" style="max-width:450px">
        <div class="modal-header"><h2>💳 Novo Cartão</h2><button class="modal-close" onclick="closeModal('modal-cartao')">✕</button></div>
        <div class="modal-body">
          <div class="form-row cols-2">
            <div class="form-group"><label class="form-label">Nome</label><input type="text" class="form-control" id="cart-nome"></div>
            <div class="form-group"><label class="form-label">Bandeira</label>
              <select class="form-control" id="cart-band"><option>Visa</option><option>Mastercard</option><option>Elo</option><option>Amex</option></select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Limite</label><input type="number" step="0.01" class="form-control" id="cart-lim"></div>
          <div class="form-row cols-2">
            <div class="form-group"><label class="form-label">Dia Fechamento</label><input type="number" class="form-control" id="cart-fech" min="1" max="31" value="1"></div>
            <div class="form-group"><label class="form-label">Dia Vencimento</label><input type="number" class="form-control" id="cart-venc" min="1" max="31" value="10"></div>
          </div>
          <div class="form-group"><label class="form-label">Conta para débito</label>
            <select class="form-control" id="cart-conta">${contas.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}</select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-cartao')">Cancelar</button>
          <button class="btn btn-primary" onclick="salvarCartao()">💾 Salvar</button>
        </div>
      </div>
    </div>`;
}

function openModalCartao() { openModal('modal-cartao'); }
async function salvarCartao() {
  await dbAdd('cartao_credito', {
    nome: document.getElementById('cart-nome').value,
    bandeira: document.getElementById('cart-band').value,
    limite: parseFloat(document.getElementById('cart-lim').value)||0,
    dia_fechamento: parseInt(document.getElementById('cart-fech').value),
    dia_vencimento: parseInt(document.getElementById('cart-venc').value),
    conta_id: parseInt(document.getElementById('cart-conta').value),
    ativo: true
  });
  closeModal('modal-cartao');
  toast('Cartão salvo!', 'success');
  renderCadCartoes(document.getElementById('cad-content'));
}

async function excluirCad(store, id, callback) {
  if (!(await confirmDialog('Excluir este registro?'))) return;
  await dbDelete(store, id);
  toast('Excluído!', 'success');
  if (callback) callback();
}

// ── CENTROS DE CUSTO ──
async function renderCentrosCusto(container) {
  const centros = await dbGet('centros_custo');
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-header">
        <div class="section-title">🏢 Centro de Custo</div>
        <button class="btn btn-primary" onclick="openModalCC()">+ Novo Centro</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Nome</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody id="tbody-cc">
              ${centros.map(c => `<tr>
                <td>${c.codigo}</td><td>${c.nome}</td>
                <td><span class="badge ${c.ativo?'badge-green':'badge-gray'}">${c.ativo?'Ativo':'Inativo'}</span></td>
                <td><button class="btn-icon btn-icon-red" onclick="excluirCC(${c.id})">🗑️</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div id="modal-cc" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-cc')">
      <div class="modal" style="max-width:380px">
        <div class="modal-header"><h2>🏢 Novo Centro de Custo</h2><button class="modal-close" onclick="closeModal('modal-cc')">✕</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Código</label><input type="text" class="form-control" id="cc-cod" placeholder="001"></div>
          <div class="form-group"><label class="form-label">Nome *</label><input type="text" class="form-control" id="cc-nome" placeholder="Ex: Comercial"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-cc')">Cancelar</button>
          <button class="btn btn-primary" onclick="salvarCC()">💾 Salvar</button>
        </div>
      </div>
    </div>`;
}

function openModalCC() { openModal('modal-cc'); }
async function salvarCC() {
  const nome = document.getElementById('cc-nome').value;
  if (!nome) { toast('Nome obrigatório!', 'error'); return; }
  await dbAdd('centros_custo', { codigo: document.getElementById('cc-cod').value, nome, ativo: true });
  closeModal('modal-cc');
  toast('Salvo!', 'success');
  renderCentrosCusto(document.getElementById('content'));
}

async function excluirCC(id) {
  if (!(await confirmDialog('Excluir este centro de custo?'))) return;
  await dbDelete('centros_custo', id);
  renderCentrosCusto(document.getElementById('content'));
}

// ── USUÁRIOS ──
async function renderUsuarios(container) {
  const usuarios = await dbGet('usuarios');
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-header">
        <div class="section-title">👥 Usuários e Permissões</div>
        <button class="btn btn-primary" onclick="openModalUser()">+ Novo Usuário</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Usuário</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              ${usuarios.map(u => `<tr>
                <td>${u.nome}</td><td>${u.username}</td>
                <td><span class="badge badge-blue">${u.perfil}</span></td>
                <td><span class="badge ${u.ativo?'badge-green':'badge-gray'}">${u.ativo?'Ativo':'Inativo'}</span></td>
                <td><button class="btn-icon btn-icon-red" onclick="excluirUsuario(${u.id})">🗑️</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div id="modal-user" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-user')">
      <div class="modal" style="max-width:420px">
        <div class="modal-header"><h2>👤 Novo Usuário</h2><button class="modal-close" onclick="closeModal('modal-user')">✕</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Nome Completo *</label><input type="text" class="form-control" id="u-nome"></div>
          <div class="form-row cols-2">
            <div class="form-group"><label class="form-label">Username *</label><input type="text" class="form-control" id="u-user"></div>
            <div class="form-group"><label class="form-label">Senha *</label><input type="password" class="form-control" id="u-pass"></div>
          </div>
          <div class="form-group"><label class="form-label">Perfil</label>
            <select class="form-control" id="u-perfil"><option value="admin">Administrador</option><option value="operador">Operador</option><option value="consulta">Apenas Consulta</option></select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-user')">Cancelar</button>
          <button class="btn btn-primary" onclick="salvarUsuario()">💾 Salvar</button>
        </div>
      </div>
    </div>`;
}

function openModalUser() { openModal('modal-user'); }
async function salvarUsuario() {
  const nome = document.getElementById('u-nome').value;
  const username = document.getElementById('u-user').value;
  const password = document.getElementById('u-pass').value;
  if (!nome || !username || !password) { toast('Preencha todos os campos!', 'error'); return; }
  await dbAdd('usuarios', { nome, username, password, perfil: document.getElementById('u-perfil').value, ativo: true });
  closeModal('modal-user');
  toast('Usuário criado!', 'success');
  renderUsuarios(document.getElementById('content'));
}

async function excluirUsuario(id) {
  if (id === currentUser?.id) { toast('Não pode excluir o usuário logado!', 'error'); return; }
  if (!(await confirmDialog('Excluir este usuário?'))) return;
  await dbDelete('usuarios', id);
  renderUsuarios(document.getElementById('content'));
}

// ── BACKUP ──
async function renderBackup(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-title">💾 Backup e Restauração</div>
      <div class="grid-2">
        <div class="card">
          <div class="card-title">📤 Exportar Backup</div>
          <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">Exporta todos os dados do sistema em formato JSON para guardar em segurança.</p>
          <button class="btn btn-success" onclick="exportarBackup()">💾 Baixar Backup JSON</button>
        </div>
        <div class="card">
          <div class="card-title">📥 Restaurar Backup</div>
          <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">Importa um arquivo JSON de backup. <strong style="color:var(--accent-red)">Atenção: substitui todos os dados!</strong></p>
          <div class="form-group"><input type="file" class="form-control" id="backup-file" accept=".json"></div>
          <button class="btn btn-danger" onclick="importarBackup()">⚠️ Restaurar Backup</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📊 Exportar Dados CSV</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-secondary" onclick="exportarCSVDados('parcelas_receita','receitas')">📥 Receitas CSV</button>
          <button class="btn btn-secondary" onclick="exportarCSVDados('parcelas_despesa','despesas')">📥 Despesas CSV</button>
          <button class="btn btn-secondary" onclick="exportarCSVDados('transferencias','transferencias')">📥 Transferências CSV</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="color:var(--accent-red)">⚠️ Zona de Perigo</div>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:12px">Apaga permanentemente todos os lançamentos (receitas, despesas, transferências). Os cadastros são mantidos.</p>
        <button class="btn btn-danger" onclick="limparLancamentos()">🗑️ Limpar Todos os Lançamentos</button>
      </div>
    </div>`;
}

async function exportarBackup() {
  const backup = {};
  for (const store of Object.values(STORES)) {
    backup[store] = await dbGet(store);
  }
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `financeiro_backup_${today()}.json`;
  a.click();
  toast('Backup exportado!', 'success');
}

async function importarBackup() {
  const file = document.getElementById('backup-file').files[0];
  if (!file) { toast('Selecione um arquivo!', 'error'); return; }
  if (!(await confirmDialog('ATENÇÃO: Todos os dados atuais serão substituídos pelo backup. Confirmar?'))) return;
  const text = await file.text();
  const backup = JSON.parse(text);
  for (const [store, data] of Object.entries(backup)) {
    if (Object.values(STORES).includes(store)) {
      await dbClear(store);
      for (const item of data) await dbPut(store, item);
    }
  }
  toast('Backup restaurado!', 'success');
  setTimeout(() => location.reload(), 1500);
}

async function exportarCSVDados(store, filename) {
  const data = await dbGet(store);
  exportCSV(data, `${filename}_${today()}.csv`);
}

async function limparLancamentos() {
  if (!(await confirmDialog('ATENÇÃO: Isso apagará TODAS as receitas, despesas e lançamentos. Esta ação não pode ser desfeita!'))) return;
  for (const store of ['receitas','parcelas_receita','despesas','parcelas_despesa','transferencias','poupanca','lancamentos_cartao']) {
    await dbClear(store);
  }
  toast('Lançamentos limpos!', 'success');
  navigate('dashboard');
}

// ══════════════════════════════════════════
// LANCAMENTOS.JS — Receitas e Despesas
// ══════════════════════════════════════════

// ── RECEITAS ──
async function renderReceitas(container) {
  const [cats, contas, clientes, formas, receitas] = await Promise.all([
    dbGet('categorias_receita'), dbGet('contas'), dbGet('clientes'),
    dbGet('formas_pagamento'), dbGet('receitas')
  ]);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-header">
        <div class="section-title">💚 Lançamento de Receitas</div>
        <button class="btn btn-success" onclick="openModalReceita()">+ Nova Receita</button>
      </div>

      <!-- List -->
      <div class="card">
        <div class="card-title">Receitas Cadastradas</div>
        <div class="table-wrap">
          <table id="tbl-receitas">
            <thead><tr>
              <th>#</th><th>Data Lanç.</th><th>Conta</th><th>Tipo</th>
              <th>Cliente</th><th>Descrição</th><th>Parcelas</th><th>Total</th><th>Ações</th>
            </tr></thead>
            <tbody id="tbody-receitas">
              <tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:24px">Carregando...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Nova Receita -->
    <div id="modal-receita" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-receita')">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2 id="modal-receita-title">💚 Nova Receita</h2>
          <button class="modal-close" onclick="closeModal('modal-receita')">✕</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="rec-id">
          <div class="form-row cols-3">
            <div class="form-group">
              <label class="form-label">Conta *</label>
              <select class="form-control" id="rec-conta">
                ${contas.filter(c=>c.ativo).map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tipo (Categoria) *</label>
              <select class="form-control" id="rec-tipo">
                ${cats.filter(c=>c.ativo).map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Cliente</label>
              <select class="form-control" id="rec-cliente">
                ${clientes.filter(c=>c.ativo).map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Forma de Pagamento *</label>
              <select class="form-control" id="rec-forma">
                ${formas.filter(f=>f.ativo).map(f=>`<option value="${f.id}">${f.nome}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nº Documento</label>
              <input type="text" class="form-control" id="rec-doc" placeholder="Opcional">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Descrição Adicional</label>
            <input type="text" class="form-control" id="rec-descricao" placeholder="Descrição...">
          </div>
          <div class="form-row cols-4">
            <div class="form-group">
              <label class="form-label">Data 1ª Parcela *</label>
              <input type="date" class="form-control" id="rec-data1" value="${today()}">
            </div>
            <div class="form-group">
              <label class="form-label">Valor da Parcela *</label>
              <input type="number" step="0.01" class="form-control" id="rec-valor" placeholder="0,00">
            </div>
            <div class="form-group">
              <label class="form-label">Qtde Parcelas *</label>
              <input type="number" class="form-control" id="rec-qtde" value="1" min="1" max="360">
            </div>
            <div class="form-group">
              <label class="form-label">Valor Total</label>
              <input type="text" class="form-control" id="rec-total" readonly placeholder="Auto">
            </div>
          </div>
          <button class="btn btn-success" onclick="gerarParcelasReceita()" style="margin-bottom:16px">🔄 Gerar Parcelas</button>
          
          <!-- Parcelas geradas -->
          <div id="rec-parcelas-section" style="display:none">
            <div class="card-title" style="margin-bottom:8px">Parcelas Geradas</div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Forma Pgto</th><th>Conta</th><th>Recebido?</th></tr></thead>
                <tbody id="tbody-parcelas-rec"></tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-receita')">Cancelar</button>
          <button class="btn btn-success" onclick="salvarReceita()">💾 Salvar Receita</button>
        </div>
      </div>
    </div>`;

  loadReceitasList();
  
  // Auto-calc total
  ['rec-valor','rec-qtde'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      const v = parseFloat(document.getElementById('rec-valor').value) || 0;
      const q = parseInt(document.getElementById('rec-qtde').value) || 1;
      document.getElementById('rec-total').value = formatCurrency(v * q);
    });
  });
}

let parcelasReceitaTemp = [];

function gerarParcelasReceita() {
  const data1 = document.getElementById('rec-data1').value;
  const valor = parseFloat(document.getElementById('rec-valor').value) || 0;
  const qtde = parseInt(document.getElementById('rec-qtde').value) || 1;
  const formaId = document.getElementById('rec-forma').value;
  const contaId = document.getElementById('rec-conta').value;

  if (!data1 || valor <= 0) { toast('Preencha data e valor!', 'error'); return; }

  parcelasReceitaTemp = [];
  for (let i = 0; i < qtde; i++) {
    parcelasReceitaTemp.push({
      numero: i + 1,
      total: qtde,
      vencimento: addMonths(data1, i),
      valor: valor,
      forma_id: formaId,
      conta_id: contaId,
      recebido: false,
      dt_pagamento: null,
      valor_pago: 0,
    });
  }
  renderParcelasRecTable();
  document.getElementById('rec-parcelas-section').style.display = 'block';
  document.getElementById('rec-total').value = formatCurrency(valor * qtde);
  toast(`${qtde} parcela(s) gerada(s)!`, 'success');
}

function renderParcelasRecTable() {
  const tbody = document.getElementById('tbody-parcelas-rec');
  tbody.innerHTML = parcelasReceitaTemp.map((p, i) => `
    <tr>
      <td>${p.numero}/${p.total}</td>
      <td>${formatDate(p.vencimento)}</td>
      <td class="td-mono col-green">${formatCurrency(p.valor)}</td>
      <td>-</td><td>-</td>
      <td><input type="checkbox" ${p.recebido?'checked':''} onchange="parcelasReceitaTemp[${i}].recebido=this.checked"></td>
    </tr>`).join('');
}

async function salvarReceita() {
  const data1 = document.getElementById('rec-data1').value;
  const valor = parseFloat(document.getElementById('rec-valor').value) || 0;
  const qtde = parseInt(document.getElementById('rec-qtde').value) || 1;

  if (!data1 || valor <= 0) { toast('Preencha todos os campos obrigatórios!', 'error'); return; }
  if (parcelasReceitaTemp.length === 0) { toast('Clique em "Gerar Parcelas" primeiro!', 'error'); return; }

  const [cats, contas, clientes, formas] = await Promise.all([
    dbGet('categorias_receita'), dbGet('contas'), dbGet('clientes'), dbGet('formas_pagamento')
  ]);

  const tipoId = parseInt(document.getElementById('rec-tipo').value);
  const contaId = parseInt(document.getElementById('rec-conta').value);
  const clienteId = parseInt(document.getElementById('rec-cliente').value);
  const formaId = parseInt(document.getElementById('rec-forma').value);

  const cat = cats.find(c => c.id === tipoId);
  const conta = contas.find(c => c.id === contaId);
  const cliente = clientes.find(c => c.id === clienteId);
  const forma = formas.find(f => f.id === formaId);

  const receitaId = await dbAdd('receitas', {
    data_lancamento: today(),
    conta_id: contaId,
    conta_nome: conta?.nome,
    tipo_id: tipoId,
    tipo_nome: cat?.nome,
    cliente_id: clienteId,
    cliente_nome: cliente?.nome,
    forma_id: formaId,
    forma_nome: forma?.nome,
    descricao: document.getElementById('rec-descricao').value,
    doc: document.getElementById('rec-doc').value,
    data_primeira: data1,
    valor_parcela: valor,
    qtde_parcelas: qtde,
    valor_total: valor * qtde,
    recebido: parcelasReceitaTemp.every(p => p.recebido),
  });

  // Save parcelas
  for (const p of parcelasReceitaTemp) {
    await dbAdd('parcelas_receita', {
      receita_id: receitaId,
      numero: p.numero,
      total: p.total,
      vencimento: p.vencimento,
      valor: p.valor,
      forma_id: formaId,
      forma_nome: forma?.nome,
      conta_id: contaId,
      conta_nome: conta?.nome,
      tipo_nome: cat?.nome,
      cliente_nome: cliente?.nome,
      descricao: document.getElementById('rec-descricao').value,
      dt_pagamento: p.recebido ? today() : null,
      valor_pago: p.recebido ? p.valor : 0,
      categoria: cat?.nome,
    });
  }

  parcelasReceitaTemp = [];
  closeModal('modal-receita');
  toast('Receita salva com sucesso!', 'success');
  loadReceitasList();
}

async function loadReceitasList() {
  const receitas = await dbGet('receitas');
  const tbody = document.getElementById('tbody-receitas');
  if (!tbody) return;
  if (receitas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:24px">Nenhuma receita lançada</td></tr>';
    return;
  }
  tbody.innerHTML = receitas.slice().reverse().map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${formatDate(r.data_lancamento)}</td>
      <td>${r.conta_nome}</td>
      <td><span class="badge badge-green">${r.tipo_nome}</span></td>
      <td>${r.cliente_nome}</td>
      <td style="color:var(--text-secondary)">${r.descricao||'-'}</td>
      <td>${r.qtde_parcelas}x</td>
      <td class="td-mono col-green">${formatCurrency(r.valor_total)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-icon-red" onclick="excluirReceita(${r.id})" title="Excluir">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
}

async function excluirReceita(id) {
  if (!(await confirmDialog('Excluir esta receita e todas as suas parcelas?'))) return;
  const parcelas = await dbGet('parcelas_receita');
  for (const p of parcelas.filter(p => p.receita_id === id)) await dbDelete('parcelas_receita', p.id);
  await dbDelete('receitas', id);
  toast('Receita excluída!', 'success');
  loadReceitasList();
}

function openModalReceita() {
  parcelasReceitaTemp = [];
  document.getElementById('rec-id').value = '';
  document.getElementById('rec-descricao').value = '';
  document.getElementById('rec-doc').value = '';
  document.getElementById('rec-data1').value = today();
  document.getElementById('rec-valor').value = '';
  document.getElementById('rec-qtde').value = '1';
  document.getElementById('rec-total').value = '';
  document.getElementById('rec-parcelas-section').style.display = 'none';
  document.getElementById('modal-receita-title').textContent = '💚 Nova Receita';
  openModal('modal-receita');
}

// ── DESPESAS ──
async function renderDespesas(container) {
  const [cats, contas, fornecedores, formas, despesas] = await Promise.all([
    dbGet('categorias_despesa'), dbGet('contas'), dbGet('fornecedores'),
    dbGet('formas_pagamento'), dbGet('despesas')
  ]);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-header">
        <div class="section-title">❤️ Lançamento de Despesas</div>
        <button class="btn btn-danger" onclick="openModalDespesa()">+ Nova Despesa</button>
      </div>
      <div class="card">
        <div class="card-title">Despesas Cadastradas</div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>#</th><th>Data Lanç.</th><th>Conta</th><th>Categoria</th>
              <th>Fornecedor</th><th>Descrição</th><th>Parcelas</th><th>Total</th><th>Ações</th>
            </tr></thead>
            <tbody id="tbody-despesas">
              <tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:24px">Carregando...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div id="modal-despesa" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-despesa')">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2>❤️ Nova Despesa</h2>
          <button class="modal-close" onclick="closeModal('modal-despesa')">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row cols-3">
            <div class="form-group">
              <label class="form-label">Conta *</label>
              <select class="form-control" id="desp-conta">
                ${contas.filter(c=>c.ativo).map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Categoria *</label>
              <select class="form-control" id="desp-cat">
                ${cats.filter(c=>c.ativo).map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fornecedor</label>
              <select class="form-control" id="desp-forn">
                ${fornecedores.filter(f=>f.ativo).map(f=>`<option value="${f.id}">${f.nome}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Forma de Pagamento *</label>
              <select class="form-control" id="desp-forma">
                ${formas.filter(f=>f.ativo).map(f=>`<option value="${f.id}">${f.nome}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nº Documento</label>
              <input type="text" class="form-control" id="desp-doc">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <input type="text" class="form-control" id="desp-descricao">
          </div>
          <div class="form-row cols-4">
            <div class="form-group">
              <label class="form-label">Data 1ª Parcela *</label>
              <input type="date" class="form-control" id="desp-data1" value="${today()}">
            </div>
            <div class="form-group">
              <label class="form-label">Valor Parcela *</label>
              <input type="number" step="0.01" class="form-control" id="desp-valor">
            </div>
            <div class="form-group">
              <label class="form-label">Qtde Parcelas *</label>
              <input type="number" class="form-control" id="desp-qtde" value="1" min="1">
            </div>
            <div class="form-group">
              <label class="form-label">Valor Total</label>
              <input type="text" class="form-control" id="desp-total" readonly>
            </div>
          </div>
          <button class="btn btn-danger" onclick="gerarParcelasDespesa()" style="margin-bottom:16px">🔄 Gerar Despesa</button>
          <div id="desp-parcelas-section" style="display:none">
            <div class="card-title" style="margin-bottom:8px">Parcelas Geradas</div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Quitado?</th></tr></thead>
                <tbody id="tbody-parcelas-desp"></tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-despesa')">Cancelar</button>
          <button class="btn btn-danger" onclick="salvarDespesa()">💾 Salvar Despesa</button>
        </div>
      </div>
    </div>`;

  loadDespesasList();

  ['desp-valor','desp-qtde'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      const v = parseFloat(document.getElementById('desp-valor').value) || 0;
      const q = parseInt(document.getElementById('desp-qtde').value) || 1;
      document.getElementById('desp-total').value = formatCurrency(v * q);
    });
  });
}

let parcelasDespesaTemp = [];

function gerarParcelasDespesa() {
  const data1 = document.getElementById('desp-data1').value;
  const valor = parseFloat(document.getElementById('desp-valor').value) || 0;
  const qtde = parseInt(document.getElementById('desp-qtde').value) || 1;
  if (!data1 || valor <= 0) { toast('Preencha data e valor!', 'error'); return; }
  parcelasDespesaTemp = [];
  for (let i = 0; i < qtde; i++) {
    parcelasDespesaTemp.push({ numero: i+1, total: qtde, vencimento: addMonths(data1, i), valor, quitado: false, dt_pagamento: null, valor_pago: 0 });
  }
  document.getElementById('tbody-parcelas-desp').innerHTML = parcelasDespesaTemp.map((p,i) => `
    <tr>
      <td>${p.numero}/${p.total}</td>
      <td>${formatDate(p.vencimento)}</td>
      <td class="td-mono col-red">${formatCurrency(p.valor)}</td>
      <td><input type="checkbox" onchange="parcelasDespesaTemp[${i}].quitado=this.checked"></td>
    </tr>`).join('');
  document.getElementById('desp-parcelas-section').style.display = 'block';
  document.getElementById('desp-total').value = formatCurrency(valor * qtde);
  toast(`${qtde} parcela(s) gerada(s)!`, 'success');
}

async function salvarDespesa() {
  if (parcelasDespesaTemp.length === 0) { toast('Gere as parcelas primeiro!', 'error'); return; }
  const valor = parseFloat(document.getElementById('desp-valor').value) || 0;
  const qtde = parseInt(document.getElementById('desp-qtde').value) || 1;
  if (valor <= 0) { toast('Preencha o valor!', 'error'); return; }

  const [cats, contas, forns, formas] = await Promise.all([
    dbGet('categorias_despesa'), dbGet('contas'), dbGet('fornecedores'), dbGet('formas_pagamento')
  ]);
  const catId = parseInt(document.getElementById('desp-cat').value);
  const contaId = parseInt(document.getElementById('desp-conta').value);
  const fornId = parseInt(document.getElementById('desp-forn').value);
  const formaId = parseInt(document.getElementById('desp-forma').value);
  const cat = cats.find(c => c.id === catId);
  const conta = contas.find(c => c.id === contaId);
  const forn = forns.find(f => f.id === fornId);
  const forma = formas.find(f => f.id === formaId);

  const despId = await dbAdd('despesas', {
    data_lancamento: today(), data_emissao: today(),
    conta_id: contaId, conta_nome: conta?.nome,
    cat_id: catId, cat_nome: cat?.nome, subcat: cat?.subcategoria,
    forn_id: fornId, forn_nome: forn?.nome,
    forma_id: formaId, forma_nome: forma?.nome,
    descricao: document.getElementById('desp-descricao').value,
    doc: document.getElementById('desp-doc').value,
    data_primeira: document.getElementById('desp-data1').value,
    valor_parcela: valor, qtde_parcelas: qtde, valor_total: valor * qtde,
    quitado: parcelasDespesaTemp.every(p => p.quitado),
  });

  for (const p of parcelasDespesaTemp) {
    await dbAdd('parcelas_despesa', {
      despesa_id: despId, numero: p.numero, total: p.total,
      vencimento: p.vencimento, valor: p.valor,
      forma_id: formaId, forma_nome: forma?.nome,
      conta_id: contaId, conta_nome: conta?.nome,
      cat_nome: cat?.nome, subcat: cat?.subcategoria,
      forn_nome: forn?.nome,
      descricao: document.getElementById('desp-descricao').value,
      dt_pagamento: p.quitado ? today() : null,
      valor_pago: p.quitado ? p.valor : 0,
      categoria: cat?.nome,
    });
  }

  parcelasDespesaTemp = [];
  closeModal('modal-despesa');
  toast('Despesa salva!', 'success');
  loadDespesasList();
}

async function loadDespesasList() {
  const despesas = await dbGet('despesas');
  const tbody = document.getElementById('tbody-despesas');
  if (!tbody) return;
  if (despesas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:24px">Nenhuma despesa lançada</td></tr>';
    return;
  }
  tbody.innerHTML = despesas.slice().reverse().map(d => `
    <tr>
      <td>${d.id}</td>
      <td>${formatDate(d.data_lancamento)}</td>
      <td>${d.conta_nome}</td>
      <td><span class="badge badge-red">${d.cat_nome}</span></td>
      <td>${d.forn_nome}</td>
      <td style="color:var(--text-secondary)">${d.descricao||'-'}</td>
      <td>${d.qtde_parcelas}x</td>
      <td class="td-mono col-red">${formatCurrency(d.valor_total)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon btn-icon-red" onclick="excluirDespesa(${d.id})">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
}

async function excluirDespesa(id) {
  if (!(await confirmDialog('Excluir esta despesa e todas as suas parcelas?'))) return;
  const parcelas = await dbGet('parcelas_despesa');
  for (const p of parcelas.filter(p => p.despesa_id === id)) await dbDelete('parcelas_despesa', p.id);
  await dbDelete('despesas', id);
  toast('Despesa excluída!', 'success');
  loadDespesasList();
}

function openModalDespesa() {
  parcelasDespesaTemp = [];
  ['desp-descricao','desp-doc','desp-valor'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('desp-data1').value = today();
  document.getElementById('desp-qtde').value = '1';
  document.getElementById('desp-total').value = '';
  document.getElementById('desp-parcelas-section').style.display = 'none';
  openModal('modal-despesa');
}

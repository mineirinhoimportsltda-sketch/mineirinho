// ══════════════════════════════════════════
// CONTAS.JS — A Receber, A Pagar, Extrato, Transferências
// ══════════════════════════════════════════

// ── CONTAS A RECEBER ──
async function renderContasReceber(container) {
  const parcelas = await dbGet('parcelas_receita');
  const pendentes = parcelas.filter(p => !p.dt_pagamento);
  const recebidas = parcelas.filter(p => !!p.dt_pagamento);
  const vencidas = pendentes.filter(p => p.vencimento < today());
  const aVencer = pendentes.filter(p => p.vencimento >= today());

  const totalPendente = pendentes.reduce((s,p) => s+(p.valor||0), 0);
  const totalRecebido = recebidas.reduce((s,p) => s+(p.valor_pago||0), 0);
  const totalVencido = vencidas.reduce((s,p) => s+(p.valor||0), 0);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-title">📥 Contas a Receber</div>
      
      <!-- Summary -->
      <div class="summary-bar">
        <div class="summary-item"><div class="label">Vencido</div><div class="val col-red">${formatCurrency(totalVencido)}</div></div>
        <div class="summary-item"><div class="label">A Receber</div><div class="val col-yellow">${formatCurrency(totalPendente)}</div></div>
        <div class="summary-item"><div class="label">Recebido</div><div class="val col-green">${formatCurrency(totalRecebido)}</div></div>
        <div class="summary-item"><div class="label">Qtde Pendente</div><div class="val col-blue">${pendentes.length}</div></div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="form-group" style="flex:1"><label class="form-label">Pesquisar</label><input type="text" class="form-control" id="filter-rec-search" placeholder="Tipo, cliente, descrição..."></div>
        <div class="form-group"><label class="form-label">Mês</label><input type="month" class="form-control" id="filter-rec-mes"></div>
        <button class="btn btn-secondary" onclick="filterContasReceber()">🔍 Filtrar</button>
        <button class="btn btn-ghost" onclick="renderContasReceber(document.getElementById('content'))">Limpar</button>
      </div>

      <!-- Tabs panels -->
      <div class="split-panel">
        <div>
          <div class="panel-header panel-despesa">⏳ A RECEBER (${pendentes.length})</div>
          <div class="panel-body">
            <div class="table-wrap">
              <table>
                <thead><tr><th>Tipo</th><th>Cliente</th><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Quitar</th></tr></thead>
                <tbody id="tbody-cr-pendentes">
                  ${pendentes.length === 0 
                    ? '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma parcela pendente</td></tr>'
                    : pendentes.slice().sort((a,b)=>a.vencimento>b.vencimento?1:-1).map(p => `
                    <tr>
                      <td>${p.tipo_nome||p.categoria||'-'}</td>
                      <td>${p.cliente_nome||'-'}</td>
                      <td>${p.numero}/${p.total}</td>
                      <td>${formatDate(p.vencimento)}</td>
                      <td class="td-mono col-green">${formatCurrency(p.valor)}</td>
                      <td><span class="badge ${p.vencimento < today() ? 'badge-red' : 'badge-yellow'}">${p.vencimento < today() ? 'VENCIDO' : 'A VENCER'}</span></td>
                      <td><button class="btn btn-success btn-sm" onclick="quitarParcelaReceita(${p.id})">✅ Receber</button></td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div>
          <div class="panel-header panel-receita">✅ RECEBIDAS (${recebidas.length})</div>
          <div class="panel-body">
            <div class="table-wrap">
              <table>
                <thead><tr><th>Tipo</th><th>Cliente</th><th>Parcela</th><th>Pgto</th><th>Valor</th></tr></thead>
                <tbody>
                  ${recebidas.length === 0 
                    ? '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma</td></tr>'
                    : recebidas.slice().sort((a,b)=>b.dt_pagamento>a.dt_pagamento?1:-1).slice(0,50).map(p => `
                    <tr>
                      <td>${p.tipo_nome||p.categoria||'-'}</td>
                      <td>${p.cliente_nome||'-'}</td>
                      <td>${p.numero}/${p.total}</td>
                      <td>${formatDate(p.dt_pagamento)}</td>
                      <td class="td-mono col-green">${formatCurrency(p.valor_pago)}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Quitar -->
    <div id="modal-quitar-rec" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-quitar-rec')">
      <div class="modal" style="max-width:450px">
        <div class="modal-header"><h2>✅ Receber Parcela</h2><button class="modal-close" onclick="closeModal('modal-quitar-rec')">✕</button></div>
        <div class="modal-body">
          <input type="hidden" id="quitar-rec-id">
          <div class="form-group"><label class="form-label">Data de Recebimento</label><input type="date" class="form-control" id="quitar-rec-data" value="${today()}"></div>
          <div class="form-group"><label class="form-label">Valor Recebido</label><input type="number" step="0.01" class="form-control" id="quitar-rec-valor"></div>
          <div class="form-group"><label class="form-label">Forma de Pagamento</label>
            <select class="form-control" id="quitar-rec-forma"></select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-quitar-rec')">Cancelar</button>
          <button class="btn btn-success" onclick="confirmarQuitarReceita()">✅ Confirmar Recebimento</button>
        </div>
      </div>
    </div>`;
}

async function quitarParcelaReceita(id) {
  const parcela = await dbGet('parcelas_receita', id);
  if (!parcela) return;
  const formas = await dbGet('formas_pagamento');
  document.getElementById('quitar-rec-id').value = id;
  document.getElementById('quitar-rec-data').value = today();
  document.getElementById('quitar-rec-valor').value = parcela.valor;
  document.getElementById('quitar-rec-forma').innerHTML = formas.map(f => `<option value="${f.id}" ${f.id===parcela.forma_id?'selected':''}>${f.nome}</option>`).join('');
  openModal('modal-quitar-rec');
}

async function confirmarQuitarReceita() {
  const id = parseInt(document.getElementById('quitar-rec-id').value);
  const data = document.getElementById('quitar-rec-data').value;
  const valor = parseFloat(document.getElementById('quitar-rec-valor').value);
  if (!data || !valor) { toast('Preencha data e valor!', 'error'); return; }
  const parcela = await dbGet('parcelas_receita', id);
  await dbPut('parcelas_receita', { ...parcela, dt_pagamento: data, valor_pago: valor });
  closeModal('modal-quitar-rec');
  toast('Parcela recebida!', 'success');
  renderContasReceber(document.getElementById('content'));
}

// ── CONTAS A PAGAR ──
async function renderContasPagar(container) {
  const parcelas = await dbGet('parcelas_despesa');
  const pendentes = parcelas.filter(p => !p.dt_pagamento);
  const pagas = parcelas.filter(p => !!p.dt_pagamento);
  const vencidas = pendentes.filter(p => p.vencimento < today());

  const totalPendente = pendentes.reduce((s,p) => s+(p.valor||0), 0);
  const totalPago = pagas.reduce((s,p) => s+(p.valor_pago||0), 0);
  const totalVencido = vencidas.reduce((s,p) => s+(p.valor||0), 0);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-title">📤 Contas a Pagar</div>
      <div class="summary-bar">
        <div class="summary-item"><div class="label">Vencido</div><div class="val col-red">${formatCurrency(totalVencido)}</div></div>
        <div class="summary-item"><div class="label">A Pagar</div><div class="val col-yellow">${formatCurrency(totalPendente)}</div></div>
        <div class="summary-item"><div class="label">Pago</div><div class="val col-green">${formatCurrency(totalPago)}</div></div>
        <div class="summary-item"><div class="label">Qtde Pendente</div><div class="val col-blue">${pendentes.length}</div></div>
      </div>
      <div class="split-panel">
        <div>
          <div class="panel-header panel-despesa">💸 A PAGAR (${pendentes.length})</div>
          <div class="panel-body">
            <div class="table-wrap">
              <table>
                <thead><tr><th>Categoria</th><th>Fornecedor</th><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Quitar</th></tr></thead>
                <tbody>
                  ${pendentes.length === 0 
                    ? '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Tudo em dia! ✅</td></tr>'
                    : pendentes.slice().sort((a,b)=>a.vencimento>b.vencimento?1:-1).map(p => `
                    <tr>
                      <td>${p.cat_nome||p.categoria||'-'}</td>
                      <td>${p.forn_nome||'-'}</td>
                      <td>${p.numero}/${p.total}</td>
                      <td>${formatDate(p.vencimento)}</td>
                      <td class="td-mono col-red">${formatCurrency(p.valor)}</td>
                      <td><span class="badge ${p.vencimento < today() ? 'badge-red' : 'badge-yellow'}">${p.vencimento < today() ? 'VENCIDO' : 'A VENCER'}</span></td>
                      <td><button class="btn btn-warning btn-sm" onclick="quitarParcelaDespesa(${p.id})">💰 Pagar</button></td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div>
          <div class="panel-header panel-receita">✅ PAGAS (${pagas.length})</div>
          <div class="panel-body">
            <div class="table-wrap">
              <table>
                <thead><tr><th>Categoria</th><th>Fornecedor</th><th>Parcela</th><th>Pgto</th><th>Valor</th></tr></thead>
                <tbody>
                  ${pagas.length === 0 
                    ? '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma</td></tr>'
                    : pagas.slice().sort((a,b)=>b.dt_pagamento>a.dt_pagamento?1:-1).slice(0,50).map(p => `
                    <tr>
                      <td>${p.cat_nome||p.categoria||'-'}</td>
                      <td>${p.forn_nome||'-'}</td>
                      <td>${p.numero}/${p.total}</td>
                      <td>${formatDate(p.dt_pagamento)}</td>
                      <td class="td-mono col-green">${formatCurrency(p.valor_pago)}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div id="modal-quitar-desp" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-quitar-desp')">
      <div class="modal" style="max-width:450px">
        <div class="modal-header"><h2>💰 Pagar Parcela</h2><button class="modal-close" onclick="closeModal('modal-quitar-desp')">✕</button></div>
        <div class="modal-body">
          <input type="hidden" id="quitar-desp-id">
          <div class="form-group"><label class="form-label">Data Pagamento</label><input type="date" class="form-control" id="quitar-desp-data" value="${today()}"></div>
          <div class="form-group"><label class="form-label">Valor Pago</label><input type="number" step="0.01" class="form-control" id="quitar-desp-valor"></div>
          <div class="form-group"><label class="form-label">Forma de Pagamento</label>
            <select class="form-control" id="quitar-desp-forma"></select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-quitar-desp')">Cancelar</button>
          <button class="btn btn-warning" onclick="confirmarQuitarDespesa()">💰 Confirmar Pagamento</button>
        </div>
      </div>
    </div>`;
}

async function quitarParcelaDespesa(id) {
  const parcela = await dbGet('parcelas_despesa', id);
  if (!parcela) return;
  const formas = await dbGet('formas_pagamento');
  document.getElementById('quitar-desp-id').value = id;
  document.getElementById('quitar-desp-data').value = today();
  document.getElementById('quitar-desp-valor').value = parcela.valor;
  document.getElementById('quitar-desp-forma').innerHTML = formas.map(f => `<option value="${f.id}" ${f.id===parcela.forma_id?'selected':''}>${f.nome}</option>`).join('');
  openModal('modal-quitar-desp');
}

async function confirmarQuitarDespesa() {
  const id = parseInt(document.getElementById('quitar-desp-id').value);
  const data = document.getElementById('quitar-desp-data').value;
  const valor = parseFloat(document.getElementById('quitar-desp-valor').value);
  if (!data || !valor) { toast('Preencha data e valor!', 'error'); return; }
  const parcela = await dbGet('parcelas_despesa', id);
  await dbPut('parcelas_despesa', { ...parcela, dt_pagamento: data, valor_pago: valor });
  closeModal('modal-quitar-desp');
  toast('Despesa paga!', 'success');
  renderContasPagar(document.getElementById('content'));
}

// ── EXTRATO COMPARATIVO ──
async function renderExtrato(container) {
  const [parcRec, parcDesp] = await Promise.all([dbGet('parcelas_receita'), dbGet('parcelas_despesa')]);

  function filterData(pr, pd, mes, ano) {
    let r = pr.filter(p => !!p.dt_pagamento);
    let d = pd.filter(p => !!p.dt_pagamento);
    if (mes) { r = r.filter(p => p.dt_pagamento && p.dt_pagamento.slice(5,7) === mes); d = d.filter(p => p.dt_pagamento && p.dt_pagamento.slice(5,7) === mes); }
    if (ano) { r = r.filter(p => p.dt_pagamento && p.dt_pagamento.slice(0,4) === ano); d = d.filter(p => p.dt_pagamento && p.dt_pagamento.slice(0,4) === ano); }
    return [r, d];
  }

  const anos = [...new Set([...parcRec, ...parcDesp].map(p => p.dt_pagamento?.slice(0,4)).filter(Boolean))].sort().reverse();
  const [recFilt, despFilt] = filterData(parcRec, parcDesp, '', '');
  const totalRec = recFilt.reduce((s,p) => s+(p.valor_pago||0), 0);
  const totalDesp = despFilt.reduce((s,p) => s+(p.valor_pago||0), 0);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-title">📋 Extrato Comparativo — Receitas × Despesas</div>
      <div class="filters-bar">
        <div class="form-group">
          <label class="form-label">Ano</label>
          <select class="form-control" id="ext-ano" style="width:100px">
            <option value="">Todos</option>
            ${anos.map(a => `<option value="${a}">${a}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Mês</label>
          <select class="form-control" id="ext-mes" style="width:130px">
            <option value="">Todos</option>
            ${['01','02','03','04','05','06','07','08','09','10','11','12'].map((m,i) => `<option value="${m}">${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][i]}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" onclick="aplicarFiltroExtrato()">🔍 Filtrar</button>
        <button class="btn btn-secondary" onclick="printExtrato()">🖨️ Imprimir</button>
        <button class="btn btn-ghost" onclick="exportarExtrato()">📥 CSV</button>
      </div>
      
      <div id="extrato-content">
        ${buildExtratoHTML(recFilt, despFilt)}
      </div>
    </div>`;
}

function buildExtratoHTML(recFilt, despFilt) {
  const totalRec = recFilt.reduce((s,p) => s+(p.valor_pago||0), 0);
  const totalDesp = despFilt.reduce((s,p) => s+(p.valor_pago||0), 0);
  const saldo = totalRec - totalDesp;
  return `
    <div class="split-panel">
      <div>
        <div class="panel-header panel-receita">💚 RECEITAS RECEBIDAS (${recFilt.length})</div>
        <div class="panel-body">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Tipo</th><th>Vencimento</th><th>Valor</th><th>Data Pgto</th></tr></thead>
              <tbody>
                ${recFilt.length === 0 
                  ? '<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--text-muted)">Sem dados</td></tr>'
                  : recFilt.map(p => `<tr>
                    <td>${p.tipo_nome||p.categoria||'-'}</td>
                    <td>${formatDate(p.vencimento)}</td>
                    <td class="td-mono col-green">${formatCurrency(p.valor_pago)}</td>
                    <td>${formatDate(p.dt_pagamento)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div>
        <div class="panel-header panel-despesa">❤️ DESPESAS PAGAS (${despFilt.length})</div>
        <div class="panel-body">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Tipo</th><th>Vencimento</th><th>Valor</th><th>Data Pgto</th></tr></thead>
              <tbody>
                ${despFilt.length === 0 
                  ? '<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--text-muted)">Sem dados</td></tr>'
                  : despFilt.map(p => `<tr>
                    <td>${p.cat_nome||p.categoria||'-'}</td>
                    <td>${formatDate(p.vencimento)}</td>
                    <td class="td-mono col-red">${formatCurrency(p.valor_pago)}</td>
                    <td>${formatDate(p.dt_pagamento)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="summary-bar" style="margin-top:8px">
      <div class="summary-item"><div class="label">Total Receita</div><div class="val col-green">${formatCurrency(totalRec)}</div></div>
      <div class="summary-item"><div class="label">Total Despesa</div><div class="val col-red">${formatCurrency(totalDesp)}</div></div>
      <div class="summary-item"><div class="label">Saldo</div><div class="val ${saldo>=0?'col-green':'col-red'}">${formatCurrency(saldo)}</div></div>
    </div>`;
}

async function aplicarFiltroExtrato() {
  const ano = document.getElementById('ext-ano').value;
  const mes = document.getElementById('ext-mes').value;
  const [parcRec, parcDesp] = await Promise.all([dbGet('parcelas_receita'), dbGet('parcelas_despesa')]);
  let r = parcRec.filter(p => !!p.dt_pagamento);
  let d = parcDesp.filter(p => !!p.dt_pagamento);
  if (ano) { r = r.filter(p => p.dt_pagamento?.startsWith(ano)); d = d.filter(p => p.dt_pagamento?.startsWith(ano)); }
  if (mes) { r = r.filter(p => p.dt_pagamento?.slice(5,7) === mes); d = d.filter(p => p.dt_pagamento?.slice(5,7) === mes); }
  document.getElementById('extrato-content').innerHTML = buildExtratoHTML(r, d);
}

// ── TRANSFERÊNCIAS ──
async function renderTransferencias(container) {
  const [transferencias, contas] = await Promise.all([dbGet('transferencias'), dbGet('contas')]);
  
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-header">
        <div class="section-title">🔄 Transferências entre Contas</div>
        <button class="btn btn-primary" onclick="openModalTransf()">+ Nova Transferência</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Origem</th><th>Destino</th><th>Valor</th><th>Descrição</th><th>Ações</th></tr></thead>
            <tbody id="tbody-transf">
              ${transferencias.length === 0 
                ? '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Nenhuma transferência</td></tr>'
                : transferencias.slice().reverse().map(t => `
                <tr>
                  <td>${formatDate(t.data)}</td>
                  <td>${t.conta_origem_nome}</td>
                  <td>${t.conta_destino_nome}</td>
                  <td class="td-mono col-blue">${formatCurrency(t.valor)}</td>
                  <td>${t.descricao||'-'}</td>
                  <td><button class="btn-icon btn-icon-red" onclick="excluirTransf(${t.id})">🗑️</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div id="modal-transf" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-transf')">
      <div class="modal" style="max-width:450px">
        <div class="modal-header"><h2>🔄 Nova Transferência</h2><button class="modal-close" onclick="closeModal('modal-transf')">✕</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Data</label><input type="date" class="form-control" id="transf-data" value="${today()}"></div>
          <div class="form-group"><label class="form-label">Conta Origem *</label>
            <select class="form-control" id="transf-origem">
              ${contas.filter(c=>c.ativo).map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Conta Destino *</label>
            <select class="form-control" id="transf-destino">
              ${contas.filter(c=>c.ativo).map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Valor *</label><input type="number" step="0.01" class="form-control" id="transf-valor"></div>
          <div class="form-group"><label class="form-label">Descrição</label><input type="text" class="form-control" id="transf-desc"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-transf')">Cancelar</button>
          <button class="btn btn-primary" onclick="salvarTransf()">💾 Salvar</button>
        </div>
      </div>
    </div>`;
}

function openModalTransf() { openModal('modal-transf'); }

async function salvarTransf() {
  const data = document.getElementById('transf-data').value;
  const origemId = parseInt(document.getElementById('transf-origem').value);
  const destinoId = parseInt(document.getElementById('transf-destino').value);
  const valor = parseFloat(document.getElementById('transf-valor').value);
  if (!data || !valor || origemId === destinoId) { toast('Verifique os campos!', 'error'); return; }
  const contas = await dbGet('contas');
  const origem = contas.find(c => c.id === origemId);
  const destino = contas.find(c => c.id === destinoId);
  await dbAdd('transferencias', {
    data, conta_origem_id: origemId, conta_origem_nome: origem?.nome,
    conta_destino_id: destinoId, conta_destino_nome: destino?.nome,
    valor, descricao: document.getElementById('transf-desc').value
  });
  closeModal('modal-transf');
  toast('Transferência salva!', 'success');
  renderTransferencias(document.getElementById('content'));
}

async function excluirTransf(id) {
  if (!(await confirmDialog('Excluir esta transferência?'))) return;
  await dbDelete('transferencias', id);
  toast('Removida!', 'success');
  renderTransferencias(document.getElementById('content'));
}

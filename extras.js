// ══════════════════════════════════════════
// EXTRAS.JS — Relatórios, Gráficos, Poupança, Cartão, Conciliação
// ══════════════════════════════════════════

// ── RELATÓRIOS ──
async function renderRelatorios(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-title">📑 Relatórios</div>
      <div class="grid-3">
        ${[
          { icon: '💚', title: 'Receitas por Período', desc: 'Receitas recebidas em um intervalo de datas', btn: 'relRecPeriodo' },
          { icon: '📊', title: 'Receita × Despesa', desc: 'Comparativo de receitas e despesas por período', btn: 'relRecDesp' },
          { icon: '👤', title: 'Receitas por Cliente', desc: 'Receitas agrupadas por cliente', btn: 'relRecCliente' },
          { icon: '❤️', title: 'Despesas por Período', desc: 'Despesas pagas em um intervalo de datas', btn: 'relDespPeriodo' },
          { icon: '🏷️', title: 'Despesas por Sub-categoria', desc: 'Despesas agrupadas por categoria e sub', btn: 'relDespCat' },
          { icon: '🏭', title: 'Despesas por Fornecedor', desc: 'Despesas agrupadas por fornecedor', btn: 'relDespForn' },
        ].map(r => `
          <div class="card" style="cursor:pointer" onclick="${r.btn}()">
            <div style="font-size:32px;margin-bottom:12px">${r.icon}</div>
            <div style="font-weight:700;margin-bottom:6px">${r.title}</div>
            <div style="color:var(--text-muted);font-size:12px;margin-bottom:16px">${r.desc}</div>
            <button class="btn btn-primary btn-sm">📄 Gerar Relatório</button>
          </div>`).join('')}
      </div>
    </div>
    
    <!-- Filter Modal -->
    <div id="modal-rel-filter" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-rel-filter')">
      <div class="modal" style="max-width:450px">
        <div class="modal-header"><h2 id="rel-title">Relatório</h2><button class="modal-close" onclick="closeModal('modal-rel-filter')">✕</button></div>
        <div class="modal-body" id="rel-filter-body"></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-rel-filter')">Cancelar</button>
          <button class="btn btn-primary" id="btn-gerar-rel">🖨️ Gerar e Imprimir</button>
        </div>
      </div>
    </div>`;
}

async function relRecPeriodo() {
  document.getElementById('rel-title').textContent = '💚 Receitas por Período';
  document.getElementById('rel-filter-body').innerHTML = `
    <div class="form-row cols-2">
      <div class="form-group"><label class="form-label">Data Inicial</label><input type="date" class="form-control" id="rel-di" value="${today()}"></div>
      <div class="form-group"><label class="form-label">Data Final</label><input type="date" class="form-control" id="rel-df" value="${today()}"></div>
    </div>
    <div class="form-group"><label class="form-label">Filtrar por</label>
      <select class="form-control" id="rel-status">
        <option value="all">Todas (a receber + recebidas)</option>
        <option value="rec">Recebidas</option>
        <option value="pen">A Receber</option>
        <option value="ven">Vencidas</option>
      </select>
    </div>`;
  document.getElementById('btn-gerar-rel').onclick = async () => {
    const di = document.getElementById('rel-di').value;
    const df = document.getElementById('rel-df').value;
    const status = document.getElementById('rel-status').value;
    let data = await dbGet('parcelas_receita');
    if (status === 'rec') data = data.filter(p => !!p.dt_pagamento);
    if (status === 'pen') data = data.filter(p => !p.dt_pagamento && p.vencimento >= today());
    if (status === 'ven') data = data.filter(p => !p.dt_pagamento && p.vencimento < today());
    data = data.filter(p => (p.vencimento||p.dt_pagamento) >= di && (p.vencimento||p.dt_pagamento) <= df);
    const total = data.reduce((s,p) => s+(p.valor_pago||p.valor||0), 0);
    printSection(`
      <table>
        <thead><tr><th>Tipo</th><th>Descrição</th><th>Parcela</th><th>Vencimento</th><th>Total</th><th>Data Pgto</th><th>Situação</th><th>Cliente</th><th>F. Pagamento</th></tr></thead>
        <tbody>
          ${data.map(p => `<tr>
            <td>${p.tipo_nome||p.categoria||'-'}</td>
            <td>${p.descricao||'-'}</td>
            <td>${p.numero}/${p.total}</td>
            <td>${formatDate(p.vencimento)}</td>
            <td>R$ ${(p.valor||0).toFixed(2)}</td>
            <td>${p.dt_pagamento ? formatDate(p.dt_pagamento) : '-'}</td>
            <td>${p.dt_pagamento ? 'RECEBIDO' : p.vencimento < today() ? 'VENCIDO' : 'A RECEBER'}</td>
            <td>${p.cliente_nome||'-'}</td>
            <td>${p.forma_nome||'-'}</td>
          </tr>`).join('')}
          <tr class="total"><td colspan="4"><b>TOTAL</b></td><td colspan="5" class="green"><b>R$ ${total.toFixed(2)}</b></td></tr>
        </tbody>
      </table>
      <p>Total de títulos: ${data.length}</p>`, `Receitas por Período — ${di} a ${df}`);
  };
  openModal('modal-rel-filter');
}

async function relDespPeriodo() {
  document.getElementById('rel-title').textContent = '❤️ Despesas por Período';
  document.getElementById('rel-filter-body').innerHTML = `
    <div class="form-row cols-2">
      <div class="form-group"><label class="form-label">Data Inicial</label><input type="date" class="form-control" id="rel-di" value="${today()}"></div>
      <div class="form-group"><label class="form-label">Data Final</label><input type="date" class="form-control" id="rel-df" value="${today()}"></div>
    </div>
    <div class="form-group"><label class="form-label">Filtrar por</label>
      <select class="form-control" id="rel-status">
        <option value="all">Todas</option>
        <option value="pago">Pagas</option>
        <option value="pen">A Pagar</option>
        <option value="ven">Vencidas</option>
      </select>
    </div>`;
  document.getElementById('btn-gerar-rel').onclick = async () => {
    const di = document.getElementById('rel-di').value;
    const df = document.getElementById('rel-df').value;
    const status = document.getElementById('rel-status').value;
    let data = await dbGet('parcelas_despesa');
    if (status === 'pago') data = data.filter(p => !!p.dt_pagamento);
    if (status === 'pen') data = data.filter(p => !p.dt_pagamento && p.vencimento >= today());
    if (status === 'ven') data = data.filter(p => !p.dt_pagamento && p.vencimento < today());
    data = data.filter(p => (p.vencimento||p.dt_pagamento) >= di && (p.vencimento||p.dt_pagamento) <= df);
    const total = data.reduce((s,p) => s+(p.valor_pago||p.valor||0), 0);
    printSection(`
      <table>
        <thead><tr><th>Tipo</th><th>Descrição</th><th>Parcela</th><th>Vencimento</th><th>Total</th><th>Data Pgto</th><th>Situação</th><th>Fornecedor</th><th>F. Pagamento</th></tr></thead>
        <tbody>
          ${data.map(p => `<tr>
            <td>${p.cat_nome||p.categoria||'-'}</td><td>${p.descricao||'-'}</td>
            <td>${p.numero}/${p.total}</td><td>${formatDate(p.vencimento)}</td>
            <td>R$ ${(p.valor||0).toFixed(2)}</td>
            <td>${p.dt_pagamento ? formatDate(p.dt_pagamento) : '-'}</td>
            <td>${p.dt_pagamento ? 'PAGO' : p.vencimento < today() ? 'VENCIDO' : 'A PAGAR'}</td>
            <td>${p.forn_nome||'-'}</td><td>${p.forma_nome||'-'}</td>
          </tr>`).join('')}
          <tr class="total"><td colspan="4"><b>TOTAL</b></td><td colspan="5" class="red"><b>R$ ${total.toFixed(2)}</b></td></tr>
        </tbody>
      </table>`, `Despesas por Período — ${di} a ${df}`);
  };
  openModal('modal-rel-filter');
}

async function relRecDesp() {
  document.getElementById('rel-title').textContent = '📊 Receita × Despesa';
  document.getElementById('rel-filter-body').innerHTML = `
    <div class="form-row cols-2">
      <div class="form-group"><label class="form-label">Data Inicial</label><input type="date" class="form-control" id="rel-di" value="${today().slice(0,7)+'-01'}"></div>
      <div class="form-group"><label class="form-label">Data Final</label><input type="date" class="form-control" id="rel-df" value="${today()}"></div>
    </div>`;
  document.getElementById('btn-gerar-rel').onclick = async () => {
    const di = document.getElementById('rel-di').value;
    const df = document.getElementById('rel-df').value;
    const pr = (await dbGet('parcelas_receita')).filter(p => p.dt_pagamento >= di && p.dt_pagamento <= df);
    const pd = (await dbGet('parcelas_despesa')).filter(p => p.dt_pagamento >= di && p.dt_pagamento <= df);
    const tr = pr.reduce((s,p)=>s+(p.valor_pago||0),0);
    const td = pd.reduce((s,p)=>s+(p.valor_pago||0),0);
    printSection(`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div><h3>RECEITAS</h3>
          <table><thead><tr><th>Tipo</th><th>Data Pgto</th><th>Valor</th></tr></thead>
          <tbody>${pr.map(p=>`<tr><td>${p.tipo_nome||'-'}</td><td>${formatDate(p.dt_pagamento)}</td><td class="green">R$ ${(p.valor_pago||0).toFixed(2)}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td colspan="2"><b>Total</b></td><td class="green"><b>R$ ${tr.toFixed(2)}</b></td></tr></tfoot></table>
        </div>
        <div><h3>DESPESAS</h3>
          <table><thead><tr><th>Tipo</th><th>Data Pgto</th><th>Valor</th></tr></thead>
          <tbody>${pd.map(p=>`<tr><td>${p.cat_nome||'-'}</td><td>${formatDate(p.dt_pagamento)}</td><td class="red">R$ ${(p.valor_pago||0).toFixed(2)}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td colspan="2"><b>Total</b></td><td class="red"><b>R$ ${td.toFixed(2)}</b></td></tr></tfoot></table>
        </div>
      </div>
      <p><b>Saldo: R$ ${(tr-td).toFixed(2)}</b></p>`, `Receita × Despesa — ${di} a ${df}`);
  };
  openModal('modal-rel-filter');
}

async function relRecCliente() {
  document.getElementById('rel-title').textContent = '👤 Receitas por Cliente';
  document.getElementById('rel-filter-body').innerHTML = `
    <div class="form-row cols-2">
      <div class="form-group"><label class="form-label">Data Inicial</label><input type="date" class="form-control" id="rel-di" value="${today().slice(0,7)+'-01'}"></div>
      <div class="form-group"><label class="form-label">Data Final</label><input type="date" class="form-control" id="rel-df" value="${today()}"></div>
    </div>`;
  document.getElementById('btn-gerar-rel').onclick = async () => {
    const di = document.getElementById('rel-di').value;
    const df = document.getElementById('rel-df').value;
    const pr = (await dbGet('parcelas_receita')).filter(p => p.dt_pagamento >= di && p.dt_pagamento <= df);
    const agrupado = {};
    for (const p of pr) { const k = p.cliente_nome||'Padrão'; agrupado[k] = (agrupado[k]||0) + (p.valor_pago||0); }
    const sorted = Object.entries(agrupado).sort((a,b)=>b[1]-a[1]);
    const total = sorted.reduce((s,[,v])=>s+v,0);
    printSection(`
      <table><thead><tr><th>Cliente</th><th>Total Recebido</th><th>%</th></tr></thead>
      <tbody>${sorted.map(([c,v])=>`<tr><td>${c}</td><td class="green">R$ ${v.toFixed(2)}</td><td>${(v/total*100).toFixed(1)}%</td></tr>`).join('')}</tbody>
      <tfoot><tr><td><b>TOTAL</b></td><td class="green"><b>R$ ${total.toFixed(2)}</b></td><td>100%</td></tr></tfoot></table>`, `Receitas por Cliente`);
  };
  openModal('modal-rel-filter');
}

async function relDespCat() {
  document.getElementById('rel-title').textContent = '🏷️ Despesas por Categoria';
  document.getElementById('rel-filter-body').innerHTML = `
    <div class="form-row cols-2">
      <div class="form-group"><label class="form-label">Data Inicial</label><input type="date" class="form-control" id="rel-di" value="${today().slice(0,7)+'-01'}"></div>
      <div class="form-group"><label class="form-label">Data Final</label><input type="date" class="form-control" id="rel-df" value="${today()}"></div>
    </div>`;
  document.getElementById('btn-gerar-rel').onclick = async () => {
    const di = document.getElementById('rel-di').value;
    const df = document.getElementById('rel-df').value;
    const pd = (await dbGet('parcelas_despesa')).filter(p => p.dt_pagamento >= di && p.dt_pagamento <= df);
    const agrupado = {};
    for (const p of pd) { const k = p.cat_nome||'Outros'; agrupado[k] = (agrupado[k]||0) + (p.valor_pago||0); }
    const sorted = Object.entries(agrupado).sort((a,b)=>b[1]-a[1]);
    const total = sorted.reduce((s,[,v])=>s+v,0);
    printSection(`
      <table><thead><tr><th>Categoria</th><th>Total Pago</th><th>%</th></tr></thead>
      <tbody>${sorted.map(([c,v])=>`<tr><td>${c}</td><td class="red">R$ ${v.toFixed(2)}</td><td>${(v/total*100).toFixed(1)}%</td></tr>`).join('')}</tbody>
      <tfoot><tr><td><b>TOTAL</b></td><td class="red"><b>R$ ${total.toFixed(2)}</b></td><td>100%</td></tr></tfoot></table>`, `Despesas por Categoria`);
  };
  openModal('modal-rel-filter');
}

async function relDespForn() {
  document.getElementById('rel-title').textContent = '🏭 Despesas por Fornecedor';
  document.getElementById('rel-filter-body').innerHTML = `
    <div class="form-row cols-2">
      <div class="form-group"><label class="form-label">Data Inicial</label><input type="date" class="form-control" id="rel-di" value="${today().slice(0,7)+'-01'}"></div>
      <div class="form-group"><label class="form-label">Data Final</label><input type="date" class="form-control" id="rel-df" value="${today()}"></div>
    </div>`;
  document.getElementById('btn-gerar-rel').onclick = async () => {
    const di = document.getElementById('rel-di').value;
    const df = document.getElementById('rel-df').value;
    const pd = (await dbGet('parcelas_despesa')).filter(p => p.dt_pagamento >= di && p.dt_pagamento <= df);
    const agrupado = {};
    for (const p of pd) { const k = p.forn_nome||'Padrão'; agrupado[k] = (agrupado[k]||0) + (p.valor_pago||0); }
    const sorted = Object.entries(agrupado).sort((a,b)=>b[1]-a[1]);
    const total = sorted.reduce((s,[,v])=>s+v,0);
    printSection(`
      <table><thead><tr><th>Fornecedor</th><th>Total Pago</th><th>%</th></tr></thead>
      <tbody>${sorted.map(([f,v])=>`<tr><td>${f}</td><td class="red">R$ ${v.toFixed(2)}</td><td>${(v/total*100).toFixed(1)}%</td></tr>`).join('')}</tbody>
      <tfoot><tr><td><b>TOTAL</b></td><td class="red"><b>R$ ${total.toFixed(2)}</b></td><td>100%</td></tr></tfoot></table>`, `Despesas por Fornecedor`);
  };
  openModal('modal-rel-filter');
}

// ── GRÁFICOS ──
async function renderGraficos(container) {
  const now = new Date();
  const [parcRec, parcDesp] = await Promise.all([dbGet('parcelas_receita'), dbGet('parcelas_despesa')]);
  const year = now.getFullYear();
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:20px">
      <div class="section-title">📈 Gráficos</div>
      <div class="grid-2">
        <div class="card"><div class="card-title">🍕 Despesas por Categoria (Mês Atual)</div><canvas id="g-desp-cat" height="220"></canvas></div>
        <div class="card"><div class="card-title">🍕 Receitas por Tipo (Mês Atual)</div><canvas id="g-rec-tipo" height="220"></canvas></div>
        <div class="card"><div class="card-title">📊 Receitas × Despesas (Ano ${year})</div><canvas id="g-anual" height="220"></canvas></div>
        <div class="card"><div class="card-title">📈 Fluxo Acumulado (Ano ${year})</div><canvas id="g-fluxo" height="220"></canvas></div>
      </div>
    </div>`;

  if (typeof Chart === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = () => buildGraficos(parcRec, parcDesp, year, meses);
    document.head.appendChild(s);
  } else {
    buildGraficos(parcRec, parcDesp, year, meses);
  }
}

function buildGraficos(parcRec, parcDesp, year, meses) {
  const now = new Date();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const colors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#06b6d4','#f97316','#84cc16'];

  // Despesas cat mês
  const despMes = parcDesp.filter(p => p.dt_pagamento?.startsWith(`${year}-${m}`));
  const despCat = {};
  for (const p of despMes) { despCat[p.categoria||'Outros'] = (despCat[p.categoria||'Outros']||0) + (p.valor_pago||0); }
  new Chart(document.getElementById('g-desp-cat'), {
    type: 'pie',
    data: { labels: Object.keys(despCat), datasets: [{ data: Object.values(despCat), backgroundColor: colors, borderWidth: 0 }] },
    options: { plugins: { legend: { position: 'right', labels: { color: '#8892a4', font: { size: 11 } } } } }
  });

  // Receitas tipo mês
  const recMes = parcRec.filter(p => p.dt_pagamento?.startsWith(`${year}-${m}`));
  const recTipo = {};
  for (const p of recMes) { recTipo[p.tipo_nome||'Outros'] = (recTipo[p.tipo_nome||'Outros']||0) + (p.valor_pago||0); }
  new Chart(document.getElementById('g-rec-tipo'), {
    type: 'pie',
    data: { labels: Object.keys(recTipo), datasets: [{ data: Object.values(recTipo), backgroundColor: colors, borderWidth: 0 }] },
    options: { plugins: { legend: { position: 'right', labels: { color: '#8892a4', font: { size: 11 } } } } }
  });

  // Anual bar
  const recAnual = meses.map((_, i) => {
    const mm = String(i+1).padStart(2,'0');
    return parcRec.filter(p => p.dt_pagamento?.startsWith(`${year}-${mm}`)).reduce((s,p)=>s+(p.valor_pago||0),0);
  });
  const despAnual = meses.map((_, i) => {
    const mm = String(i+1).padStart(2,'0');
    return parcDesp.filter(p => p.dt_pagamento?.startsWith(`${year}-${mm}`)).reduce((s,p)=>s+(p.valor_pago||0),0);
  });
  new Chart(document.getElementById('g-anual'), {
    type: 'bar',
    data: { labels: meses, datasets: [
      { label: 'Receita', data: recAnual, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
      { label: 'Despesa', data: despAnual, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 4 }
    ]},
    options: { responsive: true, scales: { x: { ticks: { color:'#8892a4' }, grid: { color:'#2a3348' } }, y: { ticks: { color:'#8892a4' }, grid: { color:'#2a3348' } } }, plugins: { legend: { labels: { color: '#8892a4' } } } }
  });

  // Fluxo acumulado
  let acc = 0;
  const fluxo = recAnual.map((r,i) => { acc += r - despAnual[i]; return acc; });
  new Chart(document.getElementById('g-fluxo'), {
    type: 'line',
    data: { labels: meses, datasets: [{ label: 'Saldo Acumulado', data: fluxo, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, borderWidth: 2 }] },
    options: { responsive: true, scales: { x: { ticks: { color:'#8892a4' }, grid: { color:'#2a3348' } }, y: { ticks: { color:'#8892a4' }, grid: { color:'#2a3348' } } }, plugins: { legend: { labels: { color: '#8892a4' } } } }
  });
}

// ── POUPANÇA ──
async function renderPoupanca(container) {
  const movs = await dbGet('poupanca');
  const creditos = movs.filter(m => m.tipo === 'CREDITO').reduce((s,m) => s+m.valor, 0);
  const debitos = movs.filter(m => m.tipo === 'DEBITO').reduce((s,m) => s+m.valor, 0);
  const saldo = creditos - debitos;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-header">
        <div class="section-title">🏦 Controle de Poupança</div>
        <button class="btn btn-primary" onclick="openModalPoupanca()">+ Novo Lançamento</button>
      </div>
      <div class="grid-3">
        <div class="kpi-card kpi-green"><div class="kpi-icon">💰</div><div class="kpi-data"><div class="label">Total Crédito</div><div class="value">${formatCurrency(creditos)}</div></div></div>
        <div class="kpi-card kpi-red"><div class="kpi-icon">💸</div><div class="kpi-data"><div class="label">Total Débito</div><div class="value">${formatCurrency(debitos)}</div></div></div>
        <div class="kpi-card kpi-blue"><div class="kpi-icon">🏦</div><div class="kpi-data"><div class="label">Saldo Total</div><div class="value">${formatCurrency(saldo)}</div></div></div>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor</th><th>Ações</th></tr></thead>
            <tbody>
              ${movs.length === 0 
                ? '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Nenhum lançamento</td></tr>'
                : movs.slice().reverse().map(m => `
                <tr>
                  <td>${formatDate(m.data)}</td>
                  <td><span class="badge ${m.tipo==='CREDITO'?'badge-green':'badge-red'}">${m.tipo}</span></td>
                  <td>${m.descricao}</td>
                  <td class="td-mono ${m.tipo==='CREDITO'?'col-green':'col-red'}">${m.tipo==='DEBITO'?'-':''}${formatCurrency(m.valor)}</td>
                  <td><button class="btn-icon btn-icon-red" onclick="excluirPoupanca(${m.id})">🗑️</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div id="modal-poupanca" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-poupanca')">
      <div class="modal" style="max-width:420px">
        <div class="modal-header"><h2>🏦 Lançamento na Poupança</h2><button class="modal-close" onclick="closeModal('modal-poupanca')">✕</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Data</label><input type="date" class="form-control" id="poupa-data" value="${today()}"></div>
          <div class="form-group"><label class="form-label">Tipo</label>
            <select class="form-control" id="poupa-tipo"><option value="CREDITO">CRÉDITO (Depósito)</option><option value="DEBITO">DÉBITO (Saque)</option></select>
          </div>
          <div class="form-group"><label class="form-label">Descrição</label><input type="text" class="form-control" id="poupa-desc" placeholder="Ex: Depósito mensal"></div>
          <div class="form-group"><label class="form-label">Valor *</label><input type="number" step="0.01" class="form-control" id="poupa-valor"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-poupanca')">Cancelar</button>
          <button class="btn btn-primary" onclick="salvarPoupanca()">💾 Salvar</button>
        </div>
      </div>
    </div>`;
}

function openModalPoupanca() { openModal('modal-poupanca'); }

async function salvarPoupanca() {
  const data = document.getElementById('poupa-data').value;
  const tipo = document.getElementById('poupa-tipo').value;
  const desc = document.getElementById('poupa-desc').value;
  const valor = parseFloat(document.getElementById('poupa-valor').value);
  if (!data || !valor) { toast('Preencha os campos!', 'error'); return; }
  await dbAdd('poupanca', { data, tipo, descricao: desc, valor });
  closeModal('modal-poupanca');
  toast('Lançamento salvo!', 'success');
  renderPoupanca(document.getElementById('content'));
}

async function excluirPoupanca(id) {
  if (!(await confirmDialog('Excluir este lançamento?'))) return;
  await dbDelete('poupanca', id);
  toast('Removido!', 'success');
  renderPoupanca(document.getElementById('content'));
}

// ── CARTÃO DE CRÉDITO ──
async function renderCartao(container) {
  const [cartoes, lancamentos] = await Promise.all([dbGet('cartao_credito'), dbGet('lancamentos_cartao')]);
  const cartao = cartoes[0];
  const now = new Date();
  const mes = String(now.getMonth()+1).padStart(2,'0');
  const ano = now.getFullYear();
  const lancMes = lancamentos.filter(l => l.data?.startsWith(`${ano}-${mes}`));
  const totalMes = lancMes.reduce((s,l) => s+(l.valor||0), 0);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-header">
        <div class="section-title">💳 Cartão de Crédito</div>
        <button class="btn btn-primary" onclick="openModalLancCartao()">+ Novo Lançamento</button>
      </div>
      
      ${cartao ? `
      <div class="card" style="background:linear-gradient(135deg,#1e3a5f,#0f2544);border-color:#2a4a7f">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:13px;color:#94b8e0;margin-bottom:6px">${cartao.bandeira}</div>
            <div style="font-size:22px;font-weight:800;letter-spacing:2px">${cartao.nome}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;color:#94b8e0">Limite</div>
            <div style="font-size:20px;font-weight:700;color:#60a5fa">${formatCurrency(cartao.limite)}</div>
          </div>
        </div>
        <div style="display:flex;gap:24px;margin-top:16px">
          <div><div style="font-size:11px;color:#94b8e0">Fechamento</div><div style="font-weight:600">Dia ${cartao.dia_fechamento}</div></div>
          <div><div style="font-size:11px;color:#94b8e0">Vencimento</div><div style="font-weight:600">Dia ${cartao.dia_vencimento}</div></div>
          <div><div style="font-size:11px;color:#94b8e0">Gasto no mês</div><div style="font-weight:600;color:#ef4444">${formatCurrency(totalMes)}</div></div>
          <div><div style="font-size:11px;color:#94b8e0">Disponível</div><div style="font-weight:600;color:#10b981">${formatCurrency(cartao.limite - totalMes)}</div></div>
        </div>
      </div>` : '<div class="alert alert-info">Configure um cartão nos Cadastros</div>'}

      <div class="card">
        <div class="card-title">Lançamentos do Mês</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Parcelas</th><th>Valor</th><th>Ações</th></tr></thead>
            <tbody>
              ${lancMes.length === 0 
                ? '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Sem lançamentos este mês</td></tr>'
                : lancMes.map(l => `
                <tr>
                  <td>${formatDate(l.data)}</td>
                  <td>${l.descricao}</td>
                  <td>${l.categoria||'-'}</td>
                  <td>${l.parcela_atual||1}/${l.qtde_parcelas||1}</td>
                  <td class="td-mono col-red">${formatCurrency(l.valor)}</td>
                  <td><button class="btn-icon btn-icon-red" onclick="excluirLancCartao(${l.id})">🗑️</button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${lancMes.length > 0 ? `<div style="margin-top:12px;text-align:right;font-weight:700" class="col-red">Total: ${formatCurrency(totalMes)}</div>` : ''}
      </div>
    </div>
    
    <div id="modal-lanc-cartao" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal('modal-lanc-cartao')">
      <div class="modal" style="max-width:450px">
        <div class="modal-header"><h2>💳 Lançamento no Cartão</h2><button class="modal-close" onclick="closeModal('modal-lanc-cartao')">✕</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Data</label><input type="date" class="form-control" id="cc-data" value="${today()}"></div>
          <div class="form-group"><label class="form-label">Descrição *</label><input type="text" class="form-control" id="cc-desc"></div>
          <div class="form-group"><label class="form-label">Categoria</label><input type="text" class="form-control" id="cc-cat" placeholder="Ex: Alimentação"></div>
          <div class="form-row cols-2">
            <div class="form-group"><label class="form-label">Valor *</label><input type="number" step="0.01" class="form-control" id="cc-valor"></div>
            <div class="form-group"><label class="form-label">Parcelas</label><input type="number" class="form-control" id="cc-parc" value="1" min="1"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-lanc-cartao')">Cancelar</button>
          <button class="btn btn-danger" onclick="salvarLancCartao()">💾 Salvar</button>
        </div>
      </div>
    </div>`;
}

function openModalLancCartao() { openModal('modal-lanc-cartao'); }

async function salvarLancCartao() {
  const data = document.getElementById('cc-data').value;
  const desc = document.getElementById('cc-desc').value;
  const valor = parseFloat(document.getElementById('cc-valor').value);
  const parc = parseInt(document.getElementById('cc-parc').value) || 1;
  const cat = document.getElementById('cc-cat').value;
  if (!desc || !valor) { toast('Preencha os campos!', 'error'); return; }
  const valorParc = valor / parc;
  for (let i = 0; i < parc; i++) {
    await dbAdd('lancamentos_cartao', {
      data: addMonths(data, i), descricao: desc, categoria: cat,
      valor: valorParc, parcela_atual: i+1, qtde_parcelas: parc
    });
  }
  closeModal('modal-lanc-cartao');
  toast(`${parc} parcela(s) lançada(s)!`, 'success');
  renderCartao(document.getElementById('content'));
}

async function excluirLancCartao(id) {
  if (!(await confirmDialog('Excluir este lançamento?'))) return;
  await dbDelete('lancamentos_cartao', id);
  renderCartao(document.getElementById('content'));
}

// ── CONCILIAÇÃO BANCÁRIA ──
async function renderConciliacao(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="section-title">🔍 Conciliação Bancária</div>
      <div class="card">
        <div class="card-title">Importar Extrato Bancário</div>
        <div style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">
          Faça upload de um arquivo CSV do seu banco para conciliar com os lançamentos do sistema.
          Formatos suportados: OFX, CSV (colunas: data, descrição, valor).
        </div>
        <div class="form-row cols-3">
          <div class="form-group">
            <label class="form-label">Conta</label>
            <select class="form-control" id="conc-conta"></select>
          </div>
          <div class="form-group">
            <label class="form-label">Período Inicial</label>
            <input type="date" class="form-control" id="conc-di" value="${today().slice(0,7)+'-01'}">
          </div>
          <div class="form-group">
            <label class="form-label">Período Final</label>
            <input type="date" class="form-control" id="conc-df" value="${today()}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Arquivo CSV do Banco (data,descricao,valor)</label>
          <input type="file" class="form-control" id="conc-file" accept=".csv,.ofx,.txt">
        </div>
        <button class="btn btn-primary" onclick="processarConciliacao()">🔍 Processar Conciliação</button>
      </div>
      <div id="conc-resultado" style="display:none"></div>
    </div>`;

  const contas = await dbGet('contas');
  document.getElementById('conc-conta').innerHTML = contas.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

async function processarConciliacao() {
  const file = document.getElementById('conc-file').files[0];
  const di = document.getElementById('conc-di').value;
  const df = document.getElementById('conc-df').value;
  if (!file) { toast('Selecione um arquivo!', 'error'); return; }

  const text = await file.text();
  const lines = text.split('\n').filter(l => l.trim());
  const extrato = [];
  for (const line of lines.slice(1)) { // Skip header
    const parts = line.split(',');
    if (parts.length >= 3) {
      extrato.push({ data: parts[0]?.trim(), descricao: parts[1]?.trim(), valor: parseFloat(parts[2]?.replace(/[^0-9.-]/g,'')) || 0 });
    }
  }

  const [parcRec, parcDesp] = await Promise.all([dbGet('parcelas_receita'), dbGet('parcelas_despesa')]);
  const lançSist = [
    ...parcRec.filter(p => p.dt_pagamento >= di && p.dt_pagamento <= df).map(p => ({ data: p.dt_pagamento, desc: p.descricao||p.tipo_nome, valor: p.valor_pago, tipo: 'Receita' })),
    ...parcDesp.filter(p => p.dt_pagamento >= di && p.dt_pagamento <= df).map(p => ({ data: p.dt_pagamento, desc: p.descricao||p.cat_nome, valor: -p.valor_pago, tipo: 'Despesa' }))
  ];

  const totalExtrato = extrato.reduce((s,e) => s+e.valor, 0);
  const totalSist = lançSist.reduce((s,l) => s+l.valor, 0);

  const res = document.getElementById('conc-resultado');
  res.style.display = 'block';
  res.innerHTML = `
    <div class="split-panel">
      <div class="card">
        <div class="card-title">📄 Extrato do Banco (${extrato.length} lançamentos)</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
            <tbody>${extrato.map(e => `<tr><td>${e.data}</td><td>${e.descricao}</td><td class="td-mono ${e.valor>=0?'col-green':'col-red'}">${formatCurrency(e.valor)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <div style="margin-top:8px;text-align:right;font-weight:700">Total: ${formatCurrency(totalExtrato)}</div>
      </div>
      <div class="card">
        <div class="card-title">💻 Lançamentos do Sistema (${lançSist.length})</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th></tr></thead>
            <tbody>${lançSist.map(l => `<tr><td>${l.data}</td><td>${l.desc}</td><td><span class="badge ${l.tipo==='Receita'?'badge-green':'badge-red'}">${l.tipo}</span></td><td class="td-mono ${l.valor>=0?'col-green':'col-red'}">${formatCurrency(l.valor)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <div style="margin-top:8px;text-align:right;font-weight:700">Total: ${formatCurrency(totalSist)}</div>
      </div>
    </div>
    <div class="card" style="margin-top:0">
      <div class="card-title">📊 Resultado da Conciliação</div>
      <div class="summary-bar">
        <div class="summary-item"><div class="label">Saldo Extrato</div><div class="val col-blue">${formatCurrency(totalExtrato)}</div></div>
        <div class="summary-item"><div class="label">Saldo Sistema</div><div class="val col-blue">${formatCurrency(totalSist)}</div></div>
        <div class="summary-item"><div class="label">Diferença</div><div class="val ${Math.abs(totalExtrato-totalSist)<0.01?'col-green':'col-red'}">${formatCurrency(totalExtrato-totalSist)}</div></div>
        <div class="summary-item"><div class="label">Status</div><div class="val ${Math.abs(totalExtrato-totalSist)<0.01?'col-green':'col-red'}">${Math.abs(totalExtrato-totalSist)<0.01?'✅ Conciliado':'⚠️ Divergência'}</div></div>
      </div>
    </div>`;
}

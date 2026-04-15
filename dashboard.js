// ══════════════════════════════════════════
// DASHBOARD.JS
// ══════════════════════════════════════════

async function renderDashboard(container) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = String(month).padStart(2, '0');
  
  const [parcReceit, parcDesp, contas] = await Promise.all([
    dbGet('parcelas_receita'),
    dbGet('parcelas_despesa'),
    dbGet('contas'),
  ]);
  
  // This month stats
  const recMes = parcReceit.filter(p => p.dt_pagamento && p.dt_pagamento.startsWith(`${year}-${monthStr}`));
  const despMes = parcDesp.filter(p => p.dt_pagamento && p.dt_pagamento.startsWith(`${year}-${monthStr}`));
  const totalRecMes = recMes.reduce((s, p) => s + (p.valor_pago || 0), 0);
  const totalDespMes = despMes.reduce((s, p) => s + (p.valor_pago || 0), 0);
  const saldoMes = totalRecMes - totalDespMes;

  // A receber/pagar (vencidas ou não pagas)
  const aReceber = parcReceit.filter(p => !p.dt_pagamento);
  const aPagar = parcDesp.filter(p => !p.dt_pagamento);
  const vencidas_r = aReceber.filter(p => p.vencimento < today());
  const vencidas_d = aPagar.filter(p => p.vencimento < today());

  const totalAReceber = aReceber.reduce((s, p) => s + (p.valor || 0), 0);
  const totalAPagar = aPagar.reduce((s, p) => s + (p.valor || 0), 0);

  // Monthly summary for year
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const resumoAnual = meses.map((mes, i) => {
    const m = String(i+1).padStart(2,'0');
    const rec = parcReceit.filter(p => p.dt_pagamento && p.dt_pagamento.startsWith(`${year}-${m}`)).reduce((s,p) => s+(p.valor_pago||0), 0);
    const desp = parcDesp.filter(p => p.dt_pagamento && p.dt_pagamento.startsWith(`${year}-${m}`)).reduce((s,p) => s+(p.valor_pago||0), 0);
    return { mes, rec, desp, saldo: rec - desp };
  });

  // Top despesas by category this month
  const despMesMap = {};
  for (const p of despMes) {
    const key = p.categoria || 'Outros';
    despMesMap[key] = (despMesMap[key] || 0) + (p.valor_pago || 0);
  }
  const topDesp = Object.entries(despMesMap).sort((a,b) => b[1]-a[1]).slice(0,5);

  // Year totals
  const totalRecAno = resumoAnual.reduce((s,m) => s+m.rec, 0);
  const totalDespAno = resumoAnual.reduce((s,m) => s+m.desp, 0);

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:20px">
      <!-- KPIs -->
      <div class="grid-4">
        <div class="kpi-card kpi-green">
          <div class="kpi-icon">💰</div>
          <div class="kpi-data">
            <div class="label">Receitas do Mês</div>
            <div class="value">${formatCurrency(totalRecMes)}</div>
            <div class="sub">${recMes.length} pagamentos recebidos</div>
          </div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-icon">💸</div>
          <div class="kpi-data">
            <div class="label">Despesas do Mês</div>
            <div class="value">${formatCurrency(totalDespMes)}</div>
            <div class="sub">${despMes.length} pagamentos efetuados</div>
          </div>
        </div>
        <div class="kpi-card ${saldoMes >= 0 ? 'kpi-blue' : 'kpi-red'}">
          <div class="kpi-icon">${saldoMes >= 0 ? '📈' : '📉'}</div>
          <div class="kpi-data">
            <div class="label">Saldo do Mês</div>
            <div class="value">${formatCurrency(saldoMes)}</div>
            <div class="sub">${meses[month-1]}/${year}</div>
          </div>
        </div>
        <div class="kpi-card kpi-yellow">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-data">
            <div class="label">A Receber</div>
            <div class="value">${formatCurrency(totalAReceber)}</div>
            <div class="sub">${vencidas_r.length} parcela(s) vencida(s)</div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid-2">
        <!-- Receitas x Despesas mensal -->
        <div class="card">
          <div class="card-title">📊 Receitas × Despesas — ${year}</div>
          <canvas id="chart-anual" height="180"></canvas>
        </div>
        <!-- Pizza despesas -->
        <div class="card">
          <div class="card-title">🍕 Despesas por Categoria — ${meses[month-1]}</div>
          <canvas id="chart-pizza" height="180"></canvas>
        </div>
      </div>

      <!-- Resumo anual e Top A Pagar -->
      <div class="grid-2">
        <!-- Resumo anual tabela -->
        <div class="card">
          <div class="card-title">📅 Resumo Anual ${year}</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Mês</th><th>Receita</th><th>Despesa</th><th>Saldo</th></tr></thead>
              <tbody>
                ${resumoAnual.map(m => `
                  <tr>
                    <td style="font-weight:600">${m.mes}</td>
                    <td class="col-green td-mono">${m.rec > 0 ? formatCurrency(m.rec) : '-'}</td>
                    <td class="col-red td-mono">${m.desp > 0 ? formatCurrency(m.desp) : '-'}</td>
                    <td class="td-mono ${m.saldo >= 0 ? 'col-green' : 'col-red'}">${m.rec > 0 || m.desp > 0 ? formatCurrency(m.saldo) : '-'}</td>
                  </tr>`).join('')}
                <tr style="border-top:2px solid var(--border);font-weight:700">
                  <td>TOTAL</td>
                  <td class="col-green td-mono">${formatCurrency(totalRecAno)}</td>
                  <td class="col-red td-mono">${formatCurrency(totalDespAno)}</td>
                  <td class="td-mono ${totalRecAno-totalDespAno >= 0 ? 'col-green' : 'col-red'}">${formatCurrency(totalRecAno-totalDespAno)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Alertas e pendências -->
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="card">
            <div class="card-title">🚨 Parcelas Vencidas</div>
            ${vencidas_r.length === 0 && vencidas_d.length === 0 
              ? '<div class="empty-state" style="padding:20px"><p style="color:var(--accent-green)">✅ Tudo em dia!</p></div>'
              : `<div style="display:flex;flex-direction:column;gap:8px">
                ${vencidas_r.length > 0 ? `<div class="alert alert-warning">📥 ${vencidas_r.length} parcela(s) a receber vencida(s) — ${formatCurrency(vencidas_r.reduce((s,p)=>s+(p.valor||0),0))}</div>` : ''}
                ${vencidas_d.length > 0 ? `<div class="alert alert-danger">📤 ${vencidas_d.length} parcela(s) a pagar vencida(s) — ${formatCurrency(vencidas_d.reduce((s,p)=>s+(p.valor||0),0))}</div>` : ''}
              </div>`}
          </div>
          <div class="card">
            <div class="card-title">🏆 Top Despesas do Mês</div>
            ${topDesp.length === 0 
              ? '<p style="color:var(--text-muted);font-size:13px">Sem despesas pagas este mês</p>'
              : topDesp.map(([cat, val]) => {
                  const pct = totalDespMes > 0 ? (val/totalDespMes*100).toFixed(0) : 0;
                  return `<div style="margin-bottom:10px">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                      <span style="font-size:13px">${cat}</span>
                      <span class="col-red td-mono" style="font-size:12px">${formatCurrency(val)} (${pct}%)</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:var(--accent-red)"></div></div>
                  </div>`;
                }).join('')}
          </div>
        </div>
      </div>
    </div>`;

  // Draw charts after render
  drawDashboardCharts(resumoAnual, meses, topDesp);
}

function drawDashboardCharts(resumoAnual, meses, topDesp) {
  if (typeof Chart === 'undefined') {
    // Load Chart.js dynamically
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = () => drawDashboardCharts(resumoAnual, meses, topDesp);
    document.head.appendChild(s);
    return;
  }

  // Bar chart anual
  const ctx1 = document.getElementById('chart-anual');
  if (ctx1) {
    if (ctx1._chart) ctx1._chart.destroy();
    ctx1._chart = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: meses,
        datasets: [
          { label: 'Receita', data: resumoAnual.map(m => m.rec), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
          { label: 'Despesa', data: resumoAnual.map(m => m.desp), backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8892a4', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#8892a4' }, grid: { color: '#2a3348' } },
          y: { ticks: { color: '#8892a4', callback: v => 'R$'+v.toLocaleString('pt-BR') }, grid: { color: '#2a3348' } }
        }
      }
    });
  }

  // Pie chart despesas
  const ctx2 = document.getElementById('chart-pizza');
  if (ctx2) {
    if (ctx2._chart) ctx2._chart.destroy();
    if (topDesp.length > 0) {
      ctx2._chart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: topDesp.map(([cat]) => cat),
          datasets: [{ data: topDesp.map(([,val]) => val), backgroundColor: ['#ef4444','#f59e0b','#8b5cf6','#06b6d4','#10b981'], borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#8892a4', font: { size: 11 }, padding: 8 } } }
        }
      });
    } else {
      ctx2.parentElement.innerHTML += '<p style="color:var(--text-muted);text-align:center;font-size:13px;margin-top:20px">Sem dados</p>';
    }
  }
}

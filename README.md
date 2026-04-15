# 💰 FinanceiroApp — Sistema de Controle Financeiro

Sistema financeiro completo para controle de receitas e despesas, hospedado no GitHub Pages. **100% client-side** — todos os dados ficam salvos no navegador via IndexedDB (sem servidor necessário).

## 🚀 Como hospedar no GitHub Pages

1. Crie um repositório no GitHub (ex: `financeiro-app`)
2. Faça upload de todos os arquivos mantendo a estrutura de pastas
3. Vá em **Settings → Pages → Source → main branch → Save**
4. Acesse: `https://seu-usuario.github.io/financeiro-app`

## 📁 Estrutura de arquivos

```
financeiro/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── db.js          # Banco de dados IndexedDB
    ├── app.js         # Roteamento e autenticação
    ├── dashboard.js   # Dashboard principal
    ├── lancamentos.js # Lançar receitas e despesas
    ├── contas.js      # Contas a receber/pagar, extrato, transferências
    ├── extras.js      # Relatórios, gráficos, poupança, cartão, conciliação
    └── cadastros.js   # Cadastros, usuários, backup
```

## 🔐 Login padrão
- **Usuário:** `admin`  
- **Senha:** `1234`

*(Altere após o primeiro acesso em Usuários)*

## ✅ Funcionalidades

### 📊 Dashboard
- KPIs do mês (receitas, despesas, saldo, a receber)
- Gráfico de barras anual (receitas × despesas)
- Gráfico de pizza por categoria de despesa
- Resumo mensal do ano
- Alertas de parcelas vencidas

### 💚 Lançamento de Receitas
- Lançamento com parcelamento (1 a 360x)
- Múltiplas contas, categorias, clientes
- Geração automática de parcelas

### ❤️ Lançamento de Despesas
- Categorias e sub-categorias
- Por fornecedor e forma de pagamento
- Lançamento parcelado

### 📥 Contas a Receber
- Painel duplo: pendentes × recebidas
- Quitação individual com data e valor customizados
- Indicadores de vencimento

### 📤 Contas a Pagar
- Painel duplo: pendentes × pagas
- Quitação individual

### 💳 Cartão de Crédito
- Lançamentos com parcelamento
- Controle de limite e gastos do mês
- Visualização por cartão

### 🔄 Transferências entre Contas
- Registro de transferências internas

### 🏦 Poupança / Reserva
- Controle de créditos e débitos
- Saldo atualizado

### 📋 Extrato Comparativo
- Receitas × Despesas lado a lado
- Filtros por mês e ano
- Total e saldo

### 📑 Relatórios (com impressão)
- Receitas por período
- Receitas × Despesas
- Receitas por cliente
- Despesas por período
- Despesas por sub-categoria
- Despesas por fornecedor

### 📈 Gráficos
- Pizza de despesas por categoria (mês atual)
- Pizza de receitas por tipo (mês atual)
- Barras anual (receitas × despesas)
- Linha de fluxo acumulado anual

### 🔍 Conciliação Bancária
- Upload de CSV bancário (data,descricao,valor)
- Comparativo com lançamentos do sistema
- Indicador de diferença

### ⚙️ Cadastros
- Empresa, Contas Bancárias, Clientes, Fornecedores
- Formas de Pagamento, Categorias de Receita
- Categorias de Despesa (com sub-categorias)
- Cartões de Crédito

### 🏢 Centro de Custo
- Cadastro de centros de custo

### 👥 Usuários e Permissões
- Múltiplos usuários com perfis (admin, operador, consulta)

### 💾 Backup
- Export/import JSON completo
- Export CSV por módulo
- Limpeza de dados

## 🔒 Segurança
Os dados ficam salvos no IndexedDB do navegador. Para múltiplos dispositivos, use o backup JSON para transferir dados.

## 🛠️ Tecnologias
- HTML5 + CSS3 + JavaScript (ES2020+)
- IndexedDB para persistência local
- Chart.js 4 para gráficos (CDN)
- Sem frameworks, sem dependências de backend

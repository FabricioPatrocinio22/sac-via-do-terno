# Via do Terno — Sistema de SAC e Pós-Venda (`via-do-terno-sac`)

Sistema web completo para gestão de **SAC, Trocas, Devoluções, Estornos, Reclamações, SLA e NPS** da **Via do Terno**, seguindo exatamente a mesma arquitetura e identidade visual oficial do **CRM Via do Terno**:

- **Identidade Visual Via do Terno**:
  - Menu lateral retrátil preto ônix (`#141416`) com Logos Oficiais da Via do Terno (horizontal e compacto).
  - Destaques em Vermelho Via do Terno (`#C8102E`) e Dourado do Brasão (`#C5A059`).
  - Cards de KPI executivos com borda superior colorida e ícones dedicados.
  - Botão direto de WhatsApp em cada protocolo e cliente.
- **Arquitetura Full-Stack**:
  - **Frontend**: React 18 + TypeScript + Vite + Tailwind + Recharts + Lucide Icons (`porta 5174`).
  - **Backend**: Node.js + Express + TypeScript + PostgreSQL/Supabase (`porta 3334`).
  - **Banco de Dados**: Schema PostgreSQL com prefixo `sac_` (`sac_tickets`, `sac_settings`, `sac_nps_surveys`, `sac_audit_logs`), permitindo coexistir no mesmo banco de dados do CRM sem conflitos e compartilhando o login da equipe!
  - **Modo Híbrido (Online/Local)**: Caso o backend não esteja rodando, o frontend opera automaticamente sincronizado no navegador (`localStorage`).

---

## Como rodar o projeto

### 1. Backend (API + Banco PostgreSQL/Supabase)

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

A API iniciará em `http://localhost:3334`.

### 2. Frontend (Interface Web)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5174` no navegador.

---

## Módulos Incluídos

1. **Login Oficial Via do Terno**: Suporta credenciais do banco (`users`) e botões de acesso rápido para homologação (`Admin`, `Gestor SAC`, `Atendente`).
2. **Dashboard Executivo**: 20+ KPIs e gráficos dinâmicos filtráveis por ano, mês, dia, setor, tipo, status, vendedor e busca textual.
3. **Protocolos de Atendimento**: Listagem completa com tag de protocolo (`SAC-YYYY-XXXXXX`), alertas de SLA e botão direto para chamar no WhatsApp.
4. **Funil Kanban SAC**: Quadro visual estilo CRM com drag-and-drop entre *Novos*, *Em Análise*, *Em Andamento*, *Resolvidos* e *Cancelados*.
5. **Novo Atendimento**: Geração automática de protocolo, alerta/bloqueio/justificativa de pedido duplicado, cálculo automático de prazo SLA, controle de frete, PAC reverso e defeitos de fabricação.
6. **Ficha Detalhada do Protocolo**: Linha do tempo completa, observações, edição de frete/defeito, registro de solução aplicada e nota NPS.
7. **Central de Pendências & SLA**: Priorização por dias de atraso, urgência ou antiguidade.
8. **Central de Reclamações**: Monitoramento dedicado para reclamações e clientes insatisfeitos.
9. **Trocas, Devoluções e Estornos**: Controle financeiro de valores movimentados, fretes pagos pelo cliente vs. Via do Terno e PAC reverso.
10. **Base de Clientes**: Histórico consolidado por cliente com NPS médio e atalho WhatsApp.
11. **Relatórios**: Comparativo semanal/mensal com exportação em planilha CSV e impressão/PDF.
12. **NPS & Satisfação**: Cálculo de Promotores, Neutros, Detratores, evolução e disparo de pesquisas avulsas.
13. **Análise Gerencial**: Diagnóstico executivo automático comparando os últimos 30 dias com o período anterior.
14. **Administração Sem Código**: Edição de setores, vendedores, tipos, motivos, defeitos, status, usuários, campos personalizados e regras de SLA.
15. **Log de Auditoria**: Rastreabilidade completa de todas as ações.

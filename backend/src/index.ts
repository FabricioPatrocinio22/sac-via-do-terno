import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import "express-async-errors";
import jwt from "jsonwebtoken";
import { pool } from "./db";
import { defaultConfig } from "./defaults";
import { seedDatabaseIfEmpty, insertTicketRow } from "./seed";

process.on("unhandledRejection", (reason) => {
  console.error("Rejeição não tratada:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Exceção não tratada:", err);
});

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "10mb" }));

const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_viadoterno_sac_2026_prod";

function mapRowToTicket(r: any) {
  return {
    id: r.id,
    protocolo: r.protocolo,
    dataAbertura: r.data_abertura ? new Date(r.data_abertura).toISOString() : new Date().toISOString(),
    cliente: r.cliente,
    documento: r.documento || "",
    telefone: r.telefone || "",
    email: r.email || "",
    canal: r.canal || "",
    pedido: r.pedido || "",
    notaFiscal: r.nota_fiscal || "",
    valorPedido: Number(r.valor_pedido) || 0,
    loja: r.loja || "",
    setor: r.setor || "",
    vendedor: r.vendedor || "",
    tipo: r.tipo || "",
    motivo: r.motivo || "",
    categoria: r.categoria || "",
    descricao: r.descricao || "",
    prioridade: r.prioridade || "Média",
    status: r.status || "Novo",
    responsavel: r.responsavel || "",
    setorResponsavel: r.setor_responsavel || "SAC",
    prazo: r.prazo ? new Date(r.prazo).toISOString() : new Date().toISOString(),
    valorEnvolvido: Number(r.valor_envolvido) || 0,
    valorFrete: Number(r.valor_frete) || 0,
    fretePagoPor: r.frete_pago_por || "",
    defeitoFabricacao: Boolean(r.defeito_fabricacao),
    defeitoTipo: r.defeito_tipo || "",
    defeitoDescricao: r.defeito_descricao || "",
    custoPacReverso: Number(r.custo_pac_reverso) || 0,
    custoEnvio: Number(r.custo_envio) || 0,
    valorEstorno: Number(r.valor_estorno) || 0,
    valorAbatimento: Number(r.valor_abatimento) || 0,
    outrosCustos: Number(r.outros_custos) || 0,
    solucao: r.solucao || "",
    dataResolucao: r.data_resolucao ? new Date(r.data_resolucao).toISOString() : null,
    responsavelResolucao: r.responsavel_resolucao || "",
    observacaoFinal: r.observacao_final || "",
    clienteSatisfeito: r.cliente_satisfeito,
    nps: r.nps === null || r.nps === undefined ? null : Number(r.nps),
    observacaoCliente: r.observacao_cliente || "",
    timeline: Array.isArray(r.timeline) ? r.timeline : [],
    customFields: r.custom_fields || {},
    duplicidadeJustificada: Boolean(r.duplicidade_justificada),
  };
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "via-do-terno-sac-api" }));

// Autenticação baseada nos usuários cadastrados no SAC (Admin padrão: admin / via@123)
app.post("/auth/login", async (req, res) => {
  const { login, email, password } = req.body || {};
  const identifier = String(login || email || "").trim().toLowerCase();
  const rawPass = String(password || "");

  if (!identifier || !rawPass) {
    return res.status(400).json({ error: "Informe seu usuário e senha." });
  }

  await seedDatabaseIfEmpty(false);

  const cfgRes = await pool.query("SELECT config FROM sac_settings WHERE id = 1").catch(() => ({ rows: [] as any[] }));
  const cfg = cfgRes.rows[0]?.config || defaultConfig();
  const usuarios: any[] = cfg.usuarios || defaultConfig().usuarios;

  const matchedUser = usuarios.find((u: any) => {
    if (u.status && u.status !== "Ativo") return false;
    const uLogin = String(u.login || "").trim().toLowerCase();
    const uEmail = String(u.email || "").trim().toLowerCase();
    const uNome = String(u.nome || "").trim().toLowerCase();
    return identifier === uLogin || identifier === uEmail || identifier === uNome;
  });

  if (matchedUser) {
    const expectedPass = matchedUser.senha || "via@123";
    if (rawPass === expectedPass) {
      const roleMap: Record<string, string> = {
        Administrador: "admin",
        Gestor: "manager",
        "Atendente SAC": "seller",
        Visualização: "viewer",
      };
      const userPayload = {
        id: matchedUser.id,
        name: matchedUser.nome,
        email: matchedUser.email || matchedUser.login,
        role: roleMap[matchedUser.perfil] || "admin",
        sacRole: matchedUser.perfil || "Administrador",
      };
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "12h" });
      return res.json({ token, user: userPayload });
    }
  }

  // Garantia de acesso para o admin padrão (admin / via@123)
  if ((identifier === "admin" || identifier === "admin@viadoterno.com.br") && rawPass === "via@123") {
    const userPayload = {
      id: "u_admin",
      name: "Administrador",
      email: "admin@viadoterno.com.br",
      role: "admin",
      sacRole: "Administrador",
    };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "12h" });
    return res.json({ token, user: userPayload });
  }

  return res.status(401).json({ error: "Usuário ou senha inválidos." });
});

app.get("/auth/me", (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    res.json({ user: payload });
  } catch {
    res.status(401).json({ error: "Sessão expirada." });
  }
});

// Carrega todos os dados iniciais do SAC de uma só vez
app.get("/bootstrap", async (_req, res) => {
  await seedDatabaseIfEmpty(false);

  const [cfgRes, ticketsRes, npsRes, auditRes] = await Promise.all([
    pool.query("SELECT config FROM sac_settings WHERE id = 1"),
    pool.query("SELECT * FROM sac_tickets ORDER BY data_abertura DESC"),
    pool.query("SELECT * FROM sac_nps_surveys ORDER BY data_envio DESC"),
    pool.query("SELECT * FROM sac_audit_logs ORDER BY data DESC LIMIT 400"),
  ]);

  const config = { ...defaultConfig(), ...(cfgRes.rows[0]?.config || {}) };
  const tickets = ticketsRes.rows.map(mapRowToTicket);
  const npsSurveys = npsRes.rows.map((s) => ({
    id: s.id,
    cliente: s.cliente,
    protocolo: s.protocolo,
    canal: s.canal,
    dataEnvio: s.data_envio ? new Date(s.data_envio).toISOString() : new Date().toISOString(),
    status: s.status,
    nota: s.nota === null || s.nota === undefined ? null : Number(s.nota),
    comentario: s.comentario || "",
    dataResposta: s.data_resposta ? new Date(s.data_resposta).toISOString() : null,
  }));
  const auditLog = auditRes.rows.map((a) => ({
    id: a.id,
    data: a.data ? new Date(a.data).toISOString() : new Date().toISOString(),
    usuario: a.usuario,
    acao: a.acao,
    detalhe: a.detalhe || "",
  }));

  res.json({ config, tickets, npsSurveys, auditLog });
});

// Atualizar configurações administrativas (incluindo criação/edição de usuários com senha)
app.put("/config", async (req, res) => {
  const { config, usuario, acao, detalhe } = req.body || {};
  if (!config) return res.status(400).json({ error: "Configuração inválida." });

  await pool.query(
    `INSERT INTO sac_settings (id, config, updated_at)
     VALUES (1, $1, now())
     ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config, updated_at = now()`,
    [JSON.stringify(config)]
  );

  if (acao) {
    await pool.query(
      `INSERT INTO sac_audit_logs (id, data, usuario, acao, detalhe) VALUES ($1, now(), $2, $3, $4)`,
      [`log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, usuario || "Sistema", acao, detalhe || ""]
    );
  }

  res.json({ ok: true, config });
});

// Criar ou atualizar atendimento
app.post("/tickets", async (req, res) => {
  const { ticket, usuario, acao, detalhe } = req.body || {};
  if (!ticket || !ticket.id || !ticket.protocolo) {
    return res.status(400).json({ error: "Dados do atendimento incompletos." });
  }

  await insertTicketRow(ticket);

  if (acao) {
    await pool.query(
      `INSERT INTO sac_audit_logs (id, data, usuario, acao, detalhe) VALUES ($1, now(), $2, $3, $4)`,
      [`log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, usuario || "Sistema", acao, detalhe || ""]
    );
  }

  res.status(201).json({ ok: true, ticket });
});

app.put("/tickets/:id", async (req, res) => {
  const { ticket, usuario, acao, detalhe } = req.body || {};
  if (!ticket) return res.status(400).json({ error: "Atendimento inválido." });

  await insertTicketRow({ ...ticket, id: req.params.id });

  if (acao) {
    await pool.query(
      `INSERT INTO sac_audit_logs (id, data, usuario, acao, detalhe) VALUES ($1, now(), $2, $3, $4)`,
      [`log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, usuario || "Sistema", acao, detalhe || ""]
    );
  }

  res.json({ ok: true, ticket });
});

app.delete("/tickets/:id", async (req, res) => {
  const { usuario } = req.body || {};
  const existing = await pool.query("SELECT protocolo, cliente FROM sac_tickets WHERE id = $1", [req.params.id]);
  await pool.query("DELETE FROM sac_tickets WHERE id = $1", [req.params.id]);
  if (existing.rows[0]) {
    await pool.query(
      `INSERT INTO sac_audit_logs (id, data, usuario, acao, detalhe) VALUES ($1, now(), $2, $3, $4)`,
      [
        `log_${Date.now()}`,
        usuario || "Administrador",
        "Atendimento excluído",
        `${existing.rows[0].protocolo} — ${existing.rows[0].cliente}`,
      ]
    );
  }
  res.json({ ok: true });
});

// Pesquisas NPS
app.post("/nps", async (req, res) => {
  const { survey, usuario } = req.body || {};
  if (!survey || !survey.id) return res.status(400).json({ error: "Pesquisa inválida." });

  await pool.query(
    `INSERT INTO sac_nps_surveys (id, cliente, protocolo, canal, data_envio, status, nota, comentario, data_resposta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status,
       nota = EXCLUDED.nota,
       comentario = EXCLUDED.comentario,
       data_resposta = EXCLUDED.data_resposta`,
    [
      survey.id,
      survey.cliente,
      survey.protocolo || null,
      survey.canal || "WhatsApp",
      survey.dataEnvio || new Date().toISOString(),
      survey.status || "Enviada",
      survey.nota ?? null,
      survey.comentario || "",
      survey.dataResposta || null,
    ]
  );

  await pool.query(
    `INSERT INTO sac_audit_logs (id, data, usuario, acao, detalhe) VALUES ($1, now(), $2, $3, $4)`,
    [
      `log_${Date.now()}`,
      usuario || "Sistema",
      survey.status === "Respondida" ? "Resposta de pesquisa NPS registrada" : "Pesquisa NPS enviada",
      `${survey.cliente} (${survey.canal})`,
    ]
  );

  res.json({ ok: true, survey });
});

// Limpar base de dados (deixando apenas o usuário admin)
app.post("/reset-demo", async (_req, res) => {
  await seedDatabaseIfEmpty(true);
  res.json({ ok: true });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Erro interno SAC API:", err);
  res.status(500).json({ error: err?.message || "Erro interno no servidor SAC." });
});

const port = process.env.PORT || 3334;
app.listen(port, () => console.log(`API do SAC Via do Terno rodando na porta ${port}`));

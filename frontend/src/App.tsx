import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ShieldCheck, PlusCircle } from "lucide-react";
import Login, { SacAuthUser } from "./pages/Login";
import DashboardView from "./pages/DashboardView";
import KanbanSacView from "./pages/KanbanSacView";
import {
  AtendimentosView, NovoAtendimentoView, DetalheView, PendenciasView,
  ReclamacoesView, TrocasView, ClientesView
} from "./pages/TicketsViews";
import {
  RelatoriosView, NpsView, AnaliseView, AdministracaoView, AuditoriaView
} from "./pages/ManagementViews";
import {
  C, LOGO_URL, LOGO_COMPACT_URL, Button, EmptyState, Toast
} from "./components/ui";
import { defaultConfig, PERMS, uid } from "./defaults";
import { sacApi, setToken } from "./api";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "atendimentos", label: "Atendimentos", icon: "📋" },
  { id: "kanban", label: "Funil Kanban SAC", icon: "🗂️" },
  { id: "novo", label: "Novo Atendimento", icon: "➕" },
  { id: "pendencias", label: "Pendências & SLA", icon: "⏳" },
  { id: "reclamacoes", label: "Reclamações", icon: "⚠️" },
  { id: "trocas", label: "Trocas e Devoluções", icon: "🔄" },
  { id: "clientes", label: "Clientes", icon: "👥" },
  { id: "relatorios", label: "Relatórios", icon: "📈" },
  { id: "nps", label: "NPS & Satisfação", icon: "⭐" },
  { id: "analise", label: "Análise Gerencial", icon: "🏆" },
  { id: "administracao", label: "Administração", icon: "⚙️", admin: true },
  { id: "auditoria", label: "Auditoria", icon: "🛡️", admin: true },
];

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard SAC & Pós-Venda", subtitle: "Visão executiva de protocolos, trocas, devoluções, SLA e satisfação" },
  atendimentos: { title: "Protocolos de Atendimento", subtitle: "Gestão centralizada de chamados do SAC Via do Terno" },
  kanban: { title: "Funil Kanban de Pós-Venda", subtitle: "Arraste os protocolos entre as etapas operacionais do SAC" },
  detalhe: { title: "Ficha do Protocolo", subtitle: "Histórico completo, logística reversa, defeitos e resolução" },
  novo: { title: "Abrir Novo Atendimento", subtitle: "Registro de protocolo com cálculo automático de SLA e verificação de pedido" },
  pendencias: { title: "Central de Pendências & SLA", subtitle: "Monitoramento de prazos e atendimentos em aberto" },
  reclamacoes: { title: "Central de Reclamações", subtitle: "Acompanhamento prioritário de reclamações e insatisfações" },
  trocas: { title: "Trocas, Devoluções e Estornos", subtitle: "Controle financeiro de logística reversa, fretes e reembolsos" },
  clientes: { title: "Base de Clientes Atendidos", subtitle: "Histórico consolidado de pós-venda por cliente" },
  relatorios: { title: "Relatórios Executivos", subtitle: "Indicadores consolidados e exportação de dados" },
  nps: { title: "NPS & Pesquisa de Satisfação", subtitle: "Métricas de lealdade, promotores, neutros e detratores" },
  analise: { title: "Análise Gerencial Automática", subtitle: "Diagnóstico inteligente dos últimos 30 dias comparado ao período anterior" },
  administracao: { title: "Administração do SAC", subtitle: "Parametrização de setores, vendedores, motivos, defeitos, usuários e SLAs" },
  auditoria: { title: "Log de Auditoria", subtitle: "Rastreabilidade completa de ações realizadas no sistema" },
};

function Sidebar({
  view,
  setView,
  user,
  role,
  onLogout,
  collapsed,
  setCollapsed,
  pendentesCount,
}: {
  view: string;
  setView: (v: string) => void;
  user: SacAuthUser;
  role: string;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (c: boolean | ((p: boolean) => boolean)) => void;
  pendentesCount: number;
}) {
  return (
    <div
      style={{
        width: collapsed ? 72 : 240,
        background: C.wineDark,
        height: "100vh",
        padding: collapsed ? "16px 8px" : "18px 14px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), padding 0.2s ease",
        position: "relative",
        boxSizing: "border-box",
        zIndex: 20,
      }}
    >
      {/* Topo: Logo Oficial Via do Terno & Botão de Recolher/Expandir (idêntico ao CRM) */}
      {collapsed ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: 8, marginBottom: 16 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
              padding: 4,
              boxSizing: "border-box",
            }}
          >
            <img src={LOGO_COMPACT_URL} alt="Via do Terno" style={{ maxHeight: 36, maxWidth: 36, objectFit: "contain" }} />
          </div>
          <button
            onClick={() => setCollapsed(false)}
            title="Expandir menu lateral"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              color: "#CBD5E1",
              width: 32,
              height: 24,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.wine;
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "#CBD5E1";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              flex: 1,
              marginRight: 8,
              overflow: "hidden",
            }}
          >
            <img src={LOGO_URL} alt="Via do Terno" style={{ maxHeight: 32, maxWidth: "100%", objectFit: "contain" }} />
          </div>
          <button
            onClick={() => setCollapsed(true)}
            title="Recolher menu lateral"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              color: "#CBD5E1",
              width: 28,
              height: 28,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.wine;
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "#CBD5E1";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      )}

      {!collapsed && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: C.gold,
            textTransform: "uppercase",
            letterSpacing: 1.1,
            paddingLeft: 8,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Módulo SAC & Pós-Venda</span>
        </div>
      )}

      {/* Lista de Navegação */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {NAV_ITEMS.filter((it) => !it.admin || role === "Administrador").map((it) => {
          const isActive = view === it.id || (it.id === "atendimentos" && view === "detalhe");
          return (
            <div
              key={it.id}
              onClick={() => setView(it.id)}
              title={collapsed ? it.label : undefined}
              style={{
                padding: collapsed ? "10px 0" : "9px 12px",
                borderRadius: 8,
                fontSize: 13,
                color: isActive ? "#fff" : "#A1A1AA",
                background: isActive ? C.wine : "transparent",
                boxShadow: isActive ? "0 2px 6px rgba(200, 16, 46, 0.35)" : "none",
                cursor: "pointer",
                fontWeight: isActive ? 700 : 500,
                display: "flex",
                justifyContent: collapsed ? "center" : "flex-start",
                alignItems: "center",
                gap: collapsed ? 0 : 10,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#A1A1AA";
                }
              }}
            >
              <span style={{ fontSize: collapsed ? 17 : 14, display: "flex", alignItems: "center" }}>
                {it.icon}
              </span>
              {!collapsed && (
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                  {it.label}
                </span>
              )}
              {!collapsed && it.id === "pendencias" && pendentesCount > 0 && (
                <span
                  style={{
                    background: isActive ? "#fff" : C.wine,
                    color: isActive ? C.wine : "#fff",
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 10,
                  }}
                >
                  {pendentesCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodapé Fixo: Usuário e Sair da Conta */}
      <div
        style={{
          marginTop: "auto",
          padding: collapsed ? "10px 4px" : "12px 10px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 8,
          flexShrink: 0,
        }}
      >
        {!collapsed ? (
          <div>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name}
            </div>
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 600, marginTop: 1, marginBottom: 8 }}>
              {role}
            </div>
            <div
              onClick={onLogout}
              style={{
                color: "#EF4444",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span>🚪</span> Sair da conta
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div
              title={`${user.name} (${role})`}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: C.gold,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              title="Sair da conta"
              style={{
                background: "transparent",
                border: "none",
                color: "#EF4444",
                fontSize: 16,
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🚪
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<SacAuthUser | null>(() => {
    const saved = localStorage.getItem("vt_sac_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("vt_sac_sidebar_collapsed") === "true");
  const [ready, setReady] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [config, setConfig] = useState<any>(defaultConfig());
  const [tickets, setTickets] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [npsSurveys, setNpsSurveys] = useState<any[]>([]);
  const [view, setView] = useState("dashboard");
  const [role, setRole] = useState("Administrador");
  const [currentUser, setCurrentUser] = useState("Administrador");
  const [toast, setToast] = useState<any>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("vt_sac_sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (user) {
      setCurrentUser(user.name);
      setRole(user.sacRole || "Administrador");
    }
  }, [user]);

  const perms = PERMS[role] || PERMS["Administrador"];

  // Carrega dados do Backend PostgreSQL ou Fallback LocalStorage
  const loadData = useCallback(async () => {
    // Remove cache antigo de demonstração se existir
    localStorage.removeItem("vt_sac_v1");

    try {
      const data = await sacApi.bootstrap();
      setConfig({ ...defaultConfig(), ...(data.config || {}) });
      setTickets(data.tickets || []);
      setNpsSurveys(data.npsSurveys || []);
      setAuditLog(data.auditLog || []);
      setBackendConnected(true);
      setReady(true);
      return;
    } catch {
      setBackendConnected(false);
    }

    // Fallback LocalStorage (Produção limpa)
    try {
      const saved = localStorage.getItem("vt_sac_prod_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig({ ...defaultConfig(), ...(parsed.config || {}) });
        setTickets(parsed.tickets || []);
        setAuditLog(parsed.auditLog || []);
        setNpsSurveys(parsed.npsSurveys || []);
      } else {
        const cfg = defaultConfig();
        const initialAudit = [
          {
            id: uid("log"),
            data: new Date().toISOString(),
            usuario: "Sistema",
            acao: "Sistema inicializado",
            detalhe: "Base limpa pronta para operação.",
          },
        ];
        setConfig(cfg);
        setTickets([]);
        setNpsSurveys([]);
        setAuditLog(initialAudit);
        localStorage.setItem(
          "vt_sac_prod_v1",
          JSON.stringify({ config: cfg, tickets: [], auditLog: initialAudit, npsSurveys: [] })
        );
      }
    } catch {
      const cfg = defaultConfig();
      setConfig(cfg);
      setTickets([]);
      setNpsSurveys([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      localStorage.removeItem("vt_sac_user");
      setUser(null);
    };
    window.addEventListener("sac_auth_expired", handleAuthExpired);
    return () => window.removeEventListener("sac_auth_expired", handleAuthExpired);
  }, []);

  // Persistência automática em LocalStorage como espelho de segurança
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("vt_sac_prod_v1", JSON.stringify({ config, tickets, auditLog, npsSurveys }));
    } catch {}
  }, [config, tickets, auditLog, npsSurveys, ready]);

  const addAudit = useCallback(
    (acao: string, detalhe: string) => {
      setAuditLog((prev) => [
        { id: uid("log"), data: new Date().toISOString(), usuario: currentUser, acao, detalhe },
        ...prev,
      ]);
    },
    [currentUser]
  );

  const showToast = (message: string, tone = "success") => setToast({ message, tone, key: Date.now() });

  const nextProtocol = useMemo(() => {
    const year = new Date().getFullYear();
    const nums = tickets
      .map((t) => t.protocolo)
      .filter((p) => p && p.startsWith(`SAC-${year}-`))
      .map((p) => parseInt(p.split("-")[2], 10));
    const max = nums.length ? Math.max(...nums) : 0;
    return `SAC-${year}-${String(max + 1).padStart(6, "0")}`;
  }, [tickets]);

  const createTicket = async (data: any) => {
    const now = new Date().toISOString();
    const ticket = {
      id: uid("t"),
      protocolo: nextProtocol,
      dataAbertura: now,
      timeline: [{ data: now, usuario: currentUser, acao: "Atendimento criado", comentario: `Canal: ${data.canal || "—"}` }],
      status: "Novo",
      nps: null,
      clienteSatisfeito: null,
      duplicidadeJustificada: !!data.duplicidadeJustificada,
      ...data,
    };
    setTickets((prev) => [ticket, ...prev]);
    addAudit("Atendimento criado", `${ticket.protocolo} — ${ticket.cliente}`);
    showToast(`Protocolo ${ticket.protocolo} gerado com sucesso!`);
    if (backendConnected) {
      sacApi.createTicket(ticket, currentUser, "Atendimento criado", `${ticket.protocolo} — ${ticket.cliente}`).catch(() => {});
    }
    return ticket;
  };

  const updateTicket = (id: string, patch: any, actionLabel?: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const now = new Date().toISOString();
        const changes = Object.keys(patch).filter(
          (k) => k !== "timeline" && JSON.stringify(patch[k]) !== JSON.stringify(t[k])
        );
        const historyEntry = {
          data: now,
          usuario: currentUser,
          acao: actionLabel || "Atendimento atualizado",
          comentario: changes.map((k) => `${k}: "${t[k] ?? ""}" → "${patch[k] ?? ""}"`).join("; "),
        };
        const updated = {
          ...t,
          ...patch,
          timeline: patch.timeline ? patch.timeline : [...(t.timeline || []), historyEntry],
        };
        addAudit(actionLabel || "Atendimento atualizado", `${t.protocolo} — ${historyEntry.comentario || actionLabel}`);
        if (backendConnected) {
          sacApi
            .updateTicket(id, updated, currentUser, actionLabel || "Atendimento atualizado", `${t.protocolo} — ${historyEntry.comentario || actionLabel}`)
            .catch(() => {});
        }
        return updated;
      })
    );
    showToast(actionLabel || "Protocolo atualizado!");
  };

  const deleteTicket = (id: string) => {
    const target = tickets.find((t) => t.id === id);
    setTickets((prev) => prev.filter((t) => t.id !== id));
    if (target) {
      addAudit("Atendimento excluído", `${target.protocolo} — ${target.cliente}`);
    }
    if (backendConnected) {
      sacApi.deleteTicket(id, currentUser).catch(() => {});
    }
    showToast("Protocolo excluído.");
    setView("atendimentos");
  };

  const handleUpdateConfig = (updater: (c: any) => any) => {
    setConfig((prev: any) => {
      const next = updater(prev);
      if (backendConnected) {
        sacApi.saveConfig(next, currentUser, "Configuração atualizada", "Administração SAC").catch(() => {});
      }
      return next;
    });
  };

  const findDuplicate = (pedido: string, excludeId?: string) => {
    return tickets.find((t) => t.id !== excludeId && String(t.pedido) === String(pedido));
  };

  const addNpsSurvey = (data: any) => {
    const survey = {
      id: uid("nps"),
      status: "Enviada",
      nota: null,
      comentario: "",
      dataResposta: null,
      dataEnvio: new Date().toISOString(),
      ...data,
    };
    setNpsSurveys((prev) => [survey, ...prev]);
    addAudit("Pesquisa NPS enviada", `${survey.cliente} via ${survey.canal}`);
    if (backendConnected) {
      sacApi.saveNps(survey, currentUser).catch(() => {});
    }
    showToast(`Pesquisa enviada para ${survey.cliente}`);
  };

  const respondNpsSurvey = (id: string, nota: number, comentario: string) => {
    setNpsSurveys((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, status: "Respondida", nota, comentario, dataResposta: new Date().toISOString() };
        if (backendConnected) {
          sacApi.saveNps(updated, currentUser).catch(() => {});
        }
        return updated;
      })
    );
    const s = npsSurveys.find((x) => x.id === id);
    addAudit("Resposta de pesquisa NPS registrada", `${s ? s.cliente : ""} — nota ${nota}`);
    showToast("Resposta NPS registrada!");
  };

  function handleLogin(u: SacAuthUser) {
    localStorage.setItem("vt_sac_user", JSON.stringify(u));
    setUser(u);
  }

  function handleLogout() {
    setToken(null);
    localStorage.removeItem("vt_sac_user");
    setUser(null);
  }

  const pendentesCount = useMemo(
    () => tickets.filter((t) => !["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(t.status)).length,
    [tickets]
  );

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (!ready) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: C.inkSoft, fontFamily: "'Inter',sans-serif" }}>
        Carregando SAC Via do Terno…
      </div>
    );
  }

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);
  const headerMeta = VIEW_TITLES[view] || { title: "SAC Via do Terno", subtitle: "" };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: C.bg,
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      {/* Barra Lateral Preta Ônix Retrátil (Idêntica ao CRM Via do Terno) */}
      <Sidebar
        view={view}
        setView={setView}
        user={user}
        role={role}
        onLogout={handleLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        pendentesCount={pendentesCount}
      />

      {/* Área Principal com Scroll Independente */}
      <div
        style={{
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        {/* Topbar Executiva */}
        <div
          style={{
            background: "#fff",
            borderBottom: `1px solid ${C.border}`,
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 21, margin: 0, color: C.ink, fontWeight: 600 }}>
              {headerMeta.title}
            </h1>
            {headerMeta.subtitle && (
              <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{headerMeta.subtitle}</div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 20,
                background: backendConnected ? C.successSoft : C.goldSoft,
                color: backendConnected ? C.success : "#92400E",
                border: `1px solid ${backendConnected ? "#BBF7D0" : "#FDE68A"}`,
              }}
            >
              {backendConnected ? "● Conectado ao Banco" : "● Modo Local Sincronizado"}
            </span>

            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 8,
                background: C.bg,
                color: C.ink,
                border: `1px solid ${C.border}`,
              }}
              title="Usuário autenticado"
            >
              👤 {currentUser} <span style={{ color: C.inkSoft, fontWeight: 500 }}>({role})</span>
            </span>

            {view !== "novo" && (
              <Button size="sm" variant="primary" icon={PlusCircle} onClick={() => setView("novo")}>
                Novo Protocolo
              </Button>
            )}
          </div>
        </div>

        {/* Conteúdo da Visão Selecionada */}
        <div style={{ padding: "24px 32px 48px", flex: 1 }}>
          {view === "dashboard" && <DashboardView tickets={tickets} config={config} />}
          {view === "atendimentos" && (
            <AtendimentosView
              tickets={tickets}
              config={config}
              onOpen={(id) => {
                setSelectedTicketId(id);
                setView("detalhe");
              }}
              onNew={() => setView("novo")}
              perms={perms}
            />
          )}
          {view === "kanban" && (
            <KanbanSacView
              tickets={tickets}
              config={config}
              onOpen={(id) => {
                setSelectedTicketId(id);
                setView("detalhe");
              }}
              onChangeStatus={(id, newStatus) => updateTicket(id, { status: newStatus }, `Movido no Kanban para ${newStatus}`)}
            />
          )}
          {view === "detalhe" && selectedTicket && (
            <DetalheView
              ticket={selectedTicket}
              config={config}
              perms={perms}
              onBack={() => setView("atendimentos")}
              onUpdate={(patch, label) => updateTicket(selectedTicket.id, patch, label)}
              onDelete={deleteTicket}
            />
          )}
          {view === "novo" && (
            <NovoAtendimentoView
              config={config}
              nextProtocol={nextProtocol}
              findDuplicate={findDuplicate}
              onCreate={async (data) => {
                const t = await createTicket(data);
                setSelectedTicketId(t.id);
                setView("detalhe");
              }}
            />
          )}
          {view === "pendencias" && (
            <PendenciasView
              tickets={tickets}
              config={config}
              onOpen={(id) => {
                setSelectedTicketId(id);
                setView("detalhe");
              }}
            />
          )}
          {view === "reclamacoes" && (
            <ReclamacoesView
              tickets={tickets}
              config={config}
              onOpen={(id) => {
                setSelectedTicketId(id);
                setView("detalhe");
              }}
            />
          )}
          {view === "trocas" && (
            <TrocasView
              tickets={tickets}
              config={config}
              onOpen={(id) => {
                setSelectedTicketId(id);
                setView("detalhe");
              }}
            />
          )}
          {view === "clientes" && <ClientesView tickets={tickets} />}
          {view === "relatorios" && <RelatoriosView tickets={tickets} config={config} />}
          {view === "nps" && (
            <NpsView
              tickets={tickets}
              config={config}
              surveys={npsSurveys}
              onAddSurvey={addNpsSurvey}
              onRespondSurvey={respondNpsSurvey}
            />
          )}
          {view === "analise" && <AnaliseView tickets={tickets} config={config} />}
          {view === "administracao" && perms.administrar && (
            <AdministracaoView
              config={config}
              setConfig={handleUpdateConfig}
              addAudit={addAudit}
              showToast={showToast}
            />
          )}
          {view === "administracao" && !perms.administrar && (
            <EmptyState
              icon={ShieldCheck}
              title="Acesso Restrito ao Administrador"
              body="Seu perfil atual não tem permissão para alterar configurações estruturais do sistema."
            />
          )}
          {view === "auditoria" && perms.administrar && <AuditoriaView log={auditLog} />}
          {view === "auditoria" && !perms.administrar && (
            <EmptyState
              icon={ShieldCheck}
              title="Acesso Restrito ao Administrador"
              body="Seu perfil atual não tem permissão para visualizar o log de auditoria."
            />
          )}
        </div>
      </div>

      {toast && <Toast key={toast.key} message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}

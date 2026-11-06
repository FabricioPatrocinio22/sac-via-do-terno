import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ShieldCheck, PlusCircle } from "lucide-react";
import Login, { SacAuthUser } from "./pages/Login";
import DashboardView from "./pages/DashboardView";
import KanbanSacView from "./pages/KanbanSacView";
import {
  AtendimentosView, NovoAtendimentoView, DetalheView
} from "./pages/TicketsViews";
import {
  RelatoriosHubView, AdministracaoView
} from "./pages/ManagementViews";
import {
  C, LOGO_URL, LOGO_COMPACT_URL, Button, EmptyState, Toast
} from "./components/ui";
import { defaultConfig, PERMS, uid } from "./defaults";
import { sacApi, setToken } from "./api";

const NAV_ITEMS = [
  { id: "dashboard", label: "Painel Geral", icon: "📊" },
  { id: "atendimentos", label: "Atendimentos", icon: "📋" },
  { id: "kanban", label: "Quadro Kanban", icon: "🗂️" },
  { id: "relatorios", label: "Relatórios & NPS", icon: "⭐" },
  { id: "administracao", label: "Equipe & Cadastros", icon: "⚙️", admin: true },
];

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Painel Geral", subtitle: "Resumo simples dos atendimentos, trocas e pendências do dia" },
  atendimentos: { title: "Atendimentos", subtitle: "Consulte, filtre e acompanhe todos os chamados de clientes" },
  kanban: { title: "Quadro Kanban", subtitle: "Arraste os cartões de uma coluna para outra conforme o andamento" },
  detalhe: { title: "Ficha do Atendimento", subtitle: "Converse com o cliente, anote atualizações e mude de etapa com 1 clique" },
  novo: { title: "Novo Atendimento", subtitle: "Cadastre rapidamente uma troca, devolução ou solicitação de cliente" },
  relatorios: { title: "Relatórios & Satisfação (NPS)", subtitle: "Notas dos clientes, diagnóstico do mês e exportação para Excel" },
  administracao: { title: "Equipe & Cadastros", subtitle: "Gerencie usuários, senhas, vendedores, setores e motivos" },
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
        width: collapsed ? 72 : 236,
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
      {/* Topo: Logo Oficial Via do Terno */}
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
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
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
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Botão Principal de Ação Rápida: + Novo Atendimento */}
      <button
        onClick={() => setView("novo")}
        title="Registrar Novo Atendimento"
        style={{
          width: "100%",
          padding: collapsed ? "11px 0" : "11px 14px",
          marginBottom: 18,
          borderRadius: 10,
          border: `1px solid ${view === "novo" ? "#fff" : "rgba(255,255,255,0.14)"}`,
          background: C.wine,
          color: "#fff",
          fontWeight: 700,
          fontSize: 13.5,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 4px 12px rgba(200, 16, 46, 0.35)",
          transition: "all 0.15s ease",
        }}
      >
        <PlusCircle size={17} />
        {!collapsed && <span>Novo Atendimento</span>}
      </button>

      {!collapsed && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#71717A",
            textTransform: "uppercase",
            letterSpacing: 1,
            paddingLeft: 8,
            marginBottom: 8,
          }}
        >
          Menu Principal
        </div>
      )}

      {/* Lista de Navegação Enxuta (apenas 4 itens + Equipe p/ Admin) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {NAV_ITEMS.filter((it) => !it.admin || role === "Administrador").map((it) => {
          const isActive = view === it.id || (it.id === "atendimentos" && view === "detalhe");
          return (
            <div
              key={it.id}
              onClick={() => setView(it.id)}
              title={collapsed ? it.label : undefined}
              style={{
                padding: collapsed ? "11px 0" : "11px 12px",
                borderRadius: 9,
                fontSize: 13.5,
                color: isActive ? "#fff" : "#CBD5E1",
                background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                borderLeft: !collapsed && isActive ? `3px solid ${C.gold}` : "3px solid transparent",
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
                  e.currentTarget.style.color = "#CBD5E1";
                }
              }}
            >
              <span style={{ fontSize: collapsed ? 18 : 16, display: "flex", alignItems: "center" }}>
                {it.icon}
              </span>
              {!collapsed && (
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                  {it.label}
                </span>
              )}
              {!collapsed && it.id === "atendimentos" && pendentesCount > 0 && (
                <span
                  style={{
                    background: C.wine,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 10,
                  }}
                  title={`${pendentesCount} atendimento(s) em aberto`}
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
              }}
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

  const loadData = useCallback(async () => {
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
      timeline: [{ data: now, usuario: currentUser, acao: "Atendimento aberto", comentario: `Canal: ${data.canal || "—"}` }],
      status: "Novo",
      nps: null,
      clienteSatisfeito: null,
      duplicidadeJustificada: !!data.duplicidadeJustificada,
      ...data,
    };
    setTickets((prev) => [ticket, ...prev]);
    addAudit("Atendimento criado", `${ticket.protocolo} — ${ticket.cliente}`);
    showToast(`Atendimento ${ticket.protocolo} criado com sucesso!`);
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
    showToast(actionLabel || "Atendimento atualizado!");
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
    showToast("Atendimento excluído.");
    setView("atendimentos");
  };

  const handleUpdateConfig = (updater: (c: any) => any) => {
    setConfig((prev: any) => {
      const next = updater(prev);
      if (backendConnected) {
        sacApi.saveConfig(next, currentUser, "Configuração atualizada", "Equipe & Cadastros").catch(() => {});
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
    showToast(`Pesquisa registrada para ${survey.cliente}`);
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
    addAudit("Nota NPS registrada", `${s ? s.cliente : ""} — nota ${nota}`);
    showToast("Nota do cliente salva!");
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
      {/* Menu Lateral Limpo (apenas 4 itens + Equipe p/ Admin) */}
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

      {/* Área Principal */}
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
        {/* Barra Superior Limpa e Direta */}
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
            <h1 style={{ fontSize: 20, margin: 0, color: C.ink, fontWeight: 700 }}>
              {headerMeta.title}
            </h1>
            {headerMeta.subtitle && (
              <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>{headerMeta.subtitle}</div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {!backendConnected && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: C.goldSoft,
                  color: "#92400E",
                  border: "1px solid #FDE68A",
                }}
              >
                ● Sem conexão com servidor (salvando local)
              </span>
            )}

            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 8,
                background: C.bg,
                color: C.ink,
                border: `1px solid ${C.border}`,
              }}
            >
              👤 {currentUser}
            </span>

            {view !== "novo" && (
              <Button size="sm" variant="primary" icon={PlusCircle} onClick={() => setView("novo")}>
                Novo Atendimento
              </Button>
            )}
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div style={{ padding: "24px 32px 48px", flex: 1 }}>
          {view === "dashboard" && (
            <DashboardView
              tickets={tickets}
              config={config}
              onNew={() => setView("novo")}
              onGoAtendimentos={() => setView("atendimentos")}
              onOpenTicket={(id) => {
                setSelectedTicketId(id);
                setView("detalhe");
              }}
            />
          )}

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
              onNew={() => setView("novo")}
              onChangeStatus={(id, newStatus) => updateTicket(id, { status: newStatus }, `Movido para ${newStatus}`)}
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
              onCancel={() => setView(tickets.length > 0 ? "atendimentos" : "dashboard")}
              onCreate={async (data) => {
                const t = await createTicket(data);
                setSelectedTicketId(t.id);
                setView("detalhe");
              }}
            />
          )}

          {view === "relatorios" && (
            <RelatoriosHubView
              tickets={tickets}
              config={config}
              surveys={npsSurveys}
              onAddSurvey={addNpsSurvey}
              onRespondSurvey={respondNpsSurvey}
            />
          )}

          {view === "administracao" && perms.administrar && (
            <AdministracaoView
              config={config}
              setConfig={handleUpdateConfig}
              addAudit={addAudit}
              showToast={showToast}
              auditLog={auditLog}
            />
          )}

          {view === "administracao" && !perms.administrar && (
            <EmptyState
              icon={ShieldCheck}
              title="Acesso Restrito ao Administrador"
              body="Apenas administradores podem gerenciar usuários e cadastros do sistema."
            />
          )}
        </div>
      </div>

      {toast && <Toast key={toast.key} message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}

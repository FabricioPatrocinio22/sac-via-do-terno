import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Search, X, SlidersHorizontal, PlusCircle, ChevronRight } from "lucide-react";
import {
  C, BRAND, Card, KpiCard, Button, TInput, TSelect, EmptyState, Badge, ProtocolTag,
  fmtCurrency, fmtDate, FONT_SANS, WHATSAPP_ICON_URL, buildWhatsAppLink
} from "../components/ui";

export const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function daysBetween(a: string | Date, b: string | Date) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

export function statusColor(statusList: any[], nome: string) {
  const s = (statusList || []).find((x) => x.nome === nome);
  return s ? s.cor : "info";
}

export function useTicketFilters(tickets: any[], _config: any) {
  const [filters, setFilters] = useState({
    periodo: "", ano: "", mes: "", dia: "", setor: "", tipo: "", categoria: "", status: "", vendedor: "", prioridade: "", busca: "",
  });
  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const clear = () =>
    setFilters({ periodo: "", ano: "", mes: "", dia: "", setor: "", tipo: "", categoria: "", status: "", vendedor: "", prioridade: "", busca: "" });

  const anosDisponiveis = useMemo(() => {
    const anosComDados = new Set(tickets.map((t) => new Date(t.dataAbertura).getFullYear()));
    const anoAtual = new Date().getFullYear();
    const anoMin = Math.min(anoAtual, ...(anosComDados.size ? Array.from(anosComDados) : [anoAtual]));
    const anos: number[] = [];
    for (let a = Math.max(anoAtual + 1, 2027); a >= anoMin; a--) anos.push(a);
    return anos;
  }, [tickets]);

  const filtered = useMemo(() => {
    const now = new Date();
    return tickets.filter((t) => {
      if (filters.setor && t.setor !== filters.setor) return false;
      if (filters.tipo && t.tipo !== filters.tipo) return false;
      if (filters.categoria && t.categoria !== filters.categoria) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.vendedor && t.vendedor !== filters.vendedor) return false;
      if (filters.prioridade && t.prioridade !== filters.prioridade) return false;

      const d = new Date(t.dataAbertura);
      if (filters.periodo === "hoje") {
        if (d.toDateString() !== now.toDateString()) return false;
      } else if (filters.periodo === "7d") {
        if (daysBetween(d, now) > 7) return false;
      } else if (filters.periodo === "30d") {
        if (daysBetween(d, now) > 30) return false;
      } else if (filters.periodo === "mes_atual") {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }

      if (filters.ano && d.getFullYear() !== Number(filters.ano)) return false;
      if (filters.mes && d.getMonth() + 1 !== Number(filters.mes)) return false;
      if (filters.dia) {
        const diaStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (diaStr !== filters.dia) return false;
      }
      if (filters.busca) {
        const q = filters.busca.toLowerCase();
        const hay = `${t.protocolo} ${t.cliente} ${t.pedido} ${t.notaFiscal} ${t.vendedor} ${t.telefone || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, filters]);

  return { filters, set, clear, filtered, anosDisponiveis };
}

export function FilterBar({
  filters,
  set,
  clear,
  config,
  showBusca,
  anosDisponiveis = [],
}: {
  filters: any;
  set: (k: string, v: string) => void;
  clear: () => void;
  config: any;
  showBusca?: boolean;
  anosDisponiveis?: number[];
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasActiveFilter = Object.values(filters).some(Boolean);
  const hasAdvancedFilter = Boolean(filters.ano || filters.mes || filters.dia || filters.vendedor || filters.tipo || filters.status);

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        {showBusca && (
          <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: 10, color: C.inkSoft }} />
            <TInput
              placeholder="Buscar por nome do cliente, WhatsApp, nº do pedido ou protocolo..."
              value={filters.busca}
              onChange={(e) => set("busca", e.target.value)}
              style={{ width: "100%", paddingLeft: 34 }}
            />
          </div>
        )}

        <TSelect
          value={filters.periodo || ""}
          onChange={(e) => {
            set("periodo", e.target.value);
            if (e.target.value !== "custom") {
              set("ano", "");
              set("mes", "");
              set("dia", "");
            } else {
              setShowAdvanced(true);
            }
          }}
          style={{ width: 175 }}
        >
          <option value="">📅 Todo o período</option>
          <option value="hoje">Hoje</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="mes_atual">Este mês</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="custom">Escolher mês / data...</option>
        </TSelect>

        <TSelect value={filters.setor} onChange={(e) => set("setor", e.target.value)} style={{ width: 165 }}>
          <option value="">🏢 Todos os setores</option>
          {config.setores.map((s: string) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </TSelect>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            borderRadius: 8,
            border: `1px solid ${showAdvanced || hasAdvancedFilter ? C.wine : C.border}`,
            background: showAdvanced || hasAdvancedFilter ? C.wineSoft : "#fff",
            color: showAdvanced || hasAdvancedFilter ? C.wine : C.inkSoft,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: FONT_SANS,
          }}
        >
          <SlidersHorizontal size={14} />
          {showAdvanced ? "Menos filtros" : "Mais filtros"}
        </button>

        {hasActiveFilter && (
          <Button size="sm" variant="ghost" icon={X} onClick={clear} style={{ color: C.wine, fontWeight: 700 }}>
            Limpar filtros
          </Button>
        )}
      </div>

      {(showAdvanced || filters.periodo === "custom") && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px dashed ${C.border}`,
            alignItems: "center",
          }}
        >
          <TSelect value={filters.vendedor} onChange={(e) => set("vendedor", e.target.value)} style={{ width: 175 }}>
            <option value="">👤 Todos os vendedores</option>
            {config.vendedores.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </TSelect>

          <TSelect value={filters.tipo} onChange={(e) => set("tipo", e.target.value)} style={{ width: 160 }}>
            <option value="">🏷️ Todos os tipos</option>
            {config.tipos.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </TSelect>

          <TSelect value={filters.status} onChange={(e) => set("status", e.target.value)} style={{ width: 170 }}>
            <option value="">📌 Todas as etapas</option>
            {config.status.map((s: any) => (
              <option key={s.nome} value={s.nome}>{s.nome}</option>
            ))}
          </TSelect>

          <TSelect value={filters.mes} onChange={(e) => set("mes", e.target.value)} style={{ width: 140 }}>
            <option value="">Mês: todos</option>
            {MESES_PT.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </TSelect>

          <TSelect value={filters.ano} onChange={(e) => set("ano", e.target.value)} style={{ width: 120 }}>
            <option value="">Ano: todos</option>
            {anosDisponiveis.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </TSelect>

          <TInput
            type="date"
            value={filters.dia}
            onChange={(e) => set("dia", e.target.value)}
            style={{ width: 145 }}
            title="Filtrar dia exato"
          />
        </div>
      )}
    </div>
  );
}

const DASHBOARD_TABS = [
  { id: "geral", label: "Resumo Geral", icon: "📊" },
  { id: "trocas", label: "Trocas & Setores", icon: "🔄" },
  { id: "logistica", label: "Custos de Frete", icon: "🚚" },
  { id: "qualidade", label: "Defeitos nas Peças", icon: "🧵" },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: string }> = {
  "Novo": { color: "#3B82F6", bg: "#EFF6FF", icon: "✨" },
  "Em análise": { color: "#8B5CF6", bg: "#F5F3FF", icon: "🔎" },
  "Aguardando cliente": { color: "#F59E0B", bg: "#FFFBEB", icon: "⏳" },
  "Aguardando setor": { color: "#D97706", bg: "#FEF3C7", icon: "🏢" },
  "Em negociação": { color: "#EA580C", bg: "#FFEDD5", icon: "🤝" },
  "Aprovado": { color: "#10B981", bg: "#ECFDF5", icon: "👍" },
  "Resolvido": { color: "#059669", bg: "#DCFCE7", icon: "✅" },
  "Finalizado": { color: "#16A34A", bg: "#DCFCE7", icon: "🏆" },
  "Recusado": { color: "#EF4444", bg: "#FEF2F2", icon: "❌" },
  "Cancelado": { color: "#DC2626", bg: "#FEE2E2", icon: "🚫" },
};

export default function DashboardView({
  tickets,
  config,
  onNew,
  onOpenTicket,
  onGoAtendimentos,
}: {
  tickets: any[];
  config: any;
  onNew?: () => void;
  onOpenTicket?: (id: string) => void;
  onGoAtendimentos?: () => void;
}) {
  const [activeTab, setActiveTab] = useState("geral");
  const { filters, set, clear, filtered, anosDisponiveis } = useTicketFilters(tickets, config);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const abertosList = filtered.filter((t) => !["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(t.status));
    const abertos = abertosList.length;
    const finalizados = total - abertos;
    const atrasados = abertosList.filter((t) => new Date(t.prazo) < new Date()).length;
    const npsList = filtered.filter((t) => t.nps !== null && t.nps !== undefined);
    const promotores = npsList.filter((t) => t.nps >= 9).length;
    const detratores = npsList.filter((t) => t.nps <= 6).length;
    const npsScore = npsList.length ? Math.round(((promotores - detratores) / npsList.length) * 100) : null;
    const valorTotal = filtered.reduce((s, t) => s + (t.valorEnvolvido || 0), 0);
    const custoFrete = filtered.reduce((s, t) => s + (t.custoPacReverso || 0) + (t.custoEnvio || 0), 0);
    const estornos = filtered.reduce((s, t) => s + (t.valorEstorno || 0), 0);
    const abatimentos = filtered.reduce((s, t) => s + (t.valorAbatimento || 0), 0);
    const resolvidos = filtered.filter((t) => t.dataResolucao);
    const tempoMedio = resolvidos.length
      ? Math.round(resolvidos.reduce((s, t) => s + daysBetween(t.dataAbertura, t.dataResolucao), 0) / resolvidos.length)
      : 0;
    return { total, abertos, abertosList, finalizados, atrasados, npsScore, valorTotal, custoFrete, estornos, abatimentos, tempoMedio };
  }, [filtered]);

  const porTipo = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((t) => { map[t.tipo] = (map[t.tipo] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const porStatus = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((t) => { map[t.status] = (map[t.status] || 0) + 1; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const evolucao = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((t) => {
      const d = new Date(t.dataAbertura);
      const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const [da, ma] = a.name.split("/").map(Number);
        const [db, mb] = b.name.split("/").map(Number);
        return new Date(2026, ma - 1, da).getTime() - new Date(2026, mb - 1, db).getTime();
      });
  }, [filtered]);

  const motivos = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((t) => { map[t.categoria] = (map[t.categoria] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filtered]);

  const trocaDevolEstorno = useMemo(() => {
    const trocas = filtered.filter((t) => t.tipo === "Troca");
    const devolucoes = filtered.filter((t) => t.tipo === "Devolução");
    const estornos = filtered.filter((t) => t.tipo === "Estorno");
    const sum = (arr: any[]) => arr.reduce((s, t) => s + (t.valorEnvolvido || 0), 0);
    return {
      qtdTrocas: trocas.length, valorTrocas: sum(trocas),
      qtdDevolucoes: devolucoes.length, valorDevolucoes: sum(devolucoes),
      qtdEstornos: estornos.length, valorEstornos: sum(estornos),
    };
  }, [filtered]);

  const comparativoSetor = useMemo(() => {
    const map: Record<string, { setor: string; qtd: number; valor: number }> = {};
    filtered.forEach((t) => {
      if (!map[t.setor]) map[t.setor] = { setor: t.setor, qtd: 0, valor: 0 };
      map[t.setor].qtd += 1;
      map[t.setor].valor += t.valorEnvolvido || 0;
    });
    const totalValor = Object.values(map).reduce((s, r) => s + r.valor, 0);
    return Object.values(map)
      .map((r) => ({ ...r, ticketMedio: r.qtd ? r.valor / r.qtd : 0, pctValor: totalValor ? (r.valor / totalValor) * 100 : 0 }))
      .sort((a, b) => b.valor - a.valor);
  }, [filtered]);

  const tabelaMensal = useMemo(() => {
    const map: Record<string, { mes: string; trocas: number; devolucoes: number; total: number; valor: number }> = {};
    MESES_PT.forEach((m) => { map[m] = { mes: m, trocas: 0, devolucoes: 0, total: 0, valor: 0 }; });
    filtered.forEach((t) => {
      const m = MESES_PT[new Date(t.dataAbertura).getMonth()];
      if (!map[m]) return;
      map[m].total += 1;
      map[m].valor += t.valorEnvolvido || 0;
      if (t.tipo === "Troca") map[m].trocas += 1;
      if (t.tipo === "Devolução") map[m].devolucoes += 1;
    });
    return MESES_PT.map((m) => map[m]);
  }, [filtered]);

  const clientesQueMaisTrocaram = useMemo(() => {
    const map: Record<string, { cliente: string; qtd: number; valor: number }> = {};
    const totalTrocas = filtered.filter((t) => t.tipo === "Troca").length;
    filtered.filter((t) => t.tipo === "Troca").forEach((t) => {
      if (!map[t.cliente]) map[t.cliente] = { cliente: t.cliente, qtd: 0, valor: 0 };
      map[t.cliente].qtd += 1;
      map[t.cliente].valor += t.valorEnvolvido || 0;
    });
    return Object.values(map)
      .map((r) => ({ ...r, taxa: totalTrocas ? (r.qtd / totalTrocas) * 100 : 0 }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 8);
  }, [filtered]);

  const trocasPorVendedor = useMemo(() => {
    const map: Record<string, { vendedor: string; qtd: number; valor: number }> = {};
    const totalTrocas = filtered.filter((t) => t.tipo === "Troca").length;
    filtered.filter((t) => t.tipo === "Troca").forEach((t) => {
      if (!map[t.vendedor]) map[t.vendedor] = { vendedor: t.vendedor, qtd: 0, valor: 0 };
      map[t.vendedor].qtd += 1;
      map[t.vendedor].valor += t.valorEnvolvido || 0;
    });
    return Object.values(map)
      .map((r) => ({ ...r, taxa: totalTrocas ? (r.qtd / totalTrocas) * 100 : 0 }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [filtered]);

  const freteDefeito = useMemo(() => {
    const sum = (arr: any[]) => arr.reduce((s, t) => s + (t.valorFrete || 0), 0);
    const pagoCliente = filtered.filter((t) => t.fretePagoPor === "Cliente");
    const pagoEmpresa = filtered.filter((t) => t.fretePagoPor === "Via do Terno");
    const semInfo = filtered.filter((t) => (t.valorFrete || 0) > 0 && !t.fretePagoPor);
    const defeitos = filtered.filter((t) => t.defeitoFabricacao);
    const tipoMap: Record<string, number> = {};
    const vendMap: Record<string, number> = {};
    defeitos.forEach((t) => {
      const k = t.defeitoTipo || "Não informado";
      tipoMap[k] = (tipoMap[k] || 0) + 1;
      vendMap[t.vendedor] = (vendMap[t.vendedor] || 0) + 1;
    });
    return {
      qtdCliente: pagoCliente.length, valorCliente: sum(pagoCliente),
      qtdEmpresa: pagoEmpresa.length, valorEmpresa: sum(pagoEmpresa),
      qtdSemInfo: semInfo.length, valorSemInfo: sum(semInfo),
      qtdDefeitos: defeitos.length,
      pctDefeitos: filtered.length ? (defeitos.length / filtered.length) * 100 : 0,
      fretePie: [{ name: "Pago pelo Cliente", value: sum(pagoCliente) }, { name: "Pago pela Via do Terno", value: sum(pagoEmpresa) }].filter((x) => x.value > 0),
      defeitosPorTipo: Object.entries(tipoMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      defeitosPorVendedor: Object.entries(vendMap).map(([vendedor, qtd]) => ({ vendedor, qtd })).sort((a, b) => b.qtd - a.qtd),
    };
  }, [filtered]);

  const maxStatusCount = Math.max(...porStatus.map((s) => s.value), 1);
  const maxMotivoCount = Math.max(...motivos.map((m) => m.value), 1);
  const maxTipoCount = Math.max(...porTipo.map((t) => t.value), 1);

  // Tela de Boas-Vindas limpa e amigável quando ainda não há nenhum atendimento cadastrado
  if (tickets.length === 0) {
    return (
      <div style={{ maxWidth: 960, margin: "12px auto" }}>
        <div
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "40px 36px",
            textAlign: "center",
            boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: C.wineSoft,
              color: C.wine,
              fontSize: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            👋
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>
            Bem-vindo ao SAC & Pós-Venda Via do Terno
          </h2>
          <p style={{ fontSize: 14.5, color: C.inkSoft, maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Sua base está limpa e pronta para uso! Assim que o primeiro atendimento for registrado, os números e gráficos aparecerão aqui automaticamente.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 16,
              textAlign: "left",
              marginBottom: 30,
            }}
          >
            <div style={{ background: C.bg, padding: 18, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>1️⃣</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 4 }}>Registre o chamado</div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>
                Clique em <strong>Novo Atendimento</strong> quando um cliente solicitar troca, devolução ou suporte.
              </div>
            </div>
            <div style={{ background: C.bg, padding: 18, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>2️⃣</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 4 }}>Acompanhe com facilidade</div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>
                Veja os casos em aberto em <strong>Atendimentos</strong> ou arraste os cartões no <strong>Quadro Kanban</strong>.
              </div>
            </div>
            <div style={{ background: C.bg, padding: 18, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>3️⃣</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 4 }}>Conclua e avalie</div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>
                Chame o cliente no WhatsApp com 1 clique e finalize o protocolo quando tudo estiver resolvido.
              </div>
            </div>
          </div>

          {onNew && (
            <Button variant="primary" icon={PlusCircle} onClick={onNew} style={{ padding: "12px 24px", fontSize: 14.5 }}>
              Registrar Primeiro Atendimento
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto" }}>
      {/* Barra de Filtros Limpa */}
      <FilterBar filters={filters} set={set} clear={clear} config={config} showBusca anosDisponiveis={anosDisponiveis} />

      {/* Navegação em Abas do Painel */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          background: "#fff",
          padding: 6,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          width: "fit-content",
          flexWrap: "wrap",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        {DASHBOARD_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 16px",
                borderRadius: 8,
                border: "none",
                background: isActive ? C.wine : "transparent",
                color: isActive ? "#fff" : C.inkSoft,
                fontWeight: isActive ? 700 : 600,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: FONT_SANS,
                boxShadow: isActive ? "0 2px 6px rgba(200, 16, 46, 0.28)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "qualidade" && freteDefeito.qtdDefeitos > 0 && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 10,
                    background: isActive ? "#fff" : C.dangerSoft,
                    color: isActive ? C.wine : C.danger,
                  }}
                >
                  {freteDefeito.qtdDefeitos}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          ABA 1: RESUMO GERAL (4 CARTÕES CLAROS + PENDÊNCIAS DO DIA)
         ===================================================================== */}
      {activeTab === "geral" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <KpiCard
              label="Total de Atendimentos"
              value={kpis.total}
              sub={`${fmtCurrency(kpis.valorTotal)} em pedidos`}
              accent="#3B82F6"
              icon="📋"
            />
            <KpiCard
              label="Em Aberto (Para Resolver)"
              value={kpis.abertos}
              sub={kpis.abertos > 0 ? "Aguardando solução" : "Tudo em dia!"}
              accent="#F59E0B"
              icon="⏳"
            />
            <KpiCard
              label="Fora do Prazo"
              value={kpis.atrasados}
              trend={kpis.atrasados > 0 ? "down" : "flat"}
              sub={kpis.atrasados > 0 ? "Precisam de prioridade hoje" : "Nenhum atrasado"}
              accent={C.danger}
              icon="🚨"
            />
            <KpiCard
              label="Concluídos com Sucesso"
              value={kpis.finalizados}
              sub={kpis.tempoMedio ? `Média de ${kpis.tempoMedio} dia(s)` : "Finalizados"}
              accent={C.success}
              icon="✅"
            />
          </div>

          {/* Lista Rápida dos Atendimentos em Aberto (para quem opera no dia a dia) */}
          {kpis.abertosList.length > 0 && (
            <Card
              title={`⚡ Atendimentos que precisam de atenção (${kpis.abertosList.length})`}
              subtitle="Clique em qualquer linha para abrir o chamado e atender o cliente"
              right={
                onGoAtendimentos && (
                  <Button size="sm" variant="secondary" onClick={onGoAtendimentos}>
                    Ver todos os atendimentos
                  </Button>
                )
              }
              style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}
            >
              <div style={{ overflowX: "auto" }}>
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Protocolo</th>
                      <th>Cliente</th>
                      <th>O que precisa</th>
                      <th>Pedido / Setor</th>
                      <th>Etapa Atual</th>
                      <th>Prazo</th>
                      <th style={{ textAlign: "right" }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.abertosList.slice(0, 6).map((t) => {
                      const atrasado = new Date(t.prazo) < new Date();
                      const waUrl = buildWhatsAppLink(t.telefone, t.cliente, t.protocolo);
                      return (
                        <tr
                          key={t.id}
                          onClick={() => onOpenTicket && onOpenTicket(t.id)}
                          style={{ cursor: onOpenTicket ? "pointer" : "default" }}
                        >
                          <td><ProtocolTag protocolo={t.protocolo} /></td>
                          <td>
                            <div style={{ fontWeight: 700, color: C.ink }}>{t.cliente}</div>
                            {t.telefone && <div style={{ fontSize: 11.5, color: C.inkSoft }}>{t.telefone}</div>}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{t.tipo}</div>
                            <div style={{ fontSize: 11.5, color: C.inkSoft }}>{t.categoria}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>Ped. #{t.pedido}</div>
                            <div style={{ fontSize: 11.5, color: C.inkSoft }}>{t.setor}</div>
                          </td>
                          <td><Badge tone={statusColor(config.status, t.status)}>{t.status}</Badge></td>
                          <td>
                            {atrasado ? (
                              <Badge tone="danger">Fora do prazo</Badge>
                            ) : (
                              <span style={{ fontSize: 12.5, color: C.inkSoft }}>Até {fmtDate(t.prazo)}</span>
                            )}
                          </td>
                          <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              {waUrl && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Chamar ${t.cliente} no WhatsApp`}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    background: "#F0FDF4",
                                    border: "1px solid #BBF7D0",
                                  }}
                                >
                                  <img src={WHATSAPP_ICON_URL} alt="WhatsApp" style={{ width: 15, height: 15 }} />
                                </a>
                              )}
                              {onOpenTicket && (
                                <button
                                  onClick={() => onOpenTicket(t.id)}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}
                                >
                                  <ChevronRight size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Gráficos de Evolução e Etapas */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 18 }}>
            <Card
              title="Atendimentos Abertos por Dia"
              subtitle="Volume diário registrado no período"
            >
              {evolucao.length === 0 ? (
                <EmptyState title="Sem dados neste filtro" body="Altere o filtro acima para visualizar outros períodos." />
              ) : (
                <ResponsiveContainer width="100%" height={235}>
                  <BarChart data={evolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={{ stroke: C.border }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" fill={C.wine} radius={[4, 4, 0, 0]} name="Atendimentos" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Situação Atual dos Atendimentos" subtitle="Quantidade em cada etapa">
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 240, overflowY: "auto", paddingRight: 4 }}>
                {porStatus.map((s) => {
                  const cfg = STATUS_STYLE[s.name] || { color: C.wine, bg: "#F4F5F8", icon: "📌" };
                  const pct = kpis.total ? ((s.value / kpis.total) * 100).toFixed(0) : "0";
                  return (
                    <div key={s.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{cfg.icon}</span> {s.name}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{s.value}</span>
                          <span style={{ fontSize: 11, color: C.inkSoft, background: cfg.bg, padding: "2px 6px", borderRadius: 10, fontWeight: 600 }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div style={{ background: "#F1F5F9", borderRadius: 6, height: 7, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${(s.value / maxStatusCount) * 100}%`,
                            background: cfg.color,
                            height: "100%",
                            borderRadius: 6,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Principais Motivos dos Clientes" subtitle="O que mais gerou contato no pós-venda">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {motivos.length === 0 ? (
                  <EmptyState title="Sem dados" body="—" />
                ) : (
                  motivos.map((m, idx) => {
                    const pct = kpis.total ? ((m.value / kpis.total) * 100).toFixed(0) : "0";
                    return (
                      <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: idx === 0 ? C.wineSoft : C.graySoft,
                            color: idx === 0 ? C.wine : C.inkSoft,
                            fontSize: 12,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}º
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: C.ink }}>{m.name}</span>
                            <span style={{ fontWeight: 700, color: C.ink }}>
                              {m.value} <span style={{ fontSize: 11, color: C.inkSoft, fontWeight: 400 }}>({pct}%)</span>
                            </span>
                          </div>
                          <div style={{ background: "#F1F5F9", borderRadius: 4, height: 6, overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${(m.value / maxMotivoCount) * 100}%`,
                                background: idx === 0 ? C.wine : C.gold,
                                height: "100%",
                                borderRadius: 4,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            <Card title="Tipos de Solicitação" subtitle="Divisão entre trocas, devoluções, suporte e reclamações">
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {porTipo.length === 0 ? (
                  <EmptyState title="Sem dados" body="—" />
                ) : (
                  porTipo.slice(0, 6).map((t, idx) => {
                    const pct = kpis.total ? ((t.value / kpis.total) * 100).toFixed(0) : "0";
                    return (
                      <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: C.ink }}>{t.name}</span>
                            <span style={{ fontWeight: 700, color: C.ink }}>
                              {t.value} <span style={{ fontSize: 11, color: C.inkSoft, fontWeight: 400 }}>({pct}%)</span>
                            </span>
                          </div>
                          <div style={{ background: "#F1F5F9", borderRadius: 4, height: 6, overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${(t.value / maxTipoCount) * 100}%`,
                                background: idx === 0 ? C.wineDark : "#475569",
                                height: "100%",
                                borderRadius: 4,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 2: TROCAS, DEVOLUÇÕES & SETORES
         ===================================================================== */}
      {activeTab === "trocas" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
            <KpiCard
              label="Total em Trocas"
              value={fmtCurrency(trocaDevolEstorno.valorTrocas)}
              sub={`${trocaDevolEstorno.qtdTrocas} troca(s)`}
              accent={C.wine}
              icon="🔄"
            />
            <KpiCard
              label="Total em Devoluções"
              value={fmtCurrency(trocaDevolEstorno.valorDevolucoes)}
              sub={`${trocaDevolEstorno.qtdDevolucoes} devolução(ões)`}
              accent={C.gold}
              icon="📦"
            />
            <KpiCard
              label="Total em Estornos"
              value={fmtCurrency(trocaDevolEstorno.valorEstornos)}
              sub={`${trocaDevolEstorno.qtdEstornos} estorno(s)`}
              accent={C.danger}
              icon="↩️"
            />
            <KpiCard
              label="Valor Médio por Caso"
              value={fmtCurrency(kpis.total ? kpis.valorTotal / kpis.total : 0)}
              sub="Média dos pedidos atendidos"
              accent={C.info}
              icon="🏷️"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card title="Comparativo por Setor" style={{ padding: 0 }}>
              <div style={{ padding: "12px 20px 20px" }}>
                {comparativoSetor.length === 0 ? (
                  <EmptyState title="Sem dados" body="—" />
                ) : (
                  <table className="dt">
                    <thead>
                      <tr><th>Setor</th><th>Qtd.</th><th>Valor Total</th><th>Média</th><th>%</th></tr>
                    </thead>
                    <tbody>
                      {comparativoSetor.map((r) => (
                        <tr key={r.setor}>
                          <td style={{ fontWeight: 700 }}>{r.setor}</td>
                          <td>{r.qtd}</td>
                          <td>{fmtCurrency(r.valor)}</td>
                          <td>{fmtCurrency(r.ticketMedio)}</td>
                          <td><strong style={{ color: C.wine }}>{r.pctValor.toFixed(1)}%</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>

            <Card title="Clientes que Mais Solicitaram Troca" style={{ padding: 0 }}>
              <div style={{ padding: "12px 20px 20px" }}>
                {clientesQueMaisTrocaram.length === 0 ? (
                  <EmptyState title="Sem trocas no período" body="Nenhum registro de troca nos filtros atuais." />
                ) : (
                  <table className="dt">
                    <thead>
                      <tr><th>Cliente</th><th>Trocas</th><th>Valor</th><th>%</th></tr>
                    </thead>
                    <tbody>
                      {clientesQueMaisTrocaram.map((r) => (
                        <tr key={r.cliente}>
                          <td style={{ fontWeight: 600 }}>{r.cliente}</td>
                          <td><strong>{r.qtd}</strong></td>
                          <td>{fmtCurrency(r.valor)}</td>
                          <td>{r.taxa.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>

          <Card title="Trocas por Vendedor(a)" style={{ marginBottom: 16, padding: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <div style={{ padding: 20 }}>
                {trocasPorVendedor.length === 0 ? (
                  <EmptyState title="Sem trocas no período" body="Nenhum registro de troca nos filtros atuais." />
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(190, trocasPorVendedor.length * 26)}>
                    <BarChart data={trocasPorVendedor} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="vendedor" width={95} tick={{ fontSize: 10.5 }} />
                      <Tooltip />
                      <Bar dataKey="qtd" fill={C.wine} radius={[0, 4, 4, 0]} name="Trocas" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{ padding: 20, borderLeft: `1px solid ${BRAND.border}`, overflowX: "auto" }}>
                {trocasPorVendedor.length > 0 && (
                  <table className="dt">
                    <thead>
                      <tr><th>Vendedor(a)</th><th>Trocas</th><th>Valor</th><th>%</th></tr>
                    </thead>
                    <tbody>
                      {trocasPorVendedor.map((r) => (
                        <tr key={r.vendedor}>
                          <td style={{ fontWeight: 600 }}>{r.vendedor}</td>
                          <td>{r.qtd}</td>
                          <td>{fmtCurrency(r.valor)}</td>
                          <td>{r.taxa.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </Card>

          <Card title="Resumo Mês a Mês" style={{ padding: 0 }}>
            <div style={{ padding: "12px 20px 20px", overflowX: "auto" }}>
              <table className="dt">
                <thead>
                  <tr><th>Mês</th><th>Trocas</th><th>Devoluções</th><th>Total</th><th>Valor Movimentado</th></tr>
                </thead>
                <tbody>
                  {tabelaMensal.map((r) => (
                    <tr key={r.mes} style={r.total === 0 ? { color: C.inkSoft } : {}}>
                      <td style={{ fontWeight: 600 }}>{r.mes}</td>
                      <td>{r.trocas}</td>
                      <td>{r.devolucoes}</td>
                      <td><strong>{r.total}</strong></td>
                      <td>{fmtCurrency(r.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* =====================================================================
          ABA 3: CUSTOS DE FRETE
         ===================================================================== */}
      {activeTab === "logistica" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
            <KpiCard
              label="Custo Correios (Ida + Volta)"
              value={fmtCurrency(kpis.custoFrete)}
              sub="PAC reverso + reenvio"
              accent={C.amber}
              icon="🚚"
            />
            <KpiCard
              label="Frete Pago pela Via do Terno"
              value={fmtCurrency(freteDefeito.valorEmpresa)}
              sub={`${freteDefeito.qtdEmpresa} atendimento(s)`}
              accent={C.wine}
              icon="🏢"
            />
            <KpiCard
              label="Frete Pago pelo Cliente"
              value={fmtCurrency(freteDefeito.valorCliente)}
              sub={`${freteDefeito.qtdCliente} atendimento(s)`}
              accent={C.info}
              icon="👤"
            />
            <KpiCard
              label="Descontos / Abatimentos"
              value={fmtCurrency(kpis.abatimentos)}
              sub="Concedidos em boleto/pedido"
              accent={C.purple}
              icon="🧾"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16 }}>
            <Card title="Quem Pagou o Frete?" subtitle="Comparativo entre Cliente e Via do Terno">
              {freteDefeito.fretePie.length === 0 ? (
                <EmptyState title="Sem frete informado" body="Nenhum frete registrado nos filtros atuais." />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={freteDefeito.fretePie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                      {freteDefeito.fretePie.map((_, i) => (
                        <Cell key={i} fill={[C.info, C.wine][i % 2]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmtCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Detalhamento de Custos de Envio e Estorno" subtitle="Valores acumulados nos protocolos">
              <table className="dt">
                <thead>
                  <tr><th>Item</th><th>Qtd. Casos</th><th>Valor Total</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Frete pago pelo Cliente</td>
                    <td>{freteDefeito.qtdCliente}</td>
                    <td><strong>{fmtCurrency(freteDefeito.valorCliente)}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Frete pago pela Via do Terno</td>
                    <td>{freteDefeito.qtdEmpresa}</td>
                    <td><strong style={{ color: C.wine }}>{fmtCurrency(freteDefeito.valorEmpresa)}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Custo de Correios Reverso + Reenvio</td>
                    <td>{kpis.total}</td>
                    <td><strong>{fmtCurrency(kpis.custoFrete)}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Estornos devolvidos aos clientes</td>
                    <td>{trocaDevolEstorno.qtdEstornos}</td>
                    <td><strong style={{ color: C.danger }}>{fmtCurrency(kpis.estornos)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 4: DEFEITOS NAS PEÇAS
         ===================================================================== */}
      {activeTab === "qualidade" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
            <KpiCard
              label="Casos com Defeito na Peça"
              value={freteDefeito.qtdDefeitos}
              sub="Costura, tecido, botão, medidas..."
              accent={C.danger}
              icon="🧵"
            />
            <KpiCard
              label="% Sobre o Total"
              value={`${freteDefeito.pctDefeitos.toFixed(1)}%`}
              sub="Proporção dos atendimentos"
              accent={C.gold}
              icon="📐"
            />
            <KpiCard
              label="Defeito Mais Comum"
              value={freteDefeito.defeitosPorTipo[0]?.name || "Nenhum"}
              sub={
                freteDefeito.defeitosPorTipo[0]
                  ? `${freteDefeito.defeitosPorTipo[0].value} ocorrência(s)`
                  : "Sem defeitos registrados"
              }
              accent={C.wine}
              icon="🔍"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
            <Card title="Tipos de Defeito Encontrados" subtitle="Contagem por tipo de problema na peça">
              {freteDefeito.defeitosPorTipo.length === 0 ? (
                <EmptyState title="Nenhum defeito registrado" body="Nenhuma peça com defeito nos filtros atuais." />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={freteDefeito.defeitosPorTipo} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill={C.danger} radius={[0, 4, 4, 0]} name="Defeitos" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Defeitos por Vendedor(a)" subtitle="Pedidos que apresentaram avaria">
              {freteDefeito.defeitosPorVendedor.length === 0 ? (
                <EmptyState title="Sem defeitos" body="—" />
              ) : (
                <table className="dt">
                  <thead>
                    <tr><th>Vendedor(a)</th><th>Qtd.</th></tr>
                  </thead>
                  <tbody>
                    {freteDefeito.defeitosPorVendedor.map((r) => (
                      <tr key={r.vendedor}>
                        <td style={{ fontWeight: 600 }}>{r.vendedor}</td>
                        <td><strong style={{ color: C.danger }}>{r.qtd}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

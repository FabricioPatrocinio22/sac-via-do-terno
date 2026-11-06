import React, { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Search, X } from "lucide-react";
import {
  C, BRAND, Card, KpiCard, Button, TInput, TSelect, EmptyState, fmtCurrency, FONT_SANS
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
    ano: "", mes: "", dia: "", setor: "", tipo: "", categoria: "", status: "", vendedor: "", prioridade: "", busca: "",
  });
  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const clear = () =>
    setFilters({ ano: "", mes: "", dia: "", setor: "", tipo: "", categoria: "", status: "", vendedor: "", prioridade: "", busca: "" });

  const anosDisponiveis = useMemo(() => {
    const anosComDados = new Set(tickets.map((t) => new Date(t.dataAbertura).getFullYear()));
    const anoAtual = new Date().getFullYear();
    const anoMin = Math.min(anoAtual, ...(anosComDados.size ? Array.from(anosComDados) : [anoAtual]));
    const anos: number[] = [];
    for (let a = Math.max(anoAtual + 1, 2027); a >= anoMin; a--) anos.push(a);
    return anos;
  }, [tickets]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filters.setor && t.setor !== filters.setor) return false;
      if (filters.tipo && t.tipo !== filters.tipo) return false;
      if (filters.categoria && t.categoria !== filters.categoria) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.vendedor && t.vendedor !== filters.vendedor) return false;
      if (filters.prioridade && t.prioridade !== filters.prioridade) return false;
      const d = new Date(t.dataAbertura);
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
  const hasActiveFilter = Object.values(filters).some(Boolean);
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 16,
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
        <span>🔍</span> Filtrar:
      </span>
      {showBusca && (
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.inkSoft }} />
          <TInput
            placeholder="Protocolo, cliente, pedido…"
            value={filters.busca}
            onChange={(e) => set("busca", e.target.value)}
            style={{ width: 210, paddingLeft: 30 }}
          />
        </div>
      )}
      <TSelect value={filters.ano} onChange={(e) => set("ano", e.target.value)} style={{ width: 110 }}>
        <option value="">Ano: todos</option>
        {anosDisponiveis.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </TSelect>
      <TSelect value={filters.mes} onChange={(e) => set("mes", e.target.value)} style={{ width: 130 }}>
        <option value="">Mês: todos</option>
        {MESES_PT.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </TSelect>
      <TInput
        type="date"
        value={filters.dia}
        onChange={(e) => set("dia", e.target.value)}
        style={{ width: 140 }}
        title="Dia específico"
      />
      <TSelect value={filters.setor} onChange={(e) => set("setor", e.target.value)} style={{ width: 138 }}>
        <option value="">Setor: todos</option>
        {config.setores.map((s: string) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </TSelect>
      <TSelect value={filters.tipo} onChange={(e) => set("tipo", e.target.value)} style={{ width: 138 }}>
        <option value="">Tipo: todos</option>
        {config.tipos.map((s: string) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </TSelect>
      <TSelect value={filters.status} onChange={(e) => set("status", e.target.value)} style={{ width: 145 }}>
        <option value="">Status: todos</option>
        {config.status.map((s: any) => (
          <option key={s.nome} value={s.nome}>{s.nome}</option>
        ))}
      </TSelect>
      <TSelect value={filters.vendedor} onChange={(e) => set("vendedor", e.target.value)} style={{ width: 145 }}>
        <option value="">Vendedor(a): todos</option>
        {config.vendedores.map((s: string) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </TSelect>
      {hasActiveFilter && (
        <Button size="sm" variant="ghost" icon={X} onClick={clear} style={{ color: C.wine, fontWeight: 700 }}>
          Limpar
        </Button>
      )}
    </div>
  );
}

const DASHBOARD_TABS = [
  { id: "geral", label: "Visão Geral", icon: "📊", badge: "Principal" },
  { id: "trocas", label: "Trocas, Devoluções & Setores", icon: "🔄" },
  { id: "logistica", label: "Frete & Custos Logísticos", icon: "🚚" },
  { id: "qualidade", label: "Qualidade & Defeitos", icon: "🧵" },
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

export default function DashboardView({ tickets, config }: { tickets: any[]; config: any }) {
  const [activeTab, setActiveTab] = useState("geral");
  const { filters, set, clear, filtered, anosDisponiveis } = useTicketFilters(tickets, config);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const abertos = filtered.filter((t) => !["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(t.status)).length;
    const finalizados = total - abertos;
    const atrasados = filtered.filter(
      (t) => !["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(t.status) && new Date(t.prazo) < new Date()
    ).length;
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
    return { total, abertos, finalizados, atrasados, npsScore, valorTotal, custoFrete, estornos, abatimentos, tempoMedio };
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

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Barra de Filtros Globais */}
      <FilterBar filters={filters} set={set} clear={clear} config={config} showBusca anosDisponiveis={anosDisponiveis} />

      {/* Navegação em Abas do Dashboard */}
      <div
        style={{
          display: "flex",
          gap: 8,
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
          ABA 1: VISÃO GERAL (IDÊNTICA AO LAYOUT LIMPO DO CRM)
         ===================================================================== */}
      {activeTab === "geral" && (
        <div>
          {/* Linha Única de 6 KPIs Principais (Padrão CRM Via do Terno) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <KpiCard
              label="Total Protocolos"
              value={kpis.total}
              sub={`${kpis.finalizados} concluídos`}
              accent="#3B82F6"
              icon="📋"
            />
            <KpiCard
              label="Valor Movimentado"
              value={fmtCurrency(kpis.valorTotal)}
              sub="Em atendimentos"
              accent="#10B981"
              icon="💰"
            />
            <KpiCard
              label="Em Aberto"
              value={kpis.abertos}
              sub="Em tratativa no SAC"
              accent="#8B5CF6"
              icon="⏳"
            />
            <KpiCard
              label="Atrasados (SLA)"
              value={kpis.atrasados}
              trend={kpis.atrasados > 0 ? "down" : "flat"}
              sub={kpis.atrasados > 0 ? "Fora do prazo" : "100% no prazo"}
              accent={C.danger}
              icon="🚨"
            />
            <KpiCard
              label="Tempo Resolução"
              value={`${kpis.tempoMedio} dias`}
              sub="Ciclo médio"
              accent="#06B6D4"
              icon="⚡"
            />
            <KpiCard
              label="Score NPS"
              value={kpis.npsScore === null ? "—" : kpis.npsScore}
              trend={kpis.npsScore !== null && kpis.npsScore > 0 ? "up" : "flat"}
              sub="Satisfação pós-venda"
              accent={C.wine}
              icon="⭐"
            />
          </div>

          {/* Seção Central: Evolução de Atendimentos + Funil por Status (Igual ao CRM) */}
          <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginBottom: 20 }}>
            <Card
              title="Evolução de Atendimentos no Período"
              subtitle="Volume diário de protocolos abertos no SAC"
            >
              {evolucao.length === 0 ? (
                <EmptyState title="Sem dados" body="Nenhum atendimento no período filtrado." />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
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

            {/* Funil por Status (Barras de Progresso igual ao CRM) */}
            <Card title="Funil por Status" subtitle="Distribuição atual dos protocolos">
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 255, overflowY: "auto", paddingRight: 4 }}>
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
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Seção Inferior: Principais Motivos e Tipos de Solicitação */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Motivos Mais Frequentes" subtitle="Top 6 categorias registradas pelos clientes">
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
                            <span style={{ fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {m.name}
                            </span>
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

            <Card title="Atendimentos por Tipo de Solicitação" subtitle="Volume por natureza do protocolo">
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
          {/* Apenas 4 KPIs de Trocas e Devoluções */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
            <KpiCard
              label="Total em Trocas"
              value={fmtCurrency(trocaDevolEstorno.valorTrocas)}
              sub={`${trocaDevolEstorno.qtdTrocas} protocolo(s) de troca`}
              accent={C.wine}
              icon="🔄"
            />
            <KpiCard
              label="Total em Devoluções"
              value={fmtCurrency(trocaDevolEstorno.valorDevolucoes)}
              sub={`${trocaDevolEstorno.qtdDevolucoes} protocolo(s) de devolução`}
              accent={C.gold}
              icon="📦"
            />
            <KpiCard
              label="Total em Estornos"
              value={fmtCurrency(trocaDevolEstorno.valorEstornos)}
              sub={`${trocaDevolEstorno.qtdEstornos} estorno(s) realizado(s)`}
              accent={C.danger}
              icon="↩️"
            />
            <KpiCard
              label="Ticket Médio SAC"
              value={fmtCurrency(kpis.total ? kpis.valorTotal / kpis.total : 0)}
              sub="Valor médio por protocolo"
              accent={C.info}
              icon="🏷️"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card title="Comparativo por Setor Comercial" style={{ padding: 0 }}>
              <div style={{ padding: "0 20px 20px", paddingTop: 12 }}>
                {comparativoSetor.length === 0 ? (
                  <EmptyState title="Sem dados" body="—" />
                ) : (
                  <table className="dt">
                    <thead>
                      <tr><th>Setor</th><th>Qtd.</th><th>Valor Total</th><th>Ticket Médio</th><th>% do Valor</th></tr>
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

            <Card title="Clientes com Maior Volume de Trocas" style={{ padding: 0 }}>
              <div style={{ padding: "0 20px 20px", paddingTop: 12 }}>
                {clientesQueMaisTrocaram.length === 0 ? (
                  <EmptyState title="Sem trocas no período" body="Nenhum registro do tipo Troca nos filtros atuais." />
                ) : (
                  <table className="dt">
                    <thead>
                      <tr><th>Cliente</th><th>Trocas</th><th>Valor</th><th>Participação</th></tr>
                    </thead>
                    <tbody>
                      {clientesQueMaisTrocaram.map((r) => (
                        <tr key={r.cliente}>
                          <td style={{ fontWeight: 600 }}>{r.cliente}</td>
                          <td><strong>{r.qtd}</strong></td>
                          <td>{fmtCurrency(r.valor)}</td>
                          <td>{r.taxa.toFixed(1)}% das trocas</td>
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
                  <EmptyState title="Sem trocas no período" body="Nenhum registro do tipo Troca nos filtros atuais." />
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
                      <tr><th>Vendedor(a)</th><th>Trocas</th><th>Valor</th><th>Taxa</th></tr>
                    </thead>
                    <tbody>
                      {trocasPorVendedor.map((r) => (
                        <tr key={r.vendedor}>
                          <td style={{ fontWeight: 600 }}>{r.vendedor}</td>
                          <td>{r.qtd}</td>
                          <td>{fmtCurrency(r.valor)}</td>
                          <td>{r.taxa.toFixed(1)}% das trocas</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </Card>

          <Card title="Consolidado Mensal de Trocas e Devoluções" style={{ padding: 0 }}>
            <div style={{ padding: "0 20px 20px", paddingTop: 12, overflowX: "auto" }}>
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
          ABA 3: FRETE & CUSTOS LOGÍSTICOS
         ===================================================================== */}
      {activeTab === "logistica" && (
        <div>
          {/* Apenas 4 KPIs Logísticos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
            <KpiCard
              label="Custo PAC Reverso + Envio"
              value={fmtCurrency(kpis.custoFrete)}
              sub="Custo operacional de logística"
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
              label="Abatimentos em Boleto"
              value={fmtCurrency(kpis.abatimentos)}
              sub="Descontos comerciais concedidos"
              accent={C.purple}
              icon="🧾"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16 }}>
            <Card title="Proporção de Frete: Cliente vs Via do Terno" subtitle="Comparativo financeiro de quem arcou com o frete">
              {freteDefeito.fretePie.length === 0 ? (
                <EmptyState title="Sem frete lançado" body="Nenhum frete com pagador informado nos filtros atuais." />
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

            <Card title="Resumo Financeiro de Logística Reversa" subtitle="Detalhamento dos valores registrados nos protocolos filtrados">
              <table className="dt">
                <thead>
                  <tr><th>Indicador Financeiro</th><th>Atendimentos</th><th>Valor Acumulado</th></tr>
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
                    <td style={{ fontWeight: 600 }}>Frete sem pagador informado</td>
                    <td>{freteDefeito.qtdSemInfo}</td>
                    <td>{fmtCurrency(freteDefeito.valorSemInfo)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Custo de PAC Reverso + Reenvio</td>
                    <td>{kpis.total}</td>
                    <td><strong>{fmtCurrency(kpis.custoFrete)}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Total em Estornos Realizados</td>
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
          ABA 4: QUALIDADE & DEFEITOS DE FABRICAÇÃO
         ===================================================================== */}
      {activeTab === "qualidade" && (
        <div>
          {/* Apenas 3 KPIs de Qualidade */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
            <KpiCard
              label="Ocorrências com Defeito"
              value={freteDefeito.qtdDefeitos}
              sub="Protocolos com avaria de fabricação"
              accent={C.danger}
              icon="🧵"
            />
            <KpiCard
              label="% Taxa de Defeitos"
              value={`${freteDefeito.pctDefeitos.toFixed(1)}%`}
              sub="Proporção sobre o total de chamados"
              accent={C.gold}
              icon="📐"
            />
            <KpiCard
              label="Principal Tipo de Defeito"
              value={freteDefeito.defeitosPorTipo[0]?.name || "Nenhum"}
              sub={
                freteDefeito.defeitosPorTipo[0]
                  ? `${freteDefeito.defeitosPorTipo[0].value} ocorrência(s)`
                  : "Sem defeitos no período"
              }
              accent={C.wine}
              icon="🔍"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
            <Card title="Defeitos de Fabricação por Tipo" subtitle="Incidência técnica nas peças (cava, costura, tecido, aviamentos)">
              {freteDefeito.defeitosPorTipo.length === 0 ? (
                <EmptyState title="Sem defeitos lançados" body="Nenhum defeito de fabricação nos filtros atuais." />
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

            <Card title="Defeitos Registrados por Vendedor(a)" subtitle="Consultores cujos pedidos apresentaram avaria">
              {freteDefeito.defeitosPorVendedor.length === 0 ? (
                <EmptyState title="Sem defeitos" body="—" />
              ) : (
                <table className="dt">
                  <thead>
                    <tr><th>Vendedor(a)</th><th>Qtd. Defeitos</th></tr>
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

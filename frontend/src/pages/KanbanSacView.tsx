import React, { useState, useMemo } from "react";
import {
  C, Button, inputStyle, fmtCurrency, ProtocolTag, Badge, WHATSAPP_ICON_URL, buildWhatsAppLink
} from "../components/ui";
import { daysBetween } from "./DashboardView";

const KANBAN_GROUPS = [
  {
    id: "Novo",
    label: "Novos / Triagem",
    statuses: ["Novo"],
    color: "#3B82F6",
    icon: "✨",
  },
  {
    id: "Em análise",
    label: "Em Análise",
    statuses: ["Em análise"],
    color: "#8B5CF6",
    icon: "🔎",
  },
  {
    id: "Aguardando cliente",
    label: "Em Andamento / Aguardando",
    statuses: ["Aguardando cliente", "Aguardando setor", "Em negociação", "Aprovado"],
    color: "#F59E0B",
    icon: "⏳",
  },
  {
    id: "Resolvido",
    label: "Resolvidos / Finalizados",
    statuses: ["Resolvido", "Finalizado"],
    color: "#10B981",
    icon: "🏆",
  },
  {
    id: "Cancelado",
    label: "Recusados / Cancelados",
    statuses: ["Recusado", "Cancelado"],
    color: "#EF4444",
    icon: "❌",
  },
];

export default function KanbanSacView({
  tickets,
  config,
  onOpen,
  onChangeStatus,
}: {
  tickets: any[];
  config: any;
  onOpen: (id: string) => void;
  onChangeStatus: (id: string, newStatus: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [setor, setSetor] = useState("");
  const [tipo, setTipo] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (setor && t.setor !== setor) return false;
      if (tipo && t.tipo !== tipo) return false;
      if (vendedor && t.vendedor !== vendedor) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${t.protocolo} ${t.cliente} ${t.pedido} ${t.vendedor}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, search, setor, tipo, vendedor]);

  function handleDrop(targetDefaultStatus: string) {
    if (!dragId) return;
    const t = tickets.find((x) => x.id === dragId);
    setDragId(null);
    if (!t || t.status === targetDefaultStatus) return;
    onChangeStatus(t.id, targetDefaultStatus);
  }

  return (
    <div>
      {/* Barra de Filtros do Funil Kanban SAC */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "space-between",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input
            style={{ ...inputStyle, width: 240 }}
            placeholder="Buscar protocolo, cliente ou pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={{ ...inputStyle, width: 150 }} value={setor} onChange={(e) => setSetor(e.target.value)}>
            <option value="">Todos os setores</option>
            {config.setores.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select style={{ ...inputStyle, width: 150 }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            {config.tipos.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select style={{ ...inputStyle, width: 160 }} value={vendedor} onChange={(e) => setVendedor(e.target.value)}>
            <option value="">Toda a Equipe</option>
            {config.vendedores.map((s: string) => (
              <option key={s} value={s}>Vendedor: {s}</option>
            ))}
          </select>
          {(search || setor || tipo || vendedor) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSetor("");
                setTipo("");
                setVendedor("");
              }}
              style={{ color: C.wine, fontWeight: 700 }}
            >
              × Limpar
            </Button>
          )}
        </div>
        <div style={{ fontSize: 12, color: C.inkSoft }}>
          Mostrando <strong style={{ color: C.ink }}>{filtered.length}</strong> atendimento(s) no quadro
        </div>
      </div>

      {/* Colunas do Kanban */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(230px, 1fr))", gap: 12, alignItems: "start", overflowX: "auto", paddingBottom: 12 }}>
        {KANBAN_GROUPS.map((col) => {
          const colItems = filtered.filter((t) => col.statuses.includes(t.status));
          const colTotalValue = colItems.reduce((acc, curr) => acc + (Number(curr.valorEnvolvido) || 0), 0);

          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
              style={{
                background: "#EBEEF4",
                borderRadius: 10,
                padding: "12px 10px",
                minHeight: 520,
                display: "flex",
                flexDirection: "column",
                borderTop: `4px solid ${col.color}`,
              }}
            >
              {/* Cabeçalho da Coluna */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  <span>{col.icon}</span> {col.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: col.color, background: "#fff", borderRadius: 12, padding: "2px 8px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  {colItems.length}
                </span>
              </div>

              {colTotalValue > 0 && (
                <div style={{ background: "#fff", color: C.inkSoft, fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 6, marginBottom: 10, textAlign: "center", border: `1px solid ${C.border}` }}>
                  Volume: <strong style={{ color: C.ink }}>{fmtCurrency(colTotalValue)}</strong>
                </div>
              )}

              {/* Lista de Cartões */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {colItems.map((t) => {
                  const isFinal = ["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(t.status);
                  const atrasado = !isFinal && new Date(t.prazo) < new Date();
                  const diasAberto = daysBetween(t.dataAbertura, new Date());
                  const waUrl = buildWhatsAppLink(t.telefone, t.cliente, t.protocolo);

                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onClick={() => onOpen(t.id)}
                      style={{
                        background: "#fff",
                        border: `1px solid ${atrasado ? "#FCA5A5" : C.border}`,
                        borderRadius: 8,
                        padding: 12,
                        cursor: "grab",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        transition: "transform 0.1s ease, box-shadow 0.1s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <ProtocolTag protocolo={t.protocolo} />
                        <Badge tone={t.prioridade === "Urgente" ? "danger" : t.prioridade === "Alta" ? "warning" : "info"}>
                          {t.prioridade}
                        </Badge>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, lineHeight: 1.3 }}>
                        {t.cliente}
                      </div>

                      <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                        <span>🏷️ {t.tipo}</span>
                        <span>📦 Ped. #{t.pedido}</span>
                      </div>

                      <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 3, display: "flex", justifyContent: "space-between" }}>
                        <span>🏢 {t.setor}</span>
                        <span>👤 {t.vendedor}</span>
                      </div>

                      {atrasado && (
                        <div style={{ marginTop: 6, fontSize: 10.5, fontWeight: 700, color: C.danger, background: C.dangerSoft, padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>
                          🔴 Prazo SLA vencido ({diasAberto}d aberto)
                        </div>
                      )}

                      <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.wine }}>
                          {fmtCurrency(t.valorEnvolvido)}
                        </span>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={`Chamar ${t.cliente} no WhatsApp`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              background: "#F0FDF4",
                              border: "1px solid #BBF7D0",
                              textDecoration: "none",
                            }}
                          >
                            <img src={WHATSAPP_ICON_URL} alt="WhatsApp" style={{ width: 14, height: 14, objectFit: "contain" }} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colItems.length === 0 && (
                  <div style={{ fontSize: 12, color: C.inkSoft, padding: "24px 8px", textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: 8 }}>
                    Arraste protocolos para esta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

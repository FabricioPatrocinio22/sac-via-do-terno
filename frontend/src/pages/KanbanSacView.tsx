import React, { useState, useMemo } from "react";
import { PlusCircle } from "lucide-react";
import {
  C, Button, inputStyle, fmtCurrency, ProtocolTag, Badge, WHATSAPP_ICON_URL, buildWhatsAppLink
} from "../components/ui";
import { daysBetween } from "./DashboardView";

const KANBAN_GROUPS = [
  {
    id: "Novo",
    label: "1. Novos",
    statuses: ["Novo"],
    color: "#3B82F6",
    icon: "✨",
  },
  {
    id: "Em análise",
    label: "2. Em Análise",
    statuses: ["Em análise"],
    color: "#8B5CF6",
    icon: "🔎",
  },
  {
    id: "Aguardando cliente",
    label: "3. Em Andamento",
    statuses: ["Aguardando cliente", "Aguardando setor", "Em negociação", "Aprovado"],
    color: "#F59E0B",
    icon: "⏳",
  },
  {
    id: "Resolvido",
    label: "4. Resolvidos",
    statuses: ["Resolvido", "Finalizado"],
    color: "#10B981",
    icon: "✅",
  },
];

export default function KanbanSacView({
  tickets,
  config,
  onOpen,
  onChangeStatus,
  onNew,
}: {
  tickets: any[];
  config: any;
  onOpen: (id: string) => void;
  onChangeStatus: (id: string, newStatus: string) => void;
  onNew?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [setor, setSetor] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (["Recusado", "Cancelado"].includes(t.status)) return false;
      if (setor && t.setor !== setor) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${t.protocolo} ${t.cliente} ${t.pedido} ${t.vendedor}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, search, setor]);

  function handleDrop(targetDefaultStatus: string) {
    if (!dragId) return;
    const t = tickets.find((x) => x.id === dragId);
    setDragId(null);
    if (!t || t.status === targetDefaultStatus) return;
    onChangeStatus(t.id, targetDefaultStatus);
  }

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto" }}>
      {/* Barra Superior Limpa */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1 }}>
          <input
            style={{ ...inputStyle, width: 280 }}
            placeholder="Buscar cliente, pedido ou protocolo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={{ ...inputStyle, width: 170 }} value={setor} onChange={(e) => setSetor(e.target.value)}>
            <option value="">🏢 Todos os setores</option>
            {config.setores.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {(search || setor) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSetor("");
              }}
              style={{ color: C.wine, fontWeight: 700 }}
            >
              × Limpar
            </Button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: C.inkSoft }}>
            💡 Arraste os cartões entre as colunas para mudar de etapa
          </span>
          {onNew && (
            <Button size="sm" variant="primary" icon={PlusCircle} onClick={onNew}>
              Novo Atendimento
            </Button>
          )}
        </div>
      </div>

      {/* 4 Colunas Amplas (Igual ao Kanban do CRM) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(240px, 1fr))", gap: 14, alignItems: "start", overflowX: "auto", paddingBottom: 12 }}>
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
                borderRadius: 12,
                padding: "12px 10px",
                minHeight: 500,
                display: "flex",
                flexDirection: "column",
                borderTop: `4px solid ${col.color}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{col.icon}</span> {col.label}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: col.color, background: "#fff", borderRadius: 12, padding: "2px 9px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  {colItems.length}
                </span>
              </div>

              {colTotalValue > 0 && (
                <div style={{ background: "#fff", color: C.inkSoft, fontSize: 11.5, fontWeight: 600, padding: "5px 8px", borderRadius: 8, marginBottom: 10, textAlign: "center", border: `1px solid ${C.border}` }}>
                  Total: <strong style={{ color: C.ink }}>{fmtCurrency(colTotalValue)}</strong>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {colItems.length === 0 ? (
                  <div style={{ fontSize: 12, color: C.inkSoft, textAlign: "center", padding: "32px 12px", opacity: 0.75 }}>
                    Nenhum atendimento aqui
                  </div>
                ) : (
                  colItems.map((t) => {
                    const isFinal = ["Resolvido", "Finalizado"].includes(t.status);
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
                          borderRadius: 10,
                          padding: 12,
                          cursor: "grab",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          transition: "box-shadow 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.09)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <ProtocolTag protocolo={t.protocolo} />
                          {t.prioridade === "Urgente" && <Badge tone="danger">Urgente</Badge>}
                          {t.prioridade === "Alta" && <Badge tone="warning">Alta</Badge>}
                        </div>

                        <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink, lineHeight: 1.3 }}>
                          {t.cliente}
                        </div>

                        <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                          <span>{t.tipo}</span>
                          <span>Ped. #{t.pedido}</span>
                        </div>

                        {atrasado && (
                          <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: C.danger, background: C.dangerSoft, padding: "2px 7px", borderRadius: 6, display: "inline-block" }}>
                            🚨 Fora do prazo ({diasAberto}d)
                          </div>
                        )}

                        <div style={{ marginTop: 8, paddingTop: 7, borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.wine }}>
                            {fmtCurrency(t.valorEnvolvido)}
                          </span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Chamar no WhatsApp"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#F0FDF4",
                                border: "1px solid #BBF7D0",
                                borderRadius: 20,
                                padding: "2px 8px",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#15803D",
                                textDecoration: "none",
                              }}
                            >
                              <img src={WHATSAPP_ICON_URL} alt="WA" style={{ width: 13, height: 13 }} />
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

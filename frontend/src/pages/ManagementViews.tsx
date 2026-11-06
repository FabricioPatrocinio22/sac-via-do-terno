import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Download, Smile, PlusCircle, Save, Check, CircleDot, Plus, Edit3,
  Trash2, EyeOff, Eye, ShieldCheck, Search
} from "lucide-react";
import {
  C, BRAND, FONT_SANS, FONT_MONO, Card, KpiCard, Button, Field, TInput, TSelect,
  TTextArea, Badge, EmptyState, Modal, fmtCurrency, fmtDate, fmtDateTime
} from "../components/ui";
import { PERMS, uid } from "../defaults";
import { daysBetween } from "./DashboardView";

export function RelatoriosHubView({
  tickets,
  config,
  surveys,
  onAddSurvey,
  onRespondSurvey,
}: {
  tickets: any[];
  config: any;
  surveys: any[];
  onAddSurvey: (data: any) => void;
  onRespondSurvey: (id: string, nota: number, comentario: string) => void;
}) {
  const [section, setSection] = useState("relatorios");

  const tabs = [
    { id: "relatorios", label: "Resumo & Baixar Planilha", icon: "📊" },
    { id: "nps", label: "Notas dos Clientes (NPS)", icon: "⭐" },
    { id: "analise", label: "Diagnóstico do Mês", icon: "💡" },
  ];

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto" }}>
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
        {tabs.map((t) => {
          const active = section === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 16px",
                borderRadius: 8,
                border: "none",
                background: active ? C.wine : "transparent",
                color: active ? "#fff" : C.inkSoft,
                fontWeight: active ? 700 : 600,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: FONT_SANS,
                boxShadow: active ? "0 2px 6px rgba(200, 16, 46, 0.28)" : "none",
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {section === "relatorios" && <RelatoriosView tickets={tickets} config={config} />}
      {section === "nps" && (
        <NpsView
          tickets={tickets}
          config={config}
          surveys={surveys}
          onAddSurvey={onAddSurvey}
          onRespondSurvey={onRespondSurvey}
        />
      )}
      {section === "analise" && <AnaliseView tickets={tickets} config={config} />}
    </div>
  );
}

export function RelatoriosView({ tickets }: { tickets: any[]; config: any }) {
  const [tipo, setTipo] = useState("mensal");

  const dados = useMemo(() => {
    const dias = tipo === "semanal" ? 7 : tipo === "todos" ? 99999 : 30;
    const now = new Date();
    const atual = tickets.filter((t) => daysBetween(t.dataAbertura, now) <= dias);
    const anterior =
      tipo === "todos"
        ? []
        : tickets.filter(
            (t) => daysBetween(t.dataAbertura, now) > dias && daysBetween(t.dataAbertura, now) <= dias * 2
          );

    const resolvidosAtual = atual.filter((t) => t.dataResolucao);
    const tempoMedio = resolvidosAtual.length
      ? Math.round(resolvidosAtual.reduce((s, t) => s + daysBetween(t.dataAbertura, t.dataResolucao), 0) / resolvidosAtual.length)
      : 0;
    const npsAtual = atual.filter((t) => t.nps !== null && t.nps !== undefined);
    const promotores = npsAtual.filter((t) => t.nps >= 9).length;
    const detratores = npsAtual.filter((t) => t.nps <= 6).length;
    const npsScore = npsAtual.length ? Math.round(((promotores - detratores) / npsAtual.length) * 100) : null;

    const motivosMap: Record<string, number> = {};
    atual.forEach((t) => { motivosMap[t.categoria] = (motivosMap[t.categoria] || 0) + 1; });
    const principaisMotivos = Object.entries(motivosMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const custoTotal = atual.reduce((s, t) => s + (t.custoPacReverso || 0) + (t.custoEnvio || 0), 0);
    const pendentes = atual.filter((t) => !["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(t.status));

    return { atual, anterior, tempoMedio, npsScore, principaisMotivos, custoTotal, pendentes };
  }, [tickets, tipo]);

  const variacao = dados.anterior.length
    ? Math.round(((dados.atual.length - dados.anterior.length) / dados.anterior.length) * 100)
    : null;

  const exportCsv = () => {
    const headers = [
      "Protocolo", "Data Abertura", "Cliente", "Telefone", "Pedido", "Setor",
      "Vendedor", "Tipo", "Categoria", "Status", "Prioridade", "Valor Envolvido",
      "Valor Frete", "Frete Pago Por", "Defeito Fabricacao", "NPS"
    ];
    const rows = dados.atual.map((t) => [
      t.protocolo,
      fmtDate(t.dataAbertura),
      `"${(t.cliente || "").replace(/"/g, '""')}"`,
      t.telefone || "",
      t.pedido || "",
      t.setor || "",
      t.vendedor || "",
      t.tipo || "",
      `"${(t.categoria || "").replace(/"/g, '""')}"`,
      t.status || "",
      t.prioridade || "",
      t.valorEnvolvido || 0,
      t.valorFrete || 0,
      t.fretePagoPor || "",
      t.defeitoFabricacao ? "Sim" : "Não",
      t.nps ?? "",
    ]);
    const csv = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-sac-viadoterno-${tipo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13.5, color: C.inkSoft }}>
          Escolha o período e baixe os atendimentos para abrir no Excel se desejar
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <TSelect value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ width: 170 }}>
            <option value="semanal">Últimos 7 dias</option>
            <option value="mensal">Últimos 30 dias</option>
            <option value="todos">Todo o histórico</option>
          </TSelect>
          <Button size="sm" variant="secondary" icon={Download} onClick={() => window.print()}>
            Imprimir / PDF
          </Button>
          <Button size="sm" variant="primary" icon={Download} onClick={exportCsv}>
            Baixar Planilha (Excel/CSV)
          </Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        <KpiCard
          label="Atendimentos no Período"
          value={dados.atual.length}
          trend={variacao === null ? "flat" : variacao >= 0 ? "up" : "down"}
          sub={variacao === null ? "Total registrado" : `${variacao >= 0 ? "+" : ""}${variacao}% vs período anterior`}
          accent={C.wine}
          icon="📊"
        />
        <KpiCard label="Tempo Médio p/ Resolver" value={`${dados.tempoMedio} dia(s)`} accent={C.cyan} icon="⚡" />
        <KpiCard label="Nota NPS dos Clientes" value={dados.npsScore ?? "—"} accent={C.success} icon="⭐" />
        <KpiCard label="Custos de Correios" value={fmtCurrency(dados.custoTotal)} accent={C.amber} icon="🚚" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Principais Motivos no Período">
          {dados.principaisMotivos.length === 0 ? (
            <EmptyState title="Sem dados" body="Nenhum atendimento registrado neste período." />
          ) : (
            <table className="dt">
              <thead>
                <tr><th>Motivo</th><th>Quantidade</th></tr>
              </thead>
              <tbody>
                {dados.principaisMotivos.map(([m, q]) => (
                  <tr key={m}>
                    <td style={{ fontWeight: 600 }}>{m}</td>
                    <td><strong>{q}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title={`Casos Ainda em Aberto (${dados.pendentes.length})`}>
          {dados.pendentes.length === 0 ? (
            <EmptyState title="Tudo em dia!" body="Nenhuma pendência aberta neste período." />
          ) : (
            <table className="dt">
              <thead>
                <tr><th>Protocolo</th><th>Cliente</th><th>Etapa</th><th>Urgência</th></tr>
              </thead>
              <tbody>
                {dados.pendentes.slice(0, 8).map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600 }}>{t.protocolo}</td>
                    <td>{t.cliente}</td>
                    <td>{t.status}</td>
                    <td>{t.prioridade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

export function NpsView({
  tickets,
  surveys,
  onAddSurvey,
  onRespondSurvey,
}: {
  tickets: any[];
  config: any;
  surveys: any[];
  onAddSurvey: (data: any) => void;
  onRespondSurvey: (id: string, nota: number, comentario: string) => void;
}) {
  const [tab, setTab] = useState("visao");

  const respondidos = useMemo(() => tickets.filter((t) => t.nps !== null && t.nps !== undefined), [tickets]);
  const surveyScores = useMemo(
    () => surveys.filter((s) => s.status === "Respondida" && s.nota !== null),
    [surveys]
  );

  const respondidosCombinado = useMemo(() => {
    const a = respondidos.map((t) => ({ nota: t.nps, data: t.dataResolucao || t.dataAbertura, setor: t.setor }));
    const b = surveyScores.map((s) => ({ nota: s.nota, data: s.dataResposta || s.dataEnvio, setor: null }));
    return [...a, ...b];
  }, [respondidos, surveyScores]);

  const promotores = respondidosCombinado.filter((t) => t.nota >= 9);
  const neutros = respondidosCombinado.filter((t) => t.nota >= 7 && t.nota <= 8);
  const detratores = respondidosCombinado.filter((t) => t.nota <= 6);
  const score = respondidosCombinado.length
    ? Math.round(((promotores.length - detratores.length) / respondidosCombinado.length) * 100)
    : null;

  const porSetor = useMemo(() => {
    const map: Record<string, number[]> = {};
    respondidos.forEach((t) => {
      if (!map[t.setor]) map[t.setor] = [];
      map[t.setor].push(t.nps);
    });
    return Object.entries(map).map(([setor, arr]) => {
      const prom = arr.filter((n) => n >= 9).length;
      const det = arr.filter((n) => n <= 6).length;
      return { setor, total: arr.length, nps: Math.round(((prom - det) / arr.length) * 100) };
    });
  }, [respondidos]);

  const evolucao = useMemo(() => {
    const map: Record<string, number[]> = {};
    respondidosCombinado.forEach((t) => {
      const d = new Date(t.data);
      const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(t.nota);
    });
    return Object.entries(map).map(([name, arr]) => {
      const prom = arr.filter((n) => n >= 9).length;
      const det = arr.filter((n) => n <= 6).length;
      return { name, nps: Math.round(((prom - det) / arr.length) * 100) };
    });
  }, [respondidosCombinado]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setTab("visao")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${tab === "visao" ? C.wine : C.border}`,
            background: tab === "visao" ? C.wineSoft : "#fff",
            color: tab === "visao" ? C.wine : C.ink,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: FONT_SANS,
          }}
        >
          Resumo das Notas
        </button>
        <button
          onClick={() => setTab("pesquisas")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${tab === "pesquisas" ? C.wine : C.border}`,
            background: tab === "pesquisas" ? C.wineSoft : "#fff",
            color: tab === "pesquisas" ? C.wine : C.ink,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: FONT_SANS,
          }}
        >
          Pesquisas Enviadas ({surveys.length})
        </button>
      </div>

      {tab === "visao" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
            <KpiCard label="Pontuação NPS" value={score ?? "—"} accent={C.wine} icon="⭐" />
            <KpiCard
              label="Muito Satisfeitos (9–10)"
              value={promotores.length}
              sub={respondidosCombinado.length ? `${Math.round((promotores.length / respondidosCombinado.length) * 100)}% do total` : ""}
              accent={C.success}
              icon="😍"
            />
            <KpiCard
              label="Neutros (7–8)"
              value={neutros.length}
              sub={respondidosCombinado.length ? `${Math.round((neutros.length / respondidosCombinado.length) * 100)}% do total` : ""}
              accent={C.amber}
              icon="😐"
            />
            <KpiCard
              label="Insatisfeitos (0–6)"
              value={detratores.length}
              sub={respondidosCombinado.length ? `${Math.round((detratores.length / respondidosCombinado.length) * 100)}% do total` : ""}
              accent={C.danger}
              icon="😞"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
            <Card title="Evolução das Notas">
              {evolucao.length === 0 ? (
                <EmptyState title="Ainda sem avaliações" body="Ao concluir um atendimento com nota de 0 a 10, os resultados aparecem aqui." />
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={evolucao}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="nps" stroke={C.wine} strokeWidth={2.5} dot={{ r: 3, fill: C.wine }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card title="Satisfação por Setor">
              <div style={{ display: "grid", gap: 12 }}>
                {porSetor.map((s) => (
                  <div key={s.setor}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{s.setor}</span>
                      <span style={{ fontWeight: 700, color: C.wine }}>{s.nps} pts</span>
                    </div>
                    <div style={{ height: 7, background: C.graySoft, borderRadius: 4 }}>
                      <div
                        style={{
                          height: 7,
                          width: `${Math.max(0, Math.min(100, (s.nps + 100) / 2))}%`,
                          background: C.wine,
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {porSetor.length === 0 && <div style={{ fontSize: 13, color: C.inkSoft }}>Nenhuma nota registrada ainda.</div>}
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === "pesquisas" && (
        <PesquisasNpsTab surveys={surveys} onAddSurvey={onAddSurvey} onRespondSurvey={onRespondSurvey} />
      )}
    </div>
  );
}

function PesquisasNpsTab({
  surveys,
  onAddSurvey,
  onRespondSurvey,
}: {
  surveys: any[];
  onAddSurvey: (data: any) => void;
  onRespondSurvey: (id: string, nota: number, comentario: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [respondModal, setRespondModal] = useState<any>(null);
  const [form, setForm] = useState({ cliente: "", protocolo: "", canal: "WhatsApp" });
  const [respostaForm, setRespostaForm] = useState({ nota: "", comentario: "" });

  const enviadas = surveys.filter((s) => s.status === "Enviada").length;
  const respondidas = surveys.filter((s) => s.status === "Respondida").length;
  const taxaResposta = surveys.length ? Math.round((respondidas / surveys.length) * 100) : 0;

  const launch = () => {
    if (!form.cliente.trim()) return;
    onAddSurvey({ cliente: form.cliente, protocolo: form.protocolo || null, canal: form.canal });
    setForm({ cliente: "", protocolo: "", canal: "WhatsApp" });
    setModalOpen(false);
  };

  const openRespond = (s: any) => {
    setRespondModal(s);
    setRespostaForm({ nota: "", comentario: "" });
  };

  const submitResposta = () => {
    if (respostaForm.nota === "") return;
    onRespondSurvey(respondModal.id, Number(respostaForm.nota), respostaForm.comentario);
    setRespondModal(null);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        <KpiCard label="Pesquisas Enviadas" value={surveys.length} accent={C.info} icon="📨" />
        <KpiCard label="Aguardando Nota" value={enviadas} accent={C.amber} icon="⏳" />
        <KpiCard label="Respondidas" value={`${taxaResposta}%`} accent={C.success} icon="📈" />
      </div>
      <Card
        title="Controle de Pesquisas Enviadas"
        right={
          <Button size="sm" variant="primary" icon={PlusCircle} onClick={() => setModalOpen(true)}>
            Registrar Pesquisa
          </Button>
        }
        style={{ padding: 0, overflow: "hidden" }}
      >
        {surveys.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState icon={Smile} title="Nenhuma pesquisa avulsa" body="Você pode registrar pesquisas enviadas aos clientes aqui." />
          </div>
        ) : (
          <div style={{ overflowX: "auto", padding: "8px 20px 20px" }}>
            <table className="dt">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Protocolo</th>
                  <th>Canal</th>
                  <th>Data</th>
                  <th>Situação</th>
                  <th>Nota</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.cliente}</td>
                    <td>{s.protocolo || "—"}</td>
                    <td>{s.canal}</td>
                    <td>{fmtDate(s.dataEnvio)}</td>
                    <td>
                      <Badge tone={s.status === "Respondida" ? "success" : "warning"}>{s.status}</Badge>
                    </td>
                    <td><strong>{s.nota ?? "—"}</strong></td>
                    <td>
                      {s.status === "Enviada" && (
                        <Button size="sm" variant="secondary" onClick={() => openRespond(s)}>
                          Informar Nota
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Envio de Pesquisa">
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Nome do Cliente" required>
            <TInput
              value={form.cliente}
              onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
              placeholder="Nome do cliente"
            />
          </Field>
          <Field label="Protocolo (opcional)">
            <TInput
              value={form.protocolo}
              onChange={(e) => setForm((f) => ({ ...f, protocolo: e.target.value }))}
              placeholder="SAC-2026-000001"
            />
          </Field>
          <Field label="Enviado por onde?">
            <TSelect value={form.canal} onChange={(e) => setForm((f) => ({ ...f, canal: e.target.value }))}>
              <option>WhatsApp</option>
              <option>E-mail</option>
              <option>Telefone</option>
            </TSelect>
          </Field>
          <Button variant="primary" icon={Save} onClick={launch}>
            Salvar Pesquisa
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!respondModal}
        onClose={() => setRespondModal(null)}
        title={`Nota de ${respondModal?.cliente || ""}`}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Nota dada pelo cliente (0 a 10)" required>
            <TInput
              type="number"
              min={0}
              max={10}
              value={respostaForm.nota}
              onChange={(e) => setRespostaForm((f) => ({ ...f, nota: e.target.value }))}
            />
          </Field>
          <Field label="Comentário (opcional)">
            <TTextArea
              value={respostaForm.comentario}
              onChange={(e) => setRespostaForm((f) => ({ ...f, comentario: e.target.value }))}
            />
          </Field>
          <Button variant="primary" icon={Check} onClick={submitResposta}>
            Salvar Nota
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function AnaliseView({ tickets }: { tickets: any[]; config: any }) {
  const now = new Date();
  const atual = tickets.filter((t) => daysBetween(t.dataAbertura, now) <= 30);

  const insights = useMemo(() => {
    const out: string[] = [];
    if (atual.length === 0) return out;

    const motivosMap: Record<string, number> = {};
    atual.forEach((t) => { motivosMap[t.categoria] = (motivosMap[t.categoria] || 0) + 1; });
    const topMotivo = Object.entries(motivosMap).sort((a, b) => b[1] - a[1])[0];
    if (topMotivo) {
      out.push(
        `O principal motivo de contato nos últimos 30 dias foi "${topMotivo[0]}", representando ${Math.round((topMotivo[1] / atual.length) * 100)}% dos casos.`
      );
    }

    const setorMap: Record<string, number> = {};
    atual.forEach((t) => { setorMap[t.setor] = (setorMap[t.setor] || 0) + 1; });
    const topSetor = Object.entries(setorMap).sort((a, b) => b[1] - a[1])[0];
    if (topSetor) {
      out.push(`O setor com mais atendimentos registrados foi "${topSetor[0]}" (${topSetor[1]} caso(s)).`);
    }

    const vendedorMap: Record<string, number> = {};
    atual.forEach((t) => { vendedorMap[t.vendedor] = (vendedorMap[t.vendedor] || 0) + 1; });
    const topVendedor = Object.entries(vendedorMap).sort((a, b) => b[1] - a[1])[0];
    if (topVendedor) {
      out.push(`Vendedor(a) com maior volume de pedidos atendidos no pós-venda: ${topVendedor[0]} (${topVendedor[1]}).`);
    }

    const custoTotal = atual.reduce((s, t) => s + (t.custoPacReverso || 0) + (t.custoEnvio || 0), 0);
    out.push(`Os custos com Correios reverso e reenvio somaram ${fmtCurrency(custoTotal)} nos últimos 30 dias.`);

    const atrasados = atual.filter(
      (t) => !["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(t.status) && new Date(t.prazo) < now
    ).length;
    if (atrasados > 0) {
      out.push(`Atenção: há ${atrasados} atendimento(s) fora do prazo precisando de prioridade.`);
    }

    return out;
  }, [atual]);

  return (
    <div>
      <Card title="💡 Resumo Inteligente dos Últimos 30 Dias" subtitle="Leitura automática gerada com base nos atendimentos cadastrados">
        {insights.length === 0 ? (
          <EmptyState title="Sem dados nos últimos 30 dias" body="Assim que houver atendimentos registrados, o diagnóstico aparecerá aqui." />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {insights.map((frase, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 14,
                  lineHeight: 1.55,
                  borderBottom: i < insights.length - 1 ? `1px solid ${C.border}` : "none",
                  paddingBottom: i < insights.length - 1 ? 12 : 0,
                }}
              >
                <CircleDot size={16} color={C.wine} style={{ flexShrink: 0, marginTop: 3 }} />
                <span>{frase}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function AdministracaoView({
  config,
  setConfig,
  addAudit,
  showToast,
  auditLog = [],
}: {
  config: any;
  setConfig: (fn: (c: any) => any) => void;
  addAudit: (acao: string, detalhe: string) => void;
  showToast: (msg: string) => void;
  auditLog?: any[];
}) {
  const [tab, setTab] = useState("usuarios");

  const tabs = [
    { key: "usuarios", label: "Usuários e Senhas", icon: "👥" },
    { key: "cadastros", label: "Vendedores, Setores e Motivos", icon: "🏷️" },
    { key: "regras", label: "Prazos e Opções Extras", icon: "⏱️" },
    { key: "auditoria", label: "Histórico de Segurança", icon: "🛡️" },
  ];

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto" }}>
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
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 16px",
                borderRadius: 8,
                border: "none",
                background: active ? C.wine : "transparent",
                color: active ? "#fff" : C.inkSoft,
                fontSize: 13,
                fontWeight: active ? 700 : 600,
                cursor: "pointer",
                fontFamily: FONT_SANS,
                boxShadow: active ? "0 2px 6px rgba(200, 16, 46, 0.28)" : "none",
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "usuarios" && (
        <UsuariosAdmin
          usuarios={config.usuarios}
          onChange={(items) => setConfig((c) => ({ ...c, usuarios: items }))}
          addAudit={addAudit}
          showToast={showToast}
        />
      )}

      {tab === "cadastros" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <SimpleListAdmin
            title="👤 Vendedores da Equipe"
            label="vendedor(a)"
            items={config.vendedores}
            onChange={(items) => setConfig((c) => ({ ...c, vendedores: items }))}
            addAudit={addAudit}
            showToast={showToast}
          />
          <SimpleListAdmin
            title="🏢 Setores Comerciais"
            label="setor"
            items={config.setores}
            onChange={(items) => setConfig((c) => ({ ...c, setores: items }))}
            addAudit={addAudit}
            showToast={showToast}
          />
          <SimpleListAdmin
            title="📌 Motivos de Atendimento"
            label="motivo"
            items={config.categorias}
            onChange={(items) => setConfig((c) => ({ ...c, categorias: items }))}
            addAudit={addAudit}
            showToast={showToast}
          />
          <SimpleListAdmin
            title="🧵 Tipos de Defeito na Peça"
            label="defeito"
            items={config.defeitos || []}
            onChange={(items) => setConfig((c) => ({ ...c, defeitos: items }))}
            addAudit={addAudit}
            showToast={showToast}
          />
          <SimpleListAdmin
            title="🔄 Tipos de Solicitação"
            label="tipo"
            items={config.tipos}
            onChange={(items) => setConfig((c) => ({ ...c, tipos: items }))}
            addAudit={addAudit}
            showToast={showToast}
          />
        </div>
      )}

      {tab === "regras" && (
        <div style={{ display: "grid", gap: 16 }}>
          <RegrasAdmin config={config} setConfig={setConfig} addAudit={addAudit} showToast={showToast} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <StatusAdmin
              status={config.status}
              onChange={(items) => setConfig((c) => ({ ...c, status: items }))}
              addAudit={addAudit}
              showToast={showToast}
            />
            <CamposPersonalizadosAdmin
              campos={config.camposPersonalizados || []}
              onChange={(items) => setConfig((c) => ({ ...c, camposPersonalizados: items }))}
              addAudit={addAudit}
              showToast={showToast}
            />
          </div>
        </div>
      )}

      {tab === "auditoria" && <AuditoriaView log={auditLog} />}
    </div>
  );
}

function SimpleListAdmin({
  title,
  label,
  items,
  onChange,
  addAudit,
  showToast,
}: {
  title?: string;
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  addAudit: (a: string, d: string) => void;
  showToast: (m: string) => void;
}) {
  const [novo, setNovo] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  const add = () => {
    if (!novo.trim() || items.includes(novo.trim())) return;
    onChange([...items, novo.trim()]);
    addAudit(`Novo(a) ${label} criado(a)`, novo.trim());
    showToast(`${novo.trim()} adicionado`);
    setNovo("");
  };
  const remove = (item: string) => {
    onChange(items.filter((i) => i !== item));
    addAudit(`${label} removido(a)`, item);
    showToast(`${item} removido`);
  };
  const saveEdit = (idx: number) => {
    const copy = [...items];
    const old = copy[idx];
    copy[idx] = editVal;
    onChange(copy);
    addAudit(`${label} editado(a)`, `${old} → ${editVal}`);
    setEditIdx(null);
  };

  return (
    <Card
      title={title || `Lista de ${label}s`}
      right={
        <div style={{ display: "flex", gap: 6 }}>
          <TInput
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            placeholder={`Adicionar ${label}...`}
            style={{ width: 175 }}
          />
          <Button size="sm" variant="primary" icon={Plus} onClick={add}>
            Adicionar
          </Button>
        </div>
      }
    >
      <div style={{ display: "grid", gap: 6, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
        {items.map((item, idx) => (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: "#fff",
            }}
          >
            {editIdx === idx ? (
              <>
                <TInput value={editVal} onChange={(e) => setEditVal(e.target.value)} style={{ flex: 1 }} />
                <Button size="sm" variant="secondary" icon={Check} onClick={() => saveEdit(idx)}>
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditIdx(null)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{item}</span>
                <button
                  onClick={() => {
                    setEditIdx(idx);
                    setEditVal(item);
                  }}
                  title="Editar nome"
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => remove(item)}
                  title="Remover"
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.danger }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatusAdmin({
  status,
  onChange,
  addAudit,
  showToast,
}: {
  status: any[];
  onChange: (items: any[]) => void;
  addAudit: (a: string, d: string) => void;
  showToast: (m: string) => void;
}) {
  const [novo, setNovo] = useState({ nome: "", cor: "info" });
  const add = () => {
    if (!novo.nome.trim()) return;
    onChange([...status, { ...novo, nome: novo.nome.trim() }]);
    addAudit("Novo status criado", novo.nome);
    showToast(`Etapa "${novo.nome}" criada`);
    setNovo({ nome: "", cor: "info" });
  };
  const remove = (nome: string) => {
    onChange(status.filter((s) => s.nome !== nome));
    addAudit("Status removido", nome);
  };
  return (
    <Card
      title="Etapas de Atendimento"
      right={
        <div style={{ display: "flex", gap: 6 }}>
          <TInput
            value={novo.nome}
            onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))}
            placeholder="Nova etapa..."
            style={{ width: 145 }}
          />
          <TSelect
            value={novo.cor}
            onChange={(e) => setNovo((n) => ({ ...n, cor: e.target.value }))}
            style={{ width: 105 }}
          >
            <option value="info">Azul</option>
            <option value="warning">Âmbar</option>
            <option value="success">Verde</option>
            <option value="danger">Vermelho</option>
          </TSelect>
          <Button size="sm" variant="primary" icon={Plus} onClick={add}>
            Criar
          </Button>
        </div>
      }
    >
      <div style={{ display: "grid", gap: 6, maxHeight: 260, overflowY: "auto" }}>
        {status.map((s) => (
          <div
            key={s.nome}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
            }}
          >
            <Badge tone={s.cor}>{s.nome}</Badge>
            <span style={{ flex: 1 }} />
            <button
              onClick={() => remove(s.nome)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.danger }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UsuariosAdmin({
  usuarios,
  onChange,
  addAudit,
  showToast,
}: {
  usuarios: any[];
  onChange: (items: any[]) => void;
  addAudit: (a: string, d: string) => void;
  showToast: (m: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    login: "",
    email: "",
    senha: "",
    perfil: "Atendente SAC",
    setor: "SAC",
    status: "Ativo",
  });

  const openNew = () => {
    setEditingId(null);
    setForm({
      nome: "",
      login: "",
      email: "",
      senha: "",
      perfil: "Atendente SAC",
      setor: "SAC",
      status: "Ativo",
    });
    setModalOpen(true);
  };

  const openEdit = (u: any) => {
    setEditingId(u.id);
    setForm({
      nome: u.nome || "",
      login: u.login || "",
      email: u.email || "",
      senha: u.senha || "",
      perfil: u.perfil || "Atendente SAC",
      setor: u.setor || "SAC",
      status: u.status || "Ativo",
    });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.nome.trim() || (!form.login.trim() && !form.email.trim())) return;
    const finalLogin = form.login.trim() || form.email.trim().split("@")[0];
    const finalPass = form.senha.trim() || "via@123";

    if (editingId) {
      onChange(
        usuarios.map((u) =>
          u.id === editingId
            ? { ...u, ...form, nome: form.nome.trim(), login: finalLogin, senha: finalPass }
            : u
        )
      );
      addAudit("Usuário atualizado", `${form.nome} (${form.perfil})`);
      showToast(`Usuário ${form.nome} atualizado!`);
    } else {
      onChange([
        ...usuarios,
        {
          id: uid("u"),
          ...form,
          nome: form.nome.trim(),
          login: finalLogin,
          senha: finalPass,
        },
      ]);
      addAudit("Usuário criado", `${form.nome} (login: ${finalLogin} / perfil: ${form.perfil})`);
      showToast(`Usuário ${form.nome} criado com sucesso!`);
    }
    setModalOpen(false);
  };

  const isMaster = (u: any) => u.id === "u_admin" || String(u.login || "").toLowerCase() === "admin";

  const toggleStatus = (id: string) => {
    const u = usuarios.find((x) => x.id === id);
    if (u && isMaster(u)) {
      showToast("A conta principal de Administrador não pode ser inativada.");
      return;
    }
    onChange(usuarios.map((x) => (x.id === id ? { ...x, status: x.status === "Ativo" ? "Inativo" : "Ativo" } : x)));
    addAudit("Status de usuário alterado", `${u?.nome}`);
  };

  const remove = (id: string) => {
    const u = usuarios.find((x) => x.id === id);
    if (u && isMaster(u)) {
      showToast("A conta principal de Administrador não pode ser excluída.");
      return;
    }
    if (!window.confirm(`Deseja realmente remover o usuário "${u?.nome}"?`)) return;
    onChange(usuarios.filter((x) => x.id !== id));
    addAudit("Usuário removido", u?.nome);
    showToast("Usuário removido.");
  };

  return (
    <Card
      title="Usuários e Senhas da Equipe"
      subtitle="Crie o acesso individual de cada colaborador para entrar no sistema"
      right={
        <Button variant="primary" icon={Plus} onClick={openNew}>
          Novo Usuário
        </Button>
      }
    >
      <table className="dt">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Login de Entrada</th>
            <th>E-mail</th>
            <th>Permissão</th>
            <th>Setor</th>
            <th>Situação</th>
            <th style={{ textAlign: "right" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => {
            const master = isMaster(u);
            return (
              <tr key={u.id}>
                <td style={{ fontWeight: 700 }}>
                  {u.nome}{" "}
                  {master && (
                    <span
                      style={{
                        fontSize: 10.5,
                        background: C.goldSoft,
                        color: "#92400E",
                        border: `1px solid ${C.gold}66`,
                        padding: "1px 6px",
                        borderRadius: 10,
                        marginLeft: 6,
                        fontWeight: 700,
                      }}
                    >
                      🔒 Conta Principal
                    </span>
                  )}
                </td>
                <td style={{ fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 700, color: C.wine }}>
                  {u.login || u.email?.split("@")[0] || "—"}
                </td>
                <td>{u.email || "—"}</td>
                <td>{u.perfil}</td>
                <td>{u.setor}</td>
                <td><Badge tone={u.status === "Ativo" ? "success" : "danger"}>{u.status}</Badge></td>
                <td style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => openEdit(u)}
                    title="Alterar senha ou dados"
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}
                  >
                    <Edit3 size={15} />
                  </button>
                  {!master && (
                    <>
                      <button
                        onClick={() => toggleStatus(u.id)}
                        title={u.status === "Ativo" ? "Bloquear acesso" : "Liberar acesso"}
                        style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}
                      >
                        {u.status === "Ativo" ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        onClick={() => remove(u.id)}
                        title="Excluir usuário"
                        style={{ background: "none", border: "none", cursor: "pointer", color: C.danger }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Usuário" : "Cadastrar Novo Usuário"}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Nome da Pessoa" required>
            <TInput
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Maria Souza"
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Login (para digitar ao entrar)" required>
              <TInput
                value={form.login}
                onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
                placeholder="Ex: maria"
              />
            </Field>
            <Field label="Senha de Acesso" required>
              <TInput
                type="text"
                value={form.senha}
                onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                placeholder="Ex: via@123"
              />
            </Field>
          </div>
          <Field label="E-mail (opcional)">
            <TInput
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Ex: maria@viadoterno.com.br"
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Nível de Acesso">
              <TSelect value={form.perfil} onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value }))}>
                {Object.keys(PERMS).map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </TSelect>
            </Field>
            <Field label="Setor">
              <TInput value={form.setor} onChange={(e) => setForm((f) => ({ ...f, setor: e.target.value }))} />
            </Field>
          </div>
          <Button variant="primary" icon={Save} onClick={save}>
            {editingId ? "Salvar Alterações" : "Criar Usuário"}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

function CamposPersonalizadosAdmin({
  campos,
  onChange,
  addAudit,
  showToast,
}: {
  campos: any[];
  onChange: (items: any[]) => void;
  addAudit: (a: string, d: string) => void;
  showToast: (m: string) => void;
}) {
  const [form, setForm] = useState({ nome: "", tipo: "Texto", obrigatorio: false });
  const add = () => {
    if (!form.nome.trim()) return;
    onChange([...campos, { id: uid("cf"), ...form }]);
    addAudit("Campo personalizado criado", `${form.nome}`);
    showToast(`Campo "${form.nome}" criado`);
    setForm({ nome: "", tipo: "Texto", obrigatorio: false });
  };
  const remove = (id: string) => {
    const c = campos.find((x) => x.id === id);
    onChange(campos.filter((x) => x.id !== id));
    addAudit("Campo personalizado removido", c?.nome);
  };

  return (
    <Card
      title="Campos Extras no Formulário"
      right={
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <TInput
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            placeholder="Nome do campo..."
            style={{ width: 150 }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={form.obrigatorio}
              onChange={(e) => setForm((f) => ({ ...f, obrigatorio: e.target.checked }))}
            />
            Obrigatório
          </label>
          <Button size="sm" variant="primary" icon={Plus} onClick={add}>
            Criar
          </Button>
        </div>
      }
    >
      {campos.length === 0 ? (
        <EmptyState
          title="Nenhum campo extra"
          body="Adicione apenas se precisar de alguma pergunta extra no cadastro."
        />
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          {campos.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13 }}>{c.nome}</span>
              {c.obrigatorio && <Badge tone="warning">Obrigatório</Badge>}
              <span style={{ flex: 1 }} />
              <button
                onClick={() => remove(c.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.danger }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RegrasAdmin({
  config,
  setConfig,
  addAudit,
  showToast,
}: {
  config: any;
  setConfig: (fn: (c: any) => any) => void;
  addAudit: (a: string, d: string) => void;
  showToast: (m: string) => void;
}) {
  const setRegra = (v: string) => {
    setConfig((c) => ({ ...c, regraDuplicidade: v }));
    addAudit("Regra de duplicidade alterada", v);
    showToast("Regra atualizada");
  };
  const setSla = (prioridade: string, dias: string) => {
    setConfig((c) => ({ ...c, slaConfig: { ...c.slaConfig, [prioridade]: Number(dias) } }));
    addAudit("Prazo alterado", `${prioridade}: ${dias} dias`);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card title="Quando o número do pedido já existir">
        <div style={{ display: "grid", gap: 10 }}>
          {[
            ["alerta", "Apenas avisar na tela e deixar salvar normalmente"],
            ["justificativa", "Deixar salvar, mas pedir uma explicação rápida"],
            ["bloqueia", "Bloquear o cadastro de pedido repetido"],
          ].map(([val, label]) => (
            <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer" }}>
              <input
                type="radio"
                checked={config.regraDuplicidade === val}
                onChange={() => setRegra(val)}
              />
              {label}
            </label>
          ))}
        </div>
      </Card>
      <Card title="Prazo Padrão para Resolver (em dias)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {config.prioridades.map((p: string) => (
            <Field key={p} label={p}>
              <TInput
                type="number"
                value={config.slaConfig?.[p] ?? ""}
                onChange={(e) => setSla(p, e.target.value)}
              />
            </Field>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AuditoriaView({ log }: { log: any[] }) {
  const [busca, setBusca] = useState("");
  const filtered = log.filter((l) =>
    `${l.acao} ${l.detalhe} ${l.usuario}`.toLowerCase().includes(busca.toLowerCase())
  );
  return (
    <div>
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 360 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.inkSoft }} />
        <TInput
          placeholder="Buscar por pessoa, ação ou protocolo…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ paddingLeft: 30 }}
        />
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Nenhum registro encontrado" body="Todas as ações feitas no sistema ficam registradas aqui." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="dt">
              <thead>
                <tr><th>Data e Hora</th><th>Quem fez</th><th>Ação</th><th>Detalhes</th></tr>
              </thead>
              <tbody>
                {filtered.slice(0, 300).map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: "nowrap", fontFamily: FONT_MONO, fontSize: 11.5 }}>
                      {fmtDateTime(l.data)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{l.usuario}</td>
                    <td><strong style={{ color: C.wine }}>{l.acao}</strong></td>
                    <td style={{ color: C.inkSoft }}>{l.detalhe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronRight, AlertTriangle, Save, Check, PlusCircle, Search, Trash2, ChevronDown, ChevronUp, Edit3
} from "lucide-react";
import {
  C, FONT_DISPLAY, FONT_SANS, Card, Button, Field, TInput, TSelect, TTextArea,
  Badge, ProtocolTag, EmptyState, Modal, fmtCurrency, fmtDate, fmtDateTime,
  WHATSAPP_ICON_URL, buildWhatsAppLink
} from "../components/ui";
import { FRETE_PAGADORES } from "../defaults";
import { useTicketFilters, FilterBar, statusColor } from "./DashboardView";

function ErrorText({ children }: { children: React.ReactNode }) {
  return <div style={{ color: C.danger, fontSize: 11.5, marginTop: 2, fontWeight: 600 }}>{children}</div>;
}

const TIPO_ICONS: Record<string, string> = {
  "Troca": "🔄",
  "Devolução": "📦",
  "Estorno": "💰",
  "Reclamação": "⚠️",
  "Dúvida": "💬",
  "Suporte Pós-Venda": "🤝",
  "Ajuste Comercial": "✂️",
};

export function TicketRow({ t, config, onOpen }: { t: any; config: any; onOpen: (id: string) => void }) {
  const tone = statusColor(config.status, t.status);
  const isFinal = ["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(t.status);
  const atrasado = !isFinal && new Date(t.prazo) < new Date();
  const waUrl = buildWhatsAppLink(t.telefone, t.cliente, t.protocolo);

  return (
    <tr onClick={() => onOpen(t.id)} style={{ cursor: "pointer" }}>
      <td><ProtocolTag protocolo={t.protocolo} /></td>
      <td>
        <div style={{ fontWeight: 700, color: C.ink }}>{t.cliente}</div>
        {t.telefone && <div style={{ fontSize: 11.5, color: C.inkSoft }}>{t.telefone}</div>}
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>
          {TIPO_ICONS[t.tipo] || "📌"} {t.tipo}
        </div>
        <div style={{ fontSize: 11.5, color: C.inkSoft }}>{t.categoria}</div>
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>Ped. #{t.pedido}</div>
        <div style={{ fontSize: 11.5, color: C.inkSoft }}>{t.setor} · {t.vendedor}</div>
      </td>
      <td style={{ fontWeight: 600 }}>{fmtCurrency(t.valorEnvolvido)}</td>
      <td><Badge tone={tone}>{t.status}</Badge></td>
      <td>
        {atrasado ? (
          <Badge tone="danger">Fora do prazo</Badge>
        ) : isFinal ? (
          <span style={{ fontSize: 12, color: C.success, fontWeight: 600 }}>Concluído</span>
        ) : (
          <span style={{ fontSize: 12, color: C.inkSoft }}>Até {fmtDate(t.prazo)}</span>
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
          <button
            onClick={() => onOpen(t.id)}
            title="Abrir atendimento"
            style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function AtendimentosView({
  tickets,
  config,
  onOpen,
  onNew,
  initialQuickTab = "todos",
}: {
  tickets: any[];
  config: any;
  onOpen: (id: string) => void;
  onNew: () => void;
  perms?: any;
  initialQuickTab?: string;
}) {
  const [quickTab, setQuickTab] = useState(initialQuickTab);
  const { filters, set, clear, filtered, anosDisponiveis } = useTicketFilters(tickets, config);

  const counts = useMemo(() => {
    const isFinal = (s: string) => ["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(s);
    const abertos = filtered.filter((t) => !isFinal(t.status));
    const atrasados = abertos.filter((t) => new Date(t.prazo) < new Date());
    const trocas = filtered.filter((t) => ["Troca", "Devolução", "Estorno"].includes(t.tipo));
    const reclamacoes = filtered.filter((t) => t.tipo === "Reclamação" || t.categoria === "Cliente Insatisfeito");
    const concluidos = filtered.filter((t) => isFinal(t.status));
    const clientesUnicos = new Set(tickets.map((t) => t.cliente)).size;
    return {
      todos: filtered.length,
      abertos: abertos.length,
      atrasados: atrasados.length,
      trocas: trocas.length,
      reclamacoes: reclamacoes.length,
      concluidos: concluidos.length,
      clientes: clientesUnicos,
    };
  }, [filtered, tickets]);

  const listToShow = useMemo(() => {
    const isFinal = (s: string) => ["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(s);
    if (quickTab === "abertos") return filtered.filter((t) => !isFinal(t.status));
    if (quickTab === "atrasados") return filtered.filter((t) => !isFinal(t.status) && new Date(t.prazo) < new Date());
    if (quickTab === "trocas") return filtered.filter((t) => ["Troca", "Devolução", "Estorno"].includes(t.tipo));
    if (quickTab === "reclamacoes") return filtered.filter((t) => t.tipo === "Reclamação" || t.categoria === "Cliente Insatisfeito");
    if (quickTab === "concluidos") return filtered.filter((t) => isFinal(t.status));
    return filtered;
  }, [filtered, quickTab]);

  const quickTabs = [
    { id: "todos", label: "Todos", icon: "📋", count: counts.todos },
    { id: "abertos", label: "Em Aberto", icon: "⏳", count: counts.abertos },
    { id: "atrasados", label: "Fora do Prazo", icon: "🚨", count: counts.atrasados, danger: counts.atrasados > 0 },
    { id: "trocas", label: "Trocas & Devoluções", icon: "🔄", count: counts.trocas },
    { id: "reclamacoes", label: "Reclamações", icon: "⚠️", count: counts.reclamacoes },
    { id: "concluidos", label: "Concluídos", icon: "✅", count: counts.concluidos },
    { id: "clientes", label: "Por Cliente", icon: "👥", count: counts.clientes },
  ];

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto" }}>
      {/* Botões Visuais de Filtro Rápido em 1 Clique */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            background: "#fff",
            padding: 6,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          {quickTabs.map((qt) => {
            const active = quickTab === qt.id;
            return (
              <button
                key={qt.id}
                onClick={() => setQuickTab(qt.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 13px",
                  borderRadius: 8,
                  border: "none",
                  background: active ? C.wine : qt.danger ? C.dangerSoft : "transparent",
                  color: active ? "#fff" : qt.danger ? C.danger : C.inkSoft,
                  fontWeight: active ? 700 : 600,
                  fontSize: 12.5,
                  cursor: "pointer",
                  fontFamily: FONT_SANS,
                  transition: "all 0.15s ease",
                }}
              >
                <span>{qt.icon}</span>
                <span>{qt.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 10,
                    background: active ? "rgba(255,255,255,0.22)" : C.bg,
                    color: active ? "#fff" : qt.danger ? C.danger : C.ink,
                  }}
                >
                  {qt.count}
                </span>
              </button>
            );
          })}
        </div>

        <Button variant="primary" icon={PlusCircle} onClick={onNew}>
          Novo Atendimento
        </Button>
      </div>

      {quickTab === "clientes" ? (
        <ClientesView tickets={tickets} />
      ) : (
        <>
          <FilterBar filters={filters} set={set} clear={clear} config={config} showBusca anosDisponiveis={anosDisponiveis} />

          <Card style={{ padding: 0, overflow: "hidden" }}>
            {listToShow.length === 0 ? (
              <EmptyState
                title="Nenhum atendimento nesta lista"
                body={
                  tickets.length === 0
                    ? "Clique em 'Novo Atendimento' para registrar o primeiro chamado de cliente."
                    : "Altere a aba acima ou limpe a busca para ver todos os protocolos."
                }
                action={
                  tickets.length === 0 ? (
                    <Button variant="primary" icon={PlusCircle} onClick={onNew}>
                      Registrar Primeiro Atendimento
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="dt">
                  <thead>
                    <tr>
                      <th>Protocolo</th>
                      <th>Cliente / WhatsApp</th>
                      <th>O que precisa</th>
                      <th>Pedido / Equipe</th>
                      <th>Valor</th>
                      <th>Etapa Atual</th>
                      <th>Prazo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {listToShow.slice(0, 250).map((t) => (
                      <TicketRow key={t.id} t={t} config={config} onOpen={onOpen} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export function NovoAtendimentoView({
  config,
  nextProtocol,
  findDuplicate,
  onCreate,
  onCancel,
}: {
  config: any;
  nextProtocol: string;
  findDuplicate: (pedido: string, excludeId?: string) => any;
  onCreate: (data: any) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<any>({
    cliente: "",
    documento: "",
    telefone: "",
    email: "",
    canal: config.canais[0] || "WhatsApp",
    pedido: "",
    notaFiscal: "",
    valorPedido: "",
    loja: config.lojas[0] || "",
    setor: config.setores[0] || "",
    vendedor: config.vendedores[0] || "",
    tipo: config.tipos[0] || "Troca",
    categoria: config.categorias[0] || "",
    descricao: "",
    prioridade: "Média",
    responsavel: "",
    setorResponsavel: "SAC",
    valorEnvolvido: "",
    valorFrete: "",
    custoPacReverso: "",
    custoEnvio: "",
    fretePagoPor: "",
    defeitoFabricacao: false,
    defeitoTipo: "",
    defeitoDescricao: "",
    customFields: {},
  });

  const [showFrete, setShowFrete] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dupWarning, setDupWarning] = useState<any>(null);
  const [justificativa, setJustificativa] = useState("");

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const checkDuplicate = (pedido: string) => {
    if (!pedido) {
      setDupWarning(null);
      return;
    }
    const dup = findDuplicate(pedido);
    setDupWarning(dup || null);
  };

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!form.cliente.trim()) errs.cliente = "Digite o nome do cliente";
    if (!form.pedido.trim()) errs.pedido = "Digite o número do pedido";
    if (!form.descricao.trim()) errs.descricao = "Conte resumidamente o que aconteceu";

    if (showFrete && Number(form.valorFrete) > 0 && !form.fretePagoPor) {
      errs.fretePagoPor = "Selecione quem pagou o frete";
    }
    if (form.defeitoFabricacao && !form.defeitoTipo) {
      errs.defeitoTipo = "Escolha qual foi o defeito na peça";
    }
    (config.camposPersonalizados || []).forEach((cf: any) => {
      if (cf.obrigatorio && !form.customFields?.[cf.nome]) {
        errs[`cf_${cf.id}`] = "Campo obrigatório";
      }
    });
    if (dupWarning && config.regraDuplicidade === "bloqueia") {
      errs.pedido = "Este pedido já possui atendimento aberto.";
    }
    if (dupWarning && config.regraDuplicidade === "justificativa" && !justificativa.trim()) {
      errs.justificativa = "Explique por que está abrindo outro chamado para o mesmo pedido.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const slaMap = config.slaConfig || { Baixa: 10, Média: 7, Alta: 4, Urgente: 2 };
    const prazoDias = slaMap[form.prioridade] || 7;
    const prazo = new Date();
    prazo.setDate(prazo.getDate() + prazoDias);

    onCreate({
      ...form,
      motivo: form.categoria,
      valorPedido: Number(form.valorPedido) || 0,
      valorEnvolvido: Number(form.valorEnvolvido || form.valorPedido) || 0,
      valorFrete: showFrete ? Number(form.valorFrete) || 0 : 0,
      custoPacReverso: showFrete ? Number(form.custoPacReverso) || 0 : 0,
      custoEnvio: showFrete ? Number(form.custoEnvio) || 0 : 0,
      fretePagoPor: showFrete ? form.fretePagoPor : "",
      valorEstorno: 0,
      valorAbatimento: 0,
      outrosCustos: 0,
      prazo: prazo.toISOString(),
      responsavel: form.responsavel || form.vendedor,
      duplicidadeJustificada: !!(dupWarning && justificativa.trim()),
    });
  };

  const urgencias = [
    { id: "Média", label: "🟢 Normal", desc: "Prazo de 7 dias" },
    { id: "Alta", label: "🟡 Alta", desc: "Prazo de 4 dias" },
    { id: "Urgente", label: "🔴 Urgente", desc: "Prazo de 2 dias" },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Topo simples com botão voltar e número do protocolo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        {onCancel ? (
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.inkSoft,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Voltar
          </button>
        ) : <div />}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12.5, color: C.inkSoft }}>Protocolo que será gerado:</span>
          <ProtocolTag protocolo={nextProtocol} />
        </div>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        {/* PASSO 1: DADOS DO CLIENTE E PEDIDO */}
        <Card title="1. Quem é o cliente e qual o pedido?" subtitle="Preencha os dados principais para localizar a compra">
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
              <Field label="Nome do Cliente" required>
                <TInput
                  value={form.cliente}
                  onChange={(e) => set("cliente", e.target.value)}
                  placeholder="Ex: João Carlos da Silva"
                />
                {errors.cliente && <ErrorText>{errors.cliente}</ErrorText>}
              </Field>
              <Field label="WhatsApp / Telefone (com DDD)">
                <TInput
                  value={form.telefone}
                  onChange={(e) => set("telefone", e.target.value)}
                  placeholder="Ex: (47) 99999-0000"
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <Field label="Nº do Pedido" required>
                <TInput
                  value={form.pedido}
                  onChange={(e) => {
                    set("pedido", e.target.value);
                    checkDuplicate(e.target.value);
                  }}
                  placeholder="Ex: 10452"
                />
                {errors.pedido && <ErrorText>{errors.pedido}</ErrorText>}
              </Field>
              <Field label="Valor do Pedido (R$)">
                <TInput
                  type="number"
                  value={form.valorPedido}
                  onChange={(e) => set("valorPedido", e.target.value)}
                  placeholder="0,00"
                />
              </Field>
              <Field label="Setor">
                <TSelect value={form.setor} onChange={(e) => set("setor", e.target.value)}>
                  {config.setores.map((s: string) => <option key={s}>{s}</option>)}
                </TSelect>
              </Field>
              <Field label="Quem vendeu?">
                <TSelect value={form.vendedor} onChange={(e) => set("vendedor", e.target.value)}>
                  {config.vendedores.map((s: string) => <option key={s}>{s}</option>)}
                </TSelect>
              </Field>
            </div>

            {dupWarning && (
              <div
                style={{
                  background: C.amberSoft,
                  border: `1px solid ${C.amber}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "#92400E",
                  display: "flex",
                  gap: 10,
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <strong>Atenção: este pedido já tem um atendimento registrado!</strong>
                  <div style={{ marginTop: 2 }}>
                    Pedido #{dupWarning.pedido} — Protocolo <strong>{dupWarning.protocolo}</strong> ({dupWarning.cliente}).
                  </div>
                  {config.regraDuplicidade === "justificativa" && (
                    <div style={{ marginTop: 8 }}>
                      <TTextArea
                        placeholder="Explique o motivo de abrir outro protocolo para o mesmo pedido..."
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                        style={{ minHeight: 50 }}
                      />
                      {errors.justificativa && <ErrorText>{errors.justificativa}</ErrorText>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botão discreto para dados extras opcionais */}
            <div>
              <button
                type="button"
                onClick={() => setShowExtras((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: C.wine,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: FONT_SANS,
                }}
              >
                {showExtras ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showExtras ? "Ocultar campos opcionais (CPF, Nota Fiscal, E-mail)" : "Informar CPF/CNPJ, Nota Fiscal, E-mail ou Canal (opcional)"}
              </button>

              {showExtras && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 10,
                    marginTop: 12,
                    padding: 12,
                    background: C.bg,
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <Field label="CPF / CNPJ">
                    <TInput value={form.documento} onChange={(e) => set("documento", e.target.value)} placeholder="000.000.000-00" />
                  </Field>
                  <Field label="Nota Fiscal">
                    <TInput value={form.notaFiscal} onChange={(e) => set("notaFiscal", e.target.value)} placeholder="Nº da NF" />
                  </Field>
                  <Field label="E-mail">
                    <TInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="cliente@email.com" />
                  </Field>
                  <Field label="Canal de Contato">
                    <TSelect value={form.canal} onChange={(e) => set("canal", e.target.value)}>
                      {config.canais.map((c: string) => <option key={c}>{c}</option>)}
                    </TSelect>
                  </Field>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* PASSO 2: O QUE O CLIENTE PRECISA? */}
        <Card title="2. Como podemos ajudar o cliente?" subtitle="Escolha o tipo de solicitação e conte o que aconteceu">
          <div style={{ display: "grid", gap: 16 }}>
            <Field label="O que o cliente solicitou?" required>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {config.tipos.map((t: string) => {
                  const selected = form.tipo === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("tipo", t)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: `2px solid ${selected ? C.wine : C.border}`,
                        background: selected ? C.wineSoft : "#fff",
                        color: selected ? C.wine : C.ink,
                        fontWeight: selected ? 700 : 600,
                        fontSize: 13.5,
                        cursor: "pointer",
                        fontFamily: FONT_SANS,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{TIPO_ICONS[t] || "📌"}</span>
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 14 }}>
              <Field label="Qual o motivo principal?" required>
                <TSelect value={form.categoria} onChange={(e) => set("categoria", e.target.value)}>
                  {config.categorias.map((s: string) => <option key={s}>{s}</option>)}
                </TSelect>
              </Field>

              <Field label="Qual a urgência deste caso?">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {urgencias.map((u) => {
                    const active = form.prioridade === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => set("prioridade", u.id)}
                        style={{
                          padding: "7px 8px",
                          borderRadius: 8,
                          border: `1.5px solid ${active ? C.wine : C.border}`,
                          background: active ? C.wineSoft : "#fff",
                          color: active ? C.wine : C.ink,
                          cursor: "pointer",
                          textAlign: "center",
                          fontFamily: FONT_SANS,
                        }}
                      >
                        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{u.label}</div>
                        <div style={{ fontSize: 10.5, color: C.inkSoft }}>{u.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <Field label="O que aconteceu? (Relato do cliente)" required>
              <TTextArea
                value={form.descricao}
                onChange={(e) => set("descricao", e.target.value)}
                placeholder="Ex: Cliente recebeu o terno tamanho 50, ficou apertado no paletó e pediu troca pelo tamanho 52..."
                style={{ minHeight: 85 }}
              />
              {errors.descricao && <ErrorText>{errors.descricao}</ErrorText>}
            </Field>
          </div>
        </Card>

        {/* PASSO 3: DETALHES OPCIONAIS (FRETE E DEFEITO DE PEÇA) */}
        <Card title="3. Detalhes de Frete ou Defeito na Peça (Opcional)" subtitle="Marque apenas se já tiver essas informações agora — você também pode preencher depois!">
          <div style={{ display: "grid", gap: 14 }}>
            {/* Opção Frete */}
            <div
              style={{
                border: `1px solid ${showFrete ? C.wine : C.border}`,
                background: showFrete ? "#FFFDFD" : C.bg,
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: C.ink }}>
                <input
                  type="checkbox"
                  checked={showFrete}
                  onChange={(e) => setShowFrete(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span>🚚 Já sei o valor do Frete / Correios deste atendimento</span>
              </label>

              {showFrete && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
                  <Field label="Valor do Frete (R$)">
                    <TInput
                      type="number"
                      value={form.valorFrete}
                      onChange={(e) => set("valorFrete", e.target.value)}
                      placeholder="0,00"
                    />
                  </Field>
                  <Field label="Quem pagou o frete?">
                    <TSelect value={form.fretePagoPor} onChange={(e) => set("fretePagoPor", e.target.value)}>
                      <option value="">Selecione...</option>
                      {FRETE_PAGADORES.map((f) => <option key={f} value={f}>{f}</option>)}
                    </TSelect>
                    {errors.fretePagoPor && <ErrorText>{errors.fretePagoPor}</ErrorText>}
                  </Field>
                  <Field label="Custo Correios Reverso (R$)">
                    <TInput
                      type="number"
                      value={form.custoPacReverso}
                      onChange={(e) => set("custoPacReverso", e.target.value)}
                      placeholder="Opcional"
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Opção Defeito */}
            <div
              style={{
                border: `1px solid ${form.defeitoFabricacao ? C.wine : C.border}`,
                background: form.defeitoFabricacao ? "#FFFDFD" : C.bg,
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: C.ink }}>
                <input
                  type="checkbox"
                  checked={form.defeitoFabricacao}
                  onChange={(e) => set("defeitoFabricacao", e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span>🧵 A peça veio com defeito de costura / fabricação</span>
              </label>

              {form.defeitoFabricacao && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12, marginTop: 14 }}>
                  <Field label="Qual foi o defeito na peça?" required>
                    <TSelect value={form.defeitoTipo} onChange={(e) => set("defeitoTipo", e.target.value)}>
                      <option value="">Selecione...</option>
                      {(config.defeitos || []).map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </TSelect>
                    {errors.defeitoTipo && <ErrorText>{errors.defeitoTipo}</ErrorText>}
                  </Field>
                  <Field label="Observação sobre a peça">
                    <TInput
                      value={form.defeitoDescricao}
                      onChange={(e) => set("defeitoDescricao", e.target.value)}
                      placeholder="Ex: Costura descosturada na manga direita"
                    />
                  </Field>
                </div>
              )}
            </div>

            {(config.camposPersonalizados || []).length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                {config.camposPersonalizados.map((cf: any) => (
                  <Field key={cf.id} label={cf.nome} required={cf.obrigatorio}>
                    <TInput
                      value={form.customFields?.[cf.nome] || ""}
                      onChange={(e) =>
                        set("customFields", { ...(form.customFields || {}), [cf.nome]: e.target.value })
                      }
                    />
                    {errors[`cf_${cf.id}`] && <ErrorText>{errors[`cf_${cf.id}`]}</ErrorText>}
                  </Field>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Botão Final Grande e Claro */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} style={{ padding: "12px 20px" }}>
              Cancelar
            </Button>
          )}
          <Button variant="primary" icon={Save} onClick={submit} style={{ padding: "13px 28px", fontSize: 14.5 }}>
            Criar Atendimento ({nextProtocol})
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoGrid({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
      {items.map(([label, value]) => (
        <div key={label} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>
          <div style={{ fontSize: 11, color: C.inkSoft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>
            {label}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginTop: 2 }}>{value || "—"}</div>
        </div>
      ))}
    </div>
  );
}

function ValoresFreteDefeitoCard({
  ticket,
  config,
  canEdit,
  onUpdate,
}: {
  ticket: any;
  config: any;
  canEdit: boolean;
  onUpdate: (patch: any, label: string) => void;
}) {
  const init = () => ({
    fretePagoPor: ticket.fretePagoPor || "",
    valorFrete: ticket.valorFrete ?? "",
    custoPacReverso: ticket.custoPacReverso ?? "",
    valorEstorno: ticket.valorEstorno ?? "",
    defeitoFabricacao: !!ticket.defeitoFabricacao,
    defeitoTipo: ticket.defeitoTipo || "",
    defeitoDescricao: ticket.defeitoDescricao || "",
  });
  const [f, setF] = useState(init);
  const [err, setErr] = useState("");

  useEffect(() => {
    setF(init());
    setErr("");
  }, [ticket.id]);

  const save = () => {
    if (Number(f.valorFrete) > 0 && !f.fretePagoPor) {
      setErr("Escolha quem pagou o frete.");
      return;
    }
    if (f.defeitoFabricacao && !f.defeitoTipo) {
      setErr("Escolha qual foi o defeito na peça.");
      return;
    }
    setErr("");
    onUpdate(
      {
        fretePagoPor: f.fretePagoPor,
        valorFrete: Number(f.valorFrete) || 0,
        custoPacReverso: Number(f.custoPacReverso) || 0,
        valorEstorno: Number(f.valorEstorno) || 0,
        defeitoFabricacao: f.defeitoFabricacao,
        defeitoTipo: f.defeitoFabricacao ? f.defeitoTipo : "",
        defeitoDescricao: f.defeitoFabricacao ? f.defeitoDescricao : "",
      },
      "Dados de frete, estorno e peça atualizados"
    );
  };

  return (
    <Card title="🚚 Frete, Estorno e Defeito" subtitle="Preencha ou atualize se houver custos ou avaria">
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Valor do Frete (R$)">
            <TInput
              type="number"
              disabled={!canEdit}
              value={f.valorFrete}
              onChange={(e) => setF((x) => ({ ...x, valorFrete: e.target.value }))}
              placeholder="0,00"
            />
          </Field>
          <Field label="Quem pagou o frete?">
            <TSelect
              disabled={!canEdit}
              value={f.fretePagoPor}
              onChange={(e) => setF((x) => ({ ...x, fretePagoPor: e.target.value }))}
            >
              <option value="">Não informado</option>
              {FRETE_PAGADORES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </TSelect>
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Custo Correios Reverso (R$)">
            <TInput
              type="number"
              disabled={!canEdit}
              value={f.custoPacReverso}
              onChange={(e) => setF((x) => ({ ...x, custoPacReverso: e.target.value }))}
              placeholder="0,00"
            />
          </Field>
          <Field label="Valor Estornado ao Cliente (R$)">
            <TInput
              type="number"
              disabled={!canEdit}
              value={f.valorEstorno}
              onChange={(e) => setF((x) => ({ ...x, valorEstorno: e.target.value }))}
              placeholder="0,00"
            />
          </Field>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            cursor: canEdit ? "pointer" : "default",
            fontWeight: 600,
            padding: "8px 10px",
            background: C.bg,
            borderRadius: 8,
          }}
        >
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={f.defeitoFabricacao}
            onChange={(e) => setF((x) => ({ ...x, defeitoFabricacao: e.target.checked }))}
          />
          🧵 A peça teve defeito de costura / fabricação
        </label>

        {f.defeitoFabricacao && (
          <>
            <Field label="Qual foi o defeito?">
              <TSelect
                disabled={!canEdit}
                value={f.defeitoTipo}
                onChange={(e) => setF((x) => ({ ...x, defeitoTipo: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {(config.defeitos || []).map((d: string) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </TSelect>
            </Field>
            <Field label="Detalhes do defeito">
              <TTextArea
                disabled={!canEdit}
                value={f.defeitoDescricao}
                onChange={(e) => setF((x) => ({ ...x, defeitoDescricao: e.target.value }))}
                style={{ minHeight: 55 }}
              />
            </Field>
          </>
        )}

        {err && <ErrorText>{err}</ErrorText>}
        {canEdit && (
          <Button size="sm" variant="secondary" icon={Save} onClick={save} style={{ width: "100%" }}>
            Salvar Valores e Defeito
          </Button>
        )}
      </div>
    </Card>
  );
}

const MAIN_STEPS = [
  { status: "Novo", label: "Novo", icon: "✨" },
  { status: "Em análise", label: "Em Análise", icon: "🔎" },
  { status: "Aguardando cliente", label: "Aguardando Cliente", icon: "⏳" },
  { status: "Aguardando setor", label: "Aguardando Setor", icon: "🏢" },
  { status: "Resolvido", label: "Resolvido", icon: "✅" },
];

export function DetalheView({
  ticket,
  config,
  perms,
  onBack,
  onUpdate,
  onDelete,
}: {
  ticket: any;
  config: any;
  perms: any;
  onBack: () => void;
  onUpdate: (patch: any, label: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [obs, setObs] = useState("");
  const [showResolucao, setShowResolucao] = useState(false);
  const [solucao, setSolucao] = useState(ticket.solucao || "");
  const [npsInput, setNpsInput] = useState<any>(ticket.nps ?? "");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    cliente: "",
    telefone: "",
    documento: "",
    email: "",
    canal: "",
    pedido: "",
    notaFiscal: "",
    valorPedido: "",
    valorEnvolvido: "",
    setor: "",
    vendedor: "",
    tipo: "",
    categoria: "",
    prioridade: "Média",
    descricao: "",
  });

  const openEditModal = () => {
    setEditForm({
      cliente: ticket.cliente || "",
      telefone: ticket.telefone || "",
      documento: ticket.documento || "",
      email: ticket.email || "",
      canal: ticket.canal || config.canais[0] || "WhatsApp",
      pedido: ticket.pedido || "",
      notaFiscal: ticket.notaFiscal || "",
      valorPedido: ticket.valorPedido ?? ticket.valorEnvolvido ?? "",
      valorEnvolvido: ticket.valorEnvolvido ?? "",
      setor: ticket.setor || config.setores[0] || "",
      vendedor: ticket.vendedor || config.vendedores[0] || "",
      tipo: ticket.tipo || config.tipos[0] || "Troca",
      categoria: ticket.categoria || config.categorias[0] || "",
      prioridade: ticket.prioridade || "Média",
      descricao: ticket.descricao || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.cliente.trim() || !editForm.pedido.trim() || !editForm.descricao.trim()) {
      alert("Por favor, preencha os campos obrigatórios: Nome do Cliente, Nº do Pedido e Relato.");
      return;
    }
    const valPed = Number(editForm.valorPedido) || 0;
    const valEnv = Number(editForm.valorEnvolvido) || valPed;
    onUpdate(
      {
        cliente: editForm.cliente.trim(),
        telefone: editForm.telefone.trim(),
        documento: editForm.documento.trim(),
        email: editForm.email.trim(),
        canal: editForm.canal,
        pedido: editForm.pedido.trim(),
        notaFiscal: editForm.notaFiscal.trim(),
        valorPedido: valPed,
        valorEnvolvido: valEnv,
        setor: editForm.setor,
        vendedor: editForm.vendedor,
        tipo: editForm.tipo,
        categoria: editForm.categoria,
        motivo: editForm.categoria,
        prioridade: editForm.prioridade,
        descricao: editForm.descricao.trim(),
      },
      "Dados do atendimento corrigidos"
    );
    setEditModalOpen(false);
  };

  useEffect(() => {
    setSolucao(ticket.solucao || "");
    setNpsInput(ticket.nps ?? "");
  }, [ticket.id, ticket.status]);

  const tone = statusColor(config.status, ticket.status);
  const isFinal = ["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(ticket.status);
  const atrasado = !isFinal && new Date(ticket.prazo) < new Date();
  const waUrl = buildWhatsAppLink(ticket.telefone, ticket.cliente, ticket.protocolo);
  const canEdit = true; // Qualquer operador/usuário pode editar atendimentos para corrigir erros

  const handleQuickStep = (newStatus: string) => {
    if (!canEdit || newStatus === ticket.status) return;
    if (newStatus === "Resolvido" && !ticket.dataResolucao) {
      setShowResolucao(true);
    }
    onUpdate({ status: newStatus }, `Etapa alterada para ${newStatus}`);
  };

  const addComment = () => {
    if (!obs.trim()) return;
    const now = new Date().toISOString();
    onUpdate(
      { timeline: [...ticket.timeline, { data: now, usuario: "Atendimento SAC", acao: "Anotação adicionada", comentario: obs }] },
      "Nova anotação registrada"
    );
    setObs("");
  };

  const finalize = () => {
    const nps = npsInput === "" ? null : Number(npsInput);
    onUpdate(
      {
        status: "Finalizado",
        solucao,
        dataResolucao: new Date().toISOString(),
        responsavelResolucao: "Equipe SAC",
        nps,
        clienteSatisfeito: nps === null ? null : nps >= 7,
      },
      "Atendimento concluído!"
    );
    setShowResolucao(false);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Topo: Voltar + Botões Principais (WhatsApp e Concluir) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.inkSoft,
            fontSize: 13.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} /> Voltar para Atendimentos
        </button>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "#16A34A",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
              }}
            >
              <img src={WHATSAPP_ICON_URL} alt="WhatsApp" style={{ width: 15, height: 15 }} />
              Chamar no WhatsApp
            </a>
          )}

          {canEdit && (
            <Button size="sm" variant="secondary" icon={Edit3} onClick={openEditModal}>
              Editar Dados
            </Button>
          )}

          {!ticket.dataResolucao && canEdit && (
            <Button variant="primary" icon={Check} onClick={() => setShowResolucao(true)}>
              Concluir Atendimento
            </Button>
          )}

          {perms.excluir && onDelete && (
            <Button
              size="sm"
              variant="danger"
              icon={Trash2}
              onClick={() => {
                if (window.confirm(`Deseja realmente excluir o protocolo ${ticket.protocolo}?`)) {
                  onDelete(ticket.id);
                }
              }}
            >
              Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Cabeçalho do Cliente + Barra de Etapas em 1 Clique */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <ProtocolTag protocolo={ticket.protocolo} />
              <Badge tone={tone}>{ticket.status}</Badge>
              {atrasado && <Badge tone="danger">Fora do Prazo</Badge>}
              <span style={{ fontSize: 12.5, color: C.inkSoft }}>
                Pedido <strong>#{ticket.pedido}</strong> · {ticket.setor}
              </span>
            </div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, margin: 0, color: C.ink }}>
              {ticket.cliente}
            </h2>
          </div>

          {canEdit && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: C.inkSoft }}>Outra situação:</span>
              <TSelect
                value={ticket.status}
                onChange={(e) => handleQuickStep(e.target.value)}
                style={{ width: 165, padding: "5px 8px", fontSize: 12 }}
              >
                {config.status.map((s: any) => (
                  <option key={s.nome} value={s.nome}>{s.nome}</option>
                ))}
              </TSelect>
            </div>
          )}
        </div>

        {/* Barra Visual de Etapas — Muda com 1 clique! */}
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.inkSoft, marginBottom: 8 }}>
            CLIQUE NA ETAPA ATUAL PARA ATUALIZAR:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(120px, 1fr))", gap: 8 }}>
            {MAIN_STEPS.map((step) => {
              const isCurrent =
                ticket.status === step.status ||
                (step.status === "Resolvido" && ticket.status === "Finalizado");
              return (
                <button
                  key={step.status}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleQuickStep(step.status)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: 10,
                    border: `2px solid ${isCurrent ? C.wine : C.border}`,
                    background: isCurrent ? C.wine : C.bg,
                    color: isCurrent ? "#fff" : C.ink,
                    fontWeight: isCurrent ? 700 : 600,
                    fontSize: 12.5,
                    cursor: canEdit ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontFamily: FONT_SANS,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{step.icon}</span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Caixa de Conclusão quando clicar em "Concluir Atendimento" */}
      {(ticket.dataResolucao || showResolucao) && (
        <Card
          title="✅ Conclusão do Atendimento"
          style={{ marginBottom: 16, border: `2px solid ${C.success}`, background: "#F8FFF9" }}
        >
          {ticket.dataResolucao ? (
            <InfoGrid
              items={[
                ["Como foi resolvido", ticket.solucao || "—"],
                ["Concluído em", fmtDateTime(ticket.dataResolucao)],
                ["Nota dada pelo cliente (0 a 10)", ticket.nps ?? "Não informada"],
                ["Cliente ficou satisfeito?", ticket.clienteSatisfeito === null ? "—" : ticket.clienteSatisfeito ? "Sim 😍" : "Não"],
              ]}
            />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <Field label="Como o caso foi resolvido?">
                  <TTextArea
                    value={solucao}
                    onChange={(e) => setSolucao(e.target.value)}
                    placeholder="Ex: Nova peça enviada pelos Correios / Estorno realizado via PIX..."
                    style={{ minHeight: 65 }}
                  />
                </Field>
                <Field label="Nota do Cliente de 0 a 10 (Opcional)">
                  <TInput
                    type="number"
                    min={0}
                    max={10}
                    value={npsInput}
                    onChange={(e) => setNpsInput(e.target.value)}
                    placeholder="Ex: 10"
                  />
                </Field>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="primary" icon={Check} onClick={finalize}>
                  Confirmar e Concluir Atendimento
                </Button>
                <Button variant="ghost" onClick={() => setShowResolucao(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        {/* Coluna Esquerda: Relato + Conversa/Anotações */}
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Card
            title="📋 Resumo do Pedido e Relato"
            right={
              canEdit && (
                <Button size="sm" variant="ghost" icon={Edit3} onClick={openEditModal} style={{ color: C.wine, fontWeight: 700 }}>
                  Editar Dados
                </Button>
              )
            }
          >
            <div style={{ background: C.wineSoft, border: `1px solid #FCA5A5`, padding: "12px 14px", borderRadius: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.wine, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                O que o cliente solicitou ({ticket.tipo} — {ticket.categoria})
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: C.ink, fontWeight: 500 }}>{ticket.descricao}</div>
            </div>

            <InfoGrid
              items={[
                ["Nº do Pedido", `#${ticket.pedido}`],
                ["Valor do Pedido", fmtCurrency(ticket.valorEnvolvido)],
                ["Setor", ticket.setor],
                ["Vendedor(a)", ticket.vendedor],
                ["WhatsApp / Telefone", ticket.telefone || "—"],
                ["Canal de Contato", ticket.canal || "—"],
                ["Aberto em", fmtDateTime(ticket.dataAbertura)],
                ["Prazo combinado", fmtDate(ticket.prazo)],
                ...(ticket.documento ? ([["CPF / CNPJ", ticket.documento]] as [string, React.ReactNode][]) : []),
                ...(ticket.notaFiscal ? ([["Nota Fiscal", ticket.notaFiscal]] as [string, React.ReactNode][]) : []),
              ]}
            />
          </Card>

          <Card title="💬 Anotações e Histórico de Atendimento" subtitle="Registre ligações, códigos de rastreio ou combinados com o cliente">
            {canEdit && (
              <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                <TTextArea
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Escreva uma nova anotação aqui (ex: Enviei código de postagem reversa para o cliente no WhatsApp)..."
                  style={{ minHeight: 70, marginBottom: 8 }}
                />
                <Button size="sm" variant="primary" icon={PlusCircle} onClick={addComment}>
                  Salvar Anotação
                </Button>
              </div>
            )}

            <div style={{ display: "grid", gap: 0 }}>
              {[...(ticket.timeline || [])].reverse().map((h: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: i === 0 ? C.wine : C.gold, marginTop: 4 }} />
                    {i < ticket.timeline.length - 1 && (
                      <div style={{ width: 1.5, flex: 1, background: C.border, marginTop: 2 }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{h.acao}</div>
                    <div style={{ fontSize: 11.5, color: C.inkSoft }}>
                      {fmtDateTime(h.data)} · <strong>{h.usuario}</strong>
                    </div>
                    {h.comentario && (
                      <div style={{ fontSize: 13, marginTop: 5, color: C.ink, background: C.bg, padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}` }}>
                        {h.comentario}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Coluna Direita: Frete, Estorno e Qualidade */}
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <ValoresFreteDefeitoCard
            ticket={ticket}
            config={config}
            canEdit={canEdit}
            onUpdate={onUpdate}
          />
        </div>
      </div>

      {/* Modal de Edição dos Dados do Atendimento */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Editar Dados do Atendimento (${ticket.protocolo})`}
        width={720}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
            <Field label="Nome do Cliente" required>
              <TInput
                value={editForm.cliente}
                onChange={(e) => setEditForm((f: any) => ({ ...f, cliente: e.target.value }))}
                placeholder="Nome do cliente"
              />
            </Field>
            <Field label="WhatsApp / Telefone">
              <TInput
                value={editForm.telefone}
                onChange={(e) => setEditForm((f: any) => ({ ...f, telefone: e.target.value }))}
                placeholder="(DDD) 99999-0000"
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Nº do Pedido" required>
              <TInput
                value={editForm.pedido}
                onChange={(e) => setEditForm((f: any) => ({ ...f, pedido: e.target.value }))}
                placeholder="Nº do pedido"
              />
            </Field>
            <Field label="Valor do Pedido (R$)">
              <TInput
                type="number"
                value={editForm.valorPedido}
                onChange={(e) => setEditForm((f: any) => ({ ...f, valorPedido: e.target.value }))}
                placeholder="0,00"
              />
            </Field>
            <Field label="Valor Envolvido (R$)">
              <TInput
                type="number"
                value={editForm.valorEnvolvido}
                onChange={(e) => setEditForm((f: any) => ({ ...f, valorEnvolvido: e.target.value }))}
                placeholder="Deixe igual se mesmo valor"
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Setor">
              <TSelect
                value={editForm.setor}
                onChange={(e) => setEditForm((f: any) => ({ ...f, setor: e.target.value }))}
              >
                {config.setores.map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </TSelect>
            </Field>
            <Field label="Vendedor(a)">
              <TSelect
                value={editForm.vendedor}
                onChange={(e) => setEditForm((f: any) => ({ ...f, vendedor: e.target.value }))}
              >
                {config.vendedores.map((v: string) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </TSelect>
            </Field>
            <Field label="Canal de Entrada">
              <TSelect
                value={editForm.canal}
                onChange={(e) => setEditForm((f: any) => ({ ...f, canal: e.target.value }))}
              >
                {config.canais.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </TSelect>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Tipo de Solicitação" required>
              <TSelect
                value={editForm.tipo}
                onChange={(e) => setEditForm((f: any) => ({ ...f, tipo: e.target.value }))}
              >
                {config.tipos.map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </TSelect>
            </Field>
            <Field label="Motivo / Categoria" required>
              <TSelect
                value={editForm.categoria}
                onChange={(e) => setEditForm((f: any) => ({ ...f, categoria: e.target.value }))}
              >
                {config.categorias.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </TSelect>
            </Field>
            <Field label="Prioridade">
              <TSelect
                value={editForm.prioridade}
                onChange={(e) => setEditForm((f: any) => ({ ...f, prioridade: e.target.value }))}
              >
                {config.prioridades.map((p: string) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </TSelect>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="CPF / CNPJ">
              <TInput
                value={editForm.documento}
                onChange={(e) => setEditForm((f: any) => ({ ...f, documento: e.target.value }))}
                placeholder="000.000.000-00"
              />
            </Field>
            <Field label="Nota Fiscal">
              <TInput
                value={editForm.notaFiscal}
                onChange={(e) => setEditForm((f: any) => ({ ...f, notaFiscal: e.target.value }))}
                placeholder="Nº NF"
              />
            </Field>
            <Field label="E-mail">
              <TInput
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f: any) => ({ ...f, email: e.target.value }))}
                placeholder="cliente@email.com"
              />
            </Field>
          </div>

          <Field label="Relato da Ocorrência" required>
            <TTextArea
              value={editForm.descricao}
              onChange={(e) => setEditForm((f: any) => ({ ...f, descricao: e.target.value }))}
              style={{ minHeight: 85 }}
            />
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function ClientesView({ tickets }: { tickets: any[] }) {
  const [busca, setBusca] = useState("");
  const clientes = useMemo(() => {
    const map: Record<string, any> = {};
    tickets.forEach((t) => {
      if (!map[t.cliente]) {
        map[t.cliente] = {
          nome: t.cliente,
          telefone: t.telefone,
          atendimentos: 0,
          valor: 0,
          ultimo: t.dataAbertura,
          npsTotal: [],
        };
      }
      map[t.cliente].atendimentos += 1;
      map[t.cliente].valor += t.valorEnvolvido || 0;
      if (new Date(t.dataAbertura) > new Date(map[t.cliente].ultimo)) map[t.cliente].ultimo = t.dataAbertura;
      if (t.nps !== null && t.nps !== undefined) map[t.cliente].npsTotal.push(t.nps);
    });
    return Object.values(map)
      .filter((c: any) => c.nome.toLowerCase().includes(busca.toLowerCase()))
      .sort((a: any, b: any) => b.atendimentos - a.atendimentos);
  }, [tickets, busca]);

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 360 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.inkSoft }} />
        <TInput
          placeholder="Buscar cliente por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ paddingLeft: 30 }}
        />
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {clientes.length === 0 ? (
          <EmptyState title="Nenhum cliente encontrado" body="Os clientes atendidos aparecerão automaticamente aqui." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="dt">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>WhatsApp</th>
                  <th>Atendimentos</th>
                  <th>Valor Total</th>
                  <th>Nota Média</th>
                  <th>Último Contato</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c: any) => {
                  const waUrl = buildWhatsAppLink(c.telefone, c.nome);
                  return (
                    <tr key={c.nome}>
                      <td style={{ fontWeight: 700 }}>{c.nome}</td>
                      <td>
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#15803D", fontWeight: 600, textDecoration: "none" }}
                          >
                            <img src={WHATSAPP_ICON_URL} alt="WA" style={{ width: 14, height: 14 }} />
                            {c.telefone}
                          </a>
                        ) : (
                          c.telefone || "—"
                        )}
                      </td>
                      <td><strong>{c.atendimentos}</strong></td>
                      <td>{fmtCurrency(c.valor)}</td>
                      <td>
                        {c.npsTotal.length
                          ? (c.npsTotal.reduce((a: number, b: number) => a + b, 0) / c.npsTotal.length).toFixed(1)
                          : "—"}
                      </td>
                      <td>{fmtDate(c.ultimo)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

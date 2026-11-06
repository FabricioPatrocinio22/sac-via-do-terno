import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronRight, AlertTriangle, Save, Check, PlusCircle, Clock, RefreshCcw, Search, Trash2
} from "lucide-react";
import {
  C, BRAND, FONT_DISPLAY, Card, KpiCard, Button, Field, TInput, TSelect, TTextArea,
  Badge, ProtocolTag, EmptyState, fmtCurrency, fmtDate, fmtDateTime,
  WHATSAPP_ICON_URL, buildWhatsAppLink
} from "../components/ui";
import { FRETE_PAGADORES } from "../defaults";
import { useTicketFilters, FilterBar, statusColor, daysBetween } from "./DashboardView";

function ErrorText({ children }: { children: React.ReactNode }) {
  return <div style={{ color: C.danger, fontSize: 11.5, marginTop: -2, fontWeight: 500 }}>{children}</div>;
}

export function TicketRow({ t, config, onOpen }: { t: any; config: any; onOpen: (id: string) => void }) {
  const tone = statusColor(config.status, t.status);
  const atrasado =
    !["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(t.status) &&
    new Date(t.prazo) < new Date();
  const waUrl = buildWhatsAppLink(t.telefone, t.cliente, t.protocolo);

  return (
    <tr onClick={() => onOpen(t.id)} style={{ cursor: "pointer" }}>
      <td><ProtocolTag protocolo={t.protocolo} /></td>
      <td>
        <div style={{ fontWeight: 700, color: C.ink }}>{t.cliente}</div>
        {t.telefone && <div style={{ fontSize: 11.5, color: C.inkSoft }}>{t.telefone}</div>}
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>{t.tipo}</div>
        <div style={{ fontSize: 11.5, color: C.inkSoft }}>{t.categoria}</div>
      </td>
      <td>{t.setor}</td>
      <td>{t.vendedor}</td>
      <td style={{ fontWeight: 600 }}>{fmtCurrency(t.valorEnvolvido)}</td>
      <td><Badge tone={tone}>{t.status}</Badge></td>
      <td>{atrasado ? <Badge tone="danger">Atrasado</Badge> : fmtDate(t.dataAbertura)}</td>
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
                width: 26,
                height: 26,
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
            style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}
          >
            <ChevronRight size={16} />
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
}: {
  tickets: any[];
  config: any;
  onOpen: (id: string) => void;
  onNew: () => void;
  perms?: any;
}) {
  const { filters, set, clear, filtered, anosDisponiveis } = useTicketFilters(tickets, config);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: C.inkSoft }}>
          Exibindo <strong style={{ color: C.ink }}>{filtered.length}</strong> de {tickets.length} protocolos registrados
        </div>
        <Button variant="primary" icon={PlusCircle} onClick={onNew}>
          + Novo Atendimento
        </Button>
      </div>
      <FilterBar filters={filters} set={set} clear={clear} config={config} showBusca anosDisponiveis={anosDisponiveis} />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <EmptyState title="Nenhum atendimento encontrado" body="Ajuste os filtros ou registre um novo protocolo." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="dt">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Cliente / Contato</th>
                  <th>Tipo / Motivo</th>
                  <th>Setor</th>
                  <th>Vendedor(a)</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Data / SLA</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 250).map((t) => (
                  <TicketRow key={t.id} t={t} config={config} onOpen={onOpen} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export function NovoAtendimentoView({
  config,
  nextProtocol,
  findDuplicate,
  onCreate,
}: {
  config: any;
  nextProtocol: string;
  findDuplicate: (pedido: string, excludeId?: string) => any;
  onCreate: (data: any) => void;
}) {
  const [form, setForm] = useState<any>({
    cliente: "",
    documento: "",
    telefone: "",
    email: "",
    canal: config.canais[0] || "",
    pedido: "",
    notaFiscal: "",
    valorPedido: "",
    loja: config.lojas[0] || "",
    setor: config.setores[0] || "",
    vendedor: config.vendedores[0] || "",
    tipo: config.tipos[0] || "",
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
    const req = ["cliente", "pedido", "setor", "tipo", "categoria", "descricao", "prioridade"];
    const errs: Record<string, string> = {};
    req.forEach((k) => {
      if (!form[k]) errs[k] = "Campo obrigatório";
    });
    if (Number(form.valorFrete) > 0 && !form.fretePagoPor) {
      errs.fretePagoPor = "Informe quem pagou o frete";
    }
    if (form.defeitoFabricacao && !form.defeitoTipo) {
      errs.defeitoTipo = "Selecione o tipo de defeito";
    }
    (config.camposPersonalizados || []).forEach((cf: any) => {
      if (cf.obrigatorio && !form.customFields?.[cf.nome]) {
        errs[`cf_${cf.id}`] = "Campo personalizado obrigatório";
      }
    });
    if (dupWarning && config.regraDuplicidade === "bloqueia") {
      errs.pedido = "Pedido duplicado — cadastro bloqueado pela configuração atual.";
    }
    if (dupWarning && config.regraDuplicidade === "justificativa" && !justificativa.trim()) {
      errs.justificativa = "Informe uma justificativa para prosseguir com o pedido duplicado.";
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
      valorFrete: Number(form.valorFrete) || 0,
      custoPacReverso: Number(form.custoPacReverso) || 0,
      custoEnvio: Number(form.custoEnvio) || 0,
      valorEstorno: 0,
      valorAbatimento: 0,
      outrosCustos: 0,
      prazo: prazo.toISOString(),
      responsavel: form.responsavel || form.vendedor,
      duplicidadeJustificada: !!(dupWarning && justificativa.trim()),
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: C.inkSoft }}>Protocolo automático a ser gerado:</span>
        <ProtocolTag protocolo={nextProtocol} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Identificação do Cliente e Pedido">
          <div style={{ display: "grid", gap: 12 }}>
            <Field label="Cliente" required>
              <TInput value={form.cliente} onChange={(e) => set("cliente", e.target.value)} placeholder="Nome completo ou razão social" />
              {errors.cliente && <ErrorText>{errors.cliente}</ErrorText>}
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="CPF / CNPJ">
                <TInput value={form.documento} onChange={(e) => set("documento", e.target.value)} placeholder="000.000.000-00" />
              </Field>
              <Field label="WhatsApp / Telefone">
                <TInput value={form.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="(47) 99999-0000" />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="E-mail">
                <TInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="cliente@email.com" />
              </Field>
              <Field label="Canal de atendimento">
                <TSelect value={form.canal} onChange={(e) => set("canal", e.target.value)}>
                  {config.canais.map((c: string) => <option key={c}>{c}</option>)}
                </TSelect>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Nº do Pedido" required>
                <TInput
                  value={form.pedido}
                  onChange={(e) => {
                    set("pedido", e.target.value);
                    checkDuplicate(e.target.value);
                  }}
                  placeholder="Número do pedido"
                />
                {errors.pedido && <ErrorText>{errors.pedido}</ErrorText>}
              </Field>
              <Field label="Nota Fiscal">
                <TInput value={form.notaFiscal} onChange={(e) => set("notaFiscal", e.target.value)} placeholder="Nº da NF" />
              </Field>
            </div>

            {dupWarning && (
              <div
                style={{
                  background: C.amberSoft,
                  border: `1px solid ${C.amber}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 12.5,
                  color: "#92400E",
                  display: "flex",
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <b>Possível atendimento duplicado.</b> O pedido {dupWarning.pedido} já consta no protocolo{" "}
                  <b>{dupWarning.protocolo}</b> ({dupWarning.cliente}).
                  {config.regraDuplicidade === "justificativa" && (
                    <div style={{ marginTop: 8 }}>
                      <TTextArea
                        placeholder="Justifique por que este novo atendimento é necessário"
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Valor do Pedido (R$)">
                <TInput type="number" value={form.valorPedido} onChange={(e) => set("valorPedido", e.target.value)} placeholder="0,00" />
              </Field>
              <Field label="Loja / Unidade">
                <TSelect value={form.loja} onChange={(e) => set("loja", e.target.value)}>
                  {config.lojas.map((l: string) => <option key={l}>{l}</option>)}
                </TSelect>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Setor Comercial" required>
                <TSelect value={form.setor} onChange={(e) => set("setor", e.target.value)}>
                  {config.setores.map((s: string) => <option key={s}>{s}</option>)}
                </TSelect>
              </Field>
              <Field label="Vendedor(a) Responsável">
                <TSelect value={form.vendedor} onChange={(e) => set("vendedor", e.target.value)}>
                  {config.vendedores.map((s: string) => <option key={s}>{s}</option>)}
                </TSelect>
              </Field>
            </div>
          </div>
        </Card>

        <div style={{ display: "grid", gap: 14 }}>
          <Card title="Classificação da Solicitação">
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Tipo de Atendimento" required>
                  <TSelect value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
                    {config.tipos.map((s: string) => <option key={s}>{s}</option>)}
                  </TSelect>
                </Field>
                <Field label="Categoria de Motivo" required>
                  <TSelect value={form.categoria} onChange={(e) => set("categoria", e.target.value)}>
                    {config.categorias.map((s: string) => <option key={s}>{s}</option>)}
                  </TSelect>
                </Field>
              </div>
              <Field label="Descrição Detalhada" required>
                <TTextArea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Descreva os detalhes informados pelo cliente..." />
                {errors.descricao && <ErrorText>{errors.descricao}</ErrorText>}
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Prioridade (SLA)" required>
                  <TSelect value={form.prioridade} onChange={(e) => set("prioridade", e.target.value)}>
                    {config.prioridades.map((s: string) => <option key={s}>{s}</option>)}
                  </TSelect>
                </Field>
                <Field label="Responsável no SAC">
                  <TInput value={form.responsavel} onChange={(e) => set("responsavel", e.target.value)} placeholder="Em branco = mesmo vendedor(a)" />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="Custos e Logística">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Valor Envolvido (R$)">
                <TInput type="number" value={form.valorEnvolvido} onChange={(e) => set("valorEnvolvido", e.target.value)} placeholder="Igual ao valor do pedido, se vazio" />
              </Field>
              <Field label="Valor de Frete (R$)">
                <TInput type="number" value={form.valorFrete} onChange={(e) => set("valorFrete", e.target.value)} />
              </Field>
              <Field label="Frete Pago Por">
                <TSelect value={form.fretePagoPor} onChange={(e) => set("fretePagoPor", e.target.value)}>
                  <option value="">Selecione</option>
                  {FRETE_PAGADORES.map((f) => <option key={f} value={f}>{f}</option>)}
                </TSelect>
                {errors.fretePagoPor && <ErrorText>{errors.fretePagoPor}</ErrorText>}
              </Field>
              <Field label="Custo PAC Reverso (R$)">
                <TInput type="number" value={form.custoPacReverso} onChange={(e) => set("custoPacReverso", e.target.value)} />
              </Field>
              <Field label="Custo de Reenvio (R$)">
                <TInput type="number" value={form.custoEnvio} onChange={(e) => set("custoEnvio", e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="Controle de Qualidade / Defeito de Fabricação">
            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.defeitoFabricacao}
                  onChange={(e) => set("defeitoFabricacao", e.target.checked)}
                />
                Este atendimento envolve defeito de fabricação / alfaiataria
              </label>
              {form.defeitoFabricacao && (
                <>
                  <Field label="Tipo de Defeito" required>
                    <TSelect value={form.defeitoTipo} onChange={(e) => set("defeitoTipo", e.target.value)}>
                      <option value="">Selecione</option>
                      {(config.defeitos || []).map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </TSelect>
                    {errors.defeitoTipo && <ErrorText>{errors.defeitoTipo}</ErrorText>}
                  </Field>
                  <Field label="Descrição Técnica do Defeito">
                    <TTextArea
                      value={form.defeitoDescricao}
                      onChange={(e) => set("defeitoDescricao", e.target.value)}
                      placeholder="Descreva a peça e o defeito encontrado"
                      style={{ minHeight: 60 }}
                    />
                  </Field>
                </>
              )}
            </div>
          </Card>

          {(config.camposPersonalizados || []).length > 0 && (
            <Card title="Campos Personalizados">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
            </Card>
          )}

          <Button variant="primary" icon={Save} onClick={submit} style={{ padding: "12px 18px", fontSize: 14 }}>
            Salvar e Gerar Protocolo {nextProtocol}
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

function FreteDefeitoCard({
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
      setErr("Informe quem pagou o frete.");
      return;
    }
    if (f.defeitoFabricacao && !f.defeitoTipo) {
      setErr("Selecione o tipo de defeito.");
      return;
    }
    setErr("");
    onUpdate(
      {
        fretePagoPor: f.fretePagoPor,
        valorFrete: Number(f.valorFrete) || 0,
        defeitoFabricacao: f.defeitoFabricacao,
        defeitoTipo: f.defeitoFabricacao ? f.defeitoTipo : "",
        defeitoDescricao: f.defeitoFabricacao ? f.defeitoDescricao : "",
      },
      "Frete e defeito atualizados"
    );
  };

  return (
    <Card title="Frete e Defeito de Fabricação">
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Valor do Frete (R$)">
            <TInput
              type="number"
              disabled={!canEdit}
              value={f.valorFrete}
              onChange={(e) => setF((x) => ({ ...x, valorFrete: e.target.value }))}
            />
          </Field>
          <Field label="Frete Pago Por">
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
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: canEdit ? "pointer" : "default", fontWeight: 600 }}>
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={f.defeitoFabricacao}
            onChange={(e) => setF((x) => ({ ...x, defeitoFabricacao: e.target.checked }))}
          />
          Envolve defeito de fabricação
        </label>
        {f.defeitoFabricacao && (
          <>
            <Field label="Tipo de Defeito">
              <TSelect
                disabled={!canEdit}
                value={f.defeitoTipo}
                onChange={(e) => setF((x) => ({ ...x, defeitoTipo: e.target.value }))}
              >
                <option value="">Selecione</option>
                {(config.defeitos || []).map((d: string) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </TSelect>
            </Field>
            <Field label="Descrição do Defeito">
              <TTextArea
                disabled={!canEdit}
                value={f.defeitoDescricao}
                onChange={(e) => setF((x) => ({ ...x, defeitoDescricao: e.target.value }))}
                style={{ minHeight: 60 }}
              />
            </Field>
          </>
        )}
        {err && <ErrorText>{err}</ErrorText>}
        {canEdit && (
          <Button size="sm" variant="secondary" icon={Save} onClick={save}>
            Salvar Frete e Defeito
          </Button>
        )}
      </div>
    </Card>
  );
}

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
  const [status, setStatus] = useState(ticket.status);
  const [obs, setObs] = useState("");
  const [showResolucao, setShowResolucao] = useState(false);
  const [solucao, setSolucao] = useState(ticket.solucao || "");
  const [npsInput, setNpsInput] = useState<any>(ticket.nps ?? "");

  useEffect(() => {
    setStatus(ticket.status);
    setSolucao(ticket.solucao || "");
    setNpsInput(ticket.nps ?? "");
  }, [ticket.id, ticket.status]);

  const tone = statusColor(config.status, ticket.status);
  const atrasado =
    !["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(ticket.status) &&
    new Date(ticket.prazo) < new Date();
  const waUrl = buildWhatsAppLink(ticket.telefone, ticket.cliente, ticket.protocolo);

  const applyStatus = () => {
    if (status === ticket.status) return;
    onUpdate({ status }, `Status alterado para ${status}`);
  };

  const addComment = () => {
    if (!obs.trim()) return;
    const now = new Date().toISOString();
    onUpdate(
      { timeline: [...ticket.timeline, { data: now, usuario: "Atendimento SAC", acao: "Observação registrada", comentario: obs }] },
      "Observação adicionada"
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
      "Atendimento finalizado"
    );
    setShowResolucao(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button
          onClick={onBack}
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
          <ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Voltar para listagem
        </button>

        <div style={{ display: "flex", gap: 8 }}>
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
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
              }}
            >
              <img src={WHATSAPP_ICON_URL} alt="WhatsApp" style={{ width: 15, height: 15 }} />
              Chamar no WhatsApp
            </a>
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

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <ProtocolTag protocolo={ticket.protocolo} />
        <Badge tone={tone}>{ticket.status}</Badge>
        {atrasado && <Badge tone="danger">SLA Atrasado</Badge>}
        <Badge tone={ticket.prioridade === "Urgente" ? "danger" : ticket.prioridade === "Alta" ? "warning" : "info"}>
          Prioridade: {ticket.prioridade}
        </Badge>
      </div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, margin: "4px 0 18px", color: C.ink }}>
        {ticket.cliente}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
        <div style={{ display: "grid", gap: 14 }}>
          <Card title="Dados do Atendimento">
            <InfoGrid
              items={[
                ["Tipo", ticket.tipo],
                ["Setor Comercial", ticket.setor],
                ["Categoria de Motivo", ticket.categoria],
                ["Canal de Entrada", ticket.canal],
                ["Nº do Pedido", ticket.pedido],
                ["Nota Fiscal", ticket.notaFiscal],
                ["Vendedor(a)", ticket.vendedor],
                ["Loja / Unidade", ticket.loja],
                ["Telefone / WhatsApp", ticket.telefone],
                ["CPF / CNPJ", ticket.documento],
                ["Data de Abertura", fmtDateTime(ticket.dataAbertura)],
                ["Prazo Limite (SLA)", fmtDate(ticket.prazo)],
                ["Responsável SAC", ticket.responsavel],
                ["E-mail", ticket.email],
              ]}
            />
            <div style={{ marginTop: 14, background: C.graySoft, padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: C.inkSoft, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                Descrição da Ocorrência
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.ink }}>{ticket.descricao}</div>
            </div>
          </Card>

          <Card title="Resumo Financeiro">
            <InfoGrid
              items={[
                ["Valor Envolvido", fmtCurrency(ticket.valorEnvolvido)],
                ["Valor de Frete", fmtCurrency(ticket.valorFrete)],
                ["Custo PAC Reverso", fmtCurrency(ticket.custoPacReverso)],
                ["Custo de Envio", fmtCurrency(ticket.custoEnvio)],
                ["Valor de Estorno", fmtCurrency(ticket.valorEstorno)],
                ["Valor de Abatimento", fmtCurrency(ticket.valorAbatimento)],
                ["Frete Pago Por", ticket.fretePagoPor || "Não informado"],
                ["Defeito de Fabricação", ticket.defeitoFabricacao ? ticket.defeitoTipo || "Sim" : "Não"],
              ]}
            />
          </Card>

          <FreteDefeitoCard
            ticket={ticket}
            config={config}
            canEdit={perms.editarTudo || perms.verTudo === false}
            onUpdate={onUpdate}
          />

          {(ticket.dataResolucao || showResolucao) && (
            <Card title="Resolução e Fechamento">
              {ticket.dataResolucao ? (
                <InfoGrid
                  items={[
                    ["Solução Aplicada", ticket.solucao || "—"],
                    ["Data de Resolução", fmtDateTime(ticket.dataResolucao)],
                    ["Responsável", ticket.responsavelResolucao],
                    ["Cliente Satisfeito", ticket.clienteSatisfeito === null ? "—" : ticket.clienteSatisfeito ? "Sim" : "Não"],
                    ["Nota NPS", ticket.nps ?? "—"],
                  ]}
                />
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  <Field label="Solução Aplicada">
                    <TTextArea value={solucao} onChange={(e) => setSolucao(e.target.value)} placeholder="Descreva como o caso foi solucionado..." />
                  </Field>
                  <Field label="Nota NPS do Cliente (0 a 10)">
                    <TInput type="number" min={0} max={10} value={npsInput} onChange={(e) => setNpsInput(e.target.value)} />
                  </Field>
                  <Button variant="primary" icon={Check} onClick={finalize}>
                    Confirmar Finalização do Protocolo
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          <Card title="Ações Rápidas">
            <div style={{ display: "grid", gap: 10 }}>
              <Field label="Alterar Status do Protocolo">
                <TSelect
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!perms.editarTudo && perms.verTudo === false}
                >
                  {config.status.map((s: any) => (
                    <option key={s.nome} value={s.nome}>{s.nome}</option>
                  ))}
                </TSelect>
              </Field>
              <Button size="sm" variant="secondary" icon={Save} onClick={applyStatus}>
                Atualizar Status
              </Button>
              {!ticket.dataResolucao && (
                <Button size="sm" variant="primary" icon={Check} onClick={() => setShowResolucao(true)}>
                  Registrar Resolução / Finalizar
                </Button>
              )}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 4 }}>
                <Field label="Adicionar Observação / Histórico de Contato">
                  <TTextArea
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    placeholder="Registrar ligação, mensagem WhatsApp, código de rastreio…"
                    style={{ minHeight: 65 }}
                  />
                </Field>
                <Button size="sm" variant="secondary" icon={PlusCircle} onClick={addComment} style={{ marginTop: 8, width: "100%" }}>
                  Adicionar ao Histórico
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Linha do Tempo do Atendimento">
            <div style={{ display: "grid", gap: 0 }}>
              {[...(ticket.timeline || [])].reverse().map((h: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 14, position: "relative" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: i === 0 ? C.wine : C.gold, marginTop: 4 }} />
                    {i < ticket.timeline.length - 1 && (
                      <div style={{ width: 1.5, flex: 1, background: C.border, marginTop: 2 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 2 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{h.acao}</div>
                    <div style={{ fontSize: 11.5, color: C.inkSoft }}>
                      {fmtDateTime(h.data)} · <strong>{h.usuario}</strong>
                    </div>
                    {h.comentario && (
                      <div style={{ fontSize: 12, marginTop: 4, color: C.ink, background: C.graySoft, padding: "5px 8px", borderRadius: 6 }}>
                        {h.comentario}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function PendenciasView({ tickets, config, onOpen }: { tickets: any[]; config: any; onOpen: (id: string) => void }) {
  const [ordenar, setOrdenar] = useState("atraso");
  const pendentes = useMemo(() => {
    const abertos = tickets.filter((t) => !["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(t.status));
    const withMeta = abertos.map((t) => ({
      ...t,
      diasAberto: daysBetween(t.dataAbertura, new Date()),
      atrasoDias:
        daysBetween(t.prazo, new Date()) > 0 && new Date(t.prazo) < new Date()
          ? daysBetween(t.prazo, new Date())
          : 0,
    }));
    const order: Record<string, number> = { Urgente: 0, Alta: 1, Média: 2, Baixa: 3 };
    if (ordenar === "atraso") return withMeta.sort((a, b) => b.atrasoDias - a.atrasoDias);
    if (ordenar === "prioridade") return withMeta.sort((a, b) => (order[a.prioridade] ?? 2) - (order[b.prioridade] ?? 2));
    if (ordenar === "antigos") return withMeta.sort((a, b) => b.diasAberto - a.diasAberto);
    return withMeta;
  }, [tickets, ordenar]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: C.inkSoft }}>
          Total de <strong style={{ color: C.wine }}>{pendentes.length}</strong> atendimentos aguardando conclusão
        </div>
        <TSelect value={ordenar} onChange={(e) => setOrdenar(e.target.value)} style={{ width: 210 }}>
          <option value="atraso">Ordenar: Mais atrasados (SLA)</option>
          <option value="prioridade">Ordenar: Maior prioridade</option>
          <option value="antigos">Ordenar: Mais antigos</option>
        </TSelect>
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {pendentes.length === 0 ? (
          <EmptyState icon={Clock} title="Nenhuma pendência" body="Todos os atendimentos estão finalizados." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="dt">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Cliente</th>
                  <th>Responsável</th>
                  <th>Setor</th>
                  <th>Status</th>
                  <th>Prazo SLA</th>
                  <th>Dias em Aberto</th>
                  <th>Prioridade</th>
                </tr>
              </thead>
              <tbody>
                {pendentes.map((t) => (
                  <tr key={t.id} onClick={() => onOpen(t.id)} style={{ cursor: "pointer" }}>
                    <td><ProtocolTag protocolo={t.protocolo} /></td>
                    <td style={{ fontWeight: 700 }}>{t.cliente}</td>
                    <td>{t.responsavel}</td>
                    <td>{t.setor}</td>
                    <td><Badge tone={statusColor(config.status, t.status)}>{t.status}</Badge></td>
                    <td>
                      {t.atrasoDias > 0 ? (
                        <Badge tone="danger">{t.atrasoDias}d atrasado</Badge>
                      ) : (
                        fmtDate(t.prazo)
                      )}
                    </td>
                    <td>{t.diasAberto} dias</td>
                    <td>
                      <Badge tone={t.prioridade === "Urgente" ? "danger" : t.prioridade === "Alta" ? "warning" : "info"}>
                        {t.prioridade}
                      </Badge>
                    </td>
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

export function ReclamacoesView({ tickets, config, onOpen }: { tickets: any[]; config: any; onOpen: (id: string) => void }) {
  const baseTickets = useMemo(
    () => tickets.filter((t) => t.tipo === "Reclamação" || t.categoria === "Cliente Insatisfeito"),
    [tickets]
  );
  const { filters, set, clear, filtered, anosDisponiveis } = useTicketFilters(baseTickets, config);
  const abertas = filtered.filter((t) => !["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(t.status)).length;
  const atrasadas = filtered.filter(
    (t) => !["Resolvido", "Finalizado"].includes(t.status) && new Date(t.prazo) < new Date()
  ).length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        <KpiCard label="Total Reclamações" value={filtered.length} accent={C.wine} icon="⚠️" />
        <KpiCard label="Em Aberto" value={abertas} accent={C.amber} icon="⏳" />
        <KpiCard label="Fora do Prazo" value={atrasadas} trend={atrasadas > 0 ? "down" : "flat"} accent={C.danger} icon="🚨" />
        <KpiCard label="Solucionadas" value={filtered.length - abertas} accent={C.success} icon="✅" />
      </div>
      <FilterBar filters={filters} set={set} clear={clear} config={config} showBusca anosDisponiveis={anosDisponiveis} />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Nenhuma reclamação" body="Nenhum registro corresponde aos filtros." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="dt">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Cliente</th>
                  <th>Motivo / Categoria</th>
                  <th>Setor</th>
                  <th>Responsável</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} onClick={() => onOpen(t.id)} style={{ cursor: "pointer" }}>
                    <td><ProtocolTag protocolo={t.protocolo} /></td>
                    <td style={{ fontWeight: 700 }}>{t.cliente}</td>
                    <td>{t.categoria}</td>
                    <td>{t.setor}</td>
                    <td>{t.responsavel}</td>
                    <td><Badge tone={statusColor(config.status, t.status)}>{t.status}</Badge></td>
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

export function TrocasView({ tickets, config, onOpen }: { tickets: any[]; config: any; onOpen: (id: string) => void }) {
  const baseTickets = useMemo(
    () => tickets.filter((t) => ["Troca", "Devolução", "Estorno"].includes(t.tipo)),
    [tickets]
  );
  const { filters, set, clear, filtered, anosDisponiveis } = useTicketFilters(baseTickets, config);
  return (
    <div>
      <FilterBar filters={filters} set={set} clear={clear} config={config} showBusca anosDisponiveis={anosDisponiveis} />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <EmptyState icon={RefreshCcw} title="Nenhum registro" body="Nenhuma troca, devolução ou estorno com esses filtros." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="dt">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Pedido</th>
                  <th>Valor</th>
                  <th>Frete</th>
                  <th>Frete Pago Por</th>
                  <th>PAC Reverso</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} onClick={() => onOpen(t.id)} style={{ cursor: "pointer" }}>
                    <td><ProtocolTag protocolo={t.protocolo} /></td>
                    <td style={{ fontWeight: 700 }}>{t.cliente}</td>
                    <td>{t.tipo}</td>
                    <td>#{t.pedido}</td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(t.valorEnvolvido)}</td>
                    <td>{fmtCurrency(t.valorFrete)}</td>
                    <td>{t.fretePagoPor || "—"}</td>
                    <td>{fmtCurrency(t.custoPacReverso)}</td>
                    <td><Badge tone={statusColor(config.status, t.status)}>{t.status}</Badge></td>
                    <td>{fmtDate(t.dataAbertura)}</td>
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
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 340 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.inkSoft }} />
        <TInput
          placeholder="Buscar cliente por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ paddingLeft: 30 }}
        />
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="dt">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Qtd. Atendimentos</th>
                <th>Valor Movimentado</th>
                <th>NPS Médio</th>
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
      </Card>
    </div>
  );
}

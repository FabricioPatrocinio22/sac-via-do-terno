import { pool } from "./db";
import { ensureSchema } from "./migrate";
import { defaultConfig } from "./defaults";

export async function seedDatabaseIfEmpty() {
  await ensureSchema();

  const cfgRes = await pool.query("SELECT config FROM sac_settings WHERE id = 1");
  const cfg = defaultConfig();
  if (cfgRes.rowCount === 0) {
    await pool.query("INSERT INTO sac_settings (id, config) VALUES (1, $1)", [JSON.stringify(cfg)]);
    await pool.query(
      `INSERT INTO sac_audit_logs (id, data, usuario, acao, detalhe)
       VALUES ($1, now(), 'Sistema', 'Sistema inicializado', 'Configuração inicial criada com segurança.')`,
      [`log_${Date.now()}`]
    );
  }
}

export async function insertTicketRow(t: any) {
  await pool.query(
    `INSERT INTO sac_tickets (
      id, protocolo, data_abertura, cliente, documento, telefone, cep, email, canal,
      pedido, nota_fiscal, valor_pedido, loja, setor, vendedor, tipo, motivo,
      categoria, descricao, prioridade, status, responsavel, setor_responsavel,
      prazo, valor_envolvido, valor_frete, frete_pago_por, defeito_fabricacao,
      defeito_tipo, defeito_descricao, custo_pac_reverso, custo_envio,
      valor_estorno, valor_abatimento, outros_custos, solucao, data_resolucao,
      responsavel_resolucao, observacao_final, cliente_satisfeito, nps,
      observacao_cliente, timeline, custom_fields, duplicidade_justificada
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
      $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45
    ) ON CONFLICT (id) DO UPDATE SET
      cliente = EXCLUDED.cliente,
      documento = EXCLUDED.documento,
      telefone = EXCLUDED.telefone,
      cep = EXCLUDED.cep,
      email = EXCLUDED.email,
      canal = EXCLUDED.canal,
      pedido = EXCLUDED.pedido,
      nota_fiscal = EXCLUDED.nota_fiscal,
      valor_pedido = EXCLUDED.valor_pedido,
      loja = EXCLUDED.loja,
      setor = EXCLUDED.setor,
      vendedor = EXCLUDED.vendedor,
      tipo = EXCLUDED.tipo,
      motivo = EXCLUDED.motivo,
      categoria = EXCLUDED.categoria,
      descricao = EXCLUDED.descricao,
      status = EXCLUDED.status,
      prioridade = EXCLUDED.prioridade,
      responsavel = EXCLUDED.responsavel,
      valor_envolvido = EXCLUDED.valor_envolvido,
      valor_frete = EXCLUDED.valor_frete,
      frete_pago_por = EXCLUDED.frete_pago_por,
      defeito_fabricacao = EXCLUDED.defeito_fabricacao,
      defeito_tipo = EXCLUDED.defeito_tipo,
      defeito_descricao = EXCLUDED.defeito_descricao,
      custo_pac_reverso = EXCLUDED.custo_pac_reverso,
      custo_envio = EXCLUDED.custo_envio,
      valor_estorno = EXCLUDED.valor_estorno,
      valor_abatimento = EXCLUDED.valor_abatimento,
      outros_custos = EXCLUDED.outros_custos,
      solucao = EXCLUDED.solucao,
      data_resolucao = EXCLUDED.data_resolucao,
      responsavel_resolucao = EXCLUDED.responsavel_resolucao,
      observacao_final = EXCLUDED.observacao_final,
      cliente_satisfeito = EXCLUDED.cliente_satisfeito,
      nps = EXCLUDED.nps,
      observacao_cliente = EXCLUDED.observacao_cliente,
      timeline = EXCLUDED.timeline,
      custom_fields = EXCLUDED.custom_fields,
      updated_at = now()`,
    [
      t.id, t.protocolo, t.dataAbertura, t.cliente, t.documento || "", t.telefone || "",
      t.cep || "", t.email || "", t.canal || "", t.pedido || "", t.notaFiscal || "",
      Number(t.valorPedido) || 0, t.loja || "", t.setor || "", t.vendedor || "",
      t.tipo || "", t.motivo || t.categoria || "", t.categoria || "", t.descricao || "",
      t.prioridade || "Média", t.status || "Novo", t.responsavel || "",
      t.setorResponsavel || "SAC", t.prazo, Number(t.valorEnvolvido) || 0,
      Number(t.valorFrete) || 0, t.fretePagoPor || "", Boolean(t.defeitoFabricacao),
      t.defeitoTipo || "", t.defeitoDescricao || "", Number(t.custoPacReverso) || 0,
      Number(t.custoEnvio) || 0, Number(t.valorEstorno) || 0, Number(t.valorAbatimento) || 0,
      Number(t.outrosCustos) || 0, t.solucao || "", t.dataResolucao || null,
      t.responsavelResolucao || "", t.observacaoFinal || "",
      t.clienteSatisfeito === undefined ? null : t.clienteSatisfeito,
      t.nps === undefined || t.nps === "" ? null : Number(t.nps),
      t.observacaoCliente || "", JSON.stringify(t.timeline || []),
      JSON.stringify(t.customFields || {}), Boolean(t.duplicidadeJustificada)
    ]
  );
}

if (require.main === module) {
  seedDatabaseIfEmpty()
    .then(() => {
      console.log("Schema e configurações iniciais verificados com sucesso!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Erro ao verificar banco SAC:", err);
      process.exit(1);
    });
}

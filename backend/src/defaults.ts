export const DEFAULT_SETORES = ["Atacado", "Varejo Site", "Varejo Online", "Atacarejo", "Loja Física"];
export const DEFAULT_LOJAS = ["Matriz", "E-commerce", "Loja Shopping Centro"];
export const DEFAULT_CANAIS = ["WhatsApp", "Telefone", "E-mail", "Instagram", "Loja física", "Site"];
export const DEFAULT_TIPOS = [
  "Troca", "Devolução", "Estorno", "Abateu em boleto", "Erro do consultor",
  "Cancelamento", "Sob medida", "Reclamação", "Dúvida", "Elogio", "Solicitação"
];
export const DEFAULT_CATEGORIAS = [
  "Troca Por Opção Do Cliente", "Cliente Insatisfeito", "Abateu em boleto",
  "Problema De Tamanho", "Defeito De Fabricação", "Devolução Por Opção Do Cliente",
  "Estorno de valor", "Erro De Envio", "Troca Comercial", "Erro Do Consultor",
  "Erro Do Cliente", "Defeito De Cava", "Erro da Transportadora", "Outro"
];
export const DEFAULT_STATUS = [
  { nome: "Novo", cor: "info" },
  { nome: "Em análise", cor: "info" },
  { nome: "Aguardando cliente", cor: "warning" },
  { nome: "Aguardando setor", cor: "warning" },
  { nome: "Em negociação", cor: "warning" },
  { nome: "Aprovado", cor: "success" },
  { nome: "Recusado", cor: "danger" },
  { nome: "Resolvido", cor: "success" },
  { nome: "Finalizado", cor: "success" },
  { nome: "Cancelado", cor: "danger" },
];
export const DEFAULT_PRIORIDADES = ["Baixa", "Média", "Alta", "Urgente"];
export const DEFAULT_VENDEDORES = [
  "Isadora", "Luara", "Giovana S", "Rafael F", "Lucas G", "Leticia",
  "Amanda S", "Igor", "Sarah", "Fabio V", "Janaina", "Lucas S", "Viviane", "Maria Geovana"
];
export const DEFAULT_DEFEITOS = [
  "Defeito de cava", "Costura", "Tecido", "Aviamentos (botão/zíper)", "Forro", "Acabamento", "Outro"
];
export const FRETE_PAGADORES = ["Cliente", "Via do Terno"];

export const DEFAULT_USUARIOS = [
  { id: "u1", nome: "Beatriz Nogueira", email: "beatriz@viadoterno.com.br", perfil: "Administrador", setor: "Diretoria", status: "Ativo" },
  { id: "u2", nome: "Marcelo Andrade", email: "marcelo@viadoterno.com.br", perfil: "Gestor", setor: "SAC", status: "Ativo" },
  { id: "u3", nome: "Isadora Melo", email: "isadora@viadoterno.com.br", perfil: "Atendente SAC", setor: "SAC", status: "Ativo" },
  { id: "u4", nome: "Rafael Ferraz", email: "rafael@viadoterno.com.br", perfil: "Atendente SAC", setor: "SAC", status: "Ativo" },
  { id: "u5", nome: "Convidado Diretoria", email: "visualizacao@viadoterno.com.br", perfil: "Visualização", setor: "Diretoria", status: "Ativo" },
];

export function defaultConfig() {
  return {
    setores: DEFAULT_SETORES,
    lojas: DEFAULT_LOJAS,
    canais: DEFAULT_CANAIS,
    tipos: DEFAULT_TIPOS,
    categorias: DEFAULT_CATEGORIAS,
    status: DEFAULT_STATUS,
    prioridades: DEFAULT_PRIORIDADES,
    vendedores: DEFAULT_VENDEDORES,
    defeitos: DEFAULT_DEFEITOS,
    usuarios: DEFAULT_USUARIOS,
    camposPersonalizados: [],
    regraDuplicidade: "alerta",
    slaConfig: { Baixa: 10, Média: 7, Alta: 4, Urgente: 2 },
  };
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const DEMO_NOMES = [
  "Carla Bittencourt", "João Vitor Ramalho", "Fernanda Piccoli", "Douglas Menezes",
  "Renata Aguiar", "Thiago Bandeira", "Priscila Nogueira", "Marcos Villela",
  "Aline Torquato", "Eduardo Salviano", "Camila Restier", "Gustavo Peixoto",
  "Vanessa Rocha Lima", "Bruno Castilho", "Larissa Andrino", "Felipe Bezerra Costa",
  "Confecções Bento Ltda", "Alfaiataria Sul Comércio", "Grupo Vestir Bem Atacado",
  "Moda Masculina Central", "Distribuidora Elegância Ltda",
];

export function seedDemoTickets(cfg: any) {
  const rnd = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const tickets: any[] = [];
  let seq = 1;
  const now = new Date();
  const year = now.getFullYear();

  for (let i = 0; i < 46; i++) {
    const daysAgo = rndInt(0, 45);
    const abertura = new Date(now);
    abertura.setDate(abertura.getDate() - daysAgo);

    const tipo = rnd(cfg.tipos);
    const setor = rnd(cfg.setores);
    const categoria = rnd(cfg.categorias);
    const vendedor = rnd(cfg.vendedores);
    const prioridade = rnd(cfg.prioridades);
    const statusObj: any = rnd(cfg.status);
    const status = statusObj.nome;
    const isFinal = ["Resolvido", "Finalizado", "Cancelado", "Recusado"].includes(status);
    const valor = rndInt(20, 45) * 50;
    const isDefeito = categoria === "Defeito De Fabricação" || categoria === "Defeito De Cava";
    const pedido = rndInt(15000, 26000);
    const prazoDias = prioridade === "Urgente" ? 2 : prioridade === "Alta" ? 4 : 7;
    const prazo = new Date(abertura);
    prazo.setDate(prazo.getDate() + prazoDias);

    const timeline = [
      { data: abertura.toISOString(), usuario: vendedor, acao: "Atendimento criado", comentario: `Canal: ${rnd(cfg.canais)}` },
    ];
    if (Math.random() > 0.3) {
      const dt2 = new Date(abertura);
      dt2.setHours(dt2.getHours() + rndInt(1, 6));
      timeline.push({ data: dt2.toISOString(), usuario: "Isadora Melo", acao: "Responsável atribuído", comentario: "" });
    }
    if (isFinal) {
      const dtF = new Date(abertura);
      dtF.setDate(dtF.getDate() + rndInt(1, prazoDias + 3));
      timeline.push({ data: dtF.toISOString(), usuario: "Isadora Melo", acao: `Status alterado para ${status}`, comentario: "" });
    }

    const nps = isFinal && Math.random() > 0.35 ? rndInt(0, 10) : null;

    tickets.push({
      id: uid("t"),
      protocolo: `SAC-${year}-${String(seq).padStart(6, "0")}`,
      dataAbertura: abertura.toISOString(),
      cliente: rnd(DEMO_NOMES),
      documento: "000.000.000-00",
      telefone: "(47) 99999-0000",
      email: "cliente@exemplo.com",
      canal: rnd(cfg.canais),
      pedido: String(pedido),
      notaFiscal: String(rndInt(11000, 39000)),
      valorPedido: valor,
      loja: rnd(cfg.lojas),
      setor,
      vendedor,
      tipo,
      motivo: categoria,
      categoria,
      descricao: "Atendimento de demonstração gerado automaticamente para validação operacional do SAC Via do Terno.",
      prioridade,
      status,
      responsavel: rnd(["Isadora Melo", "Rafael Ferraz", "Marcelo Andrade"]),
      setorResponsavel: "SAC",
      prazo: prazo.toISOString(),
      valorEnvolvido: valor,
      valorFrete: rndInt(0, 60),
      fretePagoPor: rnd(FRETE_PAGADORES),
      defeitoFabricacao: isDefeito,
      defeitoTipo: isDefeito ? rnd(cfg.defeitos) : "",
      defeitoDescricao: isDefeito ? "Defeito identificado na conferência de pós-venda." : "",
      custoPacReverso: tipo === "Troca" || tipo === "Devolução" ? rndInt(15, 45) : 0,
      custoEnvio: rndInt(0, 40),
      valorEstorno: tipo === "Estorno" ? valor : 0,
      valorAbatimento: tipo === "Abateu em boleto" ? Math.round(valor * 0.3) : 0,
      outrosCustos: 0,
      solucao: isFinal ? "Solução aplicada conforme política de troca/devolução da Via do Terno." : "",
      dataResolucao: isFinal ? timeline[timeline.length - 1].data : null,
      responsavelResolucao: isFinal ? "Isadora Melo" : "",
      observacaoFinal: "",
      clienteSatisfeito: isFinal ? (nps !== null ? nps >= 7 : null) : null,
      nps,
      observacaoCliente: "",
      timeline,
      customFields: {},
      duplicidadeJustificada: false,
    });
    seq++;
  }
  return tickets;
}

export function seedDemoSurveys(tickets: any[]) {
  const rnd = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const canais = ["WhatsApp", "E-mail", "SMS"];
  const surveys: any[] = [];
  const finalizados = tickets.filter((t) => t.dataResolucao);
  finalizados.slice(0, 18).forEach((t) => {
    const respondida = Math.random() > 0.35;
    const dataEnvio = new Date(t.dataResolucao);
    dataEnvio.setDate(dataEnvio.getDate() + 1);
    surveys.push({
      id: uid("nps"),
      cliente: t.cliente,
      protocolo: t.protocolo,
      canal: rnd(canais),
      dataEnvio: dataEnvio.toISOString(),
      status: respondida ? "Respondida" : "Enviada",
      nota: respondida ? rndInt(0, 10) : null,
      comentario: respondida && Math.random() > 0.5 ? "Atendimento ágil e peça de reposição impecável." : "",
      dataResposta: respondida ? new Date(dataEnvio.getTime() + 86400000 * rndInt(0, 3)).toISOString() : null,
    });
  });
  return surveys;
}

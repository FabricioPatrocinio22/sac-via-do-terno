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
  {
    id: "u_admin",
    nome: "Administrador",
    login: "admin",
    email: "admin@viadoterno.com.br",
    senha: "via@123",
    perfil: "Administrador",
    setor: "Diretoria",
    status: "Ativo",
  },
];

export const PERMS: Record<string, { verTudo: boolean; editarTudo: boolean; excluir: boolean; administrar: boolean; exportar: boolean }> = {
  "Administrador": { verTudo: true, editarTudo: true, excluir: true, administrar: true, exportar: true },
  "Gestor": { verTudo: true, editarTudo: true, excluir: false, administrar: false, exportar: true },
  "Atendente SAC": { verTudo: true, editarTudo: true, excluir: false, administrar: false, exportar: false },
  "Visualização": { verTudo: true, editarTudo: true, excluir: false, administrar: false, exportar: false },
};

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

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
    camposPersonalizados: [] as any[],
    regraDuplicidade: "alerta",
    slaConfig: { Baixa: 10, Média: 7, Alta: 4, Urgente: 2 } as Record<string, number>,
  };
}

export function seedDemoTickets(_cfg: any) {
  return [] as any[];
}

export function seedDemoSurveys(_tickets: any[]) {
  return [] as any[];
}

import fs from "fs";
import path from "path";
import { pool } from "./db";

const INLINE_SCHEMA = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  username VARCHAR(60) UNIQUE,
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(30),
  phone_digits VARCHAR(20),
  cpf VARCHAR(30),
  cpf_digits VARCHAR(20),
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sac_settings (
  id INT PRIMARY KEY DEFAULT 1,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sac_tickets (
  id VARCHAR(60) PRIMARY KEY,
  protocolo VARCHAR(40) NOT NULL UNIQUE,
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT now(),
  cliente VARCHAR(180) NOT NULL,
  documento VARCHAR(40),
  telefone VARCHAR(40),
  cep VARCHAR(20),
  email VARCHAR(150),
  canal VARCHAR(60),
  pedido VARCHAR(60),
  nota_fiscal VARCHAR(60),
  valor_pedido NUMERIC(12,2) DEFAULT 0,
  loja VARCHAR(80),
  setor VARCHAR(80),
  vendedor VARCHAR(100),
  tipo VARCHAR(80),
  motivo VARCHAR(120),
  categoria VARCHAR(120),
  descricao TEXT,
  prioridade VARCHAR(30) DEFAULT 'Média',
  status VARCHAR(60) DEFAULT 'Novo',
  responsavel VARCHAR(120),
  setor_responsavel VARCHAR(80) DEFAULT 'SAC',
  prazo TIMESTAMPTZ,
  valor_envolvido NUMERIC(12,2) DEFAULT 0,
  valor_frete NUMERIC(12,2) DEFAULT 0,
  frete_pago_por VARCHAR(40),
  defeito_fabricacao BOOLEAN DEFAULT false,
  defeito_tipo VARCHAR(100),
  defeito_descricao TEXT,
  custo_pac_reverso NUMERIC(12,2) DEFAULT 0,
  custo_envio NUMERIC(12,2) DEFAULT 0,
  valor_estorno NUMERIC(12,2) DEFAULT 0,
  valor_abatimento NUMERIC(12,2) DEFAULT 0,
  outros_custos NUMERIC(12,2) DEFAULT 0,
  solucao TEXT,
  data_resolucao TIMESTAMPTZ,
  responsavel_resolucao VARCHAR(120),
  observacao_final TEXT,
  cliente_satisfeito BOOLEAN,
  nps INT,
  observacao_cliente TEXT,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  duplicidade_justificada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sac_nps_surveys (
  id VARCHAR(60) PRIMARY KEY,
  cliente VARCHAR(180) NOT NULL,
  protocolo VARCHAR(40),
  canal VARCHAR(40),
  data_envio TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(40) NOT NULL DEFAULT 'Enviada',
  nota INT,
  comentario TEXT,
  data_resposta TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sac_audit_logs (
  id VARCHAR(60) PRIMARY KEY,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario VARCHAR(150) NOT NULL,
  acao VARCHAR(180) NOT NULL,
  detalhe TEXT
);

-- Políticas de Segurança (RLS) no PostgreSQL / Supabase:
-- Bloqueia acesso público externo via PostgREST/Anon Key; apenas o Backend autenticado (postgres role) acessa.
ALTER TABLE sac_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sac_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sac_nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE sac_audit_logs ENABLE ROW LEVEL SECURITY;
`;

export async function ensureSchema() {
  const schemaPath = path.resolve(__dirname, "../../database/schema.sql");
  const sql = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, "utf-8") : INLINE_SCHEMA;
  await pool.query(sql);
  // Garante coluna cep e RLS ativo em todas as tabelas do SAC no Supabase
  await pool.query(`
    ALTER TABLE sac_tickets ADD COLUMN IF NOT EXISTS cep VARCHAR(20);
    ALTER TABLE sac_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE sac_tickets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE sac_nps_surveys ENABLE ROW LEVEL SECURITY;
    ALTER TABLE sac_audit_logs ENABLE ROW LEVEL SECURITY;
  `).catch(() => {});
}

if (require.main === module) {
  ensureSchema()
    .then(() => {
      console.log("Schema SAC e políticas RLS aplicados com sucesso!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Erro ao aplicar schema SAC:", err);
      process.exit(1);
    });
}

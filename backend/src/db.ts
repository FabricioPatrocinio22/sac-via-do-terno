import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";
dotenv.config();

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres.myktswvnovwdfngegohh:Fabricio%4015975@aws-0-us-east-2.pooler.supabase.com:6543/postgres";

const poolConfig: PoolConfig = {
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
};

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Erro no pool PostgreSQL (SAC):", err);
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

import { Pool, QueryResultRow } from "pg";

const databaseUrl = process.env.DATABASE_URL;

export interface UserRow {
  id: number;
  email: string;
  name: string | null;
  password_hash: string;
  created_at: string;
}

export const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  : null;

export async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []) {
  if (!pool) throw new Error("DATABASE_URL is not configured");
  return pool.query<T>(sql, params);
}

export async function ensureUsersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

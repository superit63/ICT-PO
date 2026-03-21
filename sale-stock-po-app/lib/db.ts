/**
 * Turso (libSQL) client singleton.
 * Reads TURSO_DATABASE_URL + TURSO_AUTH_TOKEN from process.env.
 * Falls back to local SQLite file (development) when env vars are absent.
 */
import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

export function getDbClient(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url && authToken) {
    _client = createClient({ url, authToken });
  } else if (url) {
    _client = createClient({ url });
  } else {
    _client = createClient({ url: "file:local.db" });
  }

  return _client;
}

/** Execute a parameterized SQL statement (no return rows). */
export async function executeSql(sql: string, args?: unknown[]) {
  const db = getDbClient();
  return db.execute({ sql, args: args as (string | number | null)[] | undefined });
}

/** Execute a parameterized SQL statement and return rows. */
export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  args?: unknown[]
): Promise<T[]> {
  const db = getDbClient();
  const result = await db.execute({ sql, args: args as (string | number | null)[] | undefined });
  return result.rows as T[];
}

/** Execute and return the first row or null. */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  args?: unknown[]
): Promise<T | null> {
  const rows = await queryAll<T>(sql, args);
  return rows[0] ?? null;
}

/** Run migrations from a SQL string (splits on semicolons). */
export async function runMigrations(sql: string) {
  const db = getDbClient();
  const statements = sql.split(";").map((s: string) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await db.execute({ sql: stmt });
  }
}

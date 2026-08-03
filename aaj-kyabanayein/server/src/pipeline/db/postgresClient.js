/**
 * PostgreSQL client for production recipe pipeline.
 * Set DATABASE_URL=postgresql://user:pass@host:5432/rasoira
 */
let pool = null;

export async function getPostgresPool() {
  if (pool) return pool;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — required for PostgreSQL pipeline import");
  }

  const { default: pg } = await import("pg");
  pool = new pg.Pool({
    connectionString: url,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });

  return pool;
}

export async function closePostgresPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function runPostgresQuery(text, params = []) {
  const p = await getPostgresPool();
  return p.query(text, params);
}

export async function initPostgresSchema() {
  const fs = await import("fs");
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const p = await getPostgresPool();
  for (const file of ["postgresSchema.sql", "postgresSchemaPhase2.sql"]) {
    const sql = fs.readFileSync(path.join(__dirname, file), "utf-8");
    await p.query(sql);
  }
}

export function isPostgresConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

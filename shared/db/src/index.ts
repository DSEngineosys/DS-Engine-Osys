import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Database connection will likely fail.");
}

const isPostgres = databaseUrl?.startsWith("postgresql://") || databaseUrl?.startsWith("postgres://");

export let pool: pg.Pool | null = null;
export let db: any = null;

if (isPostgres && databaseUrl) {
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle(pool, { schema });
} else if (databaseUrl) {
  console.log("Using non-PostgreSQL database (likely MongoDB)");
}

export * from "./schema";

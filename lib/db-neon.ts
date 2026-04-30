import "server-only";

// Phase 3 cutover client. Coexists with lib/db.ts (Prisma) until U12.
// Migrated callsites import { sql } from "@/lib/db-neon"; everything
// else continues to use db (PrismaClient) until its batch lands.
//
// `neon()` returns a tagged-template function that runs a single SQL
// statement over Neon's HTTP transport. It is fetch-based (Edge-safe)
// and reuses connections across invocations automatically (the legacy
// `fetchConnectionCache` flag is now always-on in @neondatabase/serverless ≥1).
//
// For multi-statement transactions (seed, multi-row upsert), use
// `getPool().connect()` instead — Neon HTTP transport is single-statement only.

import { neon, Pool } from "@neondatabase/serverless";

import { env } from "@/lib/env";

export const sql = neon(env.DATABASE_URL);

// Singleton pool for transactions. Lazily initialized so smoke tests
// that only exercise `sql` don't open a TCP socket they never close.
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: env.DATABASE_URL });
  }
  return pool;
}

export type SqlClient = typeof sql;

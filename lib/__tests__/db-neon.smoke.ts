import assert from "node:assert/strict";

import { sql } from "@/lib/db-neon";

// Smoke test: prove the neon-serverless client can reach the same
// Neon database the Prisma client is already using. Runs SELECT 1 and
// SELECT NOW(), then a parameterized query to confirm bind-parameter
// interpolation matches the contract migrated callsites will rely on.
//
// Run: NODE_OPTIONS=--conditions=react-server pnpm tsx lib/__tests__/db-neon.smoke.ts
// (the react-server condition is required because db-neon imports the
// `server-only` package — same convention as scripts/backfill-x.ts.)
//
// Requires: DATABASE_URL set (loaded by lib/env.ts via dotenv).

async function main() {
  const probe = (await sql`SELECT 1 AS one`) as Array<{ one: number }>;
  assert.equal(probe.length, 1);
  assert.equal(probe[0].one, 1);

  const time = (await sql`SELECT NOW() AS now`) as Array<{ now: Date }>;
  assert.equal(time.length, 1);
  assert.ok(time[0].now instanceof Date, "NOW() must round-trip as Date");

  const id = "smoke-test";
  const echo = (await sql`SELECT ${id}::text AS id, ${42}::int AS n`) as Array<{
    id: string;
    n: number;
  }>;
  assert.equal(echo[0].id, id);
  assert.equal(echo[0].n, 42);

  // Confirm the public schema has the tables we expect — guards against
  // accidentally pointing at the wrong database.
  const tables = (await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `) as Array<{ table_name: string }>;
  const names = new Set(tables.map((t) => t.table_name));
  for (const required of ["Employee", "Surface", "AcquisitionJob", "Post", "Metric"]) {
    assert.ok(names.has(required), `expected public.${required} table to exist`);
  }

  console.log(`✓ db-neon reaches Neon, ${tables.length} public tables present`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

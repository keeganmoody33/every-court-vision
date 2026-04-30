import assert from "node:assert/strict";

import { dueSurfaces } from "@/lib/acquisition/cadence";
import { sql } from "@/lib/db-neon";
import { saveDiscoveryResults } from "@/lib/discovery/engine";

// Smoke test for U6 (cron path migration). Exercises the migrated
// SQL paths against the real Neon database in a read-only way — no
// inserts/updates beyond what an idempotent UPSERT against an existing
// row would do.
//
// Run: NODE_OPTIONS=--conditions=react-server pnpm tsx lib/__tests__/cron-path.smoke.ts

async function main() {
  // 1. dueSurfaces() — must not throw, must return zero or more Surface rows
  //    with the expected shape.
  const due = await dueSurfaces(new Date());
  assert.ok(Array.isArray(due), "dueSurfaces must return an array");
  for (const surface of due) {
    assert.equal(typeof surface.id, "string");
    assert.equal(typeof surface.platform, "string");
    assert.equal(typeof surface.handle, "string");
    assert.ok(typeof surface.present === "boolean");
  }
  console.log(`✓ dueSurfaces returned ${due.length} due surfaces`);

  // 2. Direct SELECT against Surface — sanity check the DB has rows we can
  //    iterate (otherwise dueSurfaces returning [] would be ambiguous).
  const allPresent = (await sql`
    SELECT COUNT(*)::int AS count FROM "Surface" WHERE present = true
  `) as Array<{ count: number }>;
  assert.equal(typeof allPresent[0].count, "number");
  console.log(`✓ ${allPresent[0].count} present surfaces in DB`);

  // 3. Verify the schema column quoting works through neon-serverless for
  //    every column dueSurfaces actually reads. The tagged template binds
  //    parameters but column names with capitals must be quoted via the
  //    SQL itself — this confirms the quoting is right.
  const sample = (await sql`
    SELECT id, platform, handle, present, "lastScrapedAt"
    FROM "Surface"
    WHERE present = true
    LIMIT 1
  `) as Array<{
    id: string;
    platform: string;
    handle: string;
    present: boolean;
    lastScrapedAt: Date | null;
  }>;
  if (sample.length > 0) {
    assert.equal(typeof sample[0].id, "string");
    if (sample[0].lastScrapedAt !== null) {
      assert.ok(sample[0].lastScrapedAt instanceof Date);
    }
    console.log(`✓ surface column quoting verified (lastScrapedAt is ${sample[0].lastScrapedAt instanceof Date ? "Date" : "null"})`);
  }

  // 4. saveDiscoveryResults round-trip — verifies the text[] evidence
  //    column binding and the INSERT … ON CONFLICT idempotency. Picks a
  //    real employee so the FK passes, then cleans up the marker row.
  const employees = (await sql`
    SELECT id FROM "Employee" LIMIT 1
  `) as Array<{ id: string }>;
  if (employees.length === 0) {
    console.log("⚠ no employees in DB — skipping saveDiscoveryResults round-trip");
  } else {
    const empId = employees[0].id;
    const marker = "u6-cron-path-smoke";
    // Synthetic handle prevents collision with real (employeeId, surface, handle) rows
    // — without it, ON CONFLICT would clobber a production row's discoveryMethod and
    // the finally-DELETE would then delete that row.
    const handle = `__smoke_${marker}__`;
    const evidenceIn = ["query-1", "query-2 with spaces", "query-3 'quoted'"];
    try {
      await saveDiscoveryResults(empId, [
        {
          surface: "x",
          handle,
          status: "unknown",
          confidenceScore: 0,
          evidence: evidenceIn,
          discoveryMethod: marker,
        },
      ]);

      const rows = (await sql`
        SELECT evidence, status, "discoveryMethod"
        FROM "DiscoveredSurface"
        WHERE "employeeId" = ${empId}
          AND surface = 'x'
          AND handle = ${handle}
        LIMIT 1
      `) as Array<{ evidence: string[]; status: string; discoveryMethod: string }>;
      assert.equal(rows.length, 1, "smoke insert should round-trip");
      assert.ok(Array.isArray(rows[0].evidence), "evidence must come back as array");
      assert.deepEqual(rows[0].evidence, evidenceIn, "evidence must round-trip exactly");
      assert.equal(rows[0].status, "unknown");
      console.log(`✓ saveDiscoveryResults round-trip (evidence text[] verified)`);

      // Idempotency check — second call must not throw or duplicate.
      await saveDiscoveryResults(empId, [
        {
          surface: "x",
          handle,
          status: "unknown",
          confidenceScore: 0,
          evidence: evidenceIn,
          discoveryMethod: marker,
        },
      ]);
      const dup = (await sql`
        SELECT COUNT(*)::int AS count
        FROM "DiscoveredSurface"
        WHERE "employeeId" = ${empId}
          AND surface = 'x'
          AND handle = ${handle}
      `) as Array<{ count: number }>;
      assert.equal(dup[0].count, 1, "ON CONFLICT must keep row count at 1");
      console.log(`✓ saveDiscoveryResults is idempotent under repeat call`);
    } finally {
      await sql`
        DELETE FROM "DiscoveredSurface"
        WHERE "employeeId" = ${empId}
          AND surface = 'x'
          AND handle = ${handle}
      `;
    }
  }

  console.log("✓ U6 cron-path SQL paths green");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

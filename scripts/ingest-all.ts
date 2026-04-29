// scripts/ingest-all.ts
// Run from project root: npx tsx scripts/ingest-all.ts

import { runFullIngestion } from "@/lib/ingestion/pipeline";

async function main() {
  console.log("Every Signal Capture — Full Ingestion Run\n");
  console.log("=".repeat(50));

  const startTime = Date.now();
  const results = await runFullIngestion();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Complete in ${duration}s\n`);

  let totalCollected = 0;
  let totalErrors = 0;

  for (const [name, result] of Object.entries(results)) {
    totalCollected += result.collected;
    totalErrors += result.errors.length;
    console.log(
      `${name.padEnd(20)} ${String(result.collected).padStart(4)} collected ${result.errors.length > 0 ? `| ${result.errors.length} errors` : ""}`,
    );
    for (const err of result.errors) {
      console.log(`  Warning: ${err}`);
    }
  }

  console.log(`\nTotal: ${totalCollected} items collected`);
  if (totalErrors > 0) console.log(`${totalErrors} errors (check above)`);
  console.log("\nInspect: pnpm exec prisma studio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

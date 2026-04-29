// Single canonical entry point: walks every present Surface, runs the
// acquisition router for each, then refreshes company-level metric counters.

import { syncGitHubOrgMetrics, syncYouTubeChannelMetrics } from "@/lib/acquisition/companyMetrics";
import { runAcquisitionForSurface } from "@/lib/acquisition/router";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("Every Signal Capture - Canonical Acquisition Run\n");
  console.log("=".repeat(50));

  const startTime = Date.now();
  const surfaces = await prisma.surface.findMany({
    where: { present: true },
    include: { employee: true },
    orderBy: [{ platform: "asc" }, { handle: "asc" }],
  });

  let totalCollected = 0;
  let totalErrors = 0;

  for (const surface of surfaces) {
    const label = `${surface.platform} ${surface.handle}`.slice(0, 42);
    process.stdout.write(`${label.padEnd(44)} `);
    try {
      const result = await runAcquisitionForSurface(surface.id, { windowDays: 90, forceSync: true });
      totalCollected += result.rawCount;
      if (result.status === "SUCCEEDED" || result.status === "PARTIAL") {
        process.stdout.write(`${result.status.padEnd(9)} ${String(result.rawCount).padStart(4)} collected\n`);
      } else {
        totalErrors += 1;
        process.stdout.write(`${result.status.padEnd(9)} ${result.failureCode ?? "unknown"}\n`);
      }
    } catch (error) {
      totalErrors += 1;
      process.stdout.write(`FAILED    ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  const metricResults = {
    youtube_metrics: await syncYouTubeChannelMetrics("EveryInc"),
    github_metrics: await syncGitHubOrgMetrics("every-io"),
  };

  for (const [name, result] of Object.entries(metricResults)) {
    totalCollected += result.collected;
    totalErrors += result.errors.length;
    console.log(`${name.padEnd(44)} ${String(result.collected).padStart(4)} metric rows`);
    for (const error of result.errors) console.log(`  ${error}`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Complete in ${duration}s`);
  console.log(`Total: ${totalCollected} items collected`);
  if (totalErrors > 0) console.log(`${totalErrors} errors or disabled routes (check above)`);
  console.log("\nInspect: pnpm exec prisma studio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

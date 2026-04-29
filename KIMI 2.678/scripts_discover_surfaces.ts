// scripts/discover-surfaces.ts
// Run: npx tsx scripts/discover-surfaces.ts

import { discoverAllEmployees, saveDiscoveryResults } from "@/lib/discovery/engine";
import { prisma } from "@/lib/prisma";

async function main() {
  const employees = await prisma.employee.findMany();

  console.log(`\n🔍 Discovering surfaces for ${employees.length} employees...\n`);

  const results = await discoverAllEmployees(
    employees.map(e => ({
      id: e.id,
      name: e.name,
      role: e.role,
    }))
  );

  for (const [empId, surfaces] of Object.entries(results)) {
    await saveDiscoveryResults(empId, surfaces);
    console.log(`  ✅ ${empId}: ${surfaces.length} surfaces discovered`);
  }

  console.log("\n✅ Discovery complete.\n");
}

main().catch(console.error);

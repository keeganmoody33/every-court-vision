// scripts/seed-employees.ts
// Seeds all 25 Every employees into Neon DB

import { prisma } from "@/lib/prisma";

const employees = [
  { id: "emp_001", name: "Dan Shipper", role: "CEO & Co-Founder", department: "Leadership", isPublicFacing: true },
  { id: "emp_002", name: "Austin Tedesco", role: "Head of Growth", department: "Growth", isPublicFacing: true },
  { id: "emp_003", name: "Brandon Gell", role: "Product Manager / GM", department: "Product", isPublicFacing: true },
  { id: "emp_004", name: "Kate Lee", role: "Editorial Lead", department: "Editorial", isPublicFacing: true },
  { id: "emp_005", name: "Kieran Klaassen", role: "Engineering Lead / Builder", department: "Engineering", isPublicFacing: true },
  { id: "emp_006", name: "Yash Poojary", role: "Growth Engineer", department: "Growth", isPublicFacing: true },
  { id: "emp_007", name: "Naveen Naidu", role: "Engineer / Product", department: "Engineering", isPublicFacing: true },
  { id: "emp_008", name: "Natalia Quintero", role: "Enterprise / Consulting Lead", department: "Sales", isPublicFacing: true },
  { id: "emp_009", name: "Katie Parrott", role: "Writer / Editor", department: "Editorial", isPublicFacing: true },
  { id: "emp_010", name: "Laura Entis", role: "Writer / Reporter", department: "Editorial", isPublicFacing: true },
  { id: "emp_011", name: "Willie Williams", role: "Operations / Finance", department: "Operations", isPublicFacing: true },
  { id: "emp_012", name: "Lucas Crespo", role: "Designer", department: "Design", isPublicFacing: true },
  { id: "emp_013", name: "Mike Taylor", role: "Engineer / Author", department: "Engineering", isPublicFacing: true },
  { id: "emp_014", name: "Alex Duffy", role: "Engineer", department: "Engineering", isPublicFacing: true },
  { id: "emp_015", name: "Rhea Purohit", role: "Growth / Marketing", department: "Growth", isPublicFacing: true },
  { id: "emp_016", name: "Anthony Scarpulla", role: "Engineer", department: "Engineering", isPublicFacing: true },
  // Add the remaining 9 from your directory
  { id: "emp_017", name: "[Employee 17]", role: "TBD", department: "TBD", isPublicFacing: false },
  { id: "emp_018", name: "[Employee 18]", role: "TBD", department: "TBD", isPublicFacing: false },
  { id: "emp_019", name: "[Employee 19]", role: "TBD", department: "TBD", isPublicFacing: false },
  { id: "emp_020", name: "[Employee 20]", role: "TBD", department: "TBD", isPublicFacing: false },
  { id: "emp_021", name: "[Employee 21]", role: "TBD", department: "TBD", isPublicFacing: false },
  { id: "emp_022", name: "[Employee 22]", role: "TBD", department: "TBD", isPublicFacing: false },
  { id: "emp_023", name: "[Employee 23]", role: "TBD", department: "TBD", isPublicFacing: false },
  { id: "emp_024", name: "[Employee 24]", role: "TBD", department: "TBD", isPublicFacing: false },
  { id: "emp_025", name: "[Employee 25]", role: "TBD", department: "TBD", isPublicFacing: false },
];

async function main() {
  console.log(`Seeding ${employees.length} employees...`);

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: emp,
      create: emp,
    });
    console.log(`  ✅ ${emp.name}`);
  }

  console.log("\nDone. Run `pnpm exec prisma studio` to verify.");
}

main().catch(console.error);

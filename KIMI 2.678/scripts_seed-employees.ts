// scripts/seed-employees.ts
// Seeds 16 verified Every employees

import { prisma } from "@/lib/prisma";

const EMPLOYEES = [
  { id: "emp_001", name: "Dan Shipper", role: "CEO & Co-Founder", department: "Leadership", isPublicFacing: true, archetype: "Founder Engine" },
  { id: "emp_002", name: "Austin Tedesco", role: "Head of Growth", department: "Growth", isPublicFacing: true, archetype: "Growth Playmaker" },
  { id: "emp_003", name: "Brandon Gell", role: "Product Manager / GM", department: "Product", isPublicFacing: true, archetype: "Trust Builder" },
  { id: "emp_004", name: "Kate Lee", role: "Editorial Lead", department: "Editorial", isPublicFacing: true, archetype: "Authority Anchor" },
  { id: "emp_005", name: "Kieran Klaassen", role: "Engineering Lead / Builder", department: "Engineering", isPublicFacing: true, archetype: "Builder Philosopher" },
  { id: "emp_006", name: "Yash Poojary", role: "Growth Engineer", department: "Growth", isPublicFacing: true, archetype: "Surface Specialist" },
  { id: "emp_007", name: "Naveen Naidu", role: "Engineer / Product", department: "Engineering", isPublicFacing: true, archetype: "Human Halo" },
  { id: "emp_008", name: "Natalia Quintero", role: "Enterprise / Consulting Lead", department: "Sales", isPublicFacing: true, archetype: "Closer" },
  { id: "emp_009", name: "Katie Parrott", role: "Writer / Editor", department: "Editorial", isPublicFacing: true, archetype: "Trust Builder" },
  { id: "emp_010", name: "Laura Entis", role: "Writer / Reporter", department: "Editorial", isPublicFacing: true, archetype: "Launch Sixth Man" },
  { id: "emp_011", name: "Willie Williams", role: "Operations / Finance", department: "Operations", isPublicFacing: true, archetype: "Human Halo" },
  { id: "emp_012", name: "Lucas Crespo", role: "Designer", department: "Design", isPublicFacing: true, archetype: "Surface Specialist" },
  { id: "emp_013", name: "Mike Taylor", role: "Engineer / Author", department: "Engineering", isPublicFacing: true, archetype: "Authority Anchor" },
  { id: "emp_014", name: "Alex Duffy", role: "Engineer", department: "Engineering", isPublicFacing: true, archetype: "Builder Philosopher" },
  { id: "emp_015", name: "Rhea Purohit", role: "Growth / Marketing", department: "Growth", isPublicFacing: true, archetype: "Launch Sixth Man" },
  { id: "emp_016", name: "Anthony Scarpulla", role: "Engineer", department: "Engineering", isPublicFacing: true, archetype: "Builder Philosopher" },
];

async function main() {
  console.log(`Seeding ${EMPLOYEES.length} employees...\n`);

  for (const emp of EMPLOYEES) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: emp,
      create: { ...emp, surfaceIQ: 0, coverageScore: 0, trustGravity: 0, assistCredit: 0, shotSelection: 0 },
    });
    console.log(`  ✅ ${emp.name}`);
  }

  // Seed company
  await prisma.company.upsert({
    where: { slug: "every" },
    update: {},
    create: {
      id: "comp_every_001",
      name: "Every",
      slug: "every",
      description: "The only subscription you need to stay at the edge of AI. Ideas, apps, and training.",
      teamSize: 25,
      publicFacingCount: 16,
    },
  });
  console.log(`  ✅ Every (company)`);

  console.log("\n✅ Done.");
}

main().catch(console.error);

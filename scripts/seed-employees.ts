// scripts/seed-employees.ts — company + 25 employees (roster IDs align with ingestion + discovery)
// Run: npx tsx scripts/seed-employees.ts

import { DataReadiness, Platform } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const COMPANY_ID = "comp_every_001";

const EMPLOYEES = [
  { id: "emp_001", name: "Dan Shipper", role: "CEO & Co-Founder", archetype: "Founder Engine", isPublicFacing: true },
  { id: "emp_002", name: "Austin Tedesco", role: "Head of Growth", archetype: "Growth Playmaker", isPublicFacing: true },
  { id: "emp_003", name: "Brandon Gell", role: "Product Manager / GM", archetype: "Trust Builder", isPublicFacing: true },
  { id: "emp_004", name: "Kate Lee", role: "Editorial Lead", archetype: "Authority Anchor", isPublicFacing: true },
  { id: "emp_005", name: "Kieran Klaassen", role: "Engineering Lead / Builder", archetype: "Builder Philosopher", isPublicFacing: true },
  { id: "emp_006", name: "Yash Poojary", role: "Growth Engineer", archetype: "Surface Specialist", isPublicFacing: true },
  { id: "emp_007", name: "Naveen Naidu", role: "Engineer / Product", archetype: "Human Halo", isPublicFacing: true },
  { id: "emp_008", name: "Natalia Quintero", role: "Enterprise / Consulting Lead", archetype: "Closer", isPublicFacing: true },
  { id: "emp_009", name: "Katie Parrott", role: "Writer / Editor", archetype: "Trust Builder", isPublicFacing: true },
  { id: "emp_010", name: "Laura Entis", role: "Writer / Reporter", archetype: "Launch Sixth Man", isPublicFacing: true },
  { id: "emp_011", name: "Willie Williams", role: "Operations / Finance", archetype: "Human Halo", isPublicFacing: true },
  { id: "emp_012", name: "Lucas Crespo", role: "Designer", archetype: "Surface Specialist", isPublicFacing: true },
  { id: "emp_013", name: "Mike Taylor", role: "Engineer / Author", archetype: "Authority Anchor", isPublicFacing: true },
  { id: "emp_014", name: "Alex Duffy", role: "Engineer", archetype: "Builder Philosopher", isPublicFacing: true },
  { id: "emp_015", name: "Rhea Purohit", role: "Growth / Marketing", archetype: "Launch Sixth Man", isPublicFacing: true },
  { id: "emp_016", name: "Anthony Scarpulla", role: "Engineer", archetype: "Builder Philosopher", isPublicFacing: true },
  { id: "emp_017", name: "[Employee 17]", role: "TBD", archetype: "—", isPublicFacing: false },
  { id: "emp_018", name: "[Employee 18]", role: "TBD", archetype: "—", isPublicFacing: false },
  { id: "emp_019", name: "[Employee 19]", role: "TBD", archetype: "—", isPublicFacing: false },
  { id: "emp_020", name: "[Employee 20]", role: "TBD", archetype: "—", isPublicFacing: false },
  { id: "emp_021", name: "[Employee 21]", role: "TBD", archetype: "—", isPublicFacing: false },
  { id: "emp_022", name: "[Employee 22]", role: "TBD", archetype: "—", isPublicFacing: false },
  { id: "emp_023", name: "[Employee 23]", role: "TBD", archetype: "—", isPublicFacing: false },
  { id: "emp_024", name: "[Employee 24]", role: "TBD", archetype: "—", isPublicFacing: false },
  { id: "emp_025", name: "[Employee 25]", role: "TBD", archetype: "—", isPublicFacing: false },
] as const;

async function main() {
  console.log("Seeding company + employees…\n");

  await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: {
      slug: "every",
      description:
        "The only subscription you need to stay at the edge of AI. Ideas, apps, and training.",
      teamSize: 25,
      publicFacingCount: 16,
    },
    create: {
      id: COMPANY_ID,
      name: "Every",
      slug: "every",
      domain: "every.to",
      website: "https://every.to",
      description:
        "The only subscription you need to stay at the edge of AI. Ideas, apps, and training.",
      teamSize: 25,
      publicFacingCount: 16,
    },
  });
  console.log("  Every (company)");

  for (const emp of EMPLOYEES) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: {
        name: emp.name,
        role: emp.role,
        archetype: emp.archetype,
        isPublicFacing: emp.isPublicFacing,
      },
      create: {
        id: emp.id,
        companyId: COMPANY_ID,
        name: emp.name,
        role: emp.role,
        archetype: emp.archetype,
        dataReadiness: DataReadiness.PUBLIC_ONLY,
        primarySurface: Platform.X,
        secondarySurface: Platform.NEWSLETTER,
        signatureMove: "—",
        opportunity: "—",
        bestShot: "—",
        bestAssist: "—",
        isPublicFacing: emp.isPublicFacing,
      },
    });
    console.log(`  ${emp.name}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

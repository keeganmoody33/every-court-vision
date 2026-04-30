import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { normalizeDatabaseUrl } from "@/lib/normalize-database-url";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

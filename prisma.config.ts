import { config } from "dotenv";
import { defineConfig } from "prisma/config";

import { normalizeDatabaseUrl } from "./lib/normalize-database-url";

config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: normalizeDatabaseUrl(process.env.DATABASE_URL ?? ""),
  },
});

import "server-only";

import { config } from "dotenv";
import { z } from "zod";

import { normalizeDatabaseUrl } from "@/lib/normalize-database-url";

config({ path: ".env", quiet: true });
config({ path: ".env.local", override: true, quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.preprocess(
    (val) => (typeof val === "string" ? normalizeDatabaseUrl(val) : val),
    z.string().min(1, "DATABASE_URL is required for Phase 1+"),
  ),
  SURFACE_IQ_PASSWORD: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  SPIDER_API_KEY: z.string().optional(),
  PARALLEL_API_KEY: z.string().optional(),
  X_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  LINKEDIN_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  INNGEST_DEV: z.string().optional(),
  SPIDER_DAILY_CAP: z.coerce.number().int().positive().optional(),
  PARALLEL_DAILY_CAP: z.coerce.number().int().positive().optional(),
  X_API_DAILY_CAP: z.coerce.number().int().positive().optional(),
  X_TIMELINE_MAX_TWEETS: z.coerce.number().int().positive().optional(),
  GITHUB_API_DAILY_CAP: z.coerce.number().int().positive().optional(),
  YOUTUBE_API_DAILY_CAP: z.coerce.number().int().positive().optional(),
  INSTAGRAM_GRAPH_DAILY_CAP: z.coerce.number().int().positive().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  GOOGLE_SHEET_ID: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration. See .env.example.");
}

export const env = parsed.data;

export const flags = {
  llmCategorization: Boolean(env.OPENAI_API_KEY),
  liveScraping: Boolean(env.SPIDER_API_KEY),
  parallelResearch: Boolean(env.PARALLEL_API_KEY),
  xApi: Boolean(env.X_API_KEY),
  githubApi: Boolean(env.GITHUB_TOKEN),
  linkedInApi: Boolean(env.LINKEDIN_ACCESS_TOKEN),
  instagramGraph: Boolean(env.INSTAGRAM_ACCESS_TOKEN),
  youtubeApi: Boolean(env.YOUTUBE_API_KEY),
  queueDriver: env.INNGEST_EVENT_KEY || env.INNGEST_DEV ? "inngest" : "sync",
  passwordGate: env.NODE_ENV === "production" && Boolean(env.SURFACE_IQ_PASSWORD),
  clerk: Boolean(env.CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY),
  sheetsSync: Boolean(env.GOOGLE_SHEET_ID && env.GOOGLE_SERVICE_ACCOUNT_KEY),
};

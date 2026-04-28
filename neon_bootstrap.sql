-- Bootstrap schema for Every Court Vision (from prisma/schema.prisma)
-- Note: Prisma @updatedAt semantics are handled at the application layer.

BEGIN;

-- Assumes an empty database. If re-running, drop existing types first.
CREATE TYPE "Platform" AS ENUM (
  'X','LINKEDIN','GITHUB','INSTAGRAM','NEWSLETTER','YOUTUBE','PODCAST','LAUNCHES',
  'TEAMMATE_AMPLIFICATION','EXTERNAL_AMPLIFICATION','PRODUCT_HUNT','PERSONAL_SITE','TIKTOK',
  'WEBSITE','SUBSTACK','APP_STORE','REFERRAL','CONSULTING'
);

CREATE TYPE "MetricConfidence" AS ENUM ('DIRECT','ESTIMATED','MODELED','HYPOTHESIS','NEEDS_INTERNAL_ANALYTICS');
CREATE TYPE "DataReadiness" AS ENUM ('PUBLIC_ONLY','MANUAL_IMPORT','LIVE');
CREATE TYPE "SourceReadiness" AS ENUM ('READY','MANUAL_IMPORT','NEEDS_OAUTH','FUTURE');
CREATE TYPE "AcquisitionProvider" AS ENUM (
  'X_API','LINKEDIN_API','GITHUB_API','YOUTUBE_API','RSS','SPIDER','PARALLEL','MANUAL','INSTAGRAM_GRAPH'
);
CREATE TYPE "AcquisitionJobStatus" AS ENUM ('QUEUED','RUNNING','SUCCEEDED','PARTIAL','FAILED','DISABLED');
CREATE TYPE "IntentClass" AS ENUM ('THREE_POINT','MID_RANGE','PAINT','FREE_THROW','PASS');
CREATE TYPE "ShotOutcome" AS ENUM ('MADE','MISSED','TURNOVER');

CREATE TABLE IF NOT EXISTS "Company" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "domain" text NOT NULL,
  "website" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Play" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "bestFor" text NOT NULL,
  "bestPlatforms" "Platform"[] NOT NULL,
  "structure" text NOT NULL,
  "whyItWorks" text NOT NULL,
  "historicalSignal" text NOT NULL,
  "recommendedNextExperiment" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "Employee" (
  "id" text PRIMARY KEY,
  "companyId" text NOT NULL REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" text NOT NULL,
  "role" text NOT NULL,
  "archetype" text,
  "dataReadiness" "DataReadiness" NOT NULL DEFAULT 'PUBLIC_ONLY',
  "primarySurface" "Platform" NOT NULL,
  "secondarySurface" "Platform" NOT NULL,
  "signatureMove" text NOT NULL,
  "opportunity" text NOT NULL,
  "bestShot" text NOT NULL,
  "bestAssist" text NOT NULL,
  "surfacePresence" double precision NOT NULL DEFAULT 0,
  "surfaceIQ" double precision NOT NULL DEFAULT 0,
  "trustGravity" double precision NOT NULL DEFAULT 0,
  "socialTS" double precision NOT NULL DEFAULT 0,
  "shotDistribution" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "recommendedPlayId" text REFERENCES "Play"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Surface" (
  "id" text PRIMARY KEY,
  "companyId" text NOT NULL REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "employeeId" text REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "platform" "Platform" NOT NULL,
  "handle" text NOT NULL,
  "url" text,
  "present" boolean NOT NULL DEFAULT true,
  "status" text NOT NULL DEFAULT 'VERIFIED',
  "followers" integer NOT NULL DEFAULT 0,
  "confidence" "MetricConfidence" NOT NULL DEFAULT 'ESTIMATED',
  "lastScrapedAt" timestamptz,
  "attributionValue" text,
  "opportunity" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Surface_companyId_platform_idx" ON "Surface" ("companyId","platform");
CREATE INDEX IF NOT EXISTS "Surface_employeeId_platform_idx" ON "Surface" ("employeeId","platform");

CREATE TABLE IF NOT EXISTS "SocialAccount" (
  "id" text PRIMARY KEY,
  "employeeId" text NOT NULL REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "platform" "Platform" NOT NULL,
  "handle" text NOT NULL,
  "followers" integer NOT NULL,
  "confidence" "MetricConfidence" NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "AcquisitionRoute" (
  "id" text PRIMARY KEY,
  "platform" "Platform" NOT NULL,
  "provider" "AcquisitionProvider" NOT NULL,
  "routeOrder" integer NOT NULL,
  "capability" text NOT NULL,
  "requiredEnv" text,
  "confidence" "MetricConfidence" NOT NULL DEFAULT 'ESTIMATED',
  "complianceNote" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "AcquisitionRoute_platform_provider_routeOrder_key"
  ON "AcquisitionRoute" ("platform","provider","routeOrder");
CREATE INDEX IF NOT EXISTS "AcquisitionRoute_platform_routeOrder_idx" ON "AcquisitionRoute" ("platform","routeOrder");

CREATE TABLE IF NOT EXISTS "AcquisitionJob" (
  "id" text PRIMARY KEY,
  "surfaceId" text NOT NULL REFERENCES "Surface"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "provider" "AcquisitionProvider" NOT NULL,
  "status" "AcquisitionJobStatus" NOT NULL DEFAULT 'QUEUED',
  "windowStart" timestamptz NOT NULL,
  "windowEnd" timestamptz NOT NULL,
  "attempts" integer NOT NULL DEFAULT 0,
  "rawCount" integer NOT NULL DEFAULT 0,
  "inserted" integer NOT NULL DEFAULT 0,
  "updated" integer NOT NULL DEFAULT 0,
  "skipped" integer NOT NULL DEFAULT 0,
  "failureCode" text,
  "failureReason" text,
  "startedAt" timestamptz,
  "completedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "AcquisitionJob_surfaceId_createdAt_idx" ON "AcquisitionJob" ("surfaceId","createdAt");
CREATE INDEX IF NOT EXISTS "AcquisitionJob_provider_status_idx" ON "AcquisitionJob" ("provider","status");

CREATE TABLE IF NOT EXISTS "RawActivity" (
  "id" text PRIMARY KEY,
  "surfaceId" text NOT NULL REFERENCES "Surface"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "jobId" text REFERENCES "AcquisitionJob"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "provider" "AcquisitionProvider" NOT NULL,
  "externalId" text NOT NULL,
  "permalink" text,
  "publishedAt" timestamptz NOT NULL,
  "text" text NOT NULL,
  "rawMetrics" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "rawPayload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "citations" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "basis" jsonb,
  "confidence" "MetricConfidence" NOT NULL DEFAULT 'ESTIMATED',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "RawActivity_surfaceId_externalId_key" ON "RawActivity" ("surfaceId","externalId");
CREATE INDEX IF NOT EXISTS "RawActivity_surfaceId_publishedAt_idx" ON "RawActivity" ("surfaceId","publishedAt");
CREATE INDEX IF NOT EXISTS "RawActivity_provider_publishedAt_idx" ON "RawActivity" ("provider","publishedAt");

CREATE TABLE IF NOT EXISTS "Post" (
  "id" text PRIMARY KEY,
  "employeeId" text NOT NULL REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "surfaceId" text REFERENCES "Surface"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "text" text NOT NULL,
  "platform" "Platform" NOT NULL,
  "contentType" text NOT NULL,
  "archetype" text NOT NULL,
  "campaign" text NOT NULL,
  "ctaType" text NOT NULL,
  "brandTouch" text NOT NULL,
  "product" text NOT NULL,
  "launchWindow" boolean NOT NULL DEFAULT false,
  "publishedAt" timestamptz NOT NULL,
  "x" double precision NOT NULL DEFAULT 50,
  "y" double precision NOT NULL DEFAULT 47,
  "zone" text NOT NULL,
  "advancedZone" text NOT NULL,
  "intentClass" "IntentClass" NOT NULL DEFAULT 'PASS',
  "intentConfidence" double precision NOT NULL DEFAULT 0,
  "outcome" "ShotOutcome" NOT NULL DEFAULT 'MISSED',
  "recovered" boolean NOT NULL DEFAULT false,
  "isAssist" boolean NOT NULL DEFAULT false,
  "classifiedAt" timestamptz,
  "classifiedBy" text,
  "confidence" "MetricConfidence" NOT NULL,
  "externalId" text,
  "permalink" text,
  "rawActivityId" text REFERENCES "RawActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "acquiredVia" "AcquisitionProvider",
  "acquiredAt" timestamptz,
  "sourceId" text,
  "recommendedPlayId" text REFERENCES "Play"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Post_platform_publishedAt_idx" ON "Post" ("platform","publishedAt");
CREATE INDEX IF NOT EXISTS "Post_employeeId_publishedAt_idx" ON "Post" ("employeeId","publishedAt");
CREATE INDEX IF NOT EXISTS "Post_surfaceId_publishedAt_idx" ON "Post" ("surfaceId","publishedAt");
CREATE INDEX IF NOT EXISTS "Post_rawActivityId_idx" ON "Post" ("rawActivityId");
CREATE INDEX IF NOT EXISTS "Post_surfaceId_externalId_idx" ON "Post" ("surfaceId","externalId");
CREATE INDEX IF NOT EXISTS "Post_sourceId_idx" ON "Post" ("sourceId");
CREATE INDEX IF NOT EXISTS "Post_campaign_idx" ON "Post" ("campaign");
CREATE INDEX IF NOT EXISTS "Post_employeeId_intentClass_idx" ON "Post" ("employeeId","intentClass");

CREATE TABLE IF NOT EXISTS "PostMetrics" (
  "id" text PRIMARY KEY,
  "postId" text NOT NULL UNIQUE REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "views" integer NOT NULL,
  "reach" integer NOT NULL,
  "likes" integer NOT NULL,
  "comments" integer NOT NULL,
  "replies" integer NOT NULL,
  "reposts" integer NOT NULL,
  "quotes" integer NOT NULL,
  "shares" integer NOT NULL,
  "clicks" integer NOT NULL,
  "profileVisits" integer NOT NULL,
  "signups" integer NOT NULL,
  "paidSubscriptions" integer NOT NULL,
  "consultingLeads" integer NOT NULL,
  "revenue" integer NOT NULL,
  "assistedConversions" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "PostScores" (
  "id" text PRIMARY KEY,
  "postId" text NOT NULL UNIQUE REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "awareness" double precision NOT NULL,
  "engagement" double precision NOT NULL,
  "trust" double precision NOT NULL,
  "clicks" double precision NOT NULL,
  "signups" double precision NOT NULL,
  "paid" double precision NOT NULL,
  "consulting" double precision NOT NULL,
  "revenue" double precision NOT NULL,
  "assists" double precision NOT NULL,
  "surfaceIQ" double precision NOT NULL,
  "socialTS" double precision NOT NULL,
  "assistRate" double precision NOT NULL,
  "trustGravity" double precision NOT NULL,
  "humanHalo" double precision NOT NULL
);

CREATE TABLE IF NOT EXISTS "RippleEvent" (
  "id" text PRIMARY KEY,
  "rootPostId" text NOT NULL REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "parentId" text,
  "employeeId" text REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "actor" text NOT NULL,
  "platform" "Platform" NOT NULL,
  "eventType" text NOT NULL,
  "occurredAt" timestamptz NOT NULL,
  "value" integer NOT NULL,
  "confidence" "MetricConfidence" NOT NULL
);

CREATE TABLE IF NOT EXISTS "Metric" (
  "id" text PRIMARY KEY,
  "employeeId" text NOT NULL REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "surfaceId" text NOT NULL REFERENCES "Surface"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "platform" "Platform" NOT NULL,
  "timeWindow" text NOT NULL,
  "windowStart" timestamptz NOT NULL,
  "windowEnd" timestamptz,
  "posts" integer NOT NULL DEFAULT 0,
  "views" integer NOT NULL DEFAULT 0,
  "reach" integer NOT NULL DEFAULT 0,
  "likes" integer NOT NULL DEFAULT 0,
  "comments" integer NOT NULL DEFAULT 0,
  "replies" integer NOT NULL DEFAULT 0,
  "reposts" integer NOT NULL DEFAULT 0,
  "quotes" integer NOT NULL DEFAULT 0,
  "shares" integer NOT NULL DEFAULT 0,
  "clicks" integer NOT NULL DEFAULT 0,
  "profileVisits" integer NOT NULL DEFAULT 0,
  "signups" integer NOT NULL DEFAULT 0,
  "paidSubscriptions" integer NOT NULL DEFAULT 0,
  "consultingLeads" integer NOT NULL DEFAULT 0,
  "revenue" integer NOT NULL DEFAULT 0,
  "assistedConversions" integer NOT NULL DEFAULT 0,
  "surfaceIQ" double precision NOT NULL DEFAULT 0,
  "socialTS" double precision NOT NULL DEFAULT 0,
  "assistRate" double precision NOT NULL DEFAULT 0,
  "trustGravity" double precision NOT NULL DEFAULT 0,
  "totalAttempts" integer NOT NULL DEFAULT 0,
  "threePtAttempts" integer NOT NULL DEFAULT 0,
  "midAttempts" integer NOT NULL DEFAULT 0,
  "paintAttempts" integer NOT NULL DEFAULT 0,
  "ftAttempts" integer NOT NULL DEFAULT 0,
  "passes" integer NOT NULL DEFAULT 0,
  "turnovers" integer NOT NULL DEFAULT 0,
  "threePtMade" integer NOT NULL DEFAULT 0,
  "midMade" integer NOT NULL DEFAULT 0,
  "paintMade" integer NOT NULL DEFAULT 0,
  "threePtPct" double precision NOT NULL DEFAULT 0,
  "midPct" double precision NOT NULL DEFAULT 0,
  "paintPct" double precision NOT NULL DEFAULT 0,
  "fgPct" double precision NOT NULL DEFAULT 0,
  "effectiveFgPct" double precision NOT NULL DEFAULT 0,
  "trueShootingPct" double precision NOT NULL DEFAULT 0,
  "pacePerWeek" double precision NOT NULL DEFAULT 0,
  "brandTouchEvery" double precision NOT NULL DEFAULT 0,
  "brandTouchPersonal" double precision NOT NULL DEFAULT 0,
  "assistsCreated" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Metric_employeeId_timeWindow_windowStart_idx" ON "Metric" ("employeeId","timeWindow","windowStart");
CREATE INDEX IF NOT EXISTS "Metric_surfaceId_timeWindow_windowStart_idx" ON "Metric" ("surfaceId","timeWindow","windowStart");
CREATE UNIQUE INDEX IF NOT EXISTS "Metric_employeeId_surfaceId_timeWindow_windowStart_key"
  ON "Metric" ("employeeId","surfaceId","timeWindow","windowStart");

CREATE TABLE IF NOT EXISTS "Experiment" (
  "id" text PRIMARY KEY,
  "playId" text NOT NULL REFERENCES "Play"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "ownerEmployeeId" text NOT NULL REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" text NOT NULL,
  "hypothesis" text NOT NULL,
  "status" text NOT NULL,
  "metric" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Report" (
  "id" text PRIMARY KEY,
  "companyId" text NOT NULL REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "title" text NOT NULL,
  "period" text NOT NULL,
  "status" text NOT NULL,
  "summary" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "DataSource" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "readiness" "SourceReadiness" NOT NULL,
  "confidence" "MetricConfidence" NOT NULL,
  "description" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

COMMIT;


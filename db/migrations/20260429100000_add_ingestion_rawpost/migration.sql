-- AlterTable Company
ALTER TABLE "Company" ADD COLUMN "slug" TEXT;
ALTER TABLE "Company" ADD COLUMN "description" TEXT;
ALTER TABLE "Company" ADD COLUMN "youtubeSubscribers" INTEGER;
ALTER TABLE "Company" ADD COLUMN "youtubeViews" INTEGER;
ALTER TABLE "Company" ADD COLUMN "youtubeVideos" INTEGER;
ALTER TABLE "Company" ADD COLUMN "newsletterSubscribers" INTEGER;
ALTER TABLE "Company" ADD COLUMN "xFollowers" INTEGER;
ALTER TABLE "Company" ADD COLUMN "linkedinFollowers" INTEGER;
ALTER TABLE "Company" ADD COLUMN "githubRepos" INTEGER;
ALTER TABLE "Company" ADD COLUMN "productHuntProducts" INTEGER;
ALTER TABLE "Company" ADD COLUMN "podcastEpisodes" INTEGER;
ALTER TABLE "Company" ADD COLUMN "teamSize" INTEGER;
ALTER TABLE "Company" ADD COLUMN "publicFacingCount" INTEGER;

CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- AlterTable Employee
ALTER TABLE "Employee" ADD COLUMN "xFollowers" INTEGER;

-- CreateTable
CREATE TABLE "RawPost" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "nativeId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "url" TEXT,
    "mediaUrl" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawReach" INTEGER,
    "rawLikes" INTEGER,
    "rawReplies" INTEGER,
    "rawReposts" INTEGER,
    "rawClicks" INTEGER,
    "rawOpens" INTEGER,
    "rawComments" INTEGER,
    "rawStars" INTEGER,
    "rawForks" INTEGER,
    "rawMetrics" JSONB,
    "extractedUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "rawHash" TEXT NOT NULL,
    "normalizedToPostId" TEXT,

    CONSTRAINT "RawPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RawPost_rawHash_key" ON "RawPost"("rawHash");
CREATE UNIQUE INDEX "RawPost_normalizedToPostId_key" ON "RawPost"("normalizedToPostId");

CREATE INDEX "RawPost_platform_entityId_postedAt_idx" ON "RawPost"("platform", "entityId", "postedAt");

-- CreateTable
CREATE TABLE "TrackedRedirect" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "postId" TEXT,
    "destinationUrl" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "utmCampaign" TEXT,
    "utmMedium" TEXT,
    "utmContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedRedirect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrackedRedirect_shortId_key" ON "TrackedRedirect"("shortId");

-- CreateTable
CREATE TABLE "ConversionEvent" (
    "id" TEXT NOT NULL,
    "redirectId" TEXT,
    "postId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "referrerUrl" TEXT,
    "utmCampaign" TEXT,
    "utmMedium" TEXT,
    "utmContent" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversionEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConversionEvent_entityType_entityId_eventType_idx" ON "ConversionEvent"("entityType", "entityId", "eventType");

CREATE INDEX "ConversionEvent_occurredAt_idx" ON "ConversionEvent"("occurredAt");

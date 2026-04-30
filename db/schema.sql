--
-- PostgreSQL database dump
--


-- Dumped from database version 17.8 (130b160)
-- Dumped by pg_dump version 17.9 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: AcquisitionJobStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AcquisitionJobStatus" AS ENUM (
    'QUEUED',
    'RUNNING',
    'SUCCEEDED',
    'PARTIAL',
    'FAILED',
    'DISABLED',
    'DEAD_LETTER'
);


--
-- Name: AcquisitionProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AcquisitionProvider" AS ENUM (
    'X_API',
    'LINKEDIN_API',
    'GITHUB_API',
    'YOUTUBE_API',
    'RSS',
    'SPIDER',
    'PARALLEL',
    'MANUAL',
    'INSTAGRAM_GRAPH'
);


--
-- Name: DataReadiness; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DataReadiness" AS ENUM (
    'PUBLIC_ONLY',
    'MANUAL_IMPORT',
    'LIVE'
);


--
-- Name: IntentClass; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."IntentClass" AS ENUM (
    'THREE_POINT',
    'MID_RANGE',
    'PAINT',
    'FREE_THROW',
    'PASS'
);


--
-- Name: MetricConfidence; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MetricConfidence" AS ENUM (
    'DIRECT',
    'ESTIMATED',
    'MODELED',
    'HYPOTHESIS',
    'NEEDS_INTERNAL_ANALYTICS'
);


--
-- Name: Platform; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Platform" AS ENUM (
    'X',
    'LINKEDIN',
    'GITHUB',
    'INSTAGRAM',
    'NEWSLETTER',
    'YOUTUBE',
    'PODCAST',
    'LAUNCHES',
    'TEAMMATE_AMPLIFICATION',
    'EXTERNAL_AMPLIFICATION',
    'PRODUCT_HUNT',
    'PERSONAL_SITE',
    'TIKTOK',
    'WEBSITE',
    'SUBSTACK',
    'APP_STORE',
    'REFERRAL',
    'CONSULTING'
);


--
-- Name: ShotOutcome; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShotOutcome" AS ENUM (
    'MADE',
    'MISSED',
    'TURNOVER'
);


--
-- Name: SourceReadiness; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SourceReadiness" AS ENUM (
    'READY',
    'MANUAL_IMPORT',
    'NEEDS_OAUTH',
    'FUTURE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AcquisitionJob; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AcquisitionJob" (
    id text NOT NULL,
    "surfaceId" text NOT NULL,
    provider public."AcquisitionProvider" NOT NULL,
    status public."AcquisitionJobStatus" DEFAULT 'QUEUED'::public."AcquisitionJobStatus" NOT NULL,
    "windowStart" timestamp(3) without time zone NOT NULL,
    "windowEnd" timestamp(3) without time zone NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "rawCount" integer DEFAULT 0 NOT NULL,
    inserted integer DEFAULT 0 NOT NULL,
    updated integer DEFAULT 0 NOT NULL,
    skipped integer DEFAULT 0 NOT NULL,
    "failureCode" text,
    "failureReason" text,
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "attemptNumber" integer DEFAULT 0 NOT NULL,
    "deadLetterAt" timestamp(3) without time zone,
    "idempotencyKey" text,
    "inngestRunId" text,
    "nextAttemptAt" timestamp(3) without time zone
);


--
-- Name: AcquisitionRoute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AcquisitionRoute" (
    id text NOT NULL,
    platform public."Platform" NOT NULL,
    provider public."AcquisitionProvider" NOT NULL,
    "routeOrder" integer NOT NULL,
    capability text NOT NULL,
    "requiredEnv" text,
    confidence public."MetricConfidence" DEFAULT 'ESTIMATED'::public."MetricConfidence" NOT NULL,
    "complianceNote" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Company" (
    id text NOT NULL,
    name text NOT NULL,
    domain text NOT NULL,
    website text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    description text,
    "githubRepos" integer,
    "linkedinFollowers" integer,
    "newsletterSubscribers" integer,
    "podcastEpisodes" integer,
    "productHuntProducts" integer,
    "publicFacingCount" integer,
    slug text,
    "teamSize" integer,
    "xFollowers" integer,
    "youtubeSubscribers" integer,
    "youtubeVideos" integer,
    "youtubeViews" integer
);


--
-- Name: ConversionEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ConversionEvent" (
    id text NOT NULL,
    "redirectId" text,
    "postId" text,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "eventType" text NOT NULL,
    "referrerUrl" text,
    "utmCampaign" text,
    "utmMedium" text,
    "utmContent" text,
    "userAgent" text,
    "ipAddress" text,
    "occurredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: DataSource; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DataSource" (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    readiness public."SourceReadiness" NOT NULL,
    confidence public."MetricConfidence" NOT NULL,
    description text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DiscoveredSurface; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DiscoveredSurface" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    surface text NOT NULL,
    label text NOT NULL,
    handle text,
    url text,
    status text DEFAULT 'unknown'::text NOT NULL,
    "discoveryMethod" text NOT NULL,
    "discoveredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastVerifiedAt" timestamp(3) without time zone,
    "confidenceScore" double precision DEFAULT 0 NOT NULL,
    evidence text[] DEFAULT ARRAY[]::text[],
    notes text,
    "searchQuery" text,
    "searchRank" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DiscoveryJob; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DiscoveryJob" (
    id text NOT NULL,
    "jobType" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "employeeId" text,
    surface text,
    "surfacesFound" integer DEFAULT 0 NOT NULL,
    "surfacesUpdated" integer DEFAULT 0 NOT NULL,
    errors text[] DEFAULT ARRAY[]::text[],
    "startedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Employee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Employee" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    archetype text,
    "dataReadiness" public."DataReadiness" DEFAULT 'PUBLIC_ONLY'::public."DataReadiness" NOT NULL,
    "primarySurface" public."Platform" NOT NULL,
    "secondarySurface" public."Platform" NOT NULL,
    "signatureMove" text NOT NULL,
    opportunity text NOT NULL,
    "bestShot" text NOT NULL,
    "bestAssist" text NOT NULL,
    "surfacePresence" double precision DEFAULT 0 NOT NULL,
    "surfaceIQ" double precision DEFAULT 0 NOT NULL,
    "trustGravity" double precision DEFAULT 0 NOT NULL,
    "socialTS" double precision DEFAULT 0 NOT NULL,
    "shotDistribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "recommendedPlayId" text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isPublicFacing" boolean DEFAULT false NOT NULL,
    "xFollowers" integer
);


--
-- Name: Experiment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Experiment" (
    id text NOT NULL,
    "playId" text NOT NULL,
    "ownerEmployeeId" text NOT NULL,
    name text NOT NULL,
    hypothesis text NOT NULL,
    status text NOT NULL,
    metric text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Metric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Metric" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "surfaceId" text NOT NULL,
    platform public."Platform" NOT NULL,
    "timeWindow" text NOT NULL,
    "windowStart" timestamp(3) without time zone NOT NULL,
    "windowEnd" timestamp(3) without time zone,
    posts integer DEFAULT 0 NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    reach integer DEFAULT 0 NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    comments integer DEFAULT 0 NOT NULL,
    replies integer DEFAULT 0 NOT NULL,
    reposts integer DEFAULT 0 NOT NULL,
    quotes integer DEFAULT 0 NOT NULL,
    shares integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    "profileVisits" integer DEFAULT 0 NOT NULL,
    signups integer DEFAULT 0 NOT NULL,
    "paidSubscriptions" integer DEFAULT 0 NOT NULL,
    "consultingLeads" integer DEFAULT 0 NOT NULL,
    revenue integer DEFAULT 0 NOT NULL,
    "assistedConversions" integer DEFAULT 0 NOT NULL,
    "surfaceIQ" double precision DEFAULT 0 NOT NULL,
    "socialTS" double precision DEFAULT 0 NOT NULL,
    "assistRate" double precision DEFAULT 0 NOT NULL,
    "trustGravity" double precision DEFAULT 0 NOT NULL,
    "totalAttempts" integer DEFAULT 0 NOT NULL,
    "threePtAttempts" integer DEFAULT 0 NOT NULL,
    "midAttempts" integer DEFAULT 0 NOT NULL,
    "paintAttempts" integer DEFAULT 0 NOT NULL,
    "ftAttempts" integer DEFAULT 0 NOT NULL,
    passes integer DEFAULT 0 NOT NULL,
    turnovers integer DEFAULT 0 NOT NULL,
    "threePtMade" integer DEFAULT 0 NOT NULL,
    "midMade" integer DEFAULT 0 NOT NULL,
    "paintMade" integer DEFAULT 0 NOT NULL,
    "threePtPct" double precision DEFAULT 0 NOT NULL,
    "midPct" double precision DEFAULT 0 NOT NULL,
    "paintPct" double precision DEFAULT 0 NOT NULL,
    "fgPct" double precision DEFAULT 0 NOT NULL,
    "effectiveFgPct" double precision DEFAULT 0 NOT NULL,
    "trueShootingPct" double precision DEFAULT 0 NOT NULL,
    "pacePerWeek" double precision DEFAULT 0 NOT NULL,
    "brandTouchEvery" double precision DEFAULT 0 NOT NULL,
    "brandTouchPersonal" double precision DEFAULT 0 NOT NULL,
    "assistsCreated" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ftMade" integer DEFAULT 0 NOT NULL
);


--
-- Name: Play; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Play" (
    id text NOT NULL,
    name text NOT NULL,
    "bestFor" text NOT NULL,
    "bestPlatforms" public."Platform"[] NOT NULL,
    structure text NOT NULL,
    "whyItWorks" text NOT NULL,
    "historicalSignal" text NOT NULL,
    "recommendedNextExperiment" text NOT NULL
);


--
-- Name: Post; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Post" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "surfaceId" text,
    text text NOT NULL,
    platform public."Platform" NOT NULL,
    "contentType" text NOT NULL,
    archetype text NOT NULL,
    campaign text NOT NULL,
    "ctaType" text NOT NULL,
    "brandTouch" text NOT NULL,
    product text NOT NULL,
    "launchWindow" boolean DEFAULT false NOT NULL,
    "publishedAt" timestamp(3) without time zone NOT NULL,
    x double precision DEFAULT 50 NOT NULL,
    y double precision DEFAULT 47 NOT NULL,
    zone text NOT NULL,
    "advancedZone" text NOT NULL,
    "intentClass" public."IntentClass" DEFAULT 'PASS'::public."IntentClass" NOT NULL,
    "intentConfidence" double precision DEFAULT 0 NOT NULL,
    outcome public."ShotOutcome" DEFAULT 'MISSED'::public."ShotOutcome" NOT NULL,
    recovered boolean DEFAULT false NOT NULL,
    "isAssist" boolean DEFAULT false NOT NULL,
    "classifiedAt" timestamp(3) without time zone,
    "classifiedBy" text,
    confidence public."MetricConfidence" NOT NULL,
    "externalId" text,
    permalink text,
    "rawActivityId" text,
    "acquiredVia" public."AcquisitionProvider",
    "acquiredAt" timestamp(3) without time zone,
    "sourceId" text,
    "recommendedPlayId" text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PostMetrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PostMetrics" (
    id text NOT NULL,
    "postId" text NOT NULL,
    views integer NOT NULL,
    reach integer NOT NULL,
    likes integer NOT NULL,
    comments integer NOT NULL,
    replies integer NOT NULL,
    reposts integer NOT NULL,
    quotes integer NOT NULL,
    shares integer NOT NULL,
    clicks integer NOT NULL,
    "profileVisits" integer NOT NULL,
    signups integer NOT NULL,
    "paidSubscriptions" integer NOT NULL,
    "consultingLeads" integer NOT NULL,
    revenue integer NOT NULL,
    "assistedConversions" integer NOT NULL
);


--
-- Name: PostScores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PostScores" (
    id text NOT NULL,
    "postId" text NOT NULL,
    awareness double precision NOT NULL,
    engagement double precision NOT NULL,
    trust double precision NOT NULL,
    clicks double precision NOT NULL,
    signups double precision NOT NULL,
    paid double precision NOT NULL,
    consulting double precision NOT NULL,
    revenue double precision NOT NULL,
    assists double precision NOT NULL,
    "surfaceIQ" double precision NOT NULL,
    "socialTS" double precision NOT NULL,
    "assistRate" double precision NOT NULL,
    "trustGravity" double precision NOT NULL,
    "humanHalo" double precision NOT NULL
);


--
-- Name: ProviderBudget; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProviderBudget" (
    id text NOT NULL,
    provider public."AcquisitionProvider" NOT NULL,
    day timestamp(3) without time zone NOT NULL,
    used integer DEFAULT 0 NOT NULL,
    cap integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RawActivity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RawActivity" (
    id text NOT NULL,
    "surfaceId" text NOT NULL,
    "jobId" text,
    provider public."AcquisitionProvider" NOT NULL,
    "externalId" text NOT NULL,
    permalink text,
    "publishedAt" timestamp(3) without time zone NOT NULL,
    text text NOT NULL,
    "rawMetrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "rawPayload" jsonb DEFAULT '{}'::jsonb NOT NULL,
    citations jsonb DEFAULT '[]'::jsonb NOT NULL,
    basis jsonb,
    confidence public."MetricConfidence" DEFAULT 'ESTIMATED'::public."MetricConfidence" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RawPost; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RawPost" (
    id text NOT NULL,
    platform text NOT NULL,
    "nativeId" text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    content text NOT NULL,
    "contentType" text NOT NULL,
    url text,
    "mediaUrl" text,
    "postedAt" timestamp(3) without time zone NOT NULL,
    "collectedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "rawReach" integer,
    "rawLikes" integer,
    "rawReplies" integer,
    "rawReposts" integer,
    "rawClicks" integer,
    "rawOpens" integer,
    "rawComments" integer,
    "rawStars" integer,
    "rawForks" integer,
    "rawMetrics" jsonb,
    "extractedUrls" text[] DEFAULT ARRAY[]::text[],
    "rawHash" text NOT NULL,
    "normalizedToPostId" text
);


--
-- Name: Report; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Report" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    title text NOT NULL,
    period text NOT NULL,
    status text NOT NULL,
    summary text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RippleEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RippleEvent" (
    id text NOT NULL,
    "rootPostId" text NOT NULL,
    "parentId" text,
    "employeeId" text,
    actor text NOT NULL,
    platform public."Platform" NOT NULL,
    "eventType" text NOT NULL,
    "occurredAt" timestamp(3) without time zone NOT NULL,
    value integer NOT NULL,
    confidence public."MetricConfidence" NOT NULL
);


--
-- Name: SocialAccount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SocialAccount" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    platform public."Platform" NOT NULL,
    handle text NOT NULL,
    followers integer NOT NULL,
    confidence public."MetricConfidence" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Surface; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Surface" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "employeeId" text,
    platform public."Platform" NOT NULL,
    handle text NOT NULL,
    url text,
    present boolean DEFAULT true NOT NULL,
    status text DEFAULT 'VERIFIED'::text NOT NULL,
    followers integer DEFAULT 0 NOT NULL,
    confidence public."MetricConfidence" DEFAULT 'ESTIMATED'::public."MetricConfidence" NOT NULL,
    "lastScrapedAt" timestamp(3) without time zone,
    "attributionValue" text,
    opportunity text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TrackedRedirect; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TrackedRedirect" (
    id text NOT NULL,
    "shortId" text NOT NULL,
    "postId" text,
    "destinationUrl" text NOT NULL,
    "clickCount" integer DEFAULT 0 NOT NULL,
    "utmCampaign" text,
    "utmMedium" text,
    "utmContent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: AcquisitionJob AcquisitionJob_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcquisitionJob"
    ADD CONSTRAINT "AcquisitionJob_pkey" PRIMARY KEY (id);


--
-- Name: AcquisitionRoute AcquisitionRoute_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcquisitionRoute"
    ADD CONSTRAINT "AcquisitionRoute_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: ConversionEvent ConversionEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversionEvent"
    ADD CONSTRAINT "ConversionEvent_pkey" PRIMARY KEY (id);


--
-- Name: DataSource DataSource_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DataSource"
    ADD CONSTRAINT "DataSource_pkey" PRIMARY KEY (id);


--
-- Name: DiscoveredSurface DiscoveredSurface_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscoveredSurface"
    ADD CONSTRAINT "DiscoveredSurface_pkey" PRIMARY KEY (id);


--
-- Name: DiscoveryJob DiscoveryJob_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscoveryJob"
    ADD CONSTRAINT "DiscoveryJob_pkey" PRIMARY KEY (id);


--
-- Name: Employee Employee_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY (id);


--
-- Name: Experiment Experiment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Experiment"
    ADD CONSTRAINT "Experiment_pkey" PRIMARY KEY (id);


--
-- Name: Metric Metric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Metric"
    ADD CONSTRAINT "Metric_pkey" PRIMARY KEY (id);


--
-- Name: Play Play_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Play"
    ADD CONSTRAINT "Play_pkey" PRIMARY KEY (id);


--
-- Name: PostMetrics PostMetrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PostMetrics"
    ADD CONSTRAINT "PostMetrics_pkey" PRIMARY KEY (id);


--
-- Name: PostMetrics PostMetrics_postId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PostMetrics"
    ADD CONSTRAINT "PostMetrics_postId_key" UNIQUE ("postId");


--
-- Name: PostScores PostScores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PostScores"
    ADD CONSTRAINT "PostScores_pkey" PRIMARY KEY (id);


--
-- Name: PostScores PostScores_postId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PostScores"
    ADD CONSTRAINT "PostScores_postId_key" UNIQUE ("postId");


--
-- Name: Post Post_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY (id);


--
-- Name: ProviderBudget ProviderBudget_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProviderBudget"
    ADD CONSTRAINT "ProviderBudget_pkey" PRIMARY KEY (id);


--
-- Name: RawActivity RawActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RawActivity"
    ADD CONSTRAINT "RawActivity_pkey" PRIMARY KEY (id);


--
-- Name: RawPost RawPost_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RawPost"
    ADD CONSTRAINT "RawPost_pkey" PRIMARY KEY (id);


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- Name: RippleEvent RippleEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RippleEvent"
    ADD CONSTRAINT "RippleEvent_pkey" PRIMARY KEY (id);


--
-- Name: SocialAccount SocialAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SocialAccount"
    ADD CONSTRAINT "SocialAccount_pkey" PRIMARY KEY (id);


--
-- Name: Surface Surface_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Surface"
    ADD CONSTRAINT "Surface_pkey" PRIMARY KEY (id);


--
-- Name: TrackedRedirect TrackedRedirect_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TrackedRedirect"
    ADD CONSTRAINT "TrackedRedirect_pkey" PRIMARY KEY (id);


--
-- Name: AcquisitionJob_idempotencyKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AcquisitionJob_idempotencyKey_key" ON public."AcquisitionJob" USING btree ("idempotencyKey");


--
-- Name: AcquisitionJob_provider_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcquisitionJob_provider_status_idx" ON public."AcquisitionJob" USING btree (provider, status);


--
-- Name: AcquisitionJob_surfaceId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcquisitionJob_surfaceId_createdAt_idx" ON public."AcquisitionJob" USING btree ("surfaceId", "createdAt");


--
-- Name: AcquisitionRoute_platform_provider_routeOrder_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AcquisitionRoute_platform_provider_routeOrder_key" ON public."AcquisitionRoute" USING btree (platform, provider, "routeOrder");


--
-- Name: AcquisitionRoute_platform_routeOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcquisitionRoute_platform_routeOrder_idx" ON public."AcquisitionRoute" USING btree (platform, "routeOrder");


--
-- Name: Company_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Company_slug_key" ON public."Company" USING btree (slug);


--
-- Name: ConversionEvent_entityType_entityId_eventType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ConversionEvent_entityType_entityId_eventType_idx" ON public."ConversionEvent" USING btree ("entityType", "entityId", "eventType");


--
-- Name: ConversionEvent_occurredAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ConversionEvent_occurredAt_idx" ON public."ConversionEvent" USING btree ("occurredAt");


--
-- Name: DiscoveredSurface_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DiscoveredSurface_employeeId_idx" ON public."DiscoveredSurface" USING btree ("employeeId");


--
-- Name: DiscoveredSurface_employeeId_surface_handle_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DiscoveredSurface_employeeId_surface_handle_key" ON public."DiscoveredSurface" USING btree ("employeeId", surface, handle);


--
-- Name: DiscoveredSurface_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DiscoveredSurface_status_idx" ON public."DiscoveredSurface" USING btree (status);


--
-- Name: DiscoveredSurface_surface_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DiscoveredSurface_surface_idx" ON public."DiscoveredSurface" USING btree (surface);


--
-- Name: DiscoveryJob_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DiscoveryJob_employeeId_idx" ON public."DiscoveryJob" USING btree ("employeeId");


--
-- Name: DiscoveryJob_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DiscoveryJob_status_idx" ON public."DiscoveryJob" USING btree (status);


--
-- Name: Metric_employeeId_surfaceId_timeWindow_windowStart_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Metric_employeeId_surfaceId_timeWindow_windowStart_key" ON public."Metric" USING btree ("employeeId", "surfaceId", "timeWindow", "windowStart");


--
-- Name: Metric_employeeId_timeWindow_windowStart_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Metric_employeeId_timeWindow_windowStart_idx" ON public."Metric" USING btree ("employeeId", "timeWindow", "windowStart");


--
-- Name: Metric_surfaceId_timeWindow_windowStart_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Metric_surfaceId_timeWindow_windowStart_idx" ON public."Metric" USING btree ("surfaceId", "timeWindow", "windowStart");


--
-- Name: Post_campaign_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Post_campaign_idx" ON public."Post" USING btree (campaign);


--
-- Name: Post_employeeId_intentClass_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Post_employeeId_intentClass_idx" ON public."Post" USING btree ("employeeId", "intentClass");


--
-- Name: Post_employeeId_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Post_employeeId_publishedAt_idx" ON public."Post" USING btree ("employeeId", "publishedAt");


--
-- Name: Post_platform_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Post_platform_publishedAt_idx" ON public."Post" USING btree (platform, "publishedAt");


--
-- Name: Post_rawActivityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Post_rawActivityId_idx" ON public."Post" USING btree ("rawActivityId");


--
-- Name: Post_sourceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Post_sourceId_idx" ON public."Post" USING btree ("sourceId");


--
-- Name: Post_surfaceId_externalId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Post_surfaceId_externalId_idx" ON public."Post" USING btree ("surfaceId", "externalId");


--
-- Name: Post_surfaceId_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Post_surfaceId_publishedAt_idx" ON public."Post" USING btree ("surfaceId", "publishedAt");


--
-- Name: ProviderBudget_provider_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProviderBudget_provider_day_idx" ON public."ProviderBudget" USING btree (provider, day);


--
-- Name: ProviderBudget_provider_day_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ProviderBudget_provider_day_key" ON public."ProviderBudget" USING btree (provider, day);


--
-- Name: RawActivity_provider_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RawActivity_provider_publishedAt_idx" ON public."RawActivity" USING btree (provider, "publishedAt");


--
-- Name: RawActivity_surfaceId_externalId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RawActivity_surfaceId_externalId_key" ON public."RawActivity" USING btree ("surfaceId", "externalId");


--
-- Name: RawActivity_surfaceId_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RawActivity_surfaceId_publishedAt_idx" ON public."RawActivity" USING btree ("surfaceId", "publishedAt");


--
-- Name: RawPost_normalizedToPostId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RawPost_normalizedToPostId_key" ON public."RawPost" USING btree ("normalizedToPostId");


--
-- Name: RawPost_platform_entityId_postedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RawPost_platform_entityId_postedAt_idx" ON public."RawPost" USING btree (platform, "entityId", "postedAt");


--
-- Name: RawPost_rawHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RawPost_rawHash_key" ON public."RawPost" USING btree ("rawHash");


--
-- Name: Surface_companyId_platform_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Surface_companyId_platform_idx" ON public."Surface" USING btree ("companyId", platform);


--
-- Name: Surface_employeeId_platform_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Surface_employeeId_platform_idx" ON public."Surface" USING btree ("employeeId", platform);


--
-- Name: TrackedRedirect_shortId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TrackedRedirect_shortId_key" ON public."TrackedRedirect" USING btree ("shortId");


--
-- Name: AcquisitionJob AcquisitionJob_surfaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcquisitionJob"
    ADD CONSTRAINT "AcquisitionJob_surfaceId_fkey" FOREIGN KEY ("surfaceId") REFERENCES public."Surface"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DiscoveredSurface DiscoveredSurface_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscoveredSurface"
    ADD CONSTRAINT "DiscoveredSurface_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Employee Employee_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Experiment Experiment_ownerEmployeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Experiment"
    ADD CONSTRAINT "Experiment_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Experiment Experiment_playId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Experiment"
    ADD CONSTRAINT "Experiment_playId_fkey" FOREIGN KEY ("playId") REFERENCES public."Play"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Metric Metric_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Metric"
    ADD CONSTRAINT "Metric_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Metric Metric_surfaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Metric"
    ADD CONSTRAINT "Metric_surfaceId_fkey" FOREIGN KEY ("surfaceId") REFERENCES public."Surface"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PostMetrics PostMetrics_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PostMetrics"
    ADD CONSTRAINT "PostMetrics_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PostScores PostScores_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PostScores"
    ADD CONSTRAINT "PostScores_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Post Post_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Post Post_rawActivityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_rawActivityId_fkey" FOREIGN KEY ("rawActivityId") REFERENCES public."RawActivity"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Post Post_recommendedPlayId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_recommendedPlayId_fkey" FOREIGN KEY ("recommendedPlayId") REFERENCES public."Play"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Post Post_surfaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_surfaceId_fkey" FOREIGN KEY ("surfaceId") REFERENCES public."Surface"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RawActivity RawActivity_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RawActivity"
    ADD CONSTRAINT "RawActivity_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."AcquisitionJob"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RawActivity RawActivity_surfaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RawActivity"
    ADD CONSTRAINT "RawActivity_surfaceId_fkey" FOREIGN KEY ("surfaceId") REFERENCES public."Surface"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Report Report_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RippleEvent RippleEvent_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RippleEvent"
    ADD CONSTRAINT "RippleEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RippleEvent RippleEvent_rootPostId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RippleEvent"
    ADD CONSTRAINT "RippleEvent_rootPostId_fkey" FOREIGN KEY ("rootPostId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SocialAccount SocialAccount_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SocialAccount"
    ADD CONSTRAINT "SocialAccount_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Surface Surface_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Surface"
    ADD CONSTRAINT "Surface_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Surface Surface_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Surface"
    ADD CONSTRAINT "Surface_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AcquisitionJob; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."AcquisitionJob" ENABLE ROW LEVEL SECURITY;

--
-- Name: AcquisitionRoute; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."AcquisitionRoute" ENABLE ROW LEVEL SECURITY;

--
-- Name: Company; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Company" ENABLE ROW LEVEL SECURITY;

--
-- Name: ConversionEvent; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."ConversionEvent" ENABLE ROW LEVEL SECURITY;

--
-- Name: DataSource; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."DataSource" ENABLE ROW LEVEL SECURITY;

--
-- Name: DiscoveredSurface; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."DiscoveredSurface" ENABLE ROW LEVEL SECURITY;

--
-- Name: DiscoveryJob; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."DiscoveryJob" ENABLE ROW LEVEL SECURITY;

--
-- Name: Employee; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Employee" ENABLE ROW LEVEL SECURITY;

--
-- Name: Experiment; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Experiment" ENABLE ROW LEVEL SECURITY;

--
-- Name: Metric; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Metric" ENABLE ROW LEVEL SECURITY;

--
-- Name: Play; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Play" ENABLE ROW LEVEL SECURITY;

--
-- Name: Post; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Post" ENABLE ROW LEVEL SECURITY;

--
-- Name: PostMetrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."PostMetrics" ENABLE ROW LEVEL SECURITY;

--
-- Name: PostScores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."PostScores" ENABLE ROW LEVEL SECURITY;

--
-- Name: ProviderBudget; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."ProviderBudget" ENABLE ROW LEVEL SECURITY;

--
-- Name: RawActivity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."RawActivity" ENABLE ROW LEVEL SECURITY;

--
-- Name: RawPost; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."RawPost" ENABLE ROW LEVEL SECURITY;

--
-- Name: Report; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Report" ENABLE ROW LEVEL SECURITY;

--
-- Name: RippleEvent; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."RippleEvent" ENABLE ROW LEVEL SECURITY;

--
-- Name: SocialAccount; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."SocialAccount" ENABLE ROW LEVEL SECURITY;

--
-- Name: Surface; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Surface" ENABLE ROW LEVEL SECURITY;

--
-- Name: TrackedRedirect; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."TrackedRedirect" ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--



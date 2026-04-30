import assert from "node:assert/strict";

import type {
  AcquisitionJob,
  AcquisitionRoute,
  Company,
  ConversionEvent,
  DataSource,
  DiscoveredSurface,
  DiscoveryJob,
  Employee,
  Experiment,
  Metric,
  Play,
  Post,
  PostMetrics,
  PostScores,
  ProviderBudget,
  RawActivity,
  RawPost,
  Report,
  RippleEvent,
  SocialAccount,
  Surface,
  TrackedRedirect,
} from "@/lib/db-types";

// The point of this smoke test is the compile gate: each row type below
// is constructed with a fully-populated minimal instance. If the schema
// ever drifts away from db/db-types.ts, this file stops compiling and
// the gap is caught before any callsite migrates against a stale type.
//
// We also assert at runtime that null and undefined are distinguishable
// for nullable fields, so callsites that branch on `=== null` (which
// the migrated SQL queries will) don't silently pick up undefined and
// produce wrong behavior.

const now = new Date("2026-04-30T00:00:00Z");

const acquisitionJob: AcquisitionJob = {
  id: "j1",
  surfaceId: "s1",
  provider: "X_API",
  status: "QUEUED",
  idempotencyKey: null,
  attemptNumber: 0,
  windowStart: now,
  windowEnd: now,
  attempts: 0,
  nextAttemptAt: null,
  deadLetterAt: null,
  inngestRunId: null,
  rawCount: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  failureCode: null,
  failureReason: null,
  startedAt: null,
  completedAt: null,
  createdAt: now,
  updatedAt: now,
};
assert.equal(acquisitionJob.idempotencyKey, null);
assert.notEqual(acquisitionJob.idempotencyKey, undefined);

const acquisitionRoute: AcquisitionRoute = {
  id: "r1",
  platform: "X",
  provider: "X_API",
  routeOrder: 1,
  capability: "user timeline",
  requiredEnv: "X_API_KEY",
  confidence: "DIRECT",
  complianceNote: "official api",
  createdAt: now,
  updatedAt: now,
};
assert.equal(acquisitionRoute.platform, "X");

const company: Company = {
  id: "c1",
  name: "Every",
  domain: "every.to",
  website: "https://every.to",
  slug: null,
  description: null,
  youtubeSubscribers: null,
  youtubeViews: null,
  youtubeVideos: null,
  newsletterSubscribers: null,
  xFollowers: null,
  linkedinFollowers: null,
  githubRepos: null,
  productHuntProducts: null,
  podcastEpisodes: null,
  teamSize: null,
  publicFacingCount: null,
  createdAt: now,
  updatedAt: now,
};
assert.equal(company.slug, null);

const conversionEvent: ConversionEvent = {
  id: "ce1",
  redirectId: null,
  postId: null,
  entityType: "employee",
  entityId: "e1",
  eventType: "click",
  referrerUrl: null,
  utmCampaign: null,
  utmMedium: null,
  utmContent: null,
  userAgent: null,
  ipAddress: null,
  occurredAt: now,
};
assert.equal(conversionEvent.entityType, "employee");

const dataSource: DataSource = {
  id: "ds1",
  name: "X API",
  category: "social",
  readiness: "READY",
  confidence: "DIRECT",
  description: "official",
  createdAt: now,
  updatedAt: now,
};
assert.equal(dataSource.readiness, "READY");

const discoveredSurface: DiscoveredSurface = {
  id: "ds1",
  employeeId: "e1",
  surface: "x",
  label: "X",
  handle: null,
  url: null,
  status: "unknown",
  discoveryMethod: "search",
  discoveredAt: now,
  lastVerifiedAt: null,
  confidenceScore: 0,
  evidence: [],
  notes: null,
  searchQuery: null,
  searchRank: null,
  createdAt: now,
  updatedAt: now,
};
assert.deepEqual(discoveredSurface.evidence, []);

const discoveryJob: DiscoveryJob = {
  id: "dj1",
  jobType: "search",
  status: "pending",
  employeeId: null,
  surface: null,
  surfacesFound: 0,
  surfacesUpdated: 0,
  errors: [],
  startedAt: null,
  completedAt: null,
  createdAt: now,
};
assert.equal(discoveryJob.status, "pending");

const employee: Employee = {
  id: "e1",
  companyId: "c1",
  name: "Austin",
  role: "Head of Growth",
  archetype: null,
  dataReadiness: "PUBLIC_ONLY",
  primarySurface: "X",
  secondarySurface: "GITHUB",
  signatureMove: "tweet",
  opportunity: "newsletter",
  bestShot: "demo",
  bestAssist: "amplify",
  surfacePresence: 0,
  surfaceIQ: 0,
  trustGravity: 0,
  socialTS: 0,
  shotDistribution: {},
  xFollowers: null,
  isPublicFacing: false,
  recommendedPlayId: null,
  createdAt: now,
  updatedAt: now,
};
assert.equal(employee.primarySurface, "X");

const experiment: Experiment = {
  id: "ex1",
  playId: "p1",
  ownerEmployeeId: "e1",
  name: "exp",
  hypothesis: "h",
  status: "running",
  metric: "ctr",
  createdAt: now,
  updatedAt: now,
};
assert.equal(experiment.status, "running");

const metric: Metric = {
  id: "m1",
  employeeId: "e1",
  surfaceId: "s1",
  platform: "X",
  timeWindow: "7d",
  windowStart: now,
  windowEnd: null,
  posts: 0,
  views: 0,
  reach: 0,
  likes: 0,
  comments: 0,
  replies: 0,
  reposts: 0,
  quotes: 0,
  shares: 0,
  clicks: 0,
  profileVisits: 0,
  signups: 0,
  paidSubscriptions: 0,
  consultingLeads: 0,
  revenue: 0,
  assistedConversions: 0,
  surfaceIQ: 0,
  socialTS: 0,
  assistRate: 0,
  trustGravity: 0,
  totalAttempts: 0,
  threePtAttempts: 0,
  midAttempts: 0,
  paintAttempts: 0,
  ftAttempts: 0,
  ftMade: 0,
  passes: 0,
  turnovers: 0,
  threePtMade: 0,
  midMade: 0,
  paintMade: 0,
  threePtPct: 0,
  midPct: 0,
  paintPct: 0,
  fgPct: 0,
  effectiveFgPct: 0,
  trueShootingPct: 0,
  pacePerWeek: 0,
  brandTouchEvery: 0,
  brandTouchPersonal: 0,
  assistsCreated: 0,
  createdAt: now,
  updatedAt: now,
};
assert.equal(metric.windowEnd, null);

const play: Play = {
  id: "p1",
  name: "demo-day",
  bestFor: "launch",
  bestPlatforms: ["X", "LINKEDIN"],
  structure: "hook + cta",
  whyItWorks: "intent",
  historicalSignal: "demo viewers convert",
  recommendedNextExperiment: "router page",
};
assert.deepEqual(play.bestPlatforms, ["X", "LINKEDIN"]);

const post: Post = {
  id: "post1",
  employeeId: "e1",
  surfaceId: null,
  text: "hello",
  platform: "X",
  contentType: "text",
  archetype: "free-throw",
  campaign: "—",
  ctaType: "—",
  brandTouch: "personal",
  product: "every",
  launchWindow: false,
  publishedAt: now,
  x: 50,
  y: 47,
  zone: "midRange",
  advancedZone: "elbow",
  intentClass: "PASS",
  intentConfidence: 0,
  outcome: "MISSED",
  recovered: false,
  isAssist: false,
  classifiedAt: null,
  classifiedBy: null,
  confidence: "DIRECT",
  externalId: null,
  permalink: null,
  rawActivityId: null,
  acquiredVia: null,
  acquiredAt: null,
  sourceId: null,
  recommendedPlayId: null,
  createdAt: now,
  updatedAt: now,
};
assert.equal(post.intentClass, "PASS");
assert.equal(post.acquiredVia, null);

const postMetrics: PostMetrics = {
  id: "pm1",
  postId: "post1",
  views: 0,
  reach: 0,
  likes: 0,
  comments: 0,
  replies: 0,
  reposts: 0,
  quotes: 0,
  shares: 0,
  clicks: 0,
  profileVisits: 0,
  signups: 0,
  paidSubscriptions: 0,
  consultingLeads: 0,
  revenue: 0,
  assistedConversions: 0,
};
assert.equal(postMetrics.postId, "post1");

const postScores: PostScores = {
  id: "ps1",
  postId: "post1",
  awareness: 0,
  engagement: 0,
  trust: 0,
  clicks: 0,
  signups: 0,
  paid: 0,
  consulting: 0,
  revenue: 0,
  assists: 0,
  surfaceIQ: 0,
  socialTS: 0,
  assistRate: 0,
  trustGravity: 0,
  humanHalo: 0,
};
assert.equal(postScores.postId, "post1");

const providerBudget: ProviderBudget = {
  id: "pb1",
  provider: "X_API",
  day: now,
  used: 0,
  cap: 100,
  createdAt: now,
  updatedAt: now,
};
assert.equal(providerBudget.cap, 100);

const rawActivity: RawActivity = {
  id: "ra1",
  surfaceId: "s1",
  jobId: null,
  provider: "X_API",
  externalId: "ext1",
  permalink: null,
  publishedAt: now,
  text: "raw text",
  rawMetrics: {},
  rawPayload: {},
  citations: [],
  basis: null,
  confidence: "DIRECT",
  createdAt: now,
  updatedAt: now,
};
assert.equal(rawActivity.basis, null);

const rawPost: RawPost = {
  id: "rp1",
  platform: "x",
  nativeId: "1234",
  entityType: "employee",
  entityId: "e1",
  content: "hi",
  contentType: "text",
  url: null,
  mediaUrl: null,
  postedAt: now,
  collectedAt: now,
  rawReach: null,
  rawLikes: null,
  rawReplies: null,
  rawReposts: null,
  rawClicks: null,
  rawOpens: null,
  rawComments: null,
  rawStars: null,
  rawForks: null,
  rawMetrics: null,
  extractedUrls: [],
  rawHash: "abc",
  normalizedToPostId: null,
};
assert.equal(rawPost.rawHash, "abc");

const report: Report = {
  id: "rep1",
  companyId: "c1",
  title: "Q1",
  period: "Q1-2026",
  status: "draft",
  summary: "summary",
  createdAt: now,
  updatedAt: now,
};
assert.equal(report.title, "Q1");

const rippleEvent: RippleEvent = {
  id: "re1",
  rootPostId: "post1",
  parentId: null,
  employeeId: null,
  actor: "@dan",
  platform: "X",
  eventType: "amplify",
  occurredAt: now,
  value: 1,
  confidence: "ESTIMATED",
};
assert.equal(rippleEvent.actor, "@dan");

const socialAccount: SocialAccount = {
  id: "sa1",
  employeeId: "e1",
  platform: "X",
  handle: "@tedescau",
  followers: 0,
  confidence: "DIRECT",
  createdAt: now,
  updatedAt: now,
};
assert.equal(socialAccount.handle, "@tedescau");

const surface: Surface = {
  id: "s1",
  companyId: "c1",
  employeeId: null,
  platform: "X",
  handle: "@every",
  url: null,
  present: true,
  status: "VERIFIED",
  followers: 0,
  confidence: "ESTIMATED",
  lastScrapedAt: null,
  attributionValue: null,
  opportunity: null,
  createdAt: now,
  updatedAt: now,
};
assert.equal(surface.status, "VERIFIED");

const trackedRedirect: TrackedRedirect = {
  id: "tr1",
  shortId: "abc123",
  postId: null,
  destinationUrl: "https://every.to",
  clickCount: 0,
  utmCampaign: null,
  utmMedium: null,
  utmContent: null,
  createdAt: now,
};
assert.equal(trackedRedirect.shortId, "abc123");

console.log("✓ all 22 db-types row shapes round-tripped");

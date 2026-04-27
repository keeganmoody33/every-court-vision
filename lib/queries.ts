import "server-only";

import { Platform as DbPlatform } from "@prisma/client";

import { filterPosts } from "@/lib/aggregations";
import { policiesForPlatform } from "@/lib/acquisition/policies";
import { providerLabel, statusLabel } from "@/lib/acquisition/platform";
import { defaultFilters } from "@/lib/constants";
import { db } from "@/lib/db";
import type {
  AcquisitionProvider,
  AcquisitionRouteSummary,
  AcquisitionStatus,
  AcquisitionSurfaceRow,
  DataSource,
  Employee,
  EmployeeWithSurfaces,
  EmployeeWithSurfacesAndMetrics,
  Experiment,
  FilterState,
  MetricConfidence,
  Platform,
  Play,
  Post,
  PostMetrics,
  PostScores,
  PostWithEmployee,
  RippleEvent,
  SocialAccount,
  Surface,
} from "@/lib/types";

// Callers that import this file must use Node runtime:
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

type SearchParamsLike = Record<string, string | string[] | undefined> | URLSearchParams | undefined;

const platformFromDb: Record<DbPlatform, Platform> = {
  X: "X",
  LINKEDIN: "LinkedIn",
  GITHUB: "GitHub",
  INSTAGRAM: "Instagram",
  NEWSLETTER: "Newsletter",
  YOUTUBE: "YouTube",
  PODCAST: "Podcast",
  LAUNCHES: "Launches",
  TEAMMATE_AMPLIFICATION: "Teammate Amplification",
  EXTERNAL_AMPLIFICATION: "External Amplification",
  PRODUCT_HUNT: "Product Hunt",
  PERSONAL_SITE: "Personal Site",
  TIKTOK: "TikTok",
  WEBSITE: "Website",
  SUBSTACK: "Substack",
  APP_STORE: "App Store",
  REFERRAL: "Referral",
  CONSULTING: "Consulting",
};

const confidenceFromDb: Record<string, MetricConfidence> = {
  DIRECT: "Direct",
  ESTIMATED: "Estimated",
  MODELED: "Modeled",
  HYPOTHESIS: "Hypothesis",
  NEEDS_INTERNAL_ANALYTICS: "Needs Internal Analytics",
};

const sourceReadinessFromDb: Record<string, DataSource["readiness"]> = {
  READY: "Ready",
  MANUAL_IMPORT: "Manual Import",
  NEEDS_OAUTH: "Needs OAuth",
  FUTURE: "Future",
};

const emptyMetrics: PostMetrics = {
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

const emptyScores: PostScores = {
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

function getParam(searchParams: SearchParamsLike, key: keyof FilterState) {
  if (!searchParams) return undefined;
  if (searchParams instanceof URLSearchParams) return searchParams.get(key) ?? undefined;
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function filtersFromSearchParams(searchParams: SearchParamsLike): FilterState {
  return {
    ...defaultFilters,
    timeWindow: (getParam(searchParams, "timeWindow") as FilterState["timeWindow"]) ?? defaultFilters.timeWindow,
    entity: (getParam(searchParams, "entity") as FilterState["entity"]) ?? defaultFilters.entity,
    surface: (getParam(searchParams, "surface") as FilterState["surface"]) ?? defaultFilters.surface,
    scoringMode: (getParam(searchParams, "scoringMode") as FilterState["scoringMode"]) ?? defaultFilters.scoringMode,
    viewMode: (getParam(searchParams, "viewMode") as FilterState["viewMode"]) ?? defaultFilters.viewMode,
    attribution: (getParam(searchParams, "attribution") as FilterState["attribution"]) ?? defaultFilters.attribution,
    zoneMode: (getParam(searchParams, "zoneMode") as FilterState["zoneMode"]) ?? defaultFilters.zoneMode,
    colorScale: (getParam(searchParams, "colorScale") as FilterState["colorScale"]) ?? defaultFilters.colorScale,
  };
}

function shotDistributionFromJson(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === "number"),
  );
}

function mapAccount(account: {
  id: string;
  employeeId: string;
  platform: DbPlatform;
  handle: string;
  followers: number;
  confidence: string;
}): SocialAccount {
  return {
    id: account.id,
    employeeId: account.employeeId,
    platform: platformFromDb[account.platform],
    handle: account.handle,
    followers: account.followers,
    confidence: confidenceFromDb[account.confidence] ?? "Estimated",
  };
}

function mapSurface(surface: {
  id: string;
  employeeId: string | null;
  platform: DbPlatform;
  handle: string;
  url: string | null;
  followers: number;
  confidence: string;
  attributionValue: string | null;
  opportunity: string | null;
}): Surface {
  return {
    id: surface.id,
    employeeId: surface.employeeId ?? undefined,
    platform: platformFromDb[surface.platform],
    handle: surface.handle,
    url: surface.url ?? undefined,
    followers: surface.followers,
    confidence: confidenceFromDb[surface.confidence] ?? "Estimated",
    attributionValue: surface.attributionValue ?? undefined,
    opportunity: surface.opportunity ?? undefined,
  };
}

function mapEmployee(employee: {
  id: string;
  name: string;
  role: string;
  archetype: string | null;
  primarySurface: DbPlatform;
  secondarySurface: DbPlatform;
  signatureMove: string;
  opportunity: string;
  bestShot: string;
  bestAssist: string;
  surfacePresence: number;
  surfaceIQ: number;
  trustGravity: number;
  socialTS: number;
  shotDistribution: unknown;
  recommendedPlayId: string | null;
  dataReadiness: string;
  accounts?: Parameters<typeof mapAccount>[0][];
  surfaces?: Parameters<typeof mapSurface>[0][];
  _count?: { posts: number };
}): EmployeeWithSurfaces {
  return {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    archetype: employee.archetype ?? "Surface Pending",
    primarySurface: platformFromDb[employee.primarySurface],
    secondarySurface: platformFromDb[employee.secondarySurface],
    signatureMove: employee.signatureMove,
    opportunity: employee.opportunity,
    bestShot: employee.bestShot,
    bestAssist: employee.bestAssist,
    surfacePresence: employee.surfacePresence,
    surfaceIQ: employee.surfaceIQ,
    trustGravity: employee.trustGravity,
    socialTS: employee.socialTS,
    shotDistribution: shotDistributionFromJson(employee.shotDistribution),
    recommendedPlayId: employee.recommendedPlayId ?? "play-soft-cta",
    accounts: employee.accounts?.map(mapAccount) ?? [],
    surfaces: employee.surfaces?.map(mapSurface) ?? [],
    postCount: employee._count?.posts ?? 0,
    dataReadiness: employee.dataReadiness as EmployeeWithSurfaces["dataReadiness"],
  };
}

function mapPost(post: {
  id: string;
  employeeId: string;
  text: string;
  platform: DbPlatform;
  contentType: string;
  archetype: string;
  campaign: string;
  ctaType: string;
  brandTouch: string;
  product: string;
  launchWindow: boolean;
  publishedAt: Date;
  x: number;
  y: number;
  zone: string;
  advancedZone: string;
  confidence: string;
  recommendedPlayId: string | null;
  metrics: (PostMetrics & { id?: string; postId?: string }) | null;
  scores: (PostScores & { id?: string; postId?: string }) | null;
  employee?: Parameters<typeof mapEmployee>[0];
}): PostWithEmployee {
  return {
    id: post.id,
    employeeId: post.employeeId,
    text: post.text,
    platform: platformFromDb[post.platform],
    contentType: post.contentType as Post["contentType"],
    archetype: post.archetype,
    campaign: post.campaign,
    ctaType: post.ctaType,
    brandTouch: post.brandTouch as Post["brandTouch"],
    product: post.product,
    launchWindow: post.launchWindow,
    timestamp: post.publishedAt.toISOString(),
    x: post.x,
    y: post.y,
    zone: post.zone,
    advancedZone: post.advancedZone,
    confidence: confidenceFromDb[post.confidence] ?? "Estimated",
    metrics: post.metrics ?? emptyMetrics,
    scores: post.scores ?? emptyScores,
    recommendedPlayId: post.recommendedPlayId ?? "play-soft-cta",
    employee: post.employee ? mapEmployee(post.employee) : undefined,
  };
}

function mapRippleEvent(event: {
  id: string;
  rootPostId: string;
  parentId: string | null;
  employeeId: string | null;
  actor: string;
  platform: DbPlatform;
  eventType: string;
  occurredAt: Date;
  value: number;
  confidence: string;
}): RippleEvent {
  return {
    id: event.id,
    rootPostId: event.rootPostId,
    parentId: event.parentId ?? undefined,
    employeeId: event.employeeId ?? undefined,
    actor: event.actor,
    platform: platformFromDb[event.platform],
    eventType: event.eventType,
    timestamp: event.occurredAt.toISOString(),
    value: event.value,
    confidence: confidenceFromDb[event.confidence] ?? "Estimated",
  };
}

export async function getRoster(): Promise<EmployeeWithSurfaces[]> {
  const employees = await db.employee.findMany({
    include: {
      accounts: true,
      surfaces: true,
      _count: { select: { posts: true } },
    },
    orderBy: [{ socialTS: "desc" }, { name: "asc" }],
  });

  return employees.map(mapEmployee);
}

export async function getEmployee(id: string): Promise<EmployeeWithSurfacesAndMetrics | null> {
  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      accounts: true,
      surfaces: true,
      metrics: true,
      _count: { select: { posts: true } },
    },
  });

  if (!employee) return null;
  return {
    ...mapEmployee(employee),
    metrics: employee.metrics.map((metric) => ({
      segment: platformFromDb[metric.platform],
      posts: metric.posts,
      views: metric.views,
      likes: metric.likes,
      comments: metric.comments,
      replies: metric.replies,
      reposts: metric.reposts,
      quotes: metric.quotes,
      shares: metric.shares,
      clicks: metric.clicks,
      signups: metric.signups,
      paid: metric.paidSubscriptions,
      consulting: metric.consultingLeads,
      revenue: metric.revenue,
      surfaceIQ: metric.surfaceIQ,
      socialTS: metric.socialTS,
      signupRate: metric.views ? (metric.signups / metric.views) * 100 : 0,
      paidConversionRate: metric.signups ? (metric.paidSubscriptions / metric.signups) * 100 : 0,
      consultingIntentRate: metric.clicks ? (metric.consultingLeads / metric.clicks) * 100 : 0,
      assistRate: metric.assistRate,
      ctaEfficiency: metric.clicks
        ? ((metric.signups + metric.paidSubscriptions + metric.consultingLeads) / metric.clicks) * 100
        : 0,
      trustGravity: metric.trustGravity,
      humanHalo: 0,
      revenuePerPost: metric.posts ? metric.revenue / metric.posts : 0,
      conversionPer1KViews: metric.views
        ? ((metric.signups + metric.paidSubscriptions + metric.consultingLeads) / metric.views) * 1000
        : 0,
      diffusionDepth: metric.assistedConversions / Math.max(1, metric.posts),
    })),
  };
}

export async function getPosts(filters: FilterState): Promise<PostWithEmployee[]> {
  const posts = await db.post.findMany({
    include: {
      metrics: true,
      scores: true,
      employee: {
        include: {
          accounts: true,
          surfaces: true,
          _count: { select: { posts: true } },
        },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  return filterPosts(posts.map(mapPost), filters);
}

export async function getRippleEvents(filters: FilterState): Promise<RippleEvent[]> {
  const [events, posts] = await Promise.all([
    db.rippleEvent.findMany({ orderBy: { occurredAt: "asc" } }),
    getPosts(filters),
  ]);
  const postIds = new Set(posts.map((post) => post.id));
  return events.filter((event) => postIds.has(event.rootPostId)).map(mapRippleEvent);
}

export async function getPlays(): Promise<Play[]> {
  const plays = await db.play.findMany({ orderBy: { name: "asc" } });
  return plays.map((play) => ({
    id: play.id,
    name: play.name,
    bestFor: play.bestFor,
    bestPlatforms: play.bestPlatforms.map((platform) => platformFromDb[platform]),
    structure: play.structure,
    whyItWorks: play.whyItWorks,
    historicalSignal: play.historicalSignal,
    recommendedNextExperiment: play.recommendedNextExperiment,
  }));
}

export async function getExperiments(): Promise<Experiment[]> {
  const experiments = await db.experiment.findMany({ orderBy: { createdAt: "desc" } });
  return experiments.map((experiment) => ({
    id: experiment.id,
    playId: experiment.playId,
    name: experiment.name,
    hypothesis: experiment.hypothesis,
    ownerEmployeeId: experiment.ownerEmployeeId,
    status: experiment.status as Experiment["status"],
    metric: experiment.metric as Experiment["metric"],
  }));
}

export async function getDataSources(): Promise<DataSource[]> {
  const sources = await db.dataSource.findMany({ orderBy: { name: "asc" } });
  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    category: source.category as DataSource["category"],
    readiness: sourceReadinessFromDb[source.readiness] ?? "Future",
    confidence: confidenceFromDb[source.confidence] ?? "Estimated",
    description: source.description,
  }));
}

function acquisitionRouteSummary(route: {
  provider: string;
  routeOrder: number;
  capability: string;
  requiredEnv: string | null;
  confidence: string;
  complianceNote: string;
}): AcquisitionRouteSummary {
  return {
    provider: providerLabel(route.provider) as AcquisitionProvider,
    routeOrder: route.routeOrder,
    capability: route.capability,
    requiredEnv: route.requiredEnv ?? undefined,
    confidence: confidenceFromDb[route.confidence] ?? "Estimated",
    complianceNote: route.complianceNote,
  };
}

export async function getAcquisitionRows(): Promise<AcquisitionSurfaceRow[]> {
  const surfaces = await db.surface.findMany({
    include: {
      employee: true,
      posts: { select: { id: true } },
      rawActivities: { select: { id: true } },
      acquisitionJobs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ employee: { name: "asc" } }, { platform: "asc" }],
  });

  const routeRows = await db.acquisitionRoute.findMany({ orderBy: [{ platform: "asc" }, { routeOrder: "asc" }] });
  const routesByPlatform = new Map<string, typeof routeRows>();
  for (const route of routeRows) {
    const routes = routesByPlatform.get(route.platform) ?? [];
    routes.push(route);
    routesByPlatform.set(route.platform, routes);
  }

  return surfaces.map((surface) => {
    const seededRoutes = routesByPlatform.get(surface.platform);
    const fallbackRoutes =
      seededRoutes?.length
        ? seededRoutes
        : policiesForPlatform(surface.platform).map((route) => ({
            provider: route.provider,
            routeOrder: route.routeOrder,
            capability: route.capability,
            requiredEnv: route.requiredEnv ?? null,
            confidence: route.confidence,
            complianceNote: route.complianceNote,
          }));
    const lastJob = surface.acquisitionJobs[0];
    const postCount = surface.posts.length;
    const rawActivityCount = surface.rawActivities.length;
    const primaryRoute = fallbackRoutes[0] ? acquisitionRouteSummary(fallbackRoutes[0]) : undefined;
    const nextFallback = fallbackRoutes[1] ? acquisitionRouteSummary(fallbackRoutes[1]) : undefined;
    const manualRequired = fallbackRoutes[0]?.provider === "MANUAL" || surface.platform === "LINKEDIN";
    const coverageStatus =
      postCount > 0
        ? "Live coverage"
        : manualRequired
          ? "Manual import required"
          : lastJob
            ? "Needs acquisition"
            : "Awaiting acquisition";

    return {
      surfaceId: surface.id,
      employeeId: surface.employeeId ?? undefined,
      employeeName: surface.employee?.name ?? "Company",
      platform: platformFromDb[surface.platform],
      handle: surface.handle,
      url: surface.url ?? undefined,
      confidence: confidenceFromDb[surface.confidence] ?? "Estimated",
      postCount,
      rawActivityCount,
      lastRunAt: lastJob?.completedAt?.toISOString() ?? lastJob?.createdAt.toISOString(),
      lastProvider: lastJob ? (providerLabel(lastJob.provider) as AcquisitionProvider) : undefined,
      lastStatus: lastJob ? (statusLabel(lastJob.status) as AcquisitionStatus) : undefined,
      failureReason: lastJob?.failureReason ?? undefined,
      routeCount: fallbackRoutes.length,
      primaryRoute,
      nextFallback,
      coverageStatus,
    };
  });
}

export function employeeMapFromRoster(roster: Employee[]): Record<string, Employee> {
  return Object.fromEntries(roster.map((employee) => [employee.id, employee]));
}

export function playMapFromPlays(plays: Play[]): Record<string, Play> {
  return Object.fromEntries(plays.map((play) => [play.id, play]));
}

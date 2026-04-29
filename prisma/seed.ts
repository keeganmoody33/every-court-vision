import { config } from "dotenv";

import { PrismaPg } from "@prisma/adapter-pg";
import { MetricConfidence, Platform, PrismaClient, SourceReadiness } from "@prisma/client";

import { companySurfaceFixtures, intelEmployeeFixtures } from "@/prisma/fixtures/intel-report";
import {
  rosterAnalyticsFixtures,
  type RosterAnalyticsFixture,
  type SurfaceAnalyticsFixture,
} from "@/prisma/fixtures/roster-analytics";
import { acquisitionPolicies } from "@/lib/acquisition/policies";
import { platformFromDb } from "@/lib/acquisition/platform";
import { classifyIntent } from "@/lib/intent/classify";
import { postToCoord } from "@/lib/intent/courtMapping";
import { intentClassFromDb, intentClassToDb, shotOutcomeFromDb, shotOutcomeToDb } from "@/lib/intent/dbMapping";
import { computeIntentMetrics } from "@/lib/intent/metrics";
import { classifyOutcome } from "@/lib/intent/outcome";
import type { Platform as AppPlatform, PostMetrics, PostScores } from "@/lib/types";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const plays = [
  {
    id: "play-soft-cta",
    name: "Soft CTA After Trust Post",
    bestFor: "Personal AI observations and operator lessons",
    bestPlatforms: ["X", "LINKEDIN", "NEWSLETTER"],
    structure: "Trust-building post first, low-friction newsletter bridge second, explicit CTA only after replies show intent.",
    whyItWorks: "It preserves the post's native feel while giving high-intent readers a clear next step.",
    historicalSignal: "Personal AI posts generated 2.3x more assisted signups when followed by a soft CTA within 24 hours.",
    recommendedNextExperiment: "Pair one high-trust Austin X thread with a newsletter reply CTA and teammate quote within two hours.",
  },
  {
    id: "play-teammate-alley-oop",
    name: "Teammate Alley-Oop",
    bestFor: "Founder narrative, launches, and category creation",
    bestPlatforms: ["X", "LINKEDIN", "TEAMMATE_AMPLIFICATION"],
    structure: "Root narrative from Dan, teammate quote-post with practical takeaway, follow-up reply pointing to owned surface.",
    whyItWorks: "The teammate adds proof and specificity without making the founder post feel like an ad.",
    historicalSignal: "Dan posts with teammate quote support produced 31% higher assisted conversions than solo posts.",
    recommendedNextExperiment: "Pre-brief two teammate quote angles before the next Every launch essay.",
  },
  {
    id: "play-linkedin-wedge",
    name: "LinkedIn Consulting Wedge",
    bestFor: "B2B intent and operator proof",
    bestPlatforms: ["LINKEDIN"],
    structure: "Operator pain, Every method, concrete example, light invitation to discuss consulting.",
    whyItWorks: "LinkedIn reach is lower, but the audience has more budget authority and problem awareness.",
    historicalSignal: "Consulting posts with real operator framing converted at 4.7x the surface average.",
    recommendedNextExperiment: "Run two Austin LinkedIn posts with different wedges: automation audit vs AI operating system.",
  },
  {
    id: "play-human-halo",
    name: "Human Halo",
    bestFor: "Human affinity and trust around technical work",
    bestPlatforms: ["INSTAGRAM", "X", "PODCAST"],
    structure: "Personal story, taste or belief, proof of work, no immediate conversion ask.",
    whyItWorks: "It builds familiarity that makes later conversion posts feel less cold.",
    historicalSignal: "Human Halo posts rarely close directly but show strong hockey assists 7 to 14 days later.",
    recommendedNextExperiment: "Use one behind-the-scenes product note before a product CTA push.",
  },
  {
    id: "play-launch-rotation",
    name: "Launch Rotation",
    bestFor: "Product and content launches",
    bestPlatforms: ["LAUNCHES", "X", "NEWSLETTER", "LINKEDIN"],
    structure: "Founder announcement, growth operator explanation, builder proof, external amplification target list.",
    whyItWorks: "Different surfaces cover awareness, proof, conversion, and credibility in sequence.",
    historicalSignal: "Launch windows show the best spacing and highest assisted conversion density.",
    recommendedNextExperiment: "Schedule founder, growth, and builder posts across a 36-hour launch rotation.",
  },
  {
    id: "play-newsletter-bridge",
    name: "Newsletter Conversion Bridge",
    bestFor: "Turning social trust into owned audience",
    bestPlatforms: ["X", "LINKEDIN", "NEWSLETTER"],
    structure: "Social insight, specific newsletter promise, landing link, teammate reply reinforcing why to subscribe.",
    whyItWorks: "It makes the owned channel feel like the next chapter instead of a generic signup ask.",
    historicalSignal: "Social posts with newsletter-specific promise beat generic signup CTAs by 38%.",
    recommendedNextExperiment: "Attach a newsletter promise to Austin's top X growth thread each week.",
  },
  {
    id: "play-github-linkedin-proof",
    name: "GitHub-to-LinkedIn Technical Proof",
    bestFor: "Technical credibility and consulting trust",
    bestPlatforms: ["GITHUB", "LINKEDIN"],
    structure: "Ship technical proof in public, translate the lesson into operator language on LinkedIn.",
    whyItWorks: "GitHub proves depth while LinkedIn makes the business implication legible.",
    historicalSignal: "Technical proof posts created fewer clicks but stronger consulting intent.",
    recommendedNextExperiment: "Turn the next repo note into a LinkedIn operator post within 48 hours.",
  },
] as const;

const dataSources = [
  ["source-public", "Public Surface Data", "Public Surface Data", "READY", "ESTIMATED", "Visible post metadata, public engagement, reposts, replies, and surface-level diffusion."],
  ["source-auth", "Authenticated Platform Data", "Authenticated Platform Data", "NEEDS_OAUTH", "DIRECT", "Private impressions, profile visits, detailed audience splits, and verified click events."],
  ["source-internal", "Internal Analytics", "Internal Analytics", "FUTURE", "NEEDS_INTERNAL_ANALYTICS", "Newsletter analytics, Stripe, CRM, UTM shortener, web analytics, and revenue attribution."],
  ["source-modeled", "Modeled Intelligence", "Modeled Intelligence", "MANUAL_IMPORT", "MODELED", "Assisted conversion estimates, trust gravity, hockey assists, and diffusion path inference."],
  ["source-x-api", "X API", "Authenticated Platform Data", "NEEDS_OAUTH", "DIRECT", "Impressions, engagements, replies, reposts, quote posts, and profile-click estimates."],
  ["source-linkedin", "LinkedIn API / Manual Import", "Authenticated Platform Data", "MANUAL_IMPORT", "DIRECT", "B2B intent, profile visits, company engagement, lead comments, and consulting signals."],
  ["source-github", "GitHub API", "Public Surface Data", "READY", "DIRECT", "Stars, forks, contributors, issues, repo traffic where available, and technical credibility signals."],
  ["source-instagram", "Instagram Graph API", "Authenticated Platform Data", "NEEDS_OAUTH", "DIRECT", "Human affinity, reach, saves, shares, and follower profile signals."],
  ["source-newsletter", "Newsletter Platform", "Internal Analytics", "FUTURE", "DIRECT", "Opens, clicks, signups, paid conversions, source tags, and subscriber cohorts."],
  ["source-stripe", "Stripe", "Internal Analytics", "FUTURE", "DIRECT", "Paid subscriptions, revenue, customer cohorts, and subscription expansion."],
  ["source-crm", "CRM", "Internal Analytics", "FUTURE", "DIRECT", "Consulting leads, opportunity stage, deal value, and closed revenue."],
  ["source-web", "Web Analytics", "Internal Analytics", "FUTURE", "DIRECT", "Landing-page paths, UTMs, referrers, sessions, and conversion funnels."],
  ["source-utm", "UTM Shortener", "Internal Analytics", "FUTURE", "DIRECT", "Per-post tracked links for attribution across platforms and campaigns."],
] as const;

const targetPostCounts: Record<string, number> = {
  "austin-tedesco": 10,
  "dan-shipper": 75,
  "kieran-klaassen": 17,
  "yash-poojary": 21,
  "naveen-naidu": 15,
  "kate-lee": 26,
  "katie-parrott": 19,
  "laura-entis": 17,
};

const extractedPostBodies: Record<string, string[]> = {
  "austin-tedesco": [
    "The best AI consulting pitch is not 'we use AI.' It is 'we can show your team the repetitive decision loops already costing you margin.'",
    "Most growth teams do not need more channels. They need a better read on which existing trust surfaces are already creating demand.",
    "We opened a few slots for AI workflow audits. If you want a sharper operating system, start here.",
    "The useful framing in Dan's essay: founder-led content is not distribution theater. It is market education with attribution lag.",
  ],
  "dan-shipper": [
    "The next wave of AI companies will not just sell tools. They will sell new operating rhythms.",
    "A founder's job is to make the company easier to believe in before it is easy to measure.",
    "Podcast clip: why AI workflows fail when teams automate tasks before they understand taste.",
    "External founder reposted Dan's category essay with a note about how Every explains AI work better than vendors do.",
  ],
  "kieran-klaassen": [
    "Good product taste is often just noticing which parts of the workflow make smart people feel clumsy.",
    "Released a small internal eval harness pattern for checking AI workflow quality before demos become promises.",
    "Design note: an AI product earns trust when it shows uncertainty without making the user do extra work.",
    "Product diary from launch week: the most useful thing we shipped was the part that made edge cases visible.",
  ],
};

function toDbPlatform(platform: AppPlatform): Platform {
  const map: Record<AppPlatform, Platform> = {
    X: "X",
    LinkedIn: "LINKEDIN",
    GitHub: "GITHUB",
    Instagram: "INSTAGRAM",
    Newsletter: "NEWSLETTER",
    YouTube: "YOUTUBE",
    Podcast: "PODCAST",
    Launches: "LAUNCHES",
    "Teammate Amplification": "TEAMMATE_AMPLIFICATION",
    "External Amplification": "EXTERNAL_AMPLIFICATION",
    "Product Hunt": "PRODUCT_HUNT",
    "Personal Site": "PERSONAL_SITE",
    TikTok: "TIKTOK",
    Website: "WEBSITE",
    Substack: "SUBSTACK",
    "App Store": "APP_STORE",
    Referral: "REFERRAL",
    Consulting: "CONSULTING",
  };

  return map[platform];
}

function confidenceToDb(confidence = "Estimated"): MetricConfidence {
  const map: Record<string, MetricConfidence> = {
    Direct: "DIRECT",
    Estimated: "ESTIMATED",
    Modeled: "MODELED",
    Hypothesis: "HYPOTHESIS",
    "Needs Internal Analytics": "NEEDS_INTERNAL_ANALYTICS",
  };

  return map[confidence] ?? "ESTIMATED";
}

function weightedSurfaceEntries(analytics: RosterAnalyticsFixture, target: number) {
  const entries = Object.entries(analytics.surfaces)
    .map(([key, surface]) => {
      const fallback = key === "newsletter" ? 18 : key === "github" ? 6 : key === "podcast" ? 10 : 0;
      return { key, surface, weight: surface.postsLast90Days ?? fallback };
    })
    .filter((entry) => entry.weight > 0);

  const total = entries.reduce((sum, entry) => sum + entry.weight, 0) || 1;
  const provisional = entries.map((entry) => ({
    ...entry,
    count: Math.max(1, Math.round((entry.weight / total) * target)),
  }));

  let delta = target - provisional.reduce((sum, entry) => sum + entry.count, 0);
  let index = 0;
  while (delta !== 0 && provisional.length) {
    const entry = provisional[index % provisional.length];
    if (delta > 0) {
      entry.count += 1;
      delta -= 1;
    } else if (entry.count > 1) {
      entry.count -= 1;
      delta += 1;
    }
    index += 1;
  }

  return provisional;
}

function shotSequence(surface: SurfaceAnalyticsFixture) {
  const distribution = surface.shotDistribution ?? {
    midrange_philosophy: 4,
    freethrow_personal: 3,
    assist_industry: 2,
    three_pointer_promo: 1,
  };
  return Object.entries(distribution).flatMap(([shotType, count]) => Array.from({ length: Math.max(1, count) }, () => shotType));
}

function cleanShotText(text: string) {
  return text.replace(/^(3P|MID|FT|AST|AIR):\s*/i, "").replace(/[<>]/g, "").trim();
}

function postText(employeeId: string, surfaceKey: string, surface: SurfaceAnalyticsFixture, shotType: string, index: number) {
  const extracted = extractedPostBodies[employeeId]?.[index];
  if (extracted) return extracted;

  const notable = surface.notableShots?.[index % surface.notableShots.length];
  if (notable) return cleanShotText(notable);

  const surfaceLabel = surfaceKey.replaceAll("_", " ");
  const note = surface.notes ?? surface.opportunity ?? "Public surface signal from the roster analytics source.";
  return `${surfaceLabel} ${shotType.replaceAll("_", " ")} signal: ${note}`;
}

function contentTypeFor(platform: Platform, shotType: string) {
  if (platform === "GITHUB") return "Technical Proof";
  if (platform === "NEWSLETTER") return "Newsletter Byline";
  if (platform === "PODCAST" || platform === "YOUTUBE") return "Podcast Clip";
  if (platform === "LINKEDIN") return shotType === "three_pointer_promo" ? "Consulting Post" : "Operator Post";
  if (shotType === "three_pointer_promo") return "Product CTA";
  if (shotType === "freethrow_personal") return "Human Halo";
  if (shotType === "assist_industry") return "Quote Post";
  return "Personal AI Observation";
}

function zoneFor(platform: Platform) {
  if (platform === "LINKEDIN") return "LinkedIn";
  if (platform === "GITHUB") return "GitHub";
  if (platform === "INSTAGRAM") return "Instagram";
  if (platform === "NEWSLETTER" || platform === "SUBSTACK") return "Newsletter";
  if (platform === "PODCAST" || platform === "YOUTUBE") return "YouTube/Podcast";
  if (platform === "TEAMMATE_AMPLIFICATION") return "Teammate Amplification";
  if (platform === "EXTERNAL_AMPLIFICATION") return "External Amplification";
  if (platform === "LAUNCHES" || platform === "PRODUCT_HUNT") return "Launches";
  return "X";
}

function advancedZoneFor(platform: Platform, shotType: string) {
  if (platform === "LINKEDIN") return shotType === "three_pointer_promo" ? "LinkedIn consulting posts" : "LinkedIn operator posts";
  if (platform === "GITHUB") return "GitHub technical proof";
  if (platform === "NEWSLETTER" || platform === "SUBSTACK") return "Newsletter bylines";
  if (platform === "TEAMMATE_AMPLIFICATION") return "Teammate quote posts";
  if (platform === "EXTERNAL_AMPLIFICATION") return "External founder amplification";
  if (platform === "LAUNCHES" || platform === "PRODUCT_HUNT") return "Launch windows";
  if (shotType === "three_pointer_promo") return "Product CTAs";
  if (shotType === "assist_industry") return "X quote posts";
  if (shotType === "freethrow_personal") return "Personal AI observations";
  return "X original posts";
}

function courtCoord(platform: Platform, shotType: string, index: number) {
  const base: Partial<Record<Platform, [number, number]>> = {
    X: [22, 36],
    LINKEDIN: [67, 43],
    GITHUB: [20, 72],
    NEWSLETTER: [78, 70],
    PODCAST: [52, 24],
    YOUTUBE: [52, 24],
    LAUNCHES: [48, 55],
  };
  const [x, y] = base[platform] ?? [36, 40];
  const shotOffset: Record<string, [number, number]> = {
    three_pointer_promo: [8, 9],
    midrange_philosophy: [0, 0],
    freethrow_personal: [-5, 6],
    assist_industry: [4, -12],
    airball: [-8, 13],
  };
  const [ox, oy] = shotOffset[shotType] ?? [0, 0];
  return {
    x: Math.max(8, Math.min(92, x + ox + ((index % 5) - 2) * 1.8)),
    y: Math.max(8, Math.min(86, y + oy + ((index % 7) - 3) * 1.3)),
  };
}

function metricsFor(surface: SurfaceAnalyticsFixture, platform: Platform, shotType: string, index: number): PostMetrics {
  const followers = surface.followerCount ?? 3000;
  const efficiency = surface.efficiency ?? { fgPct: 0.06, threePtPct: 0.045, ftPct: 0.064, tsPct: 0.09, assistPct: 0.12 };
  const platformMultiplier: Partial<Record<Platform, number>> = {
    X: 12,
    LINKEDIN: 7,
    NEWSLETTER: 4,
    PODCAST: 3,
    GITHUB: 2,
  };
  const shotMultiplier: Record<string, number> = {
    three_pointer_promo: 1.08,
    midrange_philosophy: 1.16,
    freethrow_personal: 1.22,
    assist_industry: 0.95,
    airball: 0.45,
  };
  const variance = 0.78 + (index % 9) * 0.055;
  const views = Math.max(600, Math.round(followers * (platformMultiplier[platform] ?? 5) * (shotMultiplier[shotType] ?? 1) * variance));
  const reach = Math.round(views * 1.17);
  const engagementBase = efficiency.fgPct + (shotType === "freethrow_personal" ? 0.018 : 0) + (shotType === "airball" ? -0.025 : 0);
  const likes = Math.max(4, Math.round(views * engagementBase * 0.62));
  const comments = Math.max(1, Math.round(views * engagementBase * 0.065));
  const replies = Math.max(0, Math.round(views * engagementBase * 0.045));
  const reposts = Math.max(0, Math.round(views * engagementBase * (shotType === "assist_industry" ? 0.09 : 0.055)));
  const quotes = Math.max(0, Math.round(reposts * 0.22));
  const shares = Math.max(0, Math.round(reposts * 0.85));
  const clicks = Math.max(0, Math.round(views * (shotType === "three_pointer_promo" ? 0.018 : platform === "NEWSLETTER" ? 0.026 : 0.006)));
  const signups = Math.max(0, Math.round(clicks * (platform === "NEWSLETTER" ? 0.16 : shotType === "three_pointer_promo" ? 0.075 : 0.035)));
  const paidSubscriptions = Math.max(0, Math.round(signups * (platform === "NEWSLETTER" ? 0.12 : 0.07)));
  const consultingLeads = Math.max(0, Math.round(clicks * (platform === "LINKEDIN" ? 0.018 : shotType === "three_pointer_promo" ? 0.008 : 0.002)));
  const assistedConversions = Math.max(0, Math.round((signups + paidSubscriptions + consultingLeads) * (efficiency.assistPct * 3.5 + (shotType === "assist_industry" ? 0.75 : 0.18))));
  const revenue = paidSubscriptions * 240 + consultingLeads * 12000;

  return {
    views,
    reach,
    likes,
    comments,
    replies,
    reposts,
    quotes,
    shares,
    clicks,
    profileVisits: Math.round(views * (shotType === "freethrow_personal" ? 0.018 : 0.011)),
    signups,
    paidSubscriptions,
    consultingLeads,
    revenue,
    assistedConversions,
  };
}

function scoresFor(metrics: PostMetrics, surface: SurfaceAnalyticsFixture, shotType: string): PostScores {
  const engagements = metrics.likes + metrics.comments + metrics.replies + metrics.reposts + metrics.quotes + metrics.shares;
  const engagementRate = metrics.views ? (engagements / metrics.views) * 100 : 0;
  const ts = Math.min(99, ((metrics.signups * 1.6 + metrics.paidSubscriptions * 6 + metrics.consultingLeads * 9 + metrics.revenue / 1800 + metrics.assistedConversions * 0.5) / Math.max(1, metrics.views)) * 1000);
  const trust = Math.min(99, ((metrics.profileVisits + metrics.shares * 2 + metrics.comments * 1.2 + metrics.replies) / Math.max(1, metrics.views)) * 220);
  const assistRate = metrics.assistedConversions / Math.max(1, metrics.signups + metrics.paidSubscriptions + metrics.consultingLeads);
  const confidenceBoost = surface.efficiency ? surface.efficiency.tsPct * 120 : 8;

  return {
    awareness: Math.min(99, metrics.reach / 7000),
    engagement: Math.min(99, engagementRate * 13),
    trust: Math.min(99, trust + (shotType === "freethrow_personal" ? 18 : 0)),
    clicks: Math.min(99, metrics.clicks / 45),
    signups: Math.min(99, metrics.signups / 3),
    paid: Math.min(99, metrics.paidSubscriptions * 4),
    consulting: Math.min(99, metrics.consultingLeads * 12),
    revenue: Math.min(99, metrics.revenue / 1200),
    assists: Math.min(99, metrics.assistedConversions / 2),
    surfaceIQ: Math.min(99, ts + confidenceBoost),
    socialTS: Number(ts.toFixed(1)),
    assistRate: Number((assistRate * 100).toFixed(1)),
    trustGravity: Number(trust.toFixed(1)),
    humanHalo: Math.min(99, shotType === "freethrow_personal" ? trust + 18 : trust * 0.72),
  };
}

function playFor(platform: Platform, shotType: string, employeeId: string) {
  if (platform === "GITHUB") return "play-github-linkedin-proof";
  if (platform === "LINKEDIN" && shotType === "three_pointer_promo") return "play-linkedin-wedge";
  if (platform === "NEWSLETTER") return employeeId === "dan-shipper" ? "play-teammate-alley-oop" : "play-newsletter-bridge";
  if (shotType === "assist_industry") return "play-teammate-alley-oop";
  if (shotType === "freethrow_personal") return "play-human-halo";
  if (shotType === "three_pointer_promo") return "play-launch-rotation";
  return "play-soft-cta";
}

function campaignFor(employeeId: string, shotType: string) {
  if (employeeId === "dan-shipper") return "Founder Narrative";
  if (employeeId === "austin-tedesco") return shotType === "three_pointer_promo" ? "AI Consulting" : "Surface IQ";
  if (employeeId === "kieran-klaassen") return "Product Craft";
  if (employeeId === "yash-poojary") return "Sparkle Launch";
  if (employeeId === "naveen-naidu") return "Monologue Activation";
  if (employeeId === "kate-lee") return "Editorial Trust";
  if (employeeId === "katie-parrott") return "Writer Process";
  return "Media and AI";
}

function sumMetrics(metrics: PostMetrics[]): PostMetrics {
  return metrics.reduce<PostMetrics>(
    (sum, metric) => ({
      views: sum.views + metric.views,
      reach: sum.reach + metric.reach,
      likes: sum.likes + metric.likes,
      comments: sum.comments + metric.comments,
      replies: sum.replies + metric.replies,
      reposts: sum.reposts + metric.reposts,
      quotes: sum.quotes + metric.quotes,
      shares: sum.shares + metric.shares,
      clicks: sum.clicks + metric.clicks,
      profileVisits: sum.profileVisits + metric.profileVisits,
      signups: sum.signups + metric.signups,
      paidSubscriptions: sum.paidSubscriptions + metric.paidSubscriptions,
      consultingLeads: sum.consultingLeads + metric.consultingLeads,
      revenue: sum.revenue + metric.revenue,
      assistedConversions: sum.assistedConversions + metric.assistedConversions,
    }),
    {
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
    },
  );
}

async function resetDatabase() {
  await prisma.rippleEvent.deleteMany();
  await prisma.postScores.deleteMany();
  await prisma.postMetrics.deleteMany();
  await prisma.post.deleteMany();
  await prisma.rawActivity.deleteMany();
  await prisma.acquisitionJob.deleteMany();
  await prisma.metric.deleteMany();
  await prisma.socialAccount.deleteMany();
  await prisma.surface.deleteMany();
  await prisma.acquisitionRoute.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.play.deleteMany();
  await prisma.dataSource.deleteMany();
  await prisma.report.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.company.deleteMany();
}

async function main() {
  await resetDatabase();

  const company = await prisma.company.create({
    data: {
      id: "every",
      name: "Every",
      domain: "every.to",
      website: "https://every.to",
    },
  });

  await prisma.play.createMany({
    data: plays.map((play) => ({
      ...play,
      bestPlatforms: play.bestPlatforms as unknown as Platform[],
    })),
  });

  await prisma.dataSource.createMany({
    data: dataSources.map(([id, name, category, readiness, confidence, description]) => ({
      id,
      name,
      category,
      readiness: readiness as SourceReadiness,
      confidence: confidence as MetricConfidence,
      description,
    })),
  });

  await prisma.acquisitionRoute.createMany({
    data: acquisitionPolicies,
    skipDuplicates: true,
  });

  await prisma.surface.createMany({
    data: companySurfaceFixtures.map((surface) => ({
      companyId: company.id,
      platform: toDbPlatform(surface.platform),
      handle: surface.handle,
      url: surface.url,
      followers: surface.followers ?? 0,
      confidence: confidenceToDb(surface.confidence),
      attributionValue: surface.attributionValue,
      opportunity: surface.opportunity,
    })),
  });

  const employeeIdMap = new Map<string, string>();

  for (const employee of intelEmployeeFixtures) {
    const created = await prisma.employee.create({
      data: {
        id: employee.id,
        companyId: company.id,
        name: employee.name,
        role: employee.role,
        archetype: employee.archetype,
        dataReadiness: employee.dataReadiness,
        primarySurface: toDbPlatform(employee.primarySurface),
        secondarySurface: toDbPlatform(employee.secondarySurface),
        signatureMove: employee.signatureMove,
        opportunity: employee.opportunity,
        bestShot: employee.bestShot,
        bestAssist: employee.bestAssist,
        surfacePresence: employee.surfacePresence,
        surfaceIQ: employee.surfaceIQ,
        trustGravity: employee.trustGravity,
        socialTS: employee.socialTS,
        shotDistribution: employee.shotDistribution,
        recommendedPlayId: employee.recommendedPlayId,
      },
    });
    employeeIdMap.set(employee.id, created.id);

    for (const surface of employee.surfaces) {
      const platform = toDbPlatform(surface.platform);
      await prisma.surface.create({
        data: {
          companyId: company.id,
          employeeId: created.id,
          platform,
          handle: surface.handle,
          url: surface.url,
          followers: surface.followers ?? 0,
          confidence: confidenceToDb(surface.confidence),
          attributionValue: surface.attributionValue,
          opportunity: surface.opportunity,
        },
      });
      await prisma.socialAccount.create({
        data: {
          employeeId: created.id,
          platform,
          handle: surface.handle,
          followers: surface.followers ?? 0,
          confidence: confidenceToDb(surface.confidence),
        },
      });
    }
  }

  const surfaces = await prisma.surface.findMany({ where: { employeeId: { not: null } } });
  const surfaceByEmployeePlatform = new Map<string, (typeof surfaces)[number]>();
  surfaces.forEach((surface) => {
    if (surface.employeeId) surfaceByEmployeePlatform.set(`${surface.employeeId}:${surface.platform}`, surface);
  });

  const createdPosts: { id: string; employeeId: string; platform: Platform; metrics: PostMetrics }[] = [];

  for (const analytics of rosterAnalyticsFixtures) {
    const employee = intelEmployeeFixtures.find((item) => item.id === analytics.employeeId);
    if (!employee) continue;

    const targetCount = targetPostCounts[analytics.employeeId] ?? 0;
    const surfaceEntries = weightedSurfaceEntries(analytics, targetCount);
    let globalIndex = 0;

    for (const entry of surfaceEntries) {
      let platform = toDbPlatform(
        entry.key === "twitter"
          ? "X"
          : entry.key === "linkedin"
            ? "LinkedIn"
            : entry.key === "github"
              ? "GitHub"
              : entry.key === "newsletter"
                ? "Newsletter"
                : entry.key === "podcast"
                  ? "Podcast"
                  : "X",
      );
      let surface = surfaceByEmployeePlatform.get(`${analytics.employeeId}:${platform}`);
      if (!surface) {
        platform = toDbPlatform(employee.primarySurface);
        surface = surfaceByEmployeePlatform.get(`${analytics.employeeId}:${platform}`);
      }
      if (!surface) continue;
      if (platform === "X") continue;
      const sequence = shotSequence(entry.surface);

      for (let i = 0; i < entry.count; i += 1) {
        const shotType = sequence[i % sequence.length];
        const metrics = metricsFor(entry.surface, platform, shotType, globalIndex);
        const scores = scoresFor(metrics, entry.surface, shotType);
        const { x, y } = courtCoord(platform, shotType, globalIndex);
        const publishedAt = new Date(Date.UTC(2026, 3, 1 + (globalIndex % 26), 13 + (globalIndex % 7), (globalIndex * 11) % 60));
        const launchWindow = shotType === "three_pointer_promo" || globalIndex % 17 === 0;
        const id =
          analytics.employeeId === "austin-tedesco" && globalIndex === 0
            ? "post-austin-ai-consulting"
            : `${analytics.employeeId}-${entry.key}-${globalIndex + 1}`;

        await prisma.post.create({
          data: {
            id,
            employeeId: analytics.employeeId,
            surfaceId: surface.id,
            text: postText(analytics.employeeId, entry.key, entry.surface, shotType, globalIndex),
            platform,
            contentType: contentTypeFor(platform, shotType),
            archetype: employee.archetype ?? "Surface IQ",
            campaign: campaignFor(analytics.employeeId, shotType),
            ctaType: shotType === "three_pointer_promo" ? "Product CTA" : shotType === "assist_industry" ? "Amplification" : "Soft CTA",
            brandTouch: shotType === "freethrow_personal" ? "Personal" : shotType === "assist_industry" ? "Partner" : "Every",
            product:
              analytics.employeeId === "yash-poojary"
                ? "Sparkle"
                : analytics.employeeId === "naveen-naidu"
                  ? "Monologue"
                  : analytics.employeeId === "kieran-klaassen"
                    ? "Cora"
                    : platform === "NEWSLETTER"
                      ? "Newsletter"
                      : "Consulting",
            launchWindow,
            publishedAt,
            x,
            y,
            zone: zoneFor(platform),
            advancedZone: advancedZoneFor(platform, shotType),
            confidence: shotType === "three_pointer_promo" ? "NEEDS_INTERNAL_ANALYTICS" : "MODELED",
            recommendedPlayId: playFor(platform, shotType, analytics.employeeId),
            sourceId: "seeded:roster-fixture",
            metrics: { create: metrics },
            scores: { create: scores },
          },
        });
        createdPosts.push({ id, employeeId: analytics.employeeId, platform, metrics });
        globalIndex += 1;
      }
    }
  }

  const postsForClassification = await prisma.post.findMany({
    include: { employee: true, metrics: true, scores: true },
  });
  for (const post of postsForClassification) {
    if (!post.metrics || !post.scores || post.classifiedBy === "manual") continue;
    const platform = platformFromDb[post.platform];
    if (!post.employee) continue;
    const intent = classifyIntent(post.text, {
      name: post.employee.name,
      role: post.employee.role,
      platform,
    });
    const outcome = classifyOutcome({ text: post.text, metrics: post.metrics, scores: post.scores }, intent.intentClass);
    const coord = postToCoord(post.id, post.employeeId, intent.intentClass, outcome.outcome, platform);
    await prisma.post.update({
      where: { id: post.id },
      data: {
        intentClass: intentClassToDb[intent.intentClass],
        intentConfidence: intent.intentConfidence,
        outcome: shotOutcomeToDb[outcome.outcome],
        recovered: outcome.recovered,
        isAssist: intent.isAssist,
        classifiedAt: new Date(),
        classifiedBy: intent.source,
        x: coord.x,
        y: coord.y,
        zone: coord.zone,
      },
    });
  }

  const postsBySurface = new Map<
    string,
    {
      employeeId: string;
      surfaceId: string;
      platform: Platform;
      brandTouch: string;
      publishedAt: Date;
      intentClass: keyof typeof intentClassFromDb;
      outcome: keyof typeof shotOutcomeFromDb;
      isAssist: boolean;
      metrics: PostMetrics;
      scores: PostScores;
    }[]
  >();
  const postsWithRelations = await prisma.post.findMany({ include: { metrics: true, scores: true } });
  for (const post of postsWithRelations) {
    if (!post.surfaceId || !post.metrics || !post.scores) continue;
    const key = `${post.employeeId}:${post.surfaceId}`;
    const rows = postsBySurface.get(key) ?? [];
    rows.push({
      employeeId: post.employeeId,
      surfaceId: post.surfaceId,
      platform: post.platform,
      brandTouch: post.brandTouch,
      publishedAt: post.publishedAt,
      intentClass: post.intentClass,
      outcome: post.outcome,
      isAssist: post.isAssist,
      metrics: post.metrics,
      scores: post.scores,
    });
    postsBySurface.set(key, rows);
  }

  const seedNow = new Date("2026-04-27T00:00:00.000Z");
  const windows = [
    { label: "7D", days: 7 },
    { label: "30D", days: 30 },
    { label: "90D", days: 90 },
  ];
  for (const rows of postsBySurface.values()) {
    for (const window of windows) {
      const windowStart = new Date(seedNow.getTime() - window.days * 86_400_000);
      const windowRows = rows.filter((row) => row.publishedAt >= windowStart);
      if (!windowRows.length) continue;
      const aggregate = sumMetrics(windowRows.map((row) => row.metrics));
      const avg = (selector: (scores: PostScores) => number) =>
        windowRows.reduce((sum, row) => sum + selector(row.scores), 0) / Math.max(1, windowRows.length);
      const intentMetrics = computeIntentMetrics(
        windowRows.map((row) => ({
          brandTouch: row.brandTouch as "Every" | "Personal" | "Product" | "Partner",
          intentClass: intentClassFromDb[row.intentClass],
          outcome: shotOutcomeFromDb[row.outcome],
          isAssist: row.isAssist,
          metrics: row.metrics,
        })),
        window.days,
      );
      await prisma.metric.create({
        data: {
          employeeId: windowRows[0].employeeId,
          surfaceId: windowRows[0].surfaceId,
          platform: windowRows[0].platform,
          timeWindow: window.label,
          windowStart,
          windowEnd: seedNow,
          posts: windowRows.length,
          ...aggregate,
          surfaceIQ: avg((score) => score.surfaceIQ),
          socialTS: avg((score) => score.socialTS),
          assistRate: avg((score) => score.assistRate),
          trustGravity: avg((score) => score.trustGravity),
          ...intentMetrics,
        },
      });
    }
  }

  const rippleRoots = createdPosts.slice(0, 10);
  for (const [rootIndex, root] of rippleRoots.entries()) {
    const rootEventId = `ripple-${rootIndex + 1}-root`;
    const baseDate = new Date(Date.UTC(2026, 3, 9 + rootIndex, 14, 2));
    const chain = [
      [rootEventId, undefined, root.employeeId, "Root Post", root.platform, 0, "DIRECT"],
      [`ripple-${rootIndex + 1}-quote`, rootEventId, undefined, "Teammate Quote", "TEAMMATE_AMPLIFICATION", Math.max(12, Math.round(root.metrics.assistedConversions * 0.35)), "MODELED"],
      [`ripple-${rootIndex + 1}-external`, `ripple-${rootIndex + 1}-quote`, undefined, "External Repost", "EXTERNAL_AMPLIFICATION", Math.max(18, Math.round(root.metrics.reach * 0.0004)), "ESTIMATED"],
      [`ripple-${rootIndex + 1}-signup`, `ripple-${rootIndex + 1}-external`, undefined, "Newsletter Signups", "NEWSLETTER", root.metrics.signups, "NEEDS_INTERNAL_ANALYTICS"],
      [`ripple-${rootIndex + 1}-paid`, `ripple-${rootIndex + 1}-signup`, undefined, "Paid Subscription", "NEWSLETTER", root.metrics.paidSubscriptions, "NEEDS_INTERNAL_ANALYTICS"],
    ] as const;

    for (const [eventIndex, [id, parentId, employeeId, eventType, platform, value, confidence]] of chain.entries()) {
      await prisma.rippleEvent.create({
        data: {
          id,
          rootPostId: root.id,
          parentId,
          employeeId,
          actor:
            eventIndex === 0
              ? intelEmployeeFixtures.find((employee) => employee.id === root.employeeId)?.name ?? "Every teammate"
              : eventIndex === 1
                ? "Teammate"
                : eventIndex === 2
                  ? "External founder"
                  : eventIndex === 3
                    ? "New readers"
                    : "Subscribers",
          platform: platform as Platform,
          eventType,
          occurredAt: new Date(baseDate.getTime() + eventIndex * 36 * 60 * 1000),
          value,
          confidence: confidence as MetricConfidence,
        },
      });
    }
  }

  await prisma.experiment.createMany({
    data: [
      {
        id: "exp-newsletter-bridge",
        playId: "play-newsletter-bridge",
        ownerEmployeeId: "austin-tedesco",
        name: "Austin weekly newsletter bridge",
        hypothesis: "A social thread with a newsletter-specific promise will raise signup conversion without lowering trust.",
        status: "Planned",
        metric: "Signups",
      },
      {
        id: "exp-github-proof",
        playId: "play-github-linkedin-proof",
        ownerEmployeeId: "kieran-klaassen",
        name: "Kieran technical proof translation",
        hypothesis: "Translating GitHub proof into LinkedIn operator language increases consulting intent.",
        status: "Running",
        metric: "Consulting Leads",
      },
      {
        id: "exp-linkedin-wedge",
        playId: "play-linkedin-wedge",
        ownerEmployeeId: "laura-entis",
        name: "Media and AI consulting wedge",
        hypothesis: "A weekly LinkedIn media-and-AI series will increase consulting intent from operators.",
        status: "Planned",
        metric: "Consulting Leads",
      },
      {
        id: "exp-launch-rotation",
        playId: "play-launch-rotation",
        ownerEmployeeId: "yash-poojary",
        name: "Sparkle launch rotation",
        hypothesis: "Coordinated founder, GM, and teammate launch posts will increase assisted conversions.",
        status: "Planned",
        metric: "Assists",
      },
    ],
  });

  await prisma.report.create({
    data: {
      companyId: company.id,
      title: "Every Surface IQ 90-Day Baseline",
      period: "2026-01-27 to 2026-04-27",
      status: "Seeded",
      summary: "Baseline roster, surface map, and representative post analytics for Every Court Vision.",
    },
  });

  const [employeeCount, surfaceCount, postCount, rippleCount, playCount, experimentCount] = await Promise.all([
    prisma.employee.count(),
    prisma.surface.count(),
    prisma.post.count(),
    prisma.rippleEvent.count(),
    prisma.play.count(),
    prisma.experiment.count(),
  ]);

  console.log(
    `Seed complete: ${employeeCount} employees, ${surfaceCount} surfaces, ${postCount} posts, ${rippleCount} ripple events, ${playCount} plays, ${experimentCount} experiments.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

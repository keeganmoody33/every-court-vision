import { coreSurfaces } from "@/lib/constants";
import { computeIntentMetrics } from "@/lib/intent/metrics";
import { assistRate, socialTS } from "@/lib/scoring";
import type { FilterState, Platform, Post, PostMetrics, ScoringMode, SplitRow } from "@/lib/types";

export const emptyMetrics: PostMetrics = {
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

export function filterPosts(posts: Post[], filters: FilterState) {
  return posts.filter((post) => {
    if (filters.surface !== "All" && post.platform !== filters.surface) return false;
    if (filters.timeWindow === "Launch Window" && !post.launchWindow) return false;
    return true;
  });
}

export function sumMetrics(posts: Post[]): PostMetrics {
  return posts.reduce<PostMetrics>(
    (sum, post) => ({
      views: sum.views + post.metrics.views,
      reach: sum.reach + post.metrics.reach,
      likes: sum.likes + post.metrics.likes,
      comments: sum.comments + post.metrics.comments,
      replies: sum.replies + post.metrics.replies,
      reposts: sum.reposts + post.metrics.reposts,
      quotes: sum.quotes + post.metrics.quotes,
      shares: sum.shares + post.metrics.shares,
      clicks: sum.clicks + post.metrics.clicks,
      profileVisits: sum.profileVisits + post.metrics.profileVisits,
      signups: sum.signups + post.metrics.signups,
      paidSubscriptions: sum.paidSubscriptions + post.metrics.paidSubscriptions,
      consultingLeads: sum.consultingLeads + post.metrics.consultingLeads,
      revenue: sum.revenue + post.metrics.revenue,
      assistedConversions: sum.assistedConversions + post.metrics.assistedConversions,
    }),
    { ...emptyMetrics },
  );
}

export function modeValue(metrics: PostMetrics, mode: ScoringMode) {
  switch (mode) {
    case "Awareness":
      return metrics.reach;
    case "Engagement":
      return metrics.likes + metrics.comments + metrics.replies + metrics.reposts + metrics.quotes + metrics.shares;
    case "Trust":
      return metrics.profileVisits + metrics.shares * 2 + metrics.comments;
    case "Clicks":
      return metrics.clicks;
    case "Signups":
      return metrics.signups;
    case "Paid Subs":
      return metrics.paidSubscriptions;
    case "Consulting Leads":
      return metrics.consultingLeads;
    case "Revenue":
      return metrics.revenue;
    case "Assists":
      return metrics.assistedConversions;
  }
}

function splitFromPosts(segment: string, posts: Post[]): SplitRow {
  const metrics = sumMetrics(posts);
  const intentMetrics = computeIntentMetrics(posts, 90);
  const conversions = metrics.signups + metrics.paidSubscriptions + metrics.consultingLeads;
  const avg = (selector: (post: Post) => number) =>
    posts.length ? posts.reduce((sum, post) => sum + selector(post), 0) / posts.length : 0;

  return {
    segment,
    posts: posts.length,
    views: metrics.views,
    likes: metrics.likes,
    comments: metrics.comments,
    replies: metrics.replies,
    reposts: metrics.reposts,
    quotes: metrics.quotes,
    shares: metrics.shares,
    clicks: metrics.clicks,
    signups: metrics.signups,
    paid: metrics.paidSubscriptions,
    consulting: metrics.consultingLeads,
    revenue: metrics.revenue,
    surfaceIQ: avg((post) => post.scores.surfaceIQ),
    socialTS: socialTS(metrics),
    signupRate: metrics.views ? (metrics.signups / metrics.views) * 100 : 0,
    paidConversionRate: metrics.signups ? (metrics.paidSubscriptions / metrics.signups) * 100 : 0,
    consultingIntentRate: metrics.clicks ? (metrics.consultingLeads / metrics.clicks) * 100 : 0,
    assistRate: assistRate(metrics),
    ctaEfficiency: metrics.clicks ? (conversions / metrics.clicks) * 100 : 0,
    trustGravity: avg((post) => post.scores.trustGravity),
    humanHalo: avg((post) => post.scores.humanHalo),
    revenuePerPost: posts.length ? metrics.revenue / posts.length : 0,
    conversionPer1KViews: metrics.views ? (conversions / metrics.views) * 1000 : 0,
    diffusionDepth: avg((post) => post.scores.assists / 15),
    ...intentMetrics,
  };
}

export function groupPosts(posts: Post[], getKey: (post: Post) => string) {
  return posts.reduce<Record<string, Post[]>>((groups, post) => {
    const key = getKey(post);
    groups[key] = groups[key] ?? [];
    groups[key].push(post);
    return groups;
  }, {});
}

export function splitRows(posts: Post[], dimension: "platform" | "employee" | "archetype" | "contentType" | "campaign") {
  const grouped = groupPosts(posts, (post) => {
    if (dimension === "platform") return post.platform;
    if (dimension === "employee") return post.employeeId;
    if (dimension === "archetype") return post.archetype;
    if (dimension === "contentType") return post.contentType;
    return post.campaign;
  });
  return Object.entries(grouped).map(([segment, group]) => splitFromPosts(segment, group));
}

export function platformCards(posts: Post[]) {
  return coreSurfaces.map((platform) => {
    const platformPosts = posts.filter((post) => post.platform === platform);
    const metrics = sumMetrics(platformPosts);
    return {
      platform,
      posts: platformPosts.length,
      metrics,
      socialTS: socialTS(metrics),
      assistRate: assistRate(metrics),
    };
  });
}

export function zoneSummaries(posts: Post[], zoneMode: "Basic" | "Advanced") {
  const grouped = groupPosts(posts, (post) => (zoneMode === "Basic" ? post.zone : post.advancedZone));
  return Object.entries(grouped).map(([zone, group]) => {
    const metrics = sumMetrics(group);
    return {
      zone,
      posts: group.length,
      metrics,
      socialTS: socialTS(metrics),
      assistRate: assistRate(metrics),
      bestUse: group.sort((a, b) => b.scores.socialTS - a.scores.socialTS)[0]?.contentType ?? "Signal discovery",
      recommendedPlay: group[0]?.recommendedPlayId ?? "play-soft-cta",
    };
  });
}

export function postsByPlatform(posts: Post[], platform: Platform) {
  return posts.filter((post) => post.platform === platform);
}

import { scoringThresholds } from "@/lib/constants";
import type { Post, PostMetrics, ScoringMode } from "@/lib/types";

export function engagementRate(metrics: PostMetrics) {
  if (!metrics.views) return 0;
  const engagements =
    metrics.likes + metrics.comments + metrics.replies + metrics.reposts + metrics.quotes + metrics.shares;
  return (engagements / metrics.views) * 100;
}

export function scoreForMode(post: Post, mode: ScoringMode) {
  switch (mode) {
    case "Awareness":
      return post.scores.awareness;
    case "Engagement":
      return post.scores.engagement;
    case "Trust":
      return post.scores.trust;
    case "Clicks":
      return post.scores.clicks;
    case "Signups":
      return post.metrics.signups;
    case "Paid Subs":
      return post.metrics.paidSubscriptions;
    case "Consulting Leads":
      return post.metrics.consultingLeads;
    case "Revenue":
      return post.metrics.revenue;
    case "Assists":
      return post.metrics.assistedConversions;
  }
}

export function shotOutcome(post: Post, mode: ScoringMode): "make" | "miss" | "assist" {
  if (mode === "Assists" && post.metrics.assistedConversions >= scoringThresholds.Assists) {
    return "assist";
  }

  if (post.scores.assists >= 70 && post.metrics.assistedConversions >= 8 && mode !== "Revenue") {
    return "assist";
  }

  return scoreForMode(post, mode) >= scoringThresholds[mode] ? "make" : "miss";
}

export function socialTS(metrics: PostMetrics) {
  if (!metrics.views) return 0;
  const businessValue =
    metrics.signups * 1.6 +
    metrics.paidSubscriptions * 6 +
    metrics.consultingLeads * 9 +
    metrics.revenue / 1800 +
    metrics.assistedConversions * 0.5;
  return Math.min(99, (businessValue / metrics.views) * 1000);
}

export function assistRate(metrics: PostMetrics) {
  const conversions = metrics.signups + metrics.paidSubscriptions + metrics.consultingLeads;
  if (!conversions) return metrics.assistedConversions > 0 ? 100 : 0;
  return (metrics.assistedConversions / conversions) * 100;
}

export function trustGravityScore(metrics: PostMetrics) {
  if (!metrics.views) return 0;
  const trustSignals = metrics.profileVisits + metrics.shares * 2 + metrics.comments * 1.2 + metrics.replies;
  return Math.min(100, (trustSignals / metrics.views) * 220);
}

export function plusMinus(posts: Post[]) {
  if (!posts.length) return 0;
  const avg = posts.reduce((sum, post) => sum + post.scores.socialTS + post.scores.assists * 0.18, 0) / posts.length;
  return Number((avg - 50).toFixed(1));
}

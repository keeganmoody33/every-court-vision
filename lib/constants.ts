import type {
  AttributionMode,
  ColorScale,
  EntityFilter,
  MetricConfidence,
  Platform,
  ScoringMode,
  TimeWindow,
  ViewMode,
  ZoneMode,
} from "@/lib/types";

export const platforms: Platform[] = [
  "X",
  "LinkedIn",
  "GitHub",
  "Instagram",
  "Newsletter",
  "YouTube",
  "Podcast",
  "Launches",
  "Teammate Amplification",
  "External Amplification",
];

export const coreSurfaces: Platform[] = [
  "X",
  "LinkedIn",
  "GitHub",
  "Instagram",
  "Newsletter",
  "YouTube",
  "Podcast",
];

export const timeWindows: TimeWindow[] = ["7D", "30D", "90D", "Launch Window", "Custom"];
export const entityFilters: EntityFilter[] = ["Company", "Platform", "Archetype", "Employee", "Campaign", "Post"];
export const scoringModes: ScoringMode[] = [
  "Awareness",
  "Engagement",
  "Trust",
  "Clicks",
  "Signups",
  "Paid Subs",
  "Consulting Leads",
  "Revenue",
  "Assists",
];
export const viewModes: ViewMode[] = ["Totals", "Per Post", "Per 1K Views", "Per Employee", "Per Campaign", "Assisted"];
export const attributionModes: AttributionMode[] = ["Last Touch", "First Touch", "Linear", "Time Decay", "Assisted"];
export const zoneModes: ZoneMode[] = ["Basic", "Advanced"];
export const colorScales: ColorScale[] = ["Traditional", "Extended"];

export const defaultFilters = {
  timeWindow: "90D",
  entity: "Company",
  surface: "All",
  scoringMode: "Signups",
  viewMode: "Totals",
  attribution: "Assisted",
  zoneMode: "Basic",
  colorScale: "Extended",
} as const;

export const confidenceStyles: Record<MetricConfidence, string> = {
  Direct: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  Estimated: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  Modeled: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  Hypothesis: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  "Needs Internal Analytics": "border-zinc-400/30 bg-zinc-400/10 text-zinc-200",
};

export const modeAccent: Record<ScoringMode, string> = {
  Awareness: "#55a7ff",
  Engagement: "#3ee7d3",
  Trust: "#b78cff",
  Clicks: "#f4d35e",
  Signups: "#ff9d42",
  "Paid Subs": "#ffb86b",
  "Consulting Leads": "#ff5a66",
  Revenue: "#ff3e4d",
  Assists: "#b78cff",
};

export const scoringThresholds: Record<ScoringMode, number> = {
  Awareness: 80,
  Engagement: 58,
  Trust: 66,
  Clicks: 48,
  Signups: 8,
  "Paid Subs": 3,
  "Consulting Leads": 1,
  Revenue: 5000,
  Assists: 12,
};

/** @deprecated Removed in Phase 3a. Components consuming this will be rewritten in Phase 3b. */
export const basicZones: never[] = [];

/** @deprecated Removed in Phase 3a. Components consuming this will be rewritten in Phase 3b. */
export const advancedZones: never[] = [];

export const companyStats = {
  reach: 8700000,
  engagements: 214000,
  clicks: 42800,
  signups: 6920,
  paidSubs: 812,
  consultingLeads: 74,
  assistedConversions: 2140,
  socialTS: 61.8,
};

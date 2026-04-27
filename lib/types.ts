export type Platform =
  | "X"
  | "LinkedIn"
  | "GitHub"
  | "Instagram"
  | "Newsletter"
  | "YouTube"
  | "Podcast"
  | "Launches"
  | "Teammate Amplification"
  | "External Amplification"
  | "Product Hunt"
  | "Personal Site"
  | "TikTok"
  | "Website"
  | "Substack"
  | "App Store"
  | "Referral"
  | "Consulting";

export type SurfaceFilter = "All" | Platform;

export type MetricConfidence =
  | "Direct"
  | "Estimated"
  | "Modeled"
  | "Hypothesis"
  | "Needs Internal Analytics";

export type ScoringMode =
  | "Awareness"
  | "Engagement"
  | "Trust"
  | "Clicks"
  | "Signups"
  | "Paid Subs"
  | "Consulting Leads"
  | "Revenue"
  | "Assists";

export type ContentType =
  | "Original Post"
  | "Reply"
  | "Quote Post"
  | "Operator Post"
  | "Consulting Post"
  | "Technical Proof"
  | "Newsletter Byline"
  | "Product CTA"
  | "Personal AI Observation"
  | "Launch Post"
  | "Podcast Clip"
  | "Human Halo";

export type TimeWindow = "7D" | "30D" | "90D" | "Launch Window" | "Custom";
export type EntityFilter = "Company" | "Platform" | "Archetype" | "Employee" | "Campaign" | "Post";
export type ViewMode = "Totals" | "Per Post" | "Per 1K Views" | "Per Employee" | "Per Campaign" | "Assisted";
export type AttributionMode = "Last Touch" | "First Touch" | "Linear" | "Time Decay" | "Assisted";
export type ZoneMode = "Basic" | "Advanced";
export type ColorScale = "Traditional" | "Extended";

export interface FilterState {
  timeWindow: TimeWindow;
  entity: EntityFilter;
  surface: SurfaceFilter;
  scoringMode: ScoringMode;
  viewMode: ViewMode;
  attribution: AttributionMode;
  zoneMode: ZoneMode;
  colorScale: ColorScale;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  archetype: string;
  primarySurface: Platform;
  secondarySurface: Platform;
  signatureMove: string;
  opportunity: string;
  bestShot: string;
  bestAssist: string;
  surfacePresence: number;
  surfaceIQ: number;
  trustGravity: number;
  socialTS: number;
  shotDistribution: Record<string, number>;
  recommendedPlayId: string;
}

export interface SocialAccount {
  id: string;
  employeeId: string;
  platform: Platform;
  handle: string;
  followers: number;
  confidence: MetricConfidence;
}

export type EmployeeDataReadiness = "PUBLIC_ONLY" | "MANUAL_IMPORT" | "LIVE";

export interface Surface {
  id: string;
  employeeId?: string;
  platform: Platform;
  handle: string;
  url?: string;
  followers: number;
  confidence: MetricConfidence;
  dataReadiness?: EmployeeDataReadiness;
  attributionValue?: string;
  opportunity?: string;
}

export type EmployeeWithSurfaces = Employee & {
  accounts: SocialAccount[];
  surfaces: Surface[];
  postCount: number;
  dataReadiness: EmployeeDataReadiness;
};

export type EmployeeWithSurfacesAndMetrics = EmployeeWithSurfaces & {
  metrics: SplitRow[];
};

export type PostWithEmployee = Post & {
  employee?: Employee;
};

export interface PostMetrics {
  views: number;
  reach: number;
  likes: number;
  comments: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
  clicks: number;
  profileVisits: number;
  signups: number;
  paidSubscriptions: number;
  consultingLeads: number;
  revenue: number;
  assistedConversions: number;
}

export interface PostScores {
  awareness: number;
  engagement: number;
  trust: number;
  clicks: number;
  signups: number;
  paid: number;
  consulting: number;
  revenue: number;
  assists: number;
  surfaceIQ: number;
  socialTS: number;
  assistRate: number;
  trustGravity: number;
  humanHalo: number;
}

export interface Post {
  id: string;
  employeeId: string;
  text: string;
  platform: Platform;
  contentType: ContentType;
  archetype: string;
  campaign: string;
  ctaType: string;
  brandTouch: "Every" | "Personal" | "Product" | "Partner";
  product: string;
  launchWindow: boolean;
  timestamp: string;
  x: number;
  y: number;
  zone: string;
  advancedZone: string;
  confidence: MetricConfidence;
  metrics: PostMetrics;
  scores: PostScores;
  recommendedPlayId: string;
}

export interface RippleEvent {
  id: string;
  rootPostId: string;
  parentId?: string;
  employeeId?: string;
  actor: string;
  platform: Platform;
  eventType: string;
  timestamp: string;
  value: number;
  confidence: MetricConfidence;
}

export interface Play {
  id: string;
  name: string;
  bestFor: string;
  bestPlatforms: Platform[];
  structure: string;
  whyItWorks: string;
  historicalSignal: string;
  recommendedNextExperiment: string;
}

export interface Experiment {
  id: string;
  playId: string;
  name: string;
  hypothesis: string;
  ownerEmployeeId: string;
  status: "Planned" | "Running" | "Complete";
  metric: ScoringMode;
}

export interface DataSource {
  id: string;
  name: string;
  category: "Public Surface Data" | "Authenticated Platform Data" | "Internal Analytics" | "Modeled Intelligence";
  readiness: "Ready" | "Manual Import" | "Needs OAuth" | "Future";
  confidence: MetricConfidence;
  description: string;
}

export type AcquisitionProvider =
  | "X API"
  | "LinkedIn API"
  | "GitHub API"
  | "YouTube API"
  | "RSS"
  | "Spider"
  | "Parallel"
  | "Manual Import"
  | "Instagram Graph";

export type AcquisitionStatus = "Queued" | "Running" | "Succeeded" | "Partial" | "Failed" | "Disabled";

export interface AcquisitionRouteSummary {
  provider: AcquisitionProvider;
  routeOrder: number;
  capability: string;
  requiredEnv?: string;
  confidence: MetricConfidence;
  complianceNote: string;
}

export interface AcquisitionSurfaceRow {
  surfaceId: string;
  employeeId?: string;
  employeeName: string;
  platform: Platform;
  handle: string;
  url?: string;
  confidence: MetricConfidence;
  postCount: number;
  rawActivityCount: number;
  lastRunAt?: string;
  lastProvider?: AcquisitionProvider;
  lastStatus?: AcquisitionStatus;
  failureReason?: string;
  routeCount: number;
  primaryRoute?: AcquisitionRouteSummary;
  nextFallback?: AcquisitionRouteSummary;
  coverageStatus: "Live coverage" | "Needs acquisition" | "Manual import required" | "Awaiting acquisition";
}

export interface SplitRow {
  segment: string;
  posts: number;
  views: number;
  likes: number;
  comments: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
  clicks: number;
  signups: number;
  paid: number;
  consulting: number;
  revenue: number;
  surfaceIQ: number;
  socialTS: number;
  signupRate: number;
  paidConversionRate: number;
  consultingIntentRate: number;
  assistRate: number;
  ctaEfficiency: number;
  trustGravity: number;
  humanHalo: number;
  revenuePerPost: number;
  conversionPer1KViews: number;
  diffusionDepth: number;
}

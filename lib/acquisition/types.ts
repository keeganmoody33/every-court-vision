import type {
  AcquisitionProvider as DbAcquisitionProvider,
  MetricConfidence,
  Platform as DbPlatform,
} from "@prisma/client";

export interface AcquisitionPolicy {
  platform: DbPlatform;
  provider: DbAcquisitionProvider;
  routeOrder: number;
  capability: string;
  requiredEnv?: string;
  confidence: MetricConfidence;
  complianceNote: string;
}

export interface NormalizedSurface {
  id: string;
  platform: DbPlatform;
  handle: string;
  url: string | null;
  employeeId: string | null;
  employee?: {
    id: string;
    name: string;
    role: string;
    archetype: string | null;
  } | null;
}

export interface NormalizedMetrics {
  views?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  replies?: number;
  reposts?: number;
  quotes?: number;
  shares?: number;
  clicks?: number;
  profileVisits?: number;
}

export interface RawActivityInput {
  externalId?: string;
  permalink?: string;
  publishedAt: Date | string;
  text: string;
  conversationId?: string;
  metrics?: NormalizedMetrics;
  rawPayload?: unknown;
  citations?: string[];
  basis?: unknown;
  confidence?: MetricConfidence;
}

export interface ProviderContext {
  surface: NormalizedSurface;
  policy: AcquisitionPolicy;
  windowStart: Date;
  windowEnd: Date;
}

export interface ProviderResult {
  status: "success" | "disabled" | "failed";
  activities: RawActivityInput[];
  failureCode?: string;
  failureReason?: string;
  retryAfterSeconds?: number;
}

export interface PersistResult {
  rawCount: number;
  inserted: number;
  updated: number;
  skipped: number;
}

export interface AcquisitionRunResult extends PersistResult {
  surfaceId: string;
  provider: DbAcquisitionProvider;
  status: "QUEUED" | "SUCCEEDED" | "PARTIAL" | "FAILED" | "DISABLED" | "DEAD_LETTER";
  jobId?: string;
  idempotencyKey?: string;
  failureCode?: string;
  failureReason?: string;
}

export interface ProviderAdapter {
  provider: DbAcquisitionProvider;
  collect(context: ProviderContext): Promise<ProviderResult>;
}

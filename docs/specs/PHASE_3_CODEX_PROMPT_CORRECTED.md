# PHASE 3 — CATEGORIZATION ENGINE + COURT MAPPING
# CORRECTED: Intent drives position. Platform drives color. Time drives recency.
# Drop this into Cursor/Codex as a single prompt.

---

## CRITICAL CORRECTION FROM PREVIOUS ATTEMPT

The previous implementation used **platform-as-region** on the court (X = left wing, LinkedIn = right wing). This was REJECTED. It feels like a dashboard wearing a basketball skin — arbitrary, learnable-only, not honest.

**The new rule:**
> "Where on the court" = what kind of shot (intent). "What color" = what platform. "How bright/big" = how recent/impactful.

This makes the metaphor reversible: a cluster of dots in the paint means "we're only taking easy shots," which is a real strategic insight. A cluster beyond the arc means "we're swinging for the fences." Empty mid-range means "we're not building trust before we ask."

---

## 1. ADD shotType TO THE POST MODEL

Extend the Prisma schema. Add `shotType` and `intentClass` to the `Post` model:

```prisma
model Post {
  id            String   @id @default(cuid())
  employeeId    String
  employee      Employee @relation(fields: [employeeId], references: [id])

  // Existing fields (keep all)
  content       String
  platform      String   // x, linkedin, substack, github, youtube, etc.
  contentType   String   // Operator Post, Newsletter Byline, Podcast Clip, etc.
  publishedAt   DateTime
  likes         Int      @default(0)
  replies       Int      @default(0)
  reposts       Int      @default(0)
  clicks        Int      @default(0)
  signups       Int      @default(0)

  // Court position (existing — now auto-generated)
  x             Float?
  y             Float?
  zone          String?  // "threePoint", "midRange", "paint", "freeThrow", "passLane", "outOfBounds"
  advancedZone  String?  // "leftCorner3", "rightElbow", "leftPassLane", etc.

  // NEW: Basketball framework fields
  shotType      String   @default("setup") // "threePoint", "midRange", "paint", "freeThrow", "setup", "assist", "rebound", "turnover"
  intentClass   String   @default("pass")  // "shot_attempt", "pass", "assist", "rebound", "turnover"

  // NEW: Assist tracking
  assistedBy    String[] // Array of employeeIds who assisted this conversion
  assistedByNames String[] // Denormalized for display

  // NEW: Sequence tracking
  sequenceId    String?  // Groups posts into a possession/combo chain
  sequenceIndex Int?     // Position in the sequence

  // NEW: Outcome tracking
  outcome       String?  // "made", "missed", "assisted_make", "second_chance", "turnover"
  valuePoints   Float    @default(0) // Weighted scoring value

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

Run migration:
```bash
pnpm exec prisma migrate dev --name add_shot_type_intent_class
```

---

## 2. CREATE lib/categorization/intentClassifier.ts

This is the core classification engine. It reads a post's content, platform, CTA presence, and engagement to classify intent.

```typescript
// lib/categorization/intentClassifier.ts

export type IntentClass = "shot_attempt" | "pass" | "assist" | "rebound" | "turnover";
export type ShotType = "threePoint" | "midRange" | "paint" | "freeThrow" | "setup" | "assist" | "rebound" | "turnover";
export type Outcome = "made" | "missed" | "assisted_make" | "second_chance" | "turnover" | null;

interface ClassificationResult {
  intentClass: IntentClass;
  shotType: ShotType;
  outcome: Outcome;
  valuePoints: number;
  confidence: number; // 0-1
  reasoning: string;
}

// CTA detection patterns
const STRONG_CTAS = [
  /buy now/i, /purchase/i, /book a demo/i, /schedule a call/i,
  /get started/i, /sign up for paid/i, /upgrade now/i,
  /consulting/i, /hire us/i, /work with us/i,
];

const MEDIUM_CTAS = [
  /sign up/i, /join the newsletter/i, /subscribe/i, /start free trial/i,
  /try it/i, /download/i, /get access/i, /join waitlist/i,
  /try cora/i, /try every/i,
];

const LIGHT_CTAS = [
  /follow/i, /like this/i, /retweet/i, /share/i,
  /comment below/i, /reply with/i, /let me know/i,
  /check it out/i, /learn more/i, /read more/i,
];

const SETUP_PATTERNS = [
  /thread/i, /here's how/i, /the problem with/i, /why/i,
  /i believe/i, /the best/i, /lessons from/i, /what i learned/i,
  /hot take/i, /unpopular opinion/i, /think about/i,
];

const CULTURAL_PATTERNS = [
  /granola/i, /dia/i, /team/i, /culture/i, /behind the scenes/i,
  /day in the life/i, /what we're building/i, /not about work/i,
];

export function classifyPost(
  content: string,
  platform: string,
  engagement: { likes: number; replies: number; reposts: number; clicks: number; signups: number },
  hasConversion: boolean,
  isRetweetOfProduct: boolean = false,
  isQuoteWithCTA: boolean = false,
): ClassificationResult {
  const text = content.toLowerCase();

  // 1. Detect CTA strength
  const hasStrongCTA = STRONG_CTAS.some(p => p.test(text));
  const hasMediumCTA = MEDIUM_CTAS.some(p => p.test(text));
  const hasLightCTA = LIGHT_CTAS.some(p => p.test(text));
  const hasSetup = SETUP_PATTERNS.some(p => p.test(text));
  const hasCultural = CULTURAL_PATTERNS.some(p => p.test(text));

  // 2. Determine intent class
  let intentClass: IntentClass;
  let shotType: ShotType;
  let valuePoints = 0;
  let reasoning = "";

  if (hasStrongCTA) {
    intentClass = "shot_attempt";
    shotType = "threePoint";
    valuePoints = 5;
    reasoning = "Strong revenue/demo CTA detected — high-value shot attempt";
  } else if (hasMediumCTA) {
    intentClass = "shot_attempt";
    shotType = "midRange";
    valuePoints = 3;
    reasoning = "Medium signup/trial CTA detected — mid-range shot";
  } else if (hasLightCTA) {
    intentClass = "shot_attempt";
    shotType = "paint";
    valuePoints = 1;
    reasoning = "Light engagement CTA detected — paint shot";
  } else if (hasCultural && !hasSetup) {
    intentClass = "pass";
    shotType = "freeThrow";
    valuePoints = 0.5;
    reasoning = "Cultural/trust content — free throw (builds floor, no ask)";
  } else if (hasSetup || text.length > 200) {
    intentClass = "pass";
    shotType = "setup";
    valuePoints = 0.25;
    reasoning = "Setup/educational content — ball movement, no shot";
  } else if (isRetweetOfProduct && !isQuoteWithCTA) {
    intentClass = "assist";
    shotType = "assist";
    valuePoints = 0.75;
    reasoning = "Retweet of product content — assist opportunity";
  } else {
    intentClass = "pass";
    shotType = "setup";
    valuePoints = 0;
    reasoning = "No clear CTA or setup pattern — neutral possession";
  }

  // 3. Determine outcome
  let outcome: Outcome = null;

  if (intentClass === "shot_attempt") {
    if (hasConversion) {
      if (engagement.signups > 0 || engagement.clicks > 10) {
        outcome = "made";
        valuePoints *= 1.5; // Made shots are worth more
      } else {
        outcome = "missed";
      }
    } else {
      outcome = "missed";
    }
  } else if (intentClass === "assist") {
    outcome = hasConversion ? "assisted_make" : null;
  }

  // 4. Confidence scoring
  const confidence = Math.min(1, 
    (hasStrongCTA || hasMediumCTA || hasLightCTA ? 0.7 : 0.3) +
    (hasSetup ? 0.2 : 0) +
    (hasConversion ? 0.2 : 0)
  );

  return { intentClass, shotType, outcome, valuePoints, confidence, reasoning };
}

// Batch classify for seed data backfill
export function batchClassifyPosts(posts: any[]): any[] {
  return posts.map(post => {
    const classification = classifyPost(
      post.content,
      post.platform,
      {
        likes: post.likes || 0,
        replies: post.replies || 0,
        reposts: post.reposts || 0,
        clicks: post.clicks || 0,
        signups: post.signups || 0,
      },
      (post.signups || 0) > 0 || (post.clicks || 0) > 5,
    );

    return {
      ...post,
      ...classification,
    };
  });
}
```

---

## 3. CREATE lib/categorization/courtMapping.ts

This maps classified intent to (x, y) coordinates on the court. The court is a 100×100 coordinate system.

```typescript
// lib/categorization/courtMapping.ts

export interface CourtZone {
  name: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  description: string;
}

export interface PlatformColor {
  platform: string;
  color: string;
  secondaryColor: string;
}

// === SHOT ZONES (intent drives position) ===
export const shotZones: Record<string, CourtZone> = {
  threePoint: {
    name: "threePoint",
    xMin: 0, xMax: 100,
    yMin: 0, yMax: 22,
    description: "Beyond the arc — purchase, demo, enterprise consulting CTAs",
  },
  leftCorner3: {
    name: "leftCorner3",
    xMin: 0, xMax: 15,
    yMin: 0, yMax: 22,
    description: "Left corner three — niche high-value CTAs",
  },
  rightCorner3: {
    name: "rightCorner3",
    xMin: 85, xMax: 100,
    yMin: 0, yMax: 22,
    description: "Right corner three — experimental high-value CTAs",
  },
  midRange: {
    name: "midRange",
    xMin: 15, xMax: 85,
    yMin: 22, yMax: 55,
    description: "Mid-range — signup, newsletter, trial CTAs",
  },
  leftElbow: {
    name: "leftElbow",
    xMin: 15, xMax: 40,
    yMin: 35, yMax: 55,
    description: "Left elbow — warm signup CTAs",
  },
  rightElbow: {
    name: "rightElbow",
    xMin: 60, xMax: 85,
    yMin: 35, yMax: 55,
    description: "Right elbow — newsletter/waitlist CTAs",
  },
  paint: {
    name: "paint",
    xMin: 35, xMax: 65,
    yMin: 55, yMax: 85,
    description: "In the paint — follow, like, comment, profile visit CTAs",
  },
  freeThrow: {
    name: "freeThrow",
    xMin: 42, xMax: 58,
    yMin: 72, yMax: 82,
    description: "Free throw line — zero-ask trust building",
  },
  outOfBounds: {
    name: "outOfBounds",
    xMin: -5, xMax: 105,
    yMin: -5, yMax: 0,
    description: "Out of bounds — ignored CTAs, negative replies, broken links",
  },
};

// === PASSING LANES (non-positional, trajectory lines) ===
export const passLanes = {
  left: { xMin: 0, xMax: 30, yMin: 25, yMax: 70 },
  right: { xMin: 70, xMax: 100, yMin: 25, yMax: 70 },
  top: { xMin: 30, xMax: 70, yMin: 0, yMax: 25 },
};

// === PLATFORM COLORS (platform drives color, not position) ===
export const platformColors: Record<string, PlatformColor> = {
  x: { platform: "x", color: "#1DA1F2", secondaryColor: "#0d8bd9" },
  linkedin: { platform: "linkedin", color: "#0A66C2", secondaryColor: "#084d94" },
  substack: { platform: "substack", color: "#FF6719", secondaryColor: "#e55a14" },
  newsletter: { platform: "newsletter", color: "#FF6719", secondaryColor: "#e55a14" },
  github: { platform: "github", color: "#238636", secondaryColor: "#1a6b2a" },
  youtube: { platform: "youtube", color: "#FF0000", secondaryColor: "#cc0000" },
  instagram: { platform: "instagram", color: "#E4405F", secondaryColor: "#c7364f" },
  tiktok: { platform: "tiktok", color: "#00f2ea", secondaryColor: "#00c9c2" },
  product_hunt: { platform: "product_hunt", color: "#DA552F", secondaryColor: "#b84524" },
  personal_site: { platform: "personal_site", color: "#c9a227", secondaryColor: "#a88820" },
  podcast: { platform: "podcast", color: "#9933ff", secondaryColor: "#7a29cc" },
  book: { platform: "book", color: "#8B4513", secondaryColor: "#6b3510" },
  external_interview: { platform: "external_interview", color: "#20B2AA", secondaryColor: "#1a8f88" },
};

// Default color for unknown platforms
export const defaultPlatformColor: PlatformColor = {
  platform: "unknown",
  color: "#888888",
  secondaryColor: "#666666",
};

export function getPlatformColor(platform: string): PlatformColor {
  return platformColors[platform.toLowerCase()] || defaultPlatformColor;
}

// === SHOT TYPE TO ZONE MAPPING ===
export function shotTypeToZone(shotType: string): CourtZone {
  switch (shotType) {
    case "threePoint": return shotZones.threePoint;
    case "midRange": return shotZones.midRange;
    case "paint": return shotZones.paint;
    case "freeThrow": return shotZones.freeThrow;
    case "setup": return passLanes as any; // Passes don't have fixed positions
    case "assist": return passLanes as any;
    case "rebound": return shotZones.paint; // Rebounds near the missed shot
    case "turnover": return shotZones.outOfBounds;
    default: return shotZones.midRange;
  }
}

// === DETERMINISTIC JITTER ===
// Same post always gets same position (idempotent)
export function jitter(xMin: number, xMax: number, yMin: number, yMax: number, seed: string): { x: number; y: number } {
  // Simple hash function for deterministic jitter
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const normalized = Math.abs(hash) / 2147483647;
  const x = xMin + (normalized * (xMax - xMin));
  const y = yMin + ((normalized * 9301 + 49297) % 233280 / 233280) * (yMax - yMin);

  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

// === MAIN: postToCoord ===
export function postToCoord(post: {
  id: string;
  shotType: string;
  platform: string;
  publishedAt: Date;
}): { x: number; y: number; zone: string; color: string; opacity: number; size: number } {
  const zone = shotTypeToZone(post.shotType);
  const { x, y } = jitter(zone.xMin, zone.xMax, zone.yMin, zone.yMax, post.id);

  const platformColor = getPlatformColor(post.platform);

  // Time-based opacity (recency)
  const daysAgo = (Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
  let opacity = 1;
  let size = 6;

  if (daysAgo <= 7) {
    opacity = 1;
    size = 8;
  } else if (daysAgo <= 30) {
    opacity = 0.75;
    size = 6;
  } else if (daysAgo <= 90) {
    opacity = 0.5;
    size = 5;
  } else {
    opacity = 0.3;
    size = 4;
  }

  // Shot type affects size
  if (post.shotType === "threePoint") size += 2;
  if (post.shotType === "turnover") size = 3;

  return {
    x,
    y,
    zone: zone.name,
    color: platformColor.color,
    opacity,
    size,
  };
}

// === ADVANCED ZONE (fine-grained position label) ===
export function getAdvancedZone(x: number, y: number): string {
  if (y < 22) {
    if (x < 15) return "leftCorner3";
    if (x > 85) return "rightCorner3";
    return "topOfKey3";
  }
  if (y < 55) {
    if (x < 40) return "leftElbow";
    if (x > 60) return "rightElbow";
    return "topOfKeyMid";
  }
  if (y < 85) {
    if (x > 35 && x < 65 && y > 72) return "freeThrow";
    return "paint";
  }
  return "outOfBounds";
}
```

---

## 4. CREATE lib/categorization/sequenceDetector.ts

Detects combo chains (possessions) across posts. This enables the Ripple Replay and assist tracking.

```typescript
// lib/categorization/sequenceDetector.ts

export interface Sequence {
  id: string;
  employeeId: string;
  posts: string[]; // post IDs
  totalValue: number;
  outcome: "made" | "missed" | "assisted_make" | "turnover";
  startTime: Date;
  endTime: Date;
}

// A "possession" is a time-bounded sequence of posts by one employee
// that starts with a pass/setup and ends with a shot or turnover
export function detectSequences(posts: any[]): Sequence[] {
  // Sort by time
  const sorted = [...posts].sort((a, b) => 
    new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  const sequences: Sequence[] = [];
  let currentSequence: any[] = [];
  let currentEmployee: string | null = null;

  const POSSESSION_TIMEOUT_MS = 1000 * 60 * 60 * 4; // 4 hours

  for (const post of sorted) {
    // Start new sequence if employee changed or timeout
    if (currentEmployee !== post.employeeId || 
        (currentSequence.length > 0 && 
         new Date(post.publishedAt).getTime() - new Date(currentSequence[currentSequence.length - 1].publishedAt).getTime() > POSSESSION_TIMEOUT_MS)) {

      if (currentSequence.length > 0) {
        sequences.push(finalizeSequence(currentSequence));
      }
      currentSequence = [];
      currentEmployee = post.employeeId;
    }

    currentSequence.push(post);

    // End sequence if shot or turnover
    if (post.intentClass === "shot_attempt" || post.intentClass === "turnover") {
      sequences.push(finalizeSequence(currentSequence));
      currentSequence = [];
      currentEmployee = null;
    }
  }

  // Don't forget last sequence
  if (currentSequence.length > 0) {
    sequences.push(finalizeSequence(currentSequence));
  }

  return sequences;
}

function finalizeSequence(posts: any[]): Sequence {
  const lastPost = posts[posts.length - 1];
  const totalValue = posts.reduce((sum, p) => sum + (p.valuePoints || 0), 0);

  let outcome: Sequence['outcome'] = "missed";
  if (lastPost.outcome === "made") outcome = "made";
  if (lastPost.outcome === "assisted_make") outcome = "assisted_make";
  if (lastPost.intentClass === "turnover") outcome = "turnover";

  return {
    id: `seq_${posts[0].id}`,
    employeeId: posts[0].employeeId,
    posts: posts.map(p => p.id),
    totalValue,
    outcome,
    startTime: new Date(posts[0].publishedAt),
    endTime: new Date(lastPost.publishedAt),
  };
}

// Detect assists: when Employee A's post leads to Employee B's conversion
export function detectAssists(posts: any[], windowHours: number = 48): any[] {
  const assists: any[] = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (post.intentClass !== "pass" && post.intentClass !== "assist") continue;

    // Look ahead for conversions by other employees within window
    for (let j = i + 1; j < posts.length; j++) {
      const laterPost = posts[j];
      const hoursDiff = (new Date(laterPost.publishedAt).getTime() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60);

      if (hoursDiff > windowHours) break;
      if (laterPost.employeeId === post.employeeId) continue;
      if (laterPost.outcome !== "made" && laterPost.outcome !== "assisted_make") continue;

      // Check if later post references the earlier one (simplified — in production, use content analysis)
      assists.push({
        id: `assist_${post.id}_${laterPost.id}`,
        fromPostId: post.id,
        fromEmployeeId: post.employeeId,
        toPostId: laterPost.id,
        toEmployeeId: laterPost.employeeId,
        hoursLater: hoursDiff,
        value: laterPost.valuePoints || 0,
      });
    }
  }

  return assists;
}
```

---

## 5. UPDATE THE SEED SCRIPT

Backfill all existing posts with classification data:

```typescript
// prisma/seed.ts (add this section)

import { classifyPost, batchClassifyPosts } from "../lib/categorization/intentClassifier";
import { postToCoord } from "../lib/categorization/courtMapping";

async function backfillClassifications() {
  const posts = await prisma.post.findMany();

  console.log(`Backfilling ${posts.length} posts with classifications...`);

  for (const post of posts) {
    const classification = classifyPost(
      post.content,
      post.platform,
      {
        likes: post.likes,
        replies: post.replies,
        reposts: post.reposts,
        clicks: post.clicks,
        signups: post.signups,
      },
      (post.signups || 0) > 0 || (post.clicks || 0) > 5,
    );

    const coord = postToCoord({
      id: post.id,
      shotType: classification.shotType,
      platform: post.platform,
      publishedAt: post.publishedAt,
    });

    await prisma.post.update({
      where: { id: post.id },
      data: {
        shotType: classification.shotType,
        intentClass: classification.intentClass,
        outcome: classification.outcome,
        valuePoints: classification.valuePoints,
        x: coord.x,
        y: coord.y,
        zone: coord.zone,
        advancedZone: coord.zone, // Simplified — could be more granular
      },
    });
  }

  console.log("Backfill complete.");
}

// Call this in the main seed function after creating posts
```

---

## 6. CREATE THE COURT VISUALIZATION COMPONENTS

### ShotChart.tsx — The main court visualization

```tsx
// components/ShotChart.tsx
"use client";

import { useMemo } from "react";
import { platformColors, shotZones } from "@/lib/categorization/courtMapping";

interface Shot {
  id: string;
  x: number;
  y: number;
  platform: string;
  shotType: string;
  intentClass: string;
  outcome: string | null;
  color: string;
  opacity: number;
  size: number;
  employeeName: string;
  content: string;
}

interface ShotChartProps {
  shots: Shot[];
  width?: number;
  height?: number;
  showZones?: boolean;
  showLabels?: boolean;
  filterPlatform?: string | null;
  filterShotType?: string | null;
}

export function ShotChart({
  shots,
  width = 600,
  height = 500,
  showZones = true,
  showLabels = true,
  filterPlatform = null,
  filterShotType = null,
}: ShotChartProps) {
  const filteredShots = useMemo(() => {
    return shots.filter(s => {
      if (filterPlatform && s.platform !== filterPlatform) return false;
      if (filterShotType && s.shotType !== filterShotType) return false;
      return true;
    });
  }, [shots, filterPlatform, filterShotType]);

  // Court dimensions (100x100 coordinate system)
  const scaleX = (x: number) => (x / 100) * width;
  const scaleY = (y: number) => (y / 100) * height;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shot-chart">
      {/* Court background */}
      <rect width={width} height={height} fill="#0a0a0f" rx={8} />

      {/* Zone overlays */}
      {showZones && (
        <g className="zones">
          {/* 3P arc zone */}
          <path
            d={`M ${scaleX(0)} ${scaleY(22)} Q ${scaleX(50)} ${scaleY(-10)} ${scaleX(100)} ${scaleY(22)}`}
            fill="none"
            stroke="#2a2a3a"
            strokeWidth={2}
            strokeDasharray="4 4"
          />

          {/* Paint */}
          <rect
            x={scaleX(35)} y={scaleY(55)}
            width={scaleX(30)} height={scaleY(30)}
            fill="none" stroke="#2a2a3a" strokeWidth={1}
          />

          {/* Free throw circle */}
          <ellipse
            cx={scaleX(50)} cy={scaleY(77)}
            rx={scaleX(8)} ry={scaleY(5)}
            fill="none" stroke="#2a2a3a" strokeWidth={1}
          />

          {/* Zone labels */}
          {showLabels && (
            <g className="zone-labels" opacity={0.3}>
              <text x={scaleX(50)} y={scaleY(10)} fill="#606070" fontSize={10} textAnchor="middle">3P</text>
              <text x={scaleX(50)} y={scaleY(40)} fill="#606070" fontSize={10} textAnchor="middle">MID-RANGE</text>
              <text x={scaleX(50)} y={scaleY(70)} fill="#606070" fontSize={10} textAnchor="middle">PAINT</text>
              <text x={scaleX(50)} y={scaleY(80)} fill="#606070" fontSize={10} textAnchor="middle">FT</text>
            </g>
          )}
        </g>
      )}

      {/* Shots */}
      <g className="shots">
        {filteredShots.map(shot => (
          <g key={shot.id} className="shot-marker">
            {/* Glow for made shots */}
            {shot.outcome === "made" && (
              <circle
                cx={scaleX(shot.x)} cy={scaleY(shot.y)}
                r={shot.size + 4}
                fill={shot.color}
                opacity={0.2}
              />
            )}

            {/* Main dot */}
            <circle
              cx={scaleX(shot.x)} cy={scaleY(shot.y)}
              r={shot.size}
              fill={shot.color}
              opacity={shot.opacity}
              stroke={shot.outcome === "missed" ? "#e74c3c" : "none"}
              strokeWidth={shot.outcome === "missed" ? 1.5 : 0}
              strokeDasharray={shot.outcome === "missed" ? "2 2" : "none"}
            />

            {/* X for turnovers */}
            {shot.intentClass === "turnover" && (
              <g transform={`translate(${scaleX(shot.x)}, ${scaleY(shot.y)})`}>
                <line x1={-4} y1={-4} x2={4} y2={4} stroke="#e74c3c" strokeWidth={2} />
                <line x1={4} y1={-4} x2={-4} y2={4} stroke="#e74c3c" strokeWidth={2} />
              </g>
            )}
          </g>
        ))}
      </g>

      {/* Platform legend */}
      <g className="legend" transform={`translate(${width - 100}, 20)`}>
        {Object.entries(platformColors).slice(0, 6).map(([platform, colors], i) => (
          <g key={platform} transform={`translate(0, ${i * 18})`}>
            <circle cx={6} cy={6} r={5} fill={colors.color} />
            <text x={14} y={10} fill="#a0a0b0" fontSize={9}>{platform.replace('_', ' ')}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
```

### RippleReplay.tsx — Combo chain visualization

```tsx
// components/RippleReplay.tsx
"use client";

interface RippleStep {
  id: string;
  employeeName: string;
  employeeAvatar?: string;
  platform: string;
  action: string;
  content: string;
  timestamp: string;
  shotType: string;
  outcome?: string;
}

interface RippleReplayProps {
  steps: RippleStep[];
}

export function RippleReplay({ steps }: RippleReplayProps) {
  return (
    <div className="ripple-replay bg-[#0a0a0f] rounded-lg p-6">
      <h3 className="text-[#c9a227] text-sm font-bold mb-4 uppercase tracking-wider">
        Ripple Replay
      </h3>

      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-[#2a2a3a]" />

        {steps.map((step, i) => (
          <div key={step.id} className="relative flex items-start gap-4 mb-6 last:mb-0">
            {/* Node */}
            <div className={`
              relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              ${step.outcome === 'made' ? 'bg-[#27ae60] text-white' : 
                step.outcome === 'missed' ? 'bg-[#e74c3c] text-white' :
                step.shotType === 'assist' ? 'bg-[#3498db] text-white' :
                'bg-[#2a2a3a] text-[#a0a0b0]'}
            `}>
              {i + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-sm font-semibold">{step.employeeName}</span>
                <span className="text-[#606070] text-xs">{step.platform}</span>
                <span className={`
                  text-xs px-2 py-0.5 rounded
                  ${step.shotType === 'threePoint' ? 'bg-[#e74c3c]/20 text-[#e74c3c]' :
                    step.shotType === 'midRange' ? 'bg-[#f39c12]/20 text-[#f39c12]' :
                    step.shotType === 'paint' ? 'bg-[#27ae60]/20 text-[#27ae60]' :
                    step.shotType === 'freeThrow' ? 'bg-[#3498db]/20 text-[#3498db]' :
                    'bg-[#2a2a3a] text-[#a0a0b0]'}
                `}>
                  {step.shotType.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              <p className="text-[#a0a0b0] text-sm truncate">{step.content}</p>
              <p className="text-[#606070] text-xs mt-1">{step.timestamp}</p>
            </div>

            {/* Combo multiplier */}
            {i > 0 && (
              <div className="text-[#c9a227] text-xs font-bold">
                ×{Math.min(5, 1 + i * 0.5).toFixed(1)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      {steps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#2a2a3a] flex justify-between items-center">
          <span className="text-[#606070] text-xs">Combo Chain</span>
          <span className="text-[#c9a227] text-lg font-bold">
            {steps.reduce((sum, s) => sum + (s.outcome === 'made' ? 3 : 0), 0)} pts
          </span>
        </div>
      )}
    </div>
  );
}
```

---

## 7. UPDATE lib/queries.ts

Add queries that return classified data:

```typescript
// lib/queries.ts (add these functions)

import { postToCoord, getPlatformColor } from "./categorization/courtMapping";

export async function getShotsForCourt(employeeId?: string, days: number = 90) {
  const posts = await prisma.post.findMany({
    where: {
      ...(employeeId && { employeeId }),
      publishedAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
    include: { employee: true },
    orderBy: { publishedAt: "desc" },
  });

  return posts.map(post => {
    const coord = post.x && post.y 
      ? { x: post.x, y: post.y, zone: post.zone || "midRange" }
      : postToCoord({
          id: post.id,
          shotType: post.shotType || "setup",
          platform: post.platform,
          publishedAt: post.publishedAt,
        });

    const platformColor = getPlatformColor(post.platform);
    const daysAgo = (Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60 * 24);

    return {
      id: post.id,
      x: coord.x,
      y: coord.y,
      zone: coord.zone,
      platform: post.platform,
      shotType: post.shotType || "setup",
      intentClass: post.intentClass || "pass",
      outcome: post.outcome,
      color: platformColor.color,
      opacity: daysAgo <= 7 ? 1 : daysAgo <= 30 ? 0.75 : daysAgo <= 90 ? 0.5 : 0.3,
      size: post.shotType === "threePoint" ? 8 : post.shotType === "midRange" ? 6 : 5,
      employeeName: post.employee.name,
      content: post.content.slice(0, 100),
      publishedAt: post.publishedAt,
    };
  });
}

export async function getShotStats(employeeId?: string, days: number = 90) {
  const posts = await prisma.post.findMany({
    where: {
      ...(employeeId && { employeeId }),
      publishedAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
  });

  const shots = posts.filter(p => p.intentClass === "shot_attempt");
  const made = shots.filter(p => p.outcome === "made").length;

  return {
    totalPosts: posts.length,
    shotAttempts: shots.length,
    made,
    missed: shots.filter(p => p.outcome === "missed").length,
    socialFG: shots.length > 0 ? made / shots.length : 0,
    totalValue: posts.reduce((sum, p) => sum + (p.valuePoints || 0), 0),
    byShotType: {
      threePoint: posts.filter(p => p.shotType === "threePoint").length,
      midRange: posts.filter(p => p.shotType === "midRange").length,
      paint: posts.filter(p => p.shotType === "paint").length,
      freeThrow: posts.filter(p => p.shotType === "freeThrow").length,
    },
  };
}
```

---

## 8. DEFINITION OF DONE FOR PHASE 3

Verify all of these before committing:

- [ ] `shotType` and `intentClass` columns exist on Post model
- [ ] All existing seed posts have been backfilled with classifications
- [ ] `postToCoord()` returns (x, y) based on shotType, not platform
- [ ] Platform colors are applied to dots, not positions
- [ ] Time-based opacity works (recent = bright, old = faded)
- [ ] ShotChart component renders dots in correct zones (3P, mid, paint, FT)
- [ ] Made shots have glow, missed shots have dashed outline, turnovers have X
- [ ] RippleReplay component shows combo chains with multipliers
- [ ] Shot stats query returns Social FG%, shot distribution by type
- [ ] No platform-as-region logic remains in the codebase
- [ ] `rg "basicZones" lib app components` returns 0 hits (old code removed)

---

## 9. WHAT PHASE 3 ENABLES

Once this is merged, the following becomes possible:

**Phase 4 (Spider.cloud pipeline)**: Scraped posts auto-classify on ingest. No manual categorization.

**Phase 5 (Insight Banners)**: "Your team is shooting 80% from the paint but 0% from three — you're not asking for enough."

**Phase 6 (Exports)**: Shot charts export as PNG with real basketball spatial logic.

**Phase 7 (Brand polish)**: Court colors feel native because the spatial logic is honest.

**Phase 8 (Auth)**: Multi-user sees their own shot chart with their own color.

---

END OF PHASE 3 PROMPT

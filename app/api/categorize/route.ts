import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { classifyIntent } from "@/lib/intent/classify";
import { postToCoord } from "@/lib/intent/courtMapping";
import { classifyOutcome } from "@/lib/intent/outcome";
import { PLATFORM_COLORS } from "@/lib/intent/platformColors";
import { recencyVisual } from "@/lib/intent/recency";
import type { Platform, PostMetrics, PostScores } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allPlatforms = [
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
  "Product Hunt",
  "Personal Site",
  "TikTok",
  "Website",
  "Substack",
  "App Store",
  "Referral",
  "Consulting",
] as const satisfies readonly Platform[];

const requestSchema = z.object({
  text: z.string().min(1),
  platform: z.enum(allPlatforms),
  employeeId: z.string().optional(),
  timestamp: z.string().optional(),
});

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

export async function POST(request: Request) {
  const raw = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
  }

  const employee = parsed.data.employeeId
    ? await db.employee.findUnique({ where: { id: parsed.data.employeeId } })
    : null;
  const intent = classifyIntent(parsed.data.text, {
    name: employee?.name ?? parsed.data.employeeId ?? "Manual",
    role: employee?.role ?? "Manual classification",
    platform: parsed.data.platform,
  });
  const outcome = classifyOutcome({ text: parsed.data.text, metrics: emptyMetrics, scores: emptyScores }, intent.intentClass);
  const coord = postToCoord(
    `${parsed.data.employeeId ?? "manual"}:${parsed.data.text}`,
    parsed.data.employeeId ?? "manual",
    intent.intentClass,
    outcome.outcome,
    parsed.data.platform,
  );

  return NextResponse.json({
    ok: true,
    intent,
    outcome,
    coord,
    recency: recencyVisual(parsed.data.timestamp ?? new Date().toISOString()),
    platformColor: PLATFORM_COLORS[parsed.data.platform],
  });
}

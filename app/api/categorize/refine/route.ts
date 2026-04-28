import { NextResponse } from "next/server";
import { z } from "zod";

import { recategorizeAllLowConfidence, recategorizeForEmployee } from "@/lib/intent/recategorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const requestSchema = z.object({
  employeeId: z.string().optional(),
});

export async function POST(request: Request) {
  const raw = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    if (parsed.data.employeeId) {
      const { posts, skipped, errors } = await recategorizeForEmployee(parsed.data.employeeId);
      return NextResponse.json({ ok: true, refined: 0, skipped, errors, posts, reason: "llm_disabled" });
    }

    const { refined: _refined, skipped, errors } = await recategorizeAllLowConfidence();
    return NextResponse.json({ ok: true, refined: 0, skipped, errors, reason: "llm_disabled" });
  }

  if (parsed.data.employeeId) {
    const result = await recategorizeForEmployee(parsed.data.employeeId);
    return NextResponse.json({ ok: true, refined: result.refined, skipped: result.skipped, errors: result.errors });
  }

  const result = await recategorizeAllLowConfidence();
  return NextResponse.json({ ok: true, ...result });
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { recategorizeAllLowConfidence, recategorizeForEmployee } from "@/lib/intent/recategorize";
import { createRefineEndpoint } from "@/lib/intent/refineEndpoint";

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

  const refine = createRefineEndpoint({ recategorizeForEmployee, recategorizeAllLowConfidence });
  const result = await refine(parsed.data);
  return NextResponse.json(result);
}

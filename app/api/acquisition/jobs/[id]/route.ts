import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.acquisitionJob.findUnique({
    where: { id },
    include: {
      surface: { include: { employee: true } },
      rawActivities: { orderBy: { publishedAt: "desc" }, take: 25 },
    },
  });

  if (!job) return NextResponse.json({ ok: false, error: "job_not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, job });
}

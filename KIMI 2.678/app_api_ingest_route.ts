// app/api/ingest/route.ts
// GET /api/ingest — run full ingestion (protected, for cron)
// GET /api/ingest?source=youtube — run single source

import { NextRequest, NextResponse } from "next/server";
import { 
  ingestYouTube, 
  ingestXPublic, 
  ingestSubstackRSS, 
  ingestGitHub 
} from "@/lib/ingestion/pipeline";

export async function GET(req: NextRequest) {
  // Simple auth check — add proper auth in production
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source");

  try {
    if (source === "youtube") {
      const result = await ingestYouTube("EveryInc", 90);
      return NextResponse.json({ source: "youtube", ...result });
    }

    if (source === "x_company") {
      const result = await ingestXPublic("every", "company", "comp_every_001", 90);
      return NextResponse.json({ source: "x_company", ...result });
    }

    if (source === "x_dan") {
      const result = await ingestXPublic("danshipper", "employee", "emp_001", 90);
      return NextResponse.json({ source: "x_dan", ...result });
    }

    if (source === "github") {
      const result = await ingestGitHub("EveryInc", "company", "comp_every_001", 90);
      return NextResponse.json({ source: "github", ...result });
    }

    // Default: run all
    const results: Record<string, any> = {};
    results.youtube = await ingestYouTube("EveryInc", 90);
    results.x_company = await ingestXPublic("every", "company", "comp_every_001", 90);
    results.x_dan = await ingestXPublic("danshipper", "employee", "emp_001", 90);
    results.substack_dan = await ingestSubstackRSS("danshipper", "employee", "emp_001", 90);

    return NextResponse.json({ success: true, results });

  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

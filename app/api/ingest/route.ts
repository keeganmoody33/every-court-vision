import { NextRequest, NextResponse } from "next/server";

import {
  ingestGitHub,
  ingestSubstackRSS,
  ingestXPublic,
  ingestYouTube,
  runFullIngestion,
} from "@/lib/ingestion/pipeline";

const EVERY_ID = "comp_every_001";

export async function GET(req: NextRequest) {
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
      const result = await ingestXPublic("every", "company", EVERY_ID, 90);
      return NextResponse.json({ source: "x_company", ...result });
    }

    if (source === "x_dan") {
      const result = await ingestXPublic("danshipper", "employee", "emp_001", 90);
      return NextResponse.json({ source: "x_dan", ...result });
    }

    if (source === "x_austin") {
      const result = await ingestXPublic("austin_tedesco", "employee", "emp_002", 90);
      return NextResponse.json({ source: "x_austin", ...result });
    }

    if (source === "substack_dan") {
      const result = await ingestSubstackRSS("danshipper", "employee", "emp_001", 90);
      return NextResponse.json({ source: "substack_dan", ...result });
    }

    if (source === "substack_austin") {
      const result = await ingestSubstackRSS("austintedesco", "employee", "emp_002", 90);
      return NextResponse.json({ source: "substack_austin", ...result });
    }

    if (source === "github" || source === "github_company") {
      const result = await ingestGitHub("EveryInc", "company", EVERY_ID, 90);
      return NextResponse.json({ source: "github_company", ...result });
    }

    if (source === "github_kieran") {
      const result = await ingestGitHub("kieranklaassen", "employee", "emp_005", 90);
      return NextResponse.json({ source: "github_kieran", ...result });
    }

    const results = await runFullIngestion();
    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

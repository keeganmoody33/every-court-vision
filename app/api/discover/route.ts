import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

import {
  discoverEmployeeSurfaces,
  parseSurfaceFilter,
  saveDiscoveryResults,
} from "@/lib/discovery/engine";
import { sql } from "@/lib/db-neon";
import type { Employee } from "@/lib/db-types";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const scope = searchParams.get("scope");
  const surface = searchParams.get("surface");

  const surfaceFilter = parseSurfaceFilter(surface);

  if (surface && !surfaceFilter) {
    return NextResponse.json(
      { error: `Invalid surface: "${surface}". Valid values: x, linkedin, github, substack, youtube, instagram, tiktok, product_hunt, personal_site, podcast, newsletter, medium, devto, dribbble, figma, twitch, calendly, discord, book, external_interview, other` },
      { status: 400 },
    );
  }

  const jobId = randomUUID();
  const jobType = employeeId
    ? "employee"
    : scope === "public_facing"
      ? "public_roster"
      : "full_roster";
  const startedAt = new Date();

  await sql`
    INSERT INTO "DiscoveryJob" (
      id, "jobType", status, "employeeId", surface, "startedAt"
    ) VALUES (
      ${jobId}, ${jobType}, 'running', ${employeeId}, ${surface}, ${startedAt}
    )
  `;

  try {
    const employees = (employeeId
      ? await sql`SELECT * FROM "Employee" WHERE id = ${employeeId}`
      : scope === "public_facing"
        ? await sql`SELECT * FROM "Employee" WHERE "isPublicFacing" = true`
        : await sql`SELECT * FROM "Employee"`) as Employee[];

    let totalFound = 0;
    let totalUpdated = 0;

    const surfacesOpt = surfaceFilter ?? undefined;

    for (const emp of employees) {
      const results = await discoverEmployeeSurfaces(
        {
          id: emp.id,
          name: emp.name,
          role: emp.role,
        },
        surfacesOpt,
      );

      await saveDiscoveryResults(emp.id, results);
      totalFound += results.length;
      totalUpdated += results.filter((r) => r.status !== "unknown").length;
    }

    await sql`
      UPDATE "DiscoveryJob"
      SET status = 'completed',
          "surfacesFound" = ${totalFound},
          "surfacesUpdated" = ${totalUpdated},
          "completedAt" = ${new Date()}
      WHERE id = ${jobId}
    `;

    return NextResponse.json({
      success: true,
      jobId,
      employeesScanned: employees.length,
      surfacesFound: totalFound,
      surfacesUpdated: totalUpdated,
    });
  } catch (err) {
    await sql`
      UPDATE "DiscoveryJob"
      SET status = 'failed',
          errors = ${[String(err)]},
          "completedAt" = ${new Date()}
      WHERE id = ${jobId}
    `;

    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

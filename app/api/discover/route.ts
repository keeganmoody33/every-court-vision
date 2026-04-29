import { NextRequest, NextResponse } from "next/server";

import {
  discoverEmployeeSurfaces,
  parseSurfaceFilter,
  saveDiscoveryResults,
} from "@/lib/discovery/engine";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const scope = searchParams.get("scope");
  const surface = searchParams.get("surface");

  const surfaceFilter = parseSurfaceFilter(surface);

  const job = await prisma.discoveryJob.create({
    data: {
      jobType: employeeId
        ? "employee"
        : scope === "public_facing"
          ? "public_roster"
          : "full_roster",
      status: "running",
      employeeId,
      surface,
      startedAt: new Date(),
    },
  });

  try {
    const where = employeeId
      ? { id: employeeId }
      : scope === "public_facing"
        ? { isPublicFacing: true }
        : {};

    const employees = await prisma.employee.findMany({ where });

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

    await prisma.discoveryJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        surfacesFound: totalFound,
        surfacesUpdated: totalUpdated,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      employeesScanned: employees.length,
      surfacesFound: totalFound,
      surfacesUpdated: totalUpdated,
    });
  } catch (err) {
    await prisma.discoveryJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        errors: [String(err)],
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

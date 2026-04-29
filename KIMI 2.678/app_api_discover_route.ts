// app/api/discover/route.ts
// GET /api/discover — run surface discovery
// GET /api/discover?employeeId=emp_001 — discover one employee
// GET /api/discover?scope=public_facing — discover only public-facing
// GET /api/discover?surface=x — discover only X surfaces

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { discoverEmployeeSurfaces, saveDiscoveryResults } from "@/lib/discovery/engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const scope = searchParams.get("scope"); // "all" | "public_facing"
  const surface = searchParams.get("surface");

  // Create job record
  const job = await prisma.discoveryJob.create({
    data: {
      jobType: employeeId ? "employee" : scope === "public_facing" ? "full_roster" : "full_roster",
      status: "running",
      employeeId,
      surface,
      startedAt: new Date(),
    },
  });

  try {
    // Build employee list
    const where = employeeId 
      ? { id: employeeId }
      : scope === "public_facing" 
        ? { isPublicFacing: true }
        : {};

    const employees = await prisma.employee.findMany({ where });

    let totalFound = 0;
    let totalUpdated = 0;

    for (const emp of employees) {
      const results = await discoverEmployeeSurfaces({
        id: emp.id,
        name: emp.name,
        role: emp.role,
      });

      await saveDiscoveryResults(emp.id, results);
      totalFound += results.length;
      totalUpdated += results.filter(r => r.status !== "unknown").length;
    }

    // Update job
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

    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

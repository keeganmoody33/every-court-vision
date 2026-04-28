import { ArrowUpRight } from "lucide-react";

import { ProgressLine } from "@/components/ProgressLine";
import { SyntheticPill } from "@/components/SyntheticPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employee, EmployeeWithSurfaces } from "@/lib/types";

export function PlayerCard({ employee }: { employee: Employee | EmployeeWithSurfaces }) {
  const postCount = "postCount" in employee ? employee.postCount : undefined;
  const pendingPosts = postCount === 0;
  // While Phase 4 acquisition is unwired, every seeded post has no sourceId.
  // Show the pill on any card with seeded data so viewers know the metrics are
  // preview-grade. Cards with `pendingPosts` already render a "Data Readiness"
  // panel and don't need an additional pill.
  const showSyntheticPill = postCount !== undefined && postCount > 0;

  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="stat-label">{employee.role}</p>
            <CardTitle className="mt-1 text-2xl">{employee.name}</CardTitle>
            <p className="mt-1 text-sm text-primary">{employee.archetype}</p>
            {showSyntheticPill ? (
              <div className="mt-2">
                <SyntheticPill compact />
              </div>
            ) : null}
          </div>
          <ArrowUpRight className="size-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Mini label="Primary" value={employee.primarySurface} />
          <Mini label="Secondary" value={employee.secondarySurface} />
          <Mini label="Best Shot" value={employee.bestShot} wide />
          <Mini label="Best Assist" value={employee.bestAssist} wide />
        </div>
        <div className="space-y-3">
          {pendingPosts ? (
            <div className="rounded-md border border-white/10 bg-black/20 p-3">
              <p className="stat-label">Data Readiness</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Public surfaces are mapped. Post-level analytics wait for the scrape/import phase, so this card avoids
                showing zeroes as performance.
              </p>
            </div>
          ) : (
            <>
              <ProgressLine label="Surface Presence" value={employee.surfacePresence} />
              <ProgressLine label="Surface IQ" value={employee.surfaceIQ} tone="orange" />
              <ProgressLine label="Trust Gravity" value={employee.trustGravity} tone="purple" />
              <ProgressLine label="Social TS%" value={employee.socialTS} tone="teal" />
            </>
          )}
        </div>
        <div className="rounded-md border border-white/10 bg-black/20 p-3">
          <p className="stat-label">Signature Move</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{employee.signatureMove}</p>
        </div>
        <div className="rounded-md border border-orange-300/20 bg-orange-300/10 p-3">
          <p className="stat-label">Absent Surface Opportunity</p>
          <p className="mt-1 text-sm font-semibold text-white">{employee.opportunity}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Mini({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-md border border-white/10 bg-black/20 p-3 ${wide ? "col-span-2" : ""}`}>
      <p className="stat-label">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

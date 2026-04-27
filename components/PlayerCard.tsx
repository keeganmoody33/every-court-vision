import { ArrowUpRight } from "lucide-react";

import { ProgressLine } from "@/components/ProgressLine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employee } from "@/lib/types";

export function PlayerCard({ employee }: { employee: Employee }) {
  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="stat-label">{employee.role}</p>
            <CardTitle className="mt-1 text-2xl">{employee.name}</CardTitle>
            <p className="mt-1 text-sm text-primary">{employee.archetype}</p>
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
          <ProgressLine label="Surface Presence" value={employee.surfacePresence} />
          <ProgressLine label="Surface IQ" value={employee.surfaceIQ} tone="orange" />
          <ProgressLine label="Trust Gravity" value={employee.trustGravity} tone="purple" />
          <ProgressLine label="Social TS%" value={employee.socialTS} tone="teal" />
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

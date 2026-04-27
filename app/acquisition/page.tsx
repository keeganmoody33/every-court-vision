import { DatabaseZap, FileWarning, Network, Radar } from "lucide-react";

import { AcquisitionTable } from "@/components/AcquisitionTable";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAcquisitionRows } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AcquisitionPage() {
  const rows = await getAcquisitionRows();
  const live = rows.filter((row) => row.coverageStatus === "Live coverage").length;
  const manual = rows.filter((row) => row.coverageStatus === "Manual import required").length;
  const raw = rows.reduce((sum, row) => sum + row.rawActivityCount, 0);
  const posts = rows.reduce((sum, row) => sum + row.postCount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Routed Surfaces" value={String(rows.length)} detail="Verified handles and company surfaces" icon={Radar} accent="text-sky-300" />
        <MetricCard label="Live Coverage" value={String(live)} detail="Surfaces with posts in the DB" icon={DatabaseZap} accent="text-emerald-300" />
        <MetricCard label="Manual Required" value={String(manual)} detail="Protected or restricted surfaces" icon={FileWarning} accent="text-violet-300" />
        <MetricCard label="Activity Stored" value={`${raw}/${posts}`} detail="Raw activity records / posts" icon={Network} accent="text-orange-300" />
      </div>

      <Card className="border-white/10 bg-white/[0.045]">
        <CardHeader>
          <CardTitle>Route Doctrine</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {[
            ["1", "Native source", "Official APIs and first-party feeds before anything else."],
            ["2", "Parallel", "Cited discovery and enrichment for sparse or missing surfaces."],
            ["3", "Spider", "Public-page extraction for sites, author pages, and public archives."],
            ["4", "Manual", "Owner export for LinkedIn, private analytics, and restricted surfaces."],
          ].map(([step, title, copy]) => (
            <div key={step} className="rounded-md border border-white/10 bg-black/20 p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Route {step}</div>
              <div className="mt-2 font-semibold text-white">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <AcquisitionTable rows={rows} />
    </div>
  );
}

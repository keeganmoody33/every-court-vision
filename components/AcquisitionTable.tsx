import { AlertTriangle, CheckCircle2, Clock3, Download, PlayCircle } from "lucide-react";

import { AttributionBadge } from "@/components/AttributionBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AcquisitionSurfaceRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusTone: Record<AcquisitionSurfaceRow["coverageStatus"], string> = {
  "Live coverage": "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  "Needs acquisition": "border-amber-400/30 bg-amber-400/10 text-amber-200",
  "Manual import required": "border-violet-400/30 bg-violet-400/10 text-violet-200",
  "Awaiting acquisition": "border-sky-400/30 bg-sky-400/10 text-sky-200",
};

export function AcquisitionTable({ rows }: { rows: AcquisitionSurfaceRow[] }) {
  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Surface Acquisition Router</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Official APIs first, Parallel for cited discovery, Spider for public extraction, manual import for protected surfaces.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button size="sm">
            <PlayCircle className="size-4" />
            Run 90D
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Surface</TableHead>
              <TableHead>Route 1</TableHead>
              <TableHead>Fallback</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Posts</TableHead>
              <TableHead className="text-right">Raw</TableHead>
              <TableHead>Last run</TableHead>
              <TableHead>Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.surfaceId}>
                <TableCell className="min-w-[220px]">
                  <div className="font-medium text-white">{row.employeeName}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {row.platform} · {row.handle}
                  </div>
                </TableCell>
                <TableCell className="min-w-[210px]">
                  <div className="text-sm text-white">{row.primaryRoute?.provider ?? "Unrouted"}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {row.primaryRoute?.capability ?? "No acquisition policy configured."}
                  </div>
                  {row.primaryRoute?.requiredEnv ? (
                    <div className="mt-1 text-xs text-amber-200">{row.primaryRoute.requiredEnv}</div>
                  ) : null}
                </TableCell>
                <TableCell className="min-w-[190px]">
                  <div className="text-sm text-white">{row.nextFallback?.provider ?? "None"}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {row.nextFallback?.capability ?? "No fallback route."}
                  </div>
                </TableCell>
                <TableCell className="min-w-[180px]">
                  <Badge variant="outline" className={cn("border", statusTone[row.coverageStatus])}>
                    {iconFor(row.coverageStatus)}
                    <span className="ml-1">{row.coverageStatus}</span>
                  </Badge>
                  {row.failureReason ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{row.failureReason}</p>
                  ) : null}
                </TableCell>
                <TableCell className="text-right font-semibold text-white">{row.postCount}</TableCell>
                <TableCell className="text-right font-semibold text-white">{row.rawActivityCount}</TableCell>
                <TableCell className="min-w-[150px] text-xs text-muted-foreground">
                  {row.lastRunAt ? new Date(row.lastRunAt).toLocaleString() : "Not run"}
                  {row.lastProvider ? <div className="mt-1 text-white">{row.lastProvider}</div> : null}
                </TableCell>
                <TableCell>
                  <AttributionBadge confidence={row.confidence} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function iconFor(status: AcquisitionSurfaceRow["coverageStatus"]) {
  if (status === "Live coverage") return <CheckCircle2 className="size-3" />;
  if (status === "Manual import required") return <AlertTriangle className="size-3" />;
  if (status === "Needs acquisition") return <PlayCircle className="size-3" />;
  return <Clock3 className="size-3" />;
}

"use client";

import { Badge } from "@/components/ui/badge";
import { useFilters } from "@/components/AppShell";
import { ShotPlot } from "@/components/ShotPlot";
import { filterPosts } from "@/lib/aggregations";
import { posts } from "@/lib/mockData";

export default function ShotPlotPage() {
  const { filters } = useFilters();
  const filtered = filterPosts(posts, filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="stat-label">Individual Posts</p>
          <h2 className="text-2xl font-bold">Shot Plot</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Made/miss recalculates for the selected scoring mode. Click any shot for film-room details.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="blue">Blue circle = made shot</Badge>
          <Badge variant="red">Red X = miss</Badge>
          <Badge variant="purple">Purple ring = assist</Badge>
        </div>
      </div>
      <ShotPlot posts={filtered} scoringMode={filters.scoringMode} />
    </div>
  );
}

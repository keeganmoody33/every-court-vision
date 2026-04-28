import { Badge } from "@/components/ui/badge";
import { ShotPlot } from "@/components/ShotPlot";
import { employeeMapFromRoster, filtersFromSearchParams, getPlays, getPosts, getRippleEvents, getRoster, playMapFromPlays } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ShotPlotPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFromSearchParams(await searchParams);
  // Posts feed both the chart and the ripple-event scoping; load once, share.
  const [filtered, roster, plays] = await Promise.all([getPosts(filters), getRoster(), getPlays()]);
  const rippleEvents = await getRippleEvents(filters, filtered);
  const employeeMap = employeeMapFromRoster(roster);
  const playMap = playMapFromPlays(plays);

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
      <ShotPlot
        posts={filtered}
        scoringMode={filters.scoringMode}
        employeeMap={employeeMap}
        playMap={playMap}
        rippleEvents={rippleEvents}
      />
    </div>
  );
}

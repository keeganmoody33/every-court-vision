import { Badge } from "@/components/ui/badge";
import { ShotPlot } from "@/components/ShotPlot";
import {
  employeeMapFromRoster,
  filtersFromSearchParams,
  getAllRippleEvents,
  getPlays,
  getPosts,
  getRoster,
  playMapFromPlays,
  scopeRippleEventsToPosts,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ShotPlotPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFromSearchParams(await searchParams);
  // Run all four DB round-trips in parallel; scope ripple events to the
  // filtered post set in memory once everything resolves.
  const [filtered, roster, plays, allRippleEvents] = await Promise.all([
    getPosts(filters),
    getRoster(),
    getPlays(),
    getAllRippleEvents(),
  ]);
  const rippleEvents = scopeRippleEventsToPosts(allRippleEvents, filtered);
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

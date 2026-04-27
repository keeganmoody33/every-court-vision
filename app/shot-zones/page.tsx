import { ShotZones } from "@/components/ShotZones";
import { filtersFromSearchParams, getPlays, getPosts, playMapFromPlays } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ShotZonesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFromSearchParams(await searchParams);
  const [filtered, plays] = await Promise.all([getPosts(filters), getPlays()]);
  const playMap = playMapFromPlays(plays);

  return (
    <div className="space-y-6">
      <div>
        <p className="stat-label">Surface and Content Motion Groups</p>
        <h2 className="text-2xl font-bold">Shot Zones</h2>
      </div>
      <ShotZones posts={filtered} zoneMode={filters.zoneMode} playMap={playMap} />
    </div>
  );
}

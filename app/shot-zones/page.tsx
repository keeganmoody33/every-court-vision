import { Layers3 } from "lucide-react";

import { HudPanel } from "@/components/ArcadeChrome";
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
      <HudPanel
        kicker="Surface and Content Motion Groups"
        title="Zones ranked by Social TS%, assist rate, and recommended play."
        tone="purple"
        icon={Layers3}
      >
        <ShotZones posts={filtered} zoneMode={filters.zoneMode} playMap={playMap} />
      </HudPanel>
    </div>
  );
}

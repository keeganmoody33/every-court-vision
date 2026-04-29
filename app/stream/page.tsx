import { RadioTower } from "lucide-react";

import { HudPanel } from "@/components/ArcadeChrome";
import { RippleGraph } from "@/components/RippleGraph";
import { StreamTimeline } from "@/components/StreamTimeline";
import { filtersFromSearchParams, getRippleEvents } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function StreamPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFromSearchParams(await searchParams);
  const rippleEvents = await getRippleEvents(filters);
  const rootId = rippleEvents.find((event) => event.rootPostId === "post-austin-ai-consulting")?.rootPostId ?? rippleEvents[0]?.rootPostId;
  const rootEvents = rippleEvents.filter((event) => event.rootPostId === rootId);

  return (
    <div className="space-y-6">
      <StreamTimeline rippleEvents={rippleEvents} />
      <HudPanel
        kicker="Ripple Replay"
        title="Root Post -> Teammate Quote -> External Repost -> Conversion"
        tone="blue"
        icon={RadioTower}
      >
        <RippleGraph events={rootEvents} />
      </HudPanel>
    </div>
  );
}

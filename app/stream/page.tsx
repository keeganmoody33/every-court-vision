import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div>
        <p className="stat-label">Diffusion Timeline</p>
        <h2 className="text-2xl font-bold">Stream</h2>
      </div>
      <StreamTimeline rippleEvents={rippleEvents} />
      <Card className="border-white/10 bg-white/[0.045]">
        <CardHeader>
          <p className="stat-label">Ripple Replay</p>
          <CardTitle>Root Post {"->"} Teammate Quote {"->"} External Repost {"->"} Conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <RippleGraph events={rootEvents} />
        </CardContent>
      </Card>
    </div>
  );
}

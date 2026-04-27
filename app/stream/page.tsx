"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RippleGraph } from "@/components/RippleGraph";
import { StreamTimeline } from "@/components/StreamTimeline";
import { rippleEvents } from "@/lib/mockData";

export default function StreamPage() {
  const rootEvents = rippleEvents.filter((event) => event.rootPostId === "post-austin-ai-consulting");

  return (
    <div className="space-y-6">
      <div>
        <p className="stat-label">Diffusion Timeline</p>
        <h2 className="text-2xl font-bold">Stream</h2>
      </div>
      <StreamTimeline />
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

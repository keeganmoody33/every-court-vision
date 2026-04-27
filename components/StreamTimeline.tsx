"use client";

import { useMemo, useState } from "react";
import { CircleDot, Filter } from "lucide-react";

import { AttributionBadge } from "@/components/AttributionBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import type { RippleEvent } from "@/lib/types";

const filters = [
  "All events",
  "Conversions only",
  "Teammate assists",
  "External amplification",
  "High-intent replies",
  "Known prospects",
  "Revenue events",
];

export function StreamTimeline({ rippleEvents }: { rippleEvents: RippleEvent[] }) {
  const [active, setActive] = useState("All events");
  const events = useMemo(() => {
    if (active === "All events") return rippleEvents;
    if (active === "Conversions only") return rippleEvents.filter((event) => /Signup|Paid|Consulting/.test(event.eventType));
    if (active === "Teammate assists") return rippleEvents.filter((event) => event.platform === "Teammate Amplification");
    if (active === "External amplification") return rippleEvents.filter((event) => event.platform === "External Amplification");
    if (active === "High-intent replies") return rippleEvents.filter((event) => event.eventType.includes("Replies"));
    if (active === "Known prospects") return rippleEvents.filter((event) => event.actor.includes("prospects"));
    return rippleEvents.filter((event) => /Consulting|Paid/.test(event.eventType));
  }, [active, rippleEvents]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-primary" />
        {filters.map((filter) => (
          <Button key={filter} size="sm" variant={active === filter ? "secondary" : "outline"} onClick={() => setActive(filter)}>
            {filter}
          </Button>
        ))}
      </div>
      <Card className="border-white/10 bg-white/[0.045]">
        <CardContent className="p-0">
          <div className="divide-y divide-white/10">
            {events.map((event) => (
              <div key={event.id} className="grid gap-3 p-4 md:grid-cols-[140px_1fr_auto] md:items-center">
                <div className="font-mono text-xs text-muted-foreground">{formatDateTime(event.timestamp)}</div>
                <div className="flex min-w-0 items-start gap-3">
                  <CircleDot className="mt-1 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold text-white">{event.actor}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.eventType} on {event.platform}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-white">{event.value ? formatNumber(event.value) : "-"}</span>
                  <AttributionBadge confidence={event.confidence} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Database, KeyRound, Network, Sparkles } from "lucide-react";

import { HudPanel } from "@/components/ArcadeChrome";
import { AttributionBadge } from "@/components/AttributionBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDataSources } from "@/lib/queries";

const columns = [
  { name: "Public Surface Data", icon: Network },
  { name: "Authenticated Platform Data", icon: KeyRound },
  { name: "Internal Analytics", icon: Database },
  { name: "Modeled Intelligence", icon: Sparkles },
] as const;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AttributionPage() {
  const dataSources = await getDataSources();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const Icon = column.icon;
          const sources = dataSources.filter((source) => source.category === column.name);
          return (
            <Card key={column.name} className="border-white/10 bg-white/[0.045]">
              <CardHeader>
                <Icon className="mb-2 size-5 text-primary" />
                <CardTitle>{column.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sources.map((source) => (
                  <div key={source.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{source.name}</p>
                      <AttributionBadge confidence={source.confidence} />
                    </div>
                    <p className="text-sm leading-5 text-muted-foreground">{source.description}</p>
                    <p className="mt-2 font-mono text-xs text-primary">{source.readiness}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <HudPanel kicker="Confidence Badges" title="How to read the prototype" tone="blue" icon={Sparkles}>
        <div className="flex flex-wrap gap-2">
          {["Direct", "Estimated", "Modeled", "Hypothesis", "Needs Internal Analytics"].map((confidence) => (
            <AttributionBadge key={confidence} confidence={confidence as never} />
          ))}
        </div>
      </HudPanel>
    </div>
  );
}

import { FlaskConical } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Play } from "@/lib/types";

export function PlayCard({ play }: { play: Play }) {
  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="stat-label">{play.bestFor}</p>
            <CardTitle className="mt-1">{play.name}</CardTitle>
          </div>
          <FlaskConical className="size-5 text-orange-300" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6">
        <div>
          <p className="stat-label">Best Platforms</p>
          <p className="text-white">{play.bestPlatforms.join(", ")}</p>
        </div>
        <Section label="Structure" value={play.structure} />
        <Section label="Why it works" value={play.whyItWorks} />
        <Section label="Historical signal" value={play.historicalSignal} />
        <div className="rounded-md border border-orange-300/20 bg-orange-300/10 p-3">
          <p className="stat-label">Recommended Next Experiment</p>
          <p className="mt-1 text-white">{play.recommendedNextExperiment}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="stat-label">{label}</p>
      <p className="mt-1 text-muted-foreground">{value}</p>
    </div>
  );
}

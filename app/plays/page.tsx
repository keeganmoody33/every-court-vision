import { FlaskConical } from "lucide-react";

import { HudPanel } from "@/components/ArcadeChrome";
import { PlayCard } from "@/components/PlayCard";
import { employeeMapFromRoster, getExperiments, getPlays, getRoster } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PlaysPage() {
  const [plays, experiments, roster] = await Promise.all([getPlays(), getExperiments(), getRoster()]);
  const employeeById = employeeMapFromRoster(roster);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plays.map((play) => (
          <PlayCard key={play.id} play={play} />
        ))}
      </div>
      <HudPanel kicker="Next Experiments" title="Active play tests" tone="purple" icon={FlaskConical}>
        <div className="grid gap-3 md:grid-cols-2">
          {experiments.map((experiment) => (
            <div key={experiment.id} className="rounded-md border border-white/10 bg-black/30 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">{experiment.name}</h3>
                <span className="rounded-full border border-arcade-magenta/25 bg-arcade-magenta/10 px-2 py-0.5 text-xs text-arcade-magenta">
                  {experiment.status}
                </span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{experiment.hypothesis}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Owner: {employeeById[experiment.ownerEmployeeId]?.name} / Metric: {experiment.metric}
              </p>
            </div>
          ))}
        </div>
      </HudPanel>
    </div>
  );
}

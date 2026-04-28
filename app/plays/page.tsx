import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCard } from "@/components/PlayCard";
import { employeeMapFromRoster, getExperiments, getPlays, getRoster } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PlaysPage() {
  const [plays, experiments, roster] = await Promise.all([getPlays(), getExperiments(), getRoster()]);
  const employeeById = employeeMapFromRoster(roster);

  return (
    <div className="space-y-6">
      <div>
        <p className="stat-label">Experiments and Motion Design</p>
        <h2 className="text-2xl font-bold">Plays</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plays.map((play) => (
          <PlayCard key={play.id} play={play} />
        ))}
      </div>
      <Card className="border-white/10 bg-white/[0.045]">
        <CardHeader>
          <p className="stat-label">Next Experiments</p>
          <CardTitle>Active play tests</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {experiments.map((experiment) => (
            <div key={experiment.id} className="rounded-md border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">{experiment.name}</h3>
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {experiment.status}
                </span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{experiment.hypothesis}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Owner: {employeeById[experiment.ownerEmployeeId]?.name} / Metric: {experiment.metric}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

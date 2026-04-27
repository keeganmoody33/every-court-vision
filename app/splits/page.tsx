import { SplitsView } from "@/components/SplitsView";
import { employeeMapFromRoster, filtersFromSearchParams, getPosts, getRoster } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SplitsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFromSearchParams(await searchParams);
  const [filtered, roster] = await Promise.all([getPosts(filters), getRoster()]);
  const employeeMap = employeeMapFromRoster(roster);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="stat-label">NBA-style Tables</p>
          <h2 className="text-2xl font-bold">Splits</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Split by platform, employee, archetype, content type, campaign, launch window, and time in future connector mode.
          </p>
        </div>
      </div>
      <SplitsView posts={filtered} employeeMap={employeeMap} />
    </div>
  );
}

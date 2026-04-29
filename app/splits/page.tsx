import { Table2 } from "lucide-react";

import { HudPanel } from "@/components/ArcadeChrome";
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
      <HudPanel
        kicker="NBA-style Tables"
        title="Split by platform, employee, archetype, content type, and campaign."
        tone="teal"
        icon={Table2}
      >
        <SplitsView posts={filtered} employeeMap={employeeMap} />
      </HudPanel>
    </div>
  );
}

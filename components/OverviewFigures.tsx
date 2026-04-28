import { Figure } from "@/components/essay";
import { OverviewSurfaceChart, OverviewRosterChart } from "@/components/OverviewFiguresClient";
import { groupPosts, sumMetrics } from "@/lib/aggregations";
import type { Employee, Post } from "@/lib/types";

/**
 * Two inline figures that anchor the /overview essay's middle act:
 *
 *   Fig. 02 — surface flow (reach → signups across the platform set)
 *   Fig. 02b — roster intelligence (Trust × Social TS% × Assists)
 *
 * Splits the existing OverviewCharts into two Figure-wrapped panels so the
 * editorial rhythm (eyebrow → title → caption → chart → Read with Bobbito) lands
 * on each chart. Computes data server-side, hands typed shapes to the client charts.
 */
export function OverviewFigures({
  posts,
  employeeMap,
}: {
  posts: Post[];
  employeeMap: Record<string, Employee>;
}) {
  const platformData = Object.entries(groupPosts(posts, (post) => post.platform)).map(
    ([platform, group]) => {
      const m = sumMetrics(group);
      return {
        platform,
        reach: m.reach,
        signups: m.signups,
        paid: m.paidSubscriptions,
        consulting: m.consultingLeads,
        assists: m.assistedConversions,
      };
    },
  );

  // Single pass per employee — accumulate trust, TS, and assists in one loop instead
  // of running sumMetrics + two separate reduces.
  const employeeData = Object.entries(groupPosts(posts, (post) => post.employeeId))
    .map(([employeeId, group]) => {
      let totalTrust = 0;
      let totalSocialTS = 0;
      let assistedConversions = 0;
      for (const post of group) {
        totalTrust += post.scores.trustGravity;
        totalSocialTS += post.scores.socialTS;
        assistedConversions += post.metrics.assistedConversions;
      }
      const count = Math.max(1, group.length);
      return {
        name: employeeMap[employeeId]?.name.split(" ")[0] ?? employeeId,
        Trust: totalTrust / count,
        "Social TS": totalSocialTS / count,
        Assists: assistedConversions / 10,
      };
    })
    .sort((a, b) => b.Trust - a.Trust)
    .slice(0, 8);

  return (
    <div className="space-y-2 lg:space-y-4">
      <Figure
        number="02"
        eyebrow="Surface flow"
        title="Reach didn&rsquo;t go where conversion went."
        caption="Platform-level: blue line is reach (possessions); orange-filled line is signups (made baskets). Where they diverge, the surface earned attention without earning action — or vice versa."
        ledeRight={`${platformData.length} surfaces`}
        source="Aggregated platform metrics"
        agent="Bobbito"
        agentPrompt="Where did reach lead conversion this period, and where did it just make noise?"
      >
        <div className="h-80 sm:h-96">
          <OverviewSurfaceChart data={platformData} />
        </div>
      </Figure>

      <Figure
        number="02b"
        eyebrow="Roster intelligence"
        title="Trust, TS%, and assist profile by player."
        caption="Top eight by Trust Gravity. Tall purple bar = the player&rsquo;s audience treats their posts as signal; tall teal = they convert efficiently per attempt; tall orange = they make their teammates&rsquo; next shots easier."
        ledeRight={`${employeeData.length}/${Object.keys(employeeMap).length} shown`}
        source="Per-author scoring corpus"
        agent="Bobbito"
        agentPrompt="Read the bar mix per player. Who&rsquo;s the assist engine no one&rsquo;s named?"
      >
        <div className="h-80 sm:h-96">
          <OverviewRosterChart data={employeeData} />
        </div>
      </Figure>
    </div>
  );
}

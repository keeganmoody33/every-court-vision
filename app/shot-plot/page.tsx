import { IntentFilterChips } from "@/components/IntentFilterChips";
import { ShotPlot } from "@/components/ShotPlot";
import { Body, Byline, Cover, Essay, Figure, Lede, Pull, Section, TLDR } from "@/components/essay";
import {
  employeeMapFromRoster,
  filtersFromSearchParams,
  getAllRippleEvents,
  getPlays,
  getPosts,
  getRoster,
  playMapFromPlays,
  scopeRippleEventsToPosts,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatBriefingDate(d: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(d);
}

export default async function ShotPlotPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFromSearchParams(await searchParams);
  const briefingDate = formatBriefingDate(new Date());
  const [filtered, roster, plays, allRippleEvents] = await Promise.all([
    getPosts(filters),
    getRoster(),
    getPlays(),
    getAllRippleEvents(),
  ]);
  const rippleEvents = scopeRippleEventsToPosts(allRippleEvents, filtered);
  const employeeMap = employeeMapFromRoster(roster);
  const playMap = playMapFromPlays(plays);

  return (
    <Essay
      cover={
        <Cover
          eyebrow="Shot Plot · Visual Layer"
          title={
            <>
              Where Every Post
              <br />
              Lands on the Court
            </>
          }
          dek="Position by intent. Color by platform. Brightness by recency."
          variant="court"
        />
      }
    >
      <Byline
        author="The Court Vision desk"
        agent="Bobbito"
        date={briefingDate}
        issue="#3B"
        filedUnder="Every Court Vision · Shot Plot"
      />

      <TLDR
        bullets={[
          "Each mark is one post mapped by Phase 3a's intent and coordinate contract.",
          "Platform color stays consistent across the court; recency controls size and opacity.",
          "Pass-class posts run through lanes, while heuristic assist arcs only draw when a later made shot exists.",
        ]}
      />

      <Lede dropCap>
        The court is the map now. A post does not land on a platform rectangle; it lands where its intent
        says it belongs, with the surface and timing still visible at a glance.
      </Lede>

      <Body>
        Made shots, misses, turnovers, passes, and assists are all read from the locked Phase 3a fields. The
        chart does not reclassify a post or invent a coordinate. It renders the film that already exists in
        the row.
      </Body>

      <IntentFilterChips />

      <Figure
        number="01"
        eyebrow="The shot chart"
        title="Position, platform, recency."
        caption="Two hundred posts across the current window, plotted from deterministic intent coordinates and shaded by surface."
        ledeRight={`${filtered.length} posts`}
        source="Court Vision corpus"
        agent="Bobbito"
        agentPrompt="Read the current shot plot. Which surfaces are creating spacing, and which intents are crowded?"
        surface="court"
        bleed
      >
        <div className="p-3 sm:p-4">
          <ShotPlot
            posts={filtered}
            scoringMode={filters.scoringMode}
            employeeMap={employeeMap}
            playMap={playMap}
            rippleEvents={rippleEvents}
          />
        </div>
      </Figure>

      <Pull>
        Spacing is strategy. A roster that can see where every post lands can stop confusing motion for an
        offense.
      </Pull>

      <Section eyebrow="Reading rule" title="The visual layer is not a classifier.">
        <Body>
          Assist arcs are deliberately conservative. They appear only when an assist-tagged post can be paired
          to a later made shot in the visible window; otherwise the court stays quiet.
        </Body>
      </Section>
    </Essay>
  );
}

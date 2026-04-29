import { HeatMapCourt } from "@/components/HeatMapCourt";
import { IntentFilterChips } from "@/components/IntentFilterChips";
import { Body, Byline, Cover, Essay, Figure, Lede, Pull, Section, TLDR } from "@/components/essay";
import { filtersFromSearchParams, getPosts } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatBriefingDate(d: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(d);
}

export default async function CourtHeatPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFromSearchParams(await searchParams);
  const filtered = await getPosts(filters);
  const briefingDate = formatBriefingDate(new Date());

  return (
    <Essay
      cover={
        <Cover
          eyebrow="Court Heat · Intent Regions"
          title={
            <>
              The Roster&apos;s
              <br />
              Heat Map
            </>
          }
          dek="Volume gathers by intent region. Scoring mode changes the read, not the map."
          variant="court"
        />
      }
    >
      <Byline
        author="The Court Vision desk"
        agent="Bobbito"
        date={briefingDate}
        issue="#3B"
        filedUnder="Every Court Vision · Court Heat"
      />

      <TLDR
        bullets={[
          "The court is divided by intent: threes, midrange, paint, free throws, passes, and turnovers.",
          "Heat is volume first, with Trust and Revenue allowed to shift the accent color.",
          "The selected region panel reports intent efficiency without changing the underlying post contract.",
        ]}
      />

      <Lede dropCap>
        Heat belongs on the floor. The useful question is not which rectangle got more engagement; it is which
        part of the offense the roster keeps returning to.
      </Lede>

      <Body>
        Phase 3a already decided where each post lands. This view keeps that decision intact and aggregates
        the visible corpus into the regions a coach would recognize.
      </Body>

      <IntentFilterChips />

      <Figure
        number="01"
        eyebrow="The floor read"
        title="Six regions, one grammar."
        caption="Intent regions are drawn from the locked court geometry. Pass lanes remain faint because they set up the action."
        ledeRight={`${filtered.length} posts`}
        source="Court Vision corpus"
        agent="Bobbito"
        agentPrompt="Read the current heat map. Which intent regions are crowded, and which ones are underused?"
        surface="court"
        bleed
      >
        <div className="p-3 sm:p-4">
          <HeatMapCourt
            posts={filtered}
            zoneMode={filters.zoneMode}
            colorScale={filters.colorScale}
            scoringMode={filters.scoringMode}
          />
        </div>
      </Figure>

      <Pull>
        A heat map is useful only when it shows choice. The pattern tells the desk what the roster trusts when
        the possession matters.
      </Pull>

      <Section eyebrow="Reading rule" title="Heat is not the same thing as quality.">
        <Body>
          The selected-region panel separates volume from efficiency so a crowded region does not automatically
          become the recommendation.
        </Body>
      </Section>
    </Essay>
  );
}

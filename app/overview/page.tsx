import { CourtTelestrator } from "@/components/CourtTelestrator";
import {
  Body,
  Byline,
  Cover,
  Essay,
  Eyebrow,
  Figure,
  FourTierFeedback,
  Lede,
  Pull,
  Section,
  StatTile,
  TLDR,
} from "@/components/essay";
import { OverviewFigures } from "@/components/OverviewFigures";
import { PlatformCard } from "@/components/PlatformCard";
import { groupPosts, platformCards, sumMetrics } from "@/lib/aggregations";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import {
  employeeMapFromRoster,
  filtersFromSearchParams,
  getPosts,
  getRippleEvents,
  getRoster,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const today = () =>
  new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date());

export default async function OverviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFromSearchParams(await searchParams);
  const [roster, filtered, ripples] = await Promise.all([
    getRoster(),
    getPosts(filters),
    getRippleEvents(filters),
  ]);
  const metrics = sumMetrics(filtered);
  const cards = platformCards(filtered);
  const employeeMap = employeeMapFromRoster(roster);

  // Derived narrative — the data the agent (Bobbito) reads to write the briefing.
  const byPlatform = groupPosts(filtered, (post) => post.platform);
  const byEmployee = groupPosts(filtered, (post) => post.employeeId);

  const platformBySignups = Object.entries(byPlatform)
    .map(([platform, posts]) => ({ platform, signups: sumMetrics(posts).signups }))
    .sort((a, b) => b.signups - a.signups);

  const platformByReach = Object.entries(byPlatform)
    .map(([platform, posts]) => ({ platform, reach: sumMetrics(posts).reach }))
    .sort((a, b) => b.reach - a.reach);

  const topAssister = Object.entries(byEmployee)
    .map(([employeeId, posts]) => ({
      employeeId,
      assists: sumMetrics(posts).assistedConversions,
    }))
    .sort((a, b) => b.assists - a.assists)[0];
  const topAssisterName = topAssister ? (employeeMap[topAssister.employeeId]?.name ?? "the roster") : "the roster";

  // Pre-aggregate ripple value by root in a single pass, then index posts in O(N).
  const rippleSumByRoot = ripples.reduce<Map<string, number>>((acc, event) => {
    if (!event.rootPostId) return acc;
    acc.set(event.rootPostId, (acc.get(event.rootPostId) ?? 0) + (event.value || 0));
    return acc;
  }, new Map());

  const highestRoot = filtered
    .map((post) => ({ post, ripple: rippleSumByRoot.get(post.id) ?? 0 }))
    .sort((a, b) => b.ripple - a.ripple)[0];

  const totalSurfaces = Object.keys(byPlatform).length;
  const conversions = metrics.signups + metrics.paidSubscriptions + metrics.consultingLeads;
  const ts = metrics.views ? (conversions / metrics.views) * 100 : 0;

  return (
    <Essay
      cover={
        <Cover
          eyebrow="Every Studio · #007 · Briefing"
          title={
            <>
              The Last 90 Days,
              <br />
              Read From the Film Room
            </>
          }
          dek={
            <>
              A reading of Every&rsquo;s distributed publishing — what landed, what assisted, and the one
              shot the desk thinks is worth running back.
            </>
          }
          accent={
            <div className="hidden text-right lg:block">
              <p className="font-mono text-eyebrow uppercase tracking-ticker text-court-line/70 tabular">
                Filed
              </p>
              <p className="mt-1 font-serif italic text-caption text-court-line/85">{today()}</p>
              <p className="mt-3 font-mono text-eyebrow uppercase tracking-ticker text-court-line/70 tabular">
                Issue
              </p>
              <p className="font-mono text-stat-lg leading-none text-court-line tabular">#007</p>
            </div>
          }
        />
      }
    >
      <Byline
        author="The Court Vision desk"
        agent="Bobbito"
        date={today()}
        issue="#007"
        filedUnder="Every Court Vision · Briefing"
      />

      <TLDR
        bullets={[
          <>
            Reach across <span className="font-mono tabular">{totalSurfaces}</span> surfaces totaled{" "}
            <span className="font-mono tabular">{formatNumber(metrics.reach)}</span> possessions, with the
            heaviest weight on <strong>{platformByReach[0]?.platform ?? "Newsletter"}</strong> and{" "}
            <strong>{platformByReach[1]?.platform ?? "LinkedIn"}</strong>.
          </>,
          <>
            Conversion concentrated on <strong>{platformBySignups[0]?.platform ?? "Newsletter"}</strong> —{" "}
            <span className="font-mono tabular">{formatNumber(platformBySignups[0]?.signups ?? 0)}</span>{" "}
            signups against <span className="font-mono tabular">{formatNumber(metrics.signups)}</span>{" "}
            company-wide. Social TS% sits at{" "}
            <span className="font-mono tabular">{formatPercent(ts, 2)}</span>.
          </>,
          <>
            <strong>{topAssisterName}</strong> led the roster in assists with{" "}
            <span className="font-mono tabular">{formatNumber(topAssister?.assists ?? 0)}</span> downstream
            conversions credited — see Fig. 03 for the chalk reading on their best chain.
          </>,
          <>
            Worth running back: the {highestRoot?.post.platform ?? "Newsletter"} post from{" "}
            <strong>
              {highestRoot ? (employeeMap[highestRoot.post.employeeId]?.name ?? "the roster") : "the roster"}
            </strong>{" "}
            generated the most measurable downstream value of the period.
          </>,
        ]}
      />

      <Lede dropCap>
        Court Vision is not a leaderboard. It&rsquo;s a film room. The job here is to look at what already
        happened — the reach, the clicks, the assists, the half-finished plays — and read it back the way a
        coach reads tape on Monday morning. The numbers are real. The story is the part the numbers
        can&rsquo;t tell.
      </Lede>

      <Body>
        Across the period, the desk recorded {formatNumber(filtered.length)} shots from{" "}
        {totalSurfaces} surfaces, leading to{" "}
        <span className="font-mono tabular">{formatNumber(conversions)}</span> measurable conversions and{" "}
        <span className="font-mono tabular">{formatCurrency(metrics.revenue)}</span> in modeled revenue.
        Volume is necessary, not sufficient: the next three figures separate volume from efficiency, and
        efficiency from downstream value.
      </Body>

      {/* Fig. 01 — the six numbers, as count-up tiles. */}
      <Figure
        number="01"
        eyebrow="What happened"
        title="Six numbers, ninety days."
        caption="Possessions, attempts, makes — the shape of the company-level box score before any single shot is read on tape."
        ledeRight={`${formatNumber(filtered.length)} posts`}
        source="Court Vision corpus"
        agent="Bobbito"
        agentPrompt="Walk me through the six metrics for the last 90 days."
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatTile
            label="Reach"
            value={formatNumber(metrics.reach)}
            detail="Possessions across public surfaces"
            trend="up"
          />
          <StatTile
            label="Clicks"
            value={formatNumber(metrics.clicks)}
            detail="Shot attempts and profile visits"
          />
          <StatTile
            label="Signups"
            value={formatNumber(metrics.signups)}
            detail="Made baskets into owned audience"
            trend="up"
          />
          <StatTile
            label="Paid Subs"
            value={formatNumber(metrics.paidSubscriptions)}
            detail="Three-pointers from social demand"
          />
          <StatTile
            label="Consulting"
            value={formatNumber(metrics.consultingLeads)}
            detail="And-one high-intent leads"
          />
          <StatTile
            label="Revenue"
            value={formatCurrency(metrics.revenue)}
            detail="Modeled and direct influence"
            trend="up"
          />
        </div>
      </Figure>

      <Body asides={<>Reach is the easiest number to chase and the easiest to misread. Watch what it sets up, not what it clears.</>}>
        Reach is what people see; conversion is what they do; assists are what they make easier for someone
        else. The story of the last ninety days is in the gap between the three. The next figure says it more
        carefully — surface mix on the left, and the same surfaces re-shaded by what they actually converted on
        the right.
      </Body>

      {/* Fig. 02 — surface flow + roster intelligence */}
      <OverviewFigures posts={filtered} employeeMap={employeeMap} />

      <Body>
        That&rsquo;s the volume read. The interesting question — the one a film room is built to answer — is
        what one shot, traced end-to-end, actually <em>created</em>. The next figure is the chalkboard. Each
        chalk arc is a downstream event the system can attribute to a single root post. Pick a different root
        and the chalk redraws.
      </Body>

      {/* Fig. 03 — the centerpiece. Chalk telestrator on court. */}
      <Figure
        number="03"
        eyebrow="The film"
        title="One root, every echo."
        caption="Tap any shot to make it the root. The chalk traces every downstream event the system can attribute to it within the period — color-coded by confidence."
        ledeRight={`${ripples.length} ripple events`}
        source="Mocked corpus · live in production"
        agent="Bobbito"
        agentPrompt="Read the chalk from this root. What does the chain imply about plays we should run again?"
        surface="court"
        bleed
      >
        <div className="p-3 sm:p-4">
          <CourtTelestrator
            posts={filtered}
            rippleEvents={ripples}
            employeeMap={employeeMap}
            height={520}
          />
        </div>
      </Figure>

      <Pull>
        This is not a leaderboard. The goal is not to make everyone shoot more; it is to understand where each
        person&rsquo;s best shot creates awareness, trust, conversion, and assists.
      </Pull>

      <Body>
        Mode-sensitivity is the second cultural rule of the room: a hard CTA can miss on engagement and still
        score on signups; a personal product post can miss on direct conversion and still create the assist
        that makes the next conversion easier. Read the figures with that lens — the same shot can be a miss
        on Awareness and a make on Trust on the same possession.
      </Body>

      <Section eyebrow="Platform mix" title="The surfaces, ranked by what they actually did.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <PlatformCard key={card.platform} {...card} />
          ))}
        </div>
      </Section>

      <Section eyebrow="What we&rsquo;re watching" title="Two things the desk wants tape on next.">
        <div className="grid gap-6 lg:grid-cols-2">
          <DeskNote
            kicker="Mode-sensitive outcomes"
            body="A hard CTA can miss on engagement and still score on signups. A personal product post can miss on direct conversion and still create assists that make the next conversion easier. Worth one more period of tape."
          />
          <DeskNote
            kicker="Trust gravity, by surface"
            body="Trust accrues on the surface, not the post. Two periods of consistent posting on Newsletter and LinkedIn outperformed three high-virality X spikes for downstream paid conversion."
          />
        </div>
      </Section>

      <FourTierFeedback prompt="What did you think of this briefing?" />
    </Essay>
  );
}

function DeskNote({ kicker, body }: { kicker: string; body: string }) {
  return (
    <div className="border-l-2 border-confidence-inferred/60 pl-4">
      <Eyebrow tone="primary">{kicker}</Eyebrow>
      <p className="mt-2 font-serif text-body italic text-foreground/85">{body}</p>
    </div>
  );
}

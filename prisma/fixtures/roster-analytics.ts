export interface SurfaceAnalyticsFixture {
  postsLast90Days?: number;
  followerCount?: number;
  shotDistribution?: Record<string, number>;
  efficiency?: {
    fgPct: number;
    threePtPct: number;
    ftPct: number;
    tsPct: number;
    assistPct: number;
  };
  notableShots?: string[];
  notes?: string;
  opportunity?: string;
}

export interface RosterAnalyticsFixture {
  employeeId: string;
  superpower: string;
  absentSurfaceOpportunity: string;
  growthLoopPosition: string;
  surfaces: Record<string, SurfaceAnalyticsFixture>;
}

export const rosterAnalyticsFixtures: RosterAnalyticsFixture[] = [
  {
    employeeId: "austin-tedesco",
    superpower: "Efficient Volume - low usage, high trust conversion",
    absentSurfaceOpportunity: "NEWSLETTER: A quarterly growth-at-Every essay would convert builder trust into owned audience.",
    growthLoopPosition: "Technical proof-of-work plus narrative proof creates conviction that Every builds real tools.",
    surfaces: {
      twitter: {
        postsLast90Days: 45,
        followerCount: 3200,
        shotDistribution: { three_pointer_promo: 4, midrange_philosophy: 12, freethrow_personal: 18, assist_industry: 8, airball: 3 },
        efficiency: { fgPct: 0.078, threePtPct: 0.092, ftPct: 0.085, tsPct: 0.112, assistPct: 0.178 },
        notableShots: [
          "Wrote about my daily-driver agent for @every, and open-sourced the plugin",
          "Testing Claude Code at Every to automate growth ops",
          "Missing the old ESPN NBA Countdown crew",
          "Retweeted Dan's Spiral workflow thread with commentary on agent adoption",
          "Excited for this week at Every",
        ],
        notes: "Agent experiment tweets are proof-of-work. GitHub proof plus Twitter narrative makes Every feel like a team that builds real tools.",
      },
      linkedin: {
        postsLast90Days: 3,
        followerCount: 2800,
        opportunity: "Monthly AI agents and subscription growth posts would bridge ESPN media strategy to Every growth strategy.",
      },
    },
  },
  {
    employeeId: "dan-shipper",
    superpower: "Narrative Spacing - personal tweets create gravity for product tweets",
    absentSurfaceOpportunity: "LINKEDIN: A quarterly enterprise AI adoption post would unlock consulting conversations Twitter never will.",
    growthLoopPosition: "Founder narrative creates belief, then newsletters and podcasts convert that belief into subscription and consulting demand.",
    surfaces: {
      twitter: {
        postsLast90Days: 340,
        followerCount: 52000,
        shotDistribution: { three_pointer_promo: 22, midrange_philosophy: 110, freethrow_personal: 145, assist_industry: 52, airball: 11 },
        efficiency: { fgPct: 0.064, threePtPct: 0.071, ftPct: 0.081, tsPct: 0.102, assistPct: 0.153 },
        notableShots: [
          "A founder's job is to make the company easier to believe in before it is easy to measure",
          "The next wave of AI companies will not just sell tools. They will sell new operating rhythms",
          "Taste is the bottleneck in AI work",
          "Shared a teammate's product launch with a founder-level read on why it matters",
          "Generic AI is moving fast post with no Every-specific hook",
        ],
        notes: "Dan's personal and category posts create gravity that makes product posts feel less cold.",
      },
      linkedin: {
        postsLast90Days: 8,
        followerCount: 15000,
        opportunity: "Enterprise AI adoption memos could turn founder trust into consulting intent.",
      },
      podcast: {
        postsLast90Days: 12,
        notes: "AI & I creates deep trust and long-tail conversion from high-context interviews.",
      },
    },
  },
  {
    employeeId: "kieran-klaassen",
    superpower: "Conviction Spacing - philosophy tweets explain the product better than product tweets",
    absentSurfaceOpportunity: "NEWSLETTER: A Cora design diary would attract the developer audience that needs to trust the product before trying it.",
    growthLoopPosition: "Builder philosophy and GitHub proof create the technical trust that makes Cora feel inevitable.",
    surfaces: {
      twitter: {
        postsLast90Days: 78,
        followerCount: 8500,
        shotDistribution: { three_pointer_promo: 6, midrange_philosophy: 32, freethrow_personal: 18, assist_industry: 16, airball: 6 },
        efficiency: { fgPct: 0.084, threePtPct: 0.061, ftPct: 0.097, tsPct: 0.118, assistPct: 0.205 },
        notableShots: [
          "Good product taste is often just noticing which parts of the workflow make smart people feel clumsy",
          "Design note: an AI product earns trust when it shows uncertainty without making the user do extra work",
          "Released a small eval harness pattern for checking AI workflow quality",
          "Product diary from launch week: the most useful thing we shipped made edge cases visible",
          "Try Cora today without a product insight attached",
        ],
        notes: "Philosophical product posts outperform direct promo because they explain the taste behind the product.",
      },
      linkedin: {
        postsLast90Days: 6,
        followerCount: 4200,
        opportunity: "Translate technical and design notes into operator language after GitHub proof ships.",
      },
      github: {
        followerCount: 890,
        notes: "GitHub is a credibility surface even when direct clicks are lower.",
      },
    },
  },
  {
    employeeId: "yash-poojary",
    superpower: "Product-as-Personality - promo wrapped in voice, humor, and technical proof",
    absentSurfaceOpportunity: "INSTAGRAM/TIKTOK: A Desktop Archaeology series would make messy-to-clean transformations visual.",
    growthLoopPosition: "Sparkle adoption benefits when the product has a human builder voice and launch-week proof.",
    surfaces: {
      twitter: {
        postsLast90Days: 95,
        followerCount: 6200,
        shotDistribution: { three_pointer_promo: 18, midrange_philosophy: 24, freethrow_personal: 21, assist_industry: 24, airball: 8 },
        efficiency: { fgPct: 0.072, threePtPct: 0.089, ftPct: 0.074, tsPct: 0.109, assistPct: 0.184 },
        notableShots: [
          "Rebuilt Sparkle in 14 days with AI and learned where automation breaks",
          "Your desktop is a mirror of your operating system",
          "A messy Downloads folder is product research",
          "Quoted the launch thread with a concrete cleanup before-and-after",
          "Sparkle update shipped",
        ],
        notes: "Product personality makes Sparkle feel like craft rather than utility software.",
      },
      linkedin: {
        postsLast90Days: 8,
        followerCount: 3100,
        opportunity: "Operator notes about rebuilding with AI can turn Sparkle into a work-design case study.",
      },
    },
  },
  {
    employeeId: "naveen-naidu",
    superpower: "Cultural FT% - trust compounds in public, converts in private",
    absentSurfaceOpportunity: "INSTAGRAM STORIES: Voice-note stories would show how Monologue captures ideas in the product's own format.",
    growthLoopPosition: "Personal voice workflows make Monologue feel native before product CTAs appear.",
    surfaces: {
      twitter: {
        postsLast90Days: 68,
        followerCount: 4800,
        shotDistribution: { three_pointer_promo: 9, midrange_philosophy: 20, freethrow_personal: 26, assist_industry: 9, airball: 4 },
        efficiency: { fgPct: 0.069, threePtPct: 0.076, ftPct: 0.091, tsPct: 0.104, assistPct: 0.132 },
        notableShots: [
          "Voice in, agent action out is a different product than dictation",
          "I keep finding places where typing interrupts thinking",
          "Monologue is most useful when the destination is not known yet",
          "Shared a teammate note about voice workflows and added a builder lens",
          "Download Monologue now",
        ],
        notes: "Voice product trust comes from showing actual moments where typing is the wrong interface.",
      },
      linkedin: {
        postsLast90Days: 5,
        followerCount: 2600,
        opportunity: "LinkedIn can turn voice-product philosophy into operator workflow proof.",
      },
    },
  },
  {
    employeeId: "kate-lee",
    superpower: "Editorial Trust - credibility before conversion",
    absentSurfaceOpportunity: "PODCAST: A 10-minute editor's note would be Every's most authentic marketing asset.",
    growthLoopPosition: "Editorial credibility raises the quality floor for every Every essay and product narrative.",
    surfaces: {
      twitter: {
        postsLast90Days: 112,
        followerCount: 8900,
        shotDistribution: { three_pointer_promo: 10, midrange_philosophy: 48, freethrow_personal: 28, assist_industry: 21, airball: 5 },
        efficiency: { fgPct: 0.081, threePtPct: 0.067, ftPct: 0.088, tsPct: 0.113, assistPct: 0.188 },
        notableShots: [
          "The best AI writing tools preserve taste instead of replacing it",
          "Editing is mostly deciding what promise the piece is making",
          "Every essay should make the reader smarter before it asks them to subscribe",
          "Amplified a writer's essay with an editor's note on why it matters",
          "New post is live",
        ],
        notes: "Kate's editorial voice makes Every feel rigorous before readers hit a conversion moment.",
      },
      linkedin: {
        postsLast90Days: 12,
        followerCount: 5200,
        opportunity: "Editorial leadership posts can sell the quality system behind Every's subscription.",
      },
      newsletter: {
        followerCount: 3000,
        notes: "Newsletter bylines carry direct trust and paid conversion potential.",
      },
    },
  },
  {
    employeeId: "katie-parrott",
    superpower: "Transition Game - personal relatability pushes the pace toward creative credibility",
    absentSurfaceOpportunity: "INSTAGRAM: A writer's life series would build the lifestyle audience Every's editorial voice resonates with.",
    growthLoopPosition: "Relatable writer process content widens Every's human halo before editorial conversion.",
    surfaces: {
      twitter: {
        postsLast90Days: 85,
        followerCount: 5200,
        shotDistribution: { three_pointer_promo: 7, midrange_philosophy: 24, freethrow_personal: 36, assist_industry: 13, airball: 5 },
        efficiency: { fgPct: 0.073, threePtPct: 0.058, ftPct: 0.096, tsPct: 0.107, assistPct: 0.153 },
        notableShots: [
          "A writing workflow only works if it survives a chaotic morning",
          "AI editorial tools are better when they leave room for taste",
          "Baking breaks are part of the draft process",
          "Shared an Every essay with a practical writer's takeaway",
          "New essay up",
        ],
        notes: "Personal process makes Every's editorial work feel human and repeatable.",
      },
      linkedin: {
        postsLast90Days: 6,
        followerCount: 2800,
        opportunity: "LinkedIn can turn writer process into professional editorial trust.",
      },
    },
  },
  {
    employeeId: "laura-entis",
    superpower: "Glue Play - industry commentary that holds the category together",
    absentSurfaceOpportunity: "LINKEDIN SERIES: A weekly Media + AI insight post would attract professional readers and consulting buyers.",
    growthLoopPosition: "Industry context helps Every's editorial and consulting narratives cohere.",
    surfaces: {
      twitter: {
        postsLast90Days: 72,
        followerCount: 6100,
        shotDistribution: { three_pointer_promo: 5, midrange_philosophy: 31, freethrow_personal: 14, assist_industry: 17, airball: 5 },
        efficiency: { fgPct: 0.066, threePtPct: 0.054, ftPct: 0.072, tsPct: 0.098, assistPct: 0.186 },
        notableShots: [
          "Media companies keep treating AI like a feature instead of a workflow change",
          "The most interesting AI adoption stories are operational, not flashy",
          "A good industry take should make a trend easier to use",
          "Shared an Every piece with context on why media operators should care",
          "Interesting AI news today",
        ],
        notes: "Laura's commentary helps Every explain the market rather than just react to it.",
      },
      linkedin: {
        postsLast90Days: 8,
        followerCount: 3400,
        opportunity: "Weekly professional commentary can create steady B2B trust.",
      },
    },
  },
];

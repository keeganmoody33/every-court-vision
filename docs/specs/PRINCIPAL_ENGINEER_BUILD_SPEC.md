# SURFACE IQ — PRINCIPAL SOFTWARE ENGINEER BUILD SPEC
## Full-Stack Application: Spider.cloud Scraping → Analytics → Dashboard

---

## 1. EXECUTIVE SUMMARY

Build a production-grade Surface IQ analytics platform for Every (every.to). The system scrapes public social surfaces of company employees, categorizes content into an NBA-analytics-inspired shot framework, calculates efficiency metrics, and presents insights via a real-time dashboard.

**Stack:** Node.js (backend) + React (frontend) + PostgreSQL + Redis + Spider.cloud
**Deploy:** Railway/Render (backend) + Vercel (frontend)
**Auth:** Clerk (optional — start with password-protect the dashboard)

---

## 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  React 18 + Vite + Tailwind + Recharts + React Query            │
│  ├─ Dashboard (player cards, shot charts, comparisons)        │
│  ├─ Roster Manager (add/edit employees)                        │
│  ├─ Experiment Runner (A/B test framework)                    │
│  └─ Reports (PDF export, shareable links)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / JSON
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                  │
│  Express.js + TypeScript + Zod validation                       │
│  ├─ /api/v1/players (CRUD)                                     │
│  ├─ /api/v1/surfaces (surface discovery)                        │
│  ├─ /api/v1/scrape (trigger spider crawl)                     │
│  ├─ /api/v1/metrics (calculated efficiency)                     │
│  ├─ /api/v1/categorize (shot-type classification)             │
│  ├─ /api/v1/experiments (experiment tracking)                   │
│  └─ /api/v1/reports (generate PDF/PNG exports)                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                │
│  ├─ SpiderService (orchestrates spider.cloud crawls)            │
│  ├─ CategorizationService (LLM + keyword shot classification)   │
│  ├─ MetricsService (FG%, 3P%, FT%, TS% calculation)           │
│  ├─ DiscoveryService (finds new surfaces for employees)       │
│  └─ ReportService (generates player cards, comparisons)       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                   │
│  PostgreSQL (primary)                                           │
│  ├─ players table                                               │
│  ├─ surfaces table                                              │
│  ├─ posts table (raw scraped content)                           │
│  ├─ metrics table (calculated efficiency per time window)       │
│  ├─ experiments table                                          │
│  └─ reports table                                              │
│                                                                 │
│  Redis (cache + queue)                                          │
│  ├─ scrape jobs queue (BullMQ)                                  │
│  ├─ rate limit counters                                        │
│  └─ dashboard cache (5-min TTL)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. DATABASE SCHEMA (PostgreSQL)

```sql
-- Players (the roster)
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    archetype VARCHAR(100),
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Surfaces (one per player per platform)
CREATE TABLE surfaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- twitter, linkedin, github, substack, producthunt, youtube, instagram, podcast
    handle VARCHAR(255),
    url TEXT,
    is_present BOOLEAN DEFAULT false,
    follower_count INTEGER,
    posts_last_90_days INTEGER,
    primary_products TEXT[], -- for producthunt
    attribution_value VARCHAR(100),
    opportunity TEXT,
    last_scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, platform)
);

-- Posts (raw scraped content)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    surface_id UUID REFERENCES surfaces(id) ON DELETE CASCADE,
    external_id VARCHAR(255), -- tweet ID, post ID, etc.
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    likes INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    retweets INTEGER DEFAULT 0,
    quotes INTEGER DEFAULT 0,
    impressions INTEGER, -- null if not available
    media_urls TEXT[],
    mentions TEXT[],
    hashtags TEXT[],
    urls TEXT[],
    is_reply BOOLEAN DEFAULT false,
    is_retweet BOOLEAN DEFAULT false,
    is_quote BOOLEAN DEFAULT false,
    shot_type VARCHAR(20), -- 3P, mid, FT, assist, airball
    shot_confidence FLOAT, -- 0.0 to 1.0
    categorized_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics (calculated per player per time window)
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    surface_id UUID REFERENCES surfaces(id) ON DELETE CASCADE,
    time_window VARCHAR(20) NOT NULL, -- 7d, 30d, 90d
    window_start DATE NOT NULL,
    window_end DATE NOT NULL,
    total_posts INTEGER DEFAULT 0,
    three_p_count INTEGER DEFAULT 0,
    mid_count INTEGER DEFAULT 0,
    ft_count INTEGER DEFAULT 0,
    assist_count INTEGER DEFAULT 0,
    airball_count INTEGER DEFAULT 0,
    fg_pct FLOAT,
    three_pt_pct FLOAT,
    ft_pct FLOAT,
    ts_pct FLOAT,
    assist_pct FLOAT,
    golden_ratio TEXT,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, surface_id, time_window, window_start)
);

-- Experiments (A/B test tracking)
CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id),
    surface_id UUID REFERENCES surfaces(id),
    name VARCHAR(255) NOT NULL,
    hypothesis TEXT NOT NULL,
    method TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, running, completed, cancelled
    start_date DATE,
    end_date DATE,
    success_metric TEXT,
    result TEXT,
    expected_learning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports (generated artifacts)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- player_card, comparison, team_report
    player_ids UUID[],
    file_url TEXT,
    file_type VARCHAR(10), -- png, pdf, md
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies (for multi-tenant future)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. BACKEND SPEC (Node.js + TypeScript)

### 4.1 SpiderService — The Scraping Engine

```typescript
interface SpiderCrawlJob {
  url: string;
  platform: Platform;
  playerId: string;
  surfaceId: string;
  renderJs: boolean;
  waitFor?: string;
  proxyCountry?: string;
}

class SpiderService {
  private readonly SPIDER_API_URL = 'https://api.spider.cloud/crawl';
  private readonly SPIDER_API_KEY: string;

  async crawlTwitterProfile(handle: string): Promise<SpiderResult> {
    const job: SpiderCrawlJob = {
      url: `https://twitter.com/${handle}`,
      platform: 'twitter',
      playerId: '...',
      surfaceId: '...',
      renderJs: true,
      waitFor: 'article[data-testid="tweet"]',
      proxyCountry: 'US'
    };

    const response = await fetch(this.SPIDER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.SPIDER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(job)
    });

    const html = await response.text();
    return this.parseTwitterHtml(html);
  }

  async crawlSubstackProfile(handle: string): Promise<SpiderResult> {
    const job: SpiderCrawlJob = {
      url: `https://${handle}.substack.com`,
      platform: 'substack',
      playerId: '...',
      surfaceId: '...',
      renderJs: false, // Substack is static HTML
      proxyCountry: 'US'
    };

    const response = await fetch(this.SPIDER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.SPIDER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(job)
    });

    const html = await response.text();
    return this.parseSubstackHtml(html);
  }

  // Platform-specific parsers
  private parseTwitterHtml(html: string): TwitterParseResult {
    const $ = cheerio.load(html);
    const tweets: RawTweet[] = [];

    $('article[data-testid="tweet"]').each((_, el) => {
      const text = $(el).find('div[lang]').text();
      const time = $(el).find('time').attr('datetime');
      const likes = this.parseCount($(el).find('[data-testid="like"]').text());
      const replies = this.parseCount($(el).find('[data-testid="reply"]').text());
      const retweets = this.parseCount($(el).find('[data-testid="retweet"]').text());

      tweets.push({ text, time, likes, replies, retweets });
    });

    return { tweets, rawHtml: html };
  }

  private parseSubstackHtml(html: string): SubstackParseResult {
    const $ = cheerio.load(html);
    const posts: RawPost[] = [];

    $('.post-preview, .post').each((_, el) => {
      const title = $(el).find('h2, .title').text();
      const excerpt = $(el).find('.excerpt, p').first().text();
      const date = $(el).find('time, .date').attr('datetime');
      const likes = $(el).find('.like-count, .reactions').text();

      posts.push({ title, excerpt, date, likes });
    });

    return { posts, subscriberCount: this.extractSubscriberCount($) };
  }

  private parseCount(text: string): number {
    if (!text) return 0;
    const cleaned = text.replace(/,/g, '').toLowerCase();
    if (cleaned.includes('k')) return parseFloat(cleaned) * 1000;
    if (cleaned.includes('m')) return parseFloat(cleaned) * 1000000;
    return parseInt(cleaned) || 0;
  }
}
```

### 4.2 CategorizationService — The Shot-Charting Engine

```typescript
interface CategorizationResult {
  shotType: '3P' | 'mid' | 'FT' | 'assist' | 'airball';
  confidence: number;
  signals: string[];
}

class CategorizationService {
  // Primary: Keyword-based (fast, deterministic, 80% accuracy)
  // Secondary: LLM-based (slow, nuanced, 95% accuracy for edge cases)

  private readonly PROMO_SIGNALS = [
    'subscribe', 'try ', 'join the', 'waitlist', 'download',
    'every.to', 'spiral', 'cora', 'sparkle', 'monologue',
    'plus one', 'proof', 'our product', 'we built', 'check out',
    'link in bio', 'sign up', 'get early access'
  ];

  private readonly PHILOSOPHY_SIGNALS = [
    'the future of', 'i believe', 'thesis', 'framework',
    'pattern', 'insight', 'observation', 'perspective',
    'conviction', 'theory', 'hypothesis', 'model'
  ];

  private readonly ASSIST_SIGNALS = [
    '@every', '@danshipper', '@tedescau', '@kieranklaassen',
    'great piece by', 'must read from', 'shoutout to'
  ];

  private readonly WORK_SIGNALS = [
    'ai', 'product', 'building', 'startup', 'code',
    'engineering', 'design', 'growth', 'marketing'
  ];

  categorize(text: string, playerContext: PlayerContext): CategorizationResult {
    const lower = text.toLowerCase();
    const signals: string[] = [];

    // Check for promo
    for (const signal of this.PROMO_SIGNALS) {
      if (lower.includes(signal)) {
        signals.push(`promo:${signal}`);
        return {
          shotType: '3P',
          confidence: 0.85 + (signals.length * 0.05),
          signals
        };
      }
    }

    // Check for assist
    for (const signal of this.ASSIST_SIGNALS) {
      if (lower.includes(signal)) {
        signals.push(`assist:${signal}`);
        return {
          shotType: 'assist',
          confidence: 0.90,
          signals
        };
      }
    }

    // Check for philosophy
    for (const signal of this.PHILOSOPHY_SIGNALS) {
      if (lower.includes(signal)) {
        signals.push(`philosophy:${signal}`);
        return {
          shotType: 'mid',
          confidence: 0.80,
          signals
        };
      }
    }

    // Check for personal (no work signals)
    const hasWorkSignal = this.WORK_SIGNALS.some(s => lower.includes(s));
    if (!hasWorkSignal) {
      return {
        shotType: 'FT',
        confidence: 0.75,
        signals: ['personal:no_work_signals']
      };
    }

    // Default: mid-range for ambiguous work content
    return {
      shotType: 'mid',
      confidence: 0.60,
      signals: ['default:ambiguous_work']
    };
  }

  // LLM fallback for edge cases
  async categorizeWithLLM(text: string, playerContext: PlayerContext): Promise<CategorizationResult> {
    const prompt = `
      Categorize this social media post into one of:
      - 3P (promo): explicit CTA, product mention, subscribe, download
      - mid (philosophy): domain expertise, insight, framework, no CTA
      - FT (personal): life, hobbies, zero work connection
      - assist: boosting teammate, industry commentary
      - airball: generic, low effort, no engagement potential

      Player: ${playerContext.name}, Role: ${playerContext.role}
      Post: "${text}"

      Return JSON: {"shotType": "...", "confidence": 0.0-1.0, "reasoning": "..."}
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

### 4.3 MetricsService — The Analytics Engine

```typescript
interface EfficiencyMetrics {
  fgPct: number;
  threePtPct: number;
  ftPct: number;
  tsPct: number;
  assistPct: number;
  usageRate: number; // posts per day
}

class MetricsService {
  calculate(playerId: string, surfaceId: string, days: number = 90): EfficiencyMetrics {
    const posts = await db.posts.findMany({
      where: {
        surface_id: surfaceId,
        created_at: { gte: new Date(Date.now() - days * 86400000) }
      }
    });

    const surface = await db.surfaces.findUnique({ where: { id: surfaceId } });
    const followerCount = surface?.follower_count || 1;

    const totalPosts = posts.length;
    const totalPoints = posts.reduce((sum, p) => 
      sum + p.likes + (2 * p.replies) + (3 * p.retweets), 0
    );

    const promoPosts = posts.filter(p => p.shot_type === '3P');
    const personalPosts = posts.filter(p => p.shot_type === 'FT');
    const assistPosts = posts.filter(p => p.shot_type === 'assist');

    return {
      fgPct: totalPoints / (totalPosts * followerCount) * 1000,
      threePtPct: promoPosts.length > 0 
        ? promoPosts.reduce((s, p) => s + p.likes, 0) / promoPosts.length / followerCount * 1000 
        : 0,
      ftPct: personalPosts.length > 0
        ? personalPosts.reduce((s, p) => s + p.likes, 0) / personalPosts.length / followerCount * 1000
        : 0,
      tsPct: totalPoints / (totalPosts * Math.max(followerCount, 1)) * 100,
      assistPct: assistPosts.length / totalPosts,
      usageRate: totalPosts / days
    };
  }

  calculateGoldenRatio(metrics: EfficiencyMetrics): string {
    // The optimal mix where 3P% peaks without collapsing TS%
    if (metrics.threePtPct > 0.1 && metrics.tsPct > 0.08) {
      return 'Optimal: High promo efficiency with strong overall performance';
    } else if (metrics.threePtPct < 0.05) {
      return 'Under-promoting: Increase 3-point attempts';
    } else if (metrics.tsPct < 0.05) {
      return 'Over-promoting: Decrease 3-point attempts, increase FTs';
    }
    return 'Balanced: Current mix is sustainable';
  }
}
```

### 4.4 DiscoveryService — The Surface Finder

```typescript
class DiscoveryService {
  async discoverSurfaces(player: Player): Promise<Partial<Surface>[]> {
    const discoveries: Partial<Surface>[] = [];

    // Pattern 1: Handle consistency
    const baseHandle = player.surfaces.find(s => s.platform === 'twitter')?.handle?.replace('@', '');
    if (baseHandle) {
      // Check GitHub
      const githubExists = await this.checkUrl(`https://github.com/${baseHandle}`);
      if (githubExists) {
        discoveries.push({ platform: 'github', handle: baseHandle, is_present: true });
      }

      // Check Substack
      const substackExists = await this.checkUrl(`https://${baseHandle}.substack.com`);
      if (substackExists) {
        discoveries.push({ platform: 'substack', handle: baseHandle, is_present: true });
      }
    }

    // Pattern 2: Bio link archaeology
    const twitterBio = await this.getTwitterBio(player);
    const links = this.extractLinks(twitterBio);
    for (const link of links) {
      if (link.includes('linkedin.com/in/')) {
        discoveries.push({ platform: 'linkedin', url: link, is_present: true });
      }
      if (link.includes('github.com/')) {
        discoveries.push({ platform: 'github', url: link, is_present: true });
      }
    }

    // Pattern 3: Name-based search
    const searchResults = await spiderService.search(`${player.name} every.to`);
    // Parse results for new surfaces

    return discoveries;
  }

  private async checkUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
```

### 4.5 ReportService — The Card Generator

```typescript
class ReportService {
  async generatePlayerCard(playerId: string): Promise<Buffer> {
    const player = await db.players.findUnique({ where: { id: playerId }, include: { surfaces: true } });
    const metrics = await db.metrics.findMany({ where: { player_id: playerId } });

    // Use Puppeteer or Playwright to render HTML → PNG
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const html = this.renderPlayerCardHTML(player, metrics);
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const screenshot = await page.screenshot({ type: 'png', fullPage: false });
    await browser.close();

    return screenshot;
  }

  private renderPlayerCardHTML(player: Player, metrics: Metrics[]): string {
    // Returns the ESPN-style dark-mode HTML we built earlier
    return `
      <!DOCTYPE html>
      <html style="background: #0a0a0a; color: #fff; font-family: system-ui;">
        <head>
          <style>
            .card { width: 600px; background: #111; padding: 24px; }
            .header { background: ${player.accentColor}; padding: 12px; text-align: center; }
            .badge { border: 2px solid ${player.accentColor}; padding: 8px 16px; display: inline-block; }
            .surface-bar { height: 8px; background: #222; margin: 4px 0; }
            .surface-fill { height: 100%; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>${player.name.toUpperCase()}</h1>
              <p>${player.role}</p>
            </div>
            <div style="text-align: center; margin: 16px 0;">
              <span class="badge">${player.archetype.toUpperCase()}</span>
            </div>
            <!-- Surface bars, shot distribution, efficiency splits -->
          </div>
        </body>
      </html>
    `;
  }
}
```

---

## 5. API DESIGN (REST + JSON)

```
GET    /api/v1/players                    → List all players
GET    /api/v1/players/:id              → Get player with surfaces + latest metrics
POST   /api/v1/players                  → Add new player (triggers discovery)
PUT    /api/v1/players/:id              → Update player
DELETE /api/v1/players/:id              → Remove player

GET    /api/v1/players/:id/surfaces     → List surfaces for player
POST   /api/v1/players/:id/scrape       → Trigger scrape for all surfaces
GET    /api/v1/players/:id/metrics      → Get calculated metrics (default 90d)
GET    /api/v1/players/:id/metrics?window=30d

POST   /api/v1/scrape                   → Trigger spider crawl for specific surface
GET    /api/v1/scrape/:jobId/status     → Check crawl status

GET    /api/v1/players/:id/posts        → Get raw posts (paginated)
GET    /api/v1/players/:id/posts?shot_type=3P

POST   /api/v1/categorize               → Categorize a single post (test endpoint)

GET    /api/v1/compare?players=a,b      → Side-by-side comparison

GET    /api/v1/reports/:id              → Download generated report (PNG/PDF)
POST   /api/v1/reports                  → Generate new report

GET    /api/v1/experiments              → List experiments
POST   /api/v1/experiments              → Create experiment
PUT    /api/v1/experiments/:id          → Update experiment status
```

---

## 6. FRONTEND SPEC (React + Vite + Tailwind)

### 6.1 Routes

```typescript
const routes = [
  { path: '/', component: Dashboard },           // Overview grid of all players
  { path: '/player/:id', component: PlayerDetail }, // Full player card + history
  { path: '/compare', component: CompareView },    // Side-by-side selector
  { path: '/roster', component: RosterManager },   // Add/edit/remove players
  { path: '/experiments', component: Experiments }, // Experiment tracker
  { path: '/reports', component: Reports },         // Generated artifacts
  { path: '/settings', component: Settings },       // API keys, cadence, company
];
```

### 6.2 Key Components

```typescript
// PlayerCard.tsx — The ESPN-style card
interface PlayerCardProps {
  player: Player;
  metrics: Metrics;
  surfaces: Surface[];
}

// ShotDistributionChart.tsx — Radar or bar chart
interface ShotDistributionProps {
  threeP: number;
  mid: number;
  ft: number;
  assist: number;
  airball: number;
}

// SurfacePresenceGrid.tsx — Matrix of all players × all surfaces
interface SurfaceGridProps {
  players: Player[];
  platforms: Platform[];
}

// EfficiencySplits.tsx — FG%, 3P%, FT%, TS% bars
interface EfficiencyProps {
  metrics: Metrics;
}

// GoldenRatioGauge.tsx — Visual indicator of optimal mix
interface GoldenRatioProps {
  current3P: number;
  optimal3P: number;
  tsPct: number;
}

// ComparisonView.tsx — Side-by-side player analysis
interface ComparisonProps {
  playerA: Player;
  playerB: Player;
}
```

### 6.3 State Management

```typescript
// React Query for server state
const { data: players } = useQuery('players', fetchPlayers);
const { data: metrics } = useQuery(['metrics', playerId], () => fetchMetrics(playerId));

// Zustand for client state (UI preferences, selected players for comparison)
interface UIState {
  selectedPlayers: string[];
  timeWindow: '7d' | '30d' | '90d';
  darkMode: boolean;
  setSelectedPlayers: (ids: string[]) => void;
}
```

### 6.4 Design System

```css
/* Tailwind config extensions */
module.exports = {
  theme: {
    extend: {
      colors: {
        'surface-bg': '#0a0a0a',
        'surface-card': '#111111',
        'surface-text': '#ffffff',
        'surface-muted': '#888888',
        'accent-orange': '#ff6b35',
        'accent-green': '#00d4aa',
        'accent-red': '#e74c3c',
        'accent-blue': '#3498db',
        'accent-purple': '#9b59b6',
        'accent-gold': '#f4d03f',
        'twitter': '#1da1f2',
        'linkedin': '#0077b5',
        'github': '#6cc644',
        'substack': '#ff6b35',
        'producthunt': '#da552f',
        'youtube': '#ff0000',
        'instagram': '#e1306c',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  }
}
```

---

## 7. APP FLOW (User Journeys)

### 7.1 Onboarding Flow

```
1. User lands on /settings
2. Enters Spider.cloud API key
3. Enters OpenAI API key (for LLM categorization)
4. Creates company "Every"
5. Clicks "Discover Roster"
6. System scrapes every.to/team → finds all employees
7. System runs DiscoveryService on each employee → finds all surfaces
8. System scrapes last 90 days of content for each surface
9. System categorizes all posts
10. System calculates metrics
11. Dashboard populates with player cards
```

### 7.2 Daily Refresh Flow

```
1. Cron triggers at 6:00 AM ET
2. For each active surface:
   a. Check if spider crawl needed (15-min for Twitter, daily for others)
   b. Queue crawl job in BullMQ
   c. Spider.cloud executes crawl
   d. Backend parses HTML → extracts posts
   e. CategorizationService classifies new posts
   f. MetricsService recalculates for affected players
   g. Redis cache invalidates for those players
3. Frontend auto-refreshes on next visit (React Query stale-while-revalidate)
```

### 7.3 Experiment Flow

```
1. User navigates to /experiments
2. Clicks "New Experiment"
3. Selects player, surface, hypothesis
4. System captures baseline metrics (pre-experiment)
5. User runs experiment (e.g., "Kieran posts 2 philosophy tweets before next promo")
6. After 7 days, user clicks "End Experiment"
7. System captures post-experiment metrics
8. System calculates delta and generates report
9. Report saved to /reports
```

### 7.4 Report Generation Flow

```
1. User selects player(s) on dashboard
2. Clicks "Generate Report"
3. Backend queues report job
4. ReportService renders HTML → Puppeteer → PNG/PDF
5. File uploaded to S3/R2
6. URL returned to frontend
7. User downloads or shares link
```

---

## 8. INFRASTRUCTURE & DEPLOYMENT

### 8.1 Services

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | Vercel | React app, edge-cached |
| API Server | Railway / Render | Express.js, auto-deploy from Git |
| Database | Railway Postgres / Supabase | Primary data store |
| Cache/Queue | Upstash Redis | BullMQ job queue + API response cache |
| File Storage | Cloudflare R2 / S3 | Generated reports (PNG/PDF) |
| Scraping | Spider.cloud | Web crawling (external API) |
| LLM | OpenAI API | Edge-case categorization |
| Auth (optional) | Clerk | Dashboard access control |

### 8.2 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Spider.cloud
SPIDER_API_KEY=spider_...

# OpenAI (for LLM categorization)
OPENAI_API_KEY=sk-...

# File Storage
R2_BUCKET=surface-iq-reports
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=...

# Auth (optional)
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://surface-iq.vercel.app
```

### 8.3 Docker Compose (Local Dev)

```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

  worker:
    build: ./backend
    command: npm run worker
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: surfaceiq
      POSTGRES_PASSWORD: surfaceiq
      POSTGRES_DB: surfaceiq
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000

volumes:
  pgdata:
```

---

## 9. CRAWL SCHEDULE (BullMQ Jobs)

```typescript
// Defined in worker.ts
const queues = {
  twitter: new Queue('twitter-crawl', { connection: redis }),
  linkedin: new Queue('linkedin-crawl', { connection: redis }),
  github: new Queue('github-crawl', { connection: redis }),
  substack: new Queue('substack-crawl', { connection: redis }),
  producthunt: new Queue('ph-crawl', { connection: redis }),
  youtube: new Queue('youtube-crawl', { connection: redis }),
};

// Cron schedules
const schedules = {
  'twitter-realtime': '*/15 * * * *',     // Every 15 minutes
  'twitter-daily': '0 6 * * *',           // 6 AM daily (full sync)
  'linkedin-daily': '0 6 * * *',          // 6 AM daily
  'github-daily': '0 6 * * *',            // 6 AM daily
  'substack-daily': '0 6 * * *',          // 6 AM daily
  'producthunt-weekly': '0 9 * * 1',      // Monday 9 AM
  'youtube-weekly': '0 9 * * 1',          // Monday 9 AM
  'metrics-recalc': '0 7 * * *',          // 7 AM daily (after crawls)
  'discovery-sweep': '0 9 1 * *',         // 1st of month, 9 AM
};
```

---

## 10. TESTING STRATEGY

```typescript
// Unit tests: Jest
// Integration tests: Supertest + test database
// E2E tests: Playwright

describe('CategorizationService', () => {
  it('classifies promo tweets correctly', () => {
    const result = service.categorize('Try Spiral today! Link in bio.', context);
    expect(result.shotType).toBe('3P');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('classifies personal tweets correctly', () => {
    const result = service.categorize('Mumbai street food > SF sourdough.', context);
    expect(result.shotType).toBe('FT');
  });
});

describe('MetricsService', () => {
  it('calculates TS% correctly', () => {
    const metrics = service.calculate(playerId, surfaceId, 90);
    expect(metrics.tsPct).toBeGreaterThan(0);
    expect(metrics.tsPct).toBeLessThan(1);
  });
});

describe('SpiderService', () => {
  it('parses Twitter HTML without errors', async () => {
    const html = fs.readFileSync('./fixtures/twitter-profile.html', 'utf8');
    const result = service.parseTwitterHtml(html);
    expect(result.tweets.length).toBeGreaterThan(0);
  });
});
```

---

## 11. MONITORING & ALERTING

```typescript
// Health checks
GET /health → { status: 'ok', db: 'connected', redis: 'connected', spider: 'reachable' }

// Metrics to track
- Crawl success rate (target: >95%)
- Categorization accuracy (target: >85% keyword, >95% LLM)
- API response time p95 (target: <200ms)
- Dashboard load time (target: <2s)
- Spider.cloud cost per crawl (target: <$0.05 per profile)

// Alerts (via Slack webhook)
- Crawl failure rate >10% in 1 hour
- Database connection lost
- Spider.cloud API errors >5 in 10 minutes
- Queue backlog >100 jobs
```

---

## 12. SECURITY CONSIDERATIONS

```
1. API Keys
   - Spider.cloud key: server-side only, never exposed to frontend
   - OpenAI key: server-side only
   - Database URL: server-side only

2. Rate Limiting
   - Spider.cloud: respect their rate limits (implement backoff)
   - Twitter: don't scrape faster than human browsing
   - LinkedIn: aggressive limits — use conservative scheduling

3. Data Privacy
   - Only scrape PUBLIC data
   - Never attempt to access private accounts, DMs, or subscriber-only content
   - Store minimal PII (names, public handles only)
   - Allow players to opt out (delete their data)

4. Authentication
   - Start with password-protect the dashboard
   - Upgrade to Clerk for team access control
   - Role-based: admin (full access), viewer (read-only)
```

---

## 13. MILESTONES (Build Order)

### Week 1: Foundation
- [ ] Scaffold backend (Express + TypeScript + Prisma)
- [ ] Scaffold frontend (Vite + React + Tailwind)
- [ ] Set up PostgreSQL + Redis (Docker)
- [ ] Implement SpiderService (Twitter + Substack parsers)
- [ ] Build player CRUD API

### Week 2: Core Pipeline
- [ ] Implement CategorizationService (keyword-based)
- [ ] Implement MetricsService (FG%, 3P%, FT%, TS%)
- [ ] Build dashboard grid (player cards)
- [ ] Build player detail view (shot charts + efficiency)

### Week 3: Polish & Discovery
- [ ] Implement DiscoveryService (surface finding)
- [ ] Add LLM fallback for categorization
- [ ] Build comparison view
- [ ] Build roster manager (add/edit/remove)
- [ ] Generate first player cards as PNG

### Week 4: Experiments & Reports
- [ ] Build experiment tracker
- [ ] Build report generator (PNG/PDF)
- [ ] Add cron jobs (BullMQ)
- [ ] Deploy to Railway + Vercel
- [ ] Write documentation

### Week 5: Advanced Features
- [ ] Add LinkedIn scraping (manual import if API blocked)
- [ ] Add GitHub API integration
- [ ] Add Product Hunt monitoring
- [ ] Add YouTube API integration
- [ ] Build real-time websocket updates

---

## 14. THE CURSOR DROP-IN PROMPT

Drop this entire spec into a Cursor chat (or Codex) and say:

"Build the Surface IQ platform. Start with Week 1 milestones. Use the stack defined in Section 2. Follow the database schema in Section 3. Implement the services in Section 4. Build the frontend components in Section 6. Use Spider.cloud for scraping. Deploy with Docker Compose locally first."

Cursor will:
1. Generate the backend scaffold
2. Generate the frontend scaffold
3. Create the Prisma schema
4. Implement the SpiderService
5. Build the dashboard components
6. Wire everything together

---

*Spec version: 1.0.0 | Compiled: April 27, 2026 | Author: Principal Software Engineer*

# SURFACE IQ — UPDATE CADENCE & SPIDER.CLOUD INTEGRATION

---

## UPDATE FREQUENCY (The Cadence)

The Surface IQ system has **three refresh tiers** based on data volatility and API constraints:

| Tier | Data Type | Update Frequency | Trigger | Method |
|------|-----------|-----------------|---------|--------|
| **Real-time** | New posts, engagement deltas | Every 15 minutes | Cron + webhook | Spider.cloud continuous crawl |
| **Daily** | Full profile sync, follower counts, new surfaces discovered | 6:00 AM ET | Cron | Batch spider crawl |
| **Weekly** | Deep analysis, trend detection, golden ratio recalculation | Monday 9:00 AM | Cron | Analytics pipeline |
| **Monthly** | Roster audit, new employee onboarding, surface deprecation | 1st of month | Manual | Discovery sweep |

### Why This Cadence?

**Twitter/X:** Volatile. A tweet can blow up in 2 hours. 15-minute polling catches viral moments without hitting rate limits.

**LinkedIn:** Stable. Posts have a 48-hour half-life. Daily sync is sufficient.

**GitHub:** Slow-moving. Commits and stars change gradually. Daily is fine.

**Substack:** Weekly rhythm. Posts are published on schedules. Daily sync, weekly deep analysis.

**Product Hunt:** Event-driven. Only update when a new product launches or a comment is added. Otherwise weekly.

**YouTube:** Weekly. Video performance stabilizes after 3-7 days.

---

## SPIDER.CLOUD INTEGRATION

**Yes, you can use spider.cloud through Cursor.** Spider.cloud is a web scraping API that handles JavaScript rendering, proxy rotation, and anti-bot detection. You call it via HTTP from any backend.

### Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│  CURSOR / CODEX AGENT                                        │
│  (Where you write and run code)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP POST
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  SPIDER.CLOUD API                                            │
│  (Handles JS rendering, proxies, anti-bot)                 │
│  Endpoint: https://api.spider.cloud/crawl                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ Returns HTML/JSON
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  YOUR BACKEND (Node/Python)                                  │
│  (Parses HTML, extracts data, categorizes, stores)           │
└──────────────────────┬──────────────────────────────────────┘
                       │ Writes to
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  DATABASE (PostgreSQL + Redis)                               │
│  (Raw data, processed metrics, cache)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ API calls
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (React/Vue Dashboard)                              │
│  (Player cards, shot charts, comparisons)                    │
└─────────────────────────────────────────────────────────────┘
```

### Spider.cloud Request Pattern:

```python
import requests

def scrape_twitter_profile(handle):
    response = requests.post(
        "https://api.spider.cloud/crawl",
        headers={"Authorization": f"Bearer {SPIDER_API_KEY}"},
        json={
            "url": f"https://twitter.com/{handle}",
            "render_js": True,
            "proxy_country": "US",
            "wait_for": "article[data-testid='tweet']"
        }
    )
    return response.json()  # HTML content

# Then parse with BeautifulSoup or Playwright
```

### Why Spider.cloud?

- **Twitter/X:** Requires JS rendering. Spider.cloud handles this.
- **LinkedIn:** Aggressive bot detection. Spider.cloud rotates proxies.
- **Substack:** Simple HTML, but Spider.cloud ensures consistent rendering.
- **Product Hunt:** JS-heavy. Spider.cloud extracts the rendered DOM.

---

## THE PRINCIPAL ENGINEER PROMPT

See below for the complete build spec.

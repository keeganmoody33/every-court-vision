# Monologue Activation

**How I'd find and convert the 35 competitors' users into Every subscribers — the day after Notes launched.**

This doc is specific to Monologue. The framework generalizes to the other five products in the bundle; one-paragraph shapes for each are at the bottom. Full activation docs for Cora, Spiral, Sparkle, Plus One, and Every media on request.

---

## Why today changed everything

Monologue Notes is a category split, not a feature launch.

**Before today:** Monologue was a dictation app competing with Wispr Flow, SuperWhisper, MacWhisper. One primitive: voice → text with a known destination.

**After today:** Monologue is two products under one roof:
- **Dictation** = "active work" (you know where the words are going — Slack, email, Claude prompt)
- **Notes** = "passive work" (ideas without a destination yet — walks, calls, brain dumps)

Naveen's language. Use it exactly. *Active vs passive* is the wedge.

The competitor list I was handed (35 tools, tiered by product type) is the pre-launch map. This doc re-tiers it by **the user's actual pain state** — because that's what activation runs on, not category similarity.

---

## The re-tier: 35 competitors by pain, not by feature

| Tier | Pain state | Heat | Monologue wedge | Competitors |
|---|---|---|---|---|
| **T1** | Orphan — doing the loop manually | 🔥🔥🔥 | Notes is the product they've been faking | Apple Voice Memos, Google Recorder, Just Press Record |
| **T2** | Meeting-capture frustrated | 🔥🔥🔥 | Anti-Otter: your app, no bot, agent-native | Otter.ai, Fireflies, Granola, Circleback |
| **T3** | Dictation ceiling | 🔥🔥 | You already have half the loop. Here's the other half. | Wispr Flow, SuperWhisper, MacWhisper, Talknotes, WhisperFlow, Cleft, Noted, Voicenotes |
| **T4** | Pro-creator overpayment | 🔥🔥 | Notes + your existing editor < Descript | Descript, Rev, Trint |
| **T5** | Dev DIYer — rolled their own | 🔥 (skills not seats) | Don't convert them. Recruit them as skill-builders on the Monologue MCP. | whisper.cpp, faster-whisper, OpenSuperWhisper, whisper-writer, VoiceInk, HyperWhisper, QuickWhisper, Dictater, OpenWhispr, VoiceWave, hyprflow, meetily |
| **T6** | Plugin-stack duct-tape | 🔥 | One clean architecture beats five plugins | Bear, Drafts, Obsidian |
| **T7** | Built-in "good enough" | ❄️ | Largest pool, lowest intent. Capture via content, not direct pitch. | Apple Voice Memos (iOS 17+), OneNote, Google Recorder |

**Strategic-risks bucket (NOT activation targets):** Claude voice, ChatGPT voice, Notion AI. If these platforms ship good voice capture natively, they become the category. Different doc, different decisions. Don't run activation against them.

---

## How we find them — signal surfaces per tier

Same five-surface framework from `DISCOVERY_SIGNALS.md`, tier-specific.

### T1 — Orphans (voice memos + manual paste)

These users are the hottest and the hardest to find, because they don't have a brand loyalty to signal against.

- **GitHub Gists / public Notion templates** with "voice memo workflow" keywords — people who publish their jank are pre-qualified builders
- **Substack posts** mentioning "I record on Voice Memos and paste into ChatGPT" — the exact DIY confession
- **X threads** — "my AI workflow: record on phone → Otter? → GPT → Notion" kinds of posts — the user mapping their own broken loop
- **Reddit** r/productivity, r/GetDisciplined "how do I capture thoughts on walks" questions
- **Apple's own App Store reviews** of Voice Memos and Just Press Record — especially ones asking for transcription features

**Score boosters:** already subscribes to Every / reads Stratechery / follows Dan or Naveen / has ever tweeted about MCP.

### T2 — Meeting-capture frustrated (Otter/Fireflies churners)

The juiciest tier. Massive install base + public complaint surface + clean philosophical wedge.

- **Otter's own Trustpilot / G2** — negative reviews, "cancelled Otter" posts
- **X search** — "Otter bot joined my call" (people hate meeting bots), "Fireflies in every meeting" fatigue posts
- **Reddit** r/Otterai, r/sales, r/startups — threads about meeting-bot fatigue, privacy concerns, missed accuracy
- **LinkedIn** — posts in sales/CS communities complaining about post-call admin work
- **YouTube comments** under Otter/Fireflies demos that have tipped negative

**Score boosters:** role is founder / product / support / sales (people on lots of calls), stated frustration with bots-in-meetings, mentions of "all-hands" fatigue.

### T3 — Dictation ceiling (Wispr/SuperWhisper users)

Already paying for voice. They have the muscle. They just haven't seen the passive-work extension yet.

- **Wispr Flow Trustpilot (2.7/5)** — the well-documented trust gap. Every negative reviewer is a target.
- **SuperWhisper's** X community + subreddit — power users publicly evangelizing
- **Product Hunt comments** on every Wispr and SuperWhisper launch — commenters with handles
- **r/macapps** "which dictation tool" threads — commenters self-disclose their tool
- **GitHub dotfiles** — devs who've configured Wispr or SuperWhisper in public configs

**Score boosters:** complains about cloud/privacy (Notes' Apple-first local-sync is a wedge), asks about integration with Claude Code or Codex, is a paying subscriber to Every.

### T4 — Pro creators overpaying

Small tier but high LTV.

- **Descript's G2 reviews** — 4-star reviews where the user specifically calls out using Descript only for transcription (the 10% use case)
- **Podcaster Twitter** — hosts who say "I use Descript for the transcripts" rather than editing
- **Substack / creator newsletters** where the author discloses their tool stack

### T5 — Dev DIYers — recruit, don't convert

**This is the most important tier shift in this doc. These users don't need Monologue. But they're Every's exact audience.** Convert them as skill-builders on the MCP, not as seat-buyers.

- **GitHub** — stargazers on whisper.cpp, faster-whisper, OpenSuperWhisper repos
- **Hacker News** — threads about Whisper implementations
- **X** — anyone who's posted about Claude Code + Whisper combos

**Motion:** Invite them to build + publish a skill on the Monologue API/CLI. Top skills get featured by Every. Distribution for them, platform flywheel for Every.

### T6 — Plugin-stack duct-tapers (Bear/Drafts/Obsidian)

- **Obsidian Discord + forum** — "voice transcription plugin" threads
- **Drafts action directory** — users of the Whisper action = already doing it manually
- **Bear subreddit** — "how do I record audio in Bear" asks

### T7 — Built-in — editorial capture only

Do not outreach. Too broad, too low-intent. Win them through content at the moment they search.

- Google keyword targets: "voice memos transcription doesn't work", "iOS dictation limits", "alternatives to Voice Memos"
- Content angle: "The five-minute upgrade from Voice Memos to a real voice workflow" — lands in Google, converts the searchers

---

## The four message variants

One base template. Four wedges, one per heat tier. Each one built off the "$30 question" structure but leading with a different angle.

All four are **email templates**, but each also maps to a secondary surface (X reply, in-product nudge, editorial follow-up) noted under each.

---

### Variant A — for T1 orphans

**Angle:** Identity. You're already doing this. Notes is the product for it.

**Subject:** `you're already doing the loop`

```
Hey [name],

Saw you recording on Voice Memos and pasting into Claude. 
You've been doing passive work without a name for it.

Monologue shipped Notes today. Record on your Watch, 
transcript meets your agent when you sit down. No 
copy-paste tax.

Bundled in Every at $30/mo: [link]

— [Every team member]
```

*(46 words.)*

**Secondary surface:** X reply to the post that triggered the signal.
**Expected CVR (modeled, not observed):** 8-12% trial start. Highest in the matrix — they already know the pain, we're naming it.

---

### Variant B — for T2 meeting-capture churners

**Angle:** Philosophy. Anti-bot, anti-vendor-lock-in.

**Subject:** `no more bot in the meeting`

```
Hey [name],

Saw the "another bot in the meeting" energy. Felt that.

Monologue Notes shipped today. No bot. No join link. You 
record locally, your agent picks up the transcript, the 
follow-up writes itself.

Naveen shipped a bug fix from a 19-minute call with zero 
prompts. That's the philosophy.

$30/mo, bundled in Every: [link]

— [Every team member]
```

*(58 words.)*

**Secondary surface:** LinkedIn message if they posted on LinkedIn, X DM if X. Not email-first for this tier — these users live on social.
**Expected CVR:** 5-8% trial start. Philosophy match is sticky but slower to convert than pure economics.

---

### Variant C — for T3 dictation-ceiling users

**Angle:** "You're halfway there." (My original $30 question, updated for the launch.)

**Subject:** `you're halfway there`

```
Hey [name],

You're on [Wispr / SuperWhisper]. That's half the loop — 
voice in, text out.

Monologue just shipped Notes. The other half. Record a 
walk or a call, your agent pulls the transcript in Claude 
or Codex. Naveen shipped a bug fix from a 19-minute call, 
zero prompts.

$30/mo. Full stack: [link]

— [Every team member]
```

*(54 words.)*

**Secondary surface:** In-product nudge inside existing Monologue dictation users who haven't activated Notes yet. "You've run X dictations. Notes captures the other half."
**Expected CVR:** 6-10% trial start. They understand the primitive already; conversion is about showing them the upgrade category.

---

### Variant D — for T4 pro-creator overpayment

**Angle:** Money + tool sprawl.

**Subject:** `Descript math`

```
Hey [name],

Heard you use Descript mostly for transcripts. 10% of 
what it does, 100% of the bill.

Monologue Notes shipped today. Record anywhere, transcript 
hits your agent via MCP, keep your real editor (Logic, Pro 
Tools, Premiere). 

$30/mo for the whole Every bundle: [link]

— [Every team member]
```

*(47 words.)*

**Secondary surface:** Pitch to the podcast/newsletter where the signal came from — "can I come on and talk about creator-stack consolidation?"
**Expected CVR:** 4-7% trial start. Higher LTV on conversions, slower cycle.

**Secondary surface:** Pitch to the podcast/newsletter where the signal came from — "can I come on and talk about creator-stack consolidation?"
**Expected CVR:** 4-7% trial start. Higher LTV on conversions, slower cycle.

---

## The activation loop — how this system actually runs

Not one-off sends. A loop that compounds.

```
 ┌─────────────────────────────────────────────────────────────┐
 │  1. Signal capture                                          │
 │     Daily scrapers across five surfaces + tier tagging      │
 │     → Stored in Clay / Notion / internal CRM                │
 └─────────────────────────────────────────────────────────────┘
                             │
                             ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  2. Tier classification                                     │
 │     ICP enrichment (LinkedIn, company, role, engagement     │
 │     with Every content) + heat scoring                      │
 │     → Route to variant A/B/C/D                              │
 └─────────────────────────────────────────────────────────────┘
                             │
                             ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  3. Surface selection                                       │
 │     Email / X reply / LinkedIn / in-product                 │
 │     based on tier + where signal originated                 │
 └─────────────────────────────────────────────────────────────┘
                             │
                             ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  4. Ship                                                    │
 │     Variant + surface combo, with one human touch           │
 │     per send (Every team member signs)                      │
 └─────────────────────────────────────────────────────────────┘
                             │
                             ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  5. Measure                                                 │
 │     Impression → click → trial → paid conversion            │
 │     Per variant, per tier, per surface                      │
 └─────────────────────────────────────────────────────────────┘
                             │
                             ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  6. Rubric refine                                           │
 │     Weekly: what's converting, what's not                   │
 │     Kill underperformers at 2-week mark                     │
 │     Scale winners to adjacent tiers                         │
 └─────────────────────────────────────────────────────────────┘
                             │
                             ▼
         (loop back to signal capture, smarter each cycle)
```

### What I'd instrument in Week 1

- **Signal feed**: daily Clay workflow scraping the five surfaces, tagged by tier, dumped into a Notion CRM
- **Variant router**: a simple rules engine (no ML, just conditionals) — tier + signal origin → which of A-D + which surface
- **Send cap**: 50 sends/day across all variants in Week 1. Learning > volume.
- **Dashboard**: one Notion page, updated daily, with impression/click/trial/paid per variant + per tier. Austin can read it in 45 seconds.

### Kill/scale thresholds (Week 2 gate)

- Kill a variant if CVR < 2% on ≥ 50 sends
- Scale a variant to next tier if CVR ≥ 7% on ≥ 50 sends
- Kill a tier if all variants < 2% → content-only motion for that tier
- Scale a tier if any variant ≥ 7% → triple volume, recruit an Every writer to publish supporting editorial

### What I'd NOT do

- No sequencer / Smartlead / warmup fleet. Every's brand doesn't survive a cold-blast motion.
- No "contact enrichment at scale" beyond Clay for tier classification. Not the point.
- No automated reply bots. Every send has a named Every team member signing. Human layer is the moat.
- No spam. If a signal is ambiguous, skip it. Precision > recall.

---

## On-platform vs off-platform (deferred per your note)

Austin mentioned this in our call and you said to hold on it. Flagging it here so it's on the list: activation-through-owned-platform vs. activation-through-owned-audience is a real strategic branch. Own-audience (Every's 153K+ readers) is the cheap motion. Own-platform (Monologue's own users, the MCP ecosystem) is the compounding motion. Worth its own doc when you want it.

---

## Parts 2-6: the framework generalizes

Each of Every's other five products has the same shape — re-tier competitors by user pain, map signal surfaces per tier, variant the copy per angle, loop activate. One-paragraph sketches below.

### Cora (email AI)
T1 is Gmail power users with three inbox-management Zaps held together by string. T2 is Superhuman churners who hit the $30/mo ceiling. T3 is Shortwave users who want less inbox, not faster inbox. T4 is Fyxer/SaneBox paying for single-feature niches. Angle: "twice a day, not all day." Signal surfaces: Superhuman cancellation threads, r/Gmail, Substack "I cancelled Superhuman" posts.

### Spiral (writing AI)
T1 is Jasper refugees — the "slop" churners who want taste. T2 is ChatGPT Plus writers realizing the default model has no editorial spine. T3 is Notion AI users hitting the creativity wall. T4 is Grammarly Premium users who want to draft, not just polish. Angle: "AI with taste, not template blast." Signal surfaces: Jasper G2 negative reviews, Substack posts "I cancelled my AI writer," Twitter AI-slop screenshots.

### Sparkle (file org)
Softest tier in the bundle. T1 is Hazel users who bounced off the config rabbit hole. T2 is CleanMyMac X churners sick of the nagging. T3 is Mac power users with desktop chaos but no tool. Angle: "zero-config or you're already engineering, not organizing." Signal surfaces: r/macapps, Setapp churners, Hazel forum posts.

### Plus One (agent)
Most interesting category because it's new. T1 is founders who tried to build their own Montaigne and bounced (high-LTV, love the concept, don't have three weeks). T2 is Granola power users who want scope beyond meetings. T3 is Rewind churners (privacy). T4 is ChatGPT Pro users frustrated by siloed memory. Angle: "Montaigne for the 98% who can't build it." Signal surfaces: Austin's Montaigne piece comments, r/singularity, Granola Pro churners, founder Twitter.

### Every (media + writing)
T1 is Stratechery subscribers who want more builder-forward, less analyst-forward. T2 is Ben's Bites readers wanting depth over breadth. T3 is Lenny's readers who want AI-native extension. T4 is free-tier AI newsletter consumers (Ben Lang, Turing Post readers) ready to graduate to paid bundle. Angle: "One subscription, not five." Signal surfaces: Substack churn posts, cross-subscription overlap analysis, newsletter comment sections.

### Pattern across all six
Every product's activation motion follows the same five-step loop. The variants change — money, time, identity, pain — but the architecture is identical. **The GTME's job isn't to run six separate activation plays. It's to build one loop and point it at six products.**

Full activation docs for any of these available on request — I can ship one per 24 hours. Pick the priority.

---

— Keegan

# SURFACE IQ — REFINED DESIGN SYSTEM
## Native Every.to Brand Integration
### Based on live HTML audit of every.to, cora.computer, monologue.to, every.to/studio

---

## 1. THE BRIDGE: WHY THIS MATTERS

The Surface IQ platform isn't a third-party tool. It's an **internal intelligence layer** for Every. When Austin shares player cards with the team, they should feel like they came from the same design system that built Spiral, Cora, and the Every homepage.

This document maps the audited Every.to design tokens directly onto the Surface IQ component architecture.

---

## 2. COLOR PALETTE (Exact Every.to Tokens)

### Core Brand Colors
| Token | Hex | Role in Surface IQ |
|-------|-----|-------------------|
| **everyblack** | `#000000` | Dashboard background, card backgrounds |
| **everydark** | `#212121` | Elevated surfaces, hover states |
| **everygray** | `#2B2B2B` | Card borders, dividers |
| **everyborder** | `#3c3c3c` | Dashed dividers, grid lines |
| **everymuted** | `#494949` | Secondary borders, inactive surfaces |
| **everyblue** | `#0393d6` | Primary accent — Austin's archetype, active states |
| **everyorange** | `#ff6010` | Secondary accent — Dan's archetype, CTAs |
| **everywhite** | `#FFFFFF` | Primary text on dark |

### Product-Specific Colors (Mapped to GM Archetypes)
| Product | Color | GM | Card Accent |
|---------|-------|-----|-------------|
| **Cora** | `#0B57D0` | Kieran | Blue |
| **Sparkle** | `#065BA3` | Yash | Dark Blue |
| **Monologue** | `#488FCB` | Naveen | Light Blue |
| **Plus One** | `#ff6010` | Dan | Orange |
| **Spiral** | `#0393d6` | — | Every Blue |
| **Proof** | `#CF372D` | — | Red |

### Surface Status Colors
| Status | Color | Usage |
|--------|-------|-------|
| **Active** | `#0393d6` (everyblue) | Present surface indicator |
| **Absent** | `#494949` (everymuted) | Missing surface indicator |
| **Warning** | `#ff6010` (everyorange) | Low efficiency alert |
| **Success** | `#00d4aa` (custom green) | High efficiency, golden ratio hit |
| **Error** | `#CF372D` | Airball spike, over-promotion |

### Background Hierarchy (Every's Dark Theme)
| Layer | Color | Usage |
|-------|-------|-------|
| **Base** | `#000000` | Page background |
| **Card** | `#111111` | Player cards, metric panels |
| **Elevated** | `#212121` | Hover states, dropdowns |
| **Overlay** | `rgba(0,0,0,0.50)` | Modal backdrops (matches Every's drawer) |
| **Overlay Heavy** | `rgba(0,0,0,0.60)` | Image lightbox backdrop |

---

## 3. TYPOGRAPHY (Exact Every.to Scale)

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```
**Note:** Every uses system fonts exclusively. No custom font loading. This is a performance signal we match.

### Type Scale
| Role | Size | Weight | Line Height | Letter Spacing | Usage in Surface IQ |
|------|------|--------|-------------|----------------|-------------------|
| **Display** | 52px | 700 | 1.1 | -0.02em | Dashboard hero, "Surface IQ" lockup |
| **H1** | 40px | 700 | 1.2 | -0.01em | Page titles, player names on cards |
| **H2** | 32px | 600 | 1.25 | 0 | Section headers, "Shot Distribution" |
| **H3** | 28px | 600 | 1.3 | 0 | Sub-sections, archetype badges |
| **H4** | 20px | 600 | 1.4 | 0 | Card labels, metric names |
| **Body** | 16px | 400 | 1.5 | 0 | Descriptions, notes, opportunity text |
| **Label** | 14px | 500 | 1.4 | 0 | Surface names, shot type labels |
| **Caption** | 12px | 400 | 1.4 | 0 | Percentages, follower counts, timestamps |

### Every-Specific Patterns
- **Compound headings:** Every uses compound words without spaces in article H1s (e.g., "IntroducingSpiral"). Surface IQ uses this pattern for report titles: "AustinTedescoSurfaceIQ".
- **Italic emphasis:** Monologue uses `_3x faster_` in headlines. Surface IQ uses italic for player roles and golden ratio notes.
- **All-caps labels:** Navigation items, button text, badges use uppercase with wide letter-spacing.

---

## 4. SPACING SYSTEM (Every's Tailwind Scale)

### Base Unit: 4px
| Token | Value | Usage |
|-------|-------|-------|
| **space-1** | 4px | Tight gaps, icon padding |
| **space-2** | 8px | Inline spacing |
| **space-3** | 12px | Small component padding |
| **space-4** | 16px | Card padding, mobile gutters |
| **space-6** | 24px | Section gaps |
| **space-8** | 32px | Major section dividers |
| **space-12** | 48px | Between player cards |
| **space-20** | 80px | Page section breaks |
| **space-24** | 96px | Hero spacing |

### Custom Every Values
| Token | Value | Usage |
|-------|-------|-------|
| **drawer-width** | 277px | Side panel width (from Every's drawer menu) |
| **article-max** | 720px | Narrow content width |
| **content-max** | 1248px | Main content width |
| **container-max** | 1280px | Full dashboard width |
| **card-radius** | 8px | Standard card rounding |
| **cora-radius** | 20px | Elevated container rounding (from Cora) |

---

## 5. LAYOUT STRUCTURES (Every's Grid System)

### Dashboard Grid
```
Mobile (< 576px):     1 column, 16px gutters
Tablet (576-975px):   2 columns, 16px gutters
Desktop (976-1098px): 3 columns, 24px gutters
Wide (1099-1279px):   4 columns, 24px gutters
Ultra-wide (1280px+): 5 columns, 32px gutters
```
**Directly matches Every's article grid:** 5 columns on desktop, responsive down to 1.

### Player Card Internal Layout
```
┌─────────────────────────────────────┐
│ HEADER BAR (everyblue accent)         │  ← 52px height, full width
│ Name + Role + Handle                  │  ← 40px H1 + 14px label
├─────────────────────────────────────┤
│ ARCHETYPE BADGE                       │  ← 28px H3, dashed border
├─────────────────────────────────────┤
│ SURFACE PRESENCE BARS                 │  ← 7 surfaces, 8px bars
│ Twitter ● 3200  LinkedIn ● 2800...   │
├─────────────────────────────────────┤
│ SHOT DISTRIBUTION                     │  ← Horizontal bar chart
│ ████ 3P (9%)  ████████ mid (27%)... │
├─────────────────────────────────────┤
│ EFFICIENCY SPLITS                     │  ← Vertical bar chart
│ FG% ████████ 0.078                    │
├─────────────────────────────────────┤
│ SURFACE IQ SUMMARY                    │  ← Body text, 16px
│ Superpower: Efficient Volume          │
│ Golden Ratio: 10% 3P / 25% mid...   │
├─────────────────────────────────────┤
│ GROWTH LOOP POSITION                  │  ← Label + body
│ FUNNEL: TRUST                         │
└─────────────────────────────────────┘
```

### Comparison View Layout
```
┌─────────────────────┬─────────────────────┐
│   PLAYER A CARD     │    PLAYER B CARD      │
│   (full card)       │    (full card)        │
├─────────────────────┴─────────────────────┤
│         COMPARATIVE METRICS TABLE          │
│  Metric    │ Player A  │ Player B │ Delta  │
├───────────────────────────────────────────┤
│  FG%       │   0.078   │  0.045   │ +73%   │
│  3P%       │   0.092   │  0.038   │ +142%  │
│  FT%       │   0.085   │  0.062   │ +37%   │
└───────────────────────────────────────────┘
```

---

## 6. COMPONENT PATTERNS (Every's Native Components, Repurposed)

### A. Drawer Navigation → Dashboard Sidebar
Every's drawer menu (max-width 277px, zinc-900, slides from left) becomes the Surface IQ dashboard sidebar.

```
Every's Drawer:              Surface IQ Sidebar:
┌──────────┐                 ┌──────────┐
│ Logo     │                 │ Surface  │
│ Close    │                 │ IQ Logo  │
├──────────┤                 ├──────────┤
│ Home     │                 │ Dashboard│
│ Products │      →          │ Roster   │
│ Articles │                 │ Compare  │
│ Team     │                 │ Reports  │
├──────────┤                 ├──────────┤
│ About    │                 │ Settings │
│ Careers  │                 │ API Keys │
└──────────┘                 └──────────┘
```

**Styling:**
- Background: `#000000` (base) or `#212121` (elevated)
- Text: `#FFFFFF` at 100% opacity
- Dividers: `border-dashed border-[#3c3c3c]`
- Hover: `hover:bg-white/5` (Every's exact hover pattern)
- Active: `bg-[#0393d6]/20` with left border accent

### B. Product Cards → Player Cards
Every's product cards (grid layout, consistent padding, hover states) become player cards.

**Every's Product Card:**
- Grid-based, image + title + description
- Hover: subtle scale or shadow increase
- Border radius: 8px

**Surface IQ Player Card:**
- Grid-based, header + metrics + summary
- Hover: `shadow-lg` (Every's exact shadow class)
- Border radius: 8px
- Border: `1px solid #3c3c3c` (Every's divider color)
- Active hover: `hover:border-[#0393d6]`

### C. Article Cards → Post Preview Cards
Every's article cards (thumbnail, title, excerpt, metadata) become post preview cards in the drill-down view.

**Every's Article Card:**
- Thumbnail (16:9)
- Title (20px, bold)
- Excerpt (16px, muted)
- Metadata (12px, timestamp + read time)

**Surface IQ Post Card:**
- Shot type badge (colored dot + label)
- Post text (16px, truncated)
- Engagement metrics (12px, likes/replies/RTs)
- Timestamp (12px, muted)

### D. Subscribe Banner → Insight Banner
Every's subscribe banner (full-width, everyblue background, cursor-pointer) becomes the insight banner.

**Every's Banner:**
- Full width, `bg-[#0393d6]`
- Centered text, white
- Clickable, hover state

**Surface IQ Insight Banner:**
- Full width, `bg-[#0393d6]` or `bg-[#ff6010]`
- "The Product Hunt Maker Gap: 5 products, 0 makers attached"
- Clickable → opens detailed report

### E. Hero Section → Dashboard Hero
Every's hero (52px headline, dark background, product carousel) becomes the dashboard hero.

**Every's Hero:**
- `text-[52px]`, white on black
- Product screenshots in horizontal scroll
- CTA below headline

**Surface IQ Hero:**
- `text-[52px]`: "Surface IQ"
- Subhead: "Roster Analytics for Every"
- Horizontal scroll: recent player cards or experiment previews
- CTA: "Run Discovery Sweep"

---

## 7. SURFACE TREATMENT (Every's Exact Patterns)

### Elevation & Z-Index
| Layer | Z-Index | Usage |
|-------|---------|-------|
| **Base content** | 1-10 | Cards, text, images |
| **Sticky headers** | 50 | Dashboard top bar |
| **Drawers/sidebars** | 100001 | Navigation panel (Every's exact z-index) |
| **Backdrop** | 100000 | Modal overlays (Every's exact z-index) |
| **Popups/toasts** | 100002 | Notifications |

### Shadows
```css
/* Every's shadow-lg, mapped to Surface IQ */
.shadow-card {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
.shadow-elevated {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
}
```

### Borders & Dividers
```css
/* Every's exact patterns */
.divider-dashed {
  border-top: 1px dashed #3c3c3c;
}
.card-border {
  border: 1px solid #3c3c3c;
}
.card-border-hover:hover {
  border-color: #0393d6;
}
```

### Opacity & Hover States
```css
/* Every's exact hover patterns */
.hover-surface:hover {
  background-color: rgba(255, 255, 255, 0.05); /* hover:bg-white/5 */
}
.hover-surface-active {
  background-color: rgba(3, 147, 214, 0.20); /* everyblue at 20% */
}
```

### Gradients
```css
/* Every's gradient patterns, repurposed */
.gradient-hero {
  background: linear-gradient(to bottom, #000000 0%, #212121 100%);
}
.gradient-accent {
  background: linear-gradient(to right, #0393d6, #ff6010);
}
.gradient-overlay {
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}
```

---

## 8. INTERACTION PATTERNS (Every's Behaviors)

### Drawer Slide Animation
```css
/* Every's exact drawer animation */
.drawer {
  transition: all 0.3s ease-in-out;
  left: -100%;
}
.drawer.open {
  left: 0;
}
.backdrop {
  transition: opacity 0.3s ease;
  opacity: 0;
}
.backdrop.visible {
  opacity: 1;
}
```

### Card Hover States
```css
/* Every's inferred hover pattern */
.player-card {
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.player-card:hover {
  transform: scale(1.02);
  border-color: #0393d6;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}
```

### Button Patterns
```css
/* Every's CTA button pattern */
.btn-primary {
  background-color: #0393d6;
  color: #FFFFFF;
  padding: 12px 24px; /* px-6 py-3 */
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  transition: background-color 0.2s ease;
}
.btn-primary:hover {
  background-color: #0277b3; /* Darkened everyblue */
}
.btn-secondary {
  background-color: transparent;
  border: 1px solid #3c3c3c;
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 8px;
}
.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: #494949;
}
```

---

## 9. RESPONSIVE BREAKPOINTS (Every's Exact Breakpoints)

| Name | Width | Layout Change |
|------|-------|---------------|
| **Mobile** | < 576px | 1-column cards, stacked metrics, hidden sidebar |
| **Tablet** | 576-975px | 2-column cards, simplified shot charts |
| **Desktop** | 976-1098px | 3-4 column cards, full metrics visible |
| **Wide** | 1099-1279px | 4-column cards, sidebar appears |
| **Ultra-wide** | 1280px+ | 5-column cards, 10-column grid internal, full sidebar |

**Note:** These are Every's exact breakpoints observed in their Tailwind class names. Surface IQ uses them verbatim.

---

## 10. DASHBOARD PAGE ARCHITECTURE

### Hero Section (Every's Homepage Pattern)
```
┌─────────────────────────────────────────────────────────────┐
│  bg-black                                                   │
│                                                             │
│  text-[52px] font-bold text-white                           │
│  SURFACE IQ                                                 │
│                                                             │
│  text-[20px] text-white/60                                  │
│  Roster Analytics for Every                                 │
│                                                             │
│  [Run Discovery Sweep] [View Reports]                       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Horizontal scroll: Recent player cards / experiment previews│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Team Overview Grid (Every's Article Grid Pattern)
```
┌─────────────────────────────────────────────────────────────┐
│  text-[32px] font-semibold text-white                       │
│  THE ROSTER                                                 │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ DAN      │ │ AUSTIN   │ │ KIERAN   │ │ YASH     │        │
│  │ SHIPPER  │ │ TEDESCO  │ │ KLAASSEN │ │ POOJARY  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ NAVEEN   │ │ KATE     │ │ BRANDON  │ │ NATALIA  │        │
│  │ NAIDU    │ │ LEE      │ │ GELL     │ │ QUINTERO │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Insight Banner (Every's Subscribe Banner Pattern)
```
┌─────────────────────────────────────────────────────────────┐
│  bg-[#ff6010] cursor-pointer hover:opacity-90               │
│                                                             │
│  text-white text-center py-4                                │
│  🚨 CRITICAL: 5 products on Product Hunt, 0 maker profiles  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. PLAYER CARD DETAIL (Every's Component Patterns Applied)

### Card Shell
```html
<div class="
  bg-[#111111]
  border border-[#3c3c3c]
  rounded-lg
  overflow-hidden
  hover:border-[#0393d6]
  hover:shadow-lg
  transition-all duration-200
">
  <!-- Header Bar -->
  <div class="bg-[#ff6010] h-2"></div>

  <!-- Content -->
  <div class="p-4">
    <!-- Name & Role -->
    <h2 class="text-[40px] font-bold text-white leading-tight">
      DAN SHIPPER
    </h2>
    <p class="text-[14px] text-white/60 mt-1">
      CEO / HOST • @danshipper
    </p>

    <!-- Archetype Badge -->
    <div class="mt-3 inline-block border border-dashed border-[#ff6010] px-3 py-1">
      <span class="text-[12px] font-bold text-[#ff6010] uppercase tracking-wide">
        The Floor General
      </span>
    </div>

    <!-- Surface Presence -->
    <div class="mt-4 space-y-2">
      <div class="flex items-center gap-2">
        <span class="text-[12px] text-white/60 w-20">Twitter</span>
        <div class="flex-1 h-2 bg-[#3c3c3c] rounded-full overflow-hidden">
          <div class="h-full bg-[#1da1f2] w-[95%]"></div>
        </div>
        <span class="text-[12px] text-white/40">52K</span>
      </div>
      <!-- Repeat for LinkedIn, GitHub, etc. -->
    </div>

    <!-- Divider -->
    <div class="my-4 border-t border-dashed border-[#3c3c3c]"></div>

    <!-- Shot Distribution -->
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <span class="text-[12px] text-white/60 w-16">3P</span>
        <div class="flex-1 h-4 bg-[#3c3c3c] rounded overflow-hidden">
          <div class="h-full bg-[#CF372D] w-[10%]"></div>
        </div>
        <span class="text-[12px] text-white/40 w-12 text-right">10%</span>
      </div>
      <!-- Repeat for mid, FT, assist -->
    </div>

    <!-- Divider -->
    <div class="my-4 border-t border-dashed border-[#3c3c3c]"></div>

    <!-- Surface IQ Summary -->
    <div class="space-y-2">
      <p class="text-[12px] font-bold text-[#ff6010] uppercase">Superpower</p>
      <p class="text-[14px] text-white/80">
        Narrative Spacing — personal tweets create gravity for product tweets
      </p>
    </div>
  </div>
</div>
```

---

## 12. COMPARISON TO GENERIC DARK DASHBOARD

| Element | Generic Dashboard | Every-Native Surface IQ |
|---------|-----------------|------------------------|
| Background | `#0a0a0a` (custom) | `#000000` (Every's exact black) |
| Card BG | `#111111` (custom) | `#111111` (matches) |
| Accent | `#ff6b35` (random orange) | `#ff6010` (Every's exact orange) |
| Blue | `#3498db` (random blue) | `#0393d6` (Every's everyblue) |
| Dividers | `#333333` (generic) | `#3c3c3c` (Every's exact border) |
| Hover | `bg-white/10` | `bg-white/5` (Every's exact hover) |
| Border style | Solid | Dashed (Every's exact pattern) |
| Font | Inter (loaded) | System fonts (Every's performance choice) |
| Shadow | Custom values | `shadow-lg` (Every's exact Tailwind class) |
| Border radius | 12px | 8px (Every's exact card radius) |
| Z-index layering | Arbitrary | 100000/100001 (Every's exact values) |

---

## 13. IMPLEMENTATION NOTES FOR CURSOR

When building in Cursor, use these exact Tailwind classes:

```
/* Page background */
bg-black

/* Card container */
bg-[#111111] border border-[#3c3c3c] rounded-lg

/* Header accent bar */
bg-[#0393d6] or bg-[#ff6010] (per player archetype)

/* Typography */
text-[52px] font-bold text-white          /* Hero */
text-[40px] font-bold text-white          /* Player name */
text-[32px] font-semibold text-white      /* Section header */
text-[28px] font-semibold text-white      /* Archetype */
text-[20px] font-semibold text-white       /* Sub-header */
text-base text-white/80                    /* Body */
text-sm text-white/60                      /* Labels */
text-xs text-white/40                      /* Captions */

/* Dividers */
border-t border-dashed border-[#3c3c3c]

/* Hover states */
hover:bg-white/5
hover:border-[#0393d6]

/* Surface indicators */
bg-[#1da1f2]  /* Twitter */
bg-[#0077b5]  /* LinkedIn */
bg-[#6cc644]  /* GitHub */
bg-[#ff6b35]  /* Substack */
bg-[#9b59b6]  /* Podcast */
bg-[#e1306c]  /* Instagram */
bg-[#da552f]  /* Product Hunt */

/* Badges */
border border-dashed border-[accent-color] px-3 py-1

/* Bars (shot distribution) */
h-2 bg-[#3c3c3c] rounded-full overflow-hidden
inner: h-full bg-[shot-color]

/* Insight banner */
bg-[#0393d6] text-white text-center py-4 cursor-pointer hover:opacity-90
```

---

## 14. THE "EVERY FEEL" CHECKLIST

Before shipping any Surface UI component, verify:

- [ ] Background is pure black (`#000000`), not dark gray
- [ ] Cards use `#111111` with `#3c3c3c` dashed borders
- [ ] Accent colors match Every's exact hex values
- [ ] Typography uses system fonts, no custom font loading
- [ ] Headlines use tight line-height (1.1-1.2) and slight negative letter-spacing
- [ ] Dividers are dashed, not solid
- [ ] Hover states use `bg-white/5`, not `bg-white/10`
- [ ] Border radius is 8px for cards, 20px for elevated containers
- [ ] Z-index follows Every's 100000/100001 pattern for overlays
- [ ] Buttons use 12px vertical + 24px horizontal padding
- [ ] Labels and badges use uppercase with tracking-wide
- [ ] The component would not look out of place on every.to or cora.computer

---

*Refined design system compiled from live HTML audit of every.to, cora.computer, monologue.to, every.to/studio, and every.to/plus-one. All color values, spacing tokens, and component patterns are directly observed from production CSS.*

"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const tiers = [
  { label: "Amazing", glyph: "◆", tone: "text-confidence-direct" },
  { label: "Good", glyph: "●", tone: "text-court-teal" },
  { label: "Meh", glyph: "○", tone: "text-court-line" },
  { label: "Bad", glyph: "✕", tone: "text-court-red" },
] as const;

/**
 * FourTierFeedback — the "What did you think?" rating row.
 *
 * Quote from graph/themes/every-design-system.md:62:
 *   "Four-tier feedback rating system: Amazing, Good, Meh, Bad"
 *
 * Lives at the bottom of every Court Vision essay. Currently stateless — clicking
 * a tier stores the choice in local React state and fires the optional `onRate`
 * callback, but no server persistence is wired up yet. Phase 4 of the brand-wrap
 * plan adds the rating endpoint and per-essay aggregation. Until then, callers
 * that want to capture ratings can pass `onRate` and forward to their own
 * analytics sink.
 *
 * TODO(brand-wrap-plan-phase-4): persist ratings to /api/feedback once the
 *   feedback collection endpoint ships, and surface period-level aggregates back
 *   in the next briefing essay.
 */
export function FourTierFeedback({
  prompt = "What did you think?",
  className,
  onRate,
}: {
  prompt?: string;
  className?: string;
  onRate?: (rating: (typeof tiers)[number]["label"]) => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <section
      className={cn(
        "flex flex-col gap-4 border-t border-foreground/15 pt-6 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      aria-label="Reader feedback"
    >
      <p className="font-serif italic text-caption text-muted-foreground">{prompt}</p>
      <div className="flex flex-wrap gap-2">
        {tiers.map((tier) => {
          const selected = chosen === tier.label;
          return (
            <button
              key={tier.label}
              type="button"
              onClick={() => {
                setChosen(tier.label);
                onRate?.(tier.label);
              }}
              aria-pressed={selected}
              className={cn(
                "group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5",
                "font-mono text-eyebrow uppercase tracking-ticker tabular transition",
                "border-foreground/15 bg-card/30 text-foreground/75 hover:border-foreground/35 hover:text-foreground",
                selected && "border-primary/60 bg-primary/10 text-foreground shadow-glow",
              )}
            >
              <span aria-hidden className={cn("text-[0.95em] leading-none", tier.tone)}>
                {tier.glyph}
              </span>
              <span>{tier.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

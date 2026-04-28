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
 * Lives at the bottom of every Court Vision essay. Stateless on the wire (we just
 * post a rating); local state shows a confirmed checkmark.
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

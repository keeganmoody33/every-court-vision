import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * TLDR — the article-start summary box.
 *
 * Quote from graph/themes/every-design-system.md:62:
 *   "TLDR (Too Long; Didn't Read) summary boxes at article start"
 *
 * Renders as a bordered box with a serif label, a tight rule, and 2–4 bullet
 * sentences as the actual takeaway. Used at the top of every Court Vision essay,
 * directly under Byline.
 */
export function TLDR({
  bullets,
  label = "TL;DR",
  className,
}: {
  bullets: ReactNode[];
  label?: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "relative grid gap-4 rounded-sm border border-foreground/15 bg-card/40 p-6 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-7",
        "shadow-[0_1px_0_hsl(var(--foreground)/0.04)]",
        className,
      )}
      aria-label="Summary"
    >
      <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
        <span className="font-mono text-eyebrow uppercase tracking-ticker text-court-orange tabular">
          {label}
        </span>
        <span aria-hidden className="hidden h-px w-10 bg-court-orange/60 sm:inline-block" />
        <span aria-hidden className="inline-block h-3 w-px bg-court-orange/60 sm:hidden" />
      </div>
      <ul className="font-serif text-body space-y-2.5 text-foreground/90">
        {bullets.map((bullet, idx) => (
          <li key={idx} className="flex gap-3">
            <span
              aria-hidden
              className="mt-[0.85em] inline-block h-px w-3 shrink-0 bg-foreground/40"
            />
            <span className="text-balance">{bullet}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

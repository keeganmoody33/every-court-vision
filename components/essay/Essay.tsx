import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Essay — the publication container.
 *
 * Holds a Cover (full-bleed) above a content area. Children manage their own
 * width — Body/Lede/Pull/TLDR self-constrain to a reading column; Figure spans
 * wider; Section provides a labeled rule-break.
 *
 * Quote from graph/themes/every-design-system.md:54:
 *   "Generous whitespace with modular sections, horizontal rules for separation."
 */
export function Essay({
  children,
  cover,
  className,
}: {
  children: ReactNode;
  /** The Cover component. Rendered above the content, full-width. */
  cover?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("space-y-10 lg:space-y-14", className)}>
      {cover}
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:space-y-10 lg:px-8">
        {children}
      </div>
    </article>
  );
}

/**
 * Section — a horizontally-ruled section break with optional eyebrow and title.
 * Mirrors the "modular sections, horizontal rules for separation" pattern.
 */
export function Section({
  children,
  title,
  eyebrow,
  className,
}: {
  children: ReactNode;
  title?: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="space-y-3">
        <div className="rule" aria-hidden />
        {eyebrow ? (
          <p className="font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground tabular">
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2
            className="font-serif text-figure-title leading-tight text-foreground text-balance"
            style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 96' }}
          >
            {title}
          </h2>
        ) : null}
      </div>
      {children}
    </section>
  );
}

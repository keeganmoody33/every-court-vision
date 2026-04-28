import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Lede — the opening paragraph.
 *
 * Optional drop-cap on the first letter (Every essay convention). Use sparingly —
 * one drop-cap per essay max. After the lede, regular <Body /> paragraphs follow.
 */
export function Lede({
  children,
  dropCap = false,
  className,
}: {
  children: ReactNode;
  dropCap?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-serif text-lede leading-[1.45] text-foreground/92 max-w-3xl text-balance",
        dropCap && "drop-cap",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * Body — a regular essay paragraph. Distinct from <p> so we can scope reading-first
 * type tokens without leaking into the rest of the app.
 */
export function Body({
  children,
  className,
  asides,
}: {
  children: ReactNode;
  className?: string;
  /** Optional sidenote rendered to the right on wide screens, inline above on mobile. */
  asides?: ReactNode;
}) {
  if (asides) {
    return (
      <div className={cn("grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(180px,18ch)] lg:gap-10", className)}>
        <p className="font-serif text-body leading-[1.68] text-foreground/88 max-w-3xl">
          {children}
        </p>
        <aside className="font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground tabular border-l border-foreground/15 pl-4 lg:mt-2">
          {asides}
        </aside>
      </div>
    );
  }
  return (
    <p
      className={cn(
        "font-serif text-body leading-[1.68] text-foreground/88 max-w-3xl",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * Pull — the magazine-style pull quote. Big, indented, italic Fraunces.
 */
export function Pull({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <figure className={cn("my-8 max-w-3xl", className)}>
      <blockquote
        className="font-serif italic text-foreground/95 leading-[1.18] text-balance"
        style={{
          fontVariationSettings: '"SOFT" 100, "WONK" 0, "opsz" 144',
          fontSize: "1.875rem",
        }}
      >
        <span className="select-none pr-1 text-court-orange opacity-80" aria-hidden>
          “
        </span>
        {children}
        <span className="select-none pl-1 text-court-orange opacity-80" aria-hidden>
          ”
        </span>
      </blockquote>
    </figure>
  );
}

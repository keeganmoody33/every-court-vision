import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * ReadWith — the inline "Read with [agent]" CTA.
 *
 * Quote from graph/themes/every-design-system.md:63:
 *   "'Read with AI' and 'Open with Plus One' interactive AI collaboration buttons"
 *
 * Quote from graph/themes/every-design-system.md:292:
 *   "Humanization pattern: Named AI agents (R2-C2, Iris, Montaigne, Margot, Alfredo,
 *   Milo, Nettle) with assigned managers"
 *
 * Court Vision's analyst agent — peer of Iris/Montaigne — is named **Bobbito**, the
 * single explicit NBA Street Vol. 2 nod (the announcer who reads the film with you).
 */
export function ReadWith({
  agent = "Bobbito",
  prompt,
  className,
  children,
}: {
  agent?: string;
  prompt?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={prompt ? `/api/agent?prompt=${encodeURIComponent(prompt)}&agent=${encodeURIComponent(agent)}` : "#"}
      className={cn(
        "group inline-flex items-baseline gap-2 font-serif text-caption italic text-foreground/80",
        "reveal-underline focus-visible:outline-none focus-visible:text-primary",
        className,
      )}
    >
      <Sparkles aria-hidden className="size-[0.85em] -translate-y-px text-primary" />
      <span>
        {children ?? "Read with"} <span className="not-italic font-medium text-foreground">{agent}</span>
      </span>
      <span aria-hidden className="text-primary transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </a>
  );
}

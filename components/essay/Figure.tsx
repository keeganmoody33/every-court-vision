import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Eyebrow } from "./Eyebrow";
import { ReadWith } from "./ReadWith";

/**
 * Figure — the data-figure primitive that turns a chart into an inline essay block.
 *
 * Rhythm (hex.tech-flavored, Every-typed):
 *   FIG.NN ──── EYEBROW ─── (e.g. "THE QUESTION", "WHAT HAPPENED")
 *                 Bold serif title
 *                 Italic serif lede caption
 *
 *                 [ chart slot — generous, breathing ]
 *
 *                 Source · agent CTA · footnote
 *
 * Use this in place of plain divs around recharts/d3 figures. Each chart in an essay
 * gets a Figure wrapper. Figure NUMBERS are stable-per-essay so prose can reference
 * them ("see Fig. 02").
 */
export function Figure({
  number,
  eyebrow,
  title,
  caption,
  source,
  agent,
  agentPrompt,
  ledeRight,
  children,
  className,
  bleed = false,
  surface = "card",
}: {
  /** Figure number — e.g. "01", "02". Pads to 2 digits visually. */
  number?: string | number;
  /** Tiny uppercase label above the title. e.g. "THE QUESTION", "WHAT HAPPENED". */
  eyebrow?: string;
  /** Bold serif figure title. */
  title: ReactNode;
  /** Italic serif lede caption — explains in 1–2 sentences what to look at. */
  caption?: ReactNode;
  /** Tiny right-side note next to the eyebrow — typically the data source or window. */
  ledeRight?: ReactNode;
  /** Source line shown at the figure foot. */
  source?: string;
  /** Agent name for the Read-with CTA. Defaults to Bobbito. */
  agent?: string;
  /** Optional prompt that the agent CTA fires. */
  agentPrompt?: string;
  /** The chart itself. */
  children: ReactNode;
  className?: string;
  /** When true, the chart bleeds edge-to-edge inside the figure (no inner padding). */
  bleed?: boolean;
  /** "card" = subtle bordered card, "naked" = no border, "court" = dark canvas (use for telestrator). */
  surface?: "card" | "naked" | "court";
}) {
  const num = number ? String(number).padStart(2, "0") : undefined;

  const surfaceClass = {
    card: "rounded-sm border border-foreground/10 bg-card/40 shadow-[0_30px_120px_-50px_rgba(0,0,0,0.6)]",
    naked: "",
    court: "rounded-sm border border-court-line/20 bg-[radial-gradient(circle_at_30%_-20%,rgba(255,157,66,0.06),transparent_55%),radial-gradient(circle_at_75%_120%,rgba(85,167,255,0.05),transparent_60%),hsl(var(--court-paint))] shadow-[0_40px_160px_-60px_rgba(0,0,0,0.7)]",
  }[surface];

  return (
    <figure
      className={cn(
        "group/figure relative my-8",
        // Wide essays get an outdent so figures can breathe past the prose column.
        "lg:-mx-2",
        className,
      )}
    >
      {/* Figure header — typographic rhythm before the chart. */}
      <header className="mb-5 flex flex-col gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {num ? (
            <span className="font-mono text-eyebrow uppercase tracking-ticker text-court-orange tabular">
              Fig. {num}
            </span>
          ) : null}
          {eyebrow ? <Eyebrow tone={num ? "default" : "primary"}>{eyebrow}</Eyebrow> : null}
          {ledeRight ? (
            <span className="ml-auto font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground tabular">
              {ledeRight}
            </span>
          ) : null}
        </div>
        <h3
          className="font-serif text-figure-title leading-[1.18] text-foreground text-balance"
          style={{ fontVariationSettings: '"SOFT" 50, "WONK" 0, "opsz" 96' }}
        >
          {title}
        </h3>
        {caption ? (
          <p className="font-serif italic text-caption text-muted-foreground max-w-2xl text-balance">
            {caption}
          </p>
        ) : null}
      </header>

      {/* Chart surface */}
      <div
        className={cn(
          surfaceClass,
          bleed ? "" : "p-4 sm:p-6 lg:p-8",
          "relative overflow-hidden",
        )}
      >
        {children}
      </div>

      {/* Footer: source line and/or agent CTA. The agent CTA only renders when the
          caller explicitly opts in via `agent` or `agentPrompt` — so a source-only
          figure stays source-only and doesn't auto-pick up a Bobbito link. */}
      {(source || agent !== undefined || agentPrompt) ? (
        <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {source ? (
            <span className="font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground/80 tabular">
              Source · {source}
            </span>
          ) : (
            <span />
          )}
          {agent !== undefined || agentPrompt ? (
            <ReadWith agent={agent} prompt={agentPrompt}>
              Read this figure with
            </ReadWith>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * StatTile — the hex.tech-flavored count-up stat block. Used inside an Essay for
 * single-number callouts (the "scoreboard" inside a paragraph).
 */
export function StatTile({
  label,
  value,
  detail,
  trend,
  className,
}: {
  label: string;
  value: string;
  detail?: string;
  trend?: "up" | "down" | "flat";
  className?: string;
}) {
  const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : trend === "flat" ? "—" : null;
  const arrowColor = trend === "up" ? "text-confidence-direct" : trend === "down" ? "text-court-red" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "group/stat relative isolate flex flex-col justify-between gap-3 overflow-hidden rounded-sm border border-foreground/10 bg-card/30 p-5",
        "transition-colors hover:border-court-orange/40",
        className,
      )}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-court-orange/40 to-transparent opacity-0 transition-opacity group-hover/stat:opacity-100" />
      <span className="font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground tabular">
        {label}
      </span>
      <div className="font-mono text-stat-lg leading-none tabular text-foreground animate-count">
        {value}
      </div>
      {(detail || arrow) ? (
        <div className="flex items-baseline gap-2 text-caption">
          {arrow ? <span className={cn("font-mono tabular", arrowColor)}>{arrow}</span> : null}
          {detail ? (
            <span className="font-serif italic text-muted-foreground">{detail}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

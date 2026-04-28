import { cn } from "@/lib/utils";

export type BylineProps = {
  /** The person who reads/owns this essay (e.g. "Austin Tedesco · Head of Growth"). */
  author?: string;
  /** Always rendered as the agent who *wrote* the data narrative. */
  agent?: string;
  /** Free-form date string — render as the operator already formatted it. */
  date?: string;
  /** Issue / experiment number — Every Studio convention, e.g. "#007". */
  issue?: string;
  /** Filed-under label, displayed as a kicker. e.g. "EVERY COURT VISION · BRIEFING". */
  filedUnder?: string;
  className?: string;
};

export function Byline({ author, agent = "Bobbito", date, issue = "#007", filedUnder, className }: BylineProps) {
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-1.5 text-caption", className)}>
      {issue ? (
        <span className="font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground tabular">
          Experiment {issue}
        </span>
      ) : null}
      {filedUnder ? (
        <span className="font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground/80 tabular">
          {filedUnder}
        </span>
      ) : null}
      {author ? (
        <span className="font-serif italic text-foreground/85">By {author}</span>
      ) : null}
      <span className="font-serif italic text-muted-foreground">
        with <span className="text-foreground/85">{agent}</span>
      </span>
      {date ? (
        <span className="font-mono text-eyebrow uppercase tracking-ticker text-muted-foreground tabular">
          {date}
        </span>
      ) : null}
    </div>
  );
}

import type { ComponentType, ReactNode } from "react";
import { Activity, Gauge, Trophy, Zap } from "lucide-react";

import type { ArcadeGamebreaker, ArcadeStat, ArcadeTone } from "@/lib/arcadeMeta";
import { cn } from "@/lib/utils";

const toneClasses: Record<ArcadeTone, string> = {
  teal: "from-arcade-cyan/25 via-court-teal/10 to-transparent border-arcade-cyan/40 text-arcade-cyan",
  orange: "from-court-orange/25 via-halftime-warm/10 to-transparent border-court-orange/40 text-court-orange",
  purple: "from-arcade-magenta/25 via-court-purple/10 to-transparent border-arcade-magenta/40 text-arcade-magenta",
  blue: "from-court-blue/25 via-halftime-cool/10 to-transparent border-court-blue/40 text-court-blue",
  red: "from-court-red/25 via-destructive/10 to-transparent border-court-red/40 text-court-red",
};

export function ArcadePageHeader({
  eyebrow,
  title,
  subtitle,
  stats = [],
  accent,
  gamebreaker,
  tone = "orange",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  stats?: ArcadeStat[];
  accent?: ReactNode;
  gamebreaker?: ArcadeGamebreaker;
  tone?: ArcadeTone;
  className?: string;
}) {
  return (
    <section className={cn("arcade-page-header arcade-scanline overflow-hidden", className)}>
      <div className="relative grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("arcade-kicker border bg-gradient-to-r", toneClasses[tone])}>
              {eyebrow}
            </span>
            {accent ? (
              <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-ticker-tight text-court-line/85 tabular">
                {accent}
              </span>
            ) : null}
          </div>
          <h1 className="gamebreaker mt-3 text-3xl leading-none text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-3 xl:min-w-[360px]">
          {gamebreaker ? <GamebreakerCallout {...gamebreaker} active /> : null}
          {stats.length ? <ScoreRail stats={stats} tone={tone} /> : null}
        </div>
      </div>
    </section>
  );
}

export function HudPanel({
  kicker,
  title,
  icon: Icon,
  tone = "orange",
  children,
  className,
}: {
  kicker?: string;
  title: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: ArcadeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("arcade-hud-panel arcade-scanline", className)}>
      <header className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          {kicker ? <p className={cn("arcade-kicker inline-flex border bg-gradient-to-r", toneClasses[tone])}>{kicker}</p> : null}
          <h2 className="mt-2 text-lg font-semibold leading-tight text-white">{title}</h2>
        </div>
        {Icon ? (
          <div className={cn("rounded-md border bg-black/35 p-2", toneClasses[tone])}>
            <Icon className="size-4" />
          </div>
        ) : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ScoreRail({
  stats,
  tone = "orange",
  className,
}: {
  stats: ArcadeStat[];
  tone?: ArcadeTone;
  className?: string;
}) {
  return (
    <div className={cn("arcade-score-rail", className)}>
      {stats.map((stat) => (
        <div key={`${stat.label}-${stat.value}`} className="min-w-0 border-l border-white/10 px-3 first:border-l-0">
          <p className="font-mono text-[10px] uppercase tracking-ticker-tight text-muted-foreground tabular">{stat.label}</p>
          <p className={cn("mt-1 truncate font-mono text-lg font-black leading-none tabular", toneClasses[tone].split(" ").at(-1))}>
            {stat.value}
          </p>
          {stat.detail ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{stat.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function GamebreakerCallout({
  level,
  label,
  detail,
  active = false,
}: ArcadeGamebreaker & { active?: boolean }) {
  const Icon = level >= 3 ? Trophy : level === 2 ? Zap : Gauge;

  return (
    <div className={cn("gamebreaker-callout", active && "is-active")}>
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-court-line/25 bg-black/45">
          <Icon className="size-5 text-court-line" />
        </div>
        <div className="min-w-0">
          <p className="gamebreaker truncate text-xl leading-none text-court-line">
            GameBreaker {level}
          </p>
          <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-ticker-tight text-white tabular">
            {label}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-court-line/75">{detail}</p>
    </div>
  );
}

export function MiniHudChip({
  label,
  value,
  tone = "orange",
  icon: Icon = Activity,
}: {
  label: string;
  value: string;
  tone?: ArcadeTone;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="arcade-mini-chip">
      <Icon className={cn("size-3.5", toneClasses[tone].split(" ").at(-1))} />
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-white">{value}</strong>
    </div>
  );
}

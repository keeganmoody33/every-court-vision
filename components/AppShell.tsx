"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  BarChart3,
  DatabaseZap,
  Flame,
  Layers3,
  LineChart,
  Map,
  PlaySquare,
  RadioTower,
  ShieldCheck,
  Users,
} from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { ArcadePageHeader } from "@/components/ArcadeChrome";
import { CompanyHeader } from "@/components/CompanyHeader";
import { GlobalFilters } from "@/components/GlobalFilters";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { arcadeMetaForPath } from "@/lib/arcadeMeta";
import { defaultFilters } from "@/lib/constants";
import type { FilterState } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/overview", label: "Overview", icon: BarChart3 },
  { href: "/court-heat", label: "Court Heat", icon: Flame },
  { href: "/shot-plot", label: "Shot Plot", icon: Map },
  { href: "/shot-zones", label: "Shot Zones", icon: Layers3 },
  { href: "/stream", label: "Stream", icon: RadioTower },
  { href: "/splits", label: "Splits", icon: LineChart },
  { href: "/players", label: "Players", icon: Users },
  { href: "/plays", label: "Plays", icon: PlaySquare },
  { href: "/attribution", label: "Attribution", icon: ShieldCheck },
  { href: "/acquisition", label: "Acquisition", icon: DatabaseZap },
];

interface FilterContextValue {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  setFilters: (next: FilterState) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

const filterParamAliases: Partial<Record<keyof FilterState, string>> = {
  intentClass: "intent",
};

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used within AppShell");
  return context;
}

function csvParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  if (!value) return undefined;
  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length ? values : undefined;
}

function filtersFromParams(searchParams: URLSearchParams): FilterState {
  return {
    ...defaultFilters,
    timeWindow: (searchParams.get("timeWindow") as FilterState["timeWindow"]) ?? defaultFilters.timeWindow,
    entity: (searchParams.get("entity") as FilterState["entity"]) ?? defaultFilters.entity,
    surface: (searchParams.get("surface") as FilterState["surface"]) ?? defaultFilters.surface,
    scoringMode: (searchParams.get("scoringMode") as FilterState["scoringMode"]) ?? defaultFilters.scoringMode,
    viewMode: (searchParams.get("viewMode") as FilterState["viewMode"]) ?? defaultFilters.viewMode,
    attribution: (searchParams.get("attribution") as FilterState["attribution"]) ?? defaultFilters.attribution,
    zoneMode: (searchParams.get("zoneMode") as FilterState["zoneMode"]) ?? defaultFilters.zoneMode,
    colorScale: (searchParams.get("colorScale") as FilterState["colorScale"]) ?? defaultFilters.colorScale,
    intentClass: (csvParam(searchParams, "intent") ?? csvParam(searchParams, "intentClass")) as FilterState["intentClass"],
    outcome: csvParam(searchParams, "outcome") as FilterState["outcome"],
    platforms: csvParam(searchParams, "platforms") as FilterState["platforms"],
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => filtersFromParams(new URLSearchParams(searchParams)));
  const activeMeta = arcadeMetaForPath(pathname);

  const syncFilters = useCallback((next: FilterState) => {
    setFilters(next);
    const params = new URLSearchParams(searchParams);
    for (const key of Object.keys(next) as Array<keyof FilterState>) {
      const option = next[key];
      const paramKey = filterParamAliases[key] ?? key;
      if (key === "intentClass") params.delete("intentClass");
      if (option === undefined || (Array.isArray(option) && option.length === 0)) {
        params.delete(paramKey);
      } else if (Array.isArray(option)) {
        params.set(paramKey, option.join(","));
      } else {
        params.set(paramKey, String(option));
      }
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const value = useMemo<FilterContextValue>(
    () => ({
      filters,
      setFilter: (key, option) => {
        syncFilters({ ...filters, [key]: option });
      },
      setFilters: syncFilters,
    }),
    [filters, syncFilters],
  );

  return (
    <FilterContext.Provider value={value}>
      <div className="arcade-shell min-h-screen lg:grid lg:grid-cols-[228px_1fr]">
        <aside className="hidden border-r border-white/10 bg-black/35 lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md border border-court-orange/40 bg-court-orange/10 shadow-orange-glow">
                  <Activity className="size-5 text-court-orange" />
                </div>
                <div>
                  <p className="gamebreaker text-lg leading-none text-white">Court Vision</p>
                  <p className="font-mono text-[10px] uppercase tracking-ticker-tight text-muted-foreground">
                    Arcade film room
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-md border border-white/10 bg-black/35 text-center">
                <div className="border-r border-white/10 p-2">
                  <p className="font-mono text-[9px] uppercase tracking-ticker-tight text-muted-foreground">QTR</p>
                  <p className="font-mono text-lg font-black text-court-line tabular">04</p>
                </div>
                <div className="p-2">
                  <p className="font-mono text-[9px] uppercase tracking-ticker-tight text-muted-foreground">CLOCK</p>
                  <p className="font-mono text-lg font-black text-arcade-cyan tabular">:24</p>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 px-3 py-4">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant={active ? "secondary" : "ghost"}
                      className={cn(
                        "h-9 w-full justify-start rounded-md font-mono text-[11px] uppercase tracking-ticker-tight",
                        active
                          ? "border border-court-orange/30 bg-court-orange/[0.12] text-court-line shadow-orange-glow"
                          : "text-muted-foreground hover:bg-white/[0.08] hover:text-white",
                      )}
                    >
                      <Link href={item.href} aria-current={active ? "page" : undefined}>
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </nav>
            </ScrollArea>
            <div className="border-t border-white/10 p-3">
              <p className="font-mono text-[10px] uppercase leading-5 tracking-ticker-tight text-muted-foreground">
                Not a leaderboard. Find the best shot.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="sticky top-0 z-40 border-b border-white/10 bg-background/90 px-3 py-3 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:px-5">
            <div className="mb-3 flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button key={item.href} asChild variant={pathname === item.href ? "secondary" : "ghost"} size="sm" className="shrink-0">
                    <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
            <GlobalFilters />
          </div>
          <div className="space-y-5 p-3 sm:p-4 lg:p-5">
            <ArcadePageHeader
              eyebrow={activeMeta.eyebrow}
              title={activeMeta.title}
              subtitle={activeMeta.subtitle}
              accent={activeMeta.accent}
              tone={activeMeta.tone}
              stats={activeMeta.stats}
              gamebreaker={activeMeta.gamebreaker}
            />
            <CompanyHeader />
            {children}
          </div>
        </main>
      </div>
    </FilterContext.Provider>
  );
}

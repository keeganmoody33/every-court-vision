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
import { createContext, useContext, useMemo, useState } from "react";

import { CompanyHeader } from "@/components/CompanyHeader";
import { GlobalFilters } from "@/components/GlobalFilters";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used within AppShell");
  return context;
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
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => filtersFromParams(new URLSearchParams(searchParams)));

  const value = useMemo<FilterContextValue>(
    () => ({
      filters,
      setFilter: (key, option) => {
        const next = { ...filters, [key]: option };
        setFilters(next);
        const params = new URLSearchParams(searchParams);
        params.set(key, String(option));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      },
    }),
    [filters, pathname, router, searchParams],
  );

  return (
    <FilterContext.Provider value={value}>
      <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r border-white/10 bg-black/25 lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 shadow-glow">
                  <Activity className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Every Court Vision</p>
                  <p className="text-xs text-muted-foreground">Growth film room</p>
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
                      className={cn("w-full justify-start", active && "border border-white/10 bg-white/10 text-white")}
                    >
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </nav>
            </ScrollArea>
            <div className="border-t border-white/10 p-4">
              <p className="text-xs leading-5 text-muted-foreground">
                Film-room rule: understand everyone&apos;s best shot. This is not a leaderboard.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="sticky top-0 z-40 border-b border-white/10 bg-background/85 px-4 py-3 backdrop-blur-xl lg:px-6">
            <div className="mb-3 flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => (
                <Button key={item.href} asChild variant={pathname === item.href ? "secondary" : "ghost"} size="sm">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
            <GlobalFilters />
          </div>
          <div className="space-y-6 p-4 lg:p-6">
            <CompanyHeader />
            {children}
          </div>
        </main>
      </div>
    </FilterContext.Provider>
  );
}

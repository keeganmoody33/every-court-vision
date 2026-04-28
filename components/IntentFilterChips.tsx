"use client";

import type { ReactNode } from "react";

import { useFilters } from "@/components/AppShell";
import { PLATFORM_COLORS } from "@/lib/intent/platformColors";
import type { FilterState, IntentClass, Platform, ShotOutcome, TimeWindow } from "@/lib/types";
import { cn } from "@/lib/utils";

const INTENT_CHIPS: Array<{ value: IntentClass; label: string; accent: string; dotted?: boolean }> = [
  { value: "threePoint", label: "3P", accent: "#ff6010" },
  { value: "midRange", label: "Mid", accent: "#FACC15" },
  { value: "paint", label: "Paint", accent: "#10B981" },
  { value: "freeThrow", label: "FT", accent: "#0393d6" },
  { value: "pass", label: "Pass", accent: "hsl(var(--muted-foreground))", dotted: true },
];

const PLATFORM_CHIPS: Array<{ value: Platform; label: string }> = [
  { value: "X", label: "X" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "GitHub", label: "GitHub" },
  { value: "Substack", label: "Substack" },
  { value: "Newsletter", label: "Newsletter" },
  { value: "YouTube", label: "YouTube" },
  { value: "Podcast", label: "Podcast" },
  { value: "Instagram", label: "Instagram" },
  { value: "Launches", label: "Launches" },
];

const OUTCOME_CHIPS: Array<{ value: ShotOutcome; label: string; activeClass: string }> = [
  { value: "made", label: "Made", activeClass: "border-confidence-direct bg-confidence-direct/20 text-confidence-direct" },
  { value: "missed", label: "Missed", activeClass: "border-court-red bg-court-red/20 text-court-red" },
  { value: "turnover", label: "Turnover", activeClass: "border-muted-foreground bg-muted/50 text-muted-foreground" },
];

const TIME_CHIPS: Array<{ value: TimeWindow; label: string }> = [
  { value: "7D", label: "7d" },
  { value: "30D", label: "30d" },
  { value: "90D", label: "90d" },
  { value: "Custom", label: "All" },
];

export function IntentFilterChips() {
  const { filters, setFilter, setFilters } = useFilters();

  function toggleArray<K extends "intentClass" | "platforms" | "outcome">(key: K, value: NonNullable<FilterState[K]>[number]) {
    const selected = (filters[key] ?? []) as Array<NonNullable<FilterState[K]>[number]>;
    const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
    setFilter(key, (next.length ? next : undefined) as FilterState[K]);
  }

  function clearAll() {
    setFilters({
      ...filters,
      intentClass: undefined,
      platforms: undefined,
      outcome: undefined,
      timeWindow: "Custom",
    });
  }

  return (
    <div className="sticky top-0 z-10 flex max-w-full items-center gap-3 overflow-x-auto border-b border-paper-rule/20 bg-background/85 px-4 py-3 backdrop-blur">
      <ChipGroup label="Intent">
        {INTENT_CHIPS.map((chip) => {
          const active = filters.intentClass?.includes(chip.value) ?? false;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => toggleArray("intentClass", chip.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-ticker-tight transition",
                active ? "border-transparent text-background" : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60",
              )}
              style={{
                backgroundColor: active ? chip.accent : undefined,
                borderStyle: chip.dotted ? "dotted" : undefined,
              }}
              aria-pressed={active}
            >
              {chip.label}
            </button>
          );
        })}
      </ChipGroup>

      <ChipGroup label="Platform">
        {PLATFORM_CHIPS.map((chip) => {
          const active = filters.platforms?.includes(chip.value) ?? false;
          const color = PLATFORM_COLORS[chip.value];
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => toggleArray("platforms", chip.value)}
              className={cn(
                "relative rounded-full border py-1 pl-3 pr-2.5 font-mono text-[11px] transition",
                active ? "border-white/20 text-foreground" : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60",
              )}
              style={{ backgroundColor: active ? `${color}40` : undefined }}
              aria-pressed={active}
            >
              <span className="absolute left-1.5 top-1/2 h-3.5 w-[3px] -translate-y-1/2 rounded-full" style={{ backgroundColor: color }} />
              {chip.label}
            </button>
          );
        })}
      </ChipGroup>

      <ChipGroup label="Outcome">
        {OUTCOME_CHIPS.map((chip) => {
          const active = filters.outcome?.includes(chip.value) ?? false;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => toggleArray("outcome", chip.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-ticker-tight transition",
                active ? chip.activeClass : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60",
              )}
              aria-pressed={active}
            >
              {chip.label}
            </button>
          );
        })}
      </ChipGroup>

      <ChipGroup label="Time">
        {TIME_CHIPS.map((chip) => {
          const active = filters.timeWindow === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilter("timeWindow", chip.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-ticker-tight transition",
                active ? "border-paper-rule bg-paper/15 text-paper" : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60",
              )}
              aria-pressed={active}
            >
              {chip.label}
            </button>
          );
        })}
      </ChipGroup>

      <button
        type="button"
        onClick={clearAll}
        className="ml-auto shrink-0 font-mono text-[11px] uppercase tracking-ticker-tight text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-l border-paper-rule/20 pl-3 first:border-l-0 first:pl-0">
      <span className="font-mono text-[10px] uppercase tracking-ticker text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

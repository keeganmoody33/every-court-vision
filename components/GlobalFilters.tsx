"use client";

import { Download, FileDown, SlidersHorizontal, Table2 } from "lucide-react";

import { useFilters } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  attributionModes,
  colorScales,
  coreSurfaces,
  entityFilters,
  scoringModes,
  timeWindows,
  viewModes,
  zoneModes,
} from "@/lib/constants";
import type { FilterState } from "@/lib/types";

function FilterSelect<K extends keyof FilterState>({
  label,
  valueKey,
  options,
}: {
  label: string;
  valueKey: K;
  options: string[];
}) {
  const { filters, setFilter } = useFilters();

  return (
    <label className="min-w-[132px] space-y-1">
      <span className="font-mono text-[9px] font-semibold uppercase tracking-ticker-tight text-muted-foreground tabular">{label}</span>
      <Select value={String(filters[valueKey])} onValueChange={(value) => setFilter(valueKey, value as FilterState[K])}>
        <SelectTrigger className="h-8 rounded-md border-white/10 bg-black/35 font-mono text-[11px] uppercase tracking-ticker-tight">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem value={option} key={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

export function GlobalFilters() {
  return (
    <div className="arcade-hud-panel px-3 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-arcade-cyan" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-ticker text-court-line tabular">
              Controls Deck
            </span>
            <span className="hidden rounded-full border border-white/10 bg-black/35 px-2 py-0.5 font-mono text-[9px] uppercase tracking-ticker-tight text-muted-foreground md:inline-flex">
              Edge HUD
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 2xl:flex 2xl:flex-wrap">
            <FilterSelect label="Time" valueKey="timeWindow" options={timeWindows} />
            <FilterSelect label="Entity" valueKey="entity" options={entityFilters} />
            <FilterSelect label="Surface" valueKey="surface" options={["All", ...coreSurfaces]} />
            <FilterSelect label="Scoring" valueKey="scoringMode" options={scoringModes} />
            <FilterSelect label="View" valueKey="viewMode" options={viewModes} />
            <FilterSelect label="Attribution" valueKey="attribution" options={attributionModes} />
            <FilterSelect label="Zone" valueKey="zoneMode" options={zoneModes} />
            <FilterSelect label="Color" valueKey="colorScale" options={colorScales} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Button variant="outline" size="sm" className="border-white/10 bg-black/30 font-mono uppercase tracking-ticker-tight">
            <Download /> <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 bg-black/30 font-mono uppercase tracking-ticker-tight">
            <Table2 /> <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 bg-black/30 font-mono uppercase tracking-ticker-tight">
            <FileDown /> <span className="hidden sm:inline">Card</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

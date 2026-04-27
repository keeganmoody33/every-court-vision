"use client";

import { Download, FileDown, Table2 } from "lucide-react";

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
    <label className="min-w-[150px] space-y-1">
      <span className="stat-label">{label}</span>
      <Select value={String(filters[valueKey])} onValueChange={(value) => setFilter(valueKey, value as FilterState[K])}>
        <SelectTrigger>
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
    <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:flex xl:flex-wrap">
        <FilterSelect label="Time" valueKey="timeWindow" options={timeWindows} />
        <FilterSelect label="Entity" valueKey="entity" options={entityFilters} />
        <FilterSelect label="Surface" valueKey="surface" options={["All", ...coreSurfaces]} />
        <FilterSelect label="Scoring" valueKey="scoringMode" options={scoringModes} />
        <FilterSelect label="View" valueKey="viewMode" options={viewModes} />
        <FilterSelect label="Attribution" valueKey="attribution" options={attributionModes} />
        <FilterSelect label="Zone" valueKey="zoneMode" options={zoneModes} />
        <FilterSelect label="Color" valueKey="colorScale" options={colorScales} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          <Download /> Download PDF
        </Button>
        <Button variant="outline" size="sm">
          <Table2 /> Export CSV
        </Button>
        <Button variant="outline" size="sm">
          <FileDown /> Export Player Card
        </Button>
      </div>
    </div>
  );
}

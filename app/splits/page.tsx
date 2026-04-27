"use client";

import { useState } from "react";

import { useFilters } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { SplitsTable } from "@/components/SplitsTable";
import { filterPosts, splitRows } from "@/lib/aggregations";
import { employeeById, posts } from "@/lib/mockData";

type Dimension = "platform" | "employee" | "archetype" | "contentType" | "campaign";

const dimensions: Dimension[] = ["platform", "employee", "archetype", "contentType", "campaign"];

export default function SplitsPage() {
  const { filters } = useFilters();
  const [dimension, setDimension] = useState<Dimension>("platform");
  const filtered = filterPosts(posts, filters);
  const rows = splitRows(filtered, dimension).map((row) => ({
    ...row,
    segment: dimension === "employee" ? employeeById[row.segment]?.name ?? row.segment : row.segment,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="stat-label">NBA-style Tables</p>
          <h2 className="text-2xl font-bold">Splits</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Split by platform, employee, archetype, content type, campaign, launch window, and time in future connector mode.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dimensions.map((item) => (
            <Button key={item} size="sm" variant={dimension === item ? "secondary" : "outline"} onClick={() => setDimension(item)}>
              {item}
            </Button>
          ))}
        </div>
      </div>
      <SplitsTable rows={rows} />
    </div>
  );
}

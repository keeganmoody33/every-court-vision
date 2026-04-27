"use client";

import { useState } from "react";

import { SplitsTable } from "@/components/SplitsTable";
import { Button } from "@/components/ui/button";
import { splitRows } from "@/lib/aggregations";
import type { Employee, Post } from "@/lib/types";

type Dimension = "platform" | "employee" | "archetype" | "contentType" | "campaign";

const dimensions: Dimension[] = ["platform", "employee", "archetype", "contentType", "campaign"];

export function SplitsView({ posts, employeeMap }: { posts: Post[]; employeeMap: Record<string, Employee> }) {
  const [dimension, setDimension] = useState<Dimension>("platform");
  const rows = splitRows(posts, dimension).map((row) => ({
    ...row,
    segment: dimension === "employee" ? employeeMap[row.segment]?.name ?? row.segment : row.segment,
  }));

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {dimensions.map((item) => (
          <Button key={item} size="sm" variant={dimension === item ? "secondary" : "outline"} onClick={() => setDimension(item)}>
            {item}
          </Button>
        ))}
      </div>
      <SplitsTable rows={rows} />
    </>
  );
}

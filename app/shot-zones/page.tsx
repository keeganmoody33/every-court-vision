"use client";

import { useFilters } from "@/components/AppShell";
import { ShotZones } from "@/components/ShotZones";
import { filterPosts } from "@/lib/aggregations";
import { posts } from "@/lib/mockData";

export default function ShotZonesPage() {
  const { filters } = useFilters();
  const filtered = filterPosts(posts, filters);

  return (
    <div className="space-y-6">
      <div>
        <p className="stat-label">Surface and Content Motion Groups</p>
        <h2 className="text-2xl font-bold">Shot Zones</h2>
      </div>
      <ShotZones posts={filtered} zoneMode={filters.zoneMode} />
    </div>
  );
}

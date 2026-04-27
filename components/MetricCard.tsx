import type { ComponentType } from "react";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon = ArrowUpRight,
  accent = "text-primary",
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="stat-label">{label}</p>
          <Icon className={cn("size-4", accent)} />
        </div>
        <p className="mt-3 text-3xl font-bold text-white">{value}</p>
        {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

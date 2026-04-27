import { Badge } from "@/components/ui/badge";
import { confidenceStyles } from "@/lib/constants";
import type { MetricConfidence } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AttributionBadge({ confidence }: { confidence: MetricConfidence }) {
  return (
    <Badge variant="outline" className={cn("border", confidenceStyles[confidence])}>
      {confidence}
    </Badge>
  );
}

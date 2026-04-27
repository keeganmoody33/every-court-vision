import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InsightCard({
  title,
  children,
  kicker,
}: {
  title: string;
  children: ReactNode;
  kicker?: string;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardHeader className="pb-3">
        {kicker ? <p className="stat-label">{kicker}</p> : null}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

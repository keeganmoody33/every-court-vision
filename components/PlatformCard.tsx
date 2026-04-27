import { ArrowUpRight, BriefcaseBusiness, Camera, Code2, Mail, Mic2, Play, Radio } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressLine } from "@/components/ProgressLine";
import { formatNumber } from "@/lib/formatters";
import type { Platform, PostMetrics } from "@/lib/types";

const platformCopy: Record<string, { role: string; icon: ComponentType<{ className?: string }>; accent: string }> = {
  X: { role: "Awareness, conversation, diffusion", icon: Radio, accent: "text-sky-300" },
  LinkedIn: { role: "B2B intent and consulting", icon: BriefcaseBusiness, accent: "text-blue-300" },
  Newsletter: { role: "Owned conversion and paid subs", icon: Mail, accent: "text-orange-300" },
  Instagram: { role: "Human affinity", icon: Camera, accent: "text-pink-300" },
  YouTube: { role: "Deep trust and long-tail conversion", icon: Play, accent: "text-red-300" },
  Podcast: { role: "Deep trust and long-tail conversion", icon: Mic2, accent: "text-violet-300" },
  GitHub: { role: "Technical credibility", icon: Code2, accent: "text-emerald-300" },
};

export function PlatformCard({
  platform,
  metrics,
  posts,
  socialTS,
  assistRate,
}: {
  platform: Platform;
  metrics: PostMetrics;
  posts: number;
  socialTS: number;
  assistRate: number;
}) {
  const meta = platformCopy[platform] ?? { role: "Surface intelligence", icon: ArrowUpRight, accent: "text-primary" };
  const Icon = meta.icon;

  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{platform}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{meta.role}</p>
          </div>
          <Icon className={`size-5 ${meta.accent}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Mini label="Posts" value={String(posts)} />
          <Mini label="Reach" value={formatNumber(metrics.reach)} />
          <Mini label="Clicks" value={formatNumber(metrics.clicks)} />
          <Mini label="Signups" value={formatNumber(metrics.signups)} />
        </div>
        <ProgressLine label="Social TS%" value={socialTS} />
        <ProgressLine label="Assist Rate" value={Math.min(100, assistRate)} tone="purple" />
      </CardContent>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-2">
      <p className="stat-label">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

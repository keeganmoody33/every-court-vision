"use client";

import { ArrowRight, CircleDot, ExternalLink } from "lucide-react";

import { AttributionBadge } from "@/components/AttributionBadge";
import { RippleGraph } from "@/components/RippleGraph";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { shotOutcome } from "@/lib/scoring";
import type { Employee, Play, Post, RippleEvent, ScoringMode } from "@/lib/types";
import { formatCurrency, formatNumber, formatShortDate } from "@/lib/formatters";

export function SidePanel({
  post,
  open,
  onOpenChange,
  scoringMode,
  employeeMap,
  playMap,
  rippleEvents,
}: {
  post?: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scoringMode: ScoringMode;
  employeeMap: Record<string, Employee>;
  playMap: Record<string, Play>;
  rippleEvents: RippleEvent[];
}) {
  const employee = post ? employeeMap[post.employeeId] : undefined;
  const play = post ? playMap[post.recommendedPlayId] : undefined;
  const events = post ? rippleEvents.filter((event) => event.rootPostId === post.id) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        {post ? (
          <>
            <SheetHeader>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <AttributionBadge confidence={post.confidence} />
                <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-muted-foreground">
                  {shotOutcome(post, scoringMode)}
                </span>
              </div>
              <SheetTitle>{post.platform} Film Clip</SheetTitle>
              <SheetDescription>{employee?.name} - {formatShortDate(post.timestamp)}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white">
                {post.text}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Mini label="Reach" value={formatNumber(post.metrics.reach)} />
                <Mini label="Clicks" value={formatNumber(post.metrics.clicks)} />
                <Mini label="Signups" value={formatNumber(post.metrics.signups)} />
                <Mini label="Paid Subs" value={formatNumber(post.metrics.paidSubscriptions)} />
                <Mini label="Consulting" value={formatNumber(post.metrics.consultingLeads)} />
                <Mini label="Revenue" value={formatCurrency(post.metrics.revenue)} />
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="stat-label">Classification</p>
                <div className="mt-3 grid gap-2 text-sm">
                  <Line label="Content type" value={post.contentType} />
                  <Line label="Zone" value={post.advancedZone} />
                  <Line label="Campaign" value={post.campaign} />
                  <Line label="CTA" value={post.ctaType} />
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CircleDot className="size-4 text-primary" />
                  <p className="font-semibold">Ripple Path</p>
                </div>
                <RippleGraph events={events.length ? events : rippleEvents.slice(0, 5)} compact />
              </div>

              {play ? (
                <div className="rounded-lg border border-orange-300/20 bg-orange-300/10 p-4">
                  <p className="stat-label">Recommended Play</p>
                  <h3 className="mt-1 font-semibold text-white">{play.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{play.recommendedNextExperiment}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-orange-200">
                    <ExternalLink className="size-3" />
                    {play.bestFor}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="stat-label">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-right text-white">
        <ArrowRight className="size-3 text-primary" />
        {value}
      </span>
    </div>
  );
}

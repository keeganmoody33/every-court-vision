"use client";

import { motion } from "framer-motion";

import { AttributionBadge } from "@/components/AttributionBadge";
import type { RippleEvent } from "@/lib/types";
import { formatDateTime, formatNumber } from "@/lib/formatters";

export function RippleGraph({ events, compact = false }: { events: RippleEvent[]; compact?: boolean }) {
  const width = compact ? 460 : 920;
  const height = compact ? 220 : 360;
  const step = width / Math.max(2, events.length);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className={compact ? "h-[220px] min-w-[460px] w-full" : "h-[360px] min-w-[760px] w-full"}>
        <defs>
          <marker id="arrow" markerHeight="8" markerWidth="8" orient="auto" refX="5" refY="3">
            <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.35)" />
          </marker>
        </defs>
        {events.map((event, index) => {
          if (index === 0) return null;
          const prevX = 42 + (index - 1) * step;
          const prevY = index % 2 ? height * 0.32 : height * 0.62;
          const x = 42 + index * step;
          const y = index % 2 ? height * 0.62 : height * 0.32;
          return (
            <path
              key={`${event.id}-edge`}
              d={`M ${prevX} ${prevY} C ${prevX + step / 2} ${prevY}, ${x - step / 2} ${y}, ${x} ${y}`}
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1.4"
              markerEnd="url(#arrow)"
            />
          );
        })}
        {events.map((event, index) => {
          const x = 42 + index * step;
          const y = index % 2 ? height * 0.32 : height * 0.62;
          return (
            <motion.g key={event.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.04 }}>
              <circle cx={x} cy={y} r={compact ? 17 : 22} fill="#0b1220" stroke="#3ee7d3" strokeWidth="1.5" filter="url(#softGlow)" />
              <text x={x} y={y + 4} textAnchor="middle" className="fill-white text-[10px] font-bold">
                {event.value ? formatNumber(event.value) : "ROOT"}
              </text>
              <foreignObject x={x - 70} y={y + (index % 2 ? -90 : 34)} width="140" height="72">
                <div className="rounded-md border border-white/10 bg-black/65 p-2 text-[10px] leading-4 text-white backdrop-blur">
                  <p className="font-semibold">{event.eventType}</p>
                  <p className="truncate text-muted-foreground">{event.actor}</p>
                  <p className="truncate text-muted-foreground">{formatDateTime(event.timestamp)}</p>
                </div>
              </foreignObject>
            </motion.g>
          );
        })}
      </svg>
      {!compact ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {events.slice(0, 5).map((event) => (
            <AttributionBadge key={event.id} confidence={event.confidence} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

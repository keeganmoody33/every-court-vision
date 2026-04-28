"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { groupPosts, sumMetrics } from "@/lib/aggregations";
import type { Employee, Post } from "@/lib/types";
import { formatNumber } from "@/lib/formatters";

export function OverviewCharts({ posts, employeeMap }: { posts: Post[]; employeeMap: Record<string, Employee> }) {
  const platformData = Object.entries(groupPosts(posts, (post) => post.platform)).map(([platform, group]) => {
    const metrics = sumMetrics(group);
    return {
      platform,
      reach: metrics.reach,
      signups: metrics.signups,
      paid: metrics.paidSubscriptions,
      consulting: metrics.consultingLeads,
      assists: metrics.assistedConversions,
    };
  });

  const employeeData = Object.entries(groupPosts(posts, (post) => post.employeeId)).map(([employeeId, group]) => {
    const metrics = sumMetrics(group);
    return {
      name: employeeMap[employeeId]?.name.split(" ")[0] ?? employeeId,
      Trust: group.reduce((sum, post) => sum + post.scores.trustGravity, 0) / group.length,
      "Social TS": group.reduce((sum, post) => sum + post.scores.socialTS, 0) / group.length,
      Assists: metrics.assistedConversions / 10,
    };
  });

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="glass-panel p-4">
        <div className="mb-4">
          <p className="stat-label">Surface Production</p>
          <h3 className="text-lg font-semibold">Reach to conversion flow</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 640, height: 320 }}>
            <AreaChart data={platformData}>
              <defs>
                <linearGradient id="signupFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#ff9d42" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#ff9d42" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="platform" tick={{ fill: "#9ca3af", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} tickFormatter={formatNumber} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#090d14", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="reach" stroke="#55a7ff" fill="rgba(85,167,255,0.12)" strokeWidth={2} />
              <Area type="monotone" dataKey="signups" stroke="#ff9d42" fill="url(#signupFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="mb-4">
          <p className="stat-label">Roster Intelligence</p>
          <h3 className="text-lg font-semibold">Trust, TS%, and assist profile</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 640, height: 320 }}>
            <BarChart data={employeeData}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#090d14", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
              <Bar dataKey="Trust" fill="#b78cff" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Social TS" fill="#3ee7d3" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Assists" fill="#ff9d42" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

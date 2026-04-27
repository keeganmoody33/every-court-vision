"use client";

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employee } from "@/lib/types";

const colors = ["#3ee7d3", "#ff9d42", "#b78cff", "#55a7ff", "#ff5a66"];

export function PlayerProfile({ employee }: { employee: Employee }) {
  const data = Object.entries(employee.shotDistribution).map(([name, value]) => ({ name, value }));

  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardHeader>
        <p className="stat-label">Shot Distribution</p>
        <CardTitle>{employee.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 320, height: 208 }}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#090d14", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              {item.name}: {item.value}%
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

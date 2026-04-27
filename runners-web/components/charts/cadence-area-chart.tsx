// runners-web/components/charts/cadence-area-chart.tsx
"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisResult } from "@/lib/types";

export function CadenceAreaChart({ results }: { results: AnalysisResult[] }) {
  const data = results
    .slice()
    .sort((a, b) => a.frame_index - b.frame_index)
    .map((r) => ({
      frame: r.frame_index,
      cadence: r.cadence_steps_per_min ?? null,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadência</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="cadenceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="frame" tick={{ fontSize: 11 }} label={{ value: "Frame", position: "insideBottom", offset: -4 }} />
            <YAxis tick={{ fontSize: 11 }} label={{ value: "spm", angle: -90, position: "insideLeft" }} />
            <Tooltip
              formatter={(v: number | string) => [`${Number(v).toFixed(1)} spm`, "Cadência"]}
              labelFormatter={(l) => `Frame ${l}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="cadence"
              name="Cadência"
              stroke="#16a34a"
              fill="url(#cadenceFill)"
              connectNulls
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

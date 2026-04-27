// runners-web/components/charts/gct-bar-chart.tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisResult } from "@/lib/types";

export function GctBarChart({ results }: { results: AnalysisResult[] }) {
  const data = results
    .filter((r) => r.ground_contact_time_s !== null && Number.isFinite(r.ground_contact_time_s))
    .slice()
    .sort((a, b) => a.frame_index - b.frame_index)
    .map((r) => ({
      frame: r.frame_index,
      gct_ms: (r.ground_contact_time_s as number) * 1000,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tempo de contacto (GCT)</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] w-full">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados de GCT por frame.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="frame" tick={{ fontSize: 11 }} label={{ value: "Frame", position: "insideBottom", offset: -4 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: "ms", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(v: number | string) => [`${Number(v).toFixed(0)} ms`, "GCT"]}
                labelFormatter={(l) => `Frame ${l}`}
              />
              <Legend />
              <Bar dataKey="gct_ms" name="GCT" fill="#3b82f6" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

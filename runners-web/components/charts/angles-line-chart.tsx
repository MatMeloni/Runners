// runners-web/components/charts/angles-line-chart.tsx
"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisResult } from "@/lib/types";

const COLORS = {
  knee_left: "#2563eb",
  knee_right: "#06b6d4",
  hip_left: "#9333ea",
  hip_right: "#7c3aed",
  trunk: "#f97316",
} as const;

type JointKey = keyof typeof COLORS;

function buildRows(results: AnalysisResult[]) {
  return results
    .slice()
    .sort((a, b) => a.frame_index - b.frame_index)
    .map((r) => ({
      frame: r.frame_index,
      knee_left: r.angles.knee_left,
      knee_right: r.angles.knee_right,
      hip_left: r.angles.hip_left,
      hip_right: r.angles.hip_right,
      trunk: r.angles.trunk,
    }));
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover p-3 text-xs shadow-md">
      <p className="mb-2 font-medium text-foreground">Frame {label}</p>
      <div className="grid gap-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-6 tabular-nums">
            <span className="text-muted-foreground">{p.dataKey}</span>
            <span style={{ color: p.color }}>{Number(p.value).toFixed(1)}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnglesLineChart({ results }: { results: AnalysisResult[] }) {
  const data = buildRows(results);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ângulos articulares</CardTitle>
      </CardHeader>
      <CardContent className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="frame" tick={{ fontSize: 11 }} label={{ value: "Frame", position: "insideBottom", offset: -4 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              domain={[0, "auto"]}
              label={{ value: "Graus (°)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* Zona ideal do ângulo do joelho no apoio */}
            <ReferenceArea
              y1={150}
              y2={175}
              fill="rgba(34,197,94,0.10)"
              label={{ value: "zona ideal joelho", position: "insideTopRight", fontSize: 10, fill: "#16a34a" }}
            />
            <ReferenceLine
              y={90}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              label={{ value: "90°", position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <ReferenceLine
              y={180}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              label={{ value: "180°", position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            {(Object.keys(COLORS) as JointKey[]).map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={COLORS[key]}
                dot={false}
                strokeWidth={2}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

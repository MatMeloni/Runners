// runners-web/components/charts/joint-radar-chart.tsx
"use client";

import { useMemo } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisAngles, AnalysisResult } from "@/lib/types";

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function JointRadarChart({ results }: { results: AnalysisResult[] }) {
  const data = useMemo(() => {
    const joints = [
      { key: "knee_left", label: "Joelho E" },
      { key: "knee_right", label: "Joelho D" },
      { key: "hip_left", label: "Anca E" },
      { key: "hip_right", label: "Anca D" },
      { key: "trunk", label: "Tronco" },
    ] as const;

    return joints.map((j) => {
      const vals: number[] = [];
      for (const r of results) {
        const v = r.angles[j.key as keyof AnalysisAngles];
        if (typeof v === "number" && Number.isFinite(v)) vals.push(v);
      }
      const m = mean(vals);
      return { joint: j.label, angle: m ?? 0, fullMark: 180 };
    });
  }, [results]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Radar — média angular</CardTitle>
      </CardHeader>
      <CardContent className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid className="stroke-muted" />
            <PolarAngleAxis dataKey="joint" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 180]} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number | string) => [`${Number(v).toFixed(1)}°`, "Média"]} />
            <Legend />
            <Radar name="Ângulo médio" dataKey="angle" stroke="#a855f7" fill="#a855f7" fillOpacity={0.35} isAnimationActive={false} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

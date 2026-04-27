// runners-web/components/metrics/angles-display.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAngle } from "@/lib/utils";

const ORDER = [
  { key: "knee_left", label: "Joelho esquerdo" },
  { key: "knee_right", label: "Joelho direito" },
  { key: "hip_left", label: "Anca esquerda" },
  { key: "hip_right", label: "Anca direita" },
  { key: "trunk", label: "Tronco" },
] as const;

export function AnglesDisplay({ angles }: { angles: Record<string, number> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ORDER.map((j) => {
        const v = angles[j.key];
        return (
          <Card key={j.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{j.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">{formatAngle(v)}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

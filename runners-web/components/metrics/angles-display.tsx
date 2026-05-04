// runners-web/components/metrics/angles-display.tsx
"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAngle } from "@/lib/utils";

const ORDER = [
  { key: "knee_left", label: "Joelho esquerdo" },
  { key: "knee_right", label: "Joelho direito" },
  { key: "hip_left", label: "Anca esquerda" },
  { key: "hip_right", label: "Anca direita" },
  { key: "trunk", label: "Tronco" },
] as const;

type JointKey = (typeof ORDER)[number]["key"];

interface AngleContext {
  label: string;
  ok: boolean | null;
  reference: string;
}

function getAngleContext(key: JointKey, value: number | undefined): AngleContext {
  if (value === undefined || !Number.isFinite(value)) {
    return { label: "—", ok: null, reference: "" };
  }

  switch (key) {
    case "knee_left":
    case "knee_right": {
      const ok = value >= 150 && value <= 175;
      return {
        label: ok ? "Ideal ✓" : value < 150 ? "Flexão excessiva ⚠" : "Extensão excessiva ⚠",
        ok,
        reference: "Ref: 150–175° no apoio",
      };
    }
    case "hip_left":
    case "hip_right": {
      const ok = value >= 160;
      return {
        label: ok ? "Flexão adequada ✓" : "Flexão insuficiente ⚠",
        ok,
        reference: "Ref: ≥ 160° indica boa mobilidade de quadril",
      };
    }
    case "trunk": {
      const ok = value <= 15;
      return {
        label: ok ? "Inclinação normal ✓" : "Inclinação excessiva ⚠",
        ok,
        reference: "Ref: ≤ 15° de inclinação frontal",
      };
    }
  }
}

export function AnglesDisplay({ angles }: { angles: Record<string, number> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ORDER.map((j) => {
        const v = angles[j.key];
        const ctx = getAngleContext(j.key, v);
        return (
          <Card key={j.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{j.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">{formatAngle(v)}</div>
              {ctx.ok !== null && (
                <p
                  className={cn(
                    "mt-1 text-xs font-medium",
                    ctx.ok ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400",
                  )}
                >
                  {ctx.label}
                </p>
              )}
            </CardContent>
            {ctx.reference && (
              <CardFooter className="text-xs text-muted-foreground">{ctx.reference}</CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  );
}

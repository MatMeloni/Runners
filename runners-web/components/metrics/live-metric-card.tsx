// runners-web/components/metrics/live-metric-card.tsx
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function LiveMetricCard({
  label,
  value,
  unit,
  footer,
}: {
  label: string;
  value: string;
  unit?: string;
  footer?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums tracking-tight">
          {value}
          {unit ? <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span> : null}
        </div>
      </CardContent>
      {footer ? <CardFooter className="text-xs text-muted-foreground">{footer}</CardFooter> : null}
    </Card>
  );
}

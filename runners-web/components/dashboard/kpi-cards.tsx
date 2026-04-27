// runners-web/components/dashboard/kpi-cards.tsx
"use client";

import { useQueries } from "@tanstack/react-query";
import { Activity, BarChart3, Timer, Video } from "lucide-react";
import { useMemo } from "react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionResults } from "@/lib/api";
import { queryKeys, useHealth, useSessions } from "@/lib/queries";

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function KpiCards() {
  const sessionsQ = useSessions("all");
  const healthQ = useHealth();

  const doneIds = useMemo(() => {
    const list = sessionsQ.data ?? [];
    return list.filter((s) => s.status === "done").slice(0, 20).map((s) => s.id);
  }, [sessionsQ.data]);

  const resultsQueries = useQueries({
    queries: doneIds.map((id) => ({
      queryKey: queryKeys.sessionResults(id),
      queryFn: () => getSessionResults(id),
      enabled: doneIds.length > 0 && !sessionsQ.isLoading,
    })),
  });

  const { avgCadence, avgGct } = useMemo(() => {
    const cadences: number[] = [];
    const gcts: number[] = [];
    for (const q of resultsQueries) {
      const rows = q.data ?? [];
      for (const r of rows) {
        if (r.cadence_steps_per_min !== null && Number.isFinite(r.cadence_steps_per_min)) {
          cadences.push(r.cadence_steps_per_min);
        }
        if (r.ground_contact_time_s !== null && Number.isFinite(r.ground_contact_time_s)) {
          gcts.push(r.ground_contact_time_s);
        }
      }
    }
    return { avgCadence: mean(cadences), avgGct: mean(gcts) };
  }, [resultsQueries]);

  const loading = sessionsQ.isLoading || (doneIds.length > 0 && resultsQueries.some((q) => q.isLoading));

  const total = sessionsQ.data?.length ?? 0;
  // Estado Supabase/BD comentado na UI: operacional se /health responder (modo câmara / sem BD).
  const apiOperational =
    Boolean(healthQ.data) &&
    (healthQ.data?.status === "ok" || healthQ.data?.status === "degraded");

  const cards = [
    {
      title: "Sessões totais",
      value: loading ? null : String(total),
      icon: Video,
      footer: "Todas as sessões registadas",
    },
    {
      title: "Cadência média",
      value: loading ? null : avgCadence === null ? "—" : `${avgCadence.toFixed(1)} spm`,
      icon: Activity,
      footer: "Média global (sessões concluídas)",
    },
    {
      title: "GCT médio",
      value: loading ? null : avgGct === null ? "—" : `${(avgGct * 1000).toFixed(0)} ms`,
      icon: Timer,
      footer: "Tempo de contacto com o solo",
    },
    {
      title: "Estado da API",
      value: loading ? null : apiOperational ? "Operacional" : "Indisponível",
      icon: BarChart3,
      footer: healthQ.data
        ? healthQ.data.status === "degraded"
          ? "Modo degradado (ex.: sem BD) — métricas ao vivo disponíveis"
          : "Serviço HTTP OK"
        : "A aguardar…",
    },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {c.value === null ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <div className="text-2xl font-semibold tabular-nums">{c.value}</div>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">{c.footer}</CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

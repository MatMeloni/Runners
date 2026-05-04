// runners-web/components/dashboard/kpi-cards.tsx
"use client";

import { useQueries } from "@tanstack/react-query";
import { Activity, Footprints, Timer, Video } from "lucide-react";
import { useMemo } from "react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionResults } from "@/lib/api";
import { queryKeys, useSessions } from "@/lib/queries";
import { cn } from "@/lib/utils";

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function HealthBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "ml-2 rounded-full px-2 py-0.5 text-xs font-medium",
        ok ? "bg-green-500/15 text-green-600" : "bg-yellow-500/15 text-yellow-600",
      )}
    >
      {ok ? "Bom" : "Atenção"}
    </span>
  );
}

export function KpiCards() {
  const sessionsQ = useSessions("all");

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

  const { avgCadence, avgGct, avgKnee } = useMemo(() => {
    const cadences: number[] = [];
    const gcts: number[] = [];
    const knees: number[] = [];
    for (const q of resultsQueries) {
      const rows = q.data ?? [];
      for (const r of rows) {
        if (r.cadence_steps_per_min !== null && Number.isFinite(r.cadence_steps_per_min)) {
          cadences.push(r.cadence_steps_per_min);
        }
        if (r.ground_contact_time_s !== null && Number.isFinite(r.ground_contact_time_s)) {
          gcts.push(r.ground_contact_time_s);
        }
        if (r.angles.knee_left !== undefined && Number.isFinite(r.angles.knee_left)) {
          knees.push(r.angles.knee_left);
        }
        if (r.angles.knee_right !== undefined && Number.isFinite(r.angles.knee_right)) {
          knees.push(r.angles.knee_right);
        }
      }
    }
    return {
      avgCadence: mean(cadences),
      avgGct: mean(gcts),
      avgKnee: mean(knees),
    };
  }, [resultsQueries]);

  const loading =
    sessionsQ.isLoading || (doneIds.length > 0 && resultsQueries.some((q) => q.isLoading));

  const total = sessionsQ.data?.length ?? 0;

  const cadenceOk = avgCadence !== null && avgCadence >= 160 && avgCadence <= 190;
  const gctMs = avgGct !== null ? avgGct * 1000 : null;
  const gctOk = gctMs !== null && gctMs < 250;
  const kneeOk = avgKnee !== null && avgKnee >= 150 && avgKnee <= 175;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* Sessões totais */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sessões totais</CardTitle>
          <Video className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="text-2xl font-semibold tabular-nums">{total}</div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">Todas as sessões registadas</CardFooter>
      </Card>

      {/* Cadência média */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cadência média</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="flex items-center text-2xl font-semibold tabular-nums">
              {avgCadence === null ? "—" : `${avgCadence.toFixed(1)} spm`}
              {avgCadence !== null && <HealthBadge ok={cadenceOk} />}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Ideal: 160–190 spm para corrida eficiente
        </CardFooter>
      </Card>

      {/* GCT médio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">GCT médio</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="flex items-center text-2xl font-semibold tabular-nums">
              {gctMs === null ? "—" : `${gctMs.toFixed(0)} ms`}
              {gctMs !== null && <HealthBadge ok={gctOk} />}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Ideal: abaixo de 250 ms indica passada eficiente
        </CardFooter>
      </Card>

      {/* Joelho médio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Joelho médio</CardTitle>
          <Footprints className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <div className="flex items-center text-2xl font-semibold tabular-nums">
              {avgKnee === null ? "—" : `${avgKnee.toFixed(1)}°`}
              {avgKnee !== null && <HealthBadge ok={kneeOk} />}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          {avgKnee !== null && kneeOk
            ? "Dentro do ideal (150–175° no apoio)"
            : "Referência: 150–175° no apoio"}
        </CardFooter>
      </Card>
    </div>
  );
}

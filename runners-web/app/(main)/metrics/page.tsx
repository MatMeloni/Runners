// runners-web/app/metrics/page.tsx
"use client";

import { useMemo } from "react";

import { AnglesDisplay } from "@/components/metrics/angles-display";
import {
  buildTips,
  HealthBadge,
  ImprovementTipsList,
} from "@/components/metrics/improvement-tips";
import { LiveMetricCard } from "@/components/metrics/live-metric-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetrics } from "@/lib/queries";

function formatUpdatedAt(ts: number) {
  try {
    return new Intl.DateTimeFormat("pt-PT", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(ts));
  } catch {
    return "—";
  }
}

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default function MetricsPage() {
  const metrics = useMetrics();

  const cadence = metrics.data?.cadence_steps_per_min;
  const gct = metrics.data?.ground_contact_time_s;
  const distance = metrics.data?.distance_m;
  const angles = metrics.data?.angles ?? {};

  const gctMs = gct != null ? gct * 1000 : null;
  const cadenceOk = cadence != null && cadence >= 160 && cadence <= 190;
  const gctOk = gctMs !== null && gctMs < 250;

  const avgKnee = useMemo(() => {
    const vals = [angles.knee_left, angles.knee_right].filter(
      (v): v is number => v !== undefined && Number.isFinite(v),
    );
    return mean(vals);
  }, [angles.knee_left, angles.knee_right]);

  const tips = useMemo(
    () => buildTips(avgKnee, cadence, gctMs),
    [avgKnee, cadence, gctMs],
  );

  const showInitialSkeleton = metrics.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Métricas</h1>
          <p className="text-sm text-muted-foreground">
            Médias agregadas da sua última sessão concluída (atualização a cada 3 segundos). Sem
            sessões concluídas, os valores aparecem vazios.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Última atualização:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {metrics.dataUpdatedAt ? formatUpdatedAt(metrics.dataUpdatedAt) : "—"}
            </span>
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void metrics.refetch()}
            disabled={metrics.isFetching}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {metrics.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível obter métricas</AlertTitle>
          <AlertDescription>
            Confirme que a API está a correr, que está autenticado, que{" "}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_API_URL</code> aponta para a API e
            que <code className="rounded bg-muted px-1">SUPABASE_JWT_SECRET</code> na API coincide
            com o JWT Secret do projeto Supabase. Verifique{" "}
            <code className="rounded bg-muted px-1">CORS_ORIGINS</code> na API (origem do Next com
            porta).
          </AlertDescription>
        </Alert>
      ) : null}

      {showInitialSkeleton ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Cadência */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cadência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-2xl font-semibold tabular-nums">
                  {cadence == null ? "—" : `${cadence.toFixed(1)} spm`}
                  {cadence != null && <HealthBadge ok={cadenceOk} />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ideal: 160–190 passos/min para corrida eficiente
                </p>
              </CardContent>
            </Card>

            {/* GCT */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">GCT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-2xl font-semibold tabular-nums">
                  {gctMs === null ? "—" : `${gctMs.toFixed(0)} ms`}
                  {gctMs !== null && <HealthBadge ok={gctOk} />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ideal: abaixo de 250 ms indica boa eficiência de passada
                </p>
              </CardContent>
            </Card>

            {/* Distância */}
            <LiveMetricCard
              label="Distância"
              value={distance == null ? "—" : distance.toFixed(2)}
              unit="m"
              footer="Estimada pela análise de vídeo (contagem de passadas)"
            />
          </div>

          {/* Dicas de melhoria com base nas métricas */}
          <ImprovementTipsList tips={tips} />
        </>
      )}

      <Separator />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Ângulos articulares</h2>
        {showInitialSkeleton ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <AnglesDisplay angles={angles} />
        )}
      </div>
    </div>
  );
}

// runners-web/app/metrics/page.tsx
"use client";

import { AnglesDisplay } from "@/components/metrics/angles-display";
import { LiveMetricCard } from "@/components/metrics/live-metric-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetrics } from "@/lib/queries";

function formatUpdatedAt(ts: number) {
  try {
    return new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "medium" }).format(new Date(ts));
  } catch {
    return "—";
  }
}

export default function MetricsPage() {
  const metrics = useMetrics();

  const cadence = metrics.data?.cadence_steps_per_min;
  const gct = metrics.data?.ground_contact_time_s;
  const distance = metrics.data?.distance_m;

  /** Só o primeiro carregamento sem dados — evita skeleton infinito quando a API falha (isError + data undefined). */
  const showInitialSkeleton = metrics.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Métricas</h1>
          <p className="text-sm text-muted-foreground">
            Médias agregadas da sua última sessão concluída (atualização a cada 3 segundos). Sem sessões concluídas, os
            valores aparecem vazios.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Última atualização:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {metrics.dataUpdatedAt ? formatUpdatedAt(metrics.dataUpdatedAt) : "—"}
            </span>
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={() => void metrics.refetch()} disabled={metrics.isFetching}>
            Atualizar
          </Button>
        </div>
      </div>

      {metrics.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível obter métricas</AlertTitle>
          <AlertDescription>
            Confirme que a API está a correr, que está autenticado, que <code className="rounded bg-muted px-1">NEXT_PUBLIC_API_URL</code>{" "}
            aponta para a API e que <code className="rounded bg-muted px-1">SUPABASE_JWT_SECRET</code> na API coincide com o JWT Secret do
            projeto Supabase. Verifique <code className="rounded bg-muted px-1">CORS_ORIGINS</code> na API (origem do Next com porta).
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
        <div className="grid gap-4 md:grid-cols-3">
          <LiveMetricCard
            label="Cadência"
            value={cadence === null || cadence === undefined ? "—" : cadence.toFixed(1)}
            unit="spm"
            footer="Ideal: 160–190 passos/min para corrida eficiente"
          />
          <LiveMetricCard
            label="GCT"
            value={gct === null || gct === undefined ? "—" : `${(gct * 1000).toFixed(0)}`}
            unit="ms"
            footer="Ideal: abaixo de 250 ms indica boa eficiência de passada"
          />
          <LiveMetricCard
            label="Distância"
            value={distance === null || distance === undefined ? "—" : distance.toFixed(2)}
            unit="m"
            footer="Estimada pela análise de vídeo (contagem de passadas)"
          />
        </div>
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
          <AnglesDisplay angles={metrics.data?.angles ?? {}} />
        )}
      </div>
    </div>
  );
}

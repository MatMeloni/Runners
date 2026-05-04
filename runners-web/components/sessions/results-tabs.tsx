// runners-web/components/sessions/results-tabs.tsx
"use client";

import { Download } from "lucide-react";
import { useMemo } from "react";

import { AnglesLineChart } from "@/components/charts/angles-line-chart";
import { CadenceAreaChart } from "@/components/charts/cadence-area-chart";
import { GctBarChart } from "@/components/charts/gct-bar-chart";
import { JointRadarChart } from "@/components/charts/joint-radar-chart";
import { LiveMetricCard } from "@/components/metrics/live-metric-card";
import { SessionStatusBadge } from "@/components/sessions/session-status-badge";
import { UploadProgress } from "@/components/sessions/upload-progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisResult } from "@/lib/types";
import { useSession, useSessionResults } from "@/lib/queries";
import { formatAngle } from "@/lib/utils";

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

type Tip = { title: string; problem: string; impact: string; action: string };

const TIPS = {
  kneeHigh: {
    title: "Joelho quase reto no apoio",
    problem: "Ângulo > 175° — extensão excessiva na fase de apoio.",
    impact: "Aumenta o impacto transmitido ao joelho e quadril.",
    action: "Mantenha uma leve flexão do joelho ao pousar. Tente não aterrar com a perna estendida.",
  },
  kneeLow: {
    title: "Joelho muito fletido no apoio",
    problem: "Ângulo < 150° — flexão excessiva ao tocar o solo.",
    impact: "Sobrecarrega o tendão patelar e a articulação do joelho.",
    action: "Encurte a passada e aumente a cadência. Pouse mais próximo do centro de gravidade.",
  },
  cadenceLow: {
    title: "Cadência abaixo do ideal",
    problem: "< 160 passos/min — passadas longas e lentas.",
    impact: "Maior impacto por passada e maior risco de lesão por sobrecarga.",
    action: "Dê passos mais curtos e rápidos. Use um metrônomo a 170 bpm como referência de treino.",
  },
  cadenceHigh: {
    title: "Cadência acima do ideal",
    problem: "> 200 passos/min — ritmo muito elevado.",
    impact: "Pode indicar passadas muito curtas ou sobrecarga muscular.",
    action: "Verifique o comprimento da passada. Reduza ligeiramente a frequência sem perder fluidez.",
  },
  gctHigh: {
    title: "Tempo de contato longo",
    problem: "> 250 ms no solo — fase de apoio prolongada.",
    impact: "Reduz a eficiência de corrida e aumenta a fadiga muscular.",
    action: "Foque em elevar o pé do chão rapidamente após o apoio. Imagine o solo como uma superfície quente.",
  },
} satisfies Record<string, Tip>;

function ImprovementTip({ title, problem, impact, action }: Tip) {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50/60 p-4 dark:border-yellow-900/40 dark:bg-yellow-950/20">
      <p className="mb-1 text-sm font-semibold text-yellow-800 dark:text-yellow-300">{title}</p>
      <p className="text-xs text-muted-foreground">
        {problem} {impact}
      </p>
      <p className="mt-2 text-xs font-medium text-foreground">
        <span className="text-yellow-700 dark:text-yellow-400">Dica: </span>
        {action}
      </p>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function downloadCsv(filename: string, rows: string[][]) {
  const escape = (cell: string) => `"${cell.replaceAll('"', '""')}"`;
  const body = rows.map((r) => r.map((c) => escape(String(c))).join(",")).join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function resultsToCsvRows(results: AnalysisResult[]) {
  const header = [
    "frame",
    "time_s",
    "knee_left",
    "knee_right",
    "hip_left",
    "hip_right",
    "trunk",
    "gct_s",
    "cadence_spm",
  ];
  const sorted = results.slice().sort((a, b) => a.frame_index - b.frame_index);
  const dataRows = sorted.map((r) => [
    String(r.frame_index),
    r.timestamp_s === null ? "" : String(r.timestamp_s),
    r.angles.knee_left === undefined ? "" : String(r.angles.knee_left),
    r.angles.knee_right === undefined ? "" : String(r.angles.knee_right),
    r.angles.hip_left === undefined ? "" : String(r.angles.hip_left),
    r.angles.hip_right === undefined ? "" : String(r.angles.hip_right),
    r.angles.trunk === undefined ? "" : String(r.angles.trunk),
    r.ground_contact_time_s === null ? "" : String(r.ground_contact_time_s),
    r.cadence_steps_per_min === null ? "" : String(r.cadence_steps_per_min),
  ]);
  return [header, ...dataRows];
}

export function ResultsTabs({ sessionId }: { sessionId: number }) {
  const sessionQ = useSession(sessionId);
  const session = sessionQ.data;
  const resultsQ = useSessionResults(sessionId, session?.status === "done");

  const summary = useMemo(() => {
    const rows = resultsQ.data ?? [];
    const cad = rows.map((r) => r.cadence_steps_per_min).filter((v): v is number => v !== null && Number.isFinite(v));
    const gct = rows.map((r) => r.ground_contact_time_s).filter((v): v is number => v !== null && Number.isFinite(v));
    const dist = rows.map((r) => r.distance_m).filter((v): v is number => v !== null && Number.isFinite(v));
    const knees = rows
      .flatMap((r) => [r.angles.knee_left, r.angles.knee_right])
      .filter((v): v is number => v !== undefined && Number.isFinite(v));
    return {
      cadence: mean(cad),
      gct: mean(gct),
      distance: mean(dist),
      avgKnee: mean(knees),
    };
  }, [resultsQ.data]);

  const onExport = () => {
    const rows = resultsToCsvRows(resultsQ.data ?? []);
    downloadCsv(`session-${sessionId}-results.csv`, rows);
  };

  if (!session) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const processing = session.status === "pending" || session.status === "processing";

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className={session.status === "done" ? "grid w-full grid-cols-3 lg:w-auto" : "w-full"}>
        <TabsTrigger value="overview">Resumo</TabsTrigger>
        {session.status === "done" ? (
          <>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="raw">Dados brutos</TabsTrigger>
          </>
        ) : null}
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              Metadados
              <SessionStatusBadge status={session.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Nome</p>
              <p className="font-medium">{session.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Origem</p>
              <p className="font-medium">{session.source ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Criada em</p>
              <p className="font-medium tabular-nums">{formatDate(session.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vídeo</p>
              <p className="break-all font-medium">{session.video_path ?? "—"}</p>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">ID da sessão: {session.id}</CardFooter>
        </Card>

        {processing ? <UploadProgress sessionId={sessionId} active={processing} /> : null}

        {session.status === "failed" && session.error_msg ? (
          <Alert variant="destructive">
            <AlertTitle>Erro no processamento</AlertTitle>
            <AlertDescription>{session.error_msg}</AlertDescription>
          </Alert>
        ) : null}

        {session.status === "done" ? (
          <>
            <Separator />
            {/* Bloco de diagnóstico automático */}
            {(() => {
              const cadenceOk = summary.cadence !== null && summary.cadence >= 160 && summary.cadence <= 190;
              const gctMs = summary.gct !== null ? summary.gct * 1000 : null;
              const gctOk = gctMs !== null && gctMs < 250;
              const hasSummary = summary.cadence !== null || gctMs !== null;
              if (!hasSummary) return null;
              const allOk = cadenceOk && gctOk;
              return (
                <Alert variant={allOk ? "default" : "destructive"}>
                  <AlertTitle>Diagnóstico da corrida</AlertTitle>
                  <AlertDescription className="space-y-1">
                    {summary.cadence !== null && (
                      <p>
                        Cadência {cadenceOk ? "dentro do ideal ✓" : "fora do ideal ⚠"} ({summary.cadence.toFixed(1)} spm — referência: 160–190).
                      </p>
                    )}
                    {gctMs !== null && (
                      <p>
                        Tempo de contato com o solo {gctOk ? "eficiente ✓" : "acima do ideal ⚠"} ({gctMs.toFixed(0)} ms — referência: abaixo de 250 ms).
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              );
            })()}
            <div className="grid gap-4 md:grid-cols-3">
              <LiveMetricCard
                label="Cadência média"
                value={summary.cadence === null ? "—" : summary.cadence.toFixed(1)}
                unit="spm"
                footer="Ideal: 160–190 spm"
              />
              <LiveMetricCard
                label="GCT médio"
                value={summary.gct === null ? "—" : `${(summary.gct * 1000).toFixed(0)}`}
                unit="ms"
                footer="Ideal: abaixo de 250 ms"
              />
              <LiveMetricCard
                label="Distância média"
                value={summary.distance === null ? "—" : summary.distance.toFixed(2)}
                unit="m"
                footer="Estimativa por passadas"
              />
            </div>

            {/* Dicas de Melhoria — derivadas das métricas fora do ideal */}
            {(() => {
              const gctMs = summary.gct !== null ? summary.gct * 1000 : null;
              const tips: Tip[] = [];
              if (summary.avgKnee !== null && summary.avgKnee > 175) tips.push(TIPS.kneeHigh);
              if (summary.avgKnee !== null && summary.avgKnee < 150) tips.push(TIPS.kneeLow);
              if (summary.cadence !== null && summary.cadence < 160) tips.push(TIPS.cadenceLow);
              if (summary.cadence !== null && summary.cadence > 200) tips.push(TIPS.cadenceHigh);
              if (gctMs !== null && gctMs > 250) tips.push(TIPS.gctHigh);
              if (tips.length === 0) return null;
              return (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Dicas de melhoria</p>
                  {tips.map((tip) => (
                    <ImprovementTip key={tip.title} {...tip} />
                  ))}
                </div>
              );
            })()}
          </>
        ) : null}
      </TabsContent>

      {session.status === "done" ? (
        <TabsContent value="charts" className="space-y-4">
          {resultsQ.isLoading ? (
            <Skeleton className="h-[360px] w-full" />
          ) : (
            <>
              <AnglesLineChart results={resultsQ.data ?? []} />
              <div className="grid gap-4 xl:grid-cols-2">
                <CadenceAreaChart results={resultsQ.data ?? []} />
                <GctBarChart results={resultsQ.data ?? []} />
              </div>
              <JointRadarChart results={resultsQ.data ?? []} />
            </>
          )}
        </TabsContent>
      ) : null}

      {session.status === "done" ? (
        <TabsContent value="raw" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Tabela completa por frame.</p>
            <Button type="button" variant="secondary" onClick={onExport} disabled={!resultsQ.data?.length}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
          <ScrollArea className="h-[480px] rounded-md border">
            {resultsQ.isLoading ? (
              <div className="p-4">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Frame</TableHead>
                    <TableHead>Tempo (s)</TableHead>
                    <TableHead>Joelho E</TableHead>
                    <TableHead>Joelho D</TableHead>
                    <TableHead>Anca E</TableHead>
                    <TableHead>Anca D</TableHead>
                    <TableHead>Tronco</TableHead>
                    <TableHead>GCT</TableHead>
                    <TableHead>Cadência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(resultsQ.data ?? [])
                    .slice()
                    .sort((a, b) => a.frame_index - b.frame_index)
                    .map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="tabular-nums">{r.frame_index}</TableCell>
                        <TableCell className="tabular-nums">{r.timestamp_s?.toFixed(3) ?? "—"}</TableCell>
                        <TableCell className="tabular-nums">{formatAngle(r.angles.knee_left)}</TableCell>
                        <TableCell className="tabular-nums">{formatAngle(r.angles.knee_right)}</TableCell>
                        <TableCell className="tabular-nums">{formatAngle(r.angles.hip_left)}</TableCell>
                        <TableCell className="tabular-nums">{formatAngle(r.angles.hip_right)}</TableCell>
                        <TableCell className="tabular-nums">{formatAngle(r.angles.trunk)}</TableCell>
                        <TableCell className="tabular-nums">
                          {r.ground_contact_time_s === null ? "—" : `${(r.ground_contact_time_s * 1000).toFixed(0)} ms`}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {r.cadence_steps_per_min === null ? "—" : `${r.cadence_steps_per_min.toFixed(1)} spm`}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </TabsContent>
      ) : null}
    </Tabs>
  );
}

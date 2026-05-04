// runners-web/components/sessions/comparison-summary.tsx
"use client";

import { useMemo } from "react";

import {
  buildTips,
  ImprovementTipsList,
} from "@/components/metrics/improvement-tips";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession, useSessionResults } from "@/lib/queries";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pct(a: number, b: number) {
  if (b === 0) return 0;
  return ((a - b) / Math.abs(b)) * 100;
}

// ---------------------------------------------------------------------------
// Delta cell
// ---------------------------------------------------------------------------

interface DeltaInfo {
  value: number;
  unit: string;
  /** true = higher B is better, false = lower B is better */
  higherIsBetter: boolean;
}

function DeltaCell({ value, unit, higherIsBetter }: DeltaInfo) {
  const better = higherIsBetter ? value > 0 : value < 0;
  const neutral = Math.abs(value) < 0.5;

  if (neutral) {
    return <span className="text-muted-foreground">≈ 0 {unit}</span>;
  }

  return (
    <span
      className={cn(
        "font-medium",
        neutral
          ? "text-muted-foreground"
          : better
            ? "text-green-600 dark:text-green-400"
            : "text-red-500 dark:text-red-400",
      )}
    >
      {value > 0 ? "+" : ""}
      {value.toFixed(1)} {unit} {better ? "↑" : "↓"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Narrative conclusion
// ---------------------------------------------------------------------------

function buildNarrative(
  cadA: number | null,
  cadB: number | null,
  gctMsA: number | null,
  gctMsB: number | null,
  kneeA: number | null,
  kneeB: number | null,
): string {
  const parts: string[] = [];
  let improvements = 0;
  let regressions = 0;

  if (cadA !== null && cadB !== null) {
    const delta = cadB - cadA;
    const bOk = cadB >= 160 && cadB <= 190;
    if (Math.abs(delta) >= 1) {
      const dir = delta > 0 ? "maior" : "menor";
      const ctx = bOk ? " (dentro do ideal)" : "";
      parts.push(`cadência ${Math.abs(delta).toFixed(1)} spm ${dir}${ctx}`);
      if (delta > 0 && !bOk && cadB < 160) regressions++;
      else if (delta > 0) improvements++;
      else regressions++;
    }
  }

  if (gctMsA !== null && gctMsB !== null) {
    const delta = gctMsB - gctMsA;
    const bOk = gctMsB < 250;
    if (Math.abs(delta) >= 5) {
      const dir = delta < 0 ? "menor" : "maior";
      const ctx = bOk ? " (eficiente)" : " (acima do ideal)";
      parts.push(`GCT ${Math.abs(delta).toFixed(0)} ms ${dir}${ctx}`);
      if (delta < 0) improvements++;
      else regressions++;
    }
  }

  if (kneeA !== null && kneeB !== null) {
    const delta = kneeB - kneeA;
    const bOk = kneeB >= 150 && kneeB <= 175;
    const aOk = kneeA >= 150 && kneeA <= 175;
    if (Math.abs(delta) >= 1) {
      const closer =
        !aOk && bOk
          ? " (entrou na zona ideal)"
          : bOk
            ? " (mantém zona ideal)"
            : "";
      parts.push(`joelho médio ${Math.abs(delta).toFixed(1)}° ${delta > 0 ? "maior" : "menor"}${closer}`);
      if (bOk && !aOk) improvements++;
      else if (bOk && aOk) improvements++;
      else regressions++;
    }
  }

  if (parts.length === 0) {
    return "Dados insuficientes para comparação detalhada entre os dois treinos.";
  }

  const intro = "Treino B apresentou ";
  const body = parts.join(", ");
  const total = improvements + regressions;
  let conclusion = "";
  if (total > 0) {
    if (improvements === total) conclusion = ` Evolução positiva nas ${total} métrica${total > 1 ? "s" : ""} analisada${total > 1 ? "s" : ""}.`;
    else if (regressions === total) conclusion = ` Regressão nas ${total} métrica${total > 1 ? "s" : ""} — reveja o treino.`;
    else conclusion = ` ${improvements} melhoria${improvements > 1 ? "s" : ""} e ${regressions} ponto${regressions > 1 ? "s" : ""} de atenção.`;
  }

  return `${intro}${body}.${conclusion}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ComparisonSummary({
  sessionIdA,
  sessionIdB,
}: {
  sessionIdA: number;
  sessionIdB: number;
}) {
  const sessionAQ = useSession(sessionIdA);
  const sessionBQ = useSession(sessionIdB);
  const resultsAQ = useSessionResults(sessionIdA, sessionAQ.data?.status === "done");
  const resultsBQ = useSessionResults(sessionIdB, sessionBQ.data?.status === "done");

  const loading = resultsAQ.isLoading || resultsBQ.isLoading;

  const stats = useMemo(() => {
    const rowsA = resultsAQ.data ?? [];
    const rowsB = resultsBQ.data ?? [];

    const cadA = mean(rowsA.map((r) => r.cadence_steps_per_min).filter((v): v is number => v !== null && isFinite(v)));
    const cadB = mean(rowsB.map((r) => r.cadence_steps_per_min).filter((v): v is number => v !== null && isFinite(v)));

    const gctA = mean(rowsA.map((r) => r.ground_contact_time_s).filter((v): v is number => v !== null && isFinite(v)));
    const gctB = mean(rowsB.map((r) => r.ground_contact_time_s).filter((v): v is number => v !== null && isFinite(v)));
    const gctMsA = gctA !== null ? gctA * 1000 : null;
    const gctMsB = gctB !== null ? gctB * 1000 : null;

    const kneesA = rowsA.flatMap((r) => [r.angles.knee_left, r.angles.knee_right]).filter((v): v is number => v !== undefined && isFinite(v));
    const kneesB = rowsB.flatMap((r) => [r.angles.knee_left, r.angles.knee_right]).filter((v): v is number => v !== undefined && isFinite(v));
    const kneeA = mean(kneesA);
    const kneeB = mean(kneesB);

    return { cadA, cadB, gctMsA, gctMsB, kneeA, kneeB };
  }, [resultsAQ.data, resultsBQ.data]);

  const narrative = useMemo(
    () =>
      buildNarrative(
        stats.cadA,
        stats.cadB,
        stats.gctMsA,
        stats.gctMsB,
        stats.kneeA,
        stats.kneeB,
      ),
    [stats],
  );

  const tipsB = useMemo(
    () => buildTips(stats.kneeB, stats.cadB, stats.gctMsB),
    [stats],
  );

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const hasData =
    stats.cadA !== null ||
    stats.cadB !== null ||
    stats.gctMsA !== null ||
    stats.gctMsB !== null;

  if (!hasData) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Análise comparativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Delta table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Métrica</th>
                  <th className="pb-2 pr-4 font-medium">
                    Treino A
                    {sessionAQ.data?.name ? ` — ${sessionAQ.data.name}` : ""}
                  </th>
                  <th className="pb-2 pr-4 font-medium">
                    Treino B
                    {sessionBQ.data?.name ? ` — ${sessionBQ.data.name}` : ""}
                  </th>
                  <th className="pb-2 font-medium">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.cadA !== null || stats.cadB !== null ? (
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">Cadência</td>
                    <td className="py-2 pr-4 tabular-nums">
                      {stats.cadA !== null ? `${stats.cadA.toFixed(1)} spm` : "—"}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {stats.cadB !== null ? `${stats.cadB.toFixed(1)} spm` : "—"}
                    </td>
                    <td className="py-2">
                      {stats.cadA !== null && stats.cadB !== null ? (
                        <DeltaCell
                          value={stats.cadB - stats.cadA}
                          unit="spm"
                          higherIsBetter={true}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ) : null}

                {stats.gctMsA !== null || stats.gctMsB !== null ? (
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">GCT</td>
                    <td className="py-2 pr-4 tabular-nums">
                      {stats.gctMsA !== null ? `${stats.gctMsA.toFixed(0)} ms` : "—"}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {stats.gctMsB !== null ? `${stats.gctMsB.toFixed(0)} ms` : "—"}
                    </td>
                    <td className="py-2">
                      {stats.gctMsA !== null && stats.gctMsB !== null ? (
                        <DeltaCell
                          value={stats.gctMsB - stats.gctMsA}
                          unit="ms"
                          higherIsBetter={false}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ) : null}

                {stats.kneeA !== null || stats.kneeB !== null ? (
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">Joelho médio</td>
                    <td className="py-2 pr-4 tabular-nums">
                      {stats.kneeA !== null ? `${stats.kneeA.toFixed(1)}°` : "—"}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {stats.kneeB !== null ? `${stats.kneeB.toFixed(1)}°` : "—"}
                    </td>
                    <td className="py-2">
                      {stats.kneeA !== null && stats.kneeB !== null ? (
                        <DeltaCell
                          value={stats.kneeB - stats.kneeA}
                          unit="°"
                          higherIsBetter={
                            stats.kneeA < 150
                              ? true
                              : stats.kneeA > 175
                                ? false
                                : stats.kneeB >= 150 && stats.kneeB <= 175
                          }
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Narrative conclusion */}
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground">
            {narrative}
          </p>
        </CardContent>
      </Card>

      {/* Tips based on session B (most recent / second selected) */}
      {tipsB.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Pontos a trabalhar no próximo treino (com base no Treino B)
          </p>
          <ImprovementTipsList tips={tipsB} />
        </div>
      )}
    </div>
  );
}

"use client";

import { AnglesLineChart } from "@/components/charts/angles-line-chart";
import { CadenceAreaChart } from "@/components/charts/cadence-area-chart";
import { GctBarChart } from "@/components/charts/gct-bar-chart";
import { JointRadarChart } from "@/components/charts/joint-radar-chart";
import { SessionStatusBadge } from "@/components/sessions/session-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession, useSessionResults } from "@/lib/queries";

export function SessionChartsPanel({ sessionId, label }: { sessionId: number; label: string }) {
  const sessionQ = useSession(sessionId);
  const session = sessionQ.data;
  const resultsQ = useSessionResults(sessionId, session?.status === "done");

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (session.status !== "done") {
    return (
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-2 space-y-0">
          <CardTitle className="text-base">{label}</CardTitle>
          <SessionStatusBadge status={session.status} />
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Sessão ainda não concluída</AlertTitle>
            <AlertDescription>
              Só é possível comparar sessões com estado &quot;concluída&quot;. ID #{sessionId}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
        <p className="text-xs text-muted-foreground">Sessão #{sessionId}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {resultsQ.isLoading ? (
          <Skeleton className="h-[320px] w-full" />
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
      </CardContent>
    </Card>
  );
}

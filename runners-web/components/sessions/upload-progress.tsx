// runners-web/components/sessions/upload-progress.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSessionPolling } from "@/hooks/use-session-polling";

export function UploadProgress({ sessionId, active }: { sessionId: number; active: boolean }) {
  const { resultsCount, isPolling, error } = useSessionPolling(sessionId, active);

  const pct = Math.min(95, Math.max(8, resultsCount > 0 ? Math.log10(resultsCount + 1) * 25 : 12));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Processamento</CardTitle>
        {isPolling ? (
          <Badge variant="outline" className="border-blue-500/60 text-blue-500">
            A analisar…
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} className={isPolling ? "animate-pulse" : undefined} />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{resultsCount}</span> frames processados
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        O estado é atualizado automaticamente a cada 2 segundos.
      </CardFooter>
    </Card>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionVideoUrl } from "@/lib/api";
import { useSessions, useSessionResults } from "@/lib/queries";
import type { AnalysisAngles, AnalysisResult } from "@/lib/types";

function AngleRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-black/60 px-2.5 py-1 backdrop-blur-sm">
      <span className="text-xs text-white/70">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-white">{value.toFixed(1)}°</span>
    </div>
  );
}

function findClosestFrame(results: AnalysisResult[], currentTime: number): AnalysisAngles | null {
  if (results.length === 0) return null;

  let lo = 0;
  let hi = results.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const ts = results[mid].timestamp_s ?? 0;
    if (ts < currentTime) lo = mid + 1;
    else hi = mid;
  }
  // Pick the closer of lo and lo-1
  if (lo > 0) {
    const prev = results[lo - 1].timestamp_s ?? 0;
    const curr = results[lo].timestamp_s ?? 0;
    const chosen = Math.abs(prev - currentTime) <= Math.abs(curr - currentTime) ? lo - 1 : lo;
    return results[chosen].angles;
  }
  return results[lo].angles;
}

export function SessionDemoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [angles, setAngles] = useState<AnalysisAngles | null>(null);

  const sessionsQ = useSessions("all");
  const doneSessions = useMemo(
    () => (sessionsQ.data ?? []).filter((s) => s.status === "done"),
    [sessionsQ.data],
  );

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeId = selectedId ?? doneSessions[0]?.id ?? null;

  const resultsQ = useSessionResults(activeId ?? 0, activeId !== null);

  const sortedResults = useMemo(() => {
    if (!resultsQ.data) return [];
    return [...resultsQ.data].sort((a, b) => (a.timestamp_s ?? 0) - (b.timestamp_s ?? 0));
  }, [resultsQ.data]);

  const hasAngles =
    angles !== null && Object.values(angles).some((v) => v !== undefined);

  if (sessionsQ.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Demonstração de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (doneSessions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Demonstração de Análise</CardTitle>
        </div>
        {doneSessions.length > 1 && (
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
            value={activeId ?? ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
          >
            {doneSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name ?? `Sessão #${s.id}`}
              </option>
            ))}
          </select>
        )}
      </CardHeader>
      <CardContent className="p-0 pb-4 px-4">
        <div
          className="relative overflow-hidden rounded-xl border border-muted-foreground/20 bg-black"
          style={{ aspectRatio: "16/9", maxHeight: "400px" }}
        >
          {activeId !== null && (
            <video
              ref={videoRef}
              key={activeId}
              className="h-full w-full object-contain"
              src={getSessionVideoUrl(activeId)}
              autoPlay
              loop
              muted
              playsInline
              onTimeUpdate={() => {
                const vid = videoRef.current;
                if (!vid || sortedResults.length === 0) return;
                const frame = findClosestFrame(sortedResults, vid.currentTime);
                setAngles(frame);
              }}
            />
          )}

          {/* Angle overlay — top-right */}
          {hasAngles && angles && (
            <div className="absolute right-3 top-3 flex flex-col gap-1 min-w-[140px]">
              {angles.knee_left !== undefined && (
                <AngleRow label="Joelho Esq." value={angles.knee_left} />
              )}
              {angles.knee_right !== undefined && (
                <AngleRow label="Joelho Dir." value={angles.knee_right} />
              )}
              {angles.hip_left !== undefined && (
                <AngleRow label="Quadril Esq." value={angles.hip_left} />
              )}
              {angles.hip_right !== undefined && (
                <AngleRow label="Quadril Dir." value={angles.hip_right} />
              )}
              {angles.trunk !== undefined && (
                <AngleRow label="Tronco" value={angles.trunk} />
              )}
            </div>
          )}

          {/* Loading overlay while fetching results */}
          {resultsQ.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <span className="text-xs text-muted-foreground">Carregando análise...</span>
            </div>
          )}

          {/* Label bottom-left */}
          <div className="absolute bottom-2 left-3">
            <span className="rounded bg-black/50 px-2 py-0.5 text-xs text-white/60 backdrop-blur-sm">
              {doneSessions.find((s) => s.id === activeId)?.name ?? `Sessão #${activeId}`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionVideoUrl } from "@/lib/api";
import { useSessions, useSessionResults } from "@/lib/queries";
import type { AnalysisAngles, AnalysisResult, PoseLandmark } from "@/lib/types";

// MediaPipe Pose connections (landmark index pairs) — same as live-camera
const POSE_CONNECTIONS: [number, number][] = [
  [9, 10],
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

// Calculates the actual rendered video rect inside a container using object-contain rules.
function getVideoRenderRect(
  containerW: number,
  containerH: number,
  videoW: number,
  videoH: number,
): { x: number; y: number; w: number; h: number } {
  if (videoW === 0 || videoH === 0) return { x: 0, y: 0, w: containerW, h: containerH };
  const containerAspect = containerW / containerH;
  const videoAspect = videoW / videoH;
  let w: number;
  let h: number;
  if (videoAspect < containerAspect) {
    // Portrait video in landscape container — pillar-boxed (black bars on sides)
    h = containerH;
    w = h * videoAspect;
  } else {
    // Landscape video in portrait container — letter-boxed (black bars top/bottom)
    w = containerW;
    h = w / videoAspect;
  }
  return { x: (containerW - w) / 2, y: (containerH - h) / 2, w, h };
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  containerW: number,
  containerH: number,
  videoW: number,
  videoH: number,
) {
  ctx.clearRect(0, 0, containerW, containerH);
  const { x: ox, y: oy, w, h } = getVideoRenderRect(containerW, containerH, videoW, videoH);

  ctx.lineWidth = 2;
  for (const [a, b] of POSE_CONNECTIONS) {
    const lmA = landmarks[a];
    const lmB = landmarks[b];
    if (!lmA || !lmB) continue;
    if (lmA.visibility < 0.3 || lmB.visibility < 0.3) continue;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0, 220, 130, ${Math.min(lmA.visibility, lmB.visibility).toFixed(2)})`;
    ctx.moveTo(lmA.x * w + ox, lmA.y * h + oy);
    ctx.lineTo(lmB.x * w + ox, lmB.y * h + oy);
    ctx.stroke();
  }

  for (const lm of landmarks) {
    if (lm.visibility < 0.3) continue;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${lm.visibility.toFixed(2)})`;
    ctx.arc(lm.x * w + ox, lm.y * h + oy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function AngleRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-black/60 px-2.5 py-1 backdrop-blur-sm">
      <span className="text-xs text-white/70">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-white">{value.toFixed(1)}°</span>
    </div>
  );
}

function findClosestFrame(results: AnalysisResult[], currentTime: number): AnalysisResult | null {
  if (results.length === 0) return null;

  let lo = 0;
  let hi = results.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const ts = results[mid].timestamp_s ?? 0;
    if (ts < currentTime) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0) {
    const prev = results[lo - 1].timestamp_s ?? 0;
    const curr = results[lo].timestamp_s ?? 0;
    const chosen = Math.abs(prev - currentTime) <= Math.abs(curr - currentTime) ? lo - 1 : lo;
    return results[chosen];
  }
  return results[lo];
}

export function SessionDemoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement>(null);
  const [angles, setAngles] = useState<AnalysisAngles | null>(null);

  const sessionsQ = useSessions("all");
  const doneSessions = useMemo(
    () => (sessionsQ.data ?? []).filter((s) => s.status === "done"),
    [sessionsQ.data],
  );

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeId = selectedId ?? doneSessions[0]?.id ?? null;

  // Fetch video via JS (with ngrok bypass header) and expose as blob URL
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  useEffect(() => {
    if (!activeId) return;
    let objectUrl: string | null = null;
    setVideoLoading(true);
    setVideoBlobUrl(null);
    setAngles(null);
    // Clear skeleton canvas when switching sessions
    const overlay = skeletonCanvasRef.current;
    if (overlay) {
      const ctx = overlay.getContext("2d");
      ctx?.clearRect(0, 0, overlay.width, overlay.height);
    }
    fetch(getSessionVideoUrl(activeId), {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setVideoBlobUrl(objectUrl);
      })
      .catch(() => {
        // video unavailable — player stays blank
      })
      .finally(() => setVideoLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeId]);

  const resultsQ = useSessionResults(activeId ?? 0, activeId !== null);

  const sortedResults = useMemo(() => {
    if (!resultsQ.data) return [];
    return [...resultsQ.data].sort((a, b) => (a.timestamp_s ?? 0) - (b.timestamp_s ?? 0));
  }, [resultsQ.data]);

  const hasAngles =
    angles !== null && Object.values(angles).some((v) => v !== undefined);

  function handleTimeUpdate() {
    const vid = videoRef.current;
    if (!vid || sortedResults.length === 0) return;

    const frame = findClosestFrame(sortedResults, vid.currentTime);
    if (!frame) return;

    setAngles(frame.angles);

    // Draw skeleton if this frame has stored landmarks
    const overlay = skeletonCanvasRef.current;
    if (overlay) {
      overlay.width = vid.clientWidth;
      overlay.height = vid.clientHeight;
      const ctx = overlay.getContext("2d");
      if (ctx && frame.landmarks && frame.landmarks.length > 0) {
        drawSkeleton(
          ctx,
          frame.landmarks,
          overlay.width,
          overlay.height,
          vid.videoWidth,
          vid.videoHeight,
        );
      } else if (ctx) {
        ctx.clearRect(0, 0, overlay.width, overlay.height);
      }
    }
  }

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
            onChange={(e) => {
              setSelectedId(Number(e.target.value));
            }}
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
          {activeId !== null && videoBlobUrl && (
            <video
              ref={videoRef}
              key={videoBlobUrl}
              className="h-full w-full object-contain"
              src={videoBlobUrl}
              autoPlay
              loop
              muted
              playsInline
              onTimeUpdate={handleTimeUpdate}
            />
          )}

          {/* Skeleton overlay canvas — drawn on top of video */}
          <canvas
            ref={skeletonCanvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          />

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

          {/* Loading overlay while fetching video or results */}
          {(videoLoading || resultsQ.isLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <span className="text-xs text-muted-foreground">
                {videoLoading ? "Carregando vídeo..." : "Carregando análise..."}
              </span>
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

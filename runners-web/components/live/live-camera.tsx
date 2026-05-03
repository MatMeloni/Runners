"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSession, uploadVideo } from "@/lib/api";
import {
  acquireCameraStream,
  pickRecorderMimeType,
  playPreviewOnVideo,
  startMediaRecorder,
  stopAllTracks,
} from "@/lib/webcam-recording";
import type { LivePayload, PoseLandmark } from "@/lib/types";

// MediaPipe Pose connections (landmark index pairs)
const POSE_CONNECTIONS: [number, number][] = [
  [9, 10],
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

async function buildWsUrl(): Promise<string> {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").trim();
  const base = raw.replace(/\/+$/, "");
  const wsBase = base.replace(/^http/, "ws");

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  return `${wsBase}/ws/live?token=${token}`;
}

function AngleRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-black/60 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-xs text-white/70">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-white">{value.toFixed(1)}°</span>
    </div>
  );
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);

  // Draw connections
  ctx.lineWidth = 2;
  for (const [a, b] of POSE_CONNECTIONS) {
    const lmA = landmarks[a];
    const lmB = landmarks[b];
    if (!lmA || !lmB) continue;
    if (lmA.visibility < 0.3 || lmB.visibility < 0.3) continue;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0, 220, 130, ${Math.min(lmA.visibility, lmB.visibility).toFixed(2)})`;
    ctx.moveTo(lmA.x * width, lmA.y * height);
    ctx.lineTo(lmB.x * width, lmB.y * height);
    ctx.stroke();
  }

  // Draw landmark dots
  for (const lm of landmarks) {
    if (lm.visibility < 0.3) continue;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${lm.visibility.toFixed(2)})`;
    ctx.arc(lm.x * width, lm.y * height, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function LiveCamera() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fpsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<{ stop: () => Promise<File> } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sendingRef = useRef(false);
  const fpsCountRef = useRef(0);

  const [active, setActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [metrics, setMetrics] = useState<LivePayload | null>(null);
  const [fps, setFps] = useState(0);

  const stopAll = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    if (fpsTimerRef.current) {
      clearInterval(fpsTimerRef.current);
      fpsTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAllTracks(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    sendingRef.current = false;
    setActive(false);
    setMetrics(null);
    setFps(0);

    // Clear skeleton overlay
    const overlay = skeletonCanvasRef.current;
    if (overlay) {
      const ctx = overlay.getContext("2d");
      ctx?.clearRect(0, 0, overlay.width, overlay.height);
    }
  }, []);

  const stop = useCallback(async () => {
    // Grab recorder before stopAll clears everything
    const recorder = recorderRef.current;
    recorderRef.current = null;
    stopAll();

    if (!recorder) return;

    setIsSaving(true);
    try {
      const file = await recorder.stop();
      const timestamp = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
      const session = await createSession({
        name: `Ao Vivo — ${timestamp}`,
        source: "webcam",
      });
      await uploadVideo(session.id, file);
      toast.success("Sessão salva! Processando análise...", {
        action: { label: "Ver sessão", onClick: () => router.push(`/sessions/${session.id}`) },
      });
      router.push(`/sessions/${session.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar sessão.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }, [stopAll, router]);

  const start = useCallback(async () => {
    try {
      const stream = await acquireCameraStream({
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stopAllTracks(stream);
        return;
      }
      await playPreviewOnVideo(stream, video);

      // Start video recorder alongside WebSocket stream
      const mimeType = pickRecorderMimeType();
      if (mimeType) {
        recorderRef.current = startMediaRecorder(stream, mimeType);
      }

      const wsUrl = await buildWsUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setActive(true);

        frameTimerRef.current = setInterval(() => {
          if (sendingRef.current || ws.readyState !== WebSocket.OPEN) return;
          const canvas = captureCanvasRef.current;
          const vid = videoRef.current;
          if (!canvas || !vid || vid.readyState < 2) return;

          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(vid, 0, 0, 320, 240);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          const b64 = dataUrl.split(",")[1];
          if (!b64) return;
          sendingRef.current = true;
          ws.send(JSON.stringify({ frame: b64 }));
        }, 100); // ~10 fps

        fpsTimerRef.current = setInterval(() => {
          setFps(fpsCountRef.current);
          fpsCountRef.current = 0;
        }, 1000);
      };

      ws.onmessage = (event) => {
        sendingRef.current = false;
        fpsCountRef.current += 1;
        try {
          const payload = JSON.parse(event.data as string) as LivePayload;
          setMetrics(payload);

          // Draw skeleton on overlay canvas
          if (payload.landmarks && skeletonCanvasRef.current && videoRef.current) {
            const vid = videoRef.current;
            const overlay = skeletonCanvasRef.current;
            overlay.width = vid.clientWidth;
            overlay.height = vid.clientHeight;
            const ctx = overlay.getContext("2d");
            if (ctx) drawSkeleton(ctx, payload.landmarks, overlay.width, overlay.height);
          } else if (!payload.landmarks && skeletonCanvasRef.current) {
            const overlay = skeletonCanvasRef.current;
            const ctx = overlay.getContext("2d");
            ctx?.clearRect(0, 0, overlay.width, overlay.height);
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onerror = () => {
        let host = "API";
        try {
          host = new URL(wsUrl).host;
        } catch {
          /* ignore */
        }
        toast.error(
          `Sem ligação ao tempo real (${host}). Verifique python scripts/run_api_dev.py e NEXT_PUBLIC_API_URL.`,
        );
        stopAll();
      };

      ws.onclose = (ev) => {
        setActive(false);
        if (ev.code === 4001 || ev.code === 4003) {
          toast.error("Sessão expirada. Faça login novamente.");
        }
      };
    } catch (e) {
      const name = e instanceof Error ? (e as { name?: string }).name ?? "" : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        toast.error("Permissão da câmera recusada. Permita o acesso nas configurações do browser.");
      } else if (name === "NotFoundError") {
        toast.error("Nenhuma câmera encontrada.");
      } else {
        toast.error("Não foi possível acessar a câmera.");
      }
      stopAll();
    }
  }, [stopAll]);

  useEffect(() => () => stopAll(), [stopAll]);

  const angles = metrics?.angles ?? {};
  const hasAngles = metrics?.detected && Object.keys(angles).length > 0;

  return (
    <div className="space-y-4">
      {/* Camera feed */}
      <div
        className="relative overflow-hidden rounded-xl border border-muted-foreground/30 bg-black"
        style={{ aspectRatio: "16/9", maxHeight: "520px" }}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
          aria-label="Feed ao vivo da câmera"
        />

        {/* Skeleton overlay canvas — drawn on top of video */}
        <canvas
          ref={skeletonCanvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        />

        {/* Hidden canvas used only to capture frames for WebSocket */}
        <canvas ref={captureCanvasRef} className="hidden" aria-hidden />

        {/* Top-left status */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {active && (
            <Badge
              variant={metrics?.detected ? "default" : "secondary"}
              className="text-xs shadow"
            >
              {metrics?.detected ? "Pose detectada" : "Aguardando pose..."}
            </Badge>
          )}
          {active && fps > 0 && (
            <Badge
              variant="outline"
              className="border-white/20 bg-black/50 text-xs text-white shadow"
            >
              {fps} fps
            </Badge>
          )}
        </div>

        {/* Angle overlay — top-right */}
        {hasAngles && (
          <div className="absolute right-3 top-3 flex flex-col gap-1.5 min-w-[150px]">
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

        {/* Idle placeholder */}
        {!active && !isSaving && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
            <span className="text-sm text-muted-foreground">Câmera inativa</span>
            <span className="text-xs text-muted-foreground/60">
              Clique em &quot;Iniciar análise&quot; para começar
            </span>
          </div>
        )}

        {/* Saving overlay */}
        {isSaving && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90">
            <span className="text-sm font-medium">Salvando sessão...</span>
            <span className="text-xs text-muted-foreground">Aguarde o upload do vídeo</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {!active && !isSaving ? (
          <Button onClick={() => void start()}>Iniciar análise ao vivo</Button>
        ) : active ? (
          <Button variant="destructive" onClick={() => void stop()} disabled={isSaving}>
            Parar e salvar sessão
          </Button>
        ) : null}
      </div>

      {/* Metrics cards below */}
      {hasAngles && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(
            [
              { key: "knee_left", label: "Joelho Esq." },
              { key: "knee_right", label: "Joelho Dir." },
              { key: "hip_left", label: "Quadril Esq." },
              { key: "hip_right", label: "Quadril Dir." },
              { key: "trunk", label: "Tronco" },
            ] as const
          )
            .filter(({ key }) => angles[key] !== undefined)
            .map(({ key, label }) => (
              <Card key={key} className="border-muted">
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {(angles[key] as number).toFixed(1)}
                    <span className="ml-0.5 text-sm font-normal text-muted-foreground">°</span>
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}

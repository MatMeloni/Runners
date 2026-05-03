"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Angles {
  knee_left?: number;
  knee_right?: number;
  hip_left?: number;
  hip_right?: number;
  trunk?: number;
}

interface LivePayload {
  detected: boolean;
  angles: Angles;
}

function buildWsUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").trim();
  const base = raw.replace(/\/+$/, "");
  return base.replace(/^http/, "ws") + "/ws/live";
}

function AngleRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-black/60 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-xs text-white/70">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-white">{value.toFixed(1)}°</span>
    </div>
  );
}

export function LiveCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fpsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendingRef = useRef(false);
  const fpsCountRef = useRef(0);

  const [active, setActive] = useState(false);
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
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    sendingRef.current = false;
    setActive(false);
    setMetrics(null);
    setFps(0);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();

      const wsUrl = buildWsUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setActive(true);

        frameTimerRef.current = setInterval(() => {
          if (sendingRef.current || ws.readyState !== WebSocket.OPEN) return;
          const canvas = canvasRef.current;
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
          `Sem ligação ao tempo real (${host}). Na raiz do repo: python scripts/run_api_dev.py — e confira NEXT_PUBLIC_API_URL no Next.`,
        );
        stopAll();
      };

      ws.onclose = () => setActive(false);
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
        <canvas ref={canvasRef} className="hidden" aria-hidden />

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
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
            <span className="text-sm text-muted-foreground">Câmera inativa</span>
            <span className="text-xs text-muted-foreground/60">
              Clique em &quot;Iniciar análise&quot; para começar
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {!active ? (
          <Button onClick={() => void start()}>Iniciar análise ao vivo</Button>
        ) : (
          <Button variant="destructive" onClick={stopAll}>
            Parar
          </Button>
        )}
      </div>

      {/* Metrics cards below (fallback if overlay obscured) */}
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

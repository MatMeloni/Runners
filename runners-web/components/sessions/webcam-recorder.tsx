// runners-web/components/sessions/webcam-recorder.tsx
"use client";

import { Circle, Video, VideoOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  acquireCameraStream,
  detachVideoElement,
  isWebcamRecordingSupported,
  pickRecorderMimeType,
  playPreviewOnVideo,
  startMediaRecorder,
  stopAllTracks,
} from "@/lib/webcam-recording";

type Phase = "unsupported" | "idle" | "preview" | "recording" | "clip_ready";

function mapGetUserMediaError(e: unknown): string {
  if (e && typeof e === "object" && "name" in e) {
    const name = String((e as { name: string }).name);
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "Permissão da câmara recusada. Permita o acesso nas definições do browser.";
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "Nenhuma câmara encontrada.";
    }
    if (name === "NotReadableError" || name === "TrackStartError") {
      return "A câmara está a ser usada por outra aplicação.";
    }
  }
  return "Não foi possível aceder à câmara.";
}

export interface WebcamRecorderProps {
  /** Chamado quando existe um clip pronto para enviar (após parar gravação). */
  onClipReady: (file: File) => void;
  /** Chamado ao descartar o clip ou libertar a câmara (limpa o campo no formulário). */
  onClipCleared: () => void;
  disabled?: boolean;
}

export function WebcamRecorder({ onClipReady, onClipCleared, disabled }: WebcamRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopRecordingRef = useRef<(() => Promise<File>) | null>(null);
  const recordedSecondsRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<Phase>(() =>
    isWebcamRecordingSupported() ? "idle" : "unsupported"
  );
  const [secondsRecorded, setSecondsRecorded] = useState(0);
  const [clipMeta, setClipMeta] = useState<{ name: string; sizeMb: string } | null>(null);

  const releaseCamera = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    stopRecordingRef.current = null;
    stopAllTracks(streamRef.current);
    streamRef.current = null;
    detachVideoElement(videoRef.current);
    recordedSecondsRef.current = 0;
    setSecondsRecorded(0);
    setClipMeta(null);
  }, []);

  useEffect(() => {
    return () => {
      releaseCamera();
    };
  }, [releaseCamera]);

  const startCamera = useCallback(async () => {
    if (!isWebcamRecordingSupported()) {
      setPhase("unsupported");
      toast.error("Este browser não suporta gravação WebM (experimente Chrome ou Edge).");
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    try {
      const stream = await acquireCameraStream();
      streamRef.current = stream;
      await playPreviewOnVideo(stream, video);
      setPhase("preview");
      setClipMeta(null);
    } catch (e) {
      releaseCamera();
      toast.error(mapGetUserMediaError(e));
      setPhase("idle");
    }
  }, [releaseCamera]);

  const stopCamera = useCallback(() => {
    releaseCamera();
    onClipCleared();
    setPhase("idle");
  }, [releaseCamera, onClipCleared]);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    const mime = pickRecorderMimeType();
    if (!stream || !mime) {
      toast.error("Não é possível gravar neste browser.");
      return;
    }
    try {
      const { stop } = startMediaRecorder(stream, mime);
      stopRecordingRef.current = stop;
      recordedSecondsRef.current = 0;
      setSecondsRecorded(0);
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        recordedSecondsRef.current += 1;
        setSecondsRecorded(recordedSecondsRef.current);
      }, 1000);
      setPhase("recording");
    } catch {
      toast.error("Não foi possível iniciar a gravação.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const stopFn = stopRecordingRef.current;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    stopRecordingRef.current = null;
    if (!stopFn) {
      setPhase("preview");
      return;
    }
    try {
      const file = await stopFn();
      setClipMeta({
        name: file.name,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2),
      });
      onClipReady(file);
      setPhase("clip_ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao finalizar a gravação.";
      toast.error(msg);
      setPhase("preview");
    }
  }, [onClipReady]);

  const discardClip = useCallback(() => {
    onClipCleared();
    setClipMeta(null);
    if (streamRef.current && videoRef.current) {
      setPhase("preview");
    } else {
      setPhase("idle");
    }
  }, [onClipCleared]);

  const recordAgain = useCallback(() => {
    onClipCleared();
    setClipMeta(null);
    if (streamRef.current && videoRef.current) {
      setPhase("preview");
    } else {
      void startCamera();
    }
  }, [onClipCleared, startCamera]);

  if (phase === "unsupported") {
    return (
      <div className="rounded-lg border border-muted-foreground/30 bg-muted/30 p-4 text-sm text-muted-foreground">
        Gravação por webcam não está disponível neste browser (MediaRecorder / WebM). Use Chrome ou Edge, ou envie um
        ficheiro pela opção de upload.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Requer HTTPS ou localhost. Conceda permissão à câmara quando o browser pedir. O vídeo é gravado no teu
        dispositivo e enviado como ficheiro WebM.
      </p>

      <div
        className="relative overflow-hidden rounded-lg border border-muted-foreground/30 bg-black/80"
        style={{ aspectRatio: "16 / 10", maxHeight: "280px" }}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
          aria-label="Pré-visualização da webcam"
        />
        {phase === "idle" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm text-muted-foreground">
            Câmara inativa
          </div>
        ) : null}
        {phase === "recording" ? (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-destructive/90 px-2 py-1 text-xs font-medium text-destructive-foreground">
            <Circle className="h-2 w-2 animate-pulse fill-current" aria-hidden />
            A gravar {secondsRecorded}s
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {phase === "idle" ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => void startCamera()} disabled={disabled}>
            <Video className="mr-2 h-4 w-4" aria-hidden />
            Iniciar câmara
          </Button>
        ) : null}

        {phase === "preview" ? (
          <>
            <Button type="button" size="sm" onClick={startRecording} disabled={disabled}>
              Gravar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={stopCamera} disabled={disabled}>
              <VideoOff className="mr-2 h-4 w-4" aria-hidden />
              Parar câmara
            </Button>
          </>
        ) : null}

        {phase === "recording" ? (
          <Button type="button" variant="destructive" size="sm" onClick={() => void stopRecording()} disabled={disabled}>
            Parar gravação
          </Button>
        ) : null}

        {phase === "clip_ready" ? (
          <>
            <Button type="button" variant="secondary" size="sm" onClick={recordAgain} disabled={disabled}>
              Gravar outro
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={discardClip} disabled={disabled}>
              Descartar clip
            </Button>
          </>
        ) : null}
      </div>

      {clipMeta ? (
        <p className="text-xs tabular-nums text-foreground">
          Clip pronto: {clipMeta.name} — {clipMeta.sizeMb} MB
        </p>
      ) : null}
    </div>
  );
}

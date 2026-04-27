// runners-web/lib/webcam-recording.ts
/** Helpers para pré-visualização e gravação via getUserMedia + MediaRecorder (WebM no Chrome/Edge). */

const RECORDER_MIME_CANDIDATES = [
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp8",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp9,opus",
  "video/webm",
] as const;

export function pickRecorderMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const mime of RECORDER_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

export function isWebcamRecordingSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    !!navigator.mediaDevices?.getUserMedia &&
    pickRecorderMimeType() !== null
  );
}

const DEFAULT_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

export async function acquireCameraStream(
  videoConstraints: MediaTrackConstraints = DEFAULT_VIDEO_CONSTRAINTS
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: videoConstraints,
    audio: false,
  });
}

export function stopAllTracks(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((t) => {
    t.stop();
  });
}

export function detachVideoElement(video: HTMLVideoElement | null): void {
  if (!video) return;
  video.srcObject = null;
}

/** Liga um stream a um elemento video e reproduz (muted + playsInline). */
export async function playPreviewOnVideo(
  stream: MediaStream,
  video: HTMLVideoElement
): Promise<void> {
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
}

function extensionForMime(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  return "webm";
}

/**
 * Inicia gravação do stream. Chamar `stop()` e aguardar a Promise; manter o stream ativo até terminar o upload.
 */
export function startMediaRecorder(
  stream: MediaStream,
  mimeType: string
): { stop: () => Promise<File> } {
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType });

  recorder.ondataavailable = (e: BlobEvent) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(250);

  const stop = (): Promise<File> =>
    new Promise((resolve, reject) => {
      if (recorder.state === "inactive") {
        reject(new Error("Gravação já terminou."));
        return;
      }
      recorder.addEventListener(
        "error",
        () => reject(new Error("MediaRecorder falhou.")),
        { once: true }
      );
      recorder.addEventListener(
        "stop",
        () => {
          try {
            const blobType = recorder.mimeType || chunks[0]?.type || mimeType;
            const blob = new Blob(chunks, { type: blobType });
            if (blob.size === 0) {
              reject(new Error("Gravação vazia — tente novamente."));
              return;
            }
            const ext = extensionForMime(blobType);
            const name = `webcam-${Date.now()}.${ext}`;
            resolve(new File([blob], name, { type: blobType || "video/webm" }));
          } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        },
        { once: true }
      );
      recorder.stop();
    });

  return { stop };
}

// runners-web/components/sessions/upload-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WebcamRecorder } from "@/components/sessions/webcam-recorder";
import { ApiError } from "@/lib/api";
import { useCreateSession, useUploadVideo } from "@/lib/queries";
import { cn } from "@/lib/utils";

const allowedMime = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"] as const;

function isAllowedVideoFile(file: File): boolean {
  if (allowedMime.includes(file.type as (typeof allowedMime)[number])) return true;
  // Alguns browsers deixam type vazio no File da MediaRecorder; aceitar por extensão.
  if ((!file.type || file.type === "application/octet-stream") && /\.webm$/i.test(file.name)) {
    return true;
  }
  return false;
}

const schema = z
  .object({
    name: z.string().optional(),
    source: z.enum(["upload", "webcam"]),
    file: z.custom<File | undefined>((v) => v === undefined || v instanceof File),
  })
  .superRefine((data, ctx) => {
    if (data.source === "upload") {
      if (!(data.file instanceof File)) {
        ctx.addIssue({ code: "custom", path: ["file"], message: "Selecione um ficheiro de vídeo" });
        return;
      }
      if (!isAllowedVideoFile(data.file)) {
        ctx.addIssue({ code: "custom", path: ["file"], message: "Apenas mp4, mov, avi ou webm" });
      }
      return;
    }
    if (!(data.file instanceof File)) {
      ctx.addIssue({
        code: "custom",
        path: ["file"],
        message: "Grave um vídeo com a câmara antes de enviar.",
      });
      return;
    }
    if (!isAllowedVideoFile(data.file)) {
      ctx.addIssue({
        code: "custom",
        path: ["file"],
        message: "Formato não suportado. Tente outro browser ou use upload de ficheiro.",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export function UploadForm() {
  const router = useRouter();
  const createSession = useCreateSession();
  const upload = useUploadVideo();
  const [dragOver, setDragOver] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", source: "upload", file: undefined },
  });

  const source = form.watch("source");
  const file = form.watch("file");

  const setFileFromList = useCallback(
    (list: FileList | null) => {
      const f = list?.[0];
      if (!f) return;
      form.setValue("file", f, { shouldValidate: true });
    },
    [form]
  );

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const session = await createSession.mutateAsync({
        name: values.name?.trim() ? values.name.trim() : undefined,
        source: values.source,
      });
      if (!(values.file instanceof File)) {
        toast.error(
          values.source === "webcam" ? "Grave um clip antes de enviar." : "Ficheiro em falta."
        );
        return;
      }
      await upload.mutateAsync({ sessionId: session.id, file: values.file });
      router.push(`/sessions/${session.id}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Não foi possível iniciar o upload.";
      toast.error(msg);
    }
  });

  const busy = createSession.isPending || upload.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova sessão</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome (opcional)</Label>
            <Input id="name" placeholder="ex.: Corrida matinal 13/04" {...form.register("name")} />
          </div>

          <div className="space-y-2">
            <Label>Origem</Label>
            <Select
              value={source}
              onValueChange={(v) => {
                const next = v as FormValues["source"];
                form.setValue("source", next);
                form.setValue("file", undefined, { shouldValidate: true });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolher origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upload">Upload de vídeo</SelectItem>
                <SelectItem value="webcam">Webcam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {source === "upload" ? (
            <div className="space-y-2">
              <Label>Ficheiro</Label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  setFileFromList(e.dataTransfer.files);
                }}
                className={cn(
                  "flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm transition-colors",
                  dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30"
                )}
                onClick={() => document.getElementById("video-file")?.click()}
              >
                <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Arraste um vídeo ou clique para escolher</p>
                <p className="mt-1 text-xs text-muted-foreground">mp4, mov, avi, webm</p>
                {file ? (
                  <p className="mt-3 text-xs tabular-nums text-foreground">
                    {file.name} — {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                ) : null}
                <input
                  id="video-file"
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                  className="hidden"
                  onChange={(e) => setFileFromList(e.target.files)}
                />
              </div>
              {form.formState.errors.file?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.file.message}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <WebcamRecorder
                disabled={busy}
                onClipReady={(f) => form.setValue("file", f, { shouldValidate: true })}
                onClipCleared={() => form.setValue("file", undefined, { shouldValidate: true })}
              />
              {form.formState.errors.file?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.file.message}</p>
              ) : null}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/sessions")} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "A enviar…" : "Criar e enviar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

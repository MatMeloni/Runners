// runners-web/app/sessions/new/page.tsx
import { UploadForm } from "@/components/sessions/upload-form";

export default function NewSessionPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Enviar vídeo para análise</h1>
        <p className="text-sm text-muted-foreground">
          Envie um vídeo de perfil (lateral) para melhores resultados. O sistema analisa automaticamente
          ângulos de joelho, quadril e tronco frame a frame usando visão computacional.
        </p>
      </div>
      <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Dica:</span> posicione a câmera na altura do quadril, de lado ao corredor,
        a pelo menos 3 metros de distância. Formatos aceitos: MP4, MOV, WebM.
      </div>
      <UploadForm />
    </div>
  );
}

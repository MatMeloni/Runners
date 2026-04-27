// runners-web/app/sessions/new/page.tsx
import { UploadForm } from "@/components/sessions/upload-form";

export default function NewSessionPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova sessão</h1>
        <p className="text-sm text-muted-foreground">Crie uma sessão e envie um vídeo para análise.</p>
      </div>
      <UploadForm />
    </div>
  );
}

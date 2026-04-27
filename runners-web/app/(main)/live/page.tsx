// runners-web/app/(main)/live/page.tsx
import { LiveCamera } from "@/components/live/live-camera";

export const metadata = { title: "Análise ao Vivo – Runners" };

export default function LivePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Análise ao Vivo</h1>
        <p className="text-sm text-muted-foreground">
          Ângulos articulares em tempo real via câmera. Posicione-se de perfil para melhores resultados.
        </p>
      </div>
      <LiveCamera />
    </div>
  );
}

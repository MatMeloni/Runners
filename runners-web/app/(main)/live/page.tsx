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

      <div className="grid gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          <span className="font-medium text-foreground">Joelho (apoio)</span>
          <p>Ideal: 150–175°. Valores abaixo de 130° indicam sobrecarga articular.</p>
        </div>
        <div>
          <span className="font-medium text-foreground">Cadência</span>
          <p>Ideal: 160–190 passos/min. Cadência baixa aumenta o impacto por passada.</p>
        </div>
        <div>
          <span className="font-medium text-foreground">GCT (contato com solo)</span>
          <p>Ideal: 200–300 ms. Valores acima de 300 ms indicam passada ineficiente.</p>
        </div>
      </div>

      <LiveCamera />
    </div>
  );
}

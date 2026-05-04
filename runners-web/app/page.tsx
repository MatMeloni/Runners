import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar mínima */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">Runners</span>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Começar gratuitamente</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-20 text-center">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Analise sua corrida como um profissional
          </h1>
          <p className="text-lg text-muted-foreground">
            Envie um vídeo do seu treino e receba análise biomecânica automática —
            ângulos articulares, cadência e tempo de contato com o solo.
            Sem precisar de um especialista.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" asChild>
              <Link href="/register">Começar gratuitamente</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">Ver demonstração</Link>
            </Button>
          </div>
        </div>

        {/* Benefícios */}
        <div className="mt-8 grid max-w-3xl gap-6 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 text-left shadow-sm">
            <p className="text-2xl font-bold">📹</p>
            <h3 className="mt-2 font-semibold">Upload de vídeo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Grave de perfil com qualquer smartphone e envie para análise automática frame a frame.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-left shadow-sm">
            <p className="text-2xl font-bold">🦾</p>
            <h3 className="mt-2 font-semibold">Análise em tempo real</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Use a câmera ao vivo para ver os ângulos articulares detectados enquanto você corre.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-left shadow-sm">
            <p className="text-2xl font-bold">📊</p>
            <h3 className="mt-2 font-semibold">Comparação de treinos</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare dois treinos lado a lado e veja sua evolução biomecânica ao longo do tempo.
            </p>
          </div>
        </div>

        {/* Hipótese de valor */}
        <div className="mt-4 max-w-xl rounded-xl border border-dashed bg-muted/40 p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Nossa hipótese: corredores amadores melhoram sua técnica quando têm acesso a feedback
            biomecânico objetivo — algo que antes só existia em clínicas especializadas.
          </p>
        </div>
      </main>
    </div>
  );
}

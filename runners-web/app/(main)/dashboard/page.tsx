// runners-web/app/dashboard/page.tsx
"use client";

import Link from "next/link";

import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RecentSessionsTable } from "@/components/dashboard/recent-sessions-table";
import { SessionDemoPlayer } from "@/components/dashboard/session-demo-player";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meu Painel de Corrida</h1>
          <p className="text-sm text-muted-foreground">Acompanhe sua evolução biomecânica treino a treino.</p>
        </div>
        <Button asChild>
          <Link href="/sessions/new">Analisar novo treino</Link>
        </Button>
      </div>
      <KpiCards />
      <SessionDemoPlayer />
      <p className="text-xs text-muted-foreground px-1">
        Os pontos verdes representam a pose detectada pelo MediaPipe. Os valores no canto são os ângulos articulares
        calculados automaticamente em cada frame — joelho, quadril e tronco.
      </p>
      <RecentSessionsTable />
    </div>
  );
}

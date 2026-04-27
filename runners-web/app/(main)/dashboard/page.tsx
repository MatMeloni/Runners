// runners-web/app/dashboard/page.tsx
"use client";

import Link from "next/link";

import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RecentSessionsTable } from "@/components/dashboard/recent-sessions-table";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
          <p className="text-sm text-muted-foreground">Visão geral das sessões e indicadores-chave.</p>
        </div>
        <Button asChild>
          <Link href="/sessions/new">Nova sessão</Link>
        </Button>
      </div>
      <KpiCards />
      <RecentSessionsTable />
    </div>
  );
}

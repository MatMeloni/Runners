// runners-web/app/sessions/page.tsx
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";

import { SessionCard } from "@/components/sessions/session-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "@/lib/queries";
import type { SessionStatusType } from "@/lib/types";

export default function SessionsPage() {
  const [status, setStatus] = useState<SessionStatusType | "all">("all");
  const q = useSessions(status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessões</h1>
          <p className="text-sm text-muted-foreground">Filtre por estado e abra o detalhe de cada sessão.</p>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-64">
          <Label htmlFor="status-filter">Estado</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as SessionStatusType | "all")}>
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="processing">A processar</SelectItem>
              <SelectItem value="done">Concluída</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {q.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (q.data?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Ainda não existem sessões com este filtro.</p>
          <Button asChild>
            <Link href="/sessions/new">Criar sessão</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {q.data?.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}

      <Button
        asChild
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
        aria-label="Nova sessão"
      >
        <Link href="/sessions/new">
          <Plus className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
}

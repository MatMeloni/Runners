// runners-web/app/sessions/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ResultsTabs } from "@/components/sessions/results-tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteSession } from "@/lib/queries";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const del = useDeleteSession();

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Identificador de sessão inválido.</p>
        <Button asChild variant="outline">
          <Link href="/sessions">Voltar às sessões</Link>
        </Button>
      </div>
    );
  }

  const onDelete = async () => {
    try {
      await del.mutateAsync(id);
      toast.success("Sessão eliminada");
      setConfirmOpen(false);
      router.push("/sessions");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao eliminar");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessão #{id}</h1>
          <p className="text-sm text-muted-foreground">Detalhe, gráficos e exportação de dados.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" type="button" onClick={() => setConfirmOpen(true)}>
            Eliminar
          </Button>
          <Button asChild variant="outline">
            <Link href="/sessions">Voltar</Link>
          </Button>
        </div>
      </div>
      <ResultsTabs sessionId={id} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar esta sessão?</DialogTitle>
            <DialogDescription>
              Remove a sessão #{id}, todos os resultados e o vídeo. Esta operação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={del.isPending} onClick={() => void onDelete()}>
              {del.isPending ? "A eliminar…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

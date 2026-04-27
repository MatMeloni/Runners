"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { SessionStatusBadge } from "@/components/sessions/session-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteSession } from "@/lib/queries";
import type { Session } from "@/lib/types";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function SessionCard({ session }: { session: Session }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const del = useDeleteSession();

  const onDelete = async () => {
    try {
      await del.mutateAsync(session.id);
      toast.success("Sessão eliminada");
      setConfirmOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao eliminar");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">{session.name ?? `Sessão #${session.id}`}</CardTitle>
            <p className="text-xs text-muted-foreground tabular-nums">{formatDate(session.created_at)}</p>
          </div>
          <SessionStatusBadge status={session.status} />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {session.source ? (
            <Badge variant="secondary" className="capitalize">
              {session.source}
            </Badge>
          ) : (
            <Badge variant="outline">Origem desconhecida</Badge>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
            Eliminar
          </Button>
          <Button asChild size="sm">
            <Link href={`/sessions/${session.id}`}>Ver</Link>
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar sessão?</DialogTitle>
            <DialogDescription>
              Esta ação remove a sessão #{session.id}, os resultados de análise e o ficheiro de vídeo associado. Não é
              possível desfazer.
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
    </>
  );
}

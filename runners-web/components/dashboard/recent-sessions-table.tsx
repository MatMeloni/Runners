// runners-web/components/dashboard/recent-sessions-table.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";

import { SessionStatusBadge } from "@/components/sessions/session-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSessions } from "@/lib/queries";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function RecentSessionsTable() {
  const q = useSessions("all");
  const rows = useMemo(() => {
    const list = [...(q.data ?? [])];
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list.slice(0, 5);
  }, [q.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessões recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {q.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <p>Ainda não existem sessões.</p>
            <Button asChild>
              <Link href="/sessions/new">Criar sessão</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name ?? `Sessão #${s.id}`}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                  <TableCell>
                    <SessionStatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/sessions/${s.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button asChild variant="secondary">
          <Link href="/sessions">Ver todas</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

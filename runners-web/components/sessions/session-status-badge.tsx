// runners-web/components/sessions/session-status-badge.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SessionStatusType } from "@/lib/types";

const labels: Record<SessionStatusType, string> = {
  pending: "Pendente",
  processing: "A processar",
  done: "Concluída",
  failed: "Falhou",
};

export function SessionStatusBadge({ status }: { status: SessionStatusType }) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="border-yellow-500/60 text-yellow-500">
        {labels.pending}
      </Badge>
    );
  }
  if (status === "processing") {
    return (
      <Badge variant="outline" className="border-blue-500/60 text-blue-500">
        <span className="relative mr-2 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
        {labels.processing}
      </Badge>
    );
  }
  if (status === "done") {
    return (
      <Badge className={cn("border border-green-600/40 bg-green-600 text-white hover:bg-green-600")}>
        {labels.done}
      </Badge>
    );
  }
  return <Badge variant="destructive">{labels.failed}</Badge>;
}

// runners-web/hooks/use-session-polling.ts
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { queryKeys, useSessionStatus } from "@/lib/queries";

export function useSessionPolling(sessionId: number, enabled: boolean) {
  const qc = useQueryClient();
  const q = useSessionStatus(sessionId, sessionId > 0 && enabled);

  useEffect(() => {
    const st = q.data?.status;
    if (st === "done" || st === "failed") {
      void qc.invalidateQueries({ queryKey: queryKeys.session(sessionId) });
      if (st === "done") {
        void qc.invalidateQueries({ queryKey: queryKeys.sessionResults(sessionId) });
        void qc.invalidateQueries({ queryKey: queryKeys.metrics });
      }
    }
  }, [q.data?.status, qc, sessionId]);

  return {
    status: q.data?.status,
    resultsCount: q.data?.results_count ?? 0,
    error: q.data?.error ?? null,
    isPolling: q.data?.status === "pending" || q.data?.status === "processing",
  };
}

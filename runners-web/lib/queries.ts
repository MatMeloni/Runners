// runners-web/lib/queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSession,
  deleteSession,
  getHealth,
  getMetrics,
  getSession,
  getSessionResults,
  getSessions,
  getSessionStatus,
  uploadVideo,
} from "@/lib/api";
import type { SessionCreateBody, SessionStatusType } from "@/lib/types";

export const queryKeys = {
  health: ["health"] as const,
  sessions: ["sessions"] as const,
  session: (id: number) => ["session", id] as const,
  sessionStatus: (id: number) => ["sessionStatus", id] as const,
  sessionResults: (id: number) => ["sessionResults", id] as const,
  metrics: ["metrics"] as const,
};

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useSessions(status?: SessionStatusType | "all") {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: getSessions,
    select: (sessions) => {
      if (!status || status === "all") return sessions;
      return sessions.filter((s) => s.status === status);
    },
  });
}

export function useSession(id: number) {
  return useQuery({
    queryKey: queryKeys.session(id),
    queryFn: () => getSession(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useSessionStatus(id: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.sessionStatus(id),
    queryFn: () => getSessionStatus(id),
    enabled: Number.isFinite(id) && id > 0 && enabled,
    refetchInterval: (query) => {
      if (!enabled) return false;
      const st = query.state.data?.status;
      if (st === "done" || st === "failed") return false;
      return 2000;
    },
  });
}

export function useSessionResults(id: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.sessionResults(id),
    queryFn: () => getSessionResults(id),
    enabled: Number.isFinite(id) && id > 0 && enabled,
  });
}

export function useMetrics() {
  return useQuery({
    queryKey: queryKeys.metrics,
    queryFn: getMetrics,
    refetchInterval: 3000,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SessionCreateBody) => createSession(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

export function useUploadVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, file }: { sessionId: number; file: File }) => uploadVideo(sessionId, file),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.session(vars.sessionId) });
      void qc.invalidateQueries({ queryKey: queryKeys.sessionStatus(vars.sessionId) });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => deleteSession(sessionId),
    onSuccess: (_data, sessionId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.sessions });
      void qc.invalidateQueries({ queryKey: queryKeys.metrics });
      void qc.removeQueries({ queryKey: queryKeys.session(sessionId) });
      void qc.removeQueries({ queryKey: queryKeys.sessionResults(sessionId) });
    },
  });
}


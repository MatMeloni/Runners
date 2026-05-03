// runners-web/lib/api.ts
import type {
  AnalysisResult,
  HealthResponse,
  MetricsResponse,
  Session,
  SessionCreateBody,
  SessionStatusResponse,
  UploadResponse,
} from "@/lib/types";
import { isSessionStatus } from "@/lib/utils";

export interface ApiErrorShape {
  message: string;
  status: number;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }

  toJSON(): ApiErrorShape {
    return { message: this.message, status: this.status };
  }
}

function getBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").trim();
  return raw.replace(/\/+$/, "");
}

async function apiAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") {
    return {};
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new ApiError(response.statusText || "Request failed", response.status);
    }
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("Invalid JSON response", response.status);
  }
}

function normalizeSession(raw: unknown): Session {
  if (typeof raw !== "object" || raw === null) {
    throw new ApiError("Invalid session payload", 500);
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "number" ? o.id : Number(o.id);
  const statusRaw = typeof o.status === "string" ? o.status : "pending";
  const status = isSessionStatus(statusRaw) ? statusRaw : "pending";
  const userId =
    typeof o.user_id === "string" || o.user_id === null ? (o.user_id as string | null) : null;
  return {
    id: Number.isFinite(id) ? id : 0,
    user_id: userId,
    name: typeof o.name === "string" || o.name === null ? (o.name as string | null) : null,
    source:
      typeof o.source === "string" || o.source === null ? (o.source as string | null) : null,
    status,
    video_path:
      typeof o.video_path === "string" || o.video_path === null
        ? (o.video_path as string | null)
        : null,
    error_msg:
      typeof o.error_msg === "string" || o.error_msg === null
        ? (o.error_msg as string | null)
        : null,
    created_at: typeof o.created_at === "string" ? o.created_at : String(o.created_at ?? ""),
    metadata:
      o.metadata !== undefined && o.metadata !== null && typeof o.metadata === "object"
        ? (o.metadata as Record<string, unknown>)
        : null,
  };
}

function normalizeAnalysisResult(raw: unknown): AnalysisResult {
  if (typeof raw !== "object" || raw === null) {
    throw new ApiError("Invalid analysis result", 500);
  }
  const o = raw as Record<string, unknown>;
  const anglesRaw = o.angles;
  const angles: AnalysisResult["angles"] = {};
  if (anglesRaw && typeof anglesRaw === "object") {
    const a = anglesRaw as Record<string, unknown>;
    const keys = ["knee_left", "knee_right", "hip_left", "hip_right", "trunk"] as const;
    for (const k of keys) {
      const v = a[k];
      if (typeof v === "number") angles[k] = v;
      else if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) angles[k] = n;
      }
    }
  }
  return {
    id: Number(o.id),
    session_id: Number(o.session_id),
    frame_index: Number(o.frame_index),
    timestamp_s: o.timestamp_s === null || o.timestamp_s === undefined ? null : Number(o.timestamp_s),
    angles,
    ground_contact_time_s:
      o.ground_contact_time_s === null || o.ground_contact_time_s === undefined
        ? null
        : Number(o.ground_contact_time_s),
    cadence_steps_per_min:
      o.cadence_steps_per_min === null || o.cadence_steps_per_min === undefined
        ? null
        : Number(o.cadence_steps_per_min),
    distance_m:
      o.distance_m === null || o.distance_m === undefined ? null : Number(o.distance_m),
    created_at: typeof o.created_at === "string" ? o.created_at : String(o.created_at ?? ""),
  };
}

export async function getHealth(): Promise<HealthResponse> {
  const url = `${getBaseUrl()}/health`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return parseJson<HealthResponse>(res);
}

export async function getMetrics(): Promise<MetricsResponse> {
  const url = `${getBaseUrl()}/api/metrics`;
  const auth = await apiAuthHeaders();
  const res = await fetch(url, { cache: "no-store", headers: { ...auth } });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return parseJson<MetricsResponse>(res);
}

export async function getSessions(): Promise<Session[]> {
  const url = `${getBaseUrl()}/api/sessions`;
  const auth = await apiAuthHeaders();
  const res = await fetch(url, { cache: "no-store", headers: { ...auth } });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  const data = await parseJson<unknown>(res);
  if (!Array.isArray(data)) throw new ApiError("Expected sessions array", 500);
  return data.map((item) => normalizeSession(item));
}

export async function getSession(id: number): Promise<Session> {
  const url = `${getBaseUrl()}/api/sessions/${id}`;
  const auth = await apiAuthHeaders();
  const res = await fetch(url, { cache: "no-store", headers: { ...auth } });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  const data = await parseJson<unknown>(res);
  return normalizeSession(data);
}

export async function createSession(body: SessionCreateBody): Promise<Session> {
  const url = `${getBaseUrl()}/api/sessions`;
  const auth = await apiAuthHeaders();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  const data = await parseJson<unknown>(res);
  return normalizeSession(data);
}

export async function uploadVideo(sessionId: number, file: File): Promise<UploadResponse> {
  const url = `${getBaseUrl()}/api/sessions/${sessionId}/upload`;
  const form = new FormData();
  form.append("file", file);
  const auth = await apiAuthHeaders();
  const res = await fetch(url, { method: "POST", headers: { ...auth }, body: form });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return parseJson<UploadResponse>(res);
}

export async function deleteSession(sessionId: number): Promise<void> {
  const url = `${getBaseUrl()}/api/sessions/${sessionId}`;
  const auth = await apiAuthHeaders();
  const res = await fetch(url, { method: "DELETE", headers: { ...auth } });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
}

export async function getSessionStatus(sessionId: number): Promise<SessionStatusResponse> {
  const url = `${getBaseUrl()}/api/sessions/${sessionId}/status`;
  const auth = await apiAuthHeaders();
  const res = await fetch(url, { cache: "no-store", headers: { ...auth } });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  const raw = await parseJson<unknown>(res);
  if (typeof raw !== "object" || raw === null) throw new ApiError("Invalid status payload", 500);
  const o = raw as Record<string, unknown>;
  const statusRaw = typeof o.status === "string" ? o.status : "pending";
  const status = isSessionStatus(statusRaw) ? statusRaw : "pending";
  return {
    session_id: Number(o.session_id),
    status,
    error: typeof o.error === "string" || o.error === null ? (o.error as string | null) : null,
    results_count: Number(o.results_count ?? 0),
  };
}

export async function getSessionResults(sessionId: number): Promise<AnalysisResult[]> {
  const url = `${getBaseUrl()}/api/sessions/${sessionId}/results`;
  const auth = await apiAuthHeaders();
  const res = await fetch(url, { cache: "no-store", headers: { ...auth } });
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  const data = await parseJson<unknown>(res);
  if (!Array.isArray(data)) throw new ApiError("Expected results array", 500);
  return data.map((item) => normalizeAnalysisResult(item));
}

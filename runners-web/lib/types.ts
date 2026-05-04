// runners-web/lib/types.ts

export type SessionStatusType =
  | "pending"
  | "processing"
  | "done"
  | "failed";

export interface HealthResponse {
  status: "ok" | "degraded";
  database: "up" | "down";
}

export interface MetricsResponse {
  angles: Record<string, number>;
  ground_contact_time_s: number | null;
  cadence_steps_per_min: number | null;
  distance_m: number | null;
}

export interface Session {
  id: number;
  user_id?: string | null;
  name: string | null;
  source: string | null;
  status: SessionStatusType;
  video_path: string | null;
  error_msg: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface SessionCreateBody {
  name?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface UploadResponse {
  job_id: number;
  status: "processing";
}

export interface SessionStatusResponse {
  session_id: number;
  status: SessionStatusType;
  error: string | null;
  results_count: number;
}

export interface AnalysisAngles {
  knee_left?: number;
  knee_right?: number;
  hip_left?: number;
  hip_right?: number;
  trunk?: number;
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface LivePayload {
  detected: boolean;
  angles: AnalysisAngles;
  landmarks: PoseLandmark[] | null;
}

export interface AnalysisResult {
  id: number;
  session_id: number;
  frame_index: number;
  timestamp_s: number | null;
  angles: AnalysisAngles;
  landmarks: PoseLandmark[] | null;
  ground_contact_time_s: number | null;
  cadence_steps_per_min: number | null;
  distance_m: number | null;
  created_at: string;
}

// runners-web/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { SessionStatusType } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function formatAngle(deg: number | null | undefined): string {
  if (deg === null || deg === undefined || !Number.isFinite(deg)) return "—";
  return `${deg.toFixed(1)}°`;
}

export function statusColor(status: SessionStatusType): string {
  switch (status) {
    case "pending":
      return "text-yellow-500 border-yellow-500/50";
    case "processing":
      return "text-blue-500 border-blue-500/50";
    case "done":
      return "text-green-600 border-green-600/40";
    case "failed":
      return "text-destructive border-destructive/50";
    default:
      return "text-muted-foreground border-border";
  }
}

export function isSessionStatus(value: string): value is SessionStatusType {
  return (
    value === "pending" ||
    value === "processing" ||
    value === "done" ||
    value === "failed"
  );
}

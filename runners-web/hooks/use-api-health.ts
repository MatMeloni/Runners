// runners-web/hooks/use-api-health.ts
"use client";

import { useHealth } from "@/lib/queries";

export function useApiHealth() {
  return useHealth();
}

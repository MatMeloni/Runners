// runners-web/app/sessions/[id]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function SessionDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

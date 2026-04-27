// runners-web/app/sessions/new/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function NewSessionLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

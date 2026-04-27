// runners-web/app/dashboard/error.tsx
"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Algo correu mal</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
        <Button type="button" onClick={reset}>
          Tentar novamente
        </Button>
      </CardFooter>
    </Card>
  );
}

// runners-web/app/sessions/error.tsx
"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SessionsError({
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
        <CardTitle>Erro ao carregar sessões</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="button" onClick={reset}>
          Tentar novamente
        </Button>
      </CardFooter>
    </Card>
  );
}

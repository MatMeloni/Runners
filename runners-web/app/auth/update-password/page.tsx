"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) {
        setError(updErr.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nova palavra-passe</CardTitle>
          <CardDescription>Defina a nova palavra-passe após abrir o link enviado por e-mail.</CardDescription>
        </CardHeader>
        <form onSubmit={(e) => void onSubmit(e)}>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="new-pw">Nova palavra-passe</Label>
              <Input
                id="new-pw"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A guardar…" : "Guardar"}
            </Button>
          </CardContent>
        </form>
        <CardFooter>
          <Link href="/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Voltar ao login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

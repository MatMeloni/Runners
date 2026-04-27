"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/update-password`,
      });
      if (resetErr) {
        setError(resetErr.message);
        return;
      }
      setMessage("Se o e-mail existir, receberá um link para redefinir a palavra-passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar palavra-passe</CardTitle>
          <CardDescription>Enviaremos um link para o e-mail associado à conta.</CardDescription>
        </CardHeader>
        <form onSubmit={(e) => void onSubmit(e)}>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="fp-email">E-mail</Label>
              <Input
                id="fp-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A enviar…" : "Enviar link"}
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

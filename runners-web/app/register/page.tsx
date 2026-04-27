"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });
      if (signErr) {
        setError(signErr.message);
        return;
      }
      setInfo("Se a confirmação por e-mail estiver ativa no Supabase, verifique a sua caixa de entrada.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Registo via Supabase Auth (mesmo projeto que a base de dados).</CardDescription>
      </CardHeader>
      <form onSubmit={(e) => void onSubmit(e)}>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="reg-email">E-mail</Label>
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Palavra-passe</Label>
            <Input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A criar…" : "Registar"}
          </Button>
        </CardContent>
      </form>
      <CardFooter className="text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="ml-1 font-medium text-foreground underline-offset-4 hover:underline">
          Entrar
        </Link>
      </CardFooter>
    </Card>
  );
}

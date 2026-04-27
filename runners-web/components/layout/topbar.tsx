"use client";

import { LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApiHealth } from "@/hooks/use-api-health";
import { createClient } from "@/lib/supabase/client";

export function Topbar() {
  const health = useApiHealth();
  const { setTheme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      void supabase.auth.getUser().then(({ data }) => {
        setEmail(data.user?.email ?? null);
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setEmail(session?.user?.email ?? null);
      });
      return () => {
        subscription.unsubscribe();
      };
    } catch {
      setEmail(null);
    }
  }, []);

  const apiReachable =
    Boolean(health.data) &&
    (health.data?.status === "ok" || health.data?.status === "degraded");

  const onLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* env em falta */
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
      <div className="text-sm text-muted-foreground lg:hidden" />
      <div className="hidden text-sm text-muted-foreground lg:block">Plataforma de análise de corrida</div>
      <div className="flex items-center gap-2">
        <Badge
          variant={apiReachable ? "default" : "destructive"}
          className={apiReachable ? "border-green-600/40 bg-green-600/15 text-green-600" : ""}
        >
          API {health.isFetching ? "…" : apiReachable ? "online" : "offline"}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="max-w-[140px] truncate text-xs">{email ?? "Conta"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              {email ?? "—"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void onLogout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative" aria-label="Tema">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>Claro</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>Escuro</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>Sistema</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

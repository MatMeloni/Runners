// runners-web/components/layout/sidebar.tsx
"use client";

import { Activity, BarChart3, GitCompare, LayoutDashboard, Menu, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessões", icon: Video },
  { href: "/compare", label: "Comparar treinos", icon: GitCompare },
  { href: "/metrics", label: "Métricas", icon: Activity },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-2">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate}>
            <span
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">Runners</span>
        </div>
        <ScrollArea className="flex-1 py-4">
          <NavLinks />
        </ScrollArea>
        <div className="border-t p-3 text-xs text-muted-foreground">Análise biomecânica sem marcadores</div>
      </aside>

      <div className="flex items-center border-b bg-card px-3 py-2 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-14 items-center gap-2 border-b px-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Runners</span>
            </div>
            <div className="py-4">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <span className="ml-2 font-semibold">Runners</span>
      </div>
    </>
  );
}

"use client";

import { useMemo, useState } from "react";

import { ComparisonSummary } from "@/components/sessions/comparison-summary";
import { SessionChartsPanel } from "@/components/sessions/session-charts-panel";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessions } from "@/lib/queries";

export default function ComparePage() {
  const q = useSessions("all");
  const doneSessions = useMemo(
    () => (q.data ?? []).filter((s) => s.status === "done"),
    [q.data]
  );
  const [idA, setIdA] = useState<string>("");
  const [idB, setIdB] = useState<string>("");

  const numA = idA ? Number(idA) : 0;
  const numB = idB ? Number(idB) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comparar Biomecânica entre Treinos</h1>
        <p className="text-sm text-muted-foreground">
          Selecione dois treinos processados para comparar ângulos articulares e métricas de marcha lado a lado.
          Identifique padrões e evolução entre sessões.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Treino A</Label>
          <Select value={idA || undefined} onValueChange={setIdA}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar sessão" />
            </SelectTrigger>
            <SelectContent>
              {doneSessions.map((s) => (
                <SelectItem key={s.id} value={String(s.id)} disabled={String(s.id) === idB}>
                  #{s.id} — {s.name ?? "sem nome"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Treino B</Label>
          <Select value={idB || undefined} onValueChange={setIdB}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar sessão" />
            </SelectTrigger>
            <SelectContent>
              {doneSessions.map((s) => (
                <SelectItem key={s.id} value={String(s.id)} disabled={String(s.id) === idA}>
                  #{s.id} — {s.name ?? "sem nome"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {doneSessions.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          Precisa de pelo menos duas sessões concluídas. Processe vídeos nas sessões e volte aqui.
        </p>
      ) : null}

      {numA > 0 && numB > 0 && numA !== numB ? (
        <>
          <ComparisonSummary sessionIdA={numA} sessionIdB={numB} />
          <div className="grid gap-6 xl:grid-cols-2">
            <SessionChartsPanel sessionId={numA} label="Treino A" />
            <SessionChartsPanel sessionId={numB} label="Treino B" />
          </div>
        </>
      ) : null}
    </div>
  );
}

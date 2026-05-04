// runners-web/components/metrics/improvement-tips.tsx
"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Tip {
  title: string;
  problem: string;
  impact: string;
  action: string;
}

// ---------------------------------------------------------------------------
// TIPS catalogue
// ---------------------------------------------------------------------------

export const TIPS = {
  kneeHigh: {
    title: "Joelho quase reto no apoio",
    problem: "Ângulo > 175° — extensão excessiva na fase de apoio.",
    impact: "Aumenta o impacto transmitido ao joelho e quadril.",
    action:
      "Mantenha uma leve flexão do joelho ao pousar. Tente não aterrar com a perna estendida.",
  },
  kneeLow: {
    title: "Joelho muito fletido no apoio",
    problem: "Ângulo < 150° — flexão excessiva ao tocar o solo.",
    impact: "Sobrecarrega o tendão patelar e a articulação do joelho.",
    action:
      "Encurte a passada e aumente a cadência. Pouse mais próximo do centro de gravidade.",
  },
  cadenceLow: {
    title: "Cadência abaixo do ideal",
    problem: "< 160 passos/min — passadas longas e lentas.",
    impact: "Maior impacto por passada e maior risco de lesão por sobrecarga.",
    action:
      "Dê passos mais curtos e rápidos. Use um metrônomo a 170 bpm como referência de treino.",
  },
  cadenceHigh: {
    title: "Cadência acima do ideal",
    problem: "> 200 passos/min — ritmo muito elevado.",
    impact: "Pode indicar passadas muito curtas ou sobrecarga muscular.",
    action:
      "Verifique o comprimento da passada. Reduza ligeiramente a frequência sem perder fluidez.",
  },
  gctHigh: {
    title: "Tempo de contato longo",
    problem: "> 250 ms no solo — fase de apoio prolongada.",
    impact: "Reduz a eficiência de corrida e aumenta a fadiga muscular.",
    action:
      "Foque em elevar o pé do chão rapidamente após o apoio. Imagine o solo como uma superfície quente.",
  },
} satisfies Record<string, Tip>;

// ---------------------------------------------------------------------------
// buildTips — derives which tips apply based on metric values
// ---------------------------------------------------------------------------

export function buildTips(
  avgKnee: number | null,
  cadence: number | null | undefined,
  gctMs: number | null,
): Tip[] {
  const tips: Tip[] = [];
  if (avgKnee !== null && avgKnee > 175) tips.push(TIPS.kneeHigh);
  if (avgKnee !== null && avgKnee < 150) tips.push(TIPS.kneeLow);
  if (cadence != null && cadence < 160) tips.push(TIPS.cadenceLow);
  if (cadence != null && cadence > 200) tips.push(TIPS.cadenceHigh);
  if (gctMs !== null && gctMs > 250) tips.push(TIPS.gctHigh);
  return tips;
}

// ---------------------------------------------------------------------------
// HealthBadge
// ---------------------------------------------------------------------------

export function HealthBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "ml-1 rounded-full px-2 py-0.5 text-xs font-medium",
        ok
          ? "bg-green-500/15 text-green-600"
          : "bg-yellow-500/15 text-yellow-600",
      )}
    >
      {ok ? "Bom" : "Atenção"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ImprovementTip card
// ---------------------------------------------------------------------------

export function ImprovementTip({ title, problem, impact, action }: Tip) {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50/60 p-4 dark:border-yellow-900/40 dark:bg-yellow-950/20">
      <p className="mb-1 text-sm font-semibold text-yellow-800 dark:text-yellow-300">
        {title}
      </p>
      <p className="text-xs text-muted-foreground">
        {problem} {impact}
      </p>
      <p className="mt-2 text-xs font-medium text-foreground">
        <span className="text-yellow-700 dark:text-yellow-400">Dica: </span>
        {action}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImprovementTipsList — convenience wrapper
// ---------------------------------------------------------------------------

export function ImprovementTipsList({ tips }: { tips: Tip[] }) {
  if (tips.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Dicas de melhoria</p>
      {tips.map((tip) => (
        <ImprovementTip key={tip.title} {...tip} />
      ))}
    </div>
  );
}

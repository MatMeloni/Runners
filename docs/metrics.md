# Métricas Biomecânicas

Definição das métricas calculadas pelo sistema e sua interpretação para prevenção de lesões e performance.

## Ângulos articulares

Calculados a partir dos landmarks do MediaPipe Pose (coordenadas normalizadas).

| Métrica | Definição | Unidade | Interpretação |
|---------|-----------|---------|---------------|
| **Joelho (esq./dir.)** | Ângulo quadril–joelho–tornozelo | graus (°) | Flexão excessiva ou rigidez; valgo dinâmico (colapso medial) aumenta risco de lesão. |
| **Quadril (esq./dir.)** | Ângulo ombro–quadril–joelho | graus (°) | Extensão/flexão do quadril; importante para potência e economia de corrida. |
| **Tronco** | Inclinação do tronco em relação à vertical | graus (°) | Inclinação excessiva para frente ou para trás pode indicar desequilíbrio ou overstriding. |

## Tempo de contato com o solo (GCT)

- **Definição:** Tempo em que o pé permanece em contato com o solo em cada passada.
- **Unidade:** segundos (s).
- **Interpretação:** GCT típico em corrida ~0,20–0,30 s. Valores muito altos podem indicar passada lenta ou sobrecarga; muito baixos, possível corrida em ponta dos pés ou alta cadência.

*Nota: a implementação atual usa heurística/stub; refinamento futuro com detecção de eventos de toque e saída do pé.*

## Cadência

- **Definição:** Número de passos por minuto (ambos os pés).
- **Unidade:** passos/min.
- **Interpretação:** Faixa comum 160–190 passos/min. Cadência baixa pode estar associada a overstriding e maior risco de lesão; aumento moderado costuma melhorar economia e reduzir pico de carga.

*Nota: cálculo atual é stub; em produção usar detecção de ciclos de passada (ex.: picos de joelho/quadril).*

## Distância percorrida

- **Definição:** Estimativa da distância percorrida com base em número de passos e comprimento de passada (ou duração e cadência).
- **Unidade:** metros (m).
- **Interpretação:** Útil para volume de treino; requer calibração (comprimento de passada ou fator de escala) para maior precisão.

*Nota: implementação atual é placeholder; calibrar com dados reais ou GPS/esteira.*

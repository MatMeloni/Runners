# Runners — Resposta aos Critérios de Avaliação do MVP

> Documento de referência para a apresentação do MVP. Responde objetivamente a cada critério avaliativo.

---

## [0/1] É um MVP?

**Sim.** O Runners é um Produto Mínimo Viável funcional que atende à premissa central: permitir que corredores amadores capturem e analisem a biomecânica da sua corrida sem precisar de equipamentos profissionais ou consulta presencial com um especialista.

O sistema opera de ponta a ponta:

1. O utilizador cria uma conta e faz login via Supabase Auth.
2. Faz upload de um vídeo de corrida (ou usa a câmara ao vivo).
3. O backend processa o vídeo com MediaPipe (33 landmarks corporais) e calcula ângulos articulares, cadência e tempo de contato com o solo.
4. O dashboard apresenta os resultados com interpretação automática (bom / atenção) e gráficos.
5. É possível comparar duas sessões distintas para identificar evolução.

Todas as funcionalidades centrais estão implementadas e acessíveis no browser, sem instalação local.

---

## [1] Definição de Problema do Usuário

**Problema:** A maioria dos corredores amadores treina sem qualquer feedback biomecânico sobre a sua técnica de corrida. Erros de postura, cadência baixa e tempo de contato excessivo com o solo — os principais fatores de lesão e ineficiência — são invisíveis a olho nu e só identificáveis com equipamentos profissionais caros (análise em laboratório, sensores de força, câmeras de alta velocidade) ou com um treinador especializado.

**Consequência direta:** O corredor continua a reproduzir os mesmos padrões incorretos treino após treino, acumulando risco de lesão (joelho de corredor, canelite, fascite plantar) sem ter dados objetivos para mudar o comportamento.

**Quem sofre:** Corredores recreativos e semiprofissionais que não têm acesso a análise biomecânica especializada e não sabem se a sua técnica é eficiente ou lesiva.

---

## [1] Definição de Hipótese de Valor

**Hipótese:** Se fornecer a corredores amadores uma análise biomecânica automatizada, visual e interpretada — diretamente a partir de um vídeo enviado pelo telemóvel — então eles conseguirão identificar e corrigir problemas de técnica de corrida de forma autónoma, reduzindo o risco de lesão e melhorando a eficiência, sem precisar de equipamentos especializados ou consulta presencial.

**Resultado esperado mensurável:**
- O utilizador identifica, em menos de 2 minutos após o upload do vídeo, se a sua cadência está dentro do intervalo ideal (160–190 spm).
- O utilizador consegue comparar duas sessões e verificar se houve melhoria nos ângulos do joelho.

---

## [1] Aderência aos Conceitos de MVP

| Princípio de MVP | Como o Runners aplica |
|---|---|
| **Solução mínima que entrega valor real** | O núcleo é upload de vídeo → análise automática → resultado interpretado. Sem funcionalidades acessórias. |
| **Aprender com utilizadores reais** | Sessões são persistidas por utilizador; é possível observar padrões de uso e quais métricas são mais consultadas. |
| **Validar a hipótese antes de escalar** | O MVP não inclui IA generativa, planos de treino personalizados nem hardware. Apenas valida: "o utilizador entende e age sobre os dados?" |
| **Iterar rapidamente** | Stack moderna (Next.js + FastAPI + Supabase) permite deploy contínuo via Vercel + Docker/ngrok. |
| **Evitar over-engineering** | Autenticação simplificada (fallback para demo UUID), sem microserviços, sem fila de processamento — só o essencial. |

---

## [2] Valor Agregado Imediato

O utilizador obtém valor **logo após o primeiro upload de vídeo**, sem curva de aprendizagem:

### Dashboard — Indicadores com diagnóstico automático

- **Cadência média** com badge **"Bom"** (verde, 160–190 spm) ou **"Atenção"** (amarelo, fora do intervalo).
- **GCT médio** (tempo de contato com o solo) com badge e referência: abaixo de 250 ms é eficiente.
- **Ângulo médio do joelho** com badge e referência: 150–175° no apoio é o ideal.

### Detalhe da sessão — Diagnóstico textual

Ao abrir qualquer sessão concluída, o utilizador vê um **bloco de diagnóstico automático**:

> *"Cadência dentro do ideal ✓ (172.3 spm). Tempo de contato com o solo eficiente ✓ (218 ms)."*

ou

> *"Cadência abaixo do ideal ⚠ (148.0 spm). Tempo de contato acima do ideal ⚠ (310 ms)."*

Não é necessário saber o que significa 172 spm. O sistema interpreta e comunica.

### Gráfico de ângulos — Zona ideal visualizada

O gráfico de ângulos articulares exibe uma **zona verde entre 150° e 175°** (intervalo ideal do joelho no apoio), com labels nas linhas de referência. O utilizador vê imediatamente se a curva do joelho fica dentro ou fora da zona segura.

---

## [2] Funcionamento

O sistema está **operacional de ponta a ponta**:

### Fluxo validado

```
Utilizador faz upload de vídeo (MP4)
  → Backend FastAPI recebe e guarda o ficheiro
  → Pipeline MediaPipe extrai 33 landmarks por frame
  → Cálculo de ângulos articulares (joelho, anca, tronco)
  → Cálculo de cadência e GCT (gait metrics)
  → Resultados guardados no PostgreSQL (Supabase)
  → Frontend Next.js exibe dashboard + gráficos + diagnóstico
```

### Funcionalidades testadas

| Funcionalidade | Estado |
|---|---|
| Registo e login (Supabase Auth) | ✅ Funcional |
| Upload de vídeo e processamento | ✅ Funcional |
| Análise ao vivo (WebSocket + câmara) | ✅ Funcional |
| Dashboard com KPIs e badges | ✅ Funcional |
| Gráfico de ângulos com zona de referência | ✅ Funcional |
| Diagnóstico automático por sessão | ✅ Funcional |
| Comparação entre sessões | ✅ Funcional |
| Player de vídeo com overlay de esqueleto | ✅ Funcional |
| Exportação CSV dos dados brutos | ✅ Funcional |

### Infraestrutura

- **Backend:** FastAPI + Uvicorn em Docker, exposto via ngrok (demo) ou deploy próprio.
- **Frontend:** Next.js 14 em Vercel (deploy contínuo a cada push).
- **Base de dados:** PostgreSQL gerida pelo Supabase (cloud, sem manutenção local).

---

## [2] Clareza na Demonstração do Conceito

### O que o utilizador vê e entende imediatamente

1. **Landing page** — Problema declarado ("Você sabe se está a correr bem?"), hipótese de valor e 3 benefícios concretos (upload, análise ao vivo, comparação).

2. **Dashboard** — 4 KPIs com badges coloridos e footers explicativos. Sem jargão técnico. O badge "Bom / Atenção" comunica o diagnóstico sem exigir conhecimento prévio.

3. **Detalhe da sessão** — Título é o nome da sessão (ex: "Treino manhã"), não "Sessão #3". Bloco de diagnóstico no topo. Cards com referências. Botão direto para comparação.

4. **Gráfico de ângulos** — Zona verde visível, labels nas linhas, tooltip com valores exatos ao clicar em qualquer frame.

5. **Player de vídeo com esqueleto** — No dashboard, o vídeo da sessão mais recente toca em loop com o overlay do esqueleto MediaPipe sincronizado, mostrando a análise em ação de forma visual e imediata.

### Roteiro de demonstração (2 minutos)

| Passo | O que mostrar |
|---|---|
| 1 | Landing page — problema e proposta de valor |
| 2 | Login e dashboard — badges de saúde, KPIs, player com esqueleto |
| 3 | Abrir sessão → diagnóstico automático + gráfico com zona verde |
| 4 | Página de comparação — dois treinos lado a lado |
| 5 | Upload de novo vídeo → aguardar processamento → ver resultado |

---

## [1] Visão de Futuro

O MVP valida o conceito. As próximas iterações, baseadas no feedback dos utilizadores, incluem:

### Curto prazo (próximo sprint)
- **Autenticação WebSocket** — Segurança end-to-end na análise ao vivo.
- **Relatório PDF** — Exportar análise formatada para partilhar com treinador.
- **Thresholds personalizáveis** — Permitir que o utilizador defina os seus próprios valores de referência.

### Médio prazo
- **Análise de assimetria** — Detetar diferenças significativas entre lado esquerdo e direito (risco de lesão por desequilíbrio).
- **Progresso ao longo do tempo** — Gráfico de evolução das métricas entre sessões (cadência semana a semana).
- **Integração com Strava / Garmin** — Correlacionar dados biomecânicos com dados de GPS e frequência cardíaca.

### Longo prazo
- **Modelo de ML próprio** — Substituir heurísticas de GCT e cadência por um modelo treinado com dados reais de corrida.
- **App móvel** — Captura e análise diretamente no telemóvel, sem necessidade de computador.
- **Modo coach** — Treinador acede às sessões de múltiplos atletas numa única interface.

---

*Documento gerado para apoio à apresentação do MVP — Runners © 2026*

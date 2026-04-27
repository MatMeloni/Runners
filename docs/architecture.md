# Arquitetura do Projeto Runners

## Visão geral

O sistema de monitoramento biomecânico de corrida segue um fluxo **captura → processamento → análise → API → persistência e frontends**.

```mermaid
flowchart LR
  subgraph capture [capture]
    Webcam[Webcam]
    File[Arquivo]
  end
  subgraph processing [processing]
    Pipeline[Pipeline]
    Pose[Pose MediaPipe]
  end
  subgraph analysis [analysis]
    Angles[Angulação]
    Cadence[Cadência]
    GCT[Contato Solo]
  end
  subgraph backend [Backend]
    API[FastAPI]
    DB[(PostgreSQL)]
  end
  subgraph clients [Clients]
    NextWeb[Next runners-web]
    Streamlit[Streamlit]
  end
  capture --> processing
  processing --> analysis
  analysis --> API
  API --> DB
  API --> NextWeb
  API --> Streamlit
```

## Componentes

| Componente | Descrição |
|------------|-----------|
| **capture** | Fontes de vídeo: webcam (OpenCV `VideoCapture`) ou arquivo. Abstração comum: `read()` / `frames()`. |
| **processing** | Converte frame BGR → RGB, executa MediaPipe Pose, desenha esqueleto e retorna landmarks normalizados. |
| **analysis** | Cálculo de ângulos (joelho, quadril, tronco), tempo de contato com o solo (GCT), cadência e distância. |
| **api** | FastAPI: health check, endpoint de métricas (stub ou real), CRUD de sessões. Persistência em PostgreSQL. |
| **runners-web** | Next.js: dashboard, sessões, upload de vídeo, gráficos e métricas ao vivo (consome a API no browser). |
| **streamlit** | Prototipagem com seleção de fonte e exibição de métricas. |

## Fluxo de dados

1. **Vídeo** é lido por `src/capture` (webcam ou arquivo).
2. Cada **frame** é passado ao **pipeline** (`src/processing`), que retorna frame anotado e lista de landmarks.
3. Os **landmarks** são usados por `src/analysis` para calcular ângulos (por frame) e métricas de marcha (por sequência de frames).
4. A **API** expõe métricas e sessões; o **Next.js** (`runners-web`) consome a API via HTTP a partir do cliente; o **Streamlit** pode rodar o pipeline localmente para prototipagem.

## Configuração

Arquivos em `config/` (ex.: `default.yaml`) definem câmera, parâmetros do MediaPipe e métricas habilitadas. O loader em `src/utils/config_loader.py` carrega esses ficheiros.

## Deploy

- **Local:** venv, `uvicorn api.main:app`, `streamlit run streamlit_app/app.py`, `npm run dev` em `runners-web` (com `NEXT_PUBLIC_API_URL` a apontar para a API).
- **Docker:** `docker compose up` sobe **api**, **streamlit** e **web** (Next). O browser acede à API em `localhost:<API_PORT>`; o `CORS_ORIGINS` na raiz deve incluir a origem do Next (ex.: `http://localhost:3000`). Ver comentários em `docker-compose.yml` e secção Docker no `README.md`.

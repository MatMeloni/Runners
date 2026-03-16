# Runners

Monitoramento em tempo real da **biomecânica de corrida** usando visão computacional. O sistema transforma qualquer câmera em um sensor biomecânico: estimativa de pose (MediaPipe), métricas de angulação, cadência, tempo de contato com o solo e distância, com backend FastAPI, persistência em PostgreSQL e dashboards em React e Streamlit.

## O problema e a solução

- **Problema:** Análise biomecânica precisa hoje está restrita a laboratórios caros (sensores inerciais, câmeras infravermelhas) ou à análise subjetiva de treinadores, imprecisa em movimentos de alta velocidade.
- **Solução:** Usar algoritmos de Pose Estimation para transformar uma câmera comum em um sensor virtual: o sistema interpreta a geometria do movimento em tempo (quase) real e entrega métricas para prevenção de lesões e otimização de performance.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Visão | Python, MediaPipe (pose), OpenCV (imagem) |
| Métricas | Ângulos (joelho, quadril, tronco), tempo de contato, cadência, distância |
| Frontend | React (dashboard), Streamlit (prototipagem) |
| Backend | FastAPI, PostgreSQL |
| Ambiente | Docker, Docker Compose |

## Estrutura do projeto

```
Runners/
├── src/
│   ├── capture/      # Captura de vídeo (webcam, arquivo)
│   ├── processing/   # Pipeline de imagem e pose (MediaPipe)
│   ├── analysis/     # Métricas biomecânicas
│   └── utils/        # Constantes e helpers
├── api/              # FastAPI (rotas, DB)
├── config/           # Configuração (YAML/JSON)
├── data/
│   ├── videos/       # Vídeos de teste
│   └── models/       # Modelos (se houver)
├── docs/             # Documentação técnica
├── frontend/         # App React (dashboard)
├── streamlit_app/    # App Streamlit (prototipagem)
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

## Pré-requisitos

- Python 3.11+
- Node.js (para o frontend React)
- PostgreSQL (local ou via Docker)
- Opcional: Docker e Docker Compose para rodar tudo em containers

## Execução local

1. **Ambiente Python**

   ```bash
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   # source .venv/bin/activate   # Linux/macOS
   pip install -r requirements.txt
   ```

2. **Variáveis de ambiente**

   Copie `.env.example` para `.env` e ajuste (por exemplo `DATABASE_URL` para o PostgreSQL).

3. **PostgreSQL**

   Suba um banco (local ou só o serviço `db` com `docker-compose up -d db`) e crie o schema se necessário (veja `api/` e `docs/`).

4. **API**

   ```bash
   uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Streamlit (prototipagem)**

   ```bash
   streamlit run streamlit_app/app.py
   ```

6. **Frontend React**

   ```bash
   cd frontend && npm install && npm run dev
   ```

## Execução com Docker

```bash
cp .env.example .env
docker-compose up --build
```

- API: http://localhost:8000  
- Docs da API: http://localhost:8000/docs  
- Streamlit (se configurado no compose): http://localhost:8501  

## Próximos passos

- Ajuste de heurísticas para tempo de contato com o solo (GCT).
- Integração em tempo real no React (ex.: WebSocket).
- Calibração para estimativa de distância percorrida.

## Licença

Uso conforme repositório do projeto.

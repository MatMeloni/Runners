# CLAUDE.md — Runners

Documentação técnica de referência para desenvolvimento assistido por IA. Descreve a arquitetura, convenções, comandos e estado atual do projeto.

---

## Visão Geral

**Runners** é uma plataforma de análise biomecânica de corrida em tempo real. O sistema captura vídeo (webcam ou arquivo), extrai landmarks corporais com MediaPipe, calcula métricas biomecânicas (ângulos articulares, tempo de contato com solo, cadência, distância) e expõe esses dados via API REST + WebSocket para um dashboard web.

**Repositório:** `matmeloni/runners`  
**Linguagens principais:** Python 3.11, TypeScript  
**Status:** Em desenvolvimento ativo

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Visão computacional | MediaPipe PoseLandmarker, OpenCV |
| Backend API | FastAPI, SQLAlchemy, Alembic, Uvicorn |
| Banco de dados | PostgreSQL via Supabase |
| Autenticação | Supabase Auth + JWT |
| Frontend | Next.js 14 (App Router), TypeScript |
| Estilização | Tailwind CSS, shadcn/ui, Radix UI |
| State/Fetch | TanStack React Query v5 |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Prototipagem | Streamlit |
| Containers | Docker + Docker Compose |
| Testes (Python) | pytest, pytest-asyncio, httpx |

---

## Estrutura do Repositório

```
Runners/
├── api/                    # Backend FastAPI
│   ├── main.py             # Entry point, CORS, registro de routers
│   ├── config.py           # Carrega .env (obrigatório, sem defaults)
│   ├── database.py         # Modelos SQLAlchemy + init do banco
│   ├── auth.py             # Validação JWT Supabase
│   ├── controllers/        # Lógica de negócio
│   ├── routers/            # Endpoints HTTP e WebSocket
│   └── schemas/            # Modelos Pydantic
│
├── runners-web/            # Frontend Next.js 14
│   ├── app/                # App Router (layout, páginas)
│   ├── components/         # Componentes React reutilizáveis
│   ├── lib/                # Utilitários (API client, hooks, tipos)
│   └── hooks/              # Custom React hooks
│
├── src/                    # Módulos Python de visão computacional
│   ├── capture/            # Entrada de vídeo (webcam, arquivo)
│   ├── processing/         # Pipeline MediaPipe
│   ├── analysis/           # Cálculo de métricas biomecânicas
│   └── utils/              # Helpers (geometria, overlay, constantes)
│
├── streamlit_app/          # Protótipo Streamlit
├── migrations/             # Migrações Alembic
├── config/                 # Configuração YAML da aplicação
├── scripts/                # Scripts de desenvolvimento
├── tests/                  # Suite pytest
├── docs/                   # Documentação técnica Markdown
├── Documentação/           # PDFs: pitch e documentação de engenharia
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── alembic.ini
```

---

## Configuração do Ambiente

### Variáveis de Ambiente (`.env` na raiz — **obrigatório**)

```bash
# API
API_HOST=127.0.0.1
API_PORT=8000
DATABASE_URL=postgresql://postgres:[senha]@db.[projeto].supabase.co:5432/postgres
CORS_ORIGINS=http://localhost:3000
SUPABASE_JWT_SECRET=<jwt-secret-do-supabase>

# Frontend (também necessário em runners-web/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://[projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Portas (Docker)
WEB_PORT=3000
STREAMLIT_PORT=8501
```

**Supabase → Project Settings → Database → Connection string (Transaction pooler, porta 6543)** em redes sem IPv6.

### `runners-web/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://[projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## Comandos de Desenvolvimento

### Backend (FastAPI)

```bash
# Instalar dependências Python
pip install -r requirements.txt

# Iniciar API com hot reload
python scripts/run_api_dev.py

# Migrações
alembic upgrade head
alembic revision --autogenerate -m "descrição"

# Testes
pytest
pytest -m unit
pytest -m integration
```

### Frontend (Next.js)

```bash
cd runners-web

# Instalar dependências
npm install

# Dev server
npm run dev           # http://localhost:3000

# Build
npm run build
npm run start

# Lint e type check
npm run lint
npx tsc --noEmit
```

### Webcam ao Vivo (sem frontend)

```bash
python scripts/run_webcam_live.py
# Janela OpenCV com overlay de métricas em tempo real
# Q para sair
```

### Docker Compose

```bash
# Subir todos os serviços
docker-compose up --build

# Apenas API
docker-compose up api

# Parar
docker-compose down
```

---

## Arquitetura e Fluxos

### Fluxo de Análise de Vídeo

```
Webcam / Arquivo
       ↓
  src/capture/      (VideoCapture → frames generator)
       ↓
  src/processing/   (MediaPipe PoseLandmarker → 33 landmarks)
       ↓
  src/analysis/     (ângulos articulares + métricas de marcha)
       ↓
  api/routers/      (REST /api/sessions + WebSocket /ws/live)
       ↓
  Supabase DB       (sessions + analysis_results)
       ↓
  runners-web/      (Dashboard + Gráficos + Análise ao Vivo)
```

### WebSocket Real-Time (`/ws/live`)

- Cliente envia frame base64 → Servidor retorna ângulos JSON
- MediaPipe inicializado lazy (thread-safe)
- Usado na rota `/(main)/live` do frontend

### Autenticação

- Supabase Auth (email/senha, OAuth)
- JWT validado em `api/auth.py` via `SUPABASE_JWT_SECRET`
- Frontend: `@supabase/ssr` + middleware Next.js para proteger rotas `/(main)/*`
- Callback OAuth em `/auth/callback`

---

## Modelos de Dados

### `sessions`

| Campo | Tipo | Descrição |
|---|---|---|
| id | integer PK | |
| user_id | UUID | FK para Supabase auth.users |
| name | string(255) | Nome da sessão |
| source | string(255) | "webcam" ou nome do arquivo |
| status | enum | pending / processing / done / failed |
| video_path | text | Caminho local do arquivo de vídeo |
| error_msg | text | Mensagem de erro se falhou |
| metadata | JSON | Dados extras arbitrários |
| created_at | datetime | |

### `analysis_results`

| Campo | Tipo | Descrição |
|---|---|---|
| id | integer PK | |
| session_id | FK → sessions | CASCADE delete |
| frame_index | integer | Índice do frame |
| timestamp_s | float | Tempo em segundos |
| angles | JSONB | knee_left, knee_right, hip_left, hip_right, trunk |
| ground_contact_time_s | float | GCT em segundos |
| cadence_steps_per_min | float | Passos por minuto |
| distance_m | float | Distância estimada em metros |
| created_at | datetime | |

---

## API Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/health` | Não | Health check + DB |
| GET | `/api/metrics` | Sim | Métricas da última sessão |
| GET | `/api/sessions` | Sim | Listar sessões do usuário |
| POST | `/api/sessions` | Sim | Criar nova sessão |
| GET | `/api/sessions/{id}` | Sim | Detalhe da sessão |
| DELETE | `/api/sessions/{id}` | Sim | Deletar sessão |
| POST | `/api/sessions/{id}/upload` | Sim | Upload de vídeo (processa em background) |
| GET | `/api/sessions/{id}/status` | Sim | Status do processamento |
| GET | `/api/sessions/{id}/results` | Sim | Resultados da análise |
| WS | `/ws/live` | — | Análise em tempo real frame a frame |

Swagger UI disponível em `http://localhost:8000/docs`.

---

## Métricas Biomecânicas

### Ângulos Articulares (graus)

- **Ângulo do joelho** — hip → knee → ankle (flexão/extensão, detecta valgo)
- **Ângulo do quadril** — shoulder → hip → knee
- **Ângulo do tronco** — inclinação relativa à vertical

### Métricas de Marcha

- **GCT (Ground Contact Time)** — Duração do contato do pé com o solo (~0.2–0.3s ideal)
- **Cadência** — Passos por minuto (160–190 típico para corrida eficiente)
- **Distância** — Estimativa por contagem de passadas × comprimento médio

---

## Rotas do Frontend

| Rota | Proteção | Descrição |
|---|---|---|
| `/` | Não | Landing page |
| `/login` | Não | Login Supabase |
| `/register` | Não | Cadastro |
| `/auth/callback` | Não | Callback OAuth Supabase |
| `/(main)/dashboard` | Sim | Dashboard principal |
| `/(main)/sessions` | Sim | Lista de sessões |
| `/(main)/sessions/[id]` | Sim | Detalhe da sessão |
| `/(main)/metrics` | Sim | Exibição de métricas |
| `/(main)/live` | Sim | Análise ao vivo (WebSocket) |
| `/(main)/compare` | Sim | Comparação entre sessões |

---

## Convenções de Código

### Python (Backend / CV)
- Formatação: **black** + **ruff**
- Type hints obrigatórios em funções públicas
- Nenhum default hardcoded em `config.py` — tudo via `.env`
- Controllers contêm lógica de negócio; Routers apenas fazem dispatch
- Modelos MediaPipe baixados automaticamente para `data/models/`

### TypeScript (Frontend)
- App Router do Next.js 14 (sem Pages Router)
- Componentes em `components/`, utilitários em `lib/`
- `lib/api.ts` — cliente HTTP centralizado para chamadas ao backend
- `lib/queries.ts` — hooks React Query para todos os endpoints
- `lib/types.ts` — tipos TypeScript compartilhados
- Validação de formulários com Zod + React Hook Form

### Git
- Branch de desenvolvimento: `claude/validate-project-docs-Rc8FI`
- Commits em inglês, mensagens descritivas
- `.env`, `.env.local`, `data/videos/`, `data/models/` estão no `.gitignore`

---

## Configuração YAML (`config/default.yaml`)

```yaml
camera:
  camera_index: 0
  width: 1280
  height: 720
  fps: 30
pose:
  model_complexity: 1      # 0 (leve) | 1 (balanceado) | 2 (preciso)
  min_detection_confidence: 0.5
  min_tracking_confidence: 0.5
output:
  fps: 30
  draw_landmarks: true
analysis:
  enabled_metrics:
    - angles
    - cadence
    - ground_contact_time
    - distance
```

---

## Docker

### Serviços (`docker-compose.yml`)

| Serviço | Porta | Descrição |
|---|---|---|
| api | `API_PORT` (8000) | FastAPI Uvicorn |
| streamlit | `STREAMLIT_PORT` (8501) | Protótipo Streamlit |
| web | `WEB_PORT` (3000) | Next.js produção |

Nenhum PostgreSQL local — todos os serviços conectam ao Supabase via `DATABASE_URL`.

### Dockerfile (Python)

- Base: `python:3.11-slim`
- Dependências de sistema para MediaPipe OpenGL ES: `libgl1`, `libgles2`, `libegl1`
- Copia: `src/`, `api/`, `config/`, `streamlit_app/`

---

## Pontos de Atenção / Débito Técnico

1. **GCT e Cadência** — Implementações em `src/analysis/gait_metrics.py` são aproximações baseadas em heurísticas. Precisam de refinamento com dados reais de corrida.

2. **Autenticação WebSocket** — `/ws/live` não valida JWT atualmente. Adicionar autenticação antes de produção.

3. **IPv6 / Supabase** — Em redes sem suporte a IPv6, usar Transaction Pooler na porta 6543 (não a string de conexão direta).

4. **`next.config.mjs`** — Usa `@next/env` com interop CJS para carregar `.env` da raiz. Não alterar o padrão de importação sem testar o build.

5. **MediaPipe lazy load** — O `routers/live.py` inicializa OpenCV, NumPy e MediaPipe em runtime (primeiro WebSocket) para evitar tempo de startup. Thread-safe via Lock.

6. **Upload de vídeo** — Processamento acontece em background thread após o upload. Status acompanhado via polling em `GET /api/sessions/{id}/status`.

---

## Testes

```
tests/
├── unit/         # Testes unitários (sem DB, sem rede)
└── integration/  # Testes de integração (mock DB via httpx AsyncClient)
```

Executar com:

```bash
pytest                    # todos
pytest -m unit            # apenas unitários
pytest -m integration     # apenas integração
pytest -v --tb=short      # verbose com traceback curto
```

---

## Documentação de Referência

- `docs/architecture.md` — Diagrama de componentes e fluxo de dados
- `docs/api.md` — Referência completa de endpoints
- `docs/metrics.md` — Definições e interpretações das métricas biomecânicas
- `docs/postman-e-supabase.md` — Configuração Postman + troubleshooting Supabase
- `Documentação/` — PDFs: apresentação de pitch e documentação de engenharia N1

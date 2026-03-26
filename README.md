# Runners

Monitoramento em tempo real da **biomecânica de corrida** usando visão computacional. O sistema transforma qualquer câmera em um sensor biomecânico: estimativa de pose (MediaPipe), métricas de angulação, cadência, tempo de contato com o solo e distância, com backend FastAPI, persistência no **Supabase** (PostgreSQL gerenciado) e dashboards em React e Streamlit.

## Configuração obrigatória (`.env`)

**Não há valores padrão de configuração no código.** Tudo vem do arquivo **`.env`** na raiz do repositório.

1. No [Supabase](https://supabase.com), crie um projeto e abra **Project Settings → Database**.
2. Copie a **Connection string** no formato **URI** (Session mode ou Transaction pooler costuma funcionar bem com apps em Python).
3. Copie o modelo e edite:

   ```bash
   cp .env.example .env
   ```

4. Cole a URI em **`DATABASE_URL`** no `.env` e preencha o restante conforme `.env.example` (API, CORS, Vite, Streamlit).

O Supabase expõe **PostgreSQL** na nuvem; o app usa essa URI com SQLAlchemy (`psycopg2`), sem container Postgres neste repositório.

## Pré-requisitos

- Python 3.11+
- Node.js (frontend)
- Projeto Supabase com `DATABASE_URL` válida (rede/DNS precisam alcançar o host da URI)

## Como rodar (local)

Na **raiz** do repositório, com o `.env` já criado e `DATABASE_URL` do Supabase:

### 1. Backend (FastAPI)

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python scripts/run_api_dev.py
```

- API: `http://localhost:<API_PORT>` (ex.: `8000`)
- Swagger: `http://localhost:<API_PORT>/docs`

### 2. Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

O Vite lê o **`.env` na raiz** (`VITE_*` e `API_BASE_URL`). Dashboard: `http://localhost:<VITE_PORT>`.

### 3. Streamlit (opcional, sem Docker)

```bash
streamlit run streamlit_app/app.py --server.port <STREAMLIT_PORT>
```

Garanta que o processo herde o `.env` (mesma `DATABASE_URL` do Supabase).

## Como rodar com Docker Compose

O Compose sobe **API** e **Streamlit**; o banco é sempre o do **Supabase** via `DATABASE_URL` no `.env`.

```bash
docker compose up --build
```

- API: `http://localhost:<API_PORT>`
- Streamlit: `http://localhost:<STREAMLIT_PORT>`

## Estrutura do projeto

```
Runners/
├── api/
├── scripts/run_api_dev.py
├── frontend/
├── src/
├── streamlit_app/
├── docs/
├── .env.example
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

Postman e detalhes da URI: `docs/postman-e-supabase.md`.

### Se a API não conecta ao Supabase (`could not translate host name`)

A URI **Direct** pode ser só IPv6. Use **Transaction pooler** (porta 6543) no painel do Supabase e atualize `DATABASE_URL`. Ver `docs/postman-e-supabase.md`.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Visão | Python, MediaPipe, OpenCV |
| Frontend | React (Vite) |
| Backend | FastAPI |
| Dados | Supabase (Postgres) |

## Licença

Uso conforme repositório do projeto.

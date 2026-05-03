# Runners

Monitoramento em tempo real da **biomecânica de corrida** usando visão computacional. O sistema transforma qualquer câmera em um sensor biomecânico: estimativa de pose (MediaPipe), métricas de angulação, cadência, tempo de contato com o solo e distância, com backend FastAPI, persistência no **Supabase** (PostgreSQL gerenciado), interface **Next.js** (`runners-web`) e prototipagem em Streamlit.

## Configuração obrigatória (`.env`)

**Não há valores padrão de configuração no código.** Tudo vem do arquivo **`.env`** na raiz do repositório.

1. No [Supabase](https://supabase.com), crie um projeto e abra **Project Settings → Database**.
2. Copie a **Connection string** no formato **URI** (Session mode ou Transaction pooler costuma funcionar bem com apps em Python).
3. Copie o modelo e edite:

   ```bash
   cp .env.example .env
   ```

4. Cole a URI em **`DATABASE_URL`** no `.env` e preencha o restante conforme `.env.example` (API, CORS, Streamlit, portas).

O Supabase expõe **PostgreSQL** na nuvem; o app usa essa URI com SQLAlchemy (`psycopg2`), sem container Postgres neste repositório.

## Pré-requisitos

- Python 3.11+
- Node.js 20+ (para `runners-web` em desenvolvimento local)
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

### 2. Frontend (Next.js — `runners-web`)

Com a API a correr, noutro terminal:

```bash
cd runners-web
cp .env.local.example .env.local
# Edite .env.local: NEXT_PUBLIC_API_URL=http://localhost:<API_PORT>
npm install
npm run dev
```

Dashboard: `http://localhost:3000` (porta padrão do Next).

### 3. Streamlit (opcional, sem Docker)

Na raiz do repo. No **Windows** (Python da Microsoft Store ou sem `Scripts` no PATH), o comando `streamlit` pode falhar; use **sempre**:

```bash
python -m streamlit run streamlit_app/app.py --server.port <STREAMLIT_PORT>
```

Ex.: `python -m streamlit run streamlit_app/app.py --server.port 8501`

Com **venv** ativo (`.venv\Scripts\activate`), após `pip install -r requirements.txt`, também pode funcionar `streamlit run ...` se existir `.venv\Scripts\streamlit.exe`.

Garanta que o processo herde o `.env` na raiz (a API carrega-o via código; o Streamlit usa o ambiente / ficheiros do projeto).

## Como rodar com Docker Compose

O Compose sobe **API**, **Streamlit** e **Next.js** (`web`); o banco é sempre o do **Supabase** via `DATABASE_URL` no `.env`.

**Importante para o browser:** o Next chama a API a partir do **navegador** no teu PC. O build da imagem `web` usa `NEXT_PUBLIC_API_URL` apontando para `http://localhost:<API_PORT>` (a mesma porta que publicas para o serviço `api`). Garante que **`CORS_ORIGINS`** no `.env` inclui a origem do Next, por exemplo `http://localhost:3000` (ou o valor de `WEB_PORT` se alterares a porta do `web`).

```bash
docker compose up --build
```

- **UI Next:** `http://localhost:<WEB_PORT>` (predefinição `3000` se `WEB_PORT` não estiver definido)
- **API:** `http://localhost:<API_PORT>`
- **Streamlit:** `http://localhost:<STREAMLIT_PORT>`

Para personalizar a URL da API no build do Next (ex.: outro host), define **`NEXT_PUBLIC_API_URL`** no `.env` na raiz; o `docker-compose` passa este valor como build arg para o serviço `web`.

### Análise ao vivo (Next `/live`) e MediaPipe na imagem Docker

A imagem da API inclui **OpenGL ES** (`libgles2`, `libegl1`) para o MediaPipe Tasks carregar `libGLESv2.so.2` dentro do container. Sem isso, o WebSocket `/ws/live` aceita ligações mas rebenta ao inicializar a pose. Depois de alterar o `Dockerfile`, faz **`docker compose build api`** (ou `up --build`) antes de testar de novo.

### Streamlit e webcam dentro do Docker

O Streamlit no Compose **não tem acesso à webcam do PC** por defeito: o `OpenCV` dentro do container não vê `/dev/video0` do host. No **Docker Desktop (Windows)** é o comportamento esperado; usa o **Next.js “Ao Vivo”** (câmera no browser + API no Docker) ou o modo **“Arquivo”** no Streamlit. Em **Linux**, podes experimentar mapear o dispositivo no `docker-compose.yml` (ex. `devices: ["/dev/video0:/dev/video0"]`) se precisares mesmo de webcam no container.

### `DATABASE_URL` e DNS (Windows / rede)

Se no startup da API aparecer `could not translate host name "db.<projeto>.supabase.co"`, a string **Direct** do painel pode não resolver na tua rede. No Supabase: **Database → Connection string → Transaction pooler** (porta **6543**, host em `*.pooler.supabase.com`) ou **Session pooler**, e cola essa URI em **`DATABASE_URL`**. Isto é independente do MediaPipe; sem ligação ao Postgres a API fica em modo degradado.

## Estrutura do projeto

```
Runners/
├── api/
├── scripts/run_api_dev.py
├── runners-web/
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

Ver a subsecção **`DATABASE_URL` e DNS** acima (pooler em vez da URI Direct). Mais detalhe em `docs/postman-e-supabase.md`.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Visão | Python, MediaPipe, OpenCV |
| Frontend | Next.js 14 (App Router), TypeScript, shadcn/ui |
| Backend | FastAPI |
| Dados | Supabase (Postgres) |

## Licença

Uso conforme repositório do projeto.

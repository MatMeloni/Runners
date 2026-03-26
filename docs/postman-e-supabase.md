# Postman, portas e Supabase

Todas as portas e URLs relevantes vêm do **`.env`** na raiz. O modelo está em **`.env.example`**.

O projeto usa **Supabase** como banco: no painel, **Project Settings → Database → Connection string (URI)** → cole em **`DATABASE_URL`**. O motor é PostgreSQL gerenciado; não há Postgres em container neste repositório.

## Variáveis que definem portas e URLs

| Variável | Exemplo | Uso |
|----------|---------|-----|
| `API_PORT` | `8000` | Postman / Swagger: `http://localhost:${API_PORT}` |
| `API_BASE_URL` | `http://localhost:8000` | Proxy do Vite em dev |
| `VITE_PORT` | `5173` | Porta do dashboard Vite |
| `STREAMLIT_PORT` | `8501` | Streamlit no Docker Compose |
| `DATABASE_URL` | (URI do Supabase) | Obrigatória — conexão ao projeto |

## Postman

`base_url = http://localhost:<API_PORT>` (igual ao `API_PORT` do `.env`).

| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `{{base_url}}/health` | Saúde da API |
| GET | `{{base_url}}/api/metrics` | Métricas stub |
| GET | `{{base_url}}/api/sessions` | Lista sessões |
| POST | `{{base_url}}/api/sessions` | Cria sessão |
| GET | `{{base_url}}/api/sessions/{id}` | Sessão por id |

Swagger: `http://localhost:<API_PORT>/docs`.

## URI do Supabase

- Copie a string **completa** do painel (host, porta, usuário, `sslmode` quando vier na URI).

### Erro `could not translate host name` (Windows / rede)

O host da **Direct connection** (`db.<ref>.supabase.co`) costuma ter **só registro DNS IPv6 (AAAA)**. Em redes ou PCs sem IPv6 estável, o cliente PostgreSQL pode falhar com esse erro.

**Solução:** no painel, troque para **Transaction pooler** (porta **6543**) ou **Session pooler** — o hostname costuma ser `*.pooler.supabase.com` e ter **IPv4**, funcionando em mais redes. Atualize `DATABASE_URL` no `.env`.

Confira também VPN, firewall e se a URI não foi cortada ao colar.

Mais detalhes: [Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres).

Não commite o `.env` com senha.

## Deploy (referência)

- **Frontend (ex.: Vercel):** `VITE_API_URL` = URL pública da API (sem `/` no final).
- **API:** `DATABASE_URL` e demais chaves iguais ao modelo do `.env.example`.

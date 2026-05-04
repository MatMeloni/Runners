# MVP funcional: Vercel + Docker + Tunnel

Este fluxo permite apresentar o MVP em outra maquina sem pagar backend hospedado 24/7.

## Arquitetura

- Frontend publico no Vercel (`runners-web`)
- API FastAPI rodando em Docker na sua maquina
- Tunnel Cloudflare expondo a API local em URL publica HTTPS

## 1) Preparar variaveis locais

1. Copie `.env.example` para `.env` na raiz.
2. Preencha:
   - `DATABASE_URL` (Supabase pooler `:6543`)
   - `SUPABASE_JWT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CLOUDFLARE_TUNNEL_TOKEN` (se for usar tunnel estavel)

## 2) Subir backend local em Docker

```bash
docker compose up --build -d api
docker compose ps
```

Health esperado:

```bash
curl http://localhost:8000/health
```

## 3) Expor API com Cloudflare Tunnel

Com token configurado no `.env`:

```bash
docker compose --profile tunnel up -d cloudflared
docker compose logs -f cloudflared
```

A URL publica da API ficara vinculada ao tunnel configurado no Cloudflare Zero Trust.

## 4) Apontar o Vercel para a API publica

No projeto do Vercel, configure:

- `NEXT_PUBLIC_API_URL=https://<url-publica-da-api>`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Depois, redeploy do frontend.

## 5) CORS no backend

`CORS_ORIGINS` deve conter:

- `https://<seu-projeto-vercel>.vercel.app`
- `http://localhost:3000` (para dev local)

Separados por virgula.

## 6) Limites desta estrategia

- Sua maquina precisa ficar ligada durante a apresentacao.
- Se o tunnel cair, o frontend perde acesso ao backend.
- Para producao real, use backend hospedado dedicado.

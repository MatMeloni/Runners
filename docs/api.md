# API Runners

Resumo dos endpoints da API FastAPI. Documentação interativa disponível em **/docs** (Swagger UI) quando a API está rodando.

## Base URL

- Local: `http://localhost:8000`
- Com Docker: `http://localhost:8000` (porta mapeada do serviço `api`)

## Endpoints

### GET /health

Health check da API.

**Resposta:** `200 OK`

```json
{ "status": "ok" }
```

---

### GET /api/metrics

Retorna métricas biomecânicas. Na versão atual, retorna dados **stub** (fixos). Em produção, pode receber frame ou `session_id` e calcular em cima do pipeline.

**Resposta:** `200 OK`

```json
{
  "angles": {
    "knee_left": 165.0,
    "knee_right": 162.0,
    "hip_left": 145.0,
    "hip_right": 148.0,
    "trunk": 85.0
  },
  "ground_contact_time_s": 0.25,
  "cadence_steps_per_min": 170.0,
  "distance_m": 50.0
}
```

---

### GET /api/sessions

Lista todas as sessões de análise, ordenadas por data (mais recente primeiro).

**Resposta:** `200 OK` — array de sessões

```json
[
  {
    "id": 1,
    "name": "Treino 01",
    "source": "webcam",
    "created_at": "2024-01-15T12:00:00Z",
    "metadata": null
  }
]
```

---

### POST /api/sessions

Cria uma nova sessão de análise.

**Body:**

```json
{
  "name": "Treino 01",
  "source": "webcam",
  "metadata": {}
}
```

Todos os campos são opcionais.

**Resposta:** `200 OK` — objeto da sessão criada (inclui `id` e `created_at`).

---

### GET /api/sessions/{session_id}

Retorna uma sessão pelo ID.

**Resposta:** `200 OK` — objeto da sessão; `404` se não encontrada.

---

## OpenAPI

- **Swagger UI:** http://localhost:8000/docs  
- **ReDoc:** http://localhost:8000/redoc  
- **OpenAPI JSON:** http://localhost:8000/openapi.json  

# Runners - Monitoramento biomecânico de corrida
FROM python:3.11-slim

# libgl1-mesa-glx foi removido no Debian 12+; libgl1 substitui para OpenCV / visão.
# libgles2 + libegl1: MediaPipe Tasks carrega libGLESv2.so.2 no Linux (evita erro no /ws/live).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libgles2 \
    libegl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY api/ ./api/
COPY config/ ./config/
COPY streamlit_app/ ./streamlit_app/
COPY migrations/ ./migrations/
COPY alembic.ini .

# Diretórios de runtime criados em tempo de build para evitar erros de permissão
RUN mkdir -p data/videos data/models

# Provedores PaaS (Render/Railway) injetam PORT automaticamente.
EXPOSE 8000
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-${API_PORT:-8000}}"]

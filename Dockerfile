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

# Porta e host vêm das variáveis de ambiente em runtime (veja .env.example)
CMD ["sh", "-c", "uvicorn api.main:app --host $API_HOST --port $API_PORT"]

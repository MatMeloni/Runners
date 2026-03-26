"""Ponto de entrada FastAPI: middleware, ciclo de vida e registro de routers."""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from api.config import get_cors_origins
from api.database import init_db
from api.routers import health_router, metrics_router, sessions_router

app = FastAPI(title="Runners API", version="0.1.0")
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    app.state.db_available = True
    try:
        init_db()
    except OperationalError as exc:
        app.state.db_available = False
        logger.warning(
            "Banco indisponível no startup. API continua em modo degradado: %s",
            exc,
        )


@app.exception_handler(OperationalError)
async def database_error_handler(_: Request, exc: OperationalError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                "Banco indisponível. Verifique a DATABASE_URL, rede/VPN/firewall "
                "e conectividade com o Supabase."
            )
        },
    )


app.include_router(health_router)
app.include_router(metrics_router)
app.include_router(sessions_router)

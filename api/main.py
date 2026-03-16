"""App FastAPI: health, métricas (stub), CRUD de sessões."""

from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api.database import get_db, init_db, SessionModel

app = FastAPI(title="Runners API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---

class BiomechanicsMetrics(BaseModel):
    angles: dict[str, float] = {}
    ground_contact_time_s: float | None = None
    cadence_steps_per_min: float | None = None
    distance_m: float | None = None


class SessionCreate(BaseModel):
    name: str | None = None
    source: str | None = None
    metadata: dict[str, Any] | None = None


class SessionResponse(BaseModel):
    id: int
    name: str | None
    source: str | None
    created_at: datetime
    metadata: dict[str, Any] | None = None

    class Config:
        from_attributes = True


# --- Startup ---

@app.on_event("startup")
def startup() -> None:
    init_db()


# --- Routes ---

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/metrics", response_model=BiomechanicsMetrics)
def get_metrics() -> BiomechanicsMetrics:
    """
    Retorna métricas biomecânicas (stub).
    Em produção: receberia frame ou session_id e calcularia em cima do pipeline.
    """
    return BiomechanicsMetrics(
        angles={"knee_left": 165.0, "knee_right": 162.0, "hip_left": 145.0, "hip_right": 148.0, "trunk": 85.0},
        ground_contact_time_s=0.25,
        cadence_steps_per_min=170.0,
        distance_m=50.0,
    )


@app.get("/api/sessions", response_model=list[SessionResponse])
def list_sessions() -> list[SessionResponse]:
    """Lista todas as sessões de análise."""
    with get_db() as db:
        rows = db.query(SessionModel).order_by(SessionModel.created_at.desc()).all()
        return [
            SessionResponse(
                id=r.id,
                name=r.name,
                source=r.source,
                created_at=r.created_at or datetime.utcnow(),
                metadata=r.metadata_,
            )
            for r in rows
        ]


@app.post("/api/sessions", response_model=SessionResponse)
def create_session(body: SessionCreate) -> SessionResponse:
    """Cria uma nova sessão de análise."""
    with get_db() as db:
        row = SessionModel(
            name=body.name,
            source=body.source,
            metadata_=body.metadata,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return SessionResponse(
            id=row.id,
            name=row.name,
            source=row.source,
            created_at=row.created_at or datetime.utcnow(),
            metadata=row.metadata_,
        )


@app.get("/api/sessions/{session_id}", response_model=SessionResponse)
def get_session(session_id: int) -> SessionResponse:
    """Retorna uma sessão pelo id."""
    with get_db() as db:
        row = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not row:
            raise HTTPException(status_code=404, detail="Session not found")
        return SessionResponse(
            id=row.id,
            name=row.name,
            source=row.source,
            created_at=row.created_at or datetime.utcnow(),
            metadata=row.metadata_,
        )

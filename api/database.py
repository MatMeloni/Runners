"""Conexão ao banco Supabase (PostgreSQL) via DATABASE_URL e modelos ORM."""

import enum
from contextlib import contextmanager
from datetime import datetime
from typing import Generator

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    create_engine,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, declarative_base, relationship, sessionmaker

from api.config import get_database_url

Base = declarative_base()


class SessionStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    done = "done"
    failed = "failed"


class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=True)
    source = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    metadata_ = Column("metadata", JSON, nullable=True)
    status = Column(String(32), nullable=False, default=SessionStatus.pending.value)
    video_path = Column(Text, nullable=True)
    error_msg = Column(Text, nullable=True)

    results = relationship("AnalysisResult", back_populates="session", cascade="all, delete-orphan")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    frame_index = Column(Integer, nullable=False)
    timestamp_s = Column(Float, nullable=True)
    angles = Column(JSONB, nullable=True)
    ground_contact_time_s = Column(Float, nullable=True)
    cadence_steps_per_min = Column(Float, nullable=True)
    distance_m = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    session = relationship("SessionModel", back_populates="results")


engine = create_engine(
    get_database_url(),
    pool_pre_ping=True,
    connect_args={"connect_timeout": 5},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _maybe_raise_dns_pooler_hint(exc: OperationalError) -> None:
    """Direct connection db.*.supabase.co é frequentemente só IPv6; redes sem IPv6 falham no DNS."""
    raw = str(getattr(exc, "orig", None) or exc)
    if "could not translate host name" not in raw and "Name or service not known" not in raw:
        return
    raise RuntimeError(
        "Falha ao resolver o host do Supabase (DNS). A URI de conexão direta "
        "(host db.*.supabase.co) costuma expor apenas IPv6; em muitos PCs/rede Windows "
        "isso gera este erro. No painel Supabase: Database → Connection string → escolha "
        "'Transaction pooler' (porta 6543) ou 'Session pooler' e cole a nova DATABASE_URL "
        "no .env. Confira também rede/VPN/firewall."
    ) from exc


def init_db() -> None:
    """Cria a tabela sessions se não existir."""
    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as e:
        _maybe_raise_dns_pooler_hint(e)
        raise


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """Context manager para sessão do banco."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> Generator[Session, None, None]:
    """Dependência FastAPI (`Depends`) para injeção de sessão ORM."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

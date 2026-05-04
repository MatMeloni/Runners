"""Conexão ao PostgreSQL (ex.: Supabase) via DATABASE_URL e modelos ORM."""

import enum
import logging
from contextlib import contextmanager
from datetime import datetime
from typing import Generator

from fastapi import HTTPException
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
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, declarative_base, relationship, sessionmaker

from api.config import get_database_url

logger = logging.getLogger(__name__)

Base = declarative_base()


class SessionStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    done = "done"
    failed = "failed"


class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
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
    landmarks = Column(JSONB, nullable=True)
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


def _log_dns_pooler_hint_if_applicable(exc: OperationalError) -> None:
    """Direct connection db.*.supabase.co é frequentemente só IPv6; redes sem IPv6 falham no DNS."""
    raw = str(getattr(exc, "orig", None) or exc)
    if "could not translate host name" not in raw and "Name or service not known" not in raw:
        return
    logger.warning(
        "DNS Supabase (host db.*.supabase.co): em muitos PCs/rede Windows falha a resolução. "
        "No painel: Database → Connection string → 'Transaction pooler' (6543) ou 'Session pooler'. "
        "Detalhe: %s",
        raw[:500],
    )


def init_db() -> None:
    """Cria tabelas se não existirem (desenvolvimento). Em produção use migrações SQL explícitas."""
    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as e:
        _log_dns_pooler_hint_if_applicable(e)
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

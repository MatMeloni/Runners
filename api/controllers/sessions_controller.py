from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session as OrmSession

from api.database import SessionModel
from api.schemas.sessions import SessionCreate, SessionResponse


def list_sessions(db: OrmSession) -> list[SessionResponse]:
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


def create_session(db: OrmSession, body: SessionCreate) -> SessionResponse:
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


def get_session(db: OrmSession, session_id: int) -> SessionResponse:
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

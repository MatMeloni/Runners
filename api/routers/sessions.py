from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as OrmSession

from api.controllers import sessions_controller
from api.database import get_db_session
from api.schemas.sessions import SessionCreate, SessionResponse

router = APIRouter(prefix="/api", tags=["sessions"])


@router.get("/sessions", response_model=list[SessionResponse])
def list_sessions(db: OrmSession = Depends(get_db_session)) -> list[SessionResponse]:
    return sessions_controller.list_sessions(db)


@router.post("/sessions", response_model=SessionResponse)
def create_session(
    body: SessionCreate,
    db: OrmSession = Depends(get_db_session),
) -> SessionResponse:
    return sessions_controller.create_session(db, body)


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    db: OrmSession = Depends(get_db_session),
) -> SessionResponse:
    return sessions_controller.get_session(db, session_id)

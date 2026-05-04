from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session as OrmSession

from api.auth import get_current_user_id
from api.controllers import sessions_controller
from api.database import AnalysisResult, SessionModel, SessionStatus, get_db_session
from api.schemas.sessions import (
    AnalysisResultResponse,
    SessionCreate,
    SessionResponse,
    SessionStatusResponse,
    UploadResponse,
)

VIDEOS_DIR = Path("data/videos")

router = APIRouter(prefix="/api", tags=["sessions"])


@router.get("/sessions", response_model=list[SessionResponse])
def list_sessions(
    db: OrmSession = Depends(get_db_session),
    user_id: UUID = Depends(get_current_user_id),
) -> list[SessionResponse]:
    return sessions_controller.list_sessions(db, user_id)


@router.post("/sessions", response_model=SessionResponse)
def create_session(
    body: SessionCreate,
    db: OrmSession = Depends(get_db_session),
    user_id: UUID = Depends(get_current_user_id),
) -> SessionResponse:
    return sessions_controller.create_session(db, body, user_id)


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    db: OrmSession = Depends(get_db_session),
    user_id: UUID = Depends(get_current_user_id),
) -> SessionResponse:
    return sessions_controller.get_session(db, session_id, user_id)


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: OrmSession = Depends(get_db_session),
    user_id: UUID = Depends(get_current_user_id),
) -> None:
    sessions_controller.delete_session(db, session_id, user_id)


@router.post("/sessions/{session_id}/upload", response_model=UploadResponse)
def upload_video(
    session_id: int,
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: OrmSession = Depends(get_db_session),
    user_id: UUID = Depends(get_current_user_id),
) -> UploadResponse:
    """Aceita upload de vídeo, salva em disco e dispara processamento em background."""
    row = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id, SessionModel.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    if row.status != SessionStatus.pending.value:
        raise HTTPException(
            status_code=409,
            detail=f"Session status is '{row.status}', expected 'pending'",
        )

    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{session_id}_{file.filename}"
    video_path = VIDEOS_DIR / filename

    with open(video_path, "wb") as f:
        content = file.file.read()
        f.write(content)

    row.video_path = str(video_path)
    row.status = SessionStatus.processing.value
    db.commit()

    background_tasks.add_task(
        sessions_controller.run_vision_pipeline, session_id, str(video_path)
    )

    return UploadResponse(job_id=session_id, status="processing")


@router.get("/sessions/{session_id}/video")
def get_session_video(
    session_id: int,
    db: OrmSession = Depends(get_db_session),
    user_id: UUID = Depends(get_current_user_id),
) -> FileResponse:
    """Serve o arquivo de vídeo de uma sessão para reprodução no browser."""
    row = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id)
        .first()
    )
    if not row or not row.video_path:
        raise HTTPException(status_code=404, detail="Vídeo não encontrado para esta sessão")
    path = Path(row.video_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Arquivo de vídeo não encontrado no servidor")
    return FileResponse(str(path), media_type="video/mp4")


@router.get("/sessions/{session_id}/status", response_model=SessionStatusResponse)
def get_session_status(
    session_id: int,
    db: OrmSession = Depends(get_db_session),
    user_id: UUID = Depends(get_current_user_id),
) -> SessionStatusResponse:
    """Retorna o status de processamento da sessão."""
    row = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id, SessionModel.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    results_count = db.query(AnalysisResult).filter(
        AnalysisResult.session_id == session_id
    ).count()

    return SessionStatusResponse(
        session_id=row.id,
        status=row.status,
        error=row.error_msg,
        results_count=results_count,
    )


@router.get("/sessions/{session_id}/results", response_model=list[AnalysisResultResponse])
def get_session_results(
    session_id: int,
    db: OrmSession = Depends(get_db_session),
    user_id: UUID = Depends(get_current_user_id),
) -> list[AnalysisResultResponse]:
    """Retorna todos os resultados de análise de uma sessão."""
    row = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id, SessionModel.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    results = (
        db.query(AnalysisResult)
        .filter(AnalysisResult.session_id == session_id)
        .order_by(AnalysisResult.frame_index)
        .all()
    )
    return results

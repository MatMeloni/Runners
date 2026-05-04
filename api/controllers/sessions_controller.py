import logging
import traceback
from datetime import datetime
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session as OrmSession

from api.database import AnalysisResult, SessionLocal, SessionModel, SessionStatus
from api.schemas.sessions import SessionCreate, SessionResponse

logger = logging.getLogger(__name__)


def _row_to_response(r: SessionModel) -> SessionResponse:
    """Converte um SessionModel para SessionResponse."""
    return SessionResponse(
        id=r.id,
        user_id=r.user_id,
        name=r.name,
        source=r.source,
        created_at=r.created_at or datetime.utcnow(),
        metadata=r.metadata_,
        status=r.status,
        video_path=r.video_path,
        error_msg=r.error_msg,
    )


def list_sessions(db: OrmSession, user_id: UUID) -> list[SessionResponse]:
    """Lista sessões do utilizador ordenadas por data de criação."""
    rows = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == user_id)
        .order_by(SessionModel.created_at.desc())
        .all()
    )
    return [_row_to_response(r) for r in rows]


def create_session(db: OrmSession, body: SessionCreate, user_id: UUID) -> SessionResponse:
    """Cria nova sessão com status 'pending'."""
    row = SessionModel(
        user_id=user_id,
        name=body.name,
        source=body.source,
        metadata_=body.metadata,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _row_to_response(row)


def get_session(db: OrmSession, session_id: int, user_id: UUID) -> SessionResponse:
    """Retorna uma sessão pelo ID ou 404 se não existir ou não pertencer ao utilizador."""
    row = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id, SessionModel.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return _row_to_response(row)


def delete_session(db: OrmSession, session_id: int, user_id: UUID) -> None:
    """Remove sessão, resultados em cascata e ficheiro de vídeo em disco."""
    row = (
        db.query(SessionModel)
        .filter(SessionModel.id == session_id, SessionModel.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    if row.video_path:
        path = Path(row.video_path)
        if path.is_file():
            try:
                path.unlink()
            except OSError as exc:
                logger.warning("Não foi possível apagar o vídeo %s: %s", path, exc)

    db.delete(row)
    db.commit()


def run_vision_pipeline(session_id: int, video_path: str) -> None:
    """
    Executa o pipeline de visão computacional em background.

    Abre o vídeo, processa frame a frame com MediaPipe,
    calcula ângulos (a cada 5 frames) e métricas de marcha (a cada 30 frames),
    e persiste os resultados em batches.
    """
    from src.analysis.angles import compute_joint_angles
    from src.analysis.gait_metrics import compute_gait_metrics
    from src.capture.video_file import VideoFileCapture
    from src.processing.pipeline import ProcessingPipeline

    db = SessionLocal()
    capture = VideoFileCapture(video_path)

    try:
        if not capture.open():
            raise RuntimeError(f"Não foi possível abrir o vídeo: {video_path}")

        pipeline = ProcessingPipeline(draw_landmarks=False)
        landmarks_buffer: list[list[dict] | None] = []
        results_batch: list[AnalysisResult] = []
        frame_idx = 0
        fps = 30.0

        for frame_bgr in capture.frames():
            _, landmarks = pipeline.process(frame_bgr)
            landmarks_buffer.append(landmarks)

            angles_dict: dict[str, float] | None = None
            gct_val: float | None = None
            cadence_val: float | None = None
            distance_val: float | None = None

            landmarks_to_save: list[dict] | None = None
            if frame_idx % 5 == 0 and landmarks is not None:
                angles_dict = compute_joint_angles(landmarks)
                landmarks_to_save = landmarks

            if frame_idx % 30 == 0 and len(landmarks_buffer) >= 10:
                gait = compute_gait_metrics(landmarks_buffer, fps)
                gct_val = gait.get("ground_contact_time_s")
                cadence_val = gait.get("cadence_steps_per_min")
                distance_val = gait.get("distance_m")

            if angles_dict or gct_val is not None or cadence_val is not None:
                result = AnalysisResult(
                    session_id=session_id,
                    frame_index=frame_idx,
                    timestamp_s=round(frame_idx / fps, 3),
                    angles=angles_dict if angles_dict else None,
                    landmarks=landmarks_to_save,
                    ground_contact_time_s=gct_val,
                    cadence_steps_per_min=cadence_val,
                    distance_m=distance_val,
                )
                results_batch.append(result)

            if len(results_batch) >= 50:
                db.add_all(results_batch)
                db.commit()
                results_batch.clear()

            frame_idx += 1

        if results_batch:
            db.add_all(results_batch)
            db.commit()

        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if session:
            session.status = SessionStatus.done.value
            db.commit()

        logger.info("Pipeline concluído para session %d (%d frames)", session_id, frame_idx)

    except Exception:
        error_msg = traceback.format_exc()
        logger.error("Pipeline falhou para session %d: %s", session_id, error_msg)
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if session:
            session.status = SessionStatus.failed.value
            session.error_msg = error_msg[:2000]
            db.commit()
    finally:
        capture.release()
        db.close()

from statistics import mean
from uuid import UUID

from sqlalchemy.orm import Session as OrmSession

from api.database import AnalysisResult, SessionModel, SessionStatus
from api.schemas.metrics import BiomechanicsMetrics

_ANGLE_KEYS = ("knee_left", "knee_right", "hip_left", "hip_right", "trunk")


def get_metrics_from_last_session(db: OrmSession, user_id: UUID) -> BiomechanicsMetrics:
    """Agrega métricas da última sessão concluída do utilizador (médias por série de frames)."""
    last = (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == user_id,
            SessionModel.status == SessionStatus.done.value,
        )
        .order_by(SessionModel.created_at.desc())
        .first()
    )
    if not last:
        return BiomechanicsMetrics()

    results = (
        db.query(AnalysisResult)
        .filter(AnalysisResult.session_id == last.id)
        .order_by(AnalysisResult.frame_index)
        .all()
    )
    if not results:
        return BiomechanicsMetrics()

    angles_out: dict[str, float] = {}
    for key in _ANGLE_KEYS:
        vals: list[float] = []
        for r in results:
            if not r.angles or not isinstance(r.angles, dict):
                continue
            raw = r.angles.get(key)
            if raw is None:
                continue
            try:
                vals.append(float(raw))
            except (TypeError, ValueError):
                continue
        if vals:
            angles_out[key] = float(mean(vals))

    cadences = [
        float(r.cadence_steps_per_min)
        for r in results
        if r.cadence_steps_per_min is not None and _is_finite(r.cadence_steps_per_min)
    ]
    gcts = [
        float(r.ground_contact_time_s)
        for r in results
        if r.ground_contact_time_s is not None and _is_finite(r.ground_contact_time_s)
    ]
    dists = [
        float(r.distance_m) for r in results if r.distance_m is not None and _is_finite(r.distance_m)
    ]

    return BiomechanicsMetrics(
        angles=angles_out,
        ground_contact_time_s=float(mean(gcts)) if gcts else None,
        cadence_steps_per_min=float(mean(cadences)) if cadences else None,
        distance_m=float(mean(dists)) if dists else None,
    )


def _is_finite(x: float) -> bool:
    return x == x and abs(x) != float("inf")

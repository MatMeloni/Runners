from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as OrmSession

from api.auth import get_current_user_id
from api.controllers import metrics_controller
from api.database import get_db_session
from api.schemas.metrics import BiomechanicsMetrics

router = APIRouter(prefix="/api", tags=["metrics"])


@router.get("/metrics", response_model=BiomechanicsMetrics)
def get_metrics(
    db: OrmSession = Depends(get_db_session),
    user_id: UUID = Depends(get_current_user_id),
) -> BiomechanicsMetrics:
    return metrics_controller.get_metrics_from_last_session(db, user_id)

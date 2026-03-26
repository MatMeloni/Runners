from fastapi import APIRouter

from api.controllers import metrics_controller
from api.schemas.metrics import BiomechanicsMetrics

router = APIRouter(prefix="/api", tags=["metrics"])


@router.get("/metrics", response_model=BiomechanicsMetrics)
def get_metrics() -> BiomechanicsMetrics:
    return metrics_controller.get_stub_metrics()

from fastapi import APIRouter, Request

from api.controllers import health_controller

router = APIRouter(tags=["health"])


@router.get("/health")
def health(request: Request) -> dict[str, str]:
    db_available = bool(getattr(request.app.state, "db_available", False))
    return health_controller.get_health_status(db_available)

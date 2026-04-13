from datetime import datetime
from typing import Any

from pydantic import BaseModel


class SessionCreate(BaseModel):
    name: str | None = None
    source: str | None = None
    metadata: dict[str, Any] | None = None


class SessionResponse(BaseModel):
    id: int
    name: str | None
    source: str | None
    created_at: datetime
    metadata: dict[str, Any] | None = None
    status: str = "pending"
    video_path: str | None = None
    error_msg: str | None = None

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    job_id: int
    status: str


class SessionStatusResponse(BaseModel):
    session_id: int
    status: str
    error: str | None = None
    results_count: int


class AnalysisResultResponse(BaseModel):
    id: int
    session_id: int
    frame_index: int
    timestamp_s: float | None = None
    angles: dict[str, float] | None = None
    ground_contact_time_s: float | None = None
    cadence_steps_per_min: float | None = None
    distance_m: float | None = None
    created_at: datetime

    class Config:
        from_attributes = True

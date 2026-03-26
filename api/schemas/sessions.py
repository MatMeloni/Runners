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

    class Config:
        from_attributes = True

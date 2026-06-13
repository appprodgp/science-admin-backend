from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PipelineJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    job_type: str
    status: str
    started_at: datetime | None = None
    finished_at: datetime | None = None
    message: str | None = None
    error_message: str | None = None
    created_by: str | None = None
    created_at: datetime
    updated_at: datetime
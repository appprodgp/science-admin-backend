from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class JournalBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    issn_print: str | None = Field(default=None, max_length=32)
    issn_online: str | None = Field(default=None, max_length=32)
    publisher: str | None = Field(default=None, max_length=255)
    field: str | None = Field(default=None, max_length=100)
    priority: int = Field(default=2, ge=0)
    active: bool = True
    notes: str | None = None


class JournalCreate(JournalBase):
    pass


class JournalUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    issn_print: str | None = Field(default=None, max_length=32)
    issn_online: str | None = Field(default=None, max_length=32)
    publisher: str | None = Field(default=None, max_length=255)
    field: str | None = Field(default=None, max_length=100)
    priority: int | None = Field(default=None, ge=0)
    active: bool | None = None
    notes: str | None = None


class JournalRead(JournalBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


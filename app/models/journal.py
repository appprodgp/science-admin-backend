from __future__ import annotations

from datetime import datetime
from uuid import UUID as PyUUID, uuid4

from sqlalchemy import Boolean, DateTime, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Journal(Base):
    """Whitelisted source journal for article discovery and manual testing."""

    __tablename__ = "journals"
    __table_args__ = (
        UniqueConstraint("name", name="uq_journals_name"),
        Index("ix_journals_active", "active"),
        Index("ix_journals_field", "field"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    issn_print: Mapped[str | None] = mapped_column(String(32), nullable=True)
    issn_online: Mapped[str | None] = mapped_column(String(32), nullable=True)
    publisher: Mapped[str | None] = mapped_column(String(255), nullable=True)
    field: Mapped[str | None] = mapped_column(String(100), nullable=True)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=2, server_default="2")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


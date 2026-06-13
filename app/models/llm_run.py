from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID as PyUUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.article import Article


class LlmRun(Base):
    """Audit record for future LLM calls.

    Step 2 only exposes storage/listing; no OpenAI or Gemini calls are implemented.
    """

    __tablename__ = "llm_runs"
    __table_args__ = (
        Index("ix_llm_runs_article_id", "article_id"),
        Index("ix_llm_runs_task_name", "task_name"),
        Index("ix_llm_runs_status", "status"),
        Index("ix_llm_runs_created_at", "created_at"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    article_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("articles.id", ondelete="SET NULL"), nullable=True
    )
    task_name: Mapped[str] = mapped_column(String(100), nullable=False)
    provider: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    input_tokens_estimate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_tokens_estimate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_estimate: Mapped[Decimal | None] = mapped_column(Numeric(12, 6), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending", server_default="pending")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    article: Mapped[Article | None] = relationship("Article", back_populates="llm_runs")


from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID as PyUUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.article import Article


class CurationScore(Base):
    """LLM or human curation score for an article candidate."""

    __tablename__ = "curation_scores"
    __table_args__ = (
        Index("ix_curation_scores_article_id", "article_id"),
        Index("ix_curation_scores_selected", "selected"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    article_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False
    )
    public_interest: Mapped[int | None] = mapped_column(Integer, nullable=True)
    novelty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    evidence_strength: Mapped[int | None] = mapped_column(Integer, nullable=True)
    human_relevance: Mapped[int | None] = mapped_column(Integer, nullable=True)
    story_potential: Mapped[int | None] = mapped_column(Integer, nullable=True)
    overhype_risk: Mapped[int | None] = mapped_column(Integer, nullable=True)
    selected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    article: Mapped[Article] = relationship("Article", back_populates="curation_scores")
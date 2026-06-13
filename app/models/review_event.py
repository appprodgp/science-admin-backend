from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID as PyUUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.article import Article
    from app.models.generated_article import GeneratedArticle


# Allowed review actions recorded by admin review routes.
REVIEW_ACTIONS: tuple[str, ...] = (
    "approved",
    "rejected",
    "edited",
    "sent_back_for_regeneration",
    "published",
    "unpublished",
)


class ReviewEvent(Base):
    """Audit trail for admin review decisions and edits."""

    __tablename__ = "review_events"
    __table_args__ = (
        Index("ix_review_events_article_id", "article_id"),
        Index("ix_review_events_action", "action"),
        Index("ix_review_events_created_at", "created_at"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    article_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False
    )
    generated_article_id: Mapped[PyUUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("generated_articles.id", ondelete="CASCADE"), nullable=True
    )
    reviewer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    article: Mapped[Article] = relationship("Article", back_populates="review_events")
    generated_article: Mapped[GeneratedArticle | None] = relationship(
        "GeneratedArticle", back_populates="review_events"
    )
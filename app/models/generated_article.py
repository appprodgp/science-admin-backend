from __future__ import annotations

from datetime import datetime
from typing import Any, TYPE_CHECKING
from uuid import UUID as PyUUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.article import Article
    from app.models.review_event import ReviewEvent


class GeneratedArticle(Base):
    """Plain-language article draft generated for admin review."""

    __tablename__ = "generated_articles"
    __table_args__ = (
        Index("ix_generated_articles_article_id", "article_id"),
        Index("ix_generated_articles_review_status", "review_status"),
        Index("ix_generated_articles_published_at", "published_at"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    article_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False
    )
    plain_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    subtitle: Mapped[str | None] = mapped_column(Text, nullable=True)
    article_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficult_words_json: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSON, nullable=True)
    mcqs_json: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSON, nullable=True)
    limitations_json: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSON, nullable=True)
    source_attribution: Mapped[str | None] = mapped_column(Text, nullable=True)
    fact_check_json: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSON, nullable=True)
    generation_model: Mapped[str | None] = mapped_column(String(255), nullable=True)
    review_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending", server_default="pending"
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    article: Mapped[Article] = relationship("Article", back_populates="generated_articles")
    review_events: Mapped[list[ReviewEvent]] = relationship(
        "ReviewEvent", back_populates="generated_article", passive_deletes=True
    )


from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING
from uuid import UUID as PyUUID, uuid4

from sqlalchemy import Date, DateTime, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.curation_score import CurationScore
    from app.models.figure import ArticleFigure
    from app.models.generated_article import GeneratedArticle
    from app.models.llm_run import LlmRun
    from app.models.review_event import ReviewEvent
    from app.models.section import ArticleSection


# Allowed statuses for articles as they move through the future pipeline.
ARTICLE_STATUSES: tuple[str, ...] = (
    "metadata_found",
    "license_rejected",
    "xml_not_found",
    "xml_ready",
    "extracted",
    "not_selected",
    "curated",
    "generation_pending",
    "generation_failed",
    "pending_review",
    "published",
    "rejected",
    "failed",
)


class Article(Base):
    """Article metadata and pipeline state.

    Step 2 supports manual/fake metadata creation for admin testing only. Discovery,
    XML parsing, LLM generation, and workflows are intentionally not implemented yet.
    """

    __tablename__ = "articles"
    __table_args__ = (
        UniqueConstraint("doi", name="uq_articles_doi"),
        Index("ix_articles_status", "status"),
        Index("ix_articles_journal_name", "journal_name"),
        Index("ix_articles_field", "field"),
        Index("ix_articles_published_date", "published_date"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    doi: Mapped[str] = mapped_column(String(512), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    journal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    journal_issn: Mapped[str | None] = mapped_column(String(32), nullable=True)
    publisher: Mapped[str | None] = mapped_column(String(255), nullable=True)
    published_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    license_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    license_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    abstract_from_metadata: Mapped[str | None] = mapped_column(Text, nullable=True)
    xml_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    xml_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    xml_r2_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="metadata_found", server_default="metadata_found"
    )
    field: Mapped[str | None] = mapped_column(String(100), nullable=True)
    priority_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    sections: Mapped[list[ArticleSection]] = relationship(
        "ArticleSection", back_populates="article", cascade="all, delete-orphan", passive_deletes=True
    )
    figures: Mapped[list[ArticleFigure]] = relationship(
        "ArticleFigure", back_populates="article", cascade="all, delete-orphan", passive_deletes=True
    )
    curation_scores: Mapped[list[CurationScore]] = relationship(
        "CurationScore", back_populates="article", cascade="all, delete-orphan", passive_deletes=True
    )
    generated_articles: Mapped[list[GeneratedArticle]] = relationship(
        "GeneratedArticle", back_populates="article", cascade="all, delete-orphan", passive_deletes=True
    )
    review_events: Mapped[list[ReviewEvent]] = relationship(
        "ReviewEvent", back_populates="article", cascade="all, delete-orphan", passive_deletes=True
    )
    llm_runs: Mapped[list[LlmRun]] = relationship(
        "LlmRun", back_populates="article", passive_deletes=True
    )


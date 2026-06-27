from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.article import Article
from app.models.job import PipelineJob
from app.services.article_generation_service import generate_article_for_review
from app.services.curation_service import curate_article
from app.services.fact_check_service import fact_check_generated_article


logger = logging.getLogger(__name__)

AI_PIPELINE_JOB_TYPE = "ai_pipeline"
AI_PIPELINE_COUNT_KEYS = (
    "processed",
    "curated",
    "not_selected",
    "generated",
    "pending_review",
    "needs_revision",
    "failed",
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _safe_error_message(error: Exception | str, max_length: int = 1000) -> str:
    message = str(error).strip()
    if not message and isinstance(error, Exception):
        message = error.__class__.__name__
    message = re.sub(r"sk-[A-Za-z0-9_\-]{8,}", "sk-***", message)
    message = re.sub(r"AIza[A-Za-z0-9_\-]{8,}", "AIza***", message)
    return (message or "AI pipeline error")[:max_length]


def _counts_message(counts: dict[str, int]) -> str:
    return ", ".join(f"{key}={counts[key]}" for key in AI_PIPELINE_COUNT_KEYS)


def _mark_article_error(db: Session, article_id: UUID, error: Exception | str) -> None:
    try:
        article = db.get(Article, article_id)
        if article is None:
            return
        article.error_message = _safe_error_message(error)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to mark article AI pipeline error for article %s.", article_id)


def _load_articles(db: Session, article_id: UUID | None, effective_limit: int) -> list[Article]:
    if article_id is not None:
        article = db.get(Article, article_id)
        return [article] if article is not None else []
    return list(
        db.scalars(
            select(Article)
            .where(Article.status == "extracted")
            .order_by(Article.created_at.asc())
            .limit(effective_limit)
        ).all()
    )


def run_ai_pipeline_for_extracted_articles(
    db: Session,
    limit: int | None = None,
    article_id: UUID | None = None,
) -> dict:
    """Run Step 4 synchronously for extracted articles or one explicit article."""

    settings = get_settings()
    max_limit = max(1, settings.MAX_LLM_GENERATIONS_PER_RUN)
    # Safety default: process only one article when no explicit request limit is
    # provided. The API also defaults to 1.
    requested_limit = 1 if limit is None else limit
    effective_limit = max(1, min(requested_limit, max_limit))
    counts = {key: 0 for key in AI_PIPELINE_COUNT_KEYS}

    job = PipelineJob(
        job_type=AI_PIPELINE_JOB_TYPE,
        status="running",
        started_at=_utcnow(),
        message=f"Starting AI pipeline with limit={effective_limit}, article_id={article_id}.",
        created_by="system",
    )
    db.add(job)
    db.commit()

    try:
        articles = _load_articles(db, article_id, effective_limit)
        if article_id is not None and not articles:
            counts["failed"] = 1
            job.status = "failed"
            job.finished_at = _utcnow()
            job.message = _counts_message(counts)
            job.error_message = "Article not found"
            db.commit()
            return counts

        for article in articles:
            counts["processed"] += 1
            try:
                curation_score = curate_article(db, article.id)
                if not curation_score.selected:
                    counts["not_selected"] += 1
                    continue

                counts["curated"] += 1
                generated_article = generate_article_for_review(db, article.id)
                counts["generated"] += 1
                checked_article = fact_check_generated_article(db, generated_article.id)
                if checked_article.review_status == "pending":
                    counts["pending_review"] += 1
                elif checked_article.review_status == "needs_revision":
                    counts["needs_revision"] += 1
            except Exception as exc:
                db.rollback()
                counts["failed"] += 1
                _mark_article_error(db, article.id, exc)
                logger.warning("AI pipeline failed for article %s: %s", article.id, _safe_error_message(exc))

        job = db.get(PipelineJob, job.id)
        if job is not None:
            job.status = "completed"
            job.finished_at = _utcnow()
            job.message = _counts_message(counts)
            db.commit()
    except Exception as exc:
        db.rollback()
        job = db.get(PipelineJob, job.id)
        if job is not None:
            job.status = "failed"
            job.finished_at = _utcnow()
            job.message = _counts_message(counts)
            job.error_message = _safe_error_message(exc)
            db.commit()
        logger.exception("AI pipeline run failed.")

    return counts

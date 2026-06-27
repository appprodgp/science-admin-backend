from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.article import Article
from app.models.curation_score import CurationScore
from app.models.generated_article import GeneratedArticle
from app.schemas.generation import CurationScoreRead, GeneratedArticleRead
from app.services.ai_pipeline_service import run_ai_pipeline_for_extracted_articles
from app.services.article_generation_service import generate_article_for_review
from app.services.curation_service import curate_article
from app.services.fact_check_service import fact_check_generated_article
from app.services.llm_client import LlmClientError


router = APIRouter(prefix="/api/admin/ai", tags=["admin ai"])
logger = logging.getLogger(__name__)

DbSession = Annotated[Session, Depends(get_db)]


class AiRunRequest(BaseModel):
    limit: int | None = Field(default=1, ge=1)
    article_id: UUID | None = None


def _raise_service_error(exc: Exception) -> None:
    detail = str(exc) or exc.__class__.__name__
    status_code = status.HTTP_404_NOT_FOUND if "not found" in detail.lower() else status.HTTP_400_BAD_REQUEST
    raise HTTPException(status_code=status_code, detail=detail) from exc


def _article_exists_or_404(db: Session, article_id: UUID) -> None:
    if db.get(Article, article_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")


def _validate_ai_run_article_or_raise(db: Session, article_id: UUID) -> None:
    """Prevalidate explicit article runs without changing pipeline behavior."""

    article = db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    if article.status != "extracted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Article is not ready for the AI pipeline. "
                f"Current status is '{article.status}'. Expected status is 'extracted'."
            ),
        )


def _generated_article_read_or_500(generated_article: GeneratedArticle) -> GeneratedArticleRead:
    try:
        return GeneratedArticleRead.model_validate(generated_article)
    except Exception as exc:
        logger.warning(
            "Failed to serialize generated article %s for admin AI response: %s",
            generated_article.id,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to serialize generated article response",
        ) from exc


@router.post("/curate/{article_id}", response_model=CurationScoreRead)
def curate_one_article(article_id: UUID, db: DbSession) -> CurationScore:
    try:
        return curate_article(db, article_id)
    except (ValueError, LlmClientError) as exc:
        _raise_service_error(exc)


@router.post("/generate/{article_id}", response_model=GeneratedArticleRead)
def generate_one_article(article_id: UUID, db: DbSession) -> GeneratedArticle:
    try:
        return generate_article_for_review(db, article_id)
    except (ValueError, LlmClientError) as exc:
        _raise_service_error(exc)


@router.post("/fact-check/{generated_article_id}", response_model=GeneratedArticleRead)
def fact_check_one_generated_article(generated_article_id: UUID, db: DbSession) -> GeneratedArticle:
    try:
        return fact_check_generated_article(db, generated_article_id)
    except (ValueError, LlmClientError) as exc:
        _raise_service_error(exc)


@router.post("/run")
def run_ai_pipeline(
    db: DbSession,
    payload: AiRunRequest | None = Body(default=None),
) -> dict:
    settings = get_settings()
    request_payload = payload or AiRunRequest()
    limit = request_payload.limit or 1
    if limit > settings.MAX_LLM_GENERATIONS_PER_RUN:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"limit must be <= MAX_LLM_GENERATIONS_PER_RUN ({settings.MAX_LLM_GENERATIONS_PER_RUN})",
        )
    if request_payload.article_id is not None:
        _validate_ai_run_article_or_raise(db, request_payload.article_id)
    return run_ai_pipeline_for_extracted_articles(
        db,
        limit=limit,
        article_id=request_payload.article_id,
    )


@router.get("/curation-scores/{article_id}", response_model=list[CurationScoreRead])
def list_curation_scores(article_id: UUID, db: DbSession) -> list[CurationScore]:
    _article_exists_or_404(db, article_id)
    query = (
        select(CurationScore)
        .where(CurationScore.article_id == article_id)
        .order_by(CurationScore.created_at.desc())
    )
    return list(db.scalars(query).all())


@router.get("/generated-item/{generated_article_id}", response_model=GeneratedArticleRead)
def get_ai_generated_article(generated_article_id: UUID, db: DbSession) -> GeneratedArticleRead:
    try:
        generated_article = db.get(GeneratedArticle, generated_article_id)
        if generated_article is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Generated article not found",
            )
        return _generated_article_read_or_500(generated_article)
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(
            "Failed to load generated article %s for admin AI response: %s",
            generated_article_id,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load generated article",
        ) from exc


@router.get("/generated/{article_id}", response_model=list[GeneratedArticleRead])
def list_ai_generated_articles(article_id: UUID, db: DbSession) -> list[GeneratedArticleRead]:
    try:
        _article_exists_or_404(db, article_id)
        query = (
            select(GeneratedArticle)
            .where(GeneratedArticle.article_id == article_id)
            .order_by(GeneratedArticle.created_at.desc())
        )
        generated_articles = list(db.scalars(query).all())
        return [_generated_article_read_or_500(item) for item in generated_articles]
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(
            "Failed to load generated articles for article %s in admin AI response: %s",
            article_id,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load generated articles",
        ) from exc

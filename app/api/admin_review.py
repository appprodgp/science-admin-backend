from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.generated_article import GeneratedArticle
from app.models.review_event import ReviewEvent
from app.schemas.generation import GeneratedArticleRead, GeneratedArticleWithArticleRead
from app.schemas.review import GeneratedArticleEditRequest, ReviewActionRequest


router = APIRouter(prefix="/api/admin/review", tags=["admin review"])

DbSession = Annotated[Session, Depends(get_db)]


def _get_generated_article_or_404(db: Session, generated_article_id: UUID) -> GeneratedArticle:
    generated_article = db.scalar(
        select(GeneratedArticle)
        .options(joinedload(GeneratedArticle.article))
        .where(GeneratedArticle.id == generated_article_id)
    )
    if generated_article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generated article not found")
    return generated_article


def _create_review_event(
    db: Session,
    generated_article: GeneratedArticle,
    action: str,
    reviewer_email: str | None,
    note: str | None,
) -> None:
    db.add(
        ReviewEvent(
            article_id=generated_article.article_id,
            generated_article_id=generated_article.id,
            reviewer_email=reviewer_email,
            action=action,
            note=note,
        )
    )


@router.get("/queue", response_model=list[GeneratedArticleRead])
def list_review_queue(db: DbSession) -> list[GeneratedArticle]:
    query = (
        select(GeneratedArticle)
        .where(GeneratedArticle.review_status == "pending")
        .order_by(GeneratedArticle.created_at.asc())
    )
    return list(db.scalars(query).all())


@router.get("/queue/{generated_article_id}", response_model=GeneratedArticleWithArticleRead)
def get_review_queue_item(generated_article_id: UUID, db: DbSession) -> GeneratedArticle:
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    if generated_article.review_status != "pending":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending generated article not found")
    return generated_article


@router.post("/{generated_article_id}/approve", response_model=GeneratedArticleRead)
def approve_generated_article(
    generated_article_id: UUID, payload: ReviewActionRequest, db: DbSession
) -> GeneratedArticle:
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    generated_article.review_status = "approved"
    generated_article.published_at = datetime.now(UTC)
    generated_article.article.status = "published"
    _create_review_event(db, generated_article, "approved", payload.reviewer_email, payload.note)
    db.commit()
    db.refresh(generated_article)
    return generated_article


@router.post("/{generated_article_id}/reject", response_model=GeneratedArticleRead)
def reject_generated_article(
    generated_article_id: UUID, payload: ReviewActionRequest, db: DbSession
) -> GeneratedArticle:
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    generated_article.review_status = "rejected"
    generated_article.article.status = "rejected"
    _create_review_event(db, generated_article, "rejected", payload.reviewer_email, payload.note)
    db.commit()
    db.refresh(generated_article)
    return generated_article


@router.patch("/{generated_article_id}/edit", response_model=GeneratedArticleRead)
def edit_generated_article(
    generated_article_id: UUID, payload: GeneratedArticleEditRequest, db: DbSession
) -> GeneratedArticle:
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    update_data = payload.model_dump(exclude_unset=True, exclude={"reviewer_email", "note"})
    for field, value in update_data.items():
        setattr(generated_article, field, value)

    _create_review_event(db, generated_article, "edited", payload.reviewer_email, payload.note)
    db.commit()
    db.refresh(generated_article)
    return generated_article


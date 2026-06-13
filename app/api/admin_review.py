from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.curation_score import CurationScore
from app.models.generated_article import GeneratedArticle
from app.models.review_event import ReviewEvent
from app.schemas.review import (
    GeneratedArticleEditRequest,
    ReviewActionRequest,
    ReviewArticleMetadata,
    ReviewCurationScoreRead,
    ReviewEventRead,
    ReviewGeneratedArticleRead,
    ReviewQueueItemRead,
    ReviewQueuesSummaryRead,
    ReviewReasonRequest,
)


router = APIRouter(prefix="/api/admin/review", tags=["admin review"])
logger = logging.getLogger(__name__)

DbSession = Annotated[Session, Depends(get_db)]

APPROVABLE_REVIEW_STATUSES = {"pending", "needs_revision"}
FINAL_REVIEW_STATUSES = {"approved", "rejected"}
SUMMARY_REVIEW_STATUSES = ("pending", "needs_revision", "approved", "rejected")


def _get_generated_article_or_404(db: Session, generated_article_id: UUID) -> GeneratedArticle:
    generated_article = db.scalar(
        select(GeneratedArticle)
        .options(joinedload(GeneratedArticle.article))
        .where(GeneratedArticle.id == generated_article_id)
    )
    if generated_article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated article not found",
        )
    return generated_article


def _latest_curation_score(db: Session, article_id: UUID) -> CurationScore | None:
    return db.scalar(
        select(CurationScore)
        .where(CurationScore.article_id == article_id)
        .order_by(CurationScore.created_at.desc())
        .limit(1)
    )


def _create_review_event(
    db: Session,
    generated_article: GeneratedArticle,
    action: str,
    reviewer_email: str | None = None,
    note: str | None = None,
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


def _commit_or_500(db: Session, context: str) -> None:
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.warning("Failed to %s in admin review workflow: %s", context, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to {context}",
        ) from exc


def _raise_invalid_status(action: str, current_status: str, allowed_statuses: set[str] | None = None) -> None:
    if allowed_statuses:
        allowed = ", ".join(sorted(allowed_statuses))
        detail = (
            f"Cannot {action} generated article with review_status='{current_status}'. "
            f"Allowed statuses: {allowed}."
        )
    else:
        detail = f"Cannot {action} generated article with review_status='{current_status}'."
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def _touch_generated_article(generated_article: GeneratedArticle) -> None:
    generated_article.updated_at = datetime.now(UTC)


def _touch_source_article(generated_article: GeneratedArticle) -> None:
    if generated_article.article is not None:
        generated_article.article.updated_at = datetime.now(UTC)


def _build_queue_item(generated_article: GeneratedArticle) -> ReviewQueueItemRead:
    article = generated_article.article
    return ReviewQueueItemRead(
        id=generated_article.id,
        generated_article_id=generated_article.id,
        article_id=generated_article.article_id,
        doi=article.doi if article else None,
        source_article_title=article.title if article else None,
        journal_name=article.journal_name if article else None,
        published_date=article.published_date if article else None,
        plain_title=generated_article.plain_title,
        subtitle=generated_article.subtitle,
        article_body=generated_article.article_body,
        difficult_words_json=generated_article.difficult_words_json,
        mcqs_json=generated_article.mcqs_json,
        limitations_json=generated_article.limitations_json,
        source_attribution=generated_article.source_attribution,
        fact_check_json=generated_article.fact_check_json,
        generation_model=generated_article.generation_model,
        review_status=generated_article.review_status,
        published_at=generated_article.published_at,
        created_at=generated_article.created_at,
        updated_at=generated_article.updated_at,
    )


def _build_generated_article_read(
    db: Session,
    generated_article: GeneratedArticle,
) -> ReviewGeneratedArticleRead:
    if generated_article.article is None:
        logger.warning("Generated article %s has no source article relationship", generated_article.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Generated article source metadata is unavailable",
        )

    queue_item = _build_queue_item(generated_article)
    curation_score = _latest_curation_score(db, generated_article.article_id)
    return ReviewGeneratedArticleRead(
        **queue_item.model_dump(),
        article=ReviewArticleMetadata.model_validate(generated_article.article),
        curation_score=(
            ReviewCurationScoreRead.model_validate(curation_score) if curation_score is not None else None
        ),
    )


def _approve_generated_article(
    db: Session,
    generated_article: GeneratedArticle,
    payload: ReviewActionRequest,
) -> ReviewGeneratedArticleRead:
    if generated_article.review_status not in APPROVABLE_REVIEW_STATUSES:
        _raise_invalid_status("approve", generated_article.review_status, APPROVABLE_REVIEW_STATUSES)

    generated_article.review_status = "approved"
    generated_article.article.status = "approved"
    _touch_generated_article(generated_article)
    _touch_source_article(generated_article)
    _create_review_event(db, generated_article, "approved", payload.reviewer_email, payload.note)
    _commit_or_500(db, "approve generated article")
    db.refresh(generated_article)
    return _build_generated_article_read(db, generated_article)


def _reject_generated_article(
    db: Session,
    generated_article: GeneratedArticle,
    payload: ReviewReasonRequest,
) -> ReviewGeneratedArticleRead:
    if generated_article.review_status in FINAL_REVIEW_STATUSES:
        _raise_invalid_status("reject", generated_article.review_status)

    generated_article.review_status = "rejected"
    generated_article.article.status = "rejected"
    _touch_generated_article(generated_article)
    _touch_source_article(generated_article)
    _create_review_event(db, generated_article, "rejected", payload.reviewer_email, payload.reason)
    _commit_or_500(db, "reject generated article")
    db.refresh(generated_article)
    return _build_generated_article_read(db, generated_article)


def _request_generated_article_revision(
    db: Session,
    generated_article: GeneratedArticle,
    payload: ReviewReasonRequest,
) -> ReviewGeneratedArticleRead:
    if generated_article.review_status in FINAL_REVIEW_STATUSES:
        _raise_invalid_status("request revision for", generated_article.review_status)

    generated_article.review_status = "needs_revision"
    generated_article.article.status = "generation_failed"
    _touch_generated_article(generated_article)
    _touch_source_article(generated_article)
    _create_review_event(db, generated_article, "needs_revision", payload.reviewer_email, payload.reason)
    _commit_or_500(db, "request generated article revision")
    db.refresh(generated_article)
    return _build_generated_article_read(db, generated_article)


@router.get("/queues/summary", response_model=ReviewQueuesSummaryRead)
def get_review_queues_summary(db: DbSession) -> ReviewQueuesSummaryRead:
    rows = db.execute(
        select(GeneratedArticle.review_status, func.count())
        .where(GeneratedArticle.review_status.in_(SUMMARY_REVIEW_STATUSES))
        .group_by(GeneratedArticle.review_status)
    ).all()
    counts = {review_status: 0 for review_status in SUMMARY_REVIEW_STATUSES}
    for review_status, count in rows:
        counts[review_status] = int(count)
    return ReviewQueuesSummaryRead(**counts)


@router.get("/queue", response_model=list[ReviewQueueItemRead])
def list_review_queue(db: DbSession) -> list[ReviewQueueItemRead]:
    query = (
        select(GeneratedArticle)
        .options(joinedload(GeneratedArticle.article))
        .where(GeneratedArticle.review_status == "pending")
        .order_by(GeneratedArticle.created_at.asc())
    )
    return [_build_queue_item(item) for item in db.scalars(query).all()]


@router.get("/generated/{generated_article_id}", response_model=ReviewGeneratedArticleRead)
def get_generated_article_for_review(
    generated_article_id: UUID,
    db: DbSession,
) -> ReviewGeneratedArticleRead:
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    return _build_generated_article_read(db, generated_article)


@router.patch("/generated/{generated_article_id}", response_model=ReviewGeneratedArticleRead)
def edit_generated_article_for_review(
    generated_article_id: UUID,
    payload: GeneratedArticleEditRequest,
    db: DbSession,
) -> ReviewGeneratedArticleRead:
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    if generated_article.review_status in FINAL_REVIEW_STATUSES:
        _raise_invalid_status("edit", generated_article.review_status)

    update_data = payload.model_dump(
        exclude_unset=True,
        exclude={"reviewer_email", "note"},
        mode="json",
    )
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one editable generated article field must be provided",
        )

    for field, value in update_data.items():
        setattr(generated_article, field, value)

    _touch_generated_article(generated_article)
    _create_review_event(db, generated_article, "edited", payload.reviewer_email, payload.note)
    _commit_or_500(db, "edit generated article")
    db.refresh(generated_article)
    return _build_generated_article_read(db, generated_article)


@router.post("/generated/{generated_article_id}/approve", response_model=ReviewGeneratedArticleRead)
def approve_generated_article_for_review(
    generated_article_id: UUID,
    db: DbSession,
    payload: ReviewActionRequest | None = Body(default=None),
) -> ReviewGeneratedArticleRead:
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    return _approve_generated_article(db, generated_article, payload or ReviewActionRequest())


@router.post("/generated/{generated_article_id}/reject", response_model=ReviewGeneratedArticleRead)
def reject_generated_article_for_review(
    generated_article_id: UUID,
    payload: ReviewReasonRequest,
    db: DbSession,
) -> ReviewGeneratedArticleRead:
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    return _reject_generated_article(db, generated_article, payload)


@router.post("/generated/{generated_article_id}/request-revision", response_model=ReviewGeneratedArticleRead)
def request_generated_article_revision_for_review(
    generated_article_id: UUID,
    payload: ReviewReasonRequest,
    db: DbSession,
) -> ReviewGeneratedArticleRead:
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    return _request_generated_article_revision(db, generated_article, payload)


@router.get("/generated/{generated_article_id}/events", response_model=list[ReviewEventRead])
def list_generated_article_review_events(
    generated_article_id: UUID,
    db: DbSession,
) -> list[ReviewEvent]:
    _get_generated_article_or_404(db, generated_article_id)
    query = (
        select(ReviewEvent)
        .where(ReviewEvent.generated_article_id == generated_article_id)
        .order_by(ReviewEvent.created_at.desc())
    )
    return list(db.scalars(query).all())


# Compatibility routes kept for the Step 4 review endpoints that already existed.
@router.get("/queue/{generated_article_id}", response_model=ReviewGeneratedArticleRead)
def get_review_queue_item(
    generated_article_id: UUID,
    db: DbSession,
) -> ReviewGeneratedArticleRead:
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    if generated_article.review_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending generated article not found",
        )
    return _build_generated_article_read(db, generated_article)


@router.post("/{generated_article_id}/approve", response_model=ReviewGeneratedArticleRead)
def approve_generated_article(
    generated_article_id: UUID,
    db: DbSession,
    payload: ReviewActionRequest | None = Body(default=None),
) -> ReviewGeneratedArticleRead:
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    return _approve_generated_article(db, generated_article, payload or ReviewActionRequest())


@router.post("/{generated_article_id}/reject", response_model=ReviewGeneratedArticleRead)
def reject_generated_article(
    generated_article_id: UUID,
    db: DbSession,
    payload: ReviewActionRequest | None = Body(default=None),
) -> ReviewGeneratedArticleRead:
    review_payload = payload or ReviewActionRequest()
    reason_payload = ReviewReasonRequest(
        reason=review_payload.note or "Rejected from legacy admin review route.",
        reviewer_email=review_payload.reviewer_email,
    )
    generated_article = _get_generated_article_or_404(db, generated_article_id)
    return _reject_generated_article(db, generated_article, reason_payload)


@router.patch("/{generated_article_id}/edit", response_model=ReviewGeneratedArticleRead)
def edit_generated_article(
    generated_article_id: UUID,
    payload: GeneratedArticleEditRequest,
    db: DbSession,
) -> ReviewGeneratedArticleRead:
    return edit_generated_article_for_review(generated_article_id, payload, db)

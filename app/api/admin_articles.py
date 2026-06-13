from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.article import ARTICLE_STATUSES, Article
from app.models.curation_score import CurationScore
from app.models.figure import ArticleFigure
from app.models.generated_article import GeneratedArticle
from app.models.section import ArticleSection
from app.schemas.article import (
    ArticleCreate,
    ArticleFigureRead,
    ArticleListItem,
    ArticleRead,
    ArticleSectionRead,
    ArticleUpdate,
)
from app.schemas.generation import GeneratedArticleRead


router = APIRouter(prefix="/api/admin/articles", tags=["admin articles"])

DbSession = Annotated[Session, Depends(get_db)]


def _get_article_or_404(db: Session, article_id: UUID) -> Article:
    article = db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article


def _doi_exists(db: Session, doi: str, exclude_id: UUID | None = None) -> bool:
    query = select(Article.id).where(Article.doi == doi)
    if exclude_id is not None:
        query = query.where(Article.id != exclude_id)
    return db.scalar(query) is not None


@router.get("/", response_model=list[ArticleListItem])
def list_articles(
    db: DbSession,
    status_filter: str | None = Query(default=None, alias="status"),
    journal_name: str | None = Query(default=None),
    field: str | None = Query(default=None),
    curated: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[Article]:
    if status_filter is not None and status_filter not in ARTICLE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"status must be one of: {', '.join(ARTICLE_STATUSES)}",
        )

    query = select(Article).order_by(Article.created_at.desc()).limit(limit).offset(offset)
    if status_filter:
        query = query.where(Article.status == status_filter)
    if journal_name:
        query = query.where(Article.journal_name == journal_name)
    if field:
        query = query.where(Article.field == field)
    if curated is not None:
        curated_exists = exists().where(
            CurationScore.article_id == Article.id,
            CurationScore.selected.is_(True),
        )
        query = query.where(curated_exists if curated else ~curated_exists)

    return list(db.scalars(query).all())


@router.post("/", response_model=ArticleRead, status_code=status.HTTP_201_CREATED)
def create_article(payload: ArticleCreate, db: DbSession) -> Article:
    if _doi_exists(db, payload.doi):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Article DOI already exists")

    article = Article(**payload.model_dump())
    db.add(article)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Article DOI already exists") from exc
    db.refresh(article)
    return article


@router.get("/{article_id}", response_model=ArticleRead)
def get_article(article_id: UUID, db: DbSession) -> Article:
    return _get_article_or_404(db, article_id)


@router.patch("/{article_id}", response_model=ArticleRead)
def update_article(article_id: UUID, payload: ArticleUpdate, db: DbSession) -> Article:
    article = _get_article_or_404(db, article_id)
    update_data = payload.model_dump(exclude_unset=True)

    if "doi" in update_data and _doi_exists(db, update_data["doi"], exclude_id=article_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Article DOI already exists")

    for field, value in update_data.items():
        setattr(article, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Article DOI already exists") from exc
    db.refresh(article)
    return article


@router.get("/{article_id}/sections", response_model=list[ArticleSectionRead])
def list_article_sections(article_id: UUID, db: DbSession) -> list[ArticleSection]:
    _get_article_or_404(db, article_id)
    query = (
        select(ArticleSection)
        .where(ArticleSection.article_id == article_id)
        .order_by(ArticleSection.section_name.asc())
    )
    return list(db.scalars(query).all())


@router.get("/{article_id}/figures", response_model=list[ArticleFigureRead])
def list_article_figures(article_id: UUID, db: DbSession) -> list[ArticleFigure]:
    _get_article_or_404(db, article_id)
    query = select(ArticleFigure).where(ArticleFigure.article_id == article_id).order_by(ArticleFigure.created_at.asc())
    return list(db.scalars(query).all())


@router.get("/{article_id}/generated", response_model=list[GeneratedArticleRead])
def list_generated_articles(article_id: UUID, db: DbSession) -> list[GeneratedArticle]:
    _get_article_or_404(db, article_id)
    query = (
        select(GeneratedArticle)
        .where(GeneratedArticle.article_id == article_id)
        .order_by(GeneratedArticle.created_at.desc())
    )
    return list(db.scalars(query).all())


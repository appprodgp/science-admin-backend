from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.article import Article
from app.models.figure import ArticleFigure
from app.models.section import ArticleSection
from app.schemas.article import ArticleRead
from app.schemas.manual_article import ManualArticleCreate
from app.services.license_service import get_license_type


router = APIRouter(prefix="/api/admin/manual", tags=["admin manual ingestion"])

DbSession = Annotated[Session, Depends(get_db)]


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(value.split())
    return cleaned or None


@router.post("/articles", response_model=ArticleRead)
def create_or_update_manual_article(payload: ManualArticleCreate, db: DbSession) -> Article:
    article = db.scalar(select(Article).where(Article.doi == payload.doi))
    if article is None:
        article = Article(doi=payload.doi, title=payload.title)
        db.add(article)

    article.doi = payload.doi
    article.title = payload.title
    article.journal_name = payload.journal_name
    article.journal_issn = payload.journal_issn
    article.publisher = payload.publisher
    article.published_date = payload.published_date
    article.source_url = payload.source_url
    article.license_url = payload.license_url
    article.license_type = payload.license_type or get_license_type(payload.license_url)
    article.abstract_from_metadata = payload.abstract
    article.xml_url = None
    article.xml_source = "manual"
    article.xml_r2_key = None
    article.status = "extracted"
    article.field = payload.field
    article.error_message = None
    db.flush()

    db.execute(delete(ArticleSection).where(ArticleSection.article_id == article.id))
    db.execute(delete(ArticleFigure).where(ArticleFigure.article_id == article.id))

    section_values = [
        ("abstract", payload.abstract),
        ("introduction", payload.introduction),
        ("methods", payload.methods),
        ("results", payload.results),
        ("discussion", payload.discussion),
        ("conclusion", payload.conclusion),
    ]
    for section_name, raw_text in section_values:
        section_text = _clean_text(raw_text)
        if section_text:
            db.add(
                ArticleSection(
                    article_id=article.id,
                    section_name=section_name,
                    section_text=section_text,
                    source="manual",
                )
            )

    for index, raw_caption in enumerate(payload.figure_captions, start=1):
        caption = _clean_text(raw_caption)
        if caption:
            db.add(
                ArticleFigure(
                    article_id=article.id,
                    figure_label=f"Figure {index}",
                    caption=caption,
                    source_credit=payload.source_url,
                    license_note=article.license_type,
                )
            )

    db.commit()
    db.refresh(article)
    return article
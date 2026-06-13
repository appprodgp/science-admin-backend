from __future__ import annotations

import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.article import Article
from app.models.figure import ArticleFigure
from app.models.section import ArticleSection


SECTION_ORDER = ("abstract", "introduction", "methods", "results", "discussion", "conclusion", "other")


def _truncate(value: str | None, max_chars: int) -> str:
    if not value or max_chars <= 0:
        return ""
    cleaned = " ".join(value.split())
    if len(cleaned) <= max_chars:
        return cleaned
    if max_chars <= 20:
        return cleaned[:max_chars]
    return f"{cleaned[: max_chars - 15].rstrip()}... [truncated]"


def _section_bucket(section_name: str | None) -> str:
    normalized = (section_name or "other").strip().lower()
    return normalized if normalized in SECTION_ORDER else "other"


def _append_section(existing: str, new_text: str) -> str:
    if not existing:
        return new_text
    if not new_text:
        return existing
    return f"{existing}\n\n{new_text}"


def build_article_context(db: Session, article_id: UUID, max_chars: int = 30000) -> dict:
    """Build a bounded source context for Step 4 LLM tasks."""

    article = db.get(Article, article_id)
    if article is None:
        raise ValueError("Article not found")

    article_context = {
        "id": str(article.id),
        "doi": article.doi,
        "title": article.title,
        "journal": article.journal_name,
        "published_date": article.published_date.isoformat() if article.published_date else None,
        "source_url": article.source_url,
        "license_url": article.license_url,
        "license_type": article.license_type,
        "field": article.field,
    }

    raw_sections = {section_name: "" for section_name in SECTION_ORDER}
    if article.abstract_from_metadata:
        raw_sections["abstract"] = _append_section(raw_sections["abstract"], article.abstract_from_metadata)

    section_rows = list(
        db.scalars(
            select(ArticleSection)
            .where(ArticleSection.article_id == article_id)
            .order_by(ArticleSection.created_at.asc())
        ).all()
    )
    for section in section_rows:
        bucket = _section_bucket(section.section_name)
        raw_sections[bucket] = _append_section(raw_sections[bucket], section.section_text)

    metadata_chars = len(json.dumps(article_context, ensure_ascii=False, default=str))
    figure_budget = min(5000, max(1000, max_chars // 6))
    section_budget = max(0, max_chars - metadata_chars - figure_budget)
    sections: dict[str, str] = {}

    remaining_sections = len(SECTION_ORDER)
    for section_name in SECTION_ORDER:
        remaining_sections = max(1, remaining_sections)
        allowance = section_budget // remaining_sections if section_budget > 0 else 0
        sections[section_name] = _truncate(raw_sections[section_name], allowance)
        section_budget = max(0, section_budget - len(sections[section_name]))
        remaining_sections -= 1

    figures: list[dict[str, str | None]] = []
    figure_rows = list(
        db.scalars(
            select(ArticleFigure)
            .where(ArticleFigure.article_id == article_id)
            .order_by(ArticleFigure.created_at.asc())
        ).all()
    )
    remaining_figure_budget = figure_budget
    for figure in figure_rows:
        if remaining_figure_budget <= 0:
            break
        caption = _truncate(figure.caption, min(1000, remaining_figure_budget))
        if not caption:
            continue
        figures.append(
            {
                "figure_label": figure.figure_label,
                "caption": caption,
                "source_credit": figure.source_credit,
                "license_note": figure.license_note,
            }
        )
        remaining_figure_budget -= len(caption)

    return {"article": article_context, "sections": sections, "figures": figures}

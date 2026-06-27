from __future__ import annotations

import math
import re
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.article import Article
from app.models.generated_article import GeneratedArticle
from app.schemas.public import (
    PublicArticleDetail,
    PublicArticleListResponse,
    PublicArticleQuiz,
    PublicArticleSource,
    PublicArticleSummary,
    PublicGlossaryTerm,
    PublicQuizOption,
    PublicQuizQuestion,
)


router = APIRouter(prefix="/api/public", tags=["public articles"])

DbSession = Annotated[Session, Depends(get_db)]

PUBLIC_REVIEW_STATUSES = ("approved", "published")
PUBLIC_ARTICLE_STATUSES = ("approved", "published")
QUIZ_OPTION_LABELS = ("A", "B", "C", "D")
WORDS_PER_READING_MINUTE = 200


def _clean_text(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned or None


def _title_for(generated_article: GeneratedArticle) -> str:
    return (
        _clean_text(generated_article.plain_title)
        or _clean_text(generated_article.article.title if generated_article.article else None)
        or "Untitled science article"
    )


def _paragraphs_from_body(body: str | None) -> list[str]:
    cleaned_body = _clean_text(body)
    if cleaned_body is None:
        return []
    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n\s*\n+", cleaned_body)]
    return [paragraph for paragraph in paragraphs if paragraph]


def _summary_for(generated_article: GeneratedArticle, paragraphs: list[str]) -> str | None:
    subtitle = _clean_text(generated_article.subtitle)
    if subtitle:
        return subtitle
    if paragraphs:
        return paragraphs[0]
    return None


def _read_minutes_for(body: str | None) -> int | None:
    cleaned_body = _clean_text(body)
    if cleaned_body is None:
        return None
    word_count = len(re.findall(r"\b\w+\b", cleaned_body))
    if word_count == 0:
        return None
    return max(1, math.ceil(word_count / WORDS_PER_READING_MINUTE))


def _glossary_from_json(value: Any) -> list[PublicGlossaryTerm]:
    if not isinstance(value, list):
        return []

    terms: list[PublicGlossaryTerm] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        word = _clean_text(item.get("word"))
        definition = _clean_text(item.get("definition"))
        why_it_matters = _clean_text(item.get("why_it_matters") or item.get("whyItMatters"))
        if not word or not definition or not why_it_matters:
            continue
        terms.append(
            PublicGlossaryTerm(
                id=f"term-{len(terms)}",
                word=word,
                definition=definition,
                whyItMatters=why_it_matters,
            )
        )
    return terms


def _limitations_from_json(value: Any) -> list[str]:
    candidates: Any = value
    if isinstance(value, dict):
        candidates = value.get("limitations") or value.get("items") or []
    if not isinstance(candidates, list):
        return []
    return [cleaned for item in candidates if isinstance(item, str) and (cleaned := item.strip())]


def _quiz_from_json(article_id: str, value: Any) -> list[PublicQuizQuestion]:
    if not isinstance(value, list):
        return []

    questions: list[PublicQuizQuestion] = []
    for item in value:
        if not isinstance(item, dict):
            continue

        prompt = _clean_text(item.get("question") or item.get("prompt"))
        raw_options = item.get("options")
        correct_answer = _clean_text(item.get("correct_answer") or item.get("correctAnswer"))
        explanation = _clean_text(item.get("explanation"))
        if not prompt or not isinstance(raw_options, list) or len(raw_options) != 4 or not correct_answer or not explanation:
            continue

        option_texts = [_clean_text(option) for option in raw_options]
        if any(option_text is None for option_text in option_texts):
            continue

        correct_index = next(
            (index for index, option_text in enumerate(option_texts) if option_text == correct_answer),
            None,
        )
        if correct_index is None:
            continue

        question_id = f"q-{len(questions)}"
        options = [
            PublicQuizOption(
                id=f"{question_id}-{label.lower()}",
                label=label,  # type: ignore[arg-type]
                text=option_text or "",
            )
            for label, option_text in zip(QUIZ_OPTION_LABELS, option_texts, strict=True)
        ]
        questions.append(
            PublicQuizQuestion(
                id=question_id,
                prompt=prompt,
                options=options,
                correctOptionId=options[correct_index].id,
                explanation=explanation,
            )
        )

    return questions


def _public_source_for(generated_article: GeneratedArticle) -> PublicArticleSource:
    article = generated_article.article
    if article is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Public article source metadata is unavailable",
        )
    return PublicArticleSource(
        title=article.title,
        doi=article.doi,
        journalName=article.journal_name,
        publisher=article.publisher,
        publishedDate=article.published_date,
        sourceUrl=article.source_url,
        licenseType=article.license_type,
        licenseUrl=article.license_url,
        attribution=generated_article.source_attribution,
    )


def _public_summary_for(generated_article: GeneratedArticle) -> PublicArticleSummary:
    paragraphs = _paragraphs_from_body(generated_article.article_body)
    glossary = _glossary_from_json(generated_article.difficult_words_json)
    quiz = _quiz_from_json(str(generated_article.id), generated_article.mcqs_json)
    return PublicArticleSummary(
        id=str(generated_article.id),
        title=_title_for(generated_article),
        subtitle=_clean_text(generated_article.subtitle),
        summary=_summary_for(generated_article, paragraphs),
        field=generated_article.article.field if generated_article.article else None,
        readMinutes=_read_minutes_for(generated_article.article_body),
        publishedAt=generated_article.published_at,
        source=_public_source_for(generated_article),
        glossaryCount=len(glossary),
        quizQuestionCount=len(quiz),
    )


def _public_detail_for(generated_article: GeneratedArticle) -> PublicArticleDetail:
    summary = _public_summary_for(generated_article)
    paragraphs = _paragraphs_from_body(generated_article.article_body)
    return PublicArticleDetail(
        **summary.model_dump(),
        body=_clean_text(generated_article.article_body) or "",
        paragraphs=paragraphs,
        glossary=_glossary_from_json(generated_article.difficult_words_json),
        limitations=_limitations_from_json(generated_article.limitations_json),
    )


def _public_article_filters() -> tuple[Any, ...]:
    return (
        GeneratedArticle.review_status.in_(PUBLIC_REVIEW_STATUSES),
        Article.status.in_(PUBLIC_ARTICLE_STATUSES),
    )


def _public_articles_select() -> Any:
    return (
        select(GeneratedArticle)
        .join(Article, GeneratedArticle.article_id == Article.id)
        .options(joinedload(GeneratedArticle.article))
        .where(*_public_article_filters())
    )


def _get_public_generated_article_or_404(db: Session, generated_article_id: UUID) -> GeneratedArticle:
    query = _public_articles_select().where(GeneratedArticle.id == generated_article_id)
    generated_article = db.scalar(query)
    if generated_article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return generated_article


@router.get("/articles", response_model=PublicArticleListResponse)
def list_public_articles(
    db: DbSession,
    field: str | None = Query(default=None, min_length=1, max_length=100),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> PublicArticleListResponse:
    filters = list(_public_article_filters())
    if field:
        filters.append(Article.field == field)

    total = db.scalar(
        select(func.count())
        .select_from(GeneratedArticle)
        .join(Article, GeneratedArticle.article_id == Article.id)
        .where(*filters)
    )
    query = (
        select(GeneratedArticle)
        .join(Article, GeneratedArticle.article_id == Article.id)
        .options(joinedload(GeneratedArticle.article))
        .where(*filters)
        .order_by(GeneratedArticle.published_at.desc().nullslast(), GeneratedArticle.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    items = [_public_summary_for(item) for item in db.scalars(query).all()]
    return PublicArticleListResponse(items=items, limit=limit, offset=offset, total=int(total or 0))


@router.get("/articles/{generated_article_id}", response_model=PublicArticleDetail)
def get_public_article(generated_article_id: UUID, db: DbSession) -> PublicArticleDetail:
    generated_article = _get_public_generated_article_or_404(db, generated_article_id)
    return _public_detail_for(generated_article)


@router.get("/articles/{generated_article_id}/quiz", response_model=PublicArticleQuiz)
def get_public_article_quiz(generated_article_id: UUID, db: DbSession) -> PublicArticleQuiz:
    generated_article = _get_public_generated_article_or_404(db, generated_article_id)
    return PublicArticleQuiz(
        articleId=str(generated_article.id),
        title=_title_for(generated_article),
        questions=_quiz_from_json(str(generated_article.id), generated_article.mcqs_json),
    )

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.article import ArticleRead


class CurationScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    article_id: UUID
    public_interest: int | None = None
    novelty: int | None = None
    evidence_strength: int | None = None
    human_relevance: int | None = None
    story_potential: int | None = None
    overhype_risk: int | None = None
    selected: bool
    reason: str | None = None
    model: str | None = None
    created_at: datetime


class GeneratedArticleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    article_id: UUID
    plain_title: str | None = None
    subtitle: str | None = None
    article_body: str | None = None
    difficult_words_json: Any = None
    mcqs_json: Any = None
    limitations_json: Any = None
    source_attribution: str | None = None
    fact_check_json: Any = None
    generation_model: str | None = None
    review_status: str
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class GeneratedArticleWithArticleRead(GeneratedArticleRead):
    article: ArticleRead


class LlmRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    article_id: UUID | None = None
    task_name: str
    provider: str | None = None
    model: str | None = None
    input_tokens_estimate: int | None = None
    output_tokens_estimate: int | None = None
    cost_estimate: Decimal | None = None
    status: str
    error_message: str | None = None
    created_at: datetime



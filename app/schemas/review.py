from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ReviewActionRequest(BaseModel):
    reviewer_email: str | None = Field(default=None, max_length=255)
    note: str | None = None


class ReviewReasonRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=4000)
    reviewer_email: str | None = Field(default=None, max_length=255)

    @field_validator("reason")
    @classmethod
    def reason_must_not_be_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("reason must not be blank")
        return cleaned


class ReviewDifficultWordEdit(BaseModel):
    model_config = ConfigDict(extra="allow")

    word: str = Field(min_length=1, max_length=120)
    definition: str = Field(min_length=1, max_length=1000)
    why_it_matters: str = Field(min_length=1, max_length=1000)

    @field_validator("word", "definition", "why_it_matters")
    @classmethod
    def difficult_word_fields_must_not_be_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("difficult word fields must not be blank")
        return cleaned


class ReviewMcqEdit(BaseModel):
    model_config = ConfigDict(extra="allow")

    question: str | None = Field(default=None, min_length=1, max_length=1000)
    options: list[str] = Field(min_length=4, max_length=4)
    correct_answer: str = Field(min_length=1, max_length=500)
    explanation: str | None = Field(default=None, min_length=1, max_length=1000)

    @field_validator("options")
    @classmethod
    def options_must_have_exactly_four_non_blank_items(cls, value: list[str]) -> list[str]:
        if len(value) != 4:
            raise ValueError("each MCQ must contain exactly 4 options")
        if any(not option.strip() for option in value):
            raise ValueError("MCQ options must not contain blank items")
        return value

    @model_validator(mode="after")
    def correct_answer_must_match_option(self) -> "ReviewMcqEdit":
        if self.correct_answer not in self.options:
            raise ValueError("correct_answer must exactly match one option")
        return self


class GeneratedArticleEditRequest(BaseModel):
    reviewer_email: str | None = Field(default=None, max_length=255)
    note: str | None = None
    plain_title: str | None = Field(default=None, min_length=1)
    subtitle: str | None = Field(default=None, min_length=1)
    article_body: str | None = Field(default=None, min_length=1)
    difficult_words_json: list[ReviewDifficultWordEdit] | None = None
    mcqs_json: list[ReviewMcqEdit] | None = Field(default=None, min_length=3, max_length=3)
    limitations_json: dict[str, Any] | list[Any] | None = None
    source_attribution: str | None = None


class ReviewArticleMetadata(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    doi: str
    title: str
    journal_name: str | None = None
    journal_issn: str | None = None
    publisher: str | None = None
    published_date: date | None = None
    source_url: str | None = None
    license_url: str | None = None
    license_type: str | None = None
    status: str
    field: str | None = None
    priority_score: int | None = None
    created_at: datetime
    updated_at: datetime


class ReviewCurationScoreRead(BaseModel):
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


class ReviewQueueItemRead(BaseModel):
    """Pending generated article card data for the admin review queue."""

    id: UUID
    generated_article_id: UUID
    article_id: UUID
    doi: str | None = None
    source_article_title: str | None = None
    journal_name: str | None = None
    published_date: date | None = None
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


class ReviewGeneratedArticleRead(ReviewQueueItemRead):
    """Full generated article payload for the admin review detail screen."""

    article: ReviewArticleMetadata
    curation_score: ReviewCurationScoreRead | None = None


class ReviewEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    article_id: UUID
    generated_article_id: UUID | None = None
    reviewer_email: str | None = None
    action: str
    note: str | None = None
    created_at: datetime


class ReviewQueuesSummaryRead(BaseModel):
    pending: int = 0
    needs_revision: int = 0
    approved: int = 0
    rejected: int = 0

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class PublicArticleSource(BaseModel):
    """Source-paper citation metadata that is safe for the public user app."""

    title: str
    doi: str
    journalName: str | None = None
    publisher: str | None = None
    publishedDate: date | None = None
    sourceUrl: str | None = None
    licenseType: str | None = None
    licenseUrl: str | None = None
    attribution: str | None = None


class PublicGlossaryTerm(BaseModel):
    id: str
    word: str
    definition: str
    whyItMatters: str


class PublicArticleSummary(BaseModel):
    """Feed/list card data for public approved science explainers."""

    id: str
    title: str
    subtitle: str | None = None
    summary: str | None = None
    field: str | None = None
    readMinutes: int | None = Field(default=None, ge=1)
    publishedAt: datetime | None = None
    source: PublicArticleSource
    glossaryCount: int = Field(ge=0)
    quizQuestionCount: int = Field(ge=0)


class PublicArticleListResponse(BaseModel):
    items: list[PublicArticleSummary]
    limit: int = Field(ge=1)
    offset: int = Field(ge=0)
    total: int = Field(ge=0)


class PublicArticleDetail(PublicArticleSummary):
    """Full reader payload for a public approved science explainer."""

    body: str
    paragraphs: list[str]
    glossary: list[PublicGlossaryTerm]
    limitations: list[str]


PublicQuizOptionLabel = Literal["A", "B", "C", "D"]


class PublicQuizOption(BaseModel):
    id: str
    label: PublicQuizOptionLabel
    text: str


class PublicQuizQuestion(BaseModel):
    id: str
    prompt: str
    options: list[PublicQuizOption] = Field(min_length=4, max_length=4)
    correctOptionId: str
    explanation: str


class PublicArticleQuiz(BaseModel):
    articleId: str
    title: str
    questions: list[PublicQuizQuestion]

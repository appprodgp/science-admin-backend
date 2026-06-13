from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ReviewActionRequest(BaseModel):
    reviewer_email: str | None = Field(default=None, max_length=255)
    note: str | None = None


class GeneratedArticleEditRequest(BaseModel):
    reviewer_email: str | None = Field(default=None, max_length=255)
    note: str | None = None
    plain_title: str | None = None
    subtitle: str | None = None
    article_body: str | None = None
    difficult_words_json: dict[str, Any] | list[Any] | None = None
    mcqs_json: dict[str, Any] | list[Any] | None = None
    limitations_json: dict[str, Any] | list[Any] | None = None
    source_attribution: str | None = None
    fact_check_json: dict[str, Any] | list[Any] | None = None
    generation_model: str | None = Field(default=None, max_length=255)


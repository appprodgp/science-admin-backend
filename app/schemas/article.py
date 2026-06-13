from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.article import ARTICLE_STATUSES


class ArticleBase(BaseModel):
    doi: str = Field(min_length=1, max_length=512)
    title: str = Field(min_length=1)
    journal_name: str | None = Field(default=None, max_length=255)
    journal_issn: str | None = Field(default=None, max_length=32)
    publisher: str | None = Field(default=None, max_length=255)
    published_date: date | None = None
    source_url: str | None = None
    license_url: str | None = None
    license_type: str | None = Field(default=None, max_length=100)
    abstract_from_metadata: str | None = None
    xml_url: str | None = None
    xml_source: str | None = Field(default=None, max_length=100)
    xml_r2_key: str | None = None
    status: str = "metadata_found"
    field: str | None = Field(default=None, max_length=100)
    priority_score: int | None = None
    error_message: str | None = None

    @field_validator("doi")
    @classmethod
    def normalize_doi(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in ARTICLE_STATUSES:
            allowed = ", ".join(ARTICLE_STATUSES)
            raise ValueError(f"status must be one of: {allowed}")
        return value


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    doi: str | None = Field(default=None, min_length=1, max_length=512)
    title: str | None = Field(default=None, min_length=1)
    journal_name: str | None = Field(default=None, max_length=255)
    journal_issn: str | None = Field(default=None, max_length=32)
    publisher: str | None = Field(default=None, max_length=255)
    published_date: date | None = None
    source_url: str | None = None
    license_url: str | None = None
    license_type: str | None = Field(default=None, max_length=100)
    abstract_from_metadata: str | None = None
    xml_url: str | None = None
    xml_source: str | None = Field(default=None, max_length=100)
    xml_r2_key: str | None = None
    status: str | None = None
    field: str | None = Field(default=None, max_length=100)
    priority_score: int | None = None
    error_message: str | None = None

    @field_validator("doi")
    @classmethod
    def normalize_optional_doi(cls, value: str | None) -> str | None:
        return value.strip().lower() if value else value

    @field_validator("status")
    @classmethod
    def validate_optional_status(cls, value: str | None) -> str | None:
        if value is not None and value not in ARTICLE_STATUSES:
            allowed = ", ".join(ARTICLE_STATUSES)
            raise ValueError(f"status must be one of: {allowed}")
        return value


class ArticleFilterParams(BaseModel):
    status: str | None = None
    journal_name: str | None = None
    field: str | None = None
    curated: bool | None = None
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


class ArticleListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    doi: str
    title: str
    journal_name: str | None = None
    journal_issn: str | None = None
    publisher: str | None = None
    published_date: date | None = None
    status: str
    field: str | None = None
    priority_score: int | None = None
    created_at: datetime
    updated_at: datetime


class ArticleRead(ArticleBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class ArticleSectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    article_id: UUID
    section_name: str
    section_text: str
    source: str | None = None
    created_at: datetime
    updated_at: datetime


class ArticleFigureRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    article_id: UUID
    figure_label: str | None = None
    caption: str
    image_r2_key: str | None = None
    image_url: str | None = None
    source_credit: str | None = None
    license_note: str | None = None
    created_at: datetime
    updated_at: datetime


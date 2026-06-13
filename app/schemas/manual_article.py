from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field, field_validator, model_validator

from app.services.license_service import is_allowed_cc_by_license


class ManualArticleCreate(BaseModel):
    doi: str = Field(min_length=1, max_length=512)
    title: str = Field(min_length=1)
    journal_name: str | None = Field(default=None, max_length=255)
    journal_issn: str | None = Field(default=None, max_length=32)
    publisher: str | None = Field(default=None, max_length=255)
    published_date: date | None = None
    source_url: str | None = None
    license_url: str
    license_type: str | None = Field(default=None, max_length=100)
    field: str | None = Field(default=None, max_length=100)
    abstract: str | None = None
    introduction: str | None = None
    methods: str | None = None
    results: str | None = None
    discussion: str | None = None
    conclusion: str | None = None
    figure_captions: list[str] = Field(default_factory=list)
    permission_confirmed: bool

    @field_validator("doi")
    @classmethod
    def normalize_doi(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("permission_confirmed")
    @classmethod
    def permission_must_be_confirmed(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("permission_confirmed must be true for manual ingestion")
        return value

    @model_validator(mode="after")
    def license_must_be_cc_by(self) -> "ManualArticleCreate":
        if not is_allowed_cc_by_license(self.license_url):
            raise ValueError("Manual ingestion currently requires a CC BY 4.0 license URL")
        return self
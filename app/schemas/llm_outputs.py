from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, PrivateAttr, field_validator, model_validator


class StrictLlmOutput(BaseModel):
    """Base class for structured LLM outputs.

    The private provider/model attributes are populated by the LLM client after
    validation so service code can persist which provider actually succeeded.
    They are not part of the public JSON schema.
    """

    model_config = ConfigDict(extra="forbid")

    _llm_provider: str | None = PrivateAttr(default=None)
    _llm_model: str | None = PrivateAttr(default=None)


class CurationOutput(StrictLlmOutput):
    public_interest: int = Field(ge=0, le=10)
    novelty: int = Field(ge=0, le=10)
    evidence_strength: int = Field(ge=0, le=10)
    human_relevance: int = Field(ge=0, le=10)
    story_potential: int = Field(ge=0, le=10)
    overhype_risk: int = Field(ge=0, le=10)
    selected: bool
    reason: str = Field(min_length=1, max_length=2000)


class DifficultWord(StrictLlmOutput):
    word: str = Field(min_length=1, max_length=120)
    definition: str = Field(min_length=1, max_length=1000)
    why_it_matters: str = Field(min_length=1, max_length=1000)

    @field_validator("word", "definition", "why_it_matters")
    @classmethod
    def difficult_word_fields_must_not_be_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Difficult word fields must not be blank")
        return cleaned


class MCQ(StrictLlmOutput):
    question: str = Field(min_length=1, max_length=1000)
    options: list[str] = Field(min_length=4, max_length=4)
    correct_answer: str = Field(min_length=1, max_length=500)
    explanation: str = Field(min_length=1, max_length=1000)

    @field_validator("options")
    @classmethod
    def options_must_be_non_empty(cls, value: list[str]) -> list[str]:
        if len(value) != 4:
            raise ValueError("MCQ options must contain exactly 4 items")
        if any(not option.strip() for option in value):
            raise ValueError("MCQ options must not contain blank items")
        return value

    @model_validator(mode="after")
    def correct_answer_must_match_option(self) -> "MCQ":
        if self.correct_answer not in self.options:
            raise ValueError("correct_answer must exactly match one of the options")
        return self


class GeneratedArticleOutput(StrictLlmOutput):
    plain_title: str = Field(min_length=1, max_length=300)
    subtitle: str = Field(min_length=1, max_length=500)
    article_body: str = Field(min_length=1)
    difficult_words: list[DifficultWord] = Field(min_length=5, max_length=8)
    mcqs: list[MCQ] = Field(min_length=3, max_length=3)
    limitations: list[str] = Field(min_length=1, max_length=12)
    source_attribution: str = Field(min_length=1, max_length=1000)

    @field_validator("difficult_words")
    @classmethod
    def difficult_words_must_be_unique(cls, value: list[DifficultWord]) -> list[DifficultWord]:
        normalized_words = [item.word.strip().lower() for item in value]
        if len(set(normalized_words)) != len(normalized_words):
            raise ValueError("difficult_words must not contain duplicate terms")
        return value

    @field_validator("limitations")
    @classmethod
    def limitations_must_be_non_empty(cls, value: list[str]) -> list[str]:
        if any(not item.strip() for item in value):
            raise ValueError("limitations must not contain blank items")
        return value


class UnsupportedClaim(StrictLlmOutput):
    claim_text: str = Field(min_length=1, max_length=1500)
    reason: str = Field(min_length=1, max_length=1500)
    source_support_status: Literal["unsupported", "overstated", "partially_supported"]


class FactCheckOutput(StrictLlmOutput):
    accuracy_pass: bool
    unsupported_claims: list[UnsupportedClaim] = Field(max_length=30)
    overhype_flags: list[str] = Field(max_length=30)
    missing_limitations: list[str] = Field(max_length=30)
    suggested_fixes: list[str] = Field(max_length=30)
    final_recommendation: str = Field(min_length=1, max_length=1000)

    @field_validator("overhype_flags", "missing_limitations", "suggested_fixes")
    @classmethod
    def string_lists_must_not_contain_blanks(cls, value: list[str]) -> list[str]:
        if any(not item.strip() for item in value):
            raise ValueError("Fact-check string lists must not contain blank items")
        return value


from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy.orm import Session
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.models.llm_run import LlmRun


logger = logging.getLogger(__name__)


class LlmClientError(RuntimeError):
    """Safe public error raised when all configured LLM providers fail."""


class LlmConfigurationError(LlmClientError):
    """Raised for non-retryable provider configuration problems."""


class LlmProviderError(RuntimeError):
    """Raised for retryable provider/API/validation failures."""


@dataclass(slots=True)
class _ProviderJsonResponse:
    parsed: BaseModel
    raw_text: str
    input_tokens: int | None = None
    output_tokens: int | None = None


def _safe_error_message(error: Exception | str, max_length: int = 1000) -> str:
    message = str(error).strip()
    if not message and isinstance(error, Exception):
        message = error.__class__.__name__
    message = re.sub(r"sk-[A-Za-z0-9_\-]{8,}", "sk-***", message)
    message = re.sub(r"AIza[A-Za-z0-9_\-]{8,}", "AIza***", message)
    message = re.sub(r"\s+", " ", message).strip()
    return (message or "LLM provider error")[:max_length]


def _secret_value(value: Any) -> str:
    if value is None:
        return ""
    if hasattr(value, "get_secret_value"):
        return str(value.get_secret_value())
    return str(value)


def _normalize_provider(provider: str | None) -> str:
    return (provider or "").strip().lower()


def model_for_task(provider: str, task_name: str) -> str:
    """Return the configured model for a provider/task combination."""

    settings = get_settings()
    provider_name = _normalize_provider(provider)
    task = task_name.strip().lower()

    if provider_name == "openai":
        if "curation" in task or "curate" in task:
            return settings.OPENAI_MODEL_CURATION
        if "fact" in task:
            return settings.OPENAI_MODEL_FACTCHECK
        return settings.OPENAI_MODEL_GENERATION

    if provider_name == "gemini":
        if "curation" in task or "curate" in task:
            return settings.GEMINI_MODEL_CURATION
        # There is no existing GEMINI_MODEL_FACTCHECK env var. Use the
        # generation model for fact-checking fallback to avoid adding config.
        return settings.GEMINI_MODEL_GENERATION

    return ""


def _estimate_tokens(text: str | None) -> int | None:
    if not text:
        return None
    return max(1, len(text) // 4)


def _build_json_user_prompt(user_prompt: str, output_schema: type[BaseModel]) -> str:
    schema_json = json.dumps(output_schema.model_json_schema(), ensure_ascii=False)
    return (
        f"{user_prompt}\n\n"
        "Return JSON only. Do not include markdown, commentary, or code fences. "
        "The JSON object must validate against this schema exactly:\n"
        f"{schema_json}"
    )


def _extract_json_text(raw_text: str) -> str:
    text = (raw_text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE).strip()
        text = re.sub(r"\s*```$", "", text).strip()

    if not text.startswith("{"):
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]

    return text


def _parse_and_validate(raw_text: str, output_schema: type[BaseModel]) -> BaseModel:
    try:
        json_text = _extract_json_text(raw_text)
        parsed_json = json.loads(json_text)
        return output_schema.model_validate(parsed_json)
    except Exception as exc:
        raise LlmProviderError(f"LLM JSON output failed validation: {_safe_error_message(exc)}") from exc


def _set_llm_metadata(output: BaseModel, provider: str, model: str) -> None:
    try:
        setattr(output, "_llm_provider", provider)
        setattr(output, "_llm_model", model)
    except Exception:
        # Metadata is best-effort; validated content remains usable without it.
        logger.debug("Unable to attach LLM metadata to output model.")


def _log_llm_run(
    db: Session,
    *,
    article_id: UUID | None,
    task_name: str,
    provider: str,
    model: str,
    input_tokens_estimate: int | None,
    output_tokens_estimate: int | None,
    status: str,
    error_message: str | None = None,
) -> None:
    db.add(
        LlmRun(
            article_id=article_id,
            task_name=task_name,
            provider=provider,
            model=model,
            input_tokens_estimate=input_tokens_estimate,
            output_tokens_estimate=output_tokens_estimate,
            cost_estimate=None,
            status=status,
            error_message=_safe_error_message(error_message) if error_message else None,
        )
    )
    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        raise LlmClientError(f"Failed to log LLM run: {_safe_error_message(exc)}") from exc


def _extract_gemini_text(response: Any) -> str:
    text = getattr(response, "text", None)
    if text:
        return str(text)

    parts: list[str] = []
    for candidate in getattr(response, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", []) or []:
            part_text = getattr(part, "text", None)
            if part_text:
                parts.append(str(part_text))
    return "\n".join(parts)


def _call_openai_once(
    model: str,
    system_prompt: str,
    final_user_prompt: str,
    output_schema: type[BaseModel],
) -> _ProviderJsonResponse:
    settings = get_settings()
    api_key = _secret_value(settings.OPENAI_API_KEY)
    if not api_key:
        raise LlmConfigurationError("OpenAI API key is not configured.")

    try:
        from openai import OpenAI
    except Exception as exc:
        raise LlmConfigurationError(f"OpenAI SDK is unavailable: {_safe_error_message(exc)}") from exc

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": final_user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        raw_text = response.choices[0].message.content or ""
        usage = getattr(response, "usage", None)
        input_tokens = getattr(usage, "prompt_tokens", None) if usage else None
        output_tokens = getattr(usage, "completion_tokens", None) if usage else None
    except Exception as exc:
        raise LlmProviderError(_safe_error_message(exc)) from exc

    parsed = _parse_and_validate(raw_text, output_schema)
    return _ProviderJsonResponse(
        parsed=parsed,
        raw_text=raw_text,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
    )


def _call_gemini_once(
    model: str,
    system_prompt: str,
    final_user_prompt: str,
    output_schema: type[BaseModel],
) -> _ProviderJsonResponse:
    settings = get_settings()
    api_key = _secret_value(settings.GEMINI_API_KEY)
    if not api_key:
        raise LlmConfigurationError("Gemini API key is not configured.")

    try:
        from google import genai
        from google.genai import types
    except Exception as exc:
        raise LlmConfigurationError(f"Gemini SDK is unavailable: {_safe_error_message(exc)}") from exc

    try:
        client = genai.Client(api_key=api_key)
        try:
            response = client.models.generate_content(
                model=model,
                contents=final_user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
        except TypeError:
            # Keep Gemini isolated here: if this installed SDK version does not
            # accept structured config, fall back to a JSON-only prompt.
            response = client.models.generate_content(
                model=model,
                contents=f"{system_prompt}\n\n{final_user_prompt}",
            )

        raw_text = _extract_gemini_text(response)
        usage = getattr(response, "usage_metadata", None)
        input_tokens = getattr(usage, "prompt_token_count", None) if usage else None
        output_tokens = None
        if usage:
            output_tokens = getattr(usage, "candidates_token_count", None) or getattr(
                usage, "output_token_count", None
            )
    except Exception as exc:
        raise LlmProviderError(_safe_error_message(exc)) from exc

    parsed = _parse_and_validate(raw_text, output_schema)
    return _ProviderJsonResponse(
        parsed=parsed,
        raw_text=raw_text,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
    )


@retry(
    reraise=True,
    retry=retry_if_exception_type(LlmProviderError),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=6),
)
def _call_provider_once(
    provider: str,
    model: str,
    system_prompt: str,
    final_user_prompt: str,
    output_schema: type[BaseModel],
) -> _ProviderJsonResponse:
    provider_name = _normalize_provider(provider)
    if not model:
        raise LlmConfigurationError(f"No model configured for provider '{provider_name}'.")

    if provider_name == "openai":
        return _call_openai_once(model, system_prompt, final_user_prompt, output_schema)
    if provider_name == "gemini":
        return _call_gemini_once(model, system_prompt, final_user_prompt, output_schema)

    raise LlmConfigurationError(f"Unsupported LLM provider '{provider_name}'.")


def _provider_attempts(provider: str, model: str, task_name: str) -> list[tuple[str, str]]:
    settings = get_settings()
    primary_provider = _normalize_provider(provider or settings.LLM_PRIMARY_PROVIDER)
    primary_model = model or model_for_task(primary_provider, task_name)
    attempts = [(primary_provider, primary_model)]

    fallback_provider = _normalize_provider(settings.LLM_FALLBACK_PROVIDER)
    if fallback_provider and fallback_provider != primary_provider:
        attempts.append((fallback_provider, model_for_task(fallback_provider, task_name)))

    # Remove empty/duplicate attempts while preserving order.
    unique_attempts: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for attempt in attempts:
        if attempt[0] and attempt not in seen:
            unique_attempts.append(attempt)
            seen.add(attempt)
    return unique_attempts


def call_llm_json(
    provider: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    output_schema: type[BaseModel],
    task_name: str,
    article_id: UUID | None,
    db: Session,
) -> BaseModel:
    """Call the configured LLM provider and validate a JSON response.

    A failed primary provider is recorded in ``llm_runs`` before trying the
    configured fallback provider. Full prompts and secrets are never stored.
    """

    final_user_prompt = _build_json_user_prompt(user_prompt, output_schema)
    input_estimate = _estimate_tokens(f"{system_prompt}\n\n{final_user_prompt}")
    last_error: str | None = None

    for provider_name, model_name in _provider_attempts(provider, model, task_name):
        try:
            response = _call_provider_once(
                provider_name,
                model_name,
                system_prompt,
                final_user_prompt,
                output_schema,
            )
            output_estimate = response.output_tokens or _estimate_tokens(response.raw_text)
            _set_llm_metadata(response.parsed, provider_name, model_name)
            _log_llm_run(
                db,
                article_id=article_id,
                task_name=task_name,
                provider=provider_name,
                model=model_name,
                input_tokens_estimate=response.input_tokens or input_estimate,
                output_tokens_estimate=output_estimate,
                status="success",
            )
            return response.parsed
        except (LlmConfigurationError, LlmProviderError) as exc:
            last_error = _safe_error_message(exc)
            _log_llm_run(
                db,
                article_id=article_id,
                task_name=task_name,
                provider=provider_name,
                model=model_name,
                input_tokens_estimate=input_estimate,
                output_tokens_estimate=None,
                status="failed",
                error_message=last_error,
            )
            logger.warning(
                "LLM task %s failed for provider %s model %s: %s",
                task_name,
                provider_name,
                model_name,
                last_error,
            )

    raise LlmClientError(
        f"LLM task '{task_name}' failed for all configured providers. Last error: {last_error or 'unknown'}"
    )

from pydantic import SecretStr
from fastapi import APIRouter, Response, status

from app.config import get_settings
from app.database import check_database_connection


router = APIRouter(tags=["health"])


def _value_present(value: str | None) -> bool:
    return bool(value and value.strip())


def _secret_present(value: SecretStr | None) -> bool:
    return bool(value and value.get_secret_value().strip())


def build_safe_config_state() -> dict[str, bool | int | str]:
    """Return safe configuration state without exposing secret values."""

    settings = get_settings()
    return {
        "database_url_present": _secret_present(settings.DATABASE_URL),
        "openai_key_present": _secret_present(settings.OPENAI_API_KEY),
        "gemini_key_present": _secret_present(settings.GEMINI_API_KEY),
        "r2_config_present": all(
            [
                _value_present(settings.r2_endpoint_url),
                _secret_present(settings.R2_ACCESS_KEY_ID),
                _secret_present(settings.R2_SECRET_ACCESS_KEY),
                _value_present(settings.R2_BUCKET_NAME),
                _value_present(settings.R2_PUBLIC_BASE_URL),
            ]
        ),
        "redis_config_present": all(
            [
                _value_present(settings.UPSTASH_REDIS_REST_URL),
                _secret_present(settings.UPSTASH_REDIS_REST_TOKEN),
            ]
        ),
        "crossref_email_present": _value_present(settings.CROSSREF_CONTACT_EMAIL),
        "admin_emails_present": bool(settings.admin_allowed_email_list),
        "cors_origins_count": len(settings.cors_allowed_origins),
        "environment": settings.environment,
        "max_articles_per_journal": settings.MAX_ARTICLES_PER_JOURNAL,
        "max_llm_generations_per_run": settings.MAX_LLM_GENERATIONS_PER_RUN,
    }


@router.get("/health")
def health() -> dict[str, str]:
    settings = get_settings()
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "env": settings.environment,
    }


@router.get("/ready")
def ready(response: Response) -> dict[str, bool]:
    connected = check_database_connection()
    if not connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {"ready": connected, "database_connected": connected}


@router.get("/api/admin/status")
def admin_status() -> dict[str, object]:
    settings = get_settings()
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "env": settings.environment,
        "database_configured": _secret_present(settings.DATABASE_URL),
        "primary_llm_provider": settings.LLM_PRIMARY_PROVIDER,
        "fallback_llm_provider": settings.LLM_FALLBACK_PROVIDER,
    }


@router.get("/api/admin/config-check")
def config_check() -> dict[str, bool | int | str]:
    return build_safe_config_state()


@router.get("/api/admin/db-check")
def db_check() -> dict[str, bool]:
    return {"connected": check_database_connection()}
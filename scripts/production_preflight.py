from __future__ import annotations

import sys
from pathlib import Path

from pydantic import SecretStr


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.api.health import build_safe_config_state
from app.config import get_settings
from app.database import check_database_connection


SAFE_CONFIG_KEYS = [
    "database_url_present",
    "openai_key_present",
    "gemini_key_present",
    "r2_config_present",
    "redis_config_present",
    "crossref_email_present",
    "admin_emails_present",
    "cors_origins_count",
    "environment",
    "max_articles_per_journal",
    "max_llm_generations_per_run",
]


def _value_present(value: str | None) -> bool:
    return bool(value and value.strip())


def _secret_present(value: SecretStr | None) -> bool:
    return bool(value and value.get_secret_value().strip())


def _configured_llm_providers(primary: str, fallback: str) -> set[str]:
    providers = {primary.strip().lower(), fallback.strip().lower()}
    return {provider for provider in providers if provider and provider != "none"}


def _missing_required_production_variables() -> list[str]:
    settings = get_settings()
    missing: list[str] = []

    required_checks = [
        ("DATABASE_URL", _secret_present(settings.DATABASE_URL)),
        ("CROSSREF_CONTACT_EMAIL", _value_present(settings.CROSSREF_CONTACT_EMAIL)),
        ("R2_ENDPOINT_URL", _value_present(settings.R2_ENDPOINT_URL)),
        ("R2_ACCESS_KEY_ID", _secret_present(settings.R2_ACCESS_KEY_ID)),
        ("R2_SECRET_ACCESS_KEY", _secret_present(settings.R2_SECRET_ACCESS_KEY)),
        ("R2_BUCKET_NAME", _value_present(settings.R2_BUCKET_NAME)),
        ("R2_PUBLIC_BASE_URL", _value_present(settings.R2_PUBLIC_BASE_URL)),
        ("CORS_ALLOWED_ORIGINS", len(settings.cors_allowed_origins) > 0),
        ("ADMIN_EMAILS", _value_present(settings.ADMIN_EMAILS)),
        ("MAX_ARTICLES_PER_JOURNAL", settings.MAX_ARTICLES_PER_JOURNAL > 0),
        ("MAX_LLM_GENERATIONS_PER_RUN", settings.MAX_LLM_GENERATIONS_PER_RUN > 0),
    ]

    providers = _configured_llm_providers(
        settings.LLM_PRIMARY_PROVIDER,
        settings.LLM_FALLBACK_PROVIDER,
    )
    if "openai" in providers:
        required_checks.append(("OPENAI_API_KEY", _secret_present(settings.OPENAI_API_KEY)))
    if "gemini" in providers:
        required_checks.append(("GEMINI_API_KEY", _secret_present(settings.GEMINI_API_KEY)))

    for variable_name, is_present in required_checks:
        if not is_present:
            missing.append(variable_name)

    return missing


def _invalid_production_variables() -> list[str]:
    settings = get_settings()
    invalid: list[str] = []

    if settings.cors_uses_wildcard:
        invalid.append("CORS_ALLOWED_ORIGINS")
    if len(settings.cors_allowed_origins) != 1:
        invalid.append("CORS_ALLOWED_ORIGINS")

    return sorted(set(invalid))


def main() -> int:
    settings = get_settings()
    safe_state = build_safe_config_state()

    print("Safe configuration state:")
    for key in SAFE_CONFIG_KEYS:
        print(f"- {key}: {safe_state[key]}")

    database_connected = check_database_connection()
    print(f"- database_connected: {database_connected}")

    if not settings.is_production:
        print("Local development mode detected; production-required variable enforcement skipped.")
        return 0

    missing = _missing_required_production_variables()
    invalid = _invalid_production_variables()
    if not database_connected:
        invalid.append("DATABASE_URL")

    if missing or invalid:
        print("Production preflight failed.")
        if missing:
            print("Missing required production variables:")
            for variable_name in sorted(set(missing)):
                print(f"- {variable_name}")
        if invalid:
            print("Invalid production variables:")
            for variable_name in sorted(set(invalid)):
                print(f"- {variable_name}")
        return 1

    print("Production preflight passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
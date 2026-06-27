from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


LOCAL_DASHBOARD_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")
LOCAL_EXPO_WEB_ORIGINS = ("http://localhost:8081", "http://127.0.0.1:8081")
LOCAL_DEVELOPMENT_CORS_ORIGINS = (*LOCAL_DASHBOARD_ORIGINS, *LOCAL_EXPO_WEB_ORIGINS)


def _split_csv(value: str) -> list[str]:
    """Split a comma-separated environment variable into trimmed values."""

    return [part.strip() for part in value.split(",") if part.strip()]


def _dedupe(values: list[str] | tuple[str, ...]) -> list[str]:
    """Return non-empty strings once, preserving the original order."""

    seen: set[str] = set()
    deduped: list[str] = []
    for value in values:
        item = value.strip()
        if not item or item in seen:
            continue
        seen.add(item)
        deduped.append(item)
    return deduped


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Secrets are represented with ``SecretStr`` so accidental model dumps or logs
    do not expose sensitive values. Use the explicit helper properties only when
    a raw secret value is required by infrastructure code.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        env_ignore_empty=True,
        extra="ignore",
    )

    APP_ENV: str = Field(default="development")
    ENVIRONMENT: str = Field(default="")
    APP_NAME: str = Field(default="Science Admin Backend")

    DATABASE_URL: SecretStr | None = Field(default=None)

    R2_ACCOUNT_ID: str = Field(default="")
    R2_ENDPOINT_URL: str = Field(default="")
    R2_ACCESS_KEY_ID: SecretStr | None = Field(default=None)
    R2_SECRET_ACCESS_KEY: SecretStr | None = Field(default=None)
    R2_BUCKET_NAME: str = Field(default="")
    R2_PUBLIC_BASE_URL: str = Field(default="")

    OPENAI_API_KEY: SecretStr | None = Field(default=None)
    OPENAI_MODEL_CURATION: str = Field(default="gpt-4o-mini")
    OPENAI_MODEL_GENERATION: str = Field(default="gpt-4o-mini")
    OPENAI_MODEL_FACTCHECK: str = Field(default="gpt-4o-mini")

    GEMINI_API_KEY: SecretStr | None = Field(default=None)
    GEMINI_MODEL_CURATION: str = Field(default="gemini-2.5-flash")
    GEMINI_MODEL_GENERATION: str = Field(default="gemini-2.5-flash")

    LLM_PRIMARY_PROVIDER: str = Field(default="openai")
    LLM_FALLBACK_PROVIDER: str = Field(default="gemini")

    UPSTASH_REDIS_REST_URL: str = Field(default="")
    UPSTASH_REDIS_REST_TOKEN: SecretStr | None = Field(default=None)

    CROSSREF_CONTACT_EMAIL: str = Field(default="")
    ADMIN_ALLOWED_EMAILS: str = Field(default="")
    ADMIN_EMAILS: str = Field(default="")

    CORS_ALLOWED_ORIGINS: str = Field(default="")
    ADMIN_DASHBOARD_ORIGIN: str = Field(default="")

    MAX_ARTICLES_PER_JOURNAL: int = Field(default=25, ge=1)
    MAX_LLM_GENERATIONS_PER_RUN: int = Field(default=5, ge=1)

    @property
    def environment(self) -> str:
        """Return the active environment while preserving APP_ENV compatibility."""

        value = (self.ENVIRONMENT or self.APP_ENV or "development").strip()
        return value or "development"

    @property
    def is_production(self) -> bool:
        """Return True when the backend is running in production mode."""

        return self.environment.lower() == "production"

    @property
    def database_url(self) -> str:
        """Return the raw database URL for SQLAlchemy infrastructure only."""

        return self.DATABASE_URL.get_secret_value() if self.DATABASE_URL else ""

    @property
    def r2_endpoint_url(self) -> str:
        """Return the configured R2 endpoint URL, supporting the older account-id form."""

        endpoint_url = self.R2_ENDPOINT_URL.strip()
        if endpoint_url:
            return endpoint_url

        account_id = self.R2_ACCOUNT_ID.strip()
        if account_id:
            return f"https://{account_id}.r2.cloudflarestorage.com"

        return ""

    @property
    def admin_allowed_email_list(self) -> list[str]:
        """Return configured admin emails as a trimmed list.

        ``ADMIN_EMAILS`` is the production deployment name. ``ADMIN_ALLOWED_EMAILS``
        is kept for existing local development files.
        """

        return _dedupe(_split_csv(self.ADMIN_EMAILS) + _split_csv(self.ADMIN_ALLOWED_EMAILS))

    @property
    def configured_cors_origins(self) -> list[str]:
        """Return origins explicitly configured through environment variables only."""

        origins = _split_csv(self.CORS_ALLOWED_ORIGINS)
        dashboard_origin = self.ADMIN_DASHBOARD_ORIGIN.strip()
        if dashboard_origin:
            origins.append(dashboard_origin)
        return _dedupe(origins)

    @property
    def cors_uses_wildcard(self) -> bool:
        """Return True when a wildcard CORS origin was explicitly configured."""

        return "*" in self.configured_cors_origins

    @property
    def cors_allowed_origins(self) -> list[str]:
        """Return safe CORS origins for FastAPI middleware.

        Local development always includes dashboard and Expo web dev server
        origins. In production, only explicitly configured origins are allowed
        and wildcard origins are never passed to the middleware.
        """

        origins = [origin for origin in self.configured_cors_origins if origin != "*"]
        if not self.is_production:
            origins.extend(LOCAL_DEVELOPMENT_CORS_ORIGINS)
        return _dedupe(origins)

    def validate_production_safety(self) -> None:
        """Fail fast for production settings that would expose unsafe CORS."""

        if not self.is_production:
            return

        if self.cors_uses_wildcard:
            raise ValueError("Wildcard CORS origin '*' is not allowed in production.")

        if not self.cors_allowed_origins:
            raise ValueError("Production CORS must contain at least one deployed frontend origin.")


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings loaded from the environment."""

    return Settings()

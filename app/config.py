from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    APP_NAME: str = Field(default="Science Admin Backend")

    DATABASE_URL: SecretStr | None = Field(default=None)

    R2_ACCOUNT_ID: str = Field(default="")
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

    MAX_ARTICLES_PER_JOURNAL: int = Field(default=25, ge=1)
    MAX_LLM_GENERATIONS_PER_RUN: int = Field(default=5, ge=1)

    @property
    def database_url(self) -> str:
        """Return the raw database URL for SQLAlchemy infrastructure only."""

        return self.DATABASE_URL.get_secret_value() if self.DATABASE_URL else ""

    @property
    def admin_allowed_email_list(self) -> list[str]:
        """Return configured admin emails as a trimmed list."""

        return [
            email.strip()
            for email in self.ADMIN_ALLOWED_EMAILS.split(",")
            if email.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings loaded from the environment."""

    return Settings()

"""
WeCare.AI Backend Configuration

Centralized configuration using Pydantic Settings for environment-based config.
"""
import os
from functools import lru_cache
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "WeCare.AI"
    app_version: str = "0.1.0"
    debug: bool = Field(default=False, alias="DEBUG")
    environment: str = Field(default="development", alias="ENVIRONMENT")

    # Server
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="CORS_ORIGINS"
    )
    cors_origin_regex: str = Field(
        default=r"^https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.onrender\.com|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$",
        alias="CORS_ORIGIN_REGEX"
    )

    # Database
    database_url: str = Field(
        default="sqlite:///./wecare.db",
        alias="DATABASE_URL"
    )
    database_echo: bool = Field(default=False, alias="DATABASE_ECHO")

    # Clinical Rules
    rules_version: str = Field(
        default="WHO-IITT-12PLUS-LOCAL-v1",
        alias="RULES_VERSION"
    )
    min_assessment_age: int = Field(default=12, alias="MIN_ASSESSMENT_AGE")

    # Groq AI
    groq_api_key: Optional[str] = Field(default=None, alias="GROQ_API_KEY")

    # Speech-to-Text (Google Cloud Speech-to-Text)
    google_cloud_project: Optional[str] = Field(
        default=None,
        alias="GOOGLE_CLOUD_PROJECT"
    )
    google_application_credentials: Optional[str] = Field(
        default=None,
        alias="GOOGLE_APPLICATION_CREDENTIALS"
    )
    google_cloud_speech_location: str = Field(
        default="global",
        alias="GOOGLE_CLOUD_SPEECH_LOCATION"
    )
    google_cloud_speech_api_version: str = Field(
        default="v1",
        alias="GOOGLE_CLOUD_SPEECH_API_VERSION"
    )
    speech_transcription_enabled: bool = Field(
        default=False,
        alias="SPEECH_TRANSCRIPTION_ENABLED"
    )
    max_audio_upload_mb: int = Field(default=10, alias="MAX_AUDIO_UPLOAD_MB")
    max_audio_duration_seconds: int = Field(
        default=60,
        alias="MAX_AUDIO_DURATION_SECONDS"
    )

    # Supported languages for speech-to-text
    supported_language_codes: str = Field(
        default="en-IN,ta-IN,te-IN,hi-IN",
        alias="SUPPORTED_LANGUAGE_CODES"
    )

    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def supported_language_list(self) -> list[str]:
        """Parse supported language codes from comma-separated string."""
        return [lang.strip() for lang in self.supported_language_codes.split(",") if lang.strip()]

    @property
    def max_audio_upload_bytes(self) -> int:
        """Max audio upload size in bytes."""
        return self.max_audio_upload_mb * 1024 * 1024

    @property
    def groq_enabled(self) -> bool:
        """Whether Groq AI integration is available."""
        return bool(self.groq_api_key)


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
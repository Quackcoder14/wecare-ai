"""
WeCare.AI Voice Schemas

Pydantic models for speech-to-text API.
"""
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import SPEECH_LANGUAGE_CODES


class VoiceTranscribeResponse(BaseModel):
    """Response model for voice transcription."""
    model_config = ConfigDict(extra="allow")

    transcript: str
    language_code: str
    provider: str = "google-cloud-speech"
    transcription_status: str = "success"
    confidence: Optional[float] = None


class VoiceErrorResponse(BaseModel):
    """Error response for voice transcription."""
    model_config = ConfigDict(extra="allow")

    error: str
    code: str
    message: str
    details: Optional[dict] = None


class VoiceStatusResponse(BaseModel):
    """Speech service status response."""
    model_config = ConfigDict(extra="allow")

    configured: bool
    available: bool
    supported_languages: dict = Field(default_factory=dict)
    provider: str = "google-cloud-speech"
    message: Optional[str] = None


# Supported language codes for speech-to-text (matching frontend)
SUPPORTED_SPEECH_LANGUAGES = list(SPEECH_LANGUAGE_CODES.values())

# MIME types we accept
SUPPORTED_AUDIO_MIME_TYPES = [
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/ogg",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
]
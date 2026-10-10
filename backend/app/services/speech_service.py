"""
WeCare.AI Speech-to-Text Service

Google Cloud Speech-to-Text integration for multilingual transcription.
Supports: en-IN, ta-IN, te-IN, hi-IN
"""
import io
import logging
from typing import Optional, BinaryIO
from dataclasses import dataclass

from google.cloud import speech
from google.api_core.exceptions import GoogleAPICallError, RetryError

from app.config import settings
from app.schemas.voice import (
    VoiceTranscribeResponse,
    VoiceErrorResponse,
    VoiceStatusResponse,
    SUPPORTED_SPEECH_LANGUAGES,
    SUPPORTED_AUDIO_MIME_TYPES,
)
from app.exceptions import (
    SpeechNotConfiguredException,
    UnsupportedLanguageException,
    InvalidAudioException,
    AudioTooLargeException,
    UnsupportedAudioFormatException,
    TranscriptionEmptyException,
    SpeechProviderUnavailableException,
    SpeechProviderErrorException,
)

logger = logging.getLogger(__name__)


@dataclass
class SpeechConfig:
    """Configuration for speech recognition."""
    language_code: str
    sample_rate_hertz: int = 16000
    enable_automatic_punctuation: bool = True
    model: str = "latest_long"  # Best for longer audio
    use_enhanced: bool = True


class SpeechToTextProvider:
    """Abstract provider interface."""
    
    def transcribe(self, audio_data: bytes, config: SpeechConfig) -> str:
        raise NotImplementedError

    def is_available(self) -> bool:
        raise NotImplementedError


class GoogleCloudSpeechProvider(SpeechToTextProvider):
    """Google Cloud Speech-to-Text provider implementation."""

    def __init__(self):
        self._client: Optional[speech.SpeechClient] = None
        self._initialized = False
        self._init_error: Optional[str] = None

    def _initialize(self) -> bool:
        """Lazy initialization of the Speech client."""
        if self._initialized:
            return self._client is not None

        self._initialized = True

        try:
            # Check credentials
            if not settings.google_application_credentials and not settings.google_cloud_project:
                self._init_error = "Google Cloud credentials not configured"
                logger.warning(self._init_error)
                return False

            # Create client - will use Application Default Credentials if available
            self._client = speech.SpeechClient()
            logger.info("Google Cloud Speech client initialized successfully")
            return True

        except Exception as e:
            self._init_error = f"Failed to initialize Speech client: {str(e)}"
            logger.error(self._init_error)
            return False

    def is_available(self) -> bool:
        """Check if the provider is configured and available."""
        return self._initialize() and self._client is not None

    def get_init_error(self) -> Optional[str]:
        """Get initialization error if any."""
        return self._init_error

    def transcribe(self, audio_data: bytes, config: SpeechConfig) -> str:
        """
        Transcribe audio data using Google Cloud Speech-to-Text.

        Args:
            audio_data: Raw audio bytes
            config: Speech recognition configuration

        Returns:
            Transcribed text

        Raises:
            SpeechProviderErrorException: On transcription failure
        """
        if not self._initialize() or not self._client:
            raise SpeechProviderUnavailableException(
                "Speech-to-text service not configured. "
                "Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_PROJECT."
            )

        try:
            # Configure recognition
            recognition_config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=config.sample_rate_hertz,
                language_code=config.language_code,
                enable_automatic_punctuation=config.enable_automatic_punctuation,
                model=config.model,
                use_enhanced=config.use_enhanced,
                # Alternative language codes for better multilingual support
                alternative_language_codes=[
                    code for code in SUPPORTED_SPEECH_LANGUAGES
                    if code != config.language_code
                ][:3],  # Max 3 alternatives
            )

            # Create audio object
            audio = speech.RecognitionAudio(content=audio_data)

            # Perform transcription
            logger.info(f"Starting transcription for language: {config.language_code}")
            response = self._client.recognize(
                config=recognition_config,
                audio=audio,
            )

            # Extract transcript
            transcript_parts = []
            for result in response.results:
                if result.alternatives:
                    transcript_parts.append(result.alternatives[0].transcript)

            transcript = " ".join(transcript_parts).strip()

            if not transcript:
                raise TranscriptionEmptyException()

            logger.info(f"Transcription successful: {len(transcript)} characters")
            return transcript

        except GoogleAPICallError as e:
            logger.error(f"Google API error during transcription: {e}")
            raise SpeechProviderErrorException(str(e))
        except RetryError as e:
            logger.error(f"Transcription timeout: {e}")
            raise SpeechProviderUnavailableException("Transcription request timed out")
        except TranscriptionEmptyException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during transcription: {e}")
            raise SpeechProviderErrorException(f"Transcription failed: {str(e)}")


class SpeechTranscriptionService:
    """High-level speech transcription service."""

    def __init__(self):
        self.provider = GoogleCloudSpeechProvider()
        self._config_cache: dict[str, SpeechConfig] = {}

    def is_configured(self) -> bool:
        """Check if speech service is configured."""
        return self.provider.is_available()

    def get_status(self) -> VoiceStatusResponse:
        """Get speech service status."""
        configured = self.is_configured()
        available = configured

        if not configured:
            error = self.provider.get_init_error()
            return VoiceStatusResponse(
                configured=False,
                available=False,
                supported_languages={
                    code: {"name": self._get_language_name(code), "configured": False}
                    for code in SUPPORTED_SPEECH_LANGUAGES
                },
                message=error or "Google Cloud credentials not configured",
            )

        # Test availability with a lightweight check
        return VoiceStatusResponse(
            configured=True,
            available=available,
            supported_languages={
                code: {"name": self._get_language_name(code), "configured": True}
                for code in SUPPORTED_SPEECH_LANGUAGES
            },
        )

    def _get_language_name(self, code: str) -> str:
        """Get human-readable language name."""
        names = {
            "en-IN": "English (India)",
            "ta-IN": "Tamil (India)",
            "te-IN": "Telugu (India)",
            "hi-IN": "Hindi (India)",
        }
        return names.get(code, code)

    def validate_language(self, language_code: str) -> None:
        """Validate language code is supported."""
        if language_code not in SUPPORTED_SPEECH_LANGUAGES:
            raise UnsupportedLanguageException(language_code, SUPPORTED_SPEECH_LANGUAGES)

    def validate_audio(self, audio_data: bytes, mime_type: str) -> None:
        """Validate audio data."""
        if not audio_data:
            raise InvalidAudioException("Empty audio data")

        if len(audio_data) > settings.max_audio_upload_bytes:
            raise AudioTooLargeException(settings.max_audio_upload_mb)

        # Check MIME type (allow any that starts with supported prefixes)
        mime_supported = any(
            mime_type.startswith(supported.split(";")[0])
            for supported in SUPPORTED_AUDIO_MIME_TYPES
        )
        if not mime_supported:
            raise UnsupportedAudioFormatException(mime_type, SUPPORTED_AUDIO_MIME_TYPES)

    def get_config(self, language_code: str) -> SpeechConfig:
        """Get speech config for language."""
        if language_code not in self._config_cache:
            self._config_cache[language_code] = SpeechConfig(language_code=language_code)
        return self._config_cache[language_code]

    def transcribe(
        self,
        audio_data: bytes,
        language_code: str,
        mime_type: str = "audio/webm"
    ) -> VoiceTranscribeResponse:
        """
        Transcribe audio to text.

        Args:
            audio_data: Raw audio bytes
            language_code: Language code (en-IN, ta-IN, te-IN, hi-IN)
            mime_type: Audio MIME type

        Returns:
            VoiceTranscribeResponse with transcript

        Raises:
            Various speech exceptions
        """
        # Validate
        self.validate_language(language_code)
        self.validate_audio(audio_data, mime_type)

        if not self.is_configured():
            raise SpeechNotConfiguredException()

        # Get config and transcribe
        config = self.get_config(language_code)
        transcript = self.provider.transcribe(audio_data, config)

        return VoiceTranscribeResponse(
            transcript=transcript,
            language_code=language_code,
            provider="google-cloud-speech",
            transcription_status="success",
        )


# Singleton instance
_speech_service: Optional[SpeechTranscriptionService] = None


def get_speech_service() -> SpeechTranscriptionService:
    """Get or create the speech service singleton."""
    global _speech_service
    if _speech_service is None:
        _speech_service = SpeechTranscriptionService()
    return _speech_service
"""
WeCare.AI Custom Exceptions

Application-specific exception classes for consistent error handling.
"""
from typing import Optional, Any, Dict, List
from fastapi import HTTPException, status

from app.schemas.common import ErrorCode, ValidationErrorDetail


class WeCareException(Exception):
    """Base exception for WeCare.AI application."""

    def __init__(
        self,
        message: str,
        code: ErrorCode = ErrorCode.HTTP_ERROR,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class ValidationException(WeCareException):
    """Validation exception with field-level details."""

    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[List[ValidationErrorDetail]] = None,
        **kwargs,
    ):
        super().__init__(
            message=message,
            code=ErrorCode.VALIDATION_ERROR,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"errors": [d.model_dump() for d in (details or [])]},
        )


class NotFoundException(WeCareException):
    """Resource not found exception."""

    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} not found: {identifier}",
            code=ErrorCode.NOT_FOUND,
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "identifier": identifier},
        )


class AgeOutOfScopeException(WeCareException):
    """Exception for patients outside the supported age range."""

    def __init__(self, age: int, min_age: int = 12):
        super().__init__(
            message=(
                f"This prototype's routine assessment pathway is configured for "
                f"patients aged {min_age} and above. Patient age: {age}. "
                f"Please refer to the appropriate pediatric pathway and local clinical protocol."
            ),
            code=ErrorCode.AGE_OUT_OF_SCOPE,
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"age": age, "min_age": min_age},
        )


class InsufficientDataException(WeCareException):
    """Exception for insufficient clinical data to make an assessment."""

    def __init__(self, missing_fields: List[str]):
        super().__init__(
            message=(
                f"Insufficient clinical data to perform assessment. "
                f"Missing or unknown: {', '.join(missing_fields)}. "
                f"Please provide additional information or mark as needs review."
            ),
            code=ErrorCode.INSUFFICIENT_DATA,
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"missing_fields": missing_fields},
        )


class SpeechNotConfiguredException(WeCareException):
    """Exception when speech transcription is not configured."""

    def __init__(self):
        super().__init__(
            message="Speech-to-text service is not configured. Please set up Google Cloud credentials.",
            code=ErrorCode.SPEECH_NOT_CONFIGURED,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class UnsupportedLanguageException(WeCareException):
    """Exception for unsupported language code."""

    def __init__(self, language_code: str, supported: List[str]):
        super().__init__(
            message=f"Unsupported language code: {language_code}. Supported: {', '.join(supported)}",
            code=ErrorCode.UNSUPPORTED_LANGUAGE,
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"language_code": language_code, "supported": supported},
        )


class InvalidAudioException(WeCareException):
    """Exception for invalid audio upload."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code=ErrorCode.INVALID_AUDIO,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class AudioTooLargeException(WeCareException):
    """Exception for audio file exceeding size limit."""

    def __init__(self, max_mb: int):
        super().__init__(
            message=f"Audio file too large. Maximum size: {max_mb} MB",
            code=ErrorCode.AUDIO_TOO_LARGE,
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            details={"max_mb": max_mb},
        )


class UnsupportedAudioFormatException(WeCareException):
    """Exception for unsupported audio format."""

    def __init__(self, mime_type: str, supported: List[str]):
        super().__init__(
            message=f"Unsupported audio format: {mime_type}. Supported: {', '.join(supported)}",
            code=ErrorCode.UNSUPPORTED_AUDIO_FORMAT,
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            details={"mime_type": mime_type, "supported": supported},
        )


class TranscriptionEmptyException(WeCareException):
    """Exception when transcription returns no usable text."""

    def __init__(self):
        super().__init__(
            message="No speech recognized in the audio. Please try again with clearer audio.",
            code=ErrorCode.TRANSCRIPTION_EMPTY,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class SpeechProviderUnavailableException(WeCareException):
    """Exception when speech provider is unavailable."""

    def __init__(self, message: str = "Speech-to-text service temporarily unavailable"):
        super().__init__(
            message=message,
            code=ErrorCode.SPEECH_PROVIDER_UNAVAILABLE,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class SpeechProviderErrorException(WeCareException):
    """Exception for speech provider errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Speech-to-text provider error: {message}",
            code=ErrorCode.SPEECH_PROVIDER_ERROR,
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details,
        )


class DatabaseException(WeCareException):
    """Database operation exception."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Database error: {message}",
            code=ErrorCode.DATABASE_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


def http_exception_from_wecare(exc: WeCareException) -> HTTPException:
    """Convert WeCareException to FastAPI HTTPException."""
    return HTTPException(
        status_code=exc.status_code,
        detail={
            "error": {
                "code": exc.code.value,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )
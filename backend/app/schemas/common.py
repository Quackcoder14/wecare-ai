"""
WeCare.AI Common Schemas

Shared Pydantic models and enums.
"""
from datetime import datetime
from typing import List, Optional, Any, Dict
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict, field_validator


class LanguageCode(str, Enum):
    """Supported language codes."""
    EN = "en"
    TA = "ta"
    TE = "te"
    HI = "hi"


class InputMethod(str, Enum):
    """Input method enumeration."""
    MANUAL = "manual"
    VOICE = "voice"


class AcuityCategory(str, Enum):
    """WHO IITT acuity categories."""
    RED = "red"
    YELLOW = "yellow"
    GREEN = "green"
    UNASSESSED = "unassessed"
    NEEDS_REVIEW = "needs_review"
    OUT_OF_SCOPE = "out_of_scope"


class AssessmentStatus(str, Enum):
    """Assessment status enumeration."""
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING = "pending"
    ERROR = "error"


class ReviewStatus(str, Enum):
    """Review status for queue items."""
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    NOT_REQUIRED = "not_required"


class PatientStatus(str, Enum):
    """Patient record status."""
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class ErrorCode(str, Enum):
    """Standard API error codes."""
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    RATE_LIMITED = "RATE_LIMITED"
    HTTP_ERROR = "HTTP_ERROR"
    NETWORK_ERROR = "NETWORK_ERROR"
    AGE_OUT_OF_SCOPE = "AGE_OUT_OF_SCOPE"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    SPEECH_NOT_CONFIGURED = "SPEECH_NOT_CONFIGURED"
    UNSUPPORTED_LANGUAGE = "UNSUPPORTED_LANGUAGE"
    INVALID_AUDIO = "INVALID_AUDIO"
    AUDIO_TOO_LARGE = "AUDIO_TOO_LARGE"
    UNSUPPORTED_AUDIO_FORMAT = "UNSUPPORTED_AUDIO_FORMAT"
    TRANSCRIPTION_EMPTY = "TRANSCRIPTION_EMPTY"
    SPEECH_PROVIDER_UNAVAILABLE = "SPEECH_PROVIDER_UNAVAILABLE"
    SPEECH_PROVIDER_ERROR = "SPEECH_PROVIDER_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"


class ApiError(BaseModel):
    """Standard API error response."""
    model_config = ConfigDict(extra="allow")

    code: ErrorCode
    message: str
    details: Optional[Dict[str, Any]] = None
    status_code: int


class ValidationErrorDetail(BaseModel):
    """Validation error detail."""
    field: str
    message: str


class ValidationError(ApiError):
    """Validation error with field details."""
    code: ErrorCode = ErrorCode.VALIDATION_ERROR
    details: List[ValidationErrorDetail] = Field(default_factory=list)


class HealthStatus(BaseModel):
    """Health check response."""
    model_config = ConfigDict(extra="allow")

    status: str
    database: str
    clinical_rules: Dict[str, Any]
    speech: Dict[str, Any]


# Common response wrappers
class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""
    model_config = ConfigDict(extra="allow")

    items: List[Any]
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 1


# Speech-to-text language codes (Google Cloud format)
SPEECH_LANGUAGE_CODES = {
    "en": "en-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "hi": "hi-IN",
}

# Reverse mapping
SPEECH_TO_APP_LANGUAGE = {v: k for k, v in SPEECH_LANGUAGE_CODES.items()}
"""
WeCare.AI Schemas Package

Exports all Pydantic models.
"""
from app.schemas.common import (
    LanguageCode,
    InputMethod,
    AcuityCategory,
    AssessmentStatus,
    ReviewStatus,
    PatientStatus,
    ErrorCode,
    ApiError,
    ValidationError,
    ValidationErrorDetail,
    HealthStatus,
    PaginatedResponse,
    SPEECH_LANGUAGE_CODES,
    SPEECH_TO_APP_LANGUAGE,
)
# Import assessments first so AssessmentResponse is available for PatientDetail forward ref
from app.schemas.assessments import (
    AssessmentCreateRequest,
    AssessmentResponse,
    AcknowledgementRequest,
    AcknowledgementResponse,
    QueueItem,
    QueueResponse,
)
from app.schemas.patients import (
    VitalsInput,
    PatientCreateRequest,
    PatientUpdateRequest,
    PatientResponse,
    PatientDetail,
    ReassessmentRequest,
)
from app.schemas.voice import (
    VoiceTranscribeResponse,
    VoiceErrorResponse,
    VoiceStatusResponse,
    SUPPORTED_SPEECH_LANGUAGES,
    SUPPORTED_AUDIO_MIME_TYPES,
)
from app.schemas.queue import QueueItem as QueueItemAlias, QueueResponse as QueueResponseAlias

# Rebuild PatientDetail now that AssessmentResponse is available
PatientDetail.model_rebuild()

__all__ = [
    # Common
    "LanguageCode",
    "InputMethod",
    "AcuityCategory",
    "AssessmentStatus",
    "ReviewStatus",
    "PatientStatus",
    "ErrorCode",
    "ApiError",
    "ValidationError",
    "ValidationErrorDetail",
    "HealthStatus",
    "PaginatedResponse",
    "SPEECH_LANGUAGE_CODES",
    "SPEECH_TO_APP_LANGUAGE",
    # Patients
    "VitalsInput",
    "PatientCreateRequest",
    "PatientUpdateRequest",
    "PatientResponse",
    "PatientDetail",
    "ReassessmentRequest",
    # Assessments
    "AssessmentCreateRequest",
    "AssessmentResponse",
    "AcknowledgementRequest",
    "AcknowledgementResponse",
    "QueueItem",
    "QueueResponse",
    # Voice
    "VoiceTranscribeResponse",
    "VoiceErrorResponse",
    "VoiceStatusResponse",
    "SUPPORTED_SPEECH_LANGUAGES",
    "SUPPORTED_AUDIO_MIME_TYPES",
]
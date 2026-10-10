"""
WeCare.AI Voice API

Speech-to-text transcription endpoints.
"""
import logging
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from fastapi.responses import JSONResponse

from app.config import settings
from app.services.speech_service import get_speech_service
from app.schemas.voice import (
    VoiceTranscribeResponse,
    VoiceErrorResponse,
    VoiceStatusResponse,
    SUPPORTED_SPEECH_LANGUAGES,
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
    http_exception_from_wecare,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice", tags=["voice"])


def get_speech_service_dep() -> "SpeechTranscriptionService":
    return get_speech_service()


@router.get(
    "/status",
    response_model=VoiceStatusResponse,
)
async def voice_status(
    service: "SpeechTranscriptionService" = Depends(get_speech_service_dep),
):
    """
    Get speech-to-text service status.

    Returns configuration status and supported languages.
    Does not perform a test transcription.
    """
    return service.get_status()


@router.post(
    "/transcribe",
    response_model=VoiceTranscribeResponse,
    responses={
        400: {"model": VoiceErrorResponse, "description": "Invalid request"},
        413: {"model": VoiceErrorResponse, "description": "Audio too large"},
        415: {"model": VoiceErrorResponse, "description": "Unsupported audio format"},
        422: {"model": VoiceErrorResponse, "description": "Unsupported language"},
        503: {"model": VoiceErrorResponse, "description": "Service unavailable"},
    },
)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file (WebM, OGG, MP4, MP3, WAV)"),
    language_code: str = Form(..., description="Language code (en-IN, ta-IN, te-IN, hi-IN)"),
    service: "SpeechTranscriptionService" = Depends(get_speech_service_dep),
):
    """
    Transcribe audio to text using Google Cloud Speech-to-Text.

    The frontend records audio and sends it here for transcription.
    The returned transcript must be reviewed and confirmed by the user
    before being used for clinical assessment.

    Supported languages:
    - en-IN: English (India)
    - ta-IN: Tamil (India)
    - te-IN: Telugu (India)
    - hi-IN: Hindi (India)

    Audio requirements:
    - Max size: 10 MB (configurable)
    - Max duration: 60 seconds (configurable)
    - Supported formats: WebM/Opus, OGG/Opus, MP4, MP3, WAV
    """
    # Read audio data
    try:
        audio_data = await audio.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_AUDIO", "message": "Failed to read audio file"}},
        )

    # Get MIME type
    mime_type = audio.content_type or "audio/webm"

    try:
        result = service.transcribe(audio_data, language_code, mime_type)
        return result

    except SpeechNotConfiguredException as e:
        raise e
    except UnsupportedLanguageException as e:
        raise e
    except InvalidAudioException as e:
        raise e
    except AudioTooLargeException as e:
        raise e
    except UnsupportedAudioFormatException as e:
        raise e
    except TranscriptionEmptyException as e:
        raise e
    except SpeechProviderUnavailableException as e:
        raise e
    except SpeechProviderErrorException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in transcribe: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INTERNAL_ERROR", "message": "Transcription failed"}},
        )
"""
WeCare.AI Health Check API

System health and status endpoint.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database import get_db
from app.schemas.common import HealthStatus
from app.services.speech_service import get_speech_service

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthStatus)
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint.

    Returns status of:
    - Database connectivity
    - Clinical rules engine
    - Speech-to-text service
    """
    # Check database
    db_status = "available"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unavailable"

    # Check clinical rules
    from app.clinical_rules import get_rules_engine
    rules_engine = get_rules_engine()
    rules_configured = rules_engine is not None

    # Check speech service
    speech_service = get_speech_service()
    speech_status = speech_service.get_status()

    return HealthStatus(
        status="ok" if db_status == "available" else "degraded",
        database=db_status,
        clinical_rules={
            "configured": rules_configured,
            "rules_version": rules_engine.rules_version if rules_configured else None,
        },
        speech={
            "configured": speech_status.configured,
            "available": speech_status.available,
            "supported_languages": list(speech_status.supported_languages.keys()) if speech_status.supported_languages else [],
        },
    )
"""
WeCare.AI Assessments API

Clinical assessment endpoints — now with Groq AI-powered risk scoring
as primary engine (falls back to deterministic rules when Groq is unavailable).
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.services.assessment_service import AssessmentService
from app.schemas.assessments import (
    AssessmentCreateRequest,
    AssessmentResponse,
    AcknowledgementRequest,
    AcknowledgementResponse,
)
from app.schemas.common import ApiError
from app.exceptions import (
    NotFoundException,
    AgeOutOfScopeException,
)
from app.clinical_rules.schemas import AcuityCategory

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assessments", tags=["assessments"])


def get_assessment_service(db: Session = Depends(get_db)) -> AssessmentService:
    return AssessmentService(db)


@router.post(
    "",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        404: {"model": ApiError, "description": "Patient not found"},
        400: {"model": ApiError, "description": "Age out of scope or insufficient data"},
        422: {"model": ApiError, "description": "Validation error"},
    },
)
async def create_assessment(
    data: AssessmentCreateRequest,
    service: AssessmentService = Depends(get_assessment_service),
):
    """
    Create a clinical assessment for a patient.

    Primary path: de-identifies patient data and calls Groq AI (llama-3.3-70b-versatile)
    for risk score, contributing factors, recommended department, and clinical summary.

    Fallback path: deterministic WHO IITT rules engine used when Groq is unavailable.
    """
    try:
        # 1. Run deterministic rules engine (always — for acuity and audit trail)
        result = service.create_assessment(data)

        # 2. Gather patient data for risk calculation
        from app.repositories.patient_repository import PatientRepository
        patient_repo = PatientRepository(service.db)
        patient = patient_repo.get_by_id(data.patient_id)

        patient_dict = {
            "age": patient.age if patient else 30,
            "gender": getattr(patient, "gender", None),
            "vitals": patient.vitals if patient else {},
            "symptoms": patient.symptoms if patient else [],
            "medical_history": patient.medical_history if patient else "",
            "symptom_onset": getattr(patient, "symptom_onset", None),
        }

        rules_context = {
            "acuity": result.acuity.value if result.acuity else None,
            "reasons": result.reasons,
        }

        # 3. Try Groq AI first
        from app.services.groq_service import assess_with_groq
        groq_result = assess_with_groq(patient_dict, rules_context)

        if groq_result:
            risk_score = groq_result.get("risk_score", 50)
            risk_level = groq_result.get("risk_level", "MEDIUM")
            recommended_department = groq_result.get("recommended_department", "General Emergency")
            confidence = groq_result.get("confidence", 0.85)
            clinical_summary = groq_result.get("clinical_summary", "")
            raw_factors = groq_result.get("contributing_factors", [])
            # Normalise factors format
            contributing_factors = [
                {"name": f.get("name", ""), "percentage": f.get("percentage", 0)}
                for f in raw_factors
            ]
            ai_source = "groq"
            logger.info(f"Assessment {result.assessment_id}: Groq AI used (score={risk_score})")
        else:
            # 4. Fallback: deterministic risk calculator
            from app.services.risk_calculator import calculate_clinical_risk
            risk_info = calculate_clinical_risk(
                patient_dict,
                result.acuity.value if result.acuity else None,
            )
            risk_score = risk_info["risk_score"]
            risk_level = risk_info["risk_level"]
            recommended_department = risk_info["recommended_department"]
            confidence = risk_info["confidence"]
            contributing_factors = risk_info["contributing_factors"]
            clinical_summary = ""
            ai_source = "rules"
            logger.info(f"Assessment {result.assessment_id}: deterministic fallback used (score={risk_score})")

        return AssessmentResponse(
            assessment_id=result.assessment_id,
            patient_id=result.patient_id,
            acuity=result.acuity,
            assessment_status=result.assessment_status.value,
            reasons=result.reasons,
            matched_criteria=[c.value for c in result.matched_criteria],
            missing_information=result.missing_information,
            review_required=result.review_required,
            rules_version=result.rules_version,
            assessed_at=result.assessed_at.isoformat() if hasattr(result.assessed_at, "isoformat") else str(result.assessed_at),
            risk_score=risk_score,
            risk_level=risk_level,
            confidence=confidence,
            recommended_department=recommended_department,
            contributing_factors=contributing_factors,
            clinical_summary=clinical_summary,
            ai_source=ai_source,
        )
    except NotFoundException as e:
        raise e
    except AgeOutOfScopeException as e:
        raise e


@router.post(
    "/{assessment_id}/acknowledge",
    response_model=AcknowledgementResponse,
    responses={
        404: {"model": ApiError, "description": "Assessment not found"},
    },
)
async def acknowledge_assessment(
    assessment_id: str,
    data: AcknowledgementRequest,
    service: AssessmentService = Depends(get_assessment_service),
):
    """
    Acknowledge an assessment requiring review.
    Records an in-application acknowledgement event.
    """
    try:
        event = service.acknowledge_assessment(assessment_id)
        return AcknowledgementResponse(
            success=True,
            acknowledged_at=event.acknowledged_at.isoformat() if event.acknowledged_at else "",
        )
    except NotFoundException as e:
        raise e


@router.get(
    "/{assessment_id}",
    response_model=AssessmentResponse,
    responses={
        404: {"model": ApiError, "description": "Assessment not found"},
    },
)
async def get_assessment(
    assessment_id: str,
    service: AssessmentService = Depends(get_assessment_service),
):
    """Get assessment by ID."""
    try:
        assessment = service.get_assessment(assessment_id)
        return AssessmentResponse(
            assessment_id=assessment.id,
            patient_id=assessment.patient_id,
            acuity=AcuityCategory(assessment.acuity) if assessment.acuity else AcuityCategory.UNASSESSED,
            assessment_status=assessment.assessment_status,
            reasons=assessment.reasons,
            matched_criteria=assessment.matched_criteria,
            missing_information=assessment.missing_information,
            review_required=assessment.review_required,
            rules_version=assessment.rules_version,
            assessed_at=assessment.assessed_at.isoformat() if hasattr(assessment.assessed_at, "isoformat") else str(assessment.assessed_at),
        )
    except NotFoundException as e:
        raise e


# ─────────────────────────────────────────────
# Document scan endpoint (Groq vision)
# ─────────────────────────────────────────────

@router.post(
    "/scan-document",
    summary="Scan a medical document with Groq AI vision",
    responses={
        200: {"description": "Extracted clinical information"},
        503: {"description": "Groq AI not configured"},
    },
)
async def scan_medical_document(
    file: UploadFile = File(...),
):
    """
    Upload a medical document (image/PDF/text) and extract clinical information
    using Groq AI vision.

    Returns: conditions, medications, allergies, lab values, symptoms, clinical notes.
    """
    from app.services.groq_service import scan_document_with_groq, get_groq_status

    status_info = get_groq_status()
    if not status_info["available"]:
        raise HTTPException(
            status_code=503,
            detail="Groq AI is not configured. Add GROQ_API_KEY to backend .env to enable document scanning.",
        )

    file_bytes = await file.read()
    mime_type = file.content_type or "application/octet-stream"
    filename = file.filename or "document"

    result = scan_document_with_groq(file_bytes, filename, mime_type)
    if result is None:
        raise HTTPException(
            status_code=503,
            detail="Document scanning failed. Please try again.",
        )

    return {"success": True, "filename": filename, "extracted": result}
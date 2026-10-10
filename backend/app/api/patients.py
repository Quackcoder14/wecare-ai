"""
WeCare.AI Patients API

Patient registration, retrieval, and management endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.patient_service import PatientService
from app.schemas.patients import (
    PatientCreateRequest,
    PatientUpdateRequest,
    PatientResponse,
    PatientDetail,
    ReassessmentRequest,
)
from app.schemas.assessments import AssessmentResponse
from app.schemas.common import ApiError
from app.exceptions import (
    NotFoundException,
    ValidationException,
    AgeOutOfScopeException,
)
from app.clinical_rules.schemas import AcuityCategory

router = APIRouter(prefix="/api/patients", tags=["patients"])


def get_patient_service(db: Session = Depends(get_db)) -> PatientService:
    return PatientService(db)


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        422: {"model": ApiError, "description": "Validation error"},
        400: {"model": ApiError, "description": "Invalid input"},
    },
)
async def create_patient(
    data: PatientCreateRequest,
    service: PatientService = Depends(get_patient_service),
):
    """
    Create a new patient record.

    Accepts patient demographics, symptoms, vital signs, and optional transcript.
    Returns the created patient with server-generated ID.
    """
    try:
        patient = service.create_patient(data)
        return PatientResponse(
            patient_id=patient.id,
            name=patient.name,
            gender=patient.gender,
            age=patient.age,
            symptoms=patient.symptoms,
            symptom_onset=patient.symptom_onset,
            vitals=patient.vitals,
            medical_history=patient.medical_history,
            preferred_language=patient.preferred_language,
            input_method=patient.input_method,
            transcript=patient.transcript,
            created_at=patient.created_at.isoformat() if hasattr(patient.created_at, 'isoformat') else str(patient.created_at),
        )
    except ValidationException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INTERNAL_ERROR", "message": str(e)}},
        )


@router.get(
    "/{patient_id}",
    response_model=PatientDetail,
    responses={
        404: {"model": ApiError, "description": "Patient not found"},
    },
)
async def get_patient(
    patient_id: str,
    service: PatientService = Depends(get_patient_service),
):
    """
    Get patient by ID with full assessment history.

    Returns patient details and all previous assessments.
    """
    try:
        patient = service.get_patient_with_assessments(patient_id)
        return PatientDetail(
            patient_id=patient.id,
            name=patient.name,
            gender=patient.gender,
            age=patient.age,
            symptoms=patient.symptoms,
            symptom_onset=patient.symptom_onset,
            vitals=patient.vitals,
            medical_history=patient.medical_history,
            preferred_language=patient.preferred_language,
            input_method=patient.input_method,
            transcript=patient.transcript,
            created_at=patient.created_at.isoformat() if hasattr(patient.created_at, 'isoformat') else str(patient.created_at),
            assessments=[
                AssessmentResponse(
                    assessment_id=a.id,
                    patient_id=a.patient_id,
                    acuity=AcuityCategory(a.acuity) if a.acuity else AcuityCategory.UNASSESSED,
                    assessment_status=a.assessment_status,
                    reasons=a.reasons,
                    matched_criteria=a.matched_criteria,
                    missing_information=a.missing_information,
                    review_required=a.review_required,
                    rules_version=a.rules_version,
                    assessed_at=a.assessed_at.isoformat() if hasattr(a.assessed_at, 'isoformat') else str(a.assessed_at),
                )
                for a in patient.assessments
            ],
        )
    except NotFoundException as e:
        raise e


@router.patch(
    "/{patient_id}",
    response_model=PatientResponse,
    responses={
        404: {"model": ApiError, "description": "Patient not found"},
        422: {"model": ApiError, "description": "Validation error"},
    },
)
async def update_patient(
    patient_id: str,
    data: PatientUpdateRequest,
    service: PatientService = Depends(get_patient_service),
):
    """
    Update patient information.

    Only provided fields are updated. Use for correcting or adding information.
    """
    try:
        patient = service.update_patient(patient_id, data)
        return PatientResponse(
            patient_id=patient.id,
            name=patient.name,
            gender=patient.gender,
            age=patient.age,
            symptoms=patient.symptoms,
            symptom_onset=patient.symptom_onset,
            vitals=patient.vitals,
            medical_history=patient.medical_history,
            preferred_language=patient.preferred_language,
            input_method=patient.input_method,
            transcript=patient.transcript,
            created_at=patient.created_at.isoformat() if hasattr(patient.created_at, 'isoformat') else str(patient.created_at),
        )
    except NotFoundException as e:
        raise e
    except ValidationException as e:
        raise e


@router.post(
    "/{patient_id}/reassess",
    response_model=AssessmentResponse,
    responses={
        404: {"model": ApiError, "description": "Patient not found"},
        400: {"model": ApiError, "description": "Age out of scope or insufficient data"},
        422: {"model": ApiError, "description": "Validation error"},
    },
)
async def reassess_patient(
    patient_id: str,
    data: ReassessmentRequest,
    service: PatientService = Depends(get_patient_service),
):
    """
    Reassess a patient with updated clinical information.

    Updates patient record with new data and creates a new assessment.
    Previous assessments are preserved in history.
    """
    try:
        result = service.reassess_patient(patient_id, data)
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
            assessed_at=result.assessed_at.isoformat() if hasattr(result.assessed_at, 'isoformat') else str(result.assessed_at),
        )
    except NotFoundException as e:
        raise e
    except AgeOutOfScopeException as e:
        raise e
    except ValidationException as e:
        raise e


@router.get(
    "",
    response_model=List[PatientResponse],
)
async def list_patients(
    limit: int = 100,
    offset: int = 0,
    service: PatientService = Depends(get_patient_service),
):
    """List all patients (paginated)."""
    patients = service.list_patients(limit=limit, offset=offset)
    return [
        PatientResponse(
            patient_id=p.id,
            name=p.name,
            gender=p.gender,
            age=p.age,
            symptoms=p.symptoms,
            symptom_onset=p.symptom_onset,
            vitals=p.vitals,
            medical_history=p.medical_history,
            preferred_language=p.preferred_language,
            input_method=p.input_method,
            transcript=p.transcript,
            created_at=p.created_at.isoformat() if hasattr(p.created_at, 'isoformat') else str(p.created_at),
        )
        for p in patients
    ]


@router.delete(
    "/{patient_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"model": ApiError, "description": "Patient not found"},
    },
)
async def delete_patient(
    patient_id: str,
    service: PatientService = Depends(get_patient_service),
):
    """Soft-delete a patient so they no longer appear in the priority queue."""
    if not service.delete_patient(patient_id):
        raise NotFoundException("Patient", patient_id)

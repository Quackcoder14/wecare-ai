"""
WeCare.AI Patient Service

Business logic for patient management.
"""
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.patient import Patient, PatientStatus, InputMethod
from app.models.assessment import Assessment
from app.repositories.patient_repository import PatientRepository
from app.repositories.assessment_repository import AssessmentRepository
from app.clinical_rules import (
    create_triage_input_from_patient,
    get_rules_engine,
    extract_input_snapshot,
)
from app.clinical_rules.schemas import ClinicalAssessmentResult
from app.schemas.patients import PatientCreateRequest, PatientUpdateRequest
from app.exceptions import NotFoundException, ValidationException, AgeOutOfScopeException


class PatientService:
    """Service for patient operations."""

    def __init__(self, db: Session):
        self.db = db
        self.patient_repo = PatientRepository(db)
        self.assessment_repo = AssessmentRepository(db)
        self.rules_engine = get_rules_engine()

    def create_patient(self, data: PatientCreateRequest) -> Patient:
        """Create a new patient record."""
        # Validate age
        if data.age < 1:
            raise ValidationException(
                "Age must be positive",
                details=[{"field": "age", "message": "Age must be positive"}]
            )

        # Check if age is below assessment threshold (warning, not error)
        if data.age < 12:
            # We allow creation but flag for later
            pass

        # Convert symptoms list to proper format
        symptoms = data.symptoms if data.symptoms else []

        patient = Patient(
            id=str(uuid4()),
            name=data.name.strip() if data.name else None,
            gender=data.gender,
            age=data.age,
            symptoms=symptoms,
            symptom_onset=data.symptom_onset,
            vitals=data.vitals.model_dump() if data.vitals else None,
            medical_history=data.medical_history,
            preferred_language=data.preferred_language.value,
            input_method=data.input_method.value,
            transcript=data.transcript,
            status=PatientStatus.ACTIVE,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        return self.patient_repo.create(patient)

    def get_patient(self, patient_id: str) -> Patient:
        """Get patient by ID with assessments."""
        patient = self.patient_repo.get_by_id(patient_id)
        if not patient:
            raise NotFoundException("Patient", patient_id)
        return patient

    def get_patient_with_assessments(self, patient_id: str) -> Patient:
        """Get patient with full assessment history."""
        patient = self.get_patient(patient_id)
        # Load assessments
        patient.assessments = self.assessment_repo.get_history_for_patient(patient_id)
        return patient

    def update_patient(self, patient_id: str, data: PatientUpdateRequest) -> Patient:
        """Update patient record."""
        patient = self.get_patient(patient_id)

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if field == "vitals" and value is not None:
                # value is already a dict from model_dump
                setattr(patient, field, value)
            elif field == "preferred_language" and value is not None:
                setattr(patient, field, value.value)
            elif field == "input_method" and value is not None:
                setattr(patient, field, value.value)
            else:
                setattr(patient, field, value)

        patient.updated_at = datetime.utcnow()
        return self.patient_repo.update(patient)

    def list_patients(self, limit: int = 100, offset: int = 0) -> List[Patient]:
        """List all active patients."""
        return self.patient_repo.get_all(limit=limit, offset=offset)

    def assess_patient(self, patient_id: str) -> ClinicalAssessmentResult:
        """
        Run clinical assessment for a patient.

        Creates a new assessment record with the result.
        """
        patient = self.get_patient(patient_id)

        # Check age eligibility
        if patient.age < 12:
            raise AgeOutOfScopeException(patient.age)

        # Convert patient to triage input
        patient_dict = {
            "patient_id": patient.id,
            "age": patient.age,
            "symptoms": patient.symptoms,
            "vitals": patient.vitals,
            "transcript": patient.transcript,
        }
        triage_input = create_triage_input_from_patient(patient_dict, self.rules_engine.rules_version)

        # Run assessment
        result = self.rules_engine.assess(triage_input)

        # Create assessment record
        assessment = Assessment(
            id=str(uuid4()),
            patient_id=patient.id,
            acuity=result.acuity.value if result.acuity else None,
            assessment_status=result.assessment_status.value,
            review_required=result.review_required,
            reasons=result.reasons,
            matched_criteria=[c.value for c in result.matched_criteria],
            missing_information=result.missing_information,
            input_snapshot=extract_input_snapshot(triage_input),
            rules_version=result.rules_version,
            assessed_at=result.assessed_at,
            created_at=datetime.utcnow(),
        )

        self.assessment_repo.create(assessment)
        result.assessment_id = assessment.id

        return result

    def reassess_patient(self, patient_id: str, update_data: PatientUpdateRequest) -> ClinicalAssessmentResult:
        """
        Update patient information and run new assessment.

        Preserves previous assessment history.
        """
        # Update patient data
        self.update_patient(patient_id, update_data)

        # Run new assessment
        return self.assess_patient(patient_id)

    def delete_patient(self, patient_id: str) -> bool:
        """Soft delete a patient."""
        return self.patient_repo.delete(patient_id)

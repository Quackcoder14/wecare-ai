"""
WeCare.AI Assessment Service

Business logic for assessment operations.
"""
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.assessment import Assessment, AssessmentStatus, AcuityCategory
from app.models.events import AcknowledgementEvent, AcknowledgementStatus
from app.repositories.assessment_repository import AssessmentRepository, AcknowledgementRepository
from app.clinical_rules import get_rules_engine
from app.clinical_rules.schemas import ClinicalAssessmentResult, AcuityCategory as RulesAcuity
from app.schemas.assessments import AssessmentCreateRequest
from app.schemas.patients import ReassessmentRequest
from app.schemas.common import ReviewStatus
from app.exceptions import NotFoundException


class AssessmentService:
    """Service for assessment operations."""

    def __init__(self, db: Session):
        self.db = db
        self.assessment_repo = AssessmentRepository(db)
        self.ack_repo = AcknowledgementRepository(db)
        self.rules_engine = get_rules_engine()

    def create_assessment(self, data: AssessmentCreateRequest) -> ClinicalAssessmentResult:
        """
        Create assessment for a patient.

        The patient must already exist with clinical data.
        """
        # Get patient via repository (need patient repo)
        from app.repositories.patient_repository import PatientRepository
        from app.models.patient import Patient
        patient_repo = PatientRepository(self.db)
        patient = patient_repo.get_by_id(data.patient_id)
        if not patient:
            raise NotFoundException("Patient", data.patient_id)

        # Check age
        if patient.age < 12:
            from app.exceptions import AgeOutOfScopeException
            raise AgeOutOfScopeException(patient.age)

        # Convert to triage input
        from app.clinical_rules import create_triage_input_from_patient
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
        from app.clinical_rules import extract_input_snapshot
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

    def get_assessment(self, assessment_id: str) -> Assessment:
        """Get assessment by ID."""
        assessment = self.assessment_repo.get_by_id(assessment_id)
        if not assessment:
            raise NotFoundException("Assessment", assessment_id)
        return assessment

    def get_patient_assessments(self, patient_id: str) -> List[Assessment]:
        """Get all assessments for a patient."""
        return self.assessment_repo.get_history_for_patient(patient_id)

    def get_latest_assessment(self, patient_id: str) -> Optional[Assessment]:
        """Get latest assessment for a patient."""
        return self.assessment_repo.get_latest_for_patient(patient_id)

    def reassess(self, data: ReassessmentRequest) -> ClinicalAssessmentResult:
        """
        Reassess a patient with updated information.

        Creates a new assessment record, preserving history.
        """
        from app.repositories.patient_repository import PatientRepository
        from app.models.patient import Patient
        from app.services.patient_service import PatientService

        patient_repo = PatientRepository(self.db)
        patient = patient_repo.get_by_id(data.patient_id)
        if not patient:
            raise NotFoundException("Patient", data.patient_id)

        # Apply updates to patient
        if data.symptoms is not None:
            patient.symptoms = data.symptoms
        if data.symptom_onset is not None:
            patient.symptom_onset = data.symptom_onset
        if data.vitals is not None:
            patient.vitals = data.vitals.model_dump()
        if data.medical_history is not None:
            patient.medical_history = data.medical_history

        patient.updated_at = datetime.utcnow()
        patient_repo.update(patient)

        # Run new assessment
        from app.clinical_rules import create_triage_input_from_patient
        patient_dict = {
            "patient_id": patient.id,
            "age": patient.age,
            "symptoms": patient.symptoms,
            "vitals": patient.vitals,
            "transcript": patient.transcript,
        }
        triage_input = create_triage_input_from_patient(patient_dict, self.rules_engine.rules_version)

        result = self.rules_engine.assess(triage_input)

        # Create new assessment record
        from app.clinical_rules import extract_input_snapshot
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

    def acknowledge_assessment(self, assessment_id: str, operator_label: Optional[str] = None) -> AcknowledgementEvent:
        """Acknowledge an assessment requiring review."""
        assessment = self.get_assessment(assessment_id)

        if not assessment.review_required:
            # Already not requiring review, but allow idempotent acknowledgment
            pass

        event = self.ack_repo.acknowledge(assessment_id, operator_label)

        # Update assessment review_required flag
        assessment.review_required = False
        self.db.flush()

        return event

    def get_acknowledgement(self, assessment_id: str) -> Optional[AcknowledgementEvent]:
        """Get acknowledgement event for an assessment."""
        return self.ack_repo.get_latest_for_assessment(assessment_id)

    def get_queue_data(self) -> List[Assessment]:
        """Get latest assessment per patient for queue display."""
        return self.assessment_repo.get_queue_assessments()
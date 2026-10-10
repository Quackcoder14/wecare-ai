"""
WeCare.AI Assessment Repository

Data access layer for assessment operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.assessment import Assessment, AcuityCategory, AssessmentStatus
from app.models.events import AcknowledgementEvent, AcknowledgementStatus
from app.models.patient import Patient


class AssessmentRepository:
    """Repository for assessment data access."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, assessment: Assessment) -> Assessment:
        """Create a new assessment record."""
        self.db.add(assessment)
        self.db.flush()
        self.db.refresh(assessment)
        return assessment

    def get_by_id(self, assessment_id: str) -> Optional[Assessment]:
        """Get assessment by ID."""
        return self.db.query(Assessment).filter(
            Assessment.id == assessment_id
        ).first()

    def get_latest_for_patient(self, patient_id: str) -> Optional[Assessment]:
        """Get the latest assessment for a patient."""
        return self.db.query(Assessment).filter(
            Assessment.patient_id == patient_id
        ).order_by(desc(Assessment.created_at)).first()

    def get_history_for_patient(self, patient_id: str) -> List[Assessment]:
        """Get all assessments for a patient ordered by creation time."""
        return self.db.query(Assessment).filter(
            Assessment.patient_id == patient_id
        ).order_by(desc(Assessment.created_at)).all()

    def get_queue_assessments(self) -> List[Assessment]:
        """
        Get latest assessment for each patient for queue display.
        Returns one assessment per patient (the most recent).
        """
        # Subquery to get latest assessment ID per patient
        subquery = self.db.query(
            Assessment.patient_id,
            func.max(Assessment.created_at).label("max_created")
        ).group_by(Assessment.patient_id).subquery()

        # Join back to get full assessment records
        return self.db.query(Assessment).join(
            subquery,
            (Assessment.patient_id == subquery.c.patient_id) &
            (Assessment.created_at == subquery.c.max_created)
        ).all()

    def count_by_acuity(self) -> dict:
        """Count assessments by acuity category."""
        results = self.db.query(
            Assessment.acuity,
            func.count(Assessment.id)
        ).filter(
            Assessment.assessment_status == AssessmentStatus.COMPLETED
        ).group_by(Assessment.acuity).all()

        return {str(acuity): count for acuity, count in results}


class AcknowledgementRepository:
    """Repository for acknowledgement events."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, event: AcknowledgementEvent) -> AcknowledgementEvent:
        """Create a new acknowledgement event."""
        self.db.add(event)
        self.db.flush()
        self.db.refresh(event)
        return event

    def get_by_assessment_id(self, assessment_id: str) -> Optional[AcknowledgementEvent]:
        """Get acknowledgement event for an assessment."""
        return self.db.query(AcknowledgementEvent).filter(
            AcknowledgementEvent.assessment_id == assessment_id
        ).first()

    def get_latest_for_assessment(self, assessment_id: str) -> Optional[AcknowledgementEvent]:
        """Get the latest acknowledgement event for an assessment."""
        return self.db.query(AcknowledgementEvent).filter(
            AcknowledgementEvent.assessment_id == assessment_id
        ).order_by(desc(AcknowledgementEvent.created_at)).first()

    def acknowledge(self, assessment_id: str, operator_label: Optional[str] = None) -> AcknowledgementEvent:
        """Create or update acknowledgement for an assessment."""
        # Check if already acknowledged
        existing = self.get_latest_for_assessment(assessment_id)
        if existing and existing.status == AcknowledgementStatus.ACKNOWLEDGED:
            return existing

        from datetime import datetime
        event = AcknowledgementEvent(
            assessment_id=assessment_id,
            status=AcknowledgementStatus.ACKNOWLEDGED,
            operator_label=operator_label,
            acknowledged_at=datetime.utcnow(),
        )
        return self.create(event)
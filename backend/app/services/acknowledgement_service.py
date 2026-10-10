"""
WeCare.AI Acknowledgement Service

Business logic for in-application acknowledgement of assessments.
"""
from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.events import AcknowledgementEvent, AcknowledgementStatus
from app.repositories.assessment_repository import AssessmentRepository, AcknowledgementRepository
from app.schemas.assessments import AcknowledgementRequest, AcknowledgementResponse
from app.exceptions import NotFoundException


class AcknowledgementService:
    """Service for acknowledgement operations."""

    def __init__(self, db: Session):
        self.db = db
        self.assessment_repo = AssessmentRepository(db)
        self.ack_repo = AcknowledgementRepository(db)

    def acknowledge(self, data: AcknowledgementRequest, operator_label: Optional[str] = None) -> AcknowledgementResponse:
        """
        Record acknowledgement for an assessment.

        Idempotent - acknowledging an already acknowledged assessment returns the existing event.
        """
        assessment = self.assessment_repo.get_by_id(data.assessment_id)
        if not assessment:
            raise NotFoundException("Assessment", data.assessment_id)

        # Check if already acknowledged
        existing = self.ack_repo.get_latest_for_assessment(data.assessment_id)
        if existing and existing.status == AcknowledgementStatus.ACKNOWLEDGED:
            return AcknowledgementResponse(
                success=True,
                acknowledged_at=existing.acknowledged_at.isoformat() if existing.acknowledged_at else datetime.utcnow().isoformat(),
            )

        # Create acknowledgement event
        event = AcknowledgementEvent(
            assessment_id=data.assessment_id,
            status=AcknowledgementStatus.ACKNOWLEDGED,
            operator_label=operator_label,
            acknowledged_at=datetime.utcnow(),
        )

        self.ack_repo.create(event)

        # Update assessment review flag
        assessment.review_required = False
        self.db.flush()

        return AcknowledgementResponse(
            success=True,
            acknowledged_at=event.acknowledged_at.isoformat(),
        )

    def get_acknowledgement(self, assessment_id: str) -> Optional[AcknowledgementEvent]:
        """Get acknowledgement status for an assessment."""
        return self.ack_repo.get_latest_for_assessment(assessment_id)

    def is_acknowledged(self, assessment_id: str) -> bool:
        """Check if an assessment has been acknowledged."""
        event = self.get_acknowledgement(assessment_id)
        return event is not None and event.status == AcknowledgementStatus.ACKNOWLEDGED
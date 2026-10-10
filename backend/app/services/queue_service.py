"""
WeCare.AI Queue Service

Business logic for priority queue operations.
"""
from typing import List, Optional
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.assessment import Assessment, AcuityCategory, AssessmentStatus
from app.models.patient import Patient
from app.repositories.assessment_repository import AssessmentRepository
from app.repositories.patient_repository import PatientRepository
from app.schemas.assessments import QueueItem, QueueResponse
from app.schemas.common import ReviewStatus
from app.services.assessment_service import AssessmentService


class QueueService:
    """Service for queue operations."""

    def __init__(self, db: Session):
        self.db = db
        self.assessment_repo = AssessmentRepository(db)
        self.patient_repo = PatientRepository(db)
        self.assessment_service = AssessmentService(db)

    def get_queue(self) -> QueueResponse:
        """
        Get priority queue with all patients and their latest assessments.

        Queue is ordered by:
        1. Acuity (RED first, then YELLOW, then GREEN, then UNASSESSED/OUT_OF_SCOPE)
        2. Waiting time (longer waiting first)
        """
        # Get latest assessment per patient
        latest_assessments = self.assessment_service.get_queue_data()

        # Build queue items
        queue_items = []
        now = datetime.utcnow()

        for assessment in latest_assessments:
            patient = self.patient_repo.get_by_id(assessment.patient_id)
            if not patient or patient.status.value == "deleted":
                continue

            # Calculate waiting time
            created_at = patient.created_at
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            waiting_seconds = int((now - created_at).total_seconds())

            # Get acknowledgement status
            ack_event = self.assessment_service.get_acknowledgement(assessment.id)
            if ack_event and ack_event.status.value == "acknowledged":
                review_status = ReviewStatus.ACKNOWLEDGED
            elif assessment.review_required:
                review_status = ReviewStatus.PENDING
            else:
                review_status = ReviewStatus.NOT_REQUIRED

            # Build assessment summary
            summary = assessment.reasons[0] if assessment.reasons else "Assessment completed"
            if len(summary) > 100:
                summary = summary[:97] + "..."

            queue_items.append(QueueItem(
                patient_id=patient.id,
                patient_name=patient.name,
                age=patient.age,
                acuity=AcuityCategory(assessment.acuity) if assessment.acuity else AcuityCategory.UNASSESSED,
                assessment_summary=summary,
                waiting_duration_seconds=waiting_seconds,
                review_status=review_status,
                latest_assessment_id=assessment.id,
                created_at=patient.created_at.isoformat() if isinstance(patient.created_at, datetime) else str(patient.created_at),
            ))

        # Sort queue by acuity priority then waiting time
        queue_items = self._sort_queue(queue_items)

        return QueueResponse(
            items=queue_items,
            total=len(queue_items),
        )

    def _sort_queue(self, items: List[QueueItem]) -> List[QueueItem]:
        """Sort queue by acuity priority then waiting time (longer first)."""
        acuity_priority = {
            AcuityCategory.RED: 0,
            AcuityCategory.YELLOW: 1,
            AcuityCategory.GREEN: 2,
            AcuityCategory.NEEDS_REVIEW: 3,
            AcuityCategory.UNASSESSED: 4,
            AcuityCategory.OUT_OF_SCOPE: 5,
        }

        def sort_key(item: QueueItem):
            priority = acuity_priority.get(item.acuity, 99)
            return (priority, -item.waiting_duration_seconds)

        return sorted(items, key=sort_key)

    def get_queue_summary(self) -> dict:
        """Get summary counts for dashboard."""
        queue = self.get_queue()
        items = queue.items

        return {
            "total": len(items),
            "red": sum(1 for i in items if i.acuity == AcuityCategory.RED),
            "yellow": sum(1 for i in items if i.acuity == AcuityCategory.YELLOW),
            "green": sum(1 for i in items if i.acuity == AcuityCategory.GREEN),
            "unassessed": sum(1 for i in items if i.acuity == AcuityCategory.UNASSESSED),
            "out_of_scope": sum(1 for i in items if i.acuity == AcuityCategory.OUT_OF_SCOPE),
            "needs_review": sum(1 for i in items if i.review_status == ReviewStatus.PENDING),
        }

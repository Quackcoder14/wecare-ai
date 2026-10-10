"""
WeCare.AI Queue Service

Business logic for priority queue operations.
"""
from typing import List, Optional
from datetime import datetime, timedelta

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
            raw_waiting_seconds = int((now - created_at).total_seconds())

            # ── Real-world triage wait caps (WHO / Manchester Triage targets) ──
            # Prevents demo/old patients from showing absurd multi-hour waits.
            # RED = immediate (seen within 0-15 min)
            # YELLOW = urgent  (seen within 10-45 min)
            # GREEN = non-urgent (seen within 30-120 min)
            acuity_val = assessment.acuity.value if hasattr(assessment.acuity, "value") else str(assessment.acuity)
            MAX_WAIT = {
                "red":          15 * 60,   # 15 minutes
                "yellow":       45 * 60,   # 45 minutes
                "green":       120 * 60,   # 2 hours
                "needs_review": 30 * 60,   # 30 minutes
                "unassessed":   60 * 60,   # 1 hour
                "out_of_scope": 90 * 60,   # 90 minutes
            }
            cap = MAX_WAIT.get(acuity_val, 60 * 60)
            waiting_seconds = min(raw_waiting_seconds, cap)

            # Synthesise a created_at that is consistent with the (capped) wait
            # so the frontend live-timer stays in sync.
            effective_created_at = (now - timedelta(seconds=waiting_seconds)).isoformat()

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
                created_at=effective_created_at,
                risk_score=assessment.risk_score,
            ))

        # Sort queue by acuity priority then waiting time
        queue_items = self._sort_queue(queue_items)

        return QueueResponse(
            items=queue_items,
            total=len(queue_items),
        )

    def _sort_queue(self, items: List[QueueItem]) -> List[QueueItem]:
        """Sort by acuity tier first, then risk_score descending within each tier."""
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
            # Higher risk_score → higher urgency → appears first (negate for desc sort)
            score = -(item.risk_score or 0)
            return (priority, score)

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

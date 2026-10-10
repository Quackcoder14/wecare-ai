"""
WeCare.AI Queue API

Priority queue endpoints for patient triage display.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.queue_service import QueueService
from app.schemas.assessments import QueueResponse

router = APIRouter(prefix="/api/queue", tags=["queue"])


def get_queue_service(db: Session = Depends(get_db)) -> QueueService:
    return QueueService(db)


@router.get(
    "",
    response_model=QueueResponse,
)
async def get_queue(
    service: QueueService = Depends(get_queue_service),
):
    """
    Get the priority queue of patients.

    Returns patients ordered by:
    1. Acuity (Red → Yellow → Green → Unassessed → Out of Scope)
    2. Waiting time (longer waiting first)

    Each item includes patient info, latest acuity, assessment summary,
    waiting duration, and review status.
    """
    return service.get_queue()


@router.get(
    "/summary",
)
async def get_queue_summary(
    service: QueueService = Depends(get_queue_service),
):
    """Get queue summary counts for dashboard."""
    return service.get_queue_summary()
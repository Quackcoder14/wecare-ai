"""
WeCare.AI Queue Schemas

Pydantic models for queue API (already defined in assessments.py).
"""
from app.schemas.assessments import QueueItem, QueueResponse

__all__ = ["QueueItem", "QueueResponse"]
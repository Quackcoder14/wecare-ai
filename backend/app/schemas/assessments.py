"""
WeCare.AI Assessment Schemas

Pydantic models for assessment API requests and responses.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import (
    AcuityCategory,
    AssessmentStatus,
    ReviewStatus,
)


class AssessmentCreateRequest(BaseModel):
    """Request model for creating an assessment."""
    model_config = ConfigDict(extra="forbid")

    patient_id: str


class AssessmentResponse(BaseModel):
    """Response model for assessment data."""
    model_config = ConfigDict(extra="allow", from_attributes=True)

    assessment_id: str
    patient_id: str
    acuity: AcuityCategory
    assessment_status: str
    reasons: List[str] = Field(default_factory=list)
    matched_criteria: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    review_required: bool = False
    rules_version: str
    assessed_at: str
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    confidence: Optional[float] = None
    recommended_department: Optional[str] = None
    contributing_factors: Optional[List[Dict[str, Any]]] = None
    clinical_summary: Optional[str] = None
    ai_source: Optional[str] = None  # "groq" | "rules"


class AcknowledgementRequest(BaseModel):
    """Request model for acknowledging an assessment."""
    model_config = ConfigDict(extra="forbid")

    assessment_id: str


class AcknowledgementResponse(BaseModel):
    """Response model for acknowledgement."""
    model_config = ConfigDict(extra="allow")

    success: bool
    acknowledged_at: str


class QueueItem(BaseModel):
    """Queue item for priority queue display."""
    model_config = ConfigDict(extra="allow", from_attributes=True)

    patient_id: str
    patient_name: Optional[str] = None
    age: int
    acuity: AcuityCategory
    assessment_summary: str
    waiting_duration_seconds: int
    review_status: ReviewStatus
    latest_assessment_id: str
    created_at: str


class QueueResponse(BaseModel):
    """Response model for queue data."""
    model_config = ConfigDict(extra="allow")

    items: List[QueueItem] = Field(default_factory=list)
    total: int = 0

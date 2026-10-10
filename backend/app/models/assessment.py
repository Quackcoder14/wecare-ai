"""
WeCare.AI Assessment Model

SQLAlchemy model for clinical assessment records.
"""
import uuid
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.orm import relationship

from app.database import Base


class AcuityCategory(str, enum.Enum):
    """WHO IITT acuity categories."""
    RED = "red"
    YELLOW = "yellow"
    GREEN = "green"
    UNASSESSED = "unassessed"
    NEEDS_REVIEW = "needs_review"
    OUT_OF_SCOPE = "out_of_scope"


class AssessmentStatus(str, enum.Enum):
    """Assessment status enumeration."""
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING = "pending"
    ERROR = "error"
    INSUFFICIENT_DATA = "insufficient_data"
    AGE_OUT_OF_SCOPE = "age_out_of_scope"


class Assessment(Base):
    """Clinical assessment database model."""

    __tablename__ = "assessments"

    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign key
    patient_id = Column(
        String(36),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Assessment result
    acuity = Column(SQLEnum(AcuityCategory), nullable=True)  # Can be None for unassessed
    assessment_status = Column(SQLEnum(AssessmentStatus), nullable=False, default=AssessmentStatus.PENDING)
    review_required = Column(Integer, nullable=False, default=0)  # SQLite boolean as int

    # Clinical reasoning
    reasons = Column(SQLiteJSON, nullable=False, default=list)  # List[str]
    matched_criteria = Column(SQLiteJSON, nullable=False, default=list)  # List[str] - criterion IDs
    missing_information = Column(SQLiteJSON, nullable=False, default=list)  # List[str]

    # Input snapshot for reproducibility
    input_snapshot = Column(SQLiteJSON, nullable=True)  # Full input used for this assessment

    # Versioning
    rules_version = Column(String(50), nullable=False)

    # AI / risk scoring output
    risk_score = Column(Integer, nullable=True)           # 0-100
    risk_level = Column(String(20), nullable=True)        # LOW | MEDIUM | HIGH
    confidence = Column(Float, nullable=True)             # 0.0-1.0
    recommended_department = Column(String(100), nullable=True)
    clinical_summary = Column(Text, nullable=True)
    ai_source = Column(String(20), nullable=True)         # "groq" | "rules"

    # Timestamps
    assessed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationship
    patient = relationship("Patient", backref="assessments")

    # Indexes
    __table_args__ = (
        Index("ix_assessment_patient_created", "patient_id", "created_at"),
        Index("ix_assessment_acuity_status", "acuity", "assessment_status"),
    )

    def __repr__(self) -> str:
        return f"<Assessment(id={self.id}, patient_id={self.patient_id}, acuity={self.acuity})>"
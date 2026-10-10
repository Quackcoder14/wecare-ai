"""
WeCare.AI Events Model

SQLAlchemy model for acknowledgement and audit events.
"""
import uuid
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as SQLEnum, Index, Text
from sqlalchemy.orm import relationship

from app.database import Base


class AcknowledgementStatus(str, enum.Enum):
    """Acknowledgement status enumeration."""
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"


class AcknowledgementEvent(Base):
    """In-application acknowledgement event for assessments requiring review."""

    __tablename__ = "acknowledgement_events"

    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign key
    assessment_id = Column(
        String(36),
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Acknowledgement data
    status = Column(SQLEnum(AcknowledgementStatus), nullable=False, default=AcknowledgementStatus.PENDING)
    operator_label = Column(String(100), nullable=True)  # Optional operator identifier

    # Timestamps
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationship
    assessment = relationship("Assessment", backref="acknowledgement_events")

    # Indexes
    __table_args__ = (
        Index("ix_acknowledgement_assessment_status", "assessment_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<AcknowledgementEvent(id={self.id}, assessment_id={self.assessment_id}, status={self.status})>"
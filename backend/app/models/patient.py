"""
WeCare.AI Patient Model

SQLAlchemy model for patient records.
"""
import uuid
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, Enum as SQLEnum
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON

from app.database import Base


class PatientStatus(str, enum.Enum):
    """Patient record status enumeration."""
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class InputMethod(str, enum.Enum):
    """Input method enumeration."""
    MANUAL = "manual"
    VOICE = "voice"


class Patient(Base):
    """Patient database model."""

    __tablename__ = "patients"

    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Demographics
    name = Column(String(200), nullable=True)
    gender = Column(String(50), nullable=True)
    age = Column(Integer, nullable=False)
    preferred_language = Column(String(5), nullable=False)  # en, ta, te, hi
    input_method = Column(SQLEnum(InputMethod), nullable=False, default=InputMethod.MANUAL)

    # Clinical data
    symptoms = Column(SQLiteJSON, nullable=False, default=list)  # List[str]
    symptom_onset = Column(String(100), nullable=True)  # Free text onset description
    vitals = Column(SQLiteJSON, nullable=True)  # VitalsInput dict
    medical_history = Column(Text, nullable=True)
    transcript = Column(Text, nullable=True)  # Confirmed transcript from voice

    # Metadata
    status = Column(SQLEnum(PatientStatus), nullable=False, default=PatientStatus.ACTIVE)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Patient(id={self.id}, age={self.age}, status={self.status})>"

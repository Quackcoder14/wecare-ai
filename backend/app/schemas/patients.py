"""
WeCare.AI Patient Schemas

Pydantic models for patient API requests and responses.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any, ForwardRef
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.schemas.common import (
    LanguageCode,
    InputMethod,
    PatientStatus,
    AcuityCategory,
    AssessmentStatus,
    ReviewStatus,
)


class VitalsInput(BaseModel):
    """Vital signs input model."""
    model_config = ConfigDict(extra="allow")

    heart_rate_bpm: Optional[int] = Field(default=None, ge=0, le=300)
    respiratory_rate_per_min: Optional[int] = Field(default=None, ge=0, le=100)
    spo2_percent: Optional[float] = Field(default=None, ge=0, le=100)
    systolic_bp_mmhg: Optional[int] = Field(default=None, ge=0, le=300)
    diastolic_bp_mmhg: Optional[int] = Field(default=None, ge=0, le=200)
    temperature_c: Optional[float] = Field(default=None, ge=20.0, le=45.0)


class PatientCreateRequest(BaseModel):
    """Request model for creating a patient."""
    model_config = ConfigDict(extra="allow")

    name: Optional[str] = None
    gender: Optional[str] = None
    age: int = Field(..., ge=1, le=150)
    symptoms: List[str] = Field(default_factory=list)
    symptom_onset: Optional[str] = None
    vitals: Optional[VitalsInput] = None
    medical_history: Optional[str] = None
    preferred_language: LanguageCode
    input_method: InputMethod
    transcript: Optional[str] = None

    @field_validator("symptoms", mode="before")
    @classmethod
    def validate_symptoms(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return [str(s).strip() for s in v if str(s).strip()]
        return [str(v).strip()] if str(v).strip() else []


class PatientUpdateRequest(BaseModel):
    """Request model for updating a patient."""
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=1, le=150)
    symptoms: Optional[List[str]] = None
    symptom_onset: Optional[str] = None
    vitals: Optional[VitalsInput] = None
    medical_history: Optional[str] = None
    preferred_language: Optional[LanguageCode] = None
    input_method: Optional[InputMethod] = None
    transcript: Optional[str] = None


class PatientResponse(BaseModel):
    """Response model for patient data."""
    model_config = ConfigDict(extra="allow", from_attributes=True)

    patient_id: str
    name: Optional[str] = None
    gender: Optional[str] = None
    age: int
    symptoms: List[str]
    symptom_onset: Optional[str] = None
    vitals: Optional[VitalsInput] = None
    medical_history: Optional[str] = None
    preferred_language: str
    input_method: str
    transcript: Optional[str] = None
    created_at: str


# Forward reference for AssessmentResponse
AssessmentResponseRef = ForwardRef('AssessmentResponse')


class PatientDetail(PatientResponse):
    """Extended patient response with assessment history."""
    assessments: List[AssessmentResponseRef] = Field(default_factory=list)


class ReassessmentRequest(BaseModel):
    """Request model for reassessing a patient."""
    model_config = ConfigDict(extra="forbid")

    patient_id: str
    symptoms: Optional[List[str]] = None
    symptom_onset: Optional[str] = None
    vitals: Optional[VitalsInput] = None
    medical_history: Optional[str] = None

"""
WeCare.AI Patient Repository

Data access layer for patient operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.patient import Patient, PatientStatus
from app.models.assessment import Assessment


class PatientRepository:
    """Repository for patient data access."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, patient: Patient) -> Patient:
        """Create a new patient record."""
        self.db.add(patient)
        self.db.flush()
        self.db.refresh(patient)
        return patient

    def get_by_id(self, patient_id: str) -> Optional[Patient]:
        """Get patient by ID."""
        return self.db.query(Patient).filter(
            Patient.id == patient_id,
            Patient.status != PatientStatus.DELETED
        ).first()

    def get_all(self, limit: int = 100, offset: int = 0) -> List[Patient]:
        """Get all active patients ordered by creation time (newest first)."""
        return self.db.query(Patient).filter(
            Patient.status != PatientStatus.DELETED
        ).order_by(desc(Patient.created_at)).offset(offset).limit(limit).all()

    def update(self, patient: Patient) -> Patient:
        """Update patient record."""
        self.db.flush()
        self.db.refresh(patient)
        return patient

    def delete(self, patient_id: str) -> bool:
        """Soft delete a patient record."""
        patient = self.get_by_id(patient_id)
        if patient:
            patient.status = PatientStatus.DELETED
            self.db.flush()
            return True
        return False

    def get_latest_assessment(self, patient_id: str) -> Optional[Assessment]:
        """Get the latest assessment for a patient."""
        return self.db.query(Assessment).filter(
            Assessment.patient_id == patient_id
        ).order_by(desc(Assessment.created_at)).first()

    def get_assessment_history(self, patient_id: str) -> List[Assessment]:
        """Get all assessments for a patient ordered by creation time."""
        return self.db.query(Assessment).filter(
            Assessment.patient_id == patient_id
        ).order_by(desc(Assessment.created_at)).all()
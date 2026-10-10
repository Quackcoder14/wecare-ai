"""
WeCare.AI Unit Tests

Tests for core utilities and helper functions.
"""
import pytest
from datetime import datetime

from app.schemas.patients import PatientCreateRequest, VitalsInput
from app.schemas.common import (
    LanguageCode,
    InputMethod,
    AcuityCategory,
    ErrorCode,
    SPEECH_LANGUAGE_CODES,
    SPEECH_TO_APP_LANGUAGE,
)
from app.clinical_rules.schemas import (
    VitalSigns,
    ClinicalFindings,
    FindingState,
    TriageInput,
)
from app.clinical_rules.input_mapping import (
    create_triage_input_from_patient,
    extract_input_snapshot,
)


class TestSchemas:
    """Tests for Pydantic schema validation."""

    def test_patient_create_request_valid(self):
        """Valid patient request passes validation."""
        data = PatientCreateRequest(
            age=45,
            symptoms=["Chest pain", "Shortness of breath"],
            symptom_onset="2 hours ago",
            vitals=VitalsInput(heart_rate_bpm=110, spo2_percent=95),
            medical_history="Hypertension",
            preferred_language=LanguageCode.EN,
            input_method=InputMethod.MANUAL,
            transcript="Patient reports chest pain",
        )
        assert data.age == 45
        assert len(data.symptoms) == 2
        assert data.preferred_language == LanguageCode.EN

    def test_patient_create_request_defaults(self):
        """Optional fields have correct defaults."""
        data = PatientCreateRequest(
            age=30,
            symptoms=[],
            preferred_language=LanguageCode.TA,
            input_method=InputMethod.VOICE,
        )
        assert data.symptoms == []
        assert data.vitals is None
        assert data.medical_history is None
        assert data.transcript is None

    def test_vitals_input_validation(self):
        """Vitals input validates ranges."""
        # Valid vitals
        vitals = VitalsInput(
            heart_rate_bpm=80,
            respiratory_rate_per_min=16,
            spo2_percent=98,
            systolic_bp_mmhg=120,
            temperature_c=37.0,
        )
        assert vitals.heart_rate_bpm == 80

        # Invalid heart rate (too high)
        with pytest.raises(ValueError):
            VitalsInput(heart_rate_bpm=400)

        # Invalid SpO2 (out of range)
        with pytest.raises(ValueError):
            VitalsInput(spo2_percent=101)

    def test_language_codes_mapping(self):
        """Speech language codes map correctly."""
        assert SPEECH_LANGUAGE_CODES["en"] == "en-IN"
        assert SPEECH_LANGUAGE_CODES["ta"] == "ta-IN"
        assert SPEECH_LANGUAGE_CODES["te"] == "te-IN"
        assert SPEECH_LANGUAGE_CODES["hi"] == "hi-IN"

        assert SPEECH_TO_APP_LANGUAGE["en-IN"] == "en"
        assert SPEECH_TO_APP_LANGUAGE["ta-IN"] == "ta"
        assert SPEECH_TO_APP_LANGUAGE["te-IN"] == "te"
        assert SPEECH_TO_APP_LANGUAGE["hi-IN"] == "hi"


class TestClinicalSchemas:
    """Tests for clinical rules schemas."""

    def test_vital_signs_measured_tracking(self):
        """VitalSigns tracks which vitals were measured."""
        vitals = VitalSigns()
        assert vitals.get_measured("heart_rate_bpm") is False

        vitals.heart_rate_bpm = 80
        vitals.set_measured("heart_rate_bpm", True)
        assert vitals.get_measured("heart_rate_bpm") is True
        assert vitals.heart_rate_bpm == 80

    def test_clinical_findings_default_unknown(self):
        """ClinicalFindings defaults all findings to UNKNOWN."""
        findings = ClinicalFindings()
        assert findings.airway_obstruction == FindingState.UNKNOWN
        assert findings.shock == FindingState.UNKNOWN
        assert findings.altered_mental_status == FindingState.UNKNOWN

    def test_finding_state_enum(self):
        """FindingState enum has correct values."""
        assert FindingState.PRESENT == "present"
        assert FindingState.ABSENT == "absent"
        assert FindingState.UNKNOWN == "unknown"
        assert FindingState.NOT_APPLICABLE == "not_applicable"

    def test_triage_input_creation(self):
        """TriageInput can be created with all fields."""
        vital_signs = VitalSigns()
        vital_signs.heart_rate_bpm = 80
        vital_signs.set_measured("heart_rate_bpm", True)

        clinical_findings = ClinicalFindings()
        clinical_findings.airway_obstruction = FindingState.PRESENT

        triage_input = TriageInput(
            patient_id="TEST-001",
            age=45,
            vital_signs=vital_signs,
            clinical_findings=clinical_findings,
            rules_version="TEST-v1",
        )
        assert triage_input.patient_id == "TEST-001"
        assert triage_input.age == 45
        assert triage_input.vital_signs.heart_rate_bpm == 80
        assert triage_input.clinical_findings.airway_obstruction == FindingState.PRESENT


class TestInputMapping:
    """Tests for input mapping functions."""

    def test_create_triage_input_from_patient(self):
        """Mapping from patient dict to TriageInput works."""
        patient_data = {
            "patient_id": "PAT-001",
            "age": 50,
            "symptoms": ["Chest pain", "Shortness of breath"],
            "vitals": {
                "heart_rate_bpm": 110,
                "respiratory_rate_per_min": 28,
                "spo2_percent": 92,
                "systolic_bp_mmhg": 100,
                "temperature_c": 37.5,
            },
            "transcript": "Patient reports chest pain",
        }

        triage_input = create_triage_input_from_patient(patient_data, "TEST-v1")

        assert triage_input.patient_id == "PAT-001"
        assert triage_input.age == 50
        assert triage_input.vital_signs.get_measured("heart_rate_bpm") is True
        assert triage_input.vital_signs.heart_rate_bpm == 110
        assert triage_input.vital_signs.get_measured("spo2_percent") is True
        assert triage_input.clinical_findings.chest_pain_cardiac == FindingState.PRESENT
        assert triage_input.clinical_findings.severe_respiratory_distress == FindingState.PRESENT

    def test_create_triage_input_minimal(self):
        """Mapping works with minimal patient data."""
        patient_data = {
            "patient_id": "PAT-002",
            "age": 30,
            "symptoms": [],
            "vitals": None,
            "transcript": None,
        }

        triage_input = create_triage_input_from_patient(patient_data, "TEST-v1")

        assert triage_input.patient_id == "PAT-002"
        assert triage_input.age == 30
        # All findings should be UNKNOWN
        assert triage_input.clinical_findings.airway_obstruction == FindingState.UNKNOWN

    def test_extract_input_snapshot(self):
        """Input snapshot extraction works."""
        vital_signs = VitalSigns()
        vital_signs.heart_rate_bpm = 80
        vital_signs.set_measured("heart_rate_bpm", True)

        clinical_findings = ClinicalFindings()
        clinical_findings.airway_obstruction = FindingState.PRESENT

        triage_input = TriageInput(
            patient_id="TEST-001",
            age=45,
            vital_signs=vital_signs,
            clinical_findings=clinical_findings,
            rules_version="TEST-v1",
        )

        snapshot = extract_input_snapshot(triage_input)

        assert snapshot["age"] == 45
        assert snapshot["vital_signs"]["heart_rate_bpm"] == 80
        assert snapshot["vital_signs"]["measured"]["heart_rate_bpm"] is True
        assert snapshot["clinical_findings"]["airway_obstruction"] == "present"
        assert snapshot["rules_version"] == "TEST-v1"


class TestAcuityCategories:
    """Tests for acuity category enums."""

    def test_acuity_category_values(self):
        """AcuityCategory has correct values."""
        assert AcuityCategory.RED == "red"
        assert AcuityCategory.YELLOW == "yellow"
        assert AcuityCategory.GREEN == "green"
        assert AcuityCategory.UNASSESSED == "unassessed"
        assert AcuityCategory.NEEDS_REVIEW == "needs_review"
        assert AcuityCategory.OUT_OF_SCOPE == "out_of_scope"

    def test_error_codes(self):
        """ErrorCode enum has expected values."""
        assert ErrorCode.VALIDATION_ERROR == "VALIDATION_ERROR"
        assert ErrorCode.NOT_FOUND == "NOT_FOUND"
        assert ErrorCode.AGE_OUT_OF_SCOPE == "AGE_OUT_OF_SCOPE"
        assert ErrorCode.INSUFFICIENT_DATA == "INSUFFICIENT_DATA"
        assert ErrorCode.SPEECH_NOT_CONFIGURED == "SPEECH_NOT_CONFIGURED"
"""
WeCare.AI Clinical Rules Engine - Input/Output Schemas

Typed data models for the deterministic clinical triage engine.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class FindingState(str, Enum):
    """State of a clinical finding - explicitly distinguishes present/absent/unknown."""
    PRESENT = "present"
    ABSENT = "absent"
    UNKNOWN = "unknown"
    NOT_APPLICABLE = "not_applicable"


class AcuityCategory(str, Enum):
    """WHO IITT acuity categories plus workflow states."""
    RED = "red"
    YELLOW = "yellow"
    GREEN = "green"
    UNASSESSED = "unassessed"
    NEEDS_REVIEW = "needs_review"
    OUT_OF_SCOPE = "out_of_scope"


class AssessmentStatus(str, Enum):
    """Assessment completion status."""
    COMPLETED = "completed"
    FAILED = "failed"
    INSUFFICIENT_DATA = "insufficient_data"
    AGE_OUT_OF_SCOPE = "age_out_of_scope"


# --- Structured Clinical Input ---

class VitalSigns(BaseModel):
    """Vital signs with explicit unknown state tracking."""
    model_config = ConfigDict(extra="forbid")

    heart_rate_bpm: Optional[int] = Field(default=None, ge=0, le=300)
    respiratory_rate_per_min: Optional[int] = Field(default=None, ge=0, le=100)
    spo2_percent: Optional[int] = Field(default=None, ge=0, le=100)
    systolic_bp_mmhg: Optional[int] = Field(default=None, ge=0, le=300)
    temperature_c: Optional[float] = Field(default=None, ge=20.0, le=45.0)

    # Track which vitals were explicitly measured vs unknown
    measured: Dict[str, bool] = Field(default_factory=dict)

    def get_measured(self, name: str) -> bool:
        """Check if a vital sign was explicitly measured."""
        return self.measured.get(name, False)

    def set_measured(self, name: str, value: bool = True) -> None:
        """Mark a vital sign as measured."""
        self.measured[name] = value


class ClinicalFindings(BaseModel):
    """
    Structured clinical findings for triage assessment.

    Each finding explicitly tracks its state (present/absent/unknown)
    to avoid inferring negatives from missing data.
    """
    model_config = ConfigDict(extra="forbid")

    # Airway & Breathing
    airway_obstruction: FindingState = FindingState.UNKNOWN
    severe_respiratory_distress: FindingState = FindingState.UNKNOWN
    central_cyanosis: FindingState = FindingState.UNKNOWN
    unable_to_speak_full_sentences: FindingState = FindingState.UNKNOWN

    # Circulation
    shock: FindingState = FindingState.UNKNOWN
    capillary_refill_gt_3s: FindingState = FindingState.UNKNOWN
    weak_peripheral_pulses: FindingState = FindingState.UNKNOWN
    cold_extremities: FindingState = FindingState.UNKNOWN

    # Neurological
    altered_mental_status: FindingState = FindingState.UNKNOWN
    unconscious: FindingState = FindingState.UNKNOWN
    seizure_activity: FindingState = FindingState.UNKNOWN
    severe_headache: FindingState = FindingState.UNKNOWN

    # Trauma
    major_trauma: FindingState = FindingState.UNKNOWN
    uncontrolled_bleeding: FindingState = FindingState.UNKNOWN
    suspected_spinal_injury: FindingState = FindingState.UNKNOWN
    major_burns: FindingState = FindingState.UNKNOWN

    # Cardiac/Chest
    chest_pain_cardiac: FindingState = FindingState.UNKNOWN
    acute_coronary_syndrome_suspected: FindingState = FindingState.UNKNOWN

    # Abdominal
    acute_abdomen: FindingState = FindingState.UNKNOWN

    # Infectious/Other
    high_fever_with_toxic_appearance: FindingState = FindingState.UNKNOWN
    severe_pain: FindingState = FindingState.UNKNOWN
    poisoning_known_or_suspected: FindingState = FindingState.UNKNOWN

    # High-risk vital sign criteria (from WHO IITT reference card)
    hr_gt_130: FindingState = FindingState.UNKNOWN
    hr_lt_50: FindingState = FindingState.UNKNOWN
    rr_gt_30: FindingState = FindingState.UNKNOWN
    rr_lt_10: FindingState = FindingState.UNKNOWN
    spo2_lt_92: FindingState = FindingState.UNKNOWN
    sbp_lt_90: FindingState = FindingState.UNKNOWN
    temp_gt_39: FindingState = FindingState.UNKNOWN
    temp_lt_35: FindingState = FindingState.UNKNOWN


class TriageInput(BaseModel):
    """Complete input for the triage engine."""
    model_config = ConfigDict(extra="forbid")

    patient_id: str
    age: int
    vital_signs: VitalSigns
    clinical_findings: ClinicalFindings
    rules_version: str
    assessed_at: datetime = Field(default_factory=datetime.utcnow)


# --- Rule Definitions ---

class CriterionId(str, Enum):
    """Stable criterion identifiers mapped to WHO IITT criteria."""
    # RED criteria (immediate)
    AIRWAY_OBSTRUCTION = "RED_AIRWAY_OBSTRUCTION"
    SEVERE_RESPIRATORY_DISTRESS = "RED_SEVERE_RESPIRATORY_DISTRESS"
    CENTRAL_CYANOSIS = "RED_CENTRAL_CYANOSIS"
    UNABLE_TO_SPEAK = "RED_UNABLE_TO_SPEAK"
    SHOCK = "RED_SHOCK"
    CAPILLARY_REFILL_GT_3S = "RED_CAPILLARY_REFILL_GT_3S"
    WEAK_PULSES = "RED_WEAK_PULSES"
    COLD_EXTREMITIES = "RED_COLD_EXTREMITIES"
    ALTERED_MENTAL_STATUS = "RED_ALTERED_MENTAL_STATUS"
    UNCONSCIOUS = "RED_UNCONSCIOUS"
    SEIZURE = "RED_SEIZURE"
    MAJOR_TRAUMA = "RED_MAJOR_TRAUMA"
    UNCONTROLLED_BLEEDING = "RED_UNCONTROLLED_BLEEDING"
    SUSPECTED_SPINAL = "RED_SUSPECTED_SPINAL"
    MAJOR_BURNS = "RED_MAJOR_BURNS"
    CHEST_PAIN_CARDIAC = "RED_CHEST_PAIN_CARDIAC"
    ACS_SUSPECTED = "RED_ACS_SUSPECTED"
    ACUTE_ABDOMEN = "RED_ACUTE_ABDOMEN"
    TOXIC_APPEARANCE = "RED_TOXIC_APPEARANCE"
    SEVERE_PAIN = "RED_SEVERE_PAIN"
    POISONING = "RED_POISONING"

    # RED vital sign criteria
    HR_GT_130 = "RED_HR_GT_130"
    HR_LT_50 = "RED_HR_LT_50"
    RR_GT_30 = "RED_RR_GT_30"
    RR_LT_10 = "RED_RR_LT_10"
    SPO2_LT_92 = "RED_SPO2_LT_92"
    SBP_LT_90 = "RED_SBP_LT_90"
    TEMP_GT_39 = "RED_TEMP_GT_39"
    TEMP_LT_35 = "RED_TEMP_LT_35"

    # YELLOW criteria (urgent)
    MODERATE_RESPIRATORY_DISTRESS = "YELLOW_MODERATE_RESPIRATORY_DISTRESS"
    MODERATE_DEHYDRATION = "YELLOW_MODERATE_DEHYDRATION"
    PERSISTENT_VOMITING = "YELLOW_PERSISTENT_VOMITING"
    HIGH_FEVER = "YELLOW_HIGH_FEVER"
    HEAD_INJURY = "YELLOW_HEAD_INJURY"
    MODERATE_TRAUMA = "YELLOW_MODERATE_TRAUMA"
    PREGNANCY_COMPLICATIONS = "YELLOW_PREGNANCY_COMPLICATIONS"
    PSYCHIATRIC_EMERGENCY = "YELLOW_PSYCHIATRIC_EMERGENCY"

    # YELLOW vital sign criteria
    HR_110_130 = "YELLOW_HR_110_130"
    HR_50_60 = "YELLOW_HR_50_60"
    RR_25_30 = "YELLOW_RR_25_30"
    RR_10_12 = "YELLOW_RR_10_12"
    SPO2_92_94 = "YELLOW_SPO2_92_94"
    SBP_90_100 = "YELLOW_SBP_90_100"
    TEMP_38_39 = "YELLOW_TEMP_38_39"
    TEMP_35_36 = "YELLOW_TEMP_35_36"

    # GREEN criteria (non-urgent) - default when no higher criteria met
    MINOR_COMPLAINT = "GREEN_MINOR_COMPLAINT"
    NORMAL_VITALS = "GREEN_NORMAL_VITALS"


class MatchedCriterion(BaseModel):
    """A single matched criterion with its details."""
    model_config = ConfigDict(extra="forbid")

    criterion_id: CriterionId
    label: str
    reason: str
    acuity: AcuityCategory
    source_reference: str


# --- Assessment Output ---

class ClinicalAssessmentResult(BaseModel):
    """Complete result from the clinical triage engine."""
    model_config = ConfigDict(extra="forbid")

    patient_id: str
    assessment_id: Optional[str] = None
    acuity: Optional[AcuityCategory] = None
    assessment_status: AssessmentStatus
    review_required: bool = False
    reasons: List[str] = Field(default_factory=list)
    matched_criteria: List[CriterionId] = Field(default_factory=list)
    matched_criteria_details: List[MatchedCriterion] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    rules_version: str
    assessed_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "patient_id": self.patient_id,
            "assessment_id": self.assessment_id,
            "acuity": self.acuity.value if self.acuity else None,
            "assessment_status": self.assessment_status.value,
            "review_required": self.review_required,
            "reasons": self.reasons,
            "matched_criteria": [c.value for c in self.matched_criteria],
            "missing_information": self.missing_information,
            "rules_version": self.rules_version,
            "assessed_at": self.assessed_at.isoformat() if isinstance(self.assessed_at, datetime) else str(self.assessed_at),
        }
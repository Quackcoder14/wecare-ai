"""
WeCare.AI Clinical Rules Engine Tests

Tests for the deterministic triage engine.
Each implemented criterion has positive and negative/boundary tests.
"""
import pytest
from datetime import datetime
from uuid import uuid4

from app.clinical_rules.schemas import (
    TriageInput,
    ClinicalFindings,
    VitalSigns,
    FindingState,
    AcuityCategory,
    AssessmentStatus,
    CriterionId,
)
from app.clinical_rules.engine import ClinicalRulesEngine
from app.clinical_rules.criteria import RED_CRITERIA, YELLOW_CRITERIA, ALL_CRITERIA
from app.config import settings


@pytest.fixture
def rules_engine():
    """Create a rules engine instance for testing."""
    return ClinicalRulesEngine(rules_version="TEST-v1")


@pytest.fixture
def base_triage_input():
    """Create a baseline triage input with all findings UNKNOWN."""
    vital_signs = VitalSigns()
    clinical_findings = ClinicalFindings()

    return TriageInput(
        patient_id=str(uuid4()),
        age=45,
        vital_signs=vital_signs,
        clinical_findings=clinical_findings,
        rules_version="TEST-v1",
        assessed_at=datetime.utcnow(),
    )


def set_finding(input_data: TriageInput, finding_name: str, state: FindingState):
    """Helper to set a clinical finding."""
    setattr(input_data.clinical_findings, finding_name, state)


def set_vital(input_data: TriageInput, vital_name: str, value: float):
    """Helper to set a measured vital sign."""
    setattr(input_data.vital_signs, vital_name, value)
    input_data.vital_signs.set_measured(vital_name, True)


class TestRedCriteria:
    """Tests for RED (immediate) criteria."""

    def test_airway_obstruction_present(self, rules_engine, base_triage_input):
        """RED: Airway obstruction present -> RED acuity."""
        set_finding(base_triage_input, "airway_obstruction", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.AIRWAY_OBSTRUCTION in result.matched_criteria

    def test_airway_obstruction_absent(self, rules_engine, base_triage_input):
        """RED: Airway obstruction absent -> not RED (if no other criteria)."""
        set_finding(base_triage_input, "airway_obstruction", FindingState.ABSENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity != AcuityCategory.RED or CriterionId.AIRWAY_OBSTRUCTION not in result.matched_criteria

    def test_severe_respiratory_distress_present(self, rules_engine, base_triage_input):
        """RED: Severe respiratory distress present -> RED acuity."""
        set_finding(base_triage_input, "severe_respiratory_distress", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.SEVERE_RESPIRATORY_DISTRESS in result.matched_criteria

    def test_central_cyanosis_present(self, rules_engine, base_triage_input):
        """RED: Central cyanosis present -> RED acuity."""
        set_finding(base_triage_input, "central_cyanosis", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.CENTRAL_CYANOSIS in result.matched_criteria

    def test_unable_to_speak_present(self, rules_engine, base_triage_input):
        """RED: Unable to speak full sentences -> RED acuity."""
        set_finding(base_triage_input, "unable_to_speak_full_sentences", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.UNABLE_TO_SPEAK in result.matched_criteria

    def test_shock_present(self, rules_engine, base_triage_input):
        """RED: Clinical shock present -> RED acuity."""
        set_finding(base_triage_input, "shock", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.SHOCK in result.matched_criteria

    def test_capillary_refill_gt_3s_present(self, rules_engine, base_triage_input):
        """RED: Capillary refill > 3s present -> RED acuity."""
        set_finding(base_triage_input, "capillary_refill_gt_3s", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.CAPILLARY_REFILL_GT_3S in result.matched_criteria

    def test_weak_pulses_present(self, rules_engine, base_triage_input):
        """RED: Weak peripheral pulses present -> RED acuity."""
        set_finding(base_triage_input, "weak_peripheral_pulses", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.WEAK_PULSES in result.matched_criteria

    def test_cold_extremities_present(self, rules_engine, base_triage_input):
        """RED: Cold extremities present -> RED acuity."""
        set_finding(base_triage_input, "cold_extremities", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.COLD_EXTREMITIES in result.matched_criteria

    def test_altered_mental_status_present(self, rules_engine, base_triage_input):
        """RED: Altered mental status present -> RED acuity."""
        set_finding(base_triage_input, "altered_mental_status", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.ALTERED_MENTAL_STATUS in result.matched_criteria

    def test_unconscious_present(self, rules_engine, base_triage_input):
        """RED: Unconscious present -> RED acuity."""
        set_finding(base_triage_input, "unconscious", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.UNCONSCIOUS in result.matched_criteria

    def test_seizure_present(self, rules_engine, base_triage_input):
        """RED: Active seizure present -> RED acuity."""
        set_finding(base_triage_input, "seizure_activity", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.SEIZURE in result.matched_criteria

    def test_major_trauma_present(self, rules_engine, base_triage_input):
        """RED: Major trauma present -> RED acuity."""
        set_finding(base_triage_input, "major_trauma", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.MAJOR_TRAUMA in result.matched_criteria

    def test_uncontrolled_bleeding_present(self, rules_engine, base_triage_input):
        """RED: Uncontrolled bleeding present -> RED acuity."""
        set_finding(base_triage_input, "uncontrolled_bleeding", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.UNCONTROLLED_BLEEDING in result.matched_criteria

    def test_suspected_spinal_present(self, rules_engine, base_triage_input):
        """RED: Suspected spinal injury present -> RED acuity."""
        set_finding(base_triage_input, "suspected_spinal_injury", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.SUSPECTED_SPINAL in result.matched_criteria

    def test_major_burns_present(self, rules_engine, base_triage_input):
        """RED: Major burns present -> RED acuity."""
        set_finding(base_triage_input, "major_burns", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.MAJOR_BURNS in result.matched_criteria

    def test_chest_pain_cardiac_present(self, rules_engine, base_triage_input):
        """RED: Chest pain cardiac present -> RED acuity."""
        set_finding(base_triage_input, "chest_pain_cardiac", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.CHEST_PAIN_CARDIAC in result.matched_criteria

    def test_acs_suspected_present(self, rules_engine, base_triage_input):
        """RED: ACS suspected present -> RED acuity."""
        set_finding(base_triage_input, "acute_coronary_syndrome_suspected", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.ACS_SUSPECTED in result.matched_criteria

    def test_acute_abdomen_present(self, rules_engine, base_triage_input):
        """RED: Acute abdomen present -> RED acuity."""
        set_finding(base_triage_input, "acute_abdomen", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.ACUTE_ABDOMEN in result.matched_criteria

    def test_toxic_appearance_present(self, rules_engine, base_triage_input):
        """RED: Toxic appearance with fever present -> RED acuity."""
        set_finding(base_triage_input, "high_fever_with_toxic_appearance", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.TOXIC_APPEARANCE in result.matched_criteria

    def test_severe_pain_present(self, rules_engine, base_triage_input):
        """RED: Severe pain present -> RED acuity."""
        set_finding(base_triage_input, "severe_pain", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.SEVERE_PAIN in result.matched_criteria

    def test_poisoning_present(self, rules_engine, base_triage_input):
        """RED: Poisoning present -> RED acuity."""
        set_finding(base_triage_input, "poisoning_known_or_suspected", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.POISONING in result.matched_criteria


class TestRedVitalSignCriteria:
    """Tests for RED vital sign criteria."""

    def test_hr_gt_130(self, rules_engine, base_triage_input):
        """RED: HR > 130 -> RED acuity."""
        set_vital(base_triage_input, "heart_rate_bpm", 140)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.HR_GT_130 in result.matched_criteria

    def test_hr_lt_50(self, rules_engine, base_triage_input):
        """RED: HR < 50 -> RED acuity."""
        set_vital(base_triage_input, "heart_rate_bpm", 45)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.HR_LT_50 in result.matched_criteria

    def test_hr_boundary_130_not_red(self, rules_engine, base_triage_input):
        """Boundary: HR = 130 should not trigger RED (exclusive)."""
        set_vital(base_triage_input, "heart_rate_bpm", 130)
        result = rules_engine.assess(base_triage_input)
        assert CriterionId.HR_GT_130 not in result.matched_criteria

    def test_hr_boundary_50_not_red(self, rules_engine, base_triage_input):
        """Boundary: HR = 50 should not trigger RED (exclusive)."""
        set_vital(base_triage_input, "heart_rate_bpm", 50)
        result = rules_engine.assess(base_triage_input)
        assert CriterionId.HR_LT_50 not in result.matched_criteria

    def test_rr_gt_30(self, rules_engine, base_triage_input):
        """RED: RR > 30 -> RED acuity."""
        set_vital(base_triage_input, "respiratory_rate_per_min", 35)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.RR_GT_30 in result.matched_criteria

    def test_rr_lt_10(self, rules_engine, base_triage_input):
        """RED: RR < 10 -> RED acuity."""
        set_vital(base_triage_input, "respiratory_rate_per_min", 8)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.RR_LT_10 in result.matched_criteria

    def test_spo2_lt_92(self, rules_engine, base_triage_input):
        """RED: SpO2 < 92% -> RED acuity."""
        set_vital(base_triage_input, "spo2_percent", 90)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.SPO2_LT_92 in result.matched_criteria

    def test_sbp_lt_90(self, rules_engine, base_triage_input):
        """RED: SBP < 90 -> RED acuity."""
        set_vital(base_triage_input, "systolic_bp_mmhg", 85)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.SBP_LT_90 in result.matched_criteria

    def test_temp_gt_39(self, rules_engine, base_triage_input):
        """RED: Temp > 39°C -> RED acuity."""
        set_vital(base_triage_input, "temperature_c", 40.0)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.TEMP_GT_39 in result.matched_criteria

    def test_temp_lt_35(self, rules_engine, base_triage_input):
        """RED: Temp < 35°C -> RED acuity."""
        set_vital(base_triage_input, "temperature_c", 34.0)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.TEMP_LT_35 in result.matched_criteria


class TestYellowVitalSignCriteria:
    """Tests for YELLOW vital sign criteria."""

    def test_hr_110_130(self, rules_engine, base_triage_input):
        """YELLOW: HR 110-130 -> YELLOW acuity."""
        set_vital(base_triage_input, "heart_rate_bpm", 120)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.YELLOW
        assert CriterionId.HR_110_130 in result.matched_criteria

    def test_hr_50_60(self, rules_engine, base_triage_input):
        """YELLOW: HR 50-60 -> YELLOW acuity."""
        set_vital(base_triage_input, "heart_rate_bpm", 55)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.YELLOW
        assert CriterionId.HR_50_60 in result.matched_criteria

    def test_rr_25_30(self, rules_engine, base_triage_input):
        """YELLOW: RR 25-30 -> YELLOW acuity."""
        set_vital(base_triage_input, "respiratory_rate_per_min", 28)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.YELLOW
        assert CriterionId.RR_25_30 in result.matched_criteria

    def test_rr_10_12(self, rules_engine, base_triage_input):
        """YELLOW: RR 10-12 -> YELLOW acuity."""
        set_vital(base_triage_input, "respiratory_rate_per_min", 11)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.YELLOW
        assert CriterionId.RR_10_12 in result.matched_criteria

    def test_spo2_92_94(self, rules_engine, base_triage_input):
        """YELLOW: SpO2 92-94% -> YELLOW acuity."""
        set_vital(base_triage_input, "spo2_percent", 93)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.YELLOW
        assert CriterionId.SPO2_92_94 in result.matched_criteria

    def test_sbp_90_100(self, rules_engine, base_triage_input):
        """YELLOW: SBP 90-100 -> YELLOW acuity."""
        set_vital(base_triage_input, "systolic_bp_mmhg", 95)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.YELLOW
        assert CriterionId.SBP_90_100 in result.matched_criteria

    def test_temp_38_39(self, rules_engine, base_triage_input):
        """YELLOW: Temp 38-39°C -> YELLOW acuity."""
        set_vital(base_triage_input, "temperature_c", 38.5)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.YELLOW
        assert CriterionId.TEMP_38_39 in result.matched_criteria

    def test_temp_35_36(self, rules_engine, base_triage_input):
        """YELLOW: Temp 35-36°C -> YELLOW acuity."""
        set_vital(base_triage_input, "temperature_c", 35.5)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.YELLOW
        assert CriterionId.TEMP_35_36 in result.matched_criteria


class TestRedPriorityOverYellow:
    """Tests that RED criteria take priority over YELLOW."""

    def test_red_vital_over_yellow_vital(self, rules_engine, base_triage_input):
        """RED vital sign should override YELLOW vital sign."""
        set_vital(base_triage_input, "heart_rate_bpm", 140)  # RED
        set_vital(base_triage_input, "respiratory_rate_per_min", 28)  # YELLOW
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.HR_GT_130 in result.matched_criteria

    def test_red_finding_over_yellow_vital(self, rules_engine, base_triage_input):
        """RED clinical finding should override YELLOW vital sign."""
        set_finding(base_triage_input, "airway_obstruction", FindingState.PRESENT)
        set_vital(base_triage_input, "heart_rate_bpm", 120)  # YELLOW
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED
        assert CriterionId.AIRWAY_OBSTRUCTION in result.matched_criteria


class TestMissingInformation:
    """Tests for missing information handling."""

    def test_missing_vitals_reported(self, rules_engine, base_triage_input):
        """Missing vital signs should be reported in missing_information."""
        set_finding(base_triage_input, "airway_obstruction", FindingState.PRESENT)
        # Don't set any vitals
        result = rules_engine.assess(base_triage_input)
        # RED finding matched, but missing vitals should still be reported
        assert any("Heart rate" in m for m in result.missing_information)
        assert any("Respiratory rate" in m for m in result.missing_information)
        assert any("SpO2" in m for m in result.missing_information)
        assert any("Systolic BP" in m for m in result.missing_information)
        assert any("Temperature" in m for m in result.missing_information)

    def test_unknown_findings_reported(self, rules_engine, base_triage_input):
        """Unknown findings should be reported."""
        set_finding(base_triage_input, "airway_obstruction", FindingState.PRESENT)
        # All other findings are UNKNOWN by default
        result = rules_engine.assess(base_triage_input)
        # Should report unknown status for other RED findings
        assert any("unknown" in m.lower() for m in result.missing_information)

    def test_no_criteria_matched_unassessed(self, rules_engine, base_triage_input):
        """No criteria matched -> UNASSESSED with missing info."""
        # All findings UNKNOWN, no vitals measured
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.UNASSESSED
        assert result.assessment_status == AssessmentStatus.INSUFFICIENT_DATA
        assert result.review_required is True
        assert len(result.missing_information) > 0


class TestAgeBoundary:
    """Tests for age eligibility boundary."""

    def test_age_below_12_out_of_scope(self, rules_engine, base_triage_input):
        """Age < 12 -> OUT_OF_SCOPE."""
        base_triage_input.age = 10
        set_finding(base_triage_input, "airway_obstruction", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.OUT_OF_SCOPE
        assert result.assessment_status == AssessmentStatus.AGE_OUT_OF_SCOPE
        assert result.review_required is True

    def test_age_12_assessed(self, rules_engine, base_triage_input):
        """Age = 12 -> assessed normally."""
        base_triage_input.age = 12
        set_finding(base_triage_input, "airway_obstruction", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.RED

    def test_age_11_out_of_scope(self, rules_engine, base_triage_input):
        """Age = 11 -> OUT_OF_SCOPE."""
        base_triage_input.age = 11
        result = rules_engine.assess(base_triage_input)
        assert result.acuity == AcuityCategory.OUT_OF_SCOPE


class TestAssessmentResultStructure:
    """Tests for assessment result structure and completeness."""

    def test_result_has_all_required_fields(self, rules_engine, base_triage_input):
        """Result should have all required fields populated."""
        set_finding(base_triage_input, "airway_obstruction", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)

        assert result.patient_id == base_triage_input.patient_id
        assert result.assessment_id is None  # Set by service layer
        assert result.acuity is not None
        assert result.assessment_status is not None
        assert isinstance(result.review_required, bool)
        assert isinstance(result.reasons, list)
        assert isinstance(result.matched_criteria, list)
        assert isinstance(result.matched_criteria_details, list)
        assert isinstance(result.missing_information, list)
        assert result.rules_version == "TEST-v1"
        assert isinstance(result.assessed_at, datetime)

    def test_matched_criteria_details_populated(self, rules_engine, base_triage_input):
        """Matched criteria details should have full information."""
        set_finding(base_triage_input, "airway_obstruction", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)

        assert len(result.matched_criteria_details) == 1
        detail = result.matched_criteria_details[0]
        assert detail.criterion_id == CriterionId.AIRWAY_OBSTRUCTION
        assert detail.label == "Airway obstruction"
        assert detail.acuity == AcuityCategory.RED
        assert len(detail.reason) > 0
        assert len(detail.source_reference) > 0

    def test_to_dict_serialization(self, rules_engine, base_triage_input):
        """Result should serialize to dict correctly."""
        set_finding(base_triage_input, "airway_obstruction", FindingState.PRESENT)
        result = rules_engine.assess(base_triage_input)
        data = result.to_dict()

        assert data["patient_id"] == result.patient_id
        assert data["acuity"] == "red"
        assert data["assessment_status"] == "completed"
        assert data["review_required"] is True
        assert isinstance(data["reasons"], list)
        assert isinstance(data["matched_criteria"], list)
        assert isinstance(data["missing_information"], list)
        assert data["rules_version"] == "TEST-v1"


class TestCriteriaRegistry:
    """Tests for criteria registry completeness."""

    def test_all_criteria_have_unique_ids(self):
        """All criteria should have unique IDs."""
        ids = [c.criterion_id for c in ALL_CRITERIA]
        assert len(ids) == len(set(ids))

    def test_all_criteria_have_source_reference(self):
        """All criteria should have source reference."""
        for criterion in ALL_CRITERIA:
            assert criterion.source_reference
            assert len(criterion.source_reference) > 0

    def test_all_criteria_have_reason(self):
        """All criteria should have human-readable reason."""
        for criterion in ALL_CRITERIA:
            assert criterion.reason
            assert len(criterion.reason) > 0

    def test_red_criteria_count(self):
        """Verify expected number of RED criteria."""
        # 21 clinical findings + 8 vital signs = 29 RED criteria
        assert len(RED_CRITERIA) == 29

    def test_yellow_criteria_count(self):
        """Verify expected number of YELLOW criteria."""
        # 8 vital sign ranges + 1 clinical = 9 YELLOW criteria
        assert len(YELLOW_CRITERIA) == 9

    def test_criteria_ordered_by_acuity(self):
        """ALL_CRITERIA should be ordered RED -> YELLOW -> GREEN."""
        acuities = [c.acuity for c in ALL_CRITERIA]
        red_indices = [i for i, a in enumerate(acuities) if a == AcuityCategory.RED]
        yellow_indices = [i for i, a in enumerate(acuities) if a == AcuityCategory.YELLOW]
        green_indices = [i for i, a in enumerate(acuities) if a == AcuityCategory.GREEN]

        assert max(red_indices) < min(yellow_indices)
        assert max(yellow_indices) < min(green_indices)
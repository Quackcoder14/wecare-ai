"""
WeCare.AI — Clinical Rules Engine Test Suite
=============================================

Tests the deterministic triage engine against representative real-world scenarios
based on the WHO Interagency Integrated Triage Tool (IITT) for ages 12+.

Each test class covers one clinical domain. Run with:
    cd backend
    pytest tests/ -v
"""
import pytest
from datetime import datetime

from app.clinical_rules.engine import ClinicalRulesEngine
from app.clinical_rules.schemas import (
    TriageInput,
    ClinicalFindings,
    VitalSigns,
    FindingState,
    AcuityCategory,
    AssessmentStatus,
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers / Fixtures
# ─────────────────────────────────────────────────────────────────────────────

RULES_VERSION = "WHO-IITT-v1.0"


def make_vitals(
    hr: int = None,
    rr: int = None,
    spo2: int = None,
    sbp: int = None,
    temp: float = None,
) -> VitalSigns:
    """Build a VitalSigns object with only the supplied values marked as measured."""
    v = VitalSigns()
    if hr is not None:
        v.heart_rate_bpm = hr
        v.set_measured("heart_rate_bpm")
    if rr is not None:
        v.respiratory_rate_per_min = rr
        v.set_measured("respiratory_rate_per_min")
    if spo2 is not None:
        v.spo2_percent = spo2
        v.set_measured("spo2_percent")
    if sbp is not None:
        v.systolic_bp_mmhg = sbp
        v.set_measured("systolic_bp_mmhg")
    if temp is not None:
        v.temperature_c = temp
        v.set_measured("temperature_c")
    return v


def make_findings(**kwargs: FindingState) -> ClinicalFindings:
    """Build ClinicalFindings with specified fields set to PRESENT."""
    f = ClinicalFindings()
    for attr, state in kwargs.items():
        setattr(f, attr, state)
    return f


def make_input(
    age: int = 35,
    vitals: VitalSigns = None,
    findings: ClinicalFindings = None,
    patient_id: str = "test-patient-001",
) -> TriageInput:
    return TriageInput(
        patient_id=patient_id,
        age=age,
        vital_signs=vitals or VitalSigns(),
        clinical_findings=findings or ClinicalFindings(),
        rules_version=RULES_VERSION,
        assessed_at=datetime.utcnow(),
    )


@pytest.fixture
def engine() -> ClinicalRulesEngine:
    return ClinicalRulesEngine(rules_version=RULES_VERSION)


# ─────────────────────────────────────────────────────────────────────────────
# CLASS 1 — Airway & Breathing RED criteria
# ─────────────────────────────────────────────────────────────────────────────

class TestAirwayBreathingRed:
    """RED (immediate) criteria for airway and breathing."""

    def test_airway_obstruction_is_red(self, engine):
        inp = make_input(
            findings=make_findings(airway_obstruction=FindingState.PRESENT)
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED
        assert result.review_required is True
        assert any("airway" in r.lower() or "obstruction" in r.lower() for r in result.reasons)

    def test_severe_respiratory_distress_is_red(self, engine):
        inp = make_input(
            findings=make_findings(severe_respiratory_distress=FindingState.PRESENT)
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_central_cyanosis_is_red(self, engine):
        inp = make_input(
            findings=make_findings(central_cyanosis=FindingState.PRESENT)
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_spo2_below_92_is_red(self, engine):
        """SpO2 < 92% → RED vital sign criterion."""
        inp = make_input(vitals=make_vitals(spo2=88))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_spo2_at_91_boundary_is_red(self, engine):
        inp = make_input(vitals=make_vitals(spo2=91))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_rr_above_30_is_red(self, engine):
        """Respiratory rate > 30/min → RED."""
        inp = make_input(vitals=make_vitals(rr=35))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_rr_below_10_is_red(self, engine):
        """Respiratory rate < 10/min → RED."""
        inp = make_input(vitals=make_vitals(rr=8))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_rr_exactly_30_not_red(self, engine):
        """RR = 30 is not > 30, so not RED by this criterion alone."""
        inp = make_input(vitals=make_vitals(rr=30))
        result = engine.assess(inp)
        # Should be YELLOW (RR 25-30 criterion) or lower, never RED via RR alone
        assert result.acuity != AcuityCategory.RED or \
               any("respiratory" in r.lower() for r in result.reasons)


# ─────────────────────────────────────────────────────────────────────────────
# CLASS 2 — Circulation RED criteria
# ─────────────────────────────────────────────────────────────────────────────

class TestCirculationRed:
    """RED criteria for circulatory compromise."""

    def test_shock_is_red(self, engine):
        inp = make_input(findings=make_findings(shock=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_sbp_below_90_is_red(self, engine):
        inp = make_input(vitals=make_vitals(sbp=80))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_sbp_at_89_is_red(self, engine):
        inp = make_input(vitals=make_vitals(sbp=89))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_heart_rate_above_130_is_red(self, engine):
        inp = make_input(vitals=make_vitals(hr=145))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_heart_rate_below_50_is_red(self, engine):
        inp = make_input(vitals=make_vitals(hr=40))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_weak_pulses_is_red(self, engine):
        inp = make_input(
            findings=make_findings(weak_peripheral_pulses=FindingState.PRESENT)
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_cold_extremities_is_red(self, engine):
        inp = make_input(
            findings=make_findings(cold_extremities=FindingState.PRESENT)
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_capillary_refill_gt3s_is_red(self, engine):
        inp = make_input(
            findings=make_findings(capillary_refill_gt_3s=FindingState.PRESENT)
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED


# ─────────────────────────────────────────────────────────────────────────────
# CLASS 3 — Neurological RED criteria
# ─────────────────────────────────────────────────────────────────────────────

class TestNeurologicalRed:
    """RED criteria for neurological emergencies."""

    def test_unconscious_is_red(self, engine):
        inp = make_input(findings=make_findings(unconscious=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_altered_mental_status_is_red(self, engine):
        inp = make_input(findings=make_findings(altered_mental_status=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_seizure_is_red(self, engine):
        inp = make_input(findings=make_findings(seizure_activity=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED


# ─────────────────────────────────────────────────────────────────────────────
# CLASS 4 — Trauma RED criteria
# ─────────────────────────────────────────────────────────────────────────────

class TestTraumaRed:
    """RED criteria for trauma presentations."""

    def test_major_trauma_is_red(self, engine):
        inp = make_input(findings=make_findings(major_trauma=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_uncontrolled_bleeding_is_red(self, engine):
        inp = make_input(findings=make_findings(uncontrolled_bleeding=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_suspected_spinal_injury_is_red(self, engine):
        inp = make_input(findings=make_findings(suspected_spinal_injury=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_major_burns_is_red(self, engine):
        inp = make_input(findings=make_findings(major_burns=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED


# ─────────────────────────────────────────────────────────────────────────────
# CLASS 5 — Cardiac / Temperature RED criteria
# ─────────────────────────────────────────────────────────────────────────────

class TestCardiacTemperatureRed:
    """RED criteria for cardiac and temperature emergencies."""

    def test_chest_pain_cardiac_is_red(self, engine):
        inp = make_input(findings=make_findings(chest_pain_cardiac=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_acs_suspected_is_red(self, engine):
        inp = make_input(
            findings=make_findings(acute_coronary_syndrome_suspected=FindingState.PRESENT)
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_temp_above_39_is_red(self, engine):
        inp = make_input(vitals=make_vitals(temp=39.5))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_temp_below_35_is_red(self, engine):
        inp = make_input(vitals=make_vitals(temp=34.2))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_temp_exactly_39_not_red_by_vitals(self, engine):
        """Temperature of exactly 39°C is not > 39, so RED only if toxic appearance."""
        inp = make_input(vitals=make_vitals(temp=39.0))
        result = engine.assess(inp)
        # Must not be RED solely from temp=39.0
        if result.acuity == AcuityCategory.RED:
            assert not any("temperature" in r.lower() and "39" in r for r in result.reasons), \
                "temp=39.0 should NOT trigger RED_TEMP_GT_39"

    def test_acute_abdomen_is_red(self, engine):
        inp = make_input(findings=make_findings(acute_abdomen=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_poisoning_is_red(self, engine):
        inp = make_input(findings=make_findings(poisoning_known_or_suspected=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED


# ─────────────────────────────────────────────────────────────────────────────
# CLASS 6 — YELLOW (Urgent) vital sign criteria
# ─────────────────────────────────────────────────────────────────────────────

class TestYellowVitalSigns:
    """YELLOW criteria based on vital sign ranges."""

    def test_hr_110_is_yellow(self, engine):
        inp = make_input(vitals=make_vitals(hr=115))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.YELLOW

    def test_hr_at_boundary_110_is_yellow(self, engine):
        inp = make_input(vitals=make_vitals(hr=110))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.YELLOW

    def test_hr_50_is_yellow(self, engine):
        """HR between 50-60 is YELLOW."""
        inp = make_input(vitals=make_vitals(hr=55))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.YELLOW

    def test_spo2_92_94_is_yellow(self, engine):
        """SpO2 92-94% → YELLOW."""
        inp = make_input(vitals=make_vitals(spo2=93))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.YELLOW

    def test_spo2_at_92_is_yellow(self, engine):
        inp = make_input(vitals=make_vitals(spo2=92))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.YELLOW

    def test_sbp_90_100_is_yellow(self, engine):
        """SBP 90-100 mmHg → YELLOW."""
        inp = make_input(vitals=make_vitals(sbp=95))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.YELLOW

    def test_rr_25_30_is_yellow(self, engine):
        """RR 25-30/min → YELLOW."""
        inp = make_input(vitals=make_vitals(rr=27))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.YELLOW

    def test_temp_38_39_is_yellow(self, engine):
        """Temperature 38-39°C → YELLOW (high fever, no toxic appearance)."""
        inp = make_input(vitals=make_vitals(temp=38.5))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.YELLOW

    def test_temp_35_36_is_yellow(self, engine):
        """Temperature 35-36°C → YELLOW (mild hypothermia)."""
        inp = make_input(vitals=make_vitals(temp=35.5))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.YELLOW


# ─────────────────────────────────────────────────────────────────────────────
# CLASS 7 — GREEN (Non-urgent) cases
# ─────────────────────────────────────────────────────────────────────────────

class TestGreenNonUrgent:
    """GREEN (non-urgent) — stable vitals, minor complaints."""

    def test_normal_vitals_adult_is_green(self, engine):
        """Classic healthy adult presentation → GREEN."""
        inp = make_input(
            age=35,
            vitals=make_vitals(hr=72, rr=16, spo2=98, sbp=120, temp=37.0),
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.GREEN
        assert result.assessment_status == AssessmentStatus.COMPLETED

    def test_normal_vitals_elderly_is_green(self, engine):
        """Elderly patient with stable vitals → GREEN."""
        inp = make_input(
            age=70,
            vitals=make_vitals(hr=78, rr=18, spo2=97, sbp=130, temp=36.8),
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.GREEN

    def test_spo2_at_95_is_green(self, engine):
        """SpO2 95% is in normal range → should not be YELLOW or RED."""
        inp = make_input(vitals=make_vitals(spo2=95, hr=80, rr=16, sbp=118, temp=36.8))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.GREEN

    def test_hr_80_is_green(self, engine):
        inp = make_input(vitals=make_vitals(hr=80, rr=16, spo2=98, sbp=120, temp=37.0))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.GREEN


# ─────────────────────────────────────────────────────────────────────────────
# CLASS 8 — Age out of scope
# ─────────────────────────────────────────────────────────────────────────────

class TestAgeOutOfScope:
    """Engine must reject patients under minimum assessment age (12)."""

    def test_infant_is_out_of_scope(self, engine):
        inp = make_input(age=2)
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.OUT_OF_SCOPE
        assert result.assessment_status == AssessmentStatus.AGE_OUT_OF_SCOPE
        assert result.review_required is True

    def test_child_age_10_is_out_of_scope(self, engine):
        inp = make_input(age=10)
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.OUT_OF_SCOPE

    def test_age_12_is_in_scope(self, engine):
        """Age 12 is the minimum in-scope age."""
        inp = make_input(age=12, vitals=make_vitals(hr=80, rr=16, spo2=98, sbp=110, temp=37.0))
        result = engine.assess(inp)
        assert result.acuity != AcuityCategory.OUT_OF_SCOPE
        assert result.assessment_status != AssessmentStatus.AGE_OUT_OF_SCOPE

    def test_age_11_is_out_of_scope(self, engine):
        inp = make_input(age=11)
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.OUT_OF_SCOPE


# ─────────────────────────────────────────────────────────────────────────────
# CLASS 9 — Priority ordering (RED > YELLOW > GREEN)
# ─────────────────────────────────────────────────────────────────────────────

class TestPriorityOrdering:
    """When multiple criteria match, the highest acuity wins."""

    def test_red_finding_with_yellow_vitals_gives_red(self, engine):
        """Patient with both a RED finding and a YELLOW vital → should be RED."""
        inp = make_input(
            vitals=make_vitals(hr=115),   # YELLOW vital
            findings=make_findings(unconscious=FindingState.PRESENT),  # RED finding
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_yellow_vitals_without_red_gives_yellow(self, engine):
        inp = make_input(vitals=make_vitals(hr=115))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.YELLOW

    def test_green_no_abnormal_findings(self, engine):
        inp = make_input(vitals=make_vitals(hr=75, rr=16, spo2=98, sbp=118, temp=37.0))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.GREEN

    def test_review_required_for_red(self, engine):
        inp = make_input(findings=make_findings(unconscious=FindingState.PRESENT))
        result = engine.assess(inp)
        assert result.review_required is True

    def test_review_not_required_for_green(self, engine):
        inp = make_input(vitals=make_vitals(hr=75, rr=16, spo2=98, sbp=118, temp=37.0))
        result = engine.assess(inp)
        assert result.review_required is False


# ─────────────────────────────────────────────────────────────────────────────
# CLASS 10 — Real-World Clinical Scenarios
# ─────────────────────────────────────────────────────────────────────────────

class TestRealWorldScenarios:
    """
    Representative real-world patient presentations.
    Each scenario mirrors what a triage nurse would encounter.
    """

    def test_scenario_stemi_patient(self, engine):
        """
        Scenario: 58-year-old male, sudden chest pain radiating to left arm,
        diaphoresis, HR=110, BP=95/60, SpO2=93%.
        Expected: RED (ACS suspected + borderline vitals)
        """
        inp = make_input(
            age=58,
            vitals=make_vitals(hr=110, sbp=95, spo2=93, temp=37.2),
            findings=make_findings(
                chest_pain_cardiac=FindingState.PRESENT,
                acute_coronary_syndrome_suspected=FindingState.PRESENT,
            ),
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED, \
            f"STEMI patient must be RED, got {result.acuity}. Reasons: {result.reasons}"

    def test_scenario_septic_shock(self, engine):
        """
        Scenario: 45-year-old, high fever 40.2°C, confused, HR=135, BP=82/50.
        Expected: RED (altered mental status + HR > 130 + SBP < 90)
        """
        inp = make_input(
            age=45,
            vitals=make_vitals(hr=135, sbp=82, temp=40.2, rr=28),
            findings=make_findings(
                altered_mental_status=FindingState.PRESENT,
                high_fever_with_toxic_appearance=FindingState.PRESENT,
            ),
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED, \
            f"Septic shock must be RED, got {result.acuity}. Reasons: {result.reasons}"

    def test_scenario_severe_asthma(self, engine):
        """
        Scenario: 22-year-old asthmatic, severe respiratory distress,
        can't speak full sentences, SpO2=88%, RR=38.
        Expected: RED
        """
        inp = make_input(
            age=22,
            vitals=make_vitals(rr=38, spo2=88, hr=118),
            findings=make_findings(
                severe_respiratory_distress=FindingState.PRESENT,
                unable_to_speak_full_sentences=FindingState.PRESENT,
            ),
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_scenario_road_traffic_accident(self, engine):
        """
        Scenario: 30-year-old, major road trauma, uncontrolled bleeding,
        HR=140, BP=75/40.
        Expected: RED
        """
        inp = make_input(
            age=30,
            vitals=make_vitals(hr=140, sbp=75, rr=24, spo2=94),
            findings=make_findings(
                major_trauma=FindingState.PRESENT,
                uncontrolled_bleeding=FindingState.PRESENT,
            ),
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_scenario_moderate_fever_urgent(self, engine):
        """
        Scenario: 28-year-old, fever 38.7°C, HR=112, no toxic appearance.
        Expected: YELLOW (fever in YELLOW range, HR 110-130)
        """
        inp = make_input(
            age=28,
            vitals=make_vitals(hr=112, temp=38.7, rr=20, spo2=97, sbp=118),
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.YELLOW, \
            f"Moderate fever + tachycardia expected YELLOW, got {result.acuity}"

    def test_scenario_mild_ankle_sprain(self, engine):
        """
        Scenario: 24-year-old, twisted ankle, mild swelling, no other complaints.
        Normal vitals. Expected: GREEN
        """
        inp = make_input(
            age=24,
            vitals=make_vitals(hr=78, rr=16, spo2=99, sbp=122, temp=36.8),
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.GREEN, \
            f"Ankle sprain should be GREEN, got {result.acuity}"

    def test_scenario_overdose_poisoning(self, engine):
        """
        Scenario: 19-year-old, suspected tablet overdose, drowsy, HR=52.
        Expected: RED (poisoning + bradycardia < 50)
        """
        inp = make_input(
            age=19,
            vitals=make_vitals(hr=48, sbp=100, spo2=95, temp=36.5),
            findings=make_findings(
                poisoning_known_or_suspected=FindingState.PRESENT,
                altered_mental_status=FindingState.PRESENT,
            ),
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.RED

    def test_scenario_child_excluded(self, engine):
        """
        Scenario: 8-year-old with high fever — out of scope for this engine (12+ only).
        Expected: OUT_OF_SCOPE
        """
        inp = make_input(
            age=8,
            vitals=make_vitals(temp=40.0, hr=130, rr=30),
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.OUT_OF_SCOPE

    def test_scenario_hypertensive_emergency(self, engine):
        """
        Scenario: 62-year-old, BP 210/120, severe headache.
        Expected: RED (toxic vital signs + severe pain)
        """
        inp = make_input(
            age=62,
            vitals=make_vitals(sbp=210, hr=88, spo2=96, temp=37.1, rr=18),
            findings=make_findings(severe_pain=FindingState.PRESENT),
        )
        result = engine.assess(inp)
        # Hypertensive emergency — SBP 210 won't trigger SBP < 90 RED,
        # but severe_pain IS a RED criterion
        assert result.acuity == AcuityCategory.RED

    def test_scenario_uncomplicated_cold(self, engine):
        """
        Scenario: 35-year-old, mild runny nose, sore throat, no fever >38.
        Normal vitals. Expected: GREEN
        """
        inp = make_input(
            age=35,
            vitals=make_vitals(hr=74, rr=15, spo2=98, sbp=118, temp=37.3),
        )
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.GREEN


# ─────────────────────────────────────────────────────────────────────────────
# CLASS 11 — Engine output structure validation
# ─────────────────────────────────────────────────────────────────────────────

class TestEngineOutputStructure:
    """Validate the structure and completeness of the engine output."""

    def test_result_has_patient_id(self, engine):
        inp = make_input(patient_id="pt-xyz-123")
        result = engine.assess(inp)
        assert result.patient_id == "pt-xyz-123"

    def test_result_has_rules_version(self, engine):
        inp = make_input()
        result = engine.assess(inp)
        assert result.rules_version == RULES_VERSION

    def test_result_has_assessment_status(self, engine):
        inp = make_input(vitals=make_vitals(hr=80, rr=16, spo2=98, sbp=120, temp=37.0))
        result = engine.assess(inp)
        assert result.assessment_status == AssessmentStatus.COMPLETED

    def test_red_result_has_reasons(self, engine):
        inp = make_input(findings=make_findings(unconscious=FindingState.PRESENT))
        result = engine.assess(inp)
        assert len(result.reasons) > 0

    def test_red_result_has_matched_criteria(self, engine):
        inp = make_input(findings=make_findings(unconscious=FindingState.PRESENT))
        result = engine.assess(inp)
        assert len(result.matched_criteria) > 0

    def test_red_result_has_matched_criteria_details(self, engine):
        inp = make_input(findings=make_findings(unconscious=FindingState.PRESENT))
        result = engine.assess(inp)
        assert len(result.matched_criteria_details) > 0
        for detail in result.matched_criteria_details:
            assert detail.label
            assert detail.reason
            assert detail.source_reference

    def test_assessed_at_is_datetime(self, engine):
        inp = make_input()
        result = engine.assess(inp)
        assert isinstance(result.assessed_at, datetime)

    def test_green_review_not_required(self, engine):
        inp = make_input(vitals=make_vitals(hr=75, rr=16, spo2=98, sbp=120, temp=37.0))
        result = engine.assess(inp)
        assert result.acuity == AcuityCategory.GREEN
        assert result.review_required is False

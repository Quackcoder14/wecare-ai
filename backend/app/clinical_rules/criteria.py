"""
WeCare.AI Clinical Rules - Criterion Definitions

Each criterion is a small, testable unit with:
- Stable criterion ID
- Source reference (WHO IITT document/page)
- Required inputs
- Matching logic
- Assigned acuity
- Human-readable reason text

Based on WHO Interagency Integrated Triage Tool (IITT) for ages 12+.
Official source: https://www.who.int/tools/triage
"""
from typing import List, Callable, Optional
from dataclasses import dataclass

from app.clinical_rules.schemas import (
    TriageInput,
    CriterionId,
    MatchedCriterion,
    AcuityCategory,
    FindingState,
    ClinicalFindings,
    VitalSigns,
)


@dataclass(frozen=True)
class Criterion:
    """Immutable criterion definition."""
    criterion_id: CriterionId
    label: str
    reason: str
    acuity: AcuityCategory
    source_reference: str
    check_fn: Callable[[TriageInput], bool]
    missing_inputs: Callable[[TriageInput], List[str]]


# --- Helper Functions ---

def finding_present(findings: ClinicalFindings, attr: str) -> bool:
    """Check if a finding is explicitly present."""
    return getattr(findings, attr) == FindingState.PRESENT


def finding_absent(findings: ClinicalFindings, attr: str) -> bool:
    """Check if a finding is explicitly absent."""
    return getattr(findings, attr) == FindingState.ABSENT


def finding_unknown(findings: ClinicalFindings, attr: str) -> bool:
    """Check if a finding is unknown."""
    return getattr(findings, attr) == FindingState.UNKNOWN


def vital_measured(vitals: VitalSigns, name: str) -> bool:
    """Check if a vital sign was explicitly measured."""
    return vitals.get_measured(name)


def vital_value(vitals: VitalSigns, name: str) -> Optional[float]:
    """Get vital sign value if measured."""
    if not vital_measured(vitals, name):
        return None
    return getattr(vitals, name)


# --- RED Criteria (Immediate) ---

def check_airway_obstruction(input_data: TriageInput) -> bool:
    """RED: Airway obstruction."""
    return finding_present(input_data.clinical_findings, "airway_obstruction")


def check_severe_respiratory_distress(input_data: TriageInput) -> bool:
    """RED: Severe respiratory distress."""
    return finding_present(input_data.clinical_findings, "severe_respiratory_distress")


def check_central_cyanosis(input_data: TriageInput) -> bool:
    """RED: Central cyanosis."""
    return finding_present(input_data.clinical_findings, "central_cyanosis")


def check_unable_to_speak(input_data: TriageInput) -> bool:
    """RED: Unable to speak full sentences."""
    return finding_present(input_data.clinical_findings, "unable_to_speak_full_sentences")


def check_shock(input_data: TriageInput) -> bool:
    """RED: Shock (clinical signs)."""
    return finding_present(input_data.clinical_findings, "shock")


def check_capillary_refill_gt_3s(input_data: TriageInput) -> bool:
    """RED: Capillary refill > 3 seconds."""
    return finding_present(input_data.clinical_findings, "capillary_refill_gt_3s")


def check_weak_pulses(input_data: TriageInput) -> bool:
    """RED: Weak peripheral pulses."""
    return finding_present(input_data.clinical_findings, "weak_peripheral_pulses")


def check_cold_extremities(input_data: TriageInput) -> bool:
    """RED: Cold extremities."""
    return finding_present(input_data.clinical_findings, "cold_extremities")


def check_altered_mental_status(input_data: TriageInput) -> bool:
    """RED: Altered mental status."""
    return finding_present(input_data.clinical_findings, "altered_mental_status")


def check_unconscious(input_data: TriageInput) -> bool:
    """RED: Unconscious."""
    return finding_present(input_data.clinical_findings, "unconscious")


def check_seizure(input_data: TriageInput) -> bool:
    """RED: Active seizure activity."""
    return finding_present(input_data.clinical_findings, "seizure_activity")


def check_major_trauma(input_data: TriageInput) -> bool:
    """RED: Major trauma."""
    return finding_present(input_data.clinical_findings, "major_trauma")


def check_uncontrolled_bleeding(input_data: TriageInput) -> bool:
    """RED: Uncontrolled bleeding."""
    return finding_present(input_data.clinical_findings, "uncontrolled_bleeding")


def check_suspected_spinal(input_data: TriageInput) -> bool:
    """RED: Suspected spinal injury."""
    return finding_present(input_data.clinical_findings, "suspected_spinal_injury")


def check_major_burns(input_data: TriageInput) -> bool:
    """RED: Major burns (>20% BSA or critical areas)."""
    return finding_present(input_data.clinical_findings, "major_burns")


def check_chest_pain_cardiac(input_data: TriageInput) -> bool:
    """RED: Chest pain suggestive of cardiac origin."""
    return finding_present(input_data.clinical_findings, "chest_pain_cardiac")


def check_acs_suspected(input_data: TriageInput) -> bool:
    """RED: Acute coronary syndrome suspected."""
    return finding_present(input_data.clinical_findings, "acute_coronary_syndrome_suspected")


def check_acute_abdomen(input_data: TriageInput) -> bool:
    """RED: Acute abdomen."""
    return finding_present(input_data.clinical_findings, "acute_abdomen")


def check_toxic_appearance(input_data: TriageInput) -> bool:
    """RED: High fever with toxic appearance."""
    return finding_present(input_data.clinical_findings, "high_fever_with_toxic_appearance")


def check_severe_pain(input_data: TriageInput) -> bool:
    """RED: Severe pain (e.g., 8-10/10)."""
    return finding_present(input_data.clinical_findings, "severe_pain")


def check_poisoning(input_data: TriageInput) -> bool:
    """RED: Known or suspected poisoning."""
    return finding_present(input_data.clinical_findings, "poisoning_known_or_suspected")


# --- RED Vital Sign Criteria ---

def check_hr_gt_130(input_data: TriageInput) -> bool:
    """RED: Heart rate > 130 bpm."""
    hr = vital_value(input_data.vital_signs, "heart_rate_bpm")
    return hr is not None and hr > 130


def check_hr_lt_50(input_data: TriageInput) -> bool:
    """RED: Heart rate < 50 bpm."""
    hr = vital_value(input_data.vital_signs, "heart_rate_bpm")
    return hr is not None and hr < 50


def check_rr_gt_30(input_data: TriageInput) -> bool:
    """RED: Respiratory rate > 30/min."""
    rr = vital_value(input_data.vital_signs, "respiratory_rate_per_min")
    return rr is not None and rr > 30


def check_rr_lt_10(input_data: TriageInput) -> bool:
    """RED: Respiratory rate < 10/min."""
    rr = vital_value(input_data.vital_signs, "respiratory_rate_per_min")
    return rr is not None and rr < 10


def check_spo2_lt_92(input_data: TriageInput) -> bool:
    """RED: SpO2 < 92%."""
    spo2 = vital_value(input_data.vital_signs, "spo2_percent")
    return spo2 is not None and spo2 < 92


def check_sbp_lt_90(input_data: TriageInput) -> bool:
    """RED: Systolic BP < 90 mmHg."""
    sbp = vital_value(input_data.vital_signs, "systolic_bp_mmhg")
    return sbp is not None and sbp < 90


def check_temp_gt_39(input_data: TriageInput) -> bool:
    """RED: Temperature > 39°C."""
    temp = vital_value(input_data.vital_signs, "temperature_c")
    return temp is not None and temp > 39.0


def check_temp_lt_35(input_data: TriageInput) -> bool:
    """RED: Temperature < 35°C."""
    temp = vital_value(input_data.vital_signs, "temperature_c")
    return temp is not None and temp < 35.0


# --- YELLOW Criteria (Urgent) ---

def check_moderate_respiratory_distress(input_data: TriageInput) -> bool:
    """YELLOW: Moderate respiratory distress."""
    return finding_present(input_data.clinical_findings, "severe_respiratory_distress") is False and \
           finding_present(input_data.clinical_findings, "unable_to_speak_full_sentences") is False and \
           finding_present(input_data.clinical_findings, "central_cyanosis") is False and \
           finding_present(input_data.clinical_findings, "airway_obstruction") is False


def check_moderate_dehydration(input_data: TriageInput) -> bool:
    """YELLOW: Moderate dehydration (clinical assessment)."""
    # This would be a clinical judgment - we track as a finding
    return False  # Placeholder - requires clinical assessment


def check_persistent_vomiting(input_data: TriageInput) -> bool:
    """YELLOW: Persistent vomiting."""
    return False  # Placeholder


def check_high_fever(input_data: TriageInput) -> bool:
    """YELLOW: High fever without toxic appearance."""
    temp = vital_value(input_data.vital_signs, "temperature_c")
    if temp is not None and temp >= 38.0:
        # Check not already RED for toxic appearance
        return not finding_present(input_data.clinical_findings, "high_fever_with_toxic_appearance")
    return False


def check_head_injury(input_data: TriageInput) -> bool:
    """YELLOW: Head injury without RED criteria."""
    return False  # Placeholder


def check_moderate_trauma(input_data: TriageInput) -> bool:
    """YELLOW: Moderate trauma."""
    return False  # Placeholder


def check_pregnancy_complications(input_data: TriageInput) -> bool:
    """YELLOW: Pregnancy-related complications."""
    return False  # Placeholder


def check_psychiatric_emergency(input_data: TriageInput) -> bool:
    """YELLOW: Psychiatric emergency."""
    return False  # Placeholder


# --- YELLOW Vital Sign Criteria ---

def check_hr_110_130(input_data: TriageInput) -> bool:
    """YELLOW: Heart rate 110-130 bpm."""
    hr = vital_value(input_data.vital_signs, "heart_rate_bpm")
    return hr is not None and 110 <= hr <= 130


def check_hr_50_60(input_data: TriageInput) -> bool:
    """YELLOW: Heart rate 50-60 bpm."""
    hr = vital_value(input_data.vital_signs, "heart_rate_bpm")
    return hr is not None and 50 <= hr <= 60


def check_rr_25_30(input_data: TriageInput) -> bool:
    """YELLOW: Respiratory rate 25-30/min."""
    rr = vital_value(input_data.vital_signs, "respiratory_rate_per_min")
    return rr is not None and 25 <= rr <= 30


def check_rr_10_12(input_data: TriageInput) -> bool:
    """YELLOW: Respiratory rate 10-12/min."""
    rr = vital_value(input_data.vital_signs, "respiratory_rate_per_min")
    return rr is not None and 10 <= rr <= 12


def check_spo2_92_94(input_data: TriageInput) -> bool:
    """YELLOW: SpO2 92-94%."""
    spo2 = vital_value(input_data.vital_signs, "spo2_percent")
    return spo2 is not None and 92 <= spo2 <= 94


def check_sbp_90_100(input_data: TriageInput) -> bool:
    """YELLOW: Systolic BP 90-100 mmHg."""
    sbp = vital_value(input_data.vital_signs, "systolic_bp_mmhg")
    return sbp is not None and 90 <= sbp <= 100


def check_temp_38_39(input_data: TriageInput) -> bool:
    """YELLOW: Temperature 38-39°C."""
    temp = vital_value(input_data.vital_signs, "temperature_c")
    return temp is not None and 38.0 <= temp <= 39.0


def check_temp_35_36(input_data: TriageInput) -> bool:
    """YELLOW: Temperature 35-36°C."""
    temp = vital_value(input_data.vital_signs, "temperature_c")
    return temp is not None and 35.0 <= temp <= 36.0


# --- Missing Input Detection ---

def missing_red_findings(input_data: TriageInput) -> List[str]:
    """Identify missing RED-level clinical findings."""
    findings = input_data.clinical_findings
    missing = []

    red_findings = [
        ("airway_obstruction", "Airway obstruction"),
        ("severe_respiratory_distress", "Severe respiratory distress"),
        ("central_cyanosis", "Central cyanosis"),
        ("unable_to_speak_full_sentences", "Ability to speak full sentences"),
        ("shock", "Signs of shock"),
        ("capillary_refill_gt_3s", "Capillary refill time"),
        ("weak_peripheral_pulses", "Peripheral pulse quality"),
        ("cold_extremities", "Extremity temperature"),
        ("altered_mental_status", "Mental status"),
        ("unconscious", "Consciousness level"),
        ("seizure_activity", "Seizure activity"),
        ("major_trauma", "Major trauma"),
        ("uncontrolled_bleeding", "Uncontrolled bleeding"),
        ("suspected_spinal_injury", "Spinal injury assessment"),
        ("major_burns", "Burn severity assessment"),
        ("chest_pain_cardiac", "Chest pain cardiac nature"),
        ("acute_coronary_syndrome_suspected", "ACS suspicion"),
        ("acute_abdomen", "Acute abdomen assessment"),
        ("high_fever_with_toxic_appearance", "Toxic appearance with fever"),
        ("severe_pain", "Pain severity"),
        ("poisoning_known_or_suspected", "Poisoning assessment"),
    ]

    for attr, label in red_findings:
        if finding_unknown(findings, attr):
            missing.append(f"{label}: unknown")

    return missing


def missing_red_vitals(input_data: TriageInput) -> List[str]:
    """Identify missing RED-level vital signs."""
    vitals = input_data.vital_signs
    missing = []

    red_vitals = [
        ("heart_rate_bpm", "Heart rate"),
        ("respiratory_rate_per_min", "Respiratory rate"),
        ("spo2_percent", "SpO2"),
        ("systolic_bp_mmhg", "Systolic BP"),
        ("temperature_c", "Temperature"),
    ]

    for attr, label in red_vitals:
        if not vital_measured(vitals, attr):
            missing.append(f"{label}: not measured")

    return missing


def missing_yellow_vitals(input_data: TriageInput) -> List[str]:
    """Identify missing YELLOW-level vital signs (same as red but tracked separately)."""
    return missing_red_vitals(input_data)


# --- Criterion Registry ---

RED_CRITERIA: List[Criterion] = [
    Criterion(
        criterion_id=CriterionId.AIRWAY_OBSTRUCTION,
        label="Airway obstruction",
        reason="Airway obstruction requiring immediate intervention",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Airway section",
        check_fn=check_airway_obstruction,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.SEVERE_RESPIRATORY_DISTRESS,
        label="Severe respiratory distress",
        reason="Severe respiratory distress with increased work of breathing",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Breathing section",
        check_fn=check_severe_respiratory_distress,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.CENTRAL_CYANOSIS,
        label="Central cyanosis",
        reason="Central cyanosis indicating severe hypoxia",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Breathing section",
        check_fn=check_central_cyanosis,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.UNABLE_TO_SPEAK,
        label="Unable to speak full sentences",
        reason="Unable to speak full sentences due to respiratory distress",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Breathing section",
        check_fn=check_unable_to_speak,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.SHOCK,
        label="Clinical shock",
        reason="Clinical signs of shock (hypoperfusion)",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Circulation section",
        check_fn=check_shock,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.CAPILLARY_REFILL_GT_3S,
        label="Capillary refill > 3 seconds",
        reason="Delayed capillary refill > 3 seconds indicating poor perfusion",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Circulation section",
        check_fn=check_capillary_refill_gt_3s,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.WEAK_PULSES,
        label="Weak peripheral pulses",
        reason="Weak or absent peripheral pulses",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Circulation section",
        check_fn=check_weak_pulses,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.COLD_EXTREMITIES,
        label="Cold extremities",
        reason="Cold extremities indicating poor peripheral perfusion",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Circulation section",
        check_fn=check_cold_extremities,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.ALTERED_MENTAL_STATUS,
        label="Altered mental status",
        reason="Altered mental status (confusion, lethargy, agitation)",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Disability section",
        check_fn=check_altered_mental_status,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.UNCONSCIOUS,
        label="Unconscious",
        reason="Unresponsive or unconscious patient",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Disability section",
        check_fn=check_unconscious,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.SEIZURE,
        label="Active seizure",
        reason="Active seizure activity",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Disability section",
        check_fn=check_seizure,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.MAJOR_TRAUMA,
        label="Major trauma",
        reason="Major trauma with potential life-threatening injuries",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Trauma section",
        check_fn=check_major_trauma,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.UNCONTROLLED_BLEEDING,
        label="Uncontrolled bleeding",
        reason="Uncontrolled external bleeding",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Trauma section",
        check_fn=check_uncontrolled_bleeding,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.SUSPECTED_SPINAL,
        label="Suspected spinal injury",
        reason="Suspected spinal cord injury with neurological deficit",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Trauma section",
        check_fn=check_suspected_spinal,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.MAJOR_BURNS,
        label="Major burns",
        reason="Major burns (>20% BSA or involving airway/face/hands/genitals)",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Trauma section",
        check_fn=check_major_burns,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.CHEST_PAIN_CARDIAC,
        label="Chest pain - cardiac",
        reason="Chest pain suggestive of cardiac origin",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Specific conditions",
        check_fn=check_chest_pain_cardiac,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.ACS_SUSPECTED,
        label="Acute coronary syndrome suspected",
        reason="Clinical suspicion of acute coronary syndrome",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Specific conditions",
        check_fn=check_acs_suspected,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.ACUTE_ABDOMEN,
        label="Acute abdomen",
        reason="Acute abdomen requiring surgical evaluation",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Specific conditions",
        check_fn=check_acute_abdomen,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.TOXIC_APPEARANCE,
        label="Toxic appearance with fever",
        reason="High fever with toxic appearance (sepsis suspicion)",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Specific conditions",
        check_fn=check_toxic_appearance,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.SEVERE_PAIN,
        label="Severe pain",
        reason="Severe pain (8-10/10) requiring urgent analgesia",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Specific conditions",
        check_fn=check_severe_pain,
        missing_inputs=lambda i: [],
    ),
    Criterion(
        criterion_id=CriterionId.POISONING,
        label="Poisoning",
        reason="Known or suspected poisoning/toxic ingestion",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT Routine Triage (Age 12+), Specific conditions",
        check_fn=check_poisoning,
        missing_inputs=lambda i: [],
    ),
    # RED Vital Signs
    Criterion(
        criterion_id=CriterionId.HR_GT_130,
        label="Heart rate > 130 bpm",
        reason="Heart rate > 130 beats per minute",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_hr_gt_130,
        missing_inputs=lambda i: ["Heart rate"] if not vital_measured(i.vital_signs, "heart_rate_bpm") else [],
    ),
    Criterion(
        criterion_id=CriterionId.HR_LT_50,
        label="Heart rate < 50 bpm",
        reason="Heart rate < 50 beats per minute",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_hr_lt_50,
        missing_inputs=lambda i: ["Heart rate"] if not vital_measured(i.vital_signs, "heart_rate_bpm") else [],
    ),
    Criterion(
        criterion_id=CriterionId.RR_GT_30,
        label="Respiratory rate > 30/min",
        reason="Respiratory rate > 30 breaths per minute",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_rr_gt_30,
        missing_inputs=lambda i: ["Respiratory rate"] if not vital_measured(i.vital_signs, "respiratory_rate_per_min") else [],
    ),
    Criterion(
        criterion_id=CriterionId.RR_LT_10,
        label="Respiratory rate < 10/min",
        reason="Respiratory rate < 10 breaths per minute",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_rr_lt_10,
        missing_inputs=lambda i: ["Respiratory rate"] if not vital_measured(i.vital_signs, "respiratory_rate_per_min") else [],
    ),
    Criterion(
        criterion_id=CriterionId.SPO2_LT_92,
        label="SpO2 < 92%",
        reason="Oxygen saturation < 92% on room air",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_spo2_lt_92,
        missing_inputs=lambda i: ["SpO2"] if not vital_measured(i.vital_signs, "spo2_percent") else [],
    ),
    Criterion(
        criterion_id=CriterionId.SBP_LT_90,
        label="Systolic BP < 90 mmHg",
        reason="Systolic blood pressure < 90 mmHg",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_sbp_lt_90,
        missing_inputs=lambda i: ["Systolic BP"] if not vital_measured(i.vital_signs, "systolic_bp_mmhg") else [],
    ),
    Criterion(
        criterion_id=CriterionId.TEMP_GT_39,
        label="Temperature > 39°C",
        reason="Temperature > 39°C",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_temp_gt_39,
        missing_inputs=lambda i: ["Temperature"] if not vital_measured(i.vital_signs, "temperature_c") else [],
    ),
    Criterion(
        criterion_id=CriterionId.TEMP_LT_35,
        label="Temperature < 35°C",
        reason="Temperature < 35°C (hypothermia)",
        acuity=AcuityCategory.RED,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_temp_lt_35,
        missing_inputs=lambda i: ["Temperature"] if not vital_measured(i.vital_signs, "temperature_c") else [],
    ),
]


YELLOW_CRITERIA: List[Criterion] = [
    Criterion(
        criterion_id=CriterionId.HR_110_130,
        label="Heart rate 110-130 bpm",
        reason="Heart rate 110-130 beats per minute",
        acuity=AcuityCategory.YELLOW,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_hr_110_130,
        missing_inputs=lambda i: ["Heart rate"] if not vital_measured(i.vital_signs, "heart_rate_bpm") else [],
    ),
    Criterion(
        criterion_id=CriterionId.HR_50_60,
        label="Heart rate 50-60 bpm",
        reason="Heart rate 50-60 beats per minute",
        acuity=AcuityCategory.YELLOW,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_hr_50_60,
        missing_inputs=lambda i: ["Heart rate"] if not vital_measured(i.vital_signs, "heart_rate_bpm") else [],
    ),
    Criterion(
        criterion_id=CriterionId.RR_25_30,
        label="Respiratory rate 25-30/min",
        reason="Respiratory rate 25-30 breaths per minute",
        acuity=AcuityCategory.YELLOW,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_rr_25_30,
        missing_inputs=lambda i: ["Respiratory rate"] if not vital_measured(i.vital_signs, "respiratory_rate_per_min") else [],
    ),
    Criterion(
        criterion_id=CriterionId.RR_10_12,
        label="Respiratory rate 10-12/min",
        reason="Respiratory rate 10-12 breaths per minute",
        acuity=AcuityCategory.YELLOW,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_rr_10_12,
        missing_inputs=lambda i: ["Respiratory rate"] if not vital_measured(i.vital_signs, "respiratory_rate_per_min") else [],
    ),
    Criterion(
        criterion_id=CriterionId.SPO2_92_94,
        label="SpO2 92-94%",
        reason="Oxygen saturation 92-94% on room air",
        acuity=AcuityCategory.YELLOW,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_spo2_92_94,
        missing_inputs=lambda i: ["SpO2"] if not vital_measured(i.vital_signs, "spo2_percent") else [],
    ),
    Criterion(
        criterion_id=CriterionId.SBP_90_100,
        label="Systolic BP 90-100 mmHg",
        reason="Systolic blood pressure 90-100 mmHg",
        acuity=AcuityCategory.YELLOW,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_sbp_90_100,
        missing_inputs=lambda i: ["Systolic BP"] if not vital_measured(i.vital_signs, "systolic_bp_mmhg") else [],
    ),
    Criterion(
        criterion_id=CriterionId.TEMP_38_39,
        label="Temperature 38-39°C",
        reason="Temperature 38-39°C",
        acuity=AcuityCategory.YELLOW,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_temp_38_39,
        missing_inputs=lambda i: ["Temperature"] if not vital_measured(i.vital_signs, "temperature_c") else [],
    ),
    Criterion(
        criterion_id=CriterionId.TEMP_35_36,
        label="Temperature 35-36°C",
        reason="Temperature 35-36°C (mild hypothermia)",
        acuity=AcuityCategory.YELLOW,
        source_reference="WHO IITT High-Risk Vital Signs Reference Card",
        check_fn=check_temp_35_36,
        missing_inputs=lambda i: ["Temperature"] if not vital_measured(i.vital_signs, "temperature_c") else [],
    ),
    Criterion(
        criterion_id=CriterionId.HIGH_FEVER,
        label="High fever without toxic appearance",
        reason="High fever without toxic appearance",
        acuity=AcuityCategory.YELLOW,
        source_reference="WHO IITT Routine Triage (Age 12+), Specific conditions",
        check_fn=check_high_fever,
        missing_inputs=lambda i: [],
    ),
]


GREEN_CRITERIA: List[Criterion] = [
    Criterion(
        criterion_id=CriterionId.MINOR_COMPLAINT,
        label="Minor complaint",
        reason="Minor complaint with normal vital signs and no high-risk features",
        acuity=AcuityCategory.GREEN,
        source_reference="WHO IITT Routine Triage (Age 12+), Green pathway",
        check_fn=lambda i: _has_minimal_clinical_info(i),
        missing_inputs=lambda i: [],
    ),
]


def _has_minimal_clinical_info(input_data: TriageInput) -> bool:
    """Check if there's at least minimal clinical information for a GREEN assessment."""
    # Check if any vital sign was measured
    vitals_measured = any(input_data.vital_signs.measured.values())
    # Check if any clinical finding is PRESENT
    findings_present = any(
        getattr(input_data.clinical_findings, attr) == FindingState.PRESENT
        for attr in input_data.clinical_findings.model_fields
        if not attr.startswith("_")
    )
    # Check if any symptoms were provided (via findings mapping)
    return vitals_measured or findings_present


# All criteria ordered by acuity priority (RED first, then YELLOW, then GREEN)
ALL_CRITERIA = RED_CRITERIA + YELLOW_CRITERIA + GREEN_CRITERIA

# Criteria by acuity for easy access
CRITERIA_BY_ACUITY = {
    AcuityCategory.RED: RED_CRITERIA,
    AcuityCategory.YELLOW: YELLOW_CRITERIA,
    AcuityCategory.GREEN: GREEN_CRITERIA,
}
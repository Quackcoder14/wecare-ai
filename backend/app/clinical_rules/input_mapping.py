"""
WeCare.AI Clinical Rules - Input Mapping

Functions to convert various input formats to the structured TriageInput
required by the rules engine.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.clinical_rules.schemas import (
    TriageInput,
    ClinicalFindings,
    VitalSigns,
    FindingState,
)
from app.config import settings


def create_triage_input_from_patient(
    patient_data: Dict[str, Any],
    rules_version: Optional[str] = None
) -> TriageInput:
    """
    Create TriageInput from patient database record.

    This is the primary mapping function used by the assessment service.
    """
    version = rules_version or settings.rules_version

    # Parse vital signs with measured tracking
    vitals_data = patient_data.get("vitals") or {}
    vital_signs = VitalSigns()

    vital_fields = [
        "heart_rate_bpm",
        "respiratory_rate_per_min",
        "spo2_percent",
        "systolic_bp_mmhg",
        "temperature_c",
    ]

    for field in vital_fields:
        value = vitals_data.get(field)
        if value is not None:
            try:
                setattr(vital_signs, field, value)
                vital_signs.set_measured(field, True)
            except (ValueError, TypeError):
                # Invalid value - leave as unmeasured
                pass

    # Build clinical findings
    clinical_findings = ClinicalFindings()

    # Map symptoms to findings using keyword matching
    # This is a simplified mapping - production would use structured clinical input
    symptoms = patient_data.get("symptoms", [])
    symptom_text = " ".join(symptoms).lower() if symptoms else ""

    # Also include transcript if available
    transcript = patient_data.get("transcript", "")
    if transcript:
        symptom_text += " " + transcript.lower()

    # Symptom keyword mapping
    symptom_mapping = {
        "airway_obstruction": [
            "airway obstruction", "choking", "stridor", "blocked airway",
            "airway blocked", "cannot breathe", "obstruction"
        ],
        "severe_respiratory_distress": [
            "severe respiratory distress", "severe shortness of breath",
            "shortness of breath", "difficulty breathing", "breathing difficulty",
            "gasping", "cannot breathe", "respiratory failure",
            "severe dyspnea", "work of breathing"
        ],
        "central_cyanosis": [
            "cyanosis", "blue lips", "blue face", "central cyanosis",
            "bluish discoloration"
        ],
        "unable_to_speak_full_sentences": [
            "cannot speak", "unable to speak", "speech difficulty",
            "can't talk", "unable to talk"
        ],
        "shock": [
            "shock", "hypotension", "perfusion", "circulatory collapse"
        ],
        "capillary_refill_gt_3s": [
            "capillary refill", "delayed capillary", "slow capillary"
        ],
        "weak_peripheral_pulses": [
            "weak pulse", "absent pulse", "thready pulse", "feeble pulse"
        ],
        "cold_extremities": [
            "cold extremities", "cold hands", "cold feet", "cold limbs"
        ],
        "altered_mental_status": [
            "confusion", "altered mental", "lethargy", "agitated",
            "disoriented", "altered consciousness", "confused"
        ],
        "unconscious": [
            "unconscious", "unresponsive", "coma", "not responding"
        ],
        "seizure_activity": [
            "seizure", "convulsion", "fitting", "convulsing"
        ],
        "major_trauma": [
            "major trauma", "severe trauma", "multiple injuries",
            "polytrauma", "crush injury"
        ],
        "uncontrolled_bleeding": [
            "uncontrolled bleeding", "severe bleeding", "hemorrhage",
            "profuse bleeding", "won't stop bleeding"
        ],
        "suspected_spinal_injury": [
            "spinal injury", "neck injury", "back injury", "paralysis",
            "spinal cord", "neck pain", "back pain with neuro"
        ],
        "major_burns": [
            "major burns", "severe burns", "burns", "thermal injury"
        ],
        "chest_pain_cardiac": [
            "chest pain", "chest tightness", "angina", "heart pain",
            "chest pressure", "chest discomfort"
        ],
        "acute_coronary_syndrome_suspected": [
            "heart attack", "myocardial infarction", "acs", "cardiac event"
        ],
        "acute_abdomen": [
            "acute abdomen", "severe abdominal pain", "rigid abdomen",
            "guarding", "rebound tenderness", "surgical abdomen"
        ],
        "high_fever_with_toxic_appearance": [
            "toxic appearance", "septic", "sepsis", "toxic", "very ill"
        ],
        "severe_pain": [
            "severe pain", "10/10 pain", "excruciating", "worst pain",
            "unbearable pain"
        ],
        "poisoning_known_or_suspected": [
            "poisoning", "overdose", "ingestion", "toxic ingestion",
            "poison", "drug overdose"
        ],
    }

    # Apply symptom mapping
    for finding_attr, keywords in symptom_mapping.items():
        if any(keyword in symptom_text for keyword in keywords):
            setattr(clinical_findings, finding_attr, FindingState.PRESENT)
        else:
            # Explicitly set to UNKNOWN (default) - don't assume absent
            setattr(clinical_findings, finding_attr, FindingState.UNKNOWN)

    # Map vital signs to high-risk finding states
    _map_vital_signs_to_findings(vital_signs, clinical_findings)

    # Build patient ID
    patient_id = patient_data.get("patient_id") or patient_data.get("id")
    if not patient_id:
        # Generate a temporary ID if not present
        from uuid import uuid4
        patient_id = str(uuid4())

    return TriageInput(
        patient_id=patient_id,
        age=patient_data.get("age", 0),
        vital_signs=vital_signs,
        clinical_findings=clinical_findings,
        rules_version=version,
        assessed_at=datetime.utcnow(),
    )


def _map_vital_signs_to_findings(
    vitals: VitalSigns,
    findings: ClinicalFindings
) -> None:
    """Map measured vital signs to corresponding high-risk findings."""
    # Heart rate
    hr = vitals.heart_rate_bpm if vitals.get_measured("heart_rate_bpm") else None
    if hr is not None:
        if hr > 130:
            findings.hr_gt_130 = FindingState.PRESENT
        elif hr < 50:
            findings.hr_lt_50 = FindingState.PRESENT

    # Respiratory rate
    rr = vitals.respiratory_rate_per_min if vitals.get_measured("respiratory_rate_per_min") else None
    if rr is not None:
        if rr > 30:
            findings.rr_gt_30 = FindingState.PRESENT
        elif rr < 10:
            findings.rr_lt_10 = FindingState.PRESENT

    # SpO2
    spo2 = vitals.spo2_percent if vitals.get_measured("spo2_percent") else None
    if spo2 is not None:
        if spo2 < 92:
            findings.spo2_lt_92 = FindingState.PRESENT

    # Systolic BP
    sbp = vitals.systolic_bp_mmhg if vitals.get_measured("systolic_bp_mmhg") else None
    if sbp is not None:
        if sbp < 90:
            findings.sbp_lt_90 = FindingState.PRESENT

    # Temperature
    temp = vitals.temperature_c if vitals.get_measured("temperature_c") else None
    if temp is not None:
        if temp > 39.0:
            findings.temp_gt_39 = FindingState.PRESENT
        elif temp < 35.0:
            findings.temp_lt_35 = FindingState.PRESENT


def create_triage_input_from_structured(
    patient_id: str,
    age: int,
    vital_signs_dict: Dict[str, Any],
    findings_dict: Dict[str, str],  # finding_name -> "present"|"absent"|"unknown"
    rules_version: Optional[str] = None
) -> TriageInput:
    """
    Create TriageInput from structured clinical input.

    This is for future use when the frontend sends structured findings directly.
    """
    version = rules_version or settings.rules_version

    # Build vital signs
    vital_signs = VitalSigns()
    vital_fields = [
        "heart_rate_bpm",
        "respiratory_rate_per_min",
        "spo2_percent",
        "systolic_bp_mmhg",
        "temperature_c",
    ]
    for field in vital_fields:
        value = vital_signs_dict.get(field)
        if value is not None:
            try:
                setattr(vital_signs, field, value)
                vital_signs.set_measured(field, True)
            except (ValueError, TypeError):
                pass

    # Build clinical findings from structured input
    clinical_findings = ClinicalFindings()
    finding_mapping = {
        "airway_obstruction": "airway_obstruction",
        "severe_respiratory_distress": "severe_respiratory_distress",
        "central_cyanosis": "central_cyanosis",
        "unable_to_speak_full_sentences": "unable_to_speak_full_sentences",
        "shock": "shock",
        "capillary_refill_gt_3s": "capillary_refill_gt_3s",
        "weak_peripheral_pulses": "weak_peripheral_pulses",
        "cold_extremities": "cold_extremities",
        "altered_mental_status": "altered_mental_status",
        "unconscious": "unconscious",
        "seizure_activity": "seizure_activity",
        "major_trauma": "major_trauma",
        "uncontrolled_bleeding": "uncontrolled_bleeding",
        "suspected_spinal_injury": "suspected_spinal_injury",
        "major_burns": "major_burns",
        "chest_pain_cardiac": "chest_pain_cardiac",
        "acute_coronary_syndrome_suspected": "acute_coronary_syndrome_suspected",
        "acute_abdomen": "acute_abdomen",
        "high_fever_with_toxic_appearance": "high_fever_with_toxic_appearance",
        "severe_pain": "severe_pain",
        "poisoning_known_or_suspected": "poisoning_known_or_suspected",
    }

    for finding_attr, input_key in finding_mapping.items():
        value = findings_dict.get(input_key, "unknown").lower()
        if value == "present":
            setattr(clinical_findings, finding_attr, FindingState.PRESENT)
        elif value == "absent":
            setattr(clinical_findings, finding_attr, FindingState.ABSENT)
        else:
            setattr(clinical_findings, finding_attr, FindingState.UNKNOWN)

    # Map vital signs to findings
    _map_vital_signs_to_findings(vital_signs, clinical_findings)

    return TriageInput(
        patient_id=patient_id,
        age=age,
        vital_signs=vital_signs,
        clinical_findings=clinical_findings,
        rules_version=version,
        assessed_at=datetime.utcnow(),
    )


def extract_input_snapshot(triage_input: TriageInput) -> Dict[str, Any]:
    """Extract a serializable snapshot of the input for storage."""
    return {
        "age": triage_input.age,
        "vital_signs": {
            "heart_rate_bpm": triage_input.vital_signs.heart_rate_bpm,
            "respiratory_rate_per_min": triage_input.vital_signs.respiratory_rate_per_min,
            "spo2_percent": triage_input.vital_signs.spo2_percent,
            "systolic_bp_mmhg": triage_input.vital_signs.systolic_bp_mmhg,
            "temperature_c": triage_input.vital_signs.temperature_c,
            "measured": triage_input.vital_signs.measured,
        },
        "clinical_findings": {
            k: v.value for k, v in triage_input.clinical_findings.model_dump().items()
            if not k.startswith("_")
        },
        "rules_version": triage_input.rules_version,
    }
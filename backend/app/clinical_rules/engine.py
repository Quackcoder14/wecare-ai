"""
WeCare.AI Clinical Rules Engine

Deterministic triage assessment engine implementing WHO IITT criteria.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import uuid4

from app.config import settings
from app.clinical_rules.schemas import (
    TriageInput,
    ClinicalAssessmentResult,
    ClinicalFindings,
    VitalSigns,
    FindingState,
    AcuityCategory,
    AssessmentStatus,
    CriterionId,
    MatchedCriterion,
)
from app.clinical_rules.criteria import (
    ALL_CRITERIA,
    RED_CRITERIA,
    YELLOW_CRITERIA,
    CRITERIA_BY_ACUITY,
    missing_red_findings,
    missing_red_vitals,
    missing_yellow_vitals,
)


class ClinicalRulesEngine:
    """
    Deterministic clinical triage engine.

    Evaluates structured clinical inputs against WHO IITT criteria
    in priority order (RED → YELLOW → GREEN).
    """

    def __init__(self, rules_version: Optional[str] = None):
        self.rules_version = rules_version or settings.rules_version

    def assess(self, input_data: TriageInput) -> ClinicalAssessmentResult:
        """
        Perform triage assessment.

        Args:
            input_data: Structured clinical input with explicit finding states

        Returns:
            ClinicalAssessmentResult with acuity, reasons, matched criteria,
            missing information, and provenance metadata
        """
        # Validate age eligibility
        if input_data.age < settings.min_assessment_age:
            return ClinicalAssessmentResult(
                patient_id=input_data.patient_id,
                acuity=AcuityCategory.OUT_OF_SCOPE,
                assessment_status=AssessmentStatus.AGE_OUT_OF_SCOPE,
                review_required=True,
                reasons=[
                    f"Patient age {input_data.age} is below minimum assessment age "
                    f"of {settings.min_assessment_age} years"
                ],
                missing_information=[
                    "Pediatric triage pathway required - not implemented in this prototype"
                ],
                rules_version=self.rules_version,
                assessed_at=datetime.utcnow(),
            )

        # Evaluate criteria in priority order
        matched_criteria: List[CriterionId] = []
        matched_details: List[MatchedCriterion] = []
        reasons: List[str] = []

        # Check RED criteria first (highest priority)
        red_matched = self._evaluate_criteria(input_data, RED_CRITERIA)
        if red_matched:
            matched_criteria.extend([m.criterion_id for m in red_matched])
            matched_details.extend(red_matched)
            reasons.extend([m.reason for m in red_matched])

            return ClinicalAssessmentResult(
                patient_id=input_data.patient_id,
                acuity=AcuityCategory.RED,
                assessment_status=AssessmentStatus.COMPLETED,
                review_required=True,
                reasons=reasons,
                matched_criteria=matched_criteria,
                matched_criteria_details=matched_details,
                missing_information=self._collect_missing_info(input_data, AcuityCategory.RED),
                rules_version=self.rules_version,
                assessed_at=datetime.utcnow(),
            )

        # Check YELLOW criteria
        yellow_matched = self._evaluate_criteria(input_data, YELLOW_CRITERIA)
        if yellow_matched:
            matched_criteria.extend([m.criterion_id for m in yellow_matched])
            matched_details.extend(yellow_matched)
            reasons.extend([m.reason for m in yellow_matched])

            return ClinicalAssessmentResult(
                patient_id=input_data.patient_id,
                acuity=AcuityCategory.YELLOW,
                assessment_status=AssessmentStatus.COMPLETED,
                review_required=True,
                reasons=reasons,
                matched_criteria=matched_criteria,
                matched_criteria_details=matched_details,
                missing_information=self._collect_missing_info(input_data, AcuityCategory.YELLOW),
                rules_version=self.rules_version,
                assessed_at=datetime.utcnow(),
            )

        # Check GREEN criteria (default if no higher acuity matched)
        green_matched = self._evaluate_criteria(input_data, CRITERIA_BY_ACUITY[AcuityCategory.GREEN])
        if green_matched:
            matched_criteria.extend([m.criterion_id for m in green_matched])
            matched_details.extend(green_matched)
            reasons.extend([m.reason for m in green_matched])

            return ClinicalAssessmentResult(
                patient_id=input_data.patient_id,
                acuity=AcuityCategory.GREEN,
                assessment_status=AssessmentStatus.COMPLETED,
                review_required=False,
                reasons=reasons,
                matched_criteria=matched_criteria,
                matched_criteria_details=matched_details,
                missing_information=self._collect_missing_info(input_data, AcuityCategory.GREEN),
                rules_version=self.rules_version,
                assessed_at=datetime.utcnow(),
            )

        # No criteria matched - insufficient data
        return ClinicalAssessmentResult(
            patient_id=input_data.patient_id,
            acuity=AcuityCategory.UNASSESSED,
            assessment_status=AssessmentStatus.INSUFFICIENT_DATA,
            review_required=True,
            reasons=["No triage criteria matched with available information"],
            matched_criteria=[],
            matched_criteria_details=[],
            missing_information=self._collect_all_missing_info(input_data),
            rules_version=self.rules_version,
            assessed_at=datetime.utcnow(),
        )

    def _evaluate_criteria(
        self,
        input_data: TriageInput,
        criteria: List
    ) -> List[MatchedCriterion]:
        """Evaluate a list of criteria and return matched ones."""
        matched = []
        for criterion in criteria:
            try:
                if criterion.check_fn(input_data):
                    matched.append(MatchedCriterion(
                        criterion_id=criterion.criterion_id,
                        label=criterion.label,
                        reason=criterion.reason,
                        acuity=criterion.acuity,
                        source_reference=criterion.source_reference,
                    ))
            except Exception:
                # Log error but continue evaluation
                continue
        return matched

    def _collect_missing_info(
        self,
        input_data: TriageInput,
        assigned_acuity: AcuityCategory
    ) -> List[str]:
        """Collect missing information relevant to the assigned acuity."""
        missing = []

        # Always include missing RED findings (critical for safety)
        missing.extend(missing_red_findings(input_data))

        # Include missing vital signs relevant to assigned acuity
        if assigned_acuity == AcuityCategory.RED:
            missing.extend(missing_red_vitals(input_data))
        elif assigned_acuity == AcuityCategory.YELLOW:
            missing.extend(missing_yellow_vitals(input_data))

        # Deduplicate while preserving order
        seen = set()
        unique_missing = []
        for item in missing:
            if item not in seen:
                seen.add(item)
                unique_missing.append(item)

        return unique_missing

    def _collect_all_missing_info(self, input_data: TriageInput) -> List[str]:
        """Collect all missing information for unassessed cases."""
        missing = []
        missing.extend(missing_red_findings(input_data))
        missing.extend(missing_red_vitals(input_data))
        missing.extend(missing_yellow_vitals(input_data))

        seen = set()
        unique_missing = []
        for item in missing:
            if item not in seen:
                seen.add(item)
                unique_missing.append(item)

        return unique_missing


# --- Input Mapping Functions ---

def map_patient_to_triage_input(
    patient_data: Dict[str, Any],
    rules_version: str
) -> TriageInput:
    """
    Map patient database record to TriageInput for the rules engine.

    Handles the conversion from stored data (symptoms list, vitals dict)
    to structured clinical findings with explicit states.
    """
    # Parse vital signs with measured tracking
    vitals_data = patient_data.get("vitals") or {}
    vital_signs = VitalSigns()
    for field in ["heart_rate_bpm", "respiratory_rate_per_min", "spo2_percent",
                  "systolic_bp_mmhg", "temperature_c"]:
        value = vitals_data.get(field)
        if value is not None:
            setattr(vital_signs, field, value)
            vital_signs.set_measured(field, True)

    # Build clinical findings from symptoms and other data
    clinical_findings = ClinicalFindings()

    # Map symptoms to findings (simplified - in practice would use NLP or structured input)
    symptoms = patient_data.get("symptoms", [])
    symptom_text = " ".join(symptoms).lower()

    # Keyword-based mapping (placeholder for structured input)
    # In production, this would come from structured clinical input forms
    symptom_mapping = {
        "airway_obstruction": ["airway obstruction", "choking", "stridor", "blocked airway"],
        "severe_respiratory_distress": ["severe respiratory distress", "severe shortness of breath", "gasping", "cannot breathe"],
        "central_cyanosis": ["cyanosis", "blue lips", "blue face", "central cyanosis"],
        "unable_to_speak_full_sentences": ["cannot speak", "unable to speak", "speech difficulty"],
        "shock": ["shock", "hypotension", "perfusion"],
        "capillary_refill_gt_3s": ["capillary refill", "delayed capillary"],
        "weak_peripheral_pulses": ["weak pulse", "absent pulse", "thready pulse"],
        "cold_extremities": ["cold extremities", "cold hands", "cold feet"],
        "altered_mental_status": ["confusion", "altered mental", "lethargy", "agitated", "disoriented"],
        "unconscious": ["unconscious", "unresponsive", "coma"],
        "seizure_activity": ["seizure", "convulsion", "fitting"],
        "major_trauma": ["major trauma", "severe trauma", "multiple injuries"],
        "uncontrolled_bleeding": ["uncontrolled bleeding", "severe bleeding", "hemorrhage"],
        "suspected_spinal_injury": ["spinal injury", "neck injury", "back injury", "paralysis"],
        "major_burns": ["major burns", "severe burns", "burns"],
        "chest_pain_cardiac": ["chest pain", "chest tightness", "angina"],
        "acute_coronary_syndrome_suspected": ["heart attack", "myocardial infarction", "acs"],
        "acute_abdomen": ["acute abdomen", "severe abdominal pain", "rigid abdomen"],
        "high_fever_with_toxic_appearance": ["toxic appearance", "septic", "sepsis"],
        "severe_pain": ["severe pain", "10/10 pain", "excruciating"],
        "poisoning_known_or_suspected": ["poisoning", "overdose", "ingestion", "toxic ingestion"],
    }

    for finding_attr, keywords in symptom_mapping.items():
        if any(keyword in symptom_text for keyword in keywords):
            setattr(clinical_findings, finding_attr, FindingState.PRESENT)
        else:
            # Default to UNKNOWN - don't assume absent
            setattr(clinical_findings, finding_attr, FindingState.UNKNOWN)

    # Map vital signs to high-risk finding states
    hr = vital_value(vital_signs, "heart_rate_bpm")
    if hr is not None:
        if hr > 130:
            clinical_findings.hr_gt_130 = FindingState.PRESENT
        elif hr < 50:
            clinical_findings.hr_lt_50 = FindingState.PRESENT
        elif 110 <= hr <= 130:
            # Yellow range - tracked in YELLOW criteria
            pass

    rr = vital_value(vital_signs, "respiratory_rate_per_min")
    if rr is not None:
        if rr > 30:
            clinical_findings.rr_gt_30 = FindingState.PRESENT
        elif rr < 10:
            clinical_findings.rr_lt_10 = FindingState.PRESENT
        elif 25 <= rr <= 30:
            pass

    spo2 = vital_value(vital_signs, "spo2_percent")
    if spo2 is not None:
        if spo2 < 92:
            clinical_findings.spo2_lt_92 = FindingState.PRESENT
        elif 92 <= spo2 <= 94:
            pass

    sbp = vital_value(vital_signs, "systolic_bp_mmhg")
    if sbp is not None:
        if sbp < 90:
            clinical_findings.sbp_lt_90 = FindingState.PRESENT
        elif 90 <= sbp <= 100:
            pass

    temp = vital_value(vital_signs, "temperature_c")
    if temp is not None:
        if temp > 39.0:
            clinical_findings.temp_gt_39 = FindingState.PRESENT
        elif temp < 35.0:
            clinical_findings.temp_lt_35 = FindingState.PRESENT
        elif 38.0 <= temp <= 39.0:
            pass
        elif 35.0 <= temp <= 36.0:
            pass

    return TriageInput(
        patient_id=patient_data.get("patient_id", str(uuid4())),
        age=patient_data.get("age", 0),
        vital_signs=vital_signs,
        clinical_findings=clinical_findings,
        rules_version=rules_version,
        assessed_at=datetime.utcnow(),
    )


def vital_value(vitals: VitalSigns, name: str) -> Optional[float]:
    """Safe getter for vital sign value."""
    if not vitals.get_measured(name):
        return None
    return getattr(vitals, name)


# Singleton engine instance
_engine: Optional[ClinicalRulesEngine] = None


def get_rules_engine() -> ClinicalRulesEngine:
    """Get or create the rules engine singleton."""
    global _engine
    if _engine is None:
        _engine = ClinicalRulesEngine()
    return _engine
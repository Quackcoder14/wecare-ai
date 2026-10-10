"""
WeCare.AI Clinical Ruleset Metadata

Version and coverage information for the implemented ruleset.
"""
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime

from app.clinical_rules.schemas import CriterionId, AcuityCategory


@dataclass(frozen=True)
class CriterionMetadata:
    """Metadata for a single criterion."""
    criterion_id: CriterionId
    label: str
    acuity: AcuityCategory
    source_document: str
    source_section: str
    source_page: Optional[str] = None
    implemented: bool = True
    tested: bool = False
    notes: str = ""


# Ruleset version info
RULESET_VERSION = "WHO-IITT-12PLUS-LOCAL-v1"
RULESET_NAME = "WeCare.AI Local Implementation of WHO IITT Routine Triage (Age 12+)"
SOURCE_DOCUMENT = "WHO Interagency Integrated Triage Tool (IITT)"
SOURCE_URL = "https://www.who.int/tools/triage"
SOURCE_VERSION_DATE = "2023"  # WHO IITT version - verify from actual document
IMPLEMENTATION_DATE = "2026-10-09"
IMPLEMENTER = "WeCare.AI Hackathon Team"

# Minimum age for this ruleset
MIN_AGE = 12

# Criteria metadata registry
CRITERIA_METADATA: Dict[CriterionId, CriterionMetadata] = {
    # RED - Airway/Breathing
    CriterionId.AIRWAY_OBSTRUCTION: CriterionMetadata(
        criterion_id=CriterionId.AIRWAY_OBSTRUCTION,
        label="Airway obstruction",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Airway assessment",
        source_page="Page 1-2",
    ),
    CriterionId.SEVERE_RESPIRATORY_DISTRESS: CriterionMetadata(
        criterion_id=CriterionId.SEVERE_RESPIRATORY_DISTRESS,
        label="Severe respiratory distress",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Breathing assessment",
        source_page="Page 2",
    ),
    CriterionId.CENTRAL_CYANOSIS: CriterionMetadata(
        criterion_id=CriterionId.CENTRAL_CYANOSIS,
        label="Central cyanosis",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Breathing assessment",
        source_page="Page 2",
    ),
    CriterionId.UNABLE_TO_SPEAK: CriterionMetadata(
        criterion_id=CriterionId.UNABLE_TO_SPEAK,
        label="Unable to speak full sentences",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Breathing assessment",
        source_page="Page 2",
    ),
    # RED - Circulation
    CriterionId.SHOCK: CriterionMetadata(
        criterion_id=CriterionId.SHOCK,
        label="Clinical shock",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Circulation assessment",
        source_page="Page 2-3",
    ),
    CriterionId.CAPILLARY_REFILL_GT_3S: CriterionMetadata(
        criterion_id=CriterionId.CAPILLARY_REFILL_GT_3S,
        label="Capillary refill > 3 seconds",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Circulation assessment",
        source_page="Page 3",
    ),
    CriterionId.WEAK_PULSES: CriterionMetadata(
        criterion_id=CriterionId.WEAK_PULSES,
        label="Weak peripheral pulses",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Circulation assessment",
        source_page="Page 3",
    ),
    CriterionId.COLD_EXTREMITIES: CriterionMetadata(
        criterion_id=CriterionId.COLD_EXTREMITIES,
        label="Cold extremities",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Circulation assessment",
        source_page="Page 3",
    ),
    # RED - Disability
    CriterionId.ALTERED_MENTAL_STATUS: CriterionMetadata(
        criterion_id=CriterionId.ALTERED_MENTAL_STATUS,
        label="Altered mental status",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Disability assessment (AVPU/GCS)",
        source_page="Page 3",
    ),
    CriterionId.UNCONSCIOUS: CriterionMetadata(
        criterion_id=CriterionId.UNCONSCIOUS,
        label="Unconscious",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Disability assessment (AVPU/GCS)",
        source_page="Page 3",
    ),
    CriterionId.SEIZURE: CriterionMetadata(
        criterion_id=CriterionId.SEIZURE,
        label="Active seizure",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Disability assessment",
        source_page="Page 3",
    ),
    # RED - Trauma
    CriterionId.MAJOR_TRAUMA: CriterionMetadata(
        criterion_id=CriterionId.MAJOR_TRAUMA,
        label="Major trauma",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Trauma assessment",
        source_page="Page 4",
    ),
    CriterionId.UNCONTROLLED_BLEEDING: CriterionMetadata(
        criterion_id=CriterionId.UNCONTROLLED_BLEEDING,
        label="Uncontrolled bleeding",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Trauma assessment",
        source_page="Page 4",
    ),
    CriterionId.SUSPECTED_SPINAL: CriterionMetadata(
        criterion_id=CriterionId.SUSPECTED_SPINAL,
        label="Suspected spinal injury",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Trauma assessment",
        source_page="Page 4",
    ),
    CriterionId.MAJOR_BURNS: CriterionMetadata(
        criterion_id=CriterionId.MAJOR_BURNS,
        label="Major burns",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Trauma assessment",
        source_page="Page 4",
    ),
    # RED - Specific conditions
    CriterionId.CHEST_PAIN_CARDIAC: CriterionMetadata(
        criterion_id=CriterionId.CHEST_PAIN_CARDIAC,
        label="Chest pain - cardiac",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Specific conditions - Cardiac",
        source_page="Page 5",
    ),
    CriterionId.ACS_SUSPECTED: CriterionMetadata(
        criterion_id=CriterionId.ACS_SUSPECTED,
        label="Acute coronary syndrome suspected",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Specific conditions - Cardiac",
        source_page="Page 5",
    ),
    CriterionId.ACUTE_ABDOMEN: CriterionMetadata(
        criterion_id=CriterionId.ACUTE_ABDOMEN,
        label="Acute abdomen",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Specific conditions - Abdominal",
        source_page="Page 5",
    ),
    CriterionId.TOXIC_APPEARANCE: CriterionMetadata(
        criterion_id=CriterionId.TOXIC_APPEARANCE,
        label="Toxic appearance with fever",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Specific conditions - Infectious",
        source_page="Page 5",
    ),
    CriterionId.SEVERE_PAIN: CriterionMetadata(
        criterion_id=CriterionId.SEVERE_PAIN,
        label="Severe pain",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Specific conditions - Pain",
        source_page="Page 5",
    ),
    CriterionId.POISONING: CriterionMetadata(
        criterion_id=CriterionId.POISONING,
        label="Poisoning",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Specific conditions - Poisoning",
        source_page="Page 5",
    ),
    # RED - Vital Signs (from High-Risk Signs Reference Card)
    CriterionId.HR_GT_130: CriterionMetadata(
        criterion_id=CriterionId.HR_GT_130,
        label="Heart rate > 130 bpm",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Heart rate - Red zone",
        source_page="Reference card",
    ),
    CriterionId.HR_LT_50: CriterionMetadata(
        criterion_id=CriterionId.HR_LT_50,
        label="Heart rate < 50 bpm",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Heart rate - Red zone",
        source_page="Reference card",
    ),
    CriterionId.RR_GT_30: CriterionMetadata(
        criterion_id=CriterionId.RR_GT_30,
        label="Respiratory rate > 30/min",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Respiratory rate - Red zone",
        source_page="Reference card",
    ),
    CriterionId.RR_LT_10: CriterionMetadata(
        criterion_id=CriterionId.RR_LT_10,
        label="Respiratory rate < 10/min",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Respiratory rate - Red zone",
        source_page="Reference card",
    ),
    CriterionId.SPO2_LT_92: CriterionMetadata(
        criterion_id=CriterionId.SPO2_LT_92,
        label="SpO2 < 92%",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Oxygen saturation - Red zone",
        source_page="Reference card",
    ),
    CriterionId.SBP_LT_90: CriterionMetadata(
        criterion_id=CriterionId.SBP_LT_90,
        label="Systolic BP < 90 mmHg",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Blood pressure - Red zone",
        source_page="Reference card",
    ),
    CriterionId.TEMP_GT_39: CriterionMetadata(
        criterion_id=CriterionId.TEMP_GT_39,
        label="Temperature > 39°C",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Temperature - Red zone",
        source_page="Reference card",
    ),
    CriterionId.TEMP_LT_35: CriterionMetadata(
        criterion_id=CriterionId.TEMP_LT_35,
        label="Temperature < 35°C",
        acuity=AcuityCategory.RED,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Temperature - Red zone",
        source_page="Reference card",
    ),
    # YELLOW - Vital Signs
    CriterionId.HR_110_130: CriterionMetadata(
        criterion_id=CriterionId.HR_110_130,
        label="Heart rate 110-130 bpm",
        acuity=AcuityCategory.YELLOW,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Heart rate - Yellow zone",
        source_page="Reference card",
    ),
    CriterionId.HR_50_60: CriterionMetadata(
        criterion_id=CriterionId.HR_50_60,
        label="Heart rate 50-60 bpm",
        acuity=AcuityCategory.YELLOW,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Heart rate - Yellow zone",
        source_page="Reference card",
    ),
    CriterionId.RR_25_30: CriterionMetadata(
        criterion_id=CriterionId.RR_25_30,
        label="Respiratory rate 25-30/min",
        acuity=AcuityCategory.YELLOW,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Respiratory rate - Yellow zone",
        source_page="Reference card",
    ),
    CriterionId.RR_10_12: CriterionMetadata(
        criterion_id=CriterionId.RR_10_12,
        label="Respiratory rate 10-12/min",
        acuity=AcuityCategory.YELLOW,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Respiratory rate - Yellow zone",
        source_page="Reference card",
    ),
    CriterionId.SPO2_92_94: CriterionMetadata(
        criterion_id=CriterionId.SPO2_92_94,
        label="SpO2 92-94%",
        acuity=AcuityCategory.YELLOW,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Oxygen saturation - Yellow zone",
        source_page="Reference card",
    ),
    CriterionId.SBP_90_100: CriterionMetadata(
        criterion_id=CriterionId.SBP_90_100,
        label="Systolic BP 90-100 mmHg",
        acuity=AcuityCategory.YELLOW,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Blood pressure - Yellow zone",
        source_page="Reference card",
    ),
    CriterionId.TEMP_38_39: CriterionMetadata(
        criterion_id=CriterionId.TEMP_38_39,
        label="Temperature 38-39°C",
        acuity=AcuityCategory.YELLOW,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Temperature - Yellow zone",
        source_page="Reference card",
    ),
    CriterionId.TEMP_35_36: CriterionMetadata(
        criterion_id=CriterionId.TEMP_35_36,
        label="Temperature 35-36°C",
        acuity=AcuityCategory.YELLOW,
        source_document="WHO IITT High-Risk Vital Signs Reference Card",
        source_section="Temperature - Yellow zone",
        source_page="Reference card",
    ),
    CriterionId.HIGH_FEVER: CriterionMetadata(
        criterion_id=CriterionId.HIGH_FEVER,
        label="High fever without toxic appearance",
        acuity=AcuityCategory.YELLOW,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Specific conditions - Infectious",
        source_page="Page 5",
    ),
    # GREEN
    CriterionId.MINOR_COMPLAINT: CriterionMetadata(
        criterion_id=CriterionId.MINOR_COMPLAINT,
        label="Minor complaint",
        acuity=AcuityCategory.GREEN,
        source_document="WHO IITT Routine Triage Tool (Age 12+)",
        source_section="Green pathway",
        source_page="Page 6",
    ),
}


def get_coverage_summary() -> Dict[str, Any]:
    """Get coverage summary for the ruleset."""
    total = len(CRITERIA_METADATA)
    implemented = sum(1 for m in CRITERIA_METADATA.values() if m.implemented)
    tested = sum(1 for m in CRITERIA_METADATA.values() if m.tested)

    by_acuity = {}
    for acuity in AcuityCategory:
        acuity_criteria = [m for m in CRITERIA_METADATA.values() if m.acuity == acuity]
        if acuity_criteria:
            by_acuity[acuity.value] = {
                "total": len(acuity_criteria),
                "implemented": sum(1 for m in acuity_criteria if m.implemented),
                "tested": sum(1 for m in acuity_criteria if m.tested),
            }

    return {
        "ruleset_version": RULESET_VERSION,
        "ruleset_name": RULESET_NAME,
        "source_document": SOURCE_DOCUMENT,
        "source_url": SOURCE_URL,
        "source_version_date": SOURCE_VERSION_DATE,
        "implementation_date": IMPLEMENTATION_DATE,
        "min_age": MIN_AGE,
        "total_criteria": total,
        "implemented_criteria": implemented,
        "tested_criteria": tested,
        "implementation_rate": round(implemented / total * 100, 1) if total > 0 else 0,
        "test_rate": round(tested / total * 100, 1) if total > 0 else 0,
        "by_acuity": by_acuity,
        "pending_source_verification": [
            m.criterion_id.value for m in CRITERIA_METADATA.values()
            if not m.implemented
        ],
    }


def get_criteria_for_coverage_matrix() -> List[Dict[str, Any]]:
    """Get criteria details for the coverage matrix documentation."""
    result = []
    for criterion_id, meta in sorted(CRITERIA_METADATA.items(), key=lambda x: x[0].value):
        result.append({
            "criterion_id": criterion_id.value,
            "label": meta.label,
            "acuity": meta.acuity.value,
            "source_document": meta.source_document,
            "source_section": meta.source_section,
            "source_page": meta.source_page or "N/A",
            "implemented": meta.implemented,
            "tested": meta.tested,
            "notes": meta.notes,
        })
    return result
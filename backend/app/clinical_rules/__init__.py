"""
WeCare.AI Clinical Rules Package

Exports all clinical rules engine components.
"""
from app.clinical_rules.schemas import (
    FindingState,
    AcuityCategory,
    AssessmentStatus,
    VitalSigns,
    ClinicalFindings,
    TriageInput,
    CriterionId,
    MatchedCriterion,
    ClinicalAssessmentResult,
)
from app.clinical_rules.criteria import (
    RED_CRITERIA,
    YELLOW_CRITERIA,
    GREEN_CRITERIA,
    ALL_CRITERIA,
    CRITERIA_BY_ACUITY,
    Criterion,
)
from app.clinical_rules.engine import (
    ClinicalRulesEngine,
    get_rules_engine,
    map_patient_to_triage_input,
)
from app.clinical_rules.ruleset_metadata import (
    RULESET_VERSION,
    RULESET_NAME,
    SOURCE_DOCUMENT,
    SOURCE_URL,
    MIN_AGE,
    CRITERIA_METADATA,
    get_coverage_summary,
    get_criteria_for_coverage_matrix,
)
from app.clinical_rules.input_mapping import (
    create_triage_input_from_patient,
    create_triage_input_from_structured,
    extract_input_snapshot,
)

__all__ = [
    # Schemas
    "FindingState",
    "AcuityCategory",
    "AssessmentStatus",
    "VitalSigns",
    "ClinicalFindings",
    "TriageInput",
    "CriterionId",
    "MatchedCriterion",
    "ClinicalAssessmentResult",
    # Criteria
    "RED_CRITERIA",
    "YELLOW_CRITERIA",
    "GREEN_CRITERIA",
    "ALL_CRITERIA",
    "CRITERIA_BY_ACUITY",
    "Criterion",
    # Engine
    "ClinicalRulesEngine",
    "get_rules_engine",
    "map_patient_to_triage_input",
    # Metadata
    "RULESET_VERSION",
    "RULESET_NAME",
    "SOURCE_DOCUMENT",
    "SOURCE_URL",
    "MIN_AGE",
    "CRITERIA_METADATA",
    "get_coverage_summary",
    "get_criteria_for_coverage_matrix",
    # Input mapping
    "create_triage_input_from_patient",
    "create_triage_input_from_structured",
    "extract_input_snapshot",
]
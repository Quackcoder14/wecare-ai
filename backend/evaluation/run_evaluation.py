#!/usr/bin/env python
"""
WeCare.AI Evaluation Runner

Runs the clinical rules engine against a fixed set of synthetic scenarios
and reports measurable test results.
"""
import json
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.clinical_rules.schemas import (
    TriageInput,
    ClinicalFindings,
    VitalSigns,
    FindingState,
    AcuityCategory,
    CriterionId,
)
from app.clinical_rules.engine import ClinicalRulesEngine
from app.config import settings


@dataclass
class ScenarioResult:
    """Result of evaluating a single scenario."""
    scenario_id: str
    passed: bool
    expected_acuity: str
    actual_acuity: Optional[str]
    expected_criteria: List[str]
    actual_criteria: List[str]
    missing_info_count: int
    execution_time_ms: float
    error: Optional[str] = None


@dataclass
class EvaluationReport:
    """Complete evaluation report."""
    timestamp: str
    rules_version: str
    total_scenarios: int
    passed: int
    failed: int
    errors: int
    results: List[ScenarioResult]
    acuity_confusion: Dict[str, Dict[str, int]]
    under_triage_count: int
    over_triage_count: int
    unassessed_count: int
    avg_execution_time_ms: float


ACUITY_ORDER = {
    AcuityCategory.OUT_OF_SCOPE: -1,
    AcuityCategory.UNASSESSED: 0,
    AcuityCategory.GREEN: 1,
    AcuityCategory.YELLOW: 2,
    AcuityCategory.RED: 3,
}


def load_scenarios(scenarios_path: Path) -> List[Dict[str, Any]]:
    """Load scenarios from JSON file."""
    with open(scenarios_path, "r") as f:
        data = json.load(f)
    return data["scenarios"]


def create_triage_input(scenario: Dict[str, Any]) -> TriageInput:
    """Create TriageInput from scenario data."""
    vital_signs = VitalSigns()
    for name, value in scenario.get("vital_signs", {}).items():
        if hasattr(vital_signs, name):
            setattr(vital_signs, name, value)
            vital_signs.set_measured(name, True)

    clinical_findings = ClinicalFindings()
    for name, state_str in scenario.get("clinical_findings", {}).items():
        if hasattr(clinical_findings, name):
            state = FindingState(state_str)
            setattr(clinical_findings, name, state)

    return TriageInput(
        patient_id=f"EVAL-{scenario['scenario_id']}",
        age=scenario["age"],
        vital_signs=vital_signs,
        clinical_findings=clinical_findings,
        rules_version=settings.rules_version,
    )


def evaluate_scenario(engine: ClinicalRulesEngine, scenario: Dict[str, Any]) -> ScenarioResult:
    """Evaluate a single scenario."""
    start_time = time.perf_counter()

    try:
        triage_input = create_triage_input(scenario)
        result = engine.assess(triage_input)

        execution_time = (time.perf_counter() - start_time) * 1000

        actual_acuity = result.acuity.value if result.acuity else None
        actual_criteria = [c.value for c in result.matched_criteria]

        expected_acuity = scenario["expected_acuity"]
        expected_criteria = scenario["expected_matched_criteria"]

        # Check acuity match
        acuity_match = actual_acuity == expected_acuity

        # Check criteria match (order independent)
        criteria_match = set(actual_criteria) == set(expected_criteria)

        passed = acuity_match and criteria_match

        return ScenarioResult(
            scenario_id=scenario["scenario_id"],
            passed=passed,
            expected_acuity=expected_acuity,
            actual_acuity=actual_acuity,
            expected_criteria=expected_criteria,
            actual_criteria=actual_criteria,
            missing_info_count=len(result.missing_information),
            execution_time_ms=execution_time,
        )

    except Exception as e:
        execution_time = (time.perf_counter() - start_time) * 1000
        return ScenarioResult(
            scenario_id=scenario["scenario_id"],
            passed=False,
            expected_acuity=scenario["expected_acuity"],
            actual_acuity=None,
            expected_criteria=scenario["expected_matched_criteria"],
            actual_criteria=[],
            missing_info_count=0,
            execution_time_ms=execution_time,
            error=str(e),
        )


def calculate_confusion_matrix(results: List[ScenarioResult]) -> Dict[str, Dict[str, int]]:
    """Calculate confusion matrix for acuity categories."""
    categories = ["out_of_scope", "unassessed", "green", "yellow", "red"]
    matrix = {cat: {cat: 0 for cat in categories} for cat in categories}

    for r in results:
        if r.error:
            continue
        expected = r.expected_acuity
        actual = r.actual_acuity or "error"
        if expected in matrix and actual in matrix[expected]:
            matrix[expected][actual] += 1

    return matrix


def count_under_over_triage(results: List[ScenarioResult]) -> tuple:
    """Count under-triage and over-triage cases."""
    under_triage = 0
    over_triage = 0
    unassessed = 0

    for r in results:
        if r.error or r.actual_acuity is None:
            continue

        if r.actual_acuity == "unassessed":
            unassessed += 1
            continue

        expected_order = ACUITY_ORDER.get(AcuityCategory(r.expected_acuity), 0)
        actual_order = ACUITY_ORDER.get(AcuityCategory(r.actual_acuity), 0)

        if actual_order < expected_order:
            under_triage += 1
        elif actual_order > expected_order:
            over_triage += 1

    return under_triage, over_triage, unassessed


def generate_report(results: List[ScenarioResult], rules_version: str) -> EvaluationReport:
    """Generate evaluation report."""
    passed = sum(1 for r in results if r.passed)
    failed = sum(1 for r in results if not r.passed and not r.error)
    errors = sum(1 for r in results if r.error)

    confusion = calculate_confusion_matrix(results)
    under_triage, over_triage, unassessed = count_under_over_triage(results)

    avg_time = sum(r.execution_time_ms for r in results) / len(results) if results else 0

    return EvaluationReport(
        timestamp=datetime.utcnow().isoformat(),
        rules_version=rules_version,
        total_scenarios=len(results),
        passed=passed,
        failed=failed,
        errors=errors,
        results=results,
        acuity_confusion=confusion,
        under_triage_count=under_triage,
        over_triage_count=over_triage,
        unassessed_count=unassessed,
        avg_execution_time_ms=avg_time,
    )


def print_report(report: EvaluationReport):
    """Print human-readable report."""
    print("\n" + "=" * 70)
    print(f"WeCare.AI Clinical Rules Evaluation Report")
    print(f"Timestamp: {report.timestamp}")
    print(f"Rules Version: {report.rules_version}")
    print("=" * 70)

    print(f"\nTotal Scenarios: {report.total_scenarios}")
    print(f"Passed: {report.passed}")
    print(f"Failed: {report.failed}")
    print(f"Errors: {report.errors}")
    print(f"Pass Rate: {report.passed/report.total_scenarios*100:.1f}%")

    print(f"\nUnder-triage: {report.under_triage_count}")
    print(f"Over-triage: {report.over_triage_count}")
    print(f"Unassessed: {report.unassessed_count}")

    print(f"\nAverage Execution Time: {report.avg_execution_time_ms:.2f} ms")

    # Confusion matrix
    print("\nAcuity Confusion Matrix (Expected -> Actual):")
    categories = ["out_of_scope", "unassessed", "green", "yellow", "red"]
    header = "Expected\\Actual".ljust(18) + "".join(c.rjust(10) for c in categories)
    print(header)
    for expected in categories:
        row = expected.ljust(18) + "".join(str(report.acuity_confusion[expected].get(c, 0)).rjust(10) for c in categories)
        print(row)

    # Failed scenarios
    failed_results = [r for r in report.results if not r.passed and not r.error]
    if failed_results:
        print("\nFailed Scenarios:")
        for r in failed_results:
            print(f"  {r.scenario_id}: Expected {r.expected_acuity}, Got {r.actual_acuity}")
            if r.expected_criteria != r.actual_criteria:
                print(f"    Expected criteria: {r.expected_criteria}")
                print(f"    Actual criteria:   {r.actual_criteria}")

    error_results = [r for r in report.results if r.error]
    if error_results:
        print("\nError Scenarios:")
        for r in error_results:
            print(f"  {r.scenario_id}: {r.error}")

    print("\n" + "=" * 70)


def save_json_report(report: EvaluationReport, output_path: Path):
    """Save report as JSON."""
    # Convert to dict, handling non-serializable types
    report_dict = asdict(report)
    # Convert ScenarioResult objects to dicts
    report_dict["results"] = [asdict(r) for r in report.results]

    with open(output_path, "w") as f:
        json.dump(report_dict, f, indent=2)


def save_markdown_report(report: EvaluationReport, output_path: Path):
    """Save report as Markdown."""
    with open(output_path, "w") as f:
        f.write(f"# WeCare.AI Evaluation Report\n\n")
        f.write(f"**Timestamp:** {report.timestamp}\n")
        f.write(f"**Rules Version:** {report.rules_version}\n\n")

        f.write(f"## Summary\n\n")
        f.write(f"| Metric | Value |\n")
        f.write(f"|--------|-------|\n")
        f.write(f"| Total Scenarios | {report.total_scenarios} |\n")
        f.write(f"| Passed | {report.passed} |\n")
        f.write(f"| Failed | {report.failed} |\n")
        f.write(f"| Errors | {report.errors} |\n")
        f.write(f"| Pass Rate | {report.passed/report.total_scenarios*100:.1f}% |\n")
        f.write(f"| Under-triage | {report.under_triage_count} |\n")
        f.write(f"| Over-triage | {report.over_triage_count} |\n")
        f.write(f"| Unassessed | {report.unassessed_count} |\n")
        f.write(f"| Avg Execution Time | {report.avg_execution_time_ms:.2f} ms |\n\n")

        f.write(f"## Acuity Confusion Matrix\n\n")
        categories = ["out_of_scope", "unassessed", "green", "yellow", "red"]
        f.write(f"| Expected \\ Actual | " + " | ".join(categories) + " |\n")
        f.write(f"|" + "---|" * (len(categories) + 1) + "\n")
        for expected in categories:
            row = f"| {expected} "
            for actual in categories:
                row += f"| {report.acuity_confusion[expected].get(actual, 0)} "
            row += "|\n"
            f.write(row)
        f.write("\n")

        failed_results = [r for r in report.results if not r.passed and not r.error]
        if failed_results:
            f.write(f"## Failed Scenarios\n\n")
            for r in failed_results:
                f.write(f"### {r.scenario_id}\n")
                f.write(f"- **Expected acuity:** {r.expected_acuity}\n")
                f.write(f"- **Actual acuity:** {r.actual_acuity}\n")
                f.write(f"- **Expected criteria:** {r.expected_criteria}\n")
                f.write(f"- **Actual criteria:** {r.actual_criteria}\n")
                f.write(f"- **Missing info count:** {r.missing_info_count}\n")
                f.write(f"- **Execution time:** {r.execution_time_ms:.2f} ms\n\n")


def main():
    """Main evaluation entry point."""
    scenarios_path = Path(__file__).parent / "scenarios.json"
    output_dir = Path(__file__).parent

    print("Loading scenarios...")
    scenarios = load_scenarios(scenarios_path)
    print(f"Loaded {len(scenarios)} scenarios")

    print("Initializing rules engine...")
    engine = ClinicalRulesEngine(rules_version=settings.rules_version)

    print("Running evaluation...")
    results = []
    for i, scenario in enumerate(scenarios, 1):
        if i % 10 == 0:
            print(f"  Progress: {i}/{len(scenarios)}")
        result = evaluate_scenario(engine, scenario)
        results.append(result)

    print("Generating report...")
    report = generate_report(results, settings.rules_version)

    print_report(report)

    # Save reports
    json_path = output_dir / f"evaluation_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    md_path = output_dir / f"evaluation_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.md"

    save_json_report(report, json_path)
    save_markdown_report(report, md_path)

    print(f"\nReports saved:")
    print(f"  JSON: {json_path}")
    print(f"  Markdown: {md_path}")

    # Exit with error code if any failures
    if report.failed > 0 or report.errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
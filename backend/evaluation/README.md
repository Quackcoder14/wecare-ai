# WeCare.AI Evaluation Framework

This directory contains the evaluation framework for the clinical rules engine.

## Files

- `scenarios.json` - Fixed synthetic test scenarios derived from WHO IITT criteria
- `run_evaluation.py` - Evaluation runner script
- `evaluation_report_*.json` - Machine-readable evaluation results (generated)
- `evaluation_report_*.md` - Human-readable evaluation report (generated)

## Scenarios

The `scenarios.json` file contains 45 synthetic test scenarios covering:

### RED Criteria (Immediate - 29 scenarios)
- 21 clinical finding criteria (airway obstruction, severe respiratory distress, shock, etc.)
- 8 vital sign criteria (HR > 130, RR > 30, SpO2 < 92%, SBP < 90, etc.)

### YELLOW Criteria (Urgent - 9 scenarios)
- 8 vital sign criteria (HR 110-130, RR 25-30, SpO2 92-94%, etc.)
- 1 clinical criterion (high fever without toxic appearance)

### GREEN Criteria (Non-urgent - 1 scenario)
- Normal vitals, minor complaint

### Edge Cases (6 scenarios)
- RED priority over YELLOW
- Age boundary (11 = out of scope, 12 = assessed)
- No criteria matched (unassessed)
- Multiple RED/YELLOW criteria

## Running Evaluation

```bash
cd backend
python evaluation/run_evaluation.py
```

## Output

The runner produces:
1. Console output with summary
2. JSON report with detailed results
3. Markdown report for documentation

## Metrics

- **Pass Rate**: Percentage of scenarios where expected acuity and criteria match
- **Under-triage**: Cases where actual acuity is less urgent than expected
- **Over-triage**: Cases where actual acuity is more urgent than expected
- **Unassessed**: Cases where engine returns UNASSESSED
- **Confusion Matrix**: Expected vs Actual acuity breakdown
- **Execution Time**: Average latency per assessment

## Important Notes

⚠️ **All scenarios use synthetic data only.** These are not real patient cases and have not been clinically validated.

⚠️ **Performance on synthetic scenarios ≠ clinical validation.** This evaluation only verifies that the implemented rules behave as specified against the documented WHO IITT criteria.

⚠️ **Coverage is partial.** Only a subset of WHO IITT criteria have been implemented. See `docs/CLINICAL_RULE_COVERAGE.md` for the complete coverage matrix.

## Source References

Scenarios are derived from:
- WHO Interagency Integrated Triage Tool (IITT) Routine Triage for ages 12+
- WHO IITT High-Risk Vital Signs Reference Card
- Official source: https://www.who.int/tools/triage
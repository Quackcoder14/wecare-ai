# WeCare.AI Evaluation Report

**Timestamp:** 2026-10-09T18:04:48.864865
**Rules Version:** WHO-IITT-12PLUS-LOCAL-v1

## Summary

| Metric | Value |
|--------|-------|
| Total Scenarios | 45 |
| Passed | 44 |
| Failed | 1 |
| Errors | 0 |
| Pass Rate | 97.8% |
| Under-triage | 0 |
| Over-triage | 0 |
| Unassessed | 1 |
| Avg Execution Time | 0.10 ms |

## Acuity Confusion Matrix

| Expected \ Actual | out_of_scope | unassessed | green | yellow | red |
|---|---|---|---|---|---|
| out_of_scope | 1 | 0 | 0 | 0 | 0 |
| unassessed | 0 | 1 | 0 | 0 | 0 |
| green | 0 | 0 | 1 | 0 | 0 |
| yellow | 0 | 0 | 0 | 11 | 0 |
| red | 0 | 0 | 0 | 0 | 31 |

## Failed Scenarios

### SCEN-045
- **Expected acuity:** yellow
- **Actual acuity:** yellow
- **Expected criteria:** ['YELLOW_HR_110_130', 'YELLOW_TEMP_38_39']
- **Actual criteria:** ['YELLOW_HR_110_130', 'YELLOW_TEMP_38_39', 'YELLOW_HIGH_FEVER']
- **Missing info count:** 24
- **Execution time:** 0.12 ms


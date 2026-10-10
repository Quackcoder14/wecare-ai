# WeCare.AI Safety and Limitations

## ⚠️ Critical Safety Notice

**WeCare.AI is a hackathon prototype for demonstration purposes only. It is NOT a medical device, has NOT been clinically validated, and MUST NOT be used for real patient care.**

---

## Intended Use

WeCare.AI is a **clinician-supervised decision-support prototype** for emergency triage education and hackathon demonstration. It implements a deterministic rules engine based on the WHO Interagency Integrated Triage Tool (IITT) for patients aged 12 years and above.

## What This System Does

1. **Accepts structured clinical input** (age, symptoms, vital signs) from a healthcare operator
2. **Evaluates documented WHO IITT criteria** using a deterministic, traceable rules engine
3. **Returns an acuity category** (Red/Yellow/Green) ONLY when criteria support it
4. **Provides explicit reasoning** with matched criterion IDs and human-readable reasons
5. **Identifies missing information** that would be needed for complete assessment
6. **Preserves assessment history** for audit and reassessment
7. **Transcribes voice input** in 4 languages for operator review (not clinical decision)

## What This System Does NOT Do

| ❌ Does NOT | Explanation |
|-------------|-------------|
| Generate medical diagnoses | Only evaluates triage acuity criteria |
| Recommend medications or treatments | No therapeutic decision support |
| Predict mortality or outcomes | No prognostic modeling |
| Replace clinician judgment | Decision-support only, not autonomous |
| Use ML/AI for clinical decisions | Deterministic rules only; AI used only for speech-to-text |
| Assume missing values are normal | Explicitly tracks UNKNOWN vs ABSENT vs PRESENT |
| Default to Green when uncertain | Returns UNASSESSED/NEEDS_REVIEW instead |
| Automatically interpret transcripts | Transcripts require operator confirmation |
| Handle patients under 12 years | Explicitly OUT_OF_SCOPE with pediatric referral |

## Clinical Limitations

### 1. Partial Criteria Coverage
Only a subset of WHO IITT criteria are implemented (40/60+ criteria). See [CLINICAL_RULE_COVERAGE.md](CLINICAL_RULE_COVERAGE.md) for details.

**Notable gaps:**
- No pediatric pathway (age < 12)
- No pregnancy/obstetric criteria
- No psychiatric/behavioral criteria
- No region-specific criteria (envenomation, drowning, etc.)
- Simplified trauma assessment

### 2. Input Quality Dependencies
- **Keyword-based symptom mapping** from free text is error-prone
- **No structured clinical input forms** - relies on operator-entered symptom lists
- **Vital sign entry is manual** - no device integration
- **Transcript confirmation required** - raw ASR output not used clinically

### 3. Deterministic Engine Constraints
- Rules are **fixed at deployment** - no learning or adaptation
- **No clinical gestalt** - cannot integrate subtle patterns
- **Binary criterion evaluation** - no probability scores
- **No time-series analysis** - single timepoint assessment only

### 4. Speech-to-Text Limitations
- **Google Cloud Speech-to-Text** used for transcription only
- **Medical terminology accuracy not validated** for Tamil, Telugu, Hindi
- **No speaker diarization** - single speaker assumed
- **Background noise handling** depends on provider
- **Confidence scores not exposed** - operator must review all transcripts

## Safety Architecture

### Explicit State Tracking
```python
FindingState.PRESENT    # Confirmed present
FindingState.ABSENT     # Confirmed absent
FindingState.UNKNOWN    # Not assessed / data unavailable
```
**Never** infers ABSENT from missing data.

### Acuity Categories
| Category | Meaning | Clinical Action |
|----------|---------|-----------------|
| RED | High acuity | Immediate attention indicated |
| YELLOW | Moderate acuity | Needs to be seen soon |
| GREEN | Low acuity | Can wait under criteria |
| UNASSESSED | Insufficient data | Cannot assign acuity - needs review |
| NEEDS_REVIEW | Requires clinician review | Flagged for human oversight |
| OUT_OF_SCOPE | Age < 12 | Refer to pediatric pathway |

### Red Flag Preservation
If ANY RED criterion is matched:
- Returns RED acuity immediately
- Missing unrelated information **does not downgrade**
- `review_required = True` always

### Audit Trail
Every assessment records:
- Patient ID, timestamp, rules version
- Input snapshot (vitals, findings at assessment time)
- Matched criteria with source references
- Missing information list
- Assessment status

## Data Privacy & Security

### Current Prototype State
- **NO authentication/authorization** - open API
- **NO encryption at rest** - SQLite file
- **NO audit logging** beyond assessment records
- **NO HIPAA/GDPR compliance** - not designed for PHI
- **Synthetic data only** - no real patient data in repo

### Speech Data Handling
- Audio uploaded to backend, sent to Google Cloud Speech
- **Transcripts NOT stored** unless operator confirms and saves
- **Audio NOT persisted** by default
- **Google Cloud credentials** required but not in repo

## Deployment Warnings

### DO NOT DEPLOY TO PRODUCTION WITHOUT:
1. ☐ Clinical validation by qualified emergency physicians
2. ☐ Complete WHO IITT criteria implementation
3. ☐ Authentication, authorization, audit logging
4. ☐ Encryption at rest and in transit
5. ☐ HIPAA/GDPR compliance assessment
6. ☐ Medical device regulatory review (FDA/MDR)
7. ☐ Real-world usability testing with clinicians
8. ☐ Liability and malpractice insurance review
9. ☐ Business associate agreements (BAAs) with cloud providers
10. ☐ Incident response and clinical safety monitoring

### Current Configuration Suitable For:
- ✅ Hackathon demonstration
- ✅ Educational triage training
- ✅ Rules engine development reference
- ✅ API integration testing with frontend

### Current Configuration NOT Suitable For:
- ❌ Real emergency department use
- ❌ Any patient care decisions
- ❌ Clinical research without IRB approval
- ❌ Deployment with real PHI
- ❌ Unsupervised operator use

## Emergency Procedures

If this system were ever used in a real clinical setting (NOT RECOMMENDED):

1. **Operator MUST** verify all inputs before assessment
2. **Operator MUST** review and confirm all transcripts
3. **Clinician MUST** override any system recommendation
4. **System failure** must fall back to paper triage
5. **All assessments** documented in official medical record

## Contact

For questions about this prototype:
- **Repository:** WeCare.AI Hackathon Project
- **Clinical Advisor:** [Not assigned - hackathon prototype]
- **Technical Lead:** [Hackathon team]

---

**Document Version:** 1.0
**Last Updated:** 2026-10-09
**Next Review:** Before any production consideration
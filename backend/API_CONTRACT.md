# WeCare.AI API Contract

**Version:** 1.0
**Last Updated:** 2026-10-09
**Shared with:** Frontend (Workstream B) via `frontend/src/types/api.ts`

---

## Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `http://localhost:8000` (dev) / `http://<LAN_IP>:8000` (cross-laptop) |
| API Prefix | `/api` |
| Content-Type | `application/json` (except voice upload) |
| Auth | None (prototype) |

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": {}
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation, business logic) |
| 404 | Not Found |
| 413 | Payload Too Large |
| 415 | Unsupported Media Type |
| 422 | Unprocessable Entity (validation) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 422 | Request validation failed |
| NOT_FOUND | 404 | Resource not found |
| AGE_OUT_OF_SCOPE | 400 | Patient age < 12 |
| INSUFFICIENT_DATA | 400 | Cannot assess with available data |
| SPEECH_NOT_CONFIGURED | 503 | Google Cloud credentials not set |
| UNSUPPORTED_LANGUAGE | 400 | Language code not in supported list |
| INVALID_AUDIO | 400 | Empty or corrupted audio |
| AUDIO_TOO_LARGE | 413 | Audio exceeds size limit |
| UNSUPPORTED_AUDIO_FORMAT | 415 | MIME type not supported |
| TRANSCRIPTION_EMPTY | 400 | No speech recognized |
| SPEECH_PROVIDER_UNAVAILABLE | 503 | Provider timeout/unreachable |
| SPEECH_PROVIDER_ERROR | 502 | Provider returned error |

---

## Endpoints

### 1. Health Check

**GET** `/api/health`

**Response:**
```json
{
  "status": "ok",
  "database": "available",
  "clinical_rules": {
    "configured": true,
    "rules_version": "WHO-IITT-12PLUS-LOCAL-v1"
  },
  "speech": {
    "configured": false,
    "available": false,
    "supported_languages": []
  }
}
```

---

### 2. Create Patient

**POST** `/api/patients`

**Request:**
```json
{
  "age": 45,
  "symptoms": ["Chest pain", "Shortness of breath"],
  "symptom_onset": "2 hours ago",
  "vitals": {
    "heart_rate_bpm": 110,
    "respiratory_rate_per_min": 28,
    "spo2_percent": 92,
    "systolic_bp_mmhg": 100,
    "temperature_c": 37.5
  },
  "medical_history": "Hypertension",
  "preferred_language": "en",
  "input_method": "manual",
  "transcript": "Patient reports chest pain radiating to left arm"
}
```

**Field Details:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| age | integer | Yes | 1-150, assessment requires ≥12 |
| symptoms | string[] | Yes | At least one symptom or vital sign |
| symptom_onset | string | No | Free text (e.g., "2 hours ago") |
| vitals | object | No | See VitalsInput below |
| medical_history | string | No | Relevant history |
| preferred_language | enum | Yes | `en`, `ta`, `te`, `hi` |
| input_method | enum | Yes | `manual`, `voice` |
| transcript | string | No | Confirmed voice transcript |

**VitalsInput:**
```json
{
  "heart_rate_bpm": 110,
  "respiratory_rate_per_min": 28,
  "spo2_percent": 92,
  "systolic_bp_mmhg": 100,
  "temperature_c": 37.5
}
```
All vital fields optional. Omit = not measured. Do not send 0 for missing.

**Response (201):**
```json
{
  "patient_id": "uuid-string",
  "age": 45,
  "symptoms": ["Chest pain", "Shortness of breath"],
  "symptom_onset": "2 hours ago",
  "vitals": { ... },
  "medical_history": "Hypertension",
  "preferred_language": "en",
  "input_method": "manual",
  "transcript": "Patient reports chest pain radiating to left arm",
  "created_at": "2026-10-09T12:00:00.000000"
}
```

---

### 3. Get Patient

**GET** `/api/patients/{patient_id}`

**Response (200):**
```json
{
  "patient_id": "uuid",
  "age": 45,
  "symptoms": [...],
  "symptom_onset": "2 hours ago",
  "vitals": { ... },
  "medical_history": "Hypertension",
  "preferred_language": "en",
  "input_method": "manual",
  "transcript": "...",
  "created_at": "2026-10-09T12:00:00.000000",
  "assessments": [
    {
      "assessment_id": "uuid",
      "patient_id": "uuid",
      "acuity": "red",
      "reasons": ["Heart rate > 130 bpm", "SpO2 < 92%"],
      "missing_information": ["Temperature: not measured"],
      "review_required": true,
      "rules_version": "WHO-IITT-12PLUS-LOCAL-v1",
      "assessed_at": "2026-10-09T12:05:00.000000"
    }
  ]
}
```

**Acuity Values:** `red`, `yellow`, `green`, `unassessed`, `needs_review`, `out_of_scope`

---

### 4. Update Patient

**PATCH** `/api/patients/{patient_id}`

**Request:** Any subset of create fields
```json
{
  "vitals": {
    "heart_rate_bpm": 120,
    "spo2_percent": 90
  }
}
```

**Response (200):** Updated patient object (same as GET)

---

### 5. Reassess Patient

**POST** `/api/patients/{patient_id}/reassess`

**Request:**
```json
{
  "patient_id": "uuid",
  "symptoms": ["Chest pain", "Diaphoresis"],
  "vitals": {
    "heart_rate_bpm": 135,
    "spo2_percent": 88
  }
}
```

**Behavior:** Updates patient, creates NEW assessment, preserves history

**Response (200):** AssessmentResponse (same as create assessment)

---

### 6. Create Assessment

**POST** `/api/assessments`

**Request:**
```json
{
  "patient_id": "uuid"
}
```

**Response (201):**
```json
{
  "assessment_id": "uuid",
  "patient_id": "uuid",
  "acuity": "red",
  "reasons": [
    "Heart rate > 130 beats per minute",
    "Oxygen saturation < 92% on room air"
  ],
  "missing_information": [
    "Temperature: not measured",
    "Respiratory rate: not measured"
  ],
  "review_required": true,
  "rules_version": "WHO-IITT-12PLUS-LOCAL-v1",
  "assessed_at": "2026-10-09T12:05:00.000000"
}
```

**Error Responses:**
- 400 AGE_OUT_OF_SCOPE: Patient age < 12
- 400 INSUFFICIENT_DATA: No criteria matched, returns unassessed
- 404 NOT_FOUND: Patient not found

---

### 7. Get Assessment

**GET** `/api/assessments/{assessment_id}`

**Response (200):** AssessmentResponse (same as create)

---

### 8. Acknowledge Assessment

**POST** `/api/assessments/{assessment_id}/acknowledge`

**Request:**
```json
{
  "assessment_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "acknowledged_at": "2026-10-09T12:10:00.000000"
}
```

**Behavior:** Idempotent - repeat calls return success with original timestamp

---

### 9. Get Priority Queue

**GET** `/api/queue`

**Response (200):**
```json
{
  "items": [
    {
      "patient_id": "uuid",
      "age": 45,
      "acuity": "red",
      "assessment_summary": "Heart rate > 130 beats per minute",
      "waiting_duration_seconds": 1800,
      "review_status": "pending",
      "latest_assessment_id": "uuid",
      "created_at": "2026-10-09T12:00:00.000000"
    }
  ],
  "total": 1
}
```

**Queue Ordering:**
1. Acuity: RED → YELLOW → GREEN → UNASSESSED → OUT_OF_SCOPE
2. Waiting time: Longer waiting first (within same acuity)

**Review Status Values:** `pending`, `acknowledged`, `not_required`

---

### 10. Queue Summary

**GET** `/api/queue/summary`

**Response (200):**
```json
{
  "total": 5,
  "red": 2,
  "yellow": 1,
  "green": 1,
  "unassessed": 1,
  "out_of_scope": 0,
  "needs_review": 3
}
```

---

### 11. Voice Transcription

**POST** `/api/voice/transcribe`

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| audio | file | Yes | Audio file (WebM, OGG, MP4, MP3, WAV) |
| language_code | string | Yes | `en-IN`, `ta-IN`, `te-IN`, `hi-IN` |

**Limits:**
- Max size: 10 MB (configurable)
- Max duration: 60 seconds (configurable)

**Response (200):**
```json
{
  "transcript": "Patient reports severe chest pain radiating to left arm",
  "language_code": "en-IN",
  "provider": "google-cloud-speech",
  "transcription_status": "success",
  "confidence": 0.92
}
```

**Error Responses:**
- 400 INVALID_AUDIO: Empty file
- 400 UNSUPPORTED_LANGUAGE: Language not in supported list
- 413 AUDIO_TOO_LARGE: Exceeds max size
- 415 UNSUPPORTED_AUDIO_FORMAT: MIME type not supported
- 503 SPEECH_NOT_CONFIGURED: Credentials not set
- 503 SPEECH_PROVIDER_UNAVAILABLE: Provider timeout
- 502 SPEECH_PROVIDER_ERROR: Provider error

---

### 12. Voice Service Status

**GET** `/api/voice/status`

**Response (200):**
```json
{
  "configured": true,
  "available": true,
  "supported_languages": {
    "en-IN": { "name": "English (India)", "configured": true },
    "ta-IN": { "name": "Tamil (India)", "configured": true },
    "te-IN": { "name": "Telugu (India)", "configured": true },
    "hi-IN": { "name": "Hindi (India)", "configured": true }
  },
  "provider": "google-cloud-speech"
}
```

---

## Enumerations

### Language Codes
| App Code | Speech Code | Display Name |
|----------|-------------|--------------|
| en | en-IN | English (India) |
| ta | ta-IN | Tamil (India) |
| te | te-IN | Telugu (India) |
| hi | hi-IN | Hindi (India) |

### Input Methods
- `manual` - Typed/form entry
- `voice` - Voice recorded and transcribed

### Acuity Categories
| Value | Display | Color | Priority |
|-------|---------|-------|----------|
| red | Red — High Acuity | #D64545 | 1 (highest) |
| yellow | Yellow — Moderate Acuity | #E3AE32 | 2 |
| green | Green — Low Acuity | #269A69 | 3 |
| unassessed | Unassessed | #64717B | 4 |
| needs_review | Needs Review | #E3AE32 | 5 |
| out_of_scope | Out of Scope | #64717B | 6 (lowest) |

### Review Status
| Value | Display |
|-------|---------|
| pending | Review Required |
| acknowledged | Acknowledged |
| not_required | Not Required |

---

## Null/Missing Value Semantics

| Scenario | API Behavior |
|----------|--------------|
| Vital sign not measured | Field omitted from request, `null` in response |
| Symptom not present | Not in symptoms array (not `false`) |
| Optional field not provided | Omitted from request |
| Assessment cannot determine acuity | `acuity: null` + `assessment_status: "insufficient_data"` |
| Patient age < 12 | 400 AGE_OUT_OF_SCOPE, patient created but not assessed |

---

## Age Eligibility

- **Minimum assessment age:** 12 years (configurable via `MIN_ASSESSMENT_AGE`)
- **Patients < 12:** Created successfully, assessment returns 400 AGE_OUT_OF_SCOPE
- **Error message:** Refers to pediatric pathway and local protocol
- **No automatic pediatric algorithm** - explicit out-of-scope

---

## Reassessment History

- Each reassessment creates a **new Assessment record**
- **Previous assessments NEVER modified or deleted**
- GET `/api/patients/{id}` returns full history in `assessments[]`
- GET `/api/queue` shows only **latest** assessment per patient
- Acknowledgement applies to specific assessment ID

---

## Voice Upload Format

| Parameter | Value |
|-----------|-------|
| Method | POST multipart/form-data |
| Audio field name | `audio` |
| Language field name | `language_code` |
| Supported MIME types | `audio/webm`, `audio/webm;codecs=opus`, `audio/ogg`, `audio/ogg;codecs=opus`, `audio/mp4`, `audio/mpeg`, `audio/wav` |
| Max size | 10 MB (configurable: `MAX_AUDIO_UPLOAD_MB`) |
| Max duration | 60 seconds (configurable: `MAX_AUDIO_DURATION_SECONDS`) |

**Frontend Note:** MediaRecorder typically produces `audio/webm;codecs=opus`. Send as-is - backend handles WebM/Opus.

---

## Language Code Mapping

| Frontend | Backend (Google Cloud) |
|----------|------------------------|
| en | en-IN |
| ta | ta-IN |
| te | te-IN |
| hi | hi-IN |

Frontend sends app codes (en/ta/te/hi) for patient creation.
Voice endpoint expects Google Cloud codes (en-IN/ta-IN/te-IN/hi-IN).

---

## CORS Configuration

**Development:**
```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Cross-Laptop (Laptop B frontend → Laptop A backend):**
```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.50:5173
```
Add Laptop B's origin to backend CORS.

---

## Frontend Environment

**frontend/.env:**
```env
# Local backend
VITE_API_BASE_URL=http://localhost:8000

# Cross-laptop (replace with Laptop A's LAN IP)
VITE_API_BASE_URL=http://192.168.1.50:8000

# Mock mode (no backend needed)
VITE_USE_MOCK_API=false
```

---

## Speech Service Configuration

**Backend .env:**
```env
# Required for transcription
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
# OR
GOOGLE_CLOUD_PROJECT=your-project-id

SPEECH_TRANSCRIPTION_ENABLED=true
MAX_AUDIO_UPLOAD_MB=10
MAX_AUDIO_DURATION_SECONDS=60
SUPPORTED_LANGUAGE_CODES=en-IN,ta-IN,te-IN,hi-IN
```

**Without credentials:** Backend starts, voice endpoints return 503 SPEECH_NOT_CONFIGURED, clinical assessment works normally.

---

## Example Workflow

```bash
# 1. Create patient
curl -X POST http://localhost:8000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"age":45,"symptoms":["Chest pain"],"preferred_language":"en","input_method":"manual"}'

# Response: {"patient_id":"abc-123",...}

# 2. Run assessment
curl -X POST http://localhost:8000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{"patient_id":"abc-123"}'

# Response: {"assessment_id":"def-456","acuity":"red","reasons":[...],...}

# 3. Check queue
curl http://localhost:8000/api/queue

# 4. Acknowledge if review_required
curl -X POST http://localhost:8000/api/assessments/def-456/acknowledge \
  -H "Content-Type: application/json" \
  -d '{"assessment_id":"def-456"}'

# 5. Voice transcription (if configured)
curl -X POST http://localhost:8000/api/voice/transcribe \
  -F "audio=@recording.webm" \
  -F "language_code=en-IN"
```

---

## OpenAPI Documentation

Interactive API docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-10-09 | Initial contract for hackathon |
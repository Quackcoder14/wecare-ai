# WeCare.AI Backend

**AI-Powered Emergency Triage Decision Support - Backend API**

Implements deterministic clinical triage based on WHO IITT criteria for patients aged 12+, with multilingual speech-to-text transcription.

## Features

### Clinical Triage Engine
- **Deterministic rules engine** based on WHO Interagency Integrated Triage Tool (IITT)
- **40 implemented criteria** covering RED (immediate), YELLOW (urgent), GREEN (non-urgent)
- **Explicit missing information tracking** - never infers negatives from missing data
- **Age eligibility enforcement** - patients < 12 return OUT_OF_SCOPE
- **Full audit trail** - every assessment records criteria matched, reasons, missing info, rules version

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | System health check |
| `/api/patients` | POST | Register new patient |
| `/api/patients/{id}` | GET | Get patient with assessment history |
| `/api/patients/{id}` | PATCH | Update patient information |
| `/api/patients/{id}/reassess` | POST | Reassess with new data |
| `/api/assessments` | POST | Run clinical assessment |
| `/api/assessments/{id}` | GET | Get assessment details |
| `/api/assessments/{id}/acknowledge` | POST | Acknowledge review-required case |
| `/api/queue` | GET | Priority queue (Red→Yellow→Green) |
| `/api/queue/summary` | GET | Queue counts for dashboard |
| `/api/voice/transcribe` | POST | Speech-to-text transcription |
| `/api/voice/status` | GET | Speech service status |

### Speech-to-Text
- **Google Cloud Speech-to-Text** integration
- **4 languages**: English (en-IN), Tamil (ta-IN), Telugu (te-IN), Hindi (hi-IN)
- **Audio formats**: WebM/Opus, OGG/Opus, MP4, MP3, WAV
- **Max 10MB / 60 seconds** per upload
- **Operator review required** - transcripts not used for clinical decisions

### Data Persistence
- **SQLite** with SQLAlchemy 2.x
- **Patients** + **Assessments** + **Acknowledgement Events**
- **Assessment history preserved** - reassessment creates new records
- **In-memory test database** for isolated unit tests

## Quick Start

### Prerequisites
- Python 3.11+
- Google Cloud project with Speech-to-Text API enabled (optional)

### Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your settings
```

Key settings:
```env
# Database
DATABASE_URL=sqlite:///./wecare.db

# Google Cloud Speech (optional - set to enable transcription)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
SPEECH_TRANSCRIPTION_ENABLED=true

# CORS for frontend
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Run Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs available at: `http://localhost:8000/docs`

### Run Tests

```bash
# All tests
pytest

# Specific test suites
pytest tests/clinical_rules/ -v
pytest tests/api/ -v
pytest tests/unit/ -v

# With coverage
pytest --cov=app --cov-report=html
```

### Run Evaluation

```bash
python evaluation/run_evaluation.py
```

Generates JSON and Markdown reports in `evaluation/`.

## Cross-Laptop Development

### Laptop A (Backend)
```bash
# Find your LAN IP
ipconfig  # Windows
ifconfig  # Linux/Mac

# Start backend on LAN
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Laptop B (Frontend)
```bash
# Set backend URL to Laptop A's IP
# In frontend/.env:
VITE_API_BASE_URL=http://192.168.1.50:8000  # Replace with Laptop A's IP
VITE_USE_MOCK_API=false

# Start frontend
npm run dev
```

### CORS Configuration
Backend must allow frontend origin:
```env
# In backend/.env - add frontend origin
CORS_ORIGINS=http://localhost:5173,http://192.168.1.50:5173
```

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app factory
│   ├── config.py               # Pydantic settings
│   ├── database.py             # SQLAlchemy setup
│   ├── exceptions.py           # Custom exceptions
│   ├── models/                 # SQLAlchemy models
│   ├── schemas/                # Pydantic request/response
│   ├── repositories/           # Data access layer
│   ├── services/               # Business logic
│   ├── clinical_rules/         # Deterministic triage engine
│   │   ├── schemas.py          # Input/output types
│   │   ├── criteria.py         # Criterion definitions
│   │   ├── engine.py           # Evaluation engine
│   │   ├── input_mapping.py    # Patient→TriageInput
│   │   └── ruleset_metadata.py # Coverage tracking
│   └── api/                    # FastAPI routes
├── tests/
│   ├── clinical_rules/         # Engine tests
│   ├── api/                    # Integration tests
│   └── unit/                   # Unit tests
├── evaluation/
│   ├── scenarios.json          # 45 synthetic test cases
│   └── run_evaluation.py       # Evaluation runner
├── docs/
│   ├── CLINICAL_RULE_COVERAGE.md
│   └── SAFETY_AND_LIMITATIONS.md
├── requirements.txt
├── .env.example
└── README.md
```

## Clinical Rules Reference

**Source:** WHO Interagency Integrated Triage Tool (IITT)
**URL:** https://www.who.int/tools/triage
**Population:** Ages 12 years and above (routine pathway)

### Acuity Categories
| Category | Color | Description |
|----------|-------|-------------|
| RED | 🔴 | High acuity - immediate attention |
| YELLOW | 🟡 | Moderate acuity - see soon |
| GREEN | 🟢 | Low acuity - can wait |
| UNASSESSED | ⚪ | Insufficient data |
| NEEDS_REVIEW | 🟠 | Requires clinician review |
| OUT_OF_SCOPE | ⚫ | Age < 12 - pediatric pathway |

### Implemented Criteria (40)
- **RED (30):** 22 clinical findings + 8 vital sign thresholds
- **YELLOW (9):** 8 vital sign ranges + 1 clinical
- **GREEN (1):** Default when no higher criteria match

See [docs/CLINICAL_RULE_COVERAGE.md](docs/CLINICAL_RULE_COVERAGE.md) for complete matrix.

## API Contract

Shared with frontend via `frontend/src/types/api.ts`. Key types:

```typescript
// Patient creation
interface PatientCreateRequest {
  age: number;
  symptoms: string[];
  symptom_onset?: string;
  vitals?: VitalsInput;
  preferred_language: 'en' | 'ta' | 'te' | 'hi';
  input_method: 'manual' | 'voice';
  transcript?: string;
}

// Assessment response
interface AssessmentResponse {
  assessment_id: string;
  acuity: 'red' | 'yellow' | 'green' | 'unassessed' | 'needs_review' | 'out_of_scope';
  reasons: string[];
  missing_information: string[];
  review_required: boolean;
  rules_version: string;
  assessed_at: string;
}
```

See [API_CONTRACT.md](API_CONTRACT.md) for complete specification.

## Evaluation

The evaluation framework runs 45 synthetic scenarios against the rules engine:

```bash
python evaluation/run_evaluation.py
```

Metrics reported:
- Pass/fail rate
- Under-triage / Over-triage counts
- Acuity confusion matrix
- Average execution latency

**⚠️ Synthetic data only - not clinically validated.**

## Safety & Limitations

**This is a hackathon prototype. NOT for clinical use.**

See [docs/SAFETY_AND_LIMITATIONS.md](docs/SAFETY_AND_LIMITATIONS.md) for complete safety statement.

Key limitations:
- Partial WHO IITT criteria coverage
- No authentication/authorization
- No encryption, no HIPAA compliance
- Keyword-based symptom mapping (error-prone)
- No pediatric, pregnancy, or psychiatric pathways
- Speech-to-text accuracy not validated for clinical use

## License

Hackathon project - MIT License (see LICENSE)

## Acknowledgments

- WHO IITT for triage criteria framework
- Google Cloud Speech-to-Text for transcription
- FastAPI, SQLAlchemy, Pydantic for backend stack
- React/Vite/TypeScript for frontend (separate repo)
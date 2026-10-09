# WeCare.AI Frontend

Emergency Triage Decision Support Interface for WeCare.AI healthcare hackathon project.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

The development server will start at `http://localhost:5173`.

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |
| `VITE_USE_MOCK_API` | Enable demo mode with synthetic data | `false` |

### Cross-Laptop Development

When the backend runs on Laptop A and frontend on Laptop B:

1. Find Laptop A's LAN IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Set `VITE_API_BASE_URL=http://<LAPTOP_A_IP>:8000`
3. Ensure backend CORS allows `http://<LAPTOP_B_IP>:5173`
4. Backend must listen on `0.0.0.0:8000` (not just localhost)

## Features

### Dashboard
- Real-time priority queue with acuity-based sorting
- Summary cards (waiting, high acuity, needs review)
- Filterable queue (All, Red, Yellow, Green, Needs Review)
- Connection status indicator
- Pull-to-refresh

### Patient Intake
- Age validation (blocks under-12 pathway with clinical warning)
- Structured + free-text symptom entry
- Vital signs with units (HR, RR, SpO2, SBP, Temp)
- Voice input with browser MediaRecorder API
- Transcript review and confirmation
- Manual entry fallback

### Multilingual Support
- English, Tamil (தமிழ்), Telugu (తెలుగు), Hindi (हिन्दी)
- Language selector in header with persistence
- Complete UI translation including clinical terms
- Speech language codes mapped per locale

### Voice Input
- Browser-native audio recording (MediaRecorder API)
- Automatic MIME type detection
- Backend transcription via `/api/voice/transcribe`
- Editable transcript with explicit confirmation
- Error handling with retry and manual fallback

### Assessment & History
- Displays backend-returned acuity and reasons
- Missing information and review status
- Assessment history with timestamps
- Reassessment workflow with change tracking
- In-system acknowledgement

### Demo Mode
- Set `VITE_USE_MOCK_API=true` for synthetic data
- Persistent "DEMO MODE — SYNTHETIC DATA" banner
- Mock patients covering all acuity levels
- Simulated transcription and assessment

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # AppShell, Sidebar, Topbar, LanguageSelector, ConnectionStatus
│   │   ├── common/          # PageHeader, LoadingState, ErrorState, EmptyState, ConfirmDialog
│   │   ├── dashboard/       # DashboardPage, SummaryCard, PatientQueue, PatientQueueRow, AcuityBadge
│   │   ├── intake/          # NewPatientPage, PatientIntakeForm, VitalsForm, VoiceRecorder, TranscriptEditor, AssessmentResult
│   │   └── patients/        # PatientDetailsPage, AssessmentHistory, ReassessmentForm
│   ├── i18n/                # Translation system (en, ta, te, hi)
│   ├── services/            # API client, patient/assessment/voice/queue services, mock adapter
│   ├── types/               # TypeScript API types
│   ├── hooks/               # useMediaQuery, useReducedMotion
│   ├── styles/              # Design tokens, global styles
│   └── App.tsx              # Main app with routing
├── .env.example
├── vite.config.ts
└── package.json
```

## Design System

### Colors
- Powder Blue: `#B8D9EF` (accents, selection)
- Charcoal: `#30363B` (primary text)
- Teal: `#148F91` (primary actions)
- Dark Teal: `#087F80` (hover states)
- Background: `#F5F8FA`
- Surface: `#FFFFFF`

### Acuity Colors (Clinical Use Only)
- Red: `#D64545` (High Acuity)
- Yellow: `#E3AE32` (Moderate Acuity)
- Green: `#269A69` (Low Acuity)

### Spacing Scale
4, 8, 12, 16, 24, 32, 48, 64px

## API Integration

The frontend expects these backend endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/patients` | Create patient |
| POST | `/api/assessments` | Request assessment |
| GET | `/api/queue` | Fetch priority queue |
| GET | `/api/patients/{id}` | Fetch patient details |
| POST | `/api/patients/{id}/reassess` | Reassessment |
| POST | `/api/assessments/{id}/acknowledge` | Acknowledge review |
| POST | `/api/voice/transcribe` | Transcribe audio |

### Voice Transcription Request
```multipart/form-data
audio: <audio blob>
language_code: en-IN | ta-IN | te-IN | hi-IN
```

### Voice Transcription Response
```json
{
  "transcript": "Patient reported chest pain...",
  "language_code": "en-IN",
  "confidence": 0.92
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Accessibility

- WCAG 2.2 AA compliant
- Semantic HTML5
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Reduced motion support
- Screen reader compatible

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires MediaRecorder API for voice input (all modern browsers).

## Clinical Safety Notice

This is a **decision-support prototype** for hackathon demonstration only.

- Does not diagnose patients
- Does not replace clinical judgment
- Not HIPAA compliant
- Not for production medical use
- All data is synthetic in demo mode
# WeCare.AI — AI-Powered Emergency Triage Decision Support System

[![Tests](https://img.shields.io/badge/Tests-188%20Passed%20(100%25)-brightgreen)](https://github.com/Quackcoder14/wecare-ai)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-teal)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.x-61dafb)](https://react.dev/)
[![Clinical Protocol](https://img.shields.io/badge/Protocol-WHO%20IITT%20(Ages%2012%2B)-red)](https://www.who.int/)

> **WeCare.AI** is an intelligent, auditable emergency triage decision-support platform designed to eliminate triage delays, prevent under-triage, and ensure consistent, life-saving prioritization in high-volume emergency departments.

---

## 🌟 Key Features

### 1. Deterministic Clinical Rules Engine (Zero Hallucination)
- Implements **40+ standardized criteria** based on the **WHO Interagency Integrated Triage Tool (IITT)** for ages 12+.
- Strictly deterministic mathematical logic ensures **0% hallucination risk** and **100% reproducible acuity scores**.
- Explicit **missing data tracking** prevents dangerous assumptions (missing vitals are never assumed to be normal).
- Hard **pediatric guardrail**: Patients aged $< 12$ are safely gated as `OUT_OF_SCOPE` with instructions to follow pediatric triage protocols.

### 2. Real-Time Prioritized Queue Dashboard & Alerts
- Dynamic emergency department queue automatically sorted by **Acuity Level** ($RED \to YELLOW \to GREEN$) and **Arrival Time** (FIFO tie-breaking).
- **Audio sirens and high-contrast pulsing alert banners** trigger instantly when a critical `RED` patient enters the queue.
- **Clinician acknowledgement workflow** enables senior emergency staff to audit and acknowledge urgent cases (`PENDING_REVIEW` $\to$ `ACKNOWLEDGED`).

### 3. Multilingual Speech-to-Text & Symptom Extraction
- Hands-free voice intake supporting **English, Hindi (हिन्दी), Tamil (தமிழ்), and Telugu (తెలుగు)**.
- Integrated **Speech-to-Text with automatic keyword symptom mapping** (e.g., spoken *"நெஞ்சு வலி"* or *"chest pain"* automatically highlights the `Chest Pain` symptom).
- Human-in-the-loop safety: Live transcript is presented in an editable text box for triage nurse verification before committing.

### 4. Guided Multi-Step Intake & Visual Vitals Sliders
- Step-by-step intuitive intake flow:
  1. **Basic Info:** Name, age, gender, preferred language.
  2. **Vitals Capture:** Interactive sliders with color-coded physiological safety zones (normal vs abnormal) and dual slider/numeric inputs.
  3. **Symptoms Selection:** Multilingual voice recording + categorized symptom multiselect + custom symptoms.
  4. **Medical History:** Pre-existing conditions, allergies, medications, and clinical document upload.
  5. **Review & Confirm:** Structured pre-flight summary before final clinical submission.

### 5. Dynamic Reassessment & Longitudinal Audit Trail
- Patients who deteriorate in the waiting room can be instantly reassessed (`POST /api/patients/{id}/reassess`).
- Immutable assessment snapshots preserve complete chronological records of vital trends and criteria shifts.

---

## 📋 Expected Outcomes Verification

| # | Expected Outcome | Implementation Status | Verified Documentation |
|:---|:---|:---:|:---|
| **1** | **Working AI-Powered Emergency Triage & Prioritization** | ✅ **Complete** | Production FastAPI backend + React Vite frontend |
| **2** | **Triage Criteria & Patient-Priority System** | ✅ **Complete** | 40+ WHO IITT criteria in `backend/app/clinical_rules/` |
| **3** | **Clinical Escalation, Emergency Workflows & Decision Support** | ✅ **Complete** | Dynamic reassessment, audio alerts, review workflows |
| **4** | **Consistent Prioritization Dashboard & Alerting** | ✅ **Complete** | Real-time queue sorting, priority badges, siren alerts |
| **5** | **Performance & Result Analysis Using Real-World Scenarios** | ✅ **Complete** | [SCENARIO_ANALYSIS.md](file:///c:/Users/dhanu/Downloads/wecare-ai/SCENARIO_ANALYSIS.md) (188 tests passing) |
| **6** | **Final Technical Report & Demonstration** | ✅ **Complete** | [FINAL_TECHNICAL_REPORT.md](file:///c:/Users/dhanu/Downloads/wecare-ai/FINAL_TECHNICAL_REPORT.md) & [DEMO_WALKTHROUGH.md](file:///c:/Users/dhanu/Downloads/wecare-ai/DEMO_WALKTHROUGH.md) |

---

## 🏗️ Architecture Overview

```
+--------------------+        +--------------------+        +----------------------+
|  React 18 Frontend | <----> |  FastAPI REST API  | <----> |  Deterministic Rules |
|  - Intake Flow     | HTTP   |  - /api/patients   |        |  - WHO IITT (40+)    |
|  - Live Queue      | JSON   |  - /api/assessments|        |  - Missing Vitals    |
|  - Audio Alerts    |        |  - /api/voice      |        |  - Age Guardrail     |
+--------------------+        +---------+----------+        +----------------------+
                                        |
                              +---------v----------+
                              | SQLAlchemy+SQLite  |
                              | - Patients         |
                              | - Assessments      |
                              | - Acknowledgements |
                              +--------------------+
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**

---

### Backend Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
5. Interactive Swagger API documentation will be available at:  
   👉 **`http://localhost:8000/docs`**

---

### Frontend Setup

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the web application in your browser:  
   👉 **`http://localhost:5173`**

---

## 🧪 Running Automated Tests

Run the full automated test suite containing 188 tests:

```bash
cd backend
python -m pytest tests/ -v
```

**Output:**
```
======================= 188 passed in 7.51s =======================
```

To run individual test modules:
```bash
# Clinical Rules Engine tests
python -m pytest tests/test_clinical_rules_engine.py -v

# API Endpoint tests
python -m pytest tests/api/ -v

# Schema and unit validation tests
python -m pytest tests/unit/ -v
```

---

## 📚 Project Documentation Directory

* 📄 **[Technical Report](file:///c:/Users/dhanu/Downloads/wecare-ai/FINAL_TECHNICAL_REPORT.md):** In-depth clinical decision support architecture, safety design, and outcomes verification.
* 📄 **[Scenario Analysis](file:///c:/Users/dhanu/Downloads/wecare-ai/SCENARIO_ANALYSIS.md):** Quantitative benchmarks and 10 representative clinical emergency cases.
* 📄 **[Demo Walkthrough](file:///c:/Users/dhanu/Downloads/wecare-ai/DEMO_WALKTHROUGH.md):** Step-by-step evaluator scripts for testing live scenarios, voice recognition, and edge cases.
* 📄 **[API Contract](file:///c:/Users/dhanu/Downloads/wecare-ai/backend/API_CONTRACT.md):** Full REST API schema specifications and payloads.

---

## 🛡️ License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

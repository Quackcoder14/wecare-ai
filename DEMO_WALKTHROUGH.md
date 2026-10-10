# WeCare.AI — Live Demonstration & Evaluation Walkthrough

This document provides an end-to-end evaluation script and demonstration guide for evaluators, triage nurses, and engineers reviewing the **WeCare.AI Emergency Triage Decision Support System**.

---

## 1. Quick Verification & Prerequisites

Ensure both the backend API and frontend dev server are active:
* **Frontend Application:** `http://localhost:5173`
* **Backend API Documentation:** `http://localhost:8000/docs`
* **Automated Test Suite Status:** `python -m pytest backend/tests/` (188 passed)

---

## 2. Demonstration Scenarios

### Scenario 1: Immediate Resuscitation Patient (RED)

**Clinical Objective:** Demonstrate that severe vital derangements trigger immediate RED classification, queue elevation to #1, and emergency visual alerting.

1. Navigate to `http://localhost:5173` and click **"New Patient Intake"** (or **"+ Register Patient"**).
2. **Step 1 — Basic Information:**
   * Name: `Vikram Patel`
   * Age: `54`
   * Gender: `Male`
   * Preferred Language: `English`
   * Click **"Next: Vitals"**.
3. **Step 2 — Vitals Capture:**
   * Heart Rate: Slide or enter **`138 bpm`** (Critical Tachycardia)
   * Respiratory Rate: Slide or enter **`34 /min`** (Critical Tachypnea)
   * Oxygen Saturation (SpO₂): Slide or enter **`86%`** (Severe Hypoxia)
   * Systolic Blood Pressure: Slide or enter **`82 mmHg`** (Shock Hypotension)
   * Temperature: Slide or enter **`37.0 °C`**
   * Observe how the slider tracks visually shift into the red alert range!
   * Click **"Next: Symptoms"**.
4. **Step 3 — Symptoms Selection:**
   * Select: **`Severe Chest Pain`** and **`Shortness of Breath`**.
   * Click **"Next: Medical History"**.
5. **Step 4 — Medical History:**
   * Select: **`Hypertension`** and **`Coronary Artery Disease`**.
   * Click **"Next: Review"**.
6. **Step 5 — Review & Confirm:**
   * Verify the structured overview summary card.
   * Click **"Submit Assessment"**.
7. **Expected Result:**
   * The Assessment Result page displays an unmistakable **RED (Resuscitation)** badge.
   * Rationale list highlights: `SpO2 < 90%`, `Respiratory Rate > 30`, `Systolic BP < 90 mmHg`.
   * Return to the **Queue Dashboard**: Vikram Patel is automatically ranked at **Position #1** in the queue with a high-priority red indicator.

---

### Scenario 2: Multilingual Speech-to-Text Intake

**Clinical Objective:** Demonstrate the hands-free multilingual voice intake for regional Indian languages (Hindi, Tamil, Telugu, English).

1. Click **"New Patient Intake"**.
2. **Step 1 — Basic Information:**
   * Name: `Lakshmi Narayanan`
   * Age: `42`
   * Gender: `Female`
   * Preferred Language: Select **`Tamil (தமிழ்)`** or **`Hindi (हिन्दी)`**.
   * Click **"Next: Vitals"**.
3. **Step 2 — Vitals:**
   * Set normal vitals: HR: `82 bpm`, RR: `18 /min`, SpO₂: `98%`, SBP: `122 mmHg`, Temp: `36.8 °C`.
   * Click **"Next: Symptoms"**.
4. **Step 3 — Voice Recording:**
   * Locate the **"Click to Speak"** rounded microphone button.
   * Click it to record or speak your symptoms (e.g., *"chest pain and severe cough"* or Tamil *"நெஞ்சு வலி"*).
   * Notice:
     1. Live transcript is transcribed into the transcript text box.
     2. The transcript is editable by the triage nurse.
     3. Keywords automatically check off the matching symptoms in the checkbox grid!
5. Complete medical history and submit.

---

### Scenario 3: Pediatric Safety Safeguard (< 12 Years Old)

**Clinical Objective:** Verify that adult triage criteria cannot be dangerously applied to pediatric patients.

1. Click **"New Patient Intake"**.
2. **Step 1 — Basic Information:**
   * Name: `Aarav Sharma`
   * Age: **`8`** (Pediatric patient)
   * Click **"Next: Vitals"**.
3. **Step 2 — Vitals & Submission:**
   * Enter HR: `110 bpm` (Normal for an 8-year-old child, but tachycardia in adults).
   * Submit the assessment.
4. **Expected Result:**
   * Result page flags **`OUT_OF_SCOPE`**.
   * Explicit safeguard note: *"Patient age 8 is below the WHO IITT adult/adolescent threshold of 12 years. Automatic adult criteria disabled. Please route to Pediatric Emergency Department protocol."*

---

### Scenario 4: Missing Vitals / Review Required Guardrail

**Clinical Objective:** Verify that the system never assumes missing vital signs are "normal."

1. Register a patient without filling out Blood Pressure or SpO₂.
2. Submit the assessment.
3. **Expected Result:**
   * Acuity result is marked with **`REVIEW_REQUIRED`**.
   * Prominently displays: *"Missing Critical Measurements: SpO₂, Systolic BP"*.
   * Dashboard displays a review required badge so that nursing staff verify the patient's vitals before queue prioritization.

---

### Scenario 5: Dynamic Clinical Reassessment & Escalation

**Clinical Objective:** Show that when a patient in the waiting room deteriorates, reassessment moves them up the queue with full audit history.

1. Locate a previously registered `GREEN` or `YELLOW` patient in the **Emergency Queue**.
2. Click on the patient row to view **Patient Details**.
3. Click the **"Reassess Patient"** button.
4. Update the vital signs to show clinical deterioration:
   * Drop SpO₂ from `97%` down to `87%`.
   * Increase Heart Rate to `134 bpm`.
5. Click **"Submit Reassessment"**.
6. **Expected Result:**
   * A new assessment record is appended to the patient's history (previous assessment remains intact in the audit trail).
   * Acuity instantly shifts to **RED**.
   * In the Queue Dashboard, the patient is immediately promoted to the top of the queue.

---

### Scenario 6: Clinician Acknowledge Workflow

**Clinical Objective:** Close the clinical decision loop by acknowledging urgent admissions.

1. In the Queue Dashboard, locate any urgent patient marked with **`Pending Review`**.
2. Click **"Acknowledge"**.
3. The status immediately updates to **`Acknowledged`**, with the clinician ID and timestamp recorded in the backend database.

---

## 3. Running Automated Test Verification

To run all 188 automated unit, API, schema, and clinical rules tests in your terminal:

```bash
cd backend
python -m pytest tests/ -v
```

**Expected Test Output:**
```
188 passed in 7.51s
```
* Coverage covers all 40+ WHO IITT criteria, boundary tests, edge cases, and API routes.

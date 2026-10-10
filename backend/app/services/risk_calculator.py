"""
WeCare.AI Clinical Risk Calculator

Calculates a comprehensive 0-100 numerical risk score, risk level (LOW/MEDIUM/HIGH),
factor contribution percentages (summing to 100%), recommended hospital department,
and confidence score based on patient vital signs, symptoms, and medical history.
"""
from typing import Dict, Any, List, Optional


def calculate_clinical_risk(
    patient_data: Dict[str, Any],
    acuity: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calculate clinical risk score and breakdown from patient clinical findings.
    """
    vitals = patient_data.get("vitals") or {}
    symptoms = patient_data.get("symptoms") or []
    medical_history = patient_data.get("medical_history") or ""
    age = patient_data.get("age", 30)

    # Convert symptom list to lower-case set
    symptom_set = {str(s).strip().lower() for s in symptoms if str(s).strip()}
    history_str = str(medical_history).lower()

    factors: List[Dict[str, Any]] = []

    # 1. Blood Pressure evaluation
    sbp = vitals.get("systolic_bp_mmhg")
    dbp = vitals.get("diastolic_bp_mmhg")
    bp_points = 0
    bp_reason = ""
    if sbp is not None or dbp is not None:
        sbp_val = float(sbp) if sbp is not None else 120.0
        dbp_val = float(dbp) if dbp is not None else 80.0

        if sbp_val >= 180 or dbp_val >= 120:
            bp_points = 35
            bp_reason = "High Blood Pressure (Severe)"
        elif sbp_val >= 140 or dbp_val >= 90:
            bp_points = 22
            bp_reason = "High Blood Pressure"
        elif sbp_val < 90 or dbp_val < 60:
            bp_points = 28
            bp_reason = "Low Blood Pressure (Hypotension)"
        elif sbp_val >= 130 or dbp_val >= 85:
            bp_points = 12
            bp_reason = "Elevated Blood Pressure"

    if bp_points > 0:
        factors.append({"name": bp_reason, "points": bp_points, "category": "vitals"})

    # 2. Heart Rate evaluation
    hr = vitals.get("heart_rate_bpm")
    hr_points = 0
    hr_reason = ""
    if hr is not None:
        hr_val = float(hr)
        if hr_val > 130:
            hr_points = 32
            hr_reason = "Abnormal Heart Rate (Severe Tachycardia)"
        elif hr_val > 100:
            hr_points = 20
            hr_reason = "Abnormal Heart Rate"
        elif hr_val < 50:
            hr_points = 30
            hr_reason = "Abnormal Heart Rate (Severe Bradycardia)"
        elif hr_val < 60:
            hr_points = 14
            hr_reason = "Abnormal Heart Rate (Bradycardia)"

    if hr_points > 0:
        factors.append({"name": hr_reason, "points": hr_points, "category": "vitals"})

    # 3. Temperature evaluation
    temp = vitals.get("temperature_c")
    temp_points = 0
    temp_reason = ""
    if temp is not None:
        temp_val = float(temp)
        if temp_val >= 39.0:
            temp_points = 28
            temp_reason = "Abnormal Temperature (High Fever)"
        elif temp_val >= 38.0:
            temp_points = 18
            temp_reason = "Abnormal Temperature"
        elif temp_val < 35.5:
            temp_points = 26
            temp_reason = "Abnormal Temperature (Hypothermia)"

    if temp_points > 0:
        factors.append({"name": temp_reason, "points": temp_points, "category": "vitals"})

    # 4. SpO2 evaluation
    spo2 = vitals.get("spo2_percent")
    spo2_points = 0
    spo2_reason = ""
    if spo2 is not None:
        spo2_val = float(spo2)
        if spo2_val < 90:
            spo2_points = 35
            spo2_reason = "Critical Oxygen Saturation (<90%)"
        elif spo2_val < 95:
            spo2_points = 22
            spo2_reason = "Low Oxygen Saturation (<95%)"

    if spo2_points > 0:
        factors.append({"name": spo2_reason, "points": spo2_points, "category": "vitals"})

    # 5. Respiratory Rate evaluation
    rr = vitals.get("respiratory_rate_per_min")
    rr_points = 0
    rr_reason = ""
    if rr is not None:
        rr_val = float(rr)
        if rr_val > 30:
            rr_points = 28
            rr_reason = "Severe Respiratory Rate (>30/min)"
        elif rr_val > 22:
            rr_points = 16
            rr_reason = "Elevated Respiratory Rate"
        elif rr_val < 10:
            rr_points = 28
            rr_reason = "Depressed Respiratory Rate (<10/min)"

    if rr_points > 0:
        factors.append({"name": rr_reason, "points": rr_points, "category": "vitals"})

    # 6. High-acuity Symptoms
    urgent_symptom_map = [
        ({"chest pain"}, "Chest Pain / Cardiac Symptoms", 26),
        ({"difficulty breathing", "severe shortness of breath"}, "Respiratory Distress", 26),
        ({"severe abdominal pain", "acute abdomen"}, "Severe Abdominal Pain", 22),
        ({"severe headache"}, "Severe Neurological Headache", 18),
        ({"bleeding", "hemorrhage"}, "Active Bleeding", 20),
        ({"loss of consciousness", "dizziness", "faint", "numbness"}, "Neurological Symptoms", 14),
    ]

    for symp_keys, label, pts in urgent_symptom_map:
        if any(k in symptom_set or k in " ".join(symptom_set) for k in symp_keys):
            factors.append({"name": label, "points": pts, "category": "symptoms"})

    # General symptom burden
    other_symptoms_count = len(symptoms)
    if other_symptoms_count >= 3 and not any(f["category"] == "symptoms" for f in factors):
        factors.append({
            "name": f"Multiple Acute Symptoms ({other_symptoms_count} reported)",
            "points": min(20, other_symptoms_count * 4),
            "category": "symptoms"
        })

    # 7. Medical History impact
    chronic_conditions = [
        ("heart disease", "Pre-existing Heart Disease", 18),
        ("copd", "Chronic Respiratory Disease (COPD)", 16),
        ("asthma", "Pre-existing Asthma", 14),
        ("diabetes", "Pre-existing Diabetes Mellitus", 12),
        ("hypertension", "Pre-existing Chronic Hypertension", 12),
        ("cancer", "Active / Past Malignancy", 14),
        ("kidney", "Chronic Kidney Disease", 14),
        ("stroke", "Cerebrovascular History", 15),
    ]
    for key, label, pts in chronic_conditions:
        if key in history_str:
            factors.append({"name": label, "points": pts, "category": "history"})

    # 8. Age risk modifier
    if (age >= 65 or age < 5) and len(factors) > 0:
        factors.append({"name": f"Age Vulnerability ({age} yrs)", "points": 10, "category": "age"})

    # Calculate total points
    total_raw_points = sum(f["points"] for f in factors)

    # Normalize contributing factors percentage so they sum to 100%
    contributing_factors: List[Dict[str, Any]] = []
    if total_raw_points > 0:
        allocated = 0.0
        for i, f in enumerate(factors):
            if i == len(factors) - 1:
                pct = round(100.0 - allocated, 1)
            else:
                pct = round((f["points"] / total_raw_points) * 100.0, 1)
                allocated += pct
            contributing_factors.append({
                "name": f["name"],
                "percentage": pct,
                "raw_percentage": int(round(pct)),
            })
    else:
        # Default baseline if all normal
        contributing_factors = [
            {"name": "Vital Signs Normal Range", "percentage": 100.0, "raw_percentage": 100}
        ]

    # Calculate 0-100 score
    if acuity == "red" or acuity == "RED":
        risk_score = min(98, max(68, int(total_raw_points * 0.75 + 45)))
        risk_level = "HIGH"
    elif acuity == "yellow" or acuity == "YELLOW":
        risk_score = min(66, max(35, int(total_raw_points * 0.65 + 22)))
        risk_level = "MEDIUM"
    elif acuity == "green" or acuity == "GREEN":
        risk_score = min(33, max(10, int(total_raw_points * 0.4 + 8)))
        risk_level = "LOW"
    else:
        if total_raw_points >= 40:
            risk_score = min(98, max(67, int(total_raw_points * 0.75 + 30)))
            risk_level = "HIGH"
        elif total_raw_points >= 18:
            risk_score = min(66, max(34, int(total_raw_points * 0.65 + 16)))
            risk_level = "MEDIUM"
        else:
            risk_score = min(33, max(8, int(total_raw_points * 0.5 + 8)))
            risk_level = "LOW"

    # Department Recommendation
    recommended_dept = "General Medicine & Outpatient"
    symp_lower = " ".join(symptom_set)
    if "chest pain" in symp_lower or (sbp and float(sbp) > 170) or "heart disease" in history_str:
        recommended_dept = "Cardiology & Emergency Care"
    elif "difficulty breathing" in symp_lower or (spo2 and float(spo2) < 93) or (rr and float(rr) > 26) or "copd" in history_str:
        recommended_dept = "Pulmonology & Respiratory Medicine"
    elif "abdominal pain" in symp_lower or "vomiting" in symp_lower:
        recommended_dept = "Gastroenterology & Acute Surgical Assessment"
    elif "headache" in symp_lower or "numbness" in symp_lower or "stroke" in history_str:
        recommended_dept = "Neurology & Emergency Care"
    elif risk_level == "HIGH":
        recommended_dept = "Emergency Medicine & Trauma Center"
    elif risk_level == "MEDIUM":
        recommended_dept = "Internal Medicine & Urgent Care"
    else:
        recommended_dept = "General Medicine & Primary Care"

    # Confidence calculation (based on vital parameters completed)
    vitals_filled = sum(1 for k in ["heart_rate_bpm", "respiratory_rate_per_min", "spo2_percent", "systolic_bp_mmhg", "temperature_c"] if vitals.get(k) is not None)
    confidence = min(98, max(85, 84 + (vitals_filled * 2) + (3 if symptoms else 0) + (3 if medical_history else 0)))

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "contributing_factors": contributing_factors,
        "recommended_department": recommended_dept,
        "confidence": confidence,
    }

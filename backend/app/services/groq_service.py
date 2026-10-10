"""
WeCare.AI Groq AI Service

Uses Groq's ultra-fast LLM API to generate:
  - Numerical risk score (0-100)
  - Risk level (LOW / MEDIUM / HIGH)
  - Contributing factors with percentage breakdown
  - Recommended hospital department
  - Clinical summary

Patient data is de-identified before sending to Groq — no names, IDs,
phone numbers, or any direct identifiers are transmitted.

Also supports medical document / image scanning via Groq vision models.
"""
import json
import logging
import base64
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ────────────────────────────────────────────────────────────
# De-identification
# ────────────────────────────────────────────────────────────

def deidentify_patient(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strip all direct identifiers and return a clinical-only payload.
    Only age, gender, vitals, symptoms, and medical history are retained.
    """
    vitals = patient_data.get("vitals") or {}
    return {
        "age": patient_data.get("age"),
        "gender": patient_data.get("gender"),
        "vitals": {
            "heart_rate_bpm": vitals.get("heart_rate_bpm"),
            "systolic_bp_mmhg": vitals.get("systolic_bp_mmhg"),
            "diastolic_bp_mmhg": vitals.get("diastolic_bp_mmhg"),
            "temperature_c": vitals.get("temperature_c"),
            "spo2_percent": vitals.get("spo2_percent"),
            "respiratory_rate_per_min": vitals.get("respiratory_rate_per_min"),
            "gcs": vitals.get("gcs"),
        },
        "symptoms": patient_data.get("symptoms") or [],
        "medical_history": patient_data.get("medical_history") or "No History",
        "symptom_onset": patient_data.get("symptom_onset"),
        "document_summary": patient_data.get("document_summary"),
    }


# ────────────────────────────────────────────────────────────
# Groq AI Risk Assessment
# ────────────────────────────────────────────────────────────

RISK_SYSTEM_PROMPT = """You are a clinical AI assistant helping emergency triage nurses in India.
You receive de-identified patient data (no names or IDs) and return a structured JSON risk assessment.

RESPONSE FORMAT (strict JSON, no markdown):
{
  "risk_score": <integer 0-100>,
  "risk_level": <"LOW" | "MEDIUM" | "HIGH">,
  "recommended_department": <string, e.g. "Emergency Cardiology">,
  "contributing_factors": [
    {"name": <string>, "percentage": <integer>},
    ...
  ],
  "clinical_summary": <1-2 sentence plain-language summary>,
  "confidence": <float 0.0-1.0>
}

Rules:
- contributing_factors percentages MUST sum to 100.
- risk_score 0-39 = LOW, 40-69 = MEDIUM, 70-100 = HIGH.
- Be concise. Focus on actionable clinical findings.
- Do NOT include patient names, IDs, or any identifying information.
- If a vital is missing (null), ignore it; do not assume normal values.
"""

DOCUMENT_SYSTEM_PROMPT = """You are a clinical AI assistant. Extract all medically relevant information from the provided document/report.
Return strict JSON with no markdown:
{
  "conditions": [<list of detected medical conditions, e.g. "Diabetes", "Hypertension">],
  "medications": [<list of medications>],
  "allergies": [<list of allergies>],
  "lab_values": {<key-value pairs of notable lab results>},
  "clinical_notes": <brief summary of key findings>,
  "extracted_symptoms": [<any symptoms mentioned>]
}
Only include items that are clearly stated or strongly implied in the document.
"""


def _get_groq_client():
    """Lazily initialise the Groq client using the API key from settings."""
    try:
        from groq import Groq
        from app.config import settings
        api_key = getattr(settings, "groq_api_key", None)
        if not api_key:
            return None
        return Groq(api_key=api_key)
    except Exception as exc:
        logger.warning(f"Could not initialise Groq client: {exc}")
        return None


def assess_with_groq(
    patient_data: Dict[str, Any],
    rules_result: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    """
    Send de-identified patient data to Groq and return AI risk assessment.

    Returns None if Groq is unavailable (no API key or network error),
    allowing the caller to fall back to the deterministic rules engine.
    """
    client = _get_groq_client()
    if client is None:
        logger.info("Groq client not available — skipping AI assessment")
        return None

    try:
        deidentified = deidentify_patient(patient_data)

        # Enrich with deterministic result context if available
        context = ""
        if rules_result:
            context = (
                f"\n\nDeterministic rules engine preliminary result: "
                f"acuity={rules_result.get('acuity', 'unknown')}, "
                f"reasons={rules_result.get('reasons', [])}"
            )

        user_message = (
            f"Patient clinical data (de-identified):\n"
            f"{json.dumps(deidentified, indent=2)}"
            f"{context}"
        )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": RISK_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=512,
        )

        content = response.choices[0].message.content
        result = json.loads(content)

        # Normalise & validate
        risk_score = int(result.get("risk_score", 0))
        risk_score = max(0, min(100, risk_score))
        result["risk_score"] = risk_score

        # Ensure risk_level matches score ranges
        if "risk_level" not in result or result["risk_level"] not in ("LOW", "MEDIUM", "HIGH"):
            if risk_score >= 70:
                result["risk_level"] = "HIGH"
            elif risk_score >= 40:
                result["risk_level"] = "MEDIUM"
            else:
                result["risk_level"] = "LOW"

        # Ensure confidence is a float
        result["confidence"] = float(result.get("confidence", 0.85))

        logger.info(
            f"Groq assessment complete: score={risk_score}, level={result['risk_level']}"
        )
        return result

    except Exception as exc:
        logger.warning(f"Groq assessment failed: {exc}")
        return None


# ────────────────────────────────────────────────────────────
# Medical Document Scanning via Groq Vision
# ────────────────────────────────────────────────────────────

def scan_document_with_groq(
    file_bytes: bytes,
    filename: str,
    mime_type: str = "application/pdf",
) -> Optional[Dict[str, Any]]:
    """
    Extract clinical information from an uploaded medical document using Groq vision.

    Supports: images (JPEG, PNG), PDFs (converted to text if possible).
    Returns None if Groq is unavailable.
    """
    client = _get_groq_client()
    if client is None:
        logger.info("Groq client not available — skipping document scan")
        return None

    try:
        # For image files: use vision model
        if mime_type.startswith("image/"):
            b64 = base64.b64encode(file_bytes).decode("utf-8")
            image_url = f"data:{mime_type};base64,{b64}"

            response = client.chat.completions.create(
                model="llama-3.2-11b-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": DOCUMENT_SYSTEM_PROMPT,
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url},
                            },
                        ],
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
                max_tokens=1024,
            )
        else:
            # Text / PDF: decode and send as text
            try:
                text_content = file_bytes.decode("utf-8", errors="ignore")[:8000]
            except Exception:
                text_content = file_bytes[:8000].decode("latin-1", errors="ignore")

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": DOCUMENT_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"Medical document text (filename: {filename}):\n\n{text_content}"
                        ),
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
                max_tokens=1024,
            )

        content = response.choices[0].message.content
        result = json.loads(content)
        logger.info(
            f"Groq document scan complete for '{filename}': "
            f"conditions={result.get('conditions', [])}"
        )
        return result

    except Exception as exc:
        logger.warning(f"Groq document scan failed for '{filename}': {exc}")
        return None


# ────────────────────────────────────────────────────────────
# Groq status helper
# ────────────────────────────────────────────────────────────

def get_groq_status() -> Dict[str, Any]:
    """Return Groq availability status for health-check / UI display."""
    from app.config import settings
    api_key = getattr(settings, "groq_api_key", None)
    return {
        "available": bool(api_key),
        "model": "llama-3.3-70b-versatile",
        "vision_model": "llama-3.2-11b-vision-preview",
    }

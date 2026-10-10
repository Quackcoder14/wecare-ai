"""
WeCare.AI API Tests - Assessments

Integration tests for assessment endpoints.
"""
import pytest
from fastapi.testclient import TestClient


class TestCreateAssessment:
    """Tests for POST /api/assessments"""

    def test_assess_red_patient(self, client, sample_patient_data):
        """Assess patient with RED criteria."""
        # Create patient with RED vital signs
        red_data = {
            "age": 50,
            "symptoms": ["Chest pain"],
            "vitals": {
                "heart_rate_bpm": 140,
                "respiratory_rate_per_min": 35,
                "spo2_percent": 88,
                "systolic_bp_mmhg": 85,
                "temperature_c": 40.0,
            },
            "preferred_language": "en",
            "input_method": "manual",
        }
        create_resp = client.post("/api/patients", json=red_data)
        patient_id = create_resp.json()["patient_id"]

        response = client.post("/api/assessments", json={"patient_id": patient_id})
        assert response.status_code == 201
        data = response.json()
        assert data["acuity"] == "red"
        assert data["review_required"] is True
        assert len(data["reasons"]) > 0
        assert len(data["matched_criteria"]) > 0
        assert "assessment_id" in data
        assert "rules_version" in data

    def test_assess_yellow_patient(self, client, sample_patient_data_yellow):
        """Assess patient with YELLOW criteria."""
        create_resp = client.post("/api/patients", json=sample_patient_data_yellow)
        patient_id = create_resp.json()["patient_id"]

        response = client.post("/api/assessments", json={"patient_id": patient_id})
        assert response.status_code == 201
        data = response.json()
        assert data["acuity"] == "yellow"
        assert data["review_required"] is True

    def test_assess_green_patient(self, client, sample_patient_data_green):
        """Assess patient with GREEN criteria."""
        create_resp = client.post("/api/patients", json=sample_patient_data_green)
        patient_id = create_resp.json()["patient_id"]

        response = client.post("/api/assessments", json={"patient_id": patient_id})
        assert response.status_code == 201
        data = response.json()
        # With normal vitals and no RED/YELLOW findings, should be GREEN
        assert data["acuity"] == "green"
        assert data["review_required"] is False

    def test_assess_insufficient_data(self, client):
        """Assess patient with no symptoms or vitals -> UNASSESSED."""
        create_resp = client.post("/api/patients", json={
            "age": 45,
            "symptoms": [],
            "preferred_language": "en",
            "input_method": "manual",
        })
        patient_id = create_resp.json()["patient_id"]

        response = client.post("/api/assessments", json={"patient_id": patient_id})
        assert response.status_code == 201
        data = response.json()
        assert data["acuity"] == "unassessed"
        assert data["assessment_status"] == "insufficient_data"
        assert data["review_required"] is True
        assert len(data["missing_information"]) > 0

    def test_assess_age_out_of_scope(self, client):
        """Assess patient under 12 -> AGE_OUT_OF_SCOPE error."""
        create_resp = client.post("/api/patients", json={
            "age": 10,
            "symptoms": ["Fever"],
            "preferred_language": "en",
            "input_method": "manual",
        })
        patient_id = create_resp.json()["patient_id"]

        response = client.post("/api/assessments", json={"patient_id": patient_id})
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "AGE_OUT_OF_SCOPE"

    def test_assess_nonexistent_patient(self, client):
        """Assess non-existent patient -> 404."""
        response = client.post("/api/assessments", json={"patient_id": "NONEXISTENT"})
        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "NOT_FOUND"

    def test_assess_returns_all_fields(self, client, sample_patient_data_red_vitals):
        """Assessment response has all required fields."""
        create_resp = client.post("/api/patients", json=sample_patient_data_red_vitals)
        patient_id = create_resp.json()["patient_id"]

        response = client.post("/api/assessments", json={"patient_id": patient_id})
        assert response.status_code == 201
        data = response.json()

        required_fields = [
            "assessment_id", "patient_id", "acuity", "reasons",
            "missing_information", "review_required", "rules_version", "assessed_at"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"


class TestAcknowledgeAssessment:
    """Tests for POST /api/assessments/{assessment_id}/acknowledge"""

    def test_acknowledge_assessment(self, client, sample_patient_data_red_vitals):
        """Acknowledge an assessment requiring review."""
        create_resp = client.post("/api/patients", json=sample_patient_data_red_vitals)
        patient_id = create_resp.json()["patient_id"]

        assess_resp = client.post("/api/assessments", json={"patient_id": patient_id})
        assessment_id = assess_resp.json()["assessment_id"]

        response = client.post(f"/api/assessments/{assessment_id}/acknowledge", json={
            "assessment_id": assessment_id,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "acknowledged_at" in data

    def test_acknowledge_idempotent(self, client, sample_patient_data_red_vitals):
        """Acknowledging twice is idempotent."""
        create_resp = client.post("/api/patients", json=sample_patient_data_red_vitals)
        patient_id = create_resp.json()["patient_id"]

        assess_resp = client.post("/api/assessments", json={"patient_id": patient_id})
        assessment_id = assess_resp.json()["assessment_id"]

        # First acknowledgement
        client.post(f"/api/assessments/{assessment_id}/acknowledge", json={
            "assessment_id": assessment_id,
        })
        # Second acknowledgement
        response = client.post(f"/api/assessments/{assessment_id}/acknowledge", json={
            "assessment_id": assessment_id,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_acknowledge_not_found(self, client):
        """Acknowledge non-existent assessment -> 404."""
        response = client.post("/api/assessments/NONEXISTENT/acknowledge", json={
            "assessment_id": "NONEXISTENT",
        })
        assert response.status_code == 404


class TestGetAssessment:
    """Tests for GET /api/assessments/{assessment_id}"""

    def test_get_assessment(self, client, sample_patient_data):
        """Get assessment by ID."""
        create_resp = client.post("/api/patients", json=sample_patient_data)
        patient_id = create_resp.json()["patient_id"]

        assess_resp = client.post("/api/assessments", json={"patient_id": patient_id})
        assessment_id = assess_resp.json()["assessment_id"]

        response = client.get(f"/api/assessments/{assessment_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["assessment_id"] == assessment_id
        assert data["patient_id"] == patient_id

    def test_get_assessment_not_found(self, client):
        """Get non-existent assessment -> 404."""
        response = client.get("/api/assessments/NONEXISTENT")
        assert response.status_code == 404
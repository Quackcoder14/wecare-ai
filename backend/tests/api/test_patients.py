"""
WeCare.AI API Tests - Patients

Integration tests for patient endpoints.
"""
import pytest
from fastapi.testclient import TestClient


class TestCreatePatient:
    """Tests for POST /api/patients"""

    def test_create_patient_minimal(self, client):
        """Create patient with minimal required fields."""
        response = client.post("/api/patients", json={
            "age": 45,
            "symptoms": ["Chest pain"],
            "preferred_language": "en",
            "input_method": "manual",
        })
        assert response.status_code == 201
        data = response.json()
        assert "patient_id" in data
        assert data["age"] == 45
        assert data["symptoms"] == ["Chest pain"]
        assert data["preferred_language"] == "en"
        assert data["input_method"] == "manual"
        assert "created_at" in data

    def test_create_patient_with_vitals(self, client):
        """Create patient with vital signs."""
        response = client.post("/api/patients", json={
            "age": 50,
            "symptoms": ["Shortness of breath"],
            "vitals": {
                "heart_rate_bpm": 110,
                "respiratory_rate_per_min": 25,
                "spo2_percent": 94,
                "systolic_bp_mmhg": 120,
                "temperature_c": 37.5,
            },
            "preferred_language": "ta",
            "input_method": "voice",
            "transcript": "Patient reports difficulty breathing",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["vitals"]["heart_rate_bpm"] == 110
        assert data["preferred_language"] == "ta"
        assert data["input_method"] == "voice"
        assert data["transcript"] == "Patient reports difficulty breathing"

    def test_create_patient_age_validation_positive(self, client):
        """Age must be positive."""
        response = client.post("/api/patients", json={
            "age": 0,
            "symptoms": ["Test"],
            "preferred_language": "en",
            "input_method": "manual",
        })
        assert response.status_code == 422

    def test_create_patient_age_validation_max(self, client):
        """Age must be <= 150."""
        response = client.post("/api/patients", json={
            "age": 151,
            "symptoms": ["Test"],
            "preferred_language": "en",
            "input_method": "manual",
        })
        assert response.status_code == 422

    def test_create_patient_missing_required(self, client):
        """Missing required fields should return 422."""
        response = client.post("/api/patients", json={
            "age": 45,
            # missing preferred_language and input_method
        })
        assert response.status_code == 422

    def test_create_patient_invalid_language(self, client):
        """Invalid language code should return 422."""
        response = client.post("/api/patients", json={
            "age": 45,
            "symptoms": ["Test"],
            "preferred_language": "fr",  # Not supported
            "input_method": "manual",
        })
        assert response.status_code == 422

    def test_create_patient_invalid_input_method(self, client):
        """Invalid input method should return 422."""
        response = client.post("/api/patients", json={
            "age": 45,
            "symptoms": ["Test"],
            "preferred_language": "en",
            "input_method": "auto",  # Not supported
        })
        assert response.status_code == 422


class TestGetPatient:
    """Tests for GET /api/patients/{patient_id}"""

    def test_get_patient_exists(self, client, sample_patient_data):
        """Get existing patient returns data with assessments."""
        # Create patient
        create_resp = client.post("/api/patients", json=sample_patient_data)
        patient_id = create_resp.json()["patient_id"]

        # Get patient
        response = client.get(f"/api/patients/{patient_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["patient_id"] == patient_id
        assert data["age"] == sample_patient_data["age"]
        assert "assessments" in data
        assert isinstance(data["assessments"], list)

    def test_get_patient_not_found(self, client):
        """Get non-existent patient returns 404."""
        response = client.get("/api/patients/NONEXISTENT")
        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "NOT_FOUND"

    def test_get_patient_with_assessments(self, client, sample_patient_data):
        """Patient with assessments returns them in history."""
        # Create patient
        create_resp = client.post("/api/patients", json=sample_patient_data)
        patient_id = create_resp.json()["patient_id"]

        # Create assessment
        client.post("/api/assessments", json={"patient_id": patient_id})

        # Get patient
        response = client.get(f"/api/patients/{patient_id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data["assessments"]) == 1
        assert "assessment_id" in data["assessments"][0]


class TestUpdatePatient:
    """Tests for PATCH /api/patients/{patient_id}"""

    def test_update_patient_symptoms(self, client, sample_patient_data):
        """Update patient symptoms."""
        create_resp = client.post("/api/patients", json=sample_patient_data)
        patient_id = create_resp.json()["patient_id"]

        response = client.patch(f"/api/patients/{patient_id}", json={
            "symptoms": ["Chest pain", "Shortness of breath", "Diaphoresis"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "Diaphoresis" in data["symptoms"]

    def test_update_patient_vitals(self, client, sample_patient_data):
        """Update patient vital signs."""
        create_resp = client.post("/api/patients", json=sample_patient_data)
        patient_id = create_resp.json()["patient_id"]

        response = client.patch(f"/api/patients/{patient_id}", json={
            "vitals": {
                "heart_rate_bpm": 120,
                "spo2_percent": 90,
            }
        })
        assert response.status_code == 200
        data = response.json()
        assert data["vitals"]["heart_rate_bpm"] == 120
        assert data["vitals"]["spo2_percent"] == 90

    def test_update_patient_not_found(self, client):
        """Update non-existent patient returns 404."""
        response = client.patch("/api/patients/NONEXISTENT", json={
            "symptoms": ["Updated"]
        })
        assert response.status_code == 404


class TestReassessPatient:
    """Tests for POST /api/patients/{patient_id}/reassess"""

    def test_reassess_creates_new_assessment(self, client, sample_patient_data):
        """Reassessment creates new assessment, preserves history."""
        create_resp = client.post("/api/patients", json=sample_patient_data)
        patient_id = create_resp.json()["patient_id"]

        # Initial assessment
        client.post("/api/assessments", json={"patient_id": patient_id})

        # Reassess with new vitals
        response = client.post(f"/api/patients/{patient_id}/reassess", json={
            "patient_id": patient_id,
            "vitals": {
                "heart_rate_bpm": 130,
                "respiratory_rate_per_min": 30,
                "spo2_percent": 88,
                "systolic_bp_mmhg": 85,
                "temperature_c": 39.0,
            }
        })
        assert response.status_code == 200
        data = response.json()
        assert data["acuity"] == "red"  # New vitals should trigger RED

        # Verify history has both assessments
        get_resp = client.get(f"/api/patients/{patient_id}")
        assert len(get_resp.json()["assessments"]) == 2

    def test_reassess_not_found(self, client):
        """Reassess non-existent patient returns 404."""
        response = client.post("/api/patients/NONEXISTENT/reassess", json={
            "patient_id": "NONEXISTENT",
        })
        assert response.status_code == 404


class TestListPatients:
    """Tests for GET /api/patients"""

    def test_list_patients(self, client, sample_patient_data):
        """List patients returns paginated results."""
        client.post("/api/patients", json=sample_patient_data)
        response = client.get("/api/patients")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_list_patients_pagination(self, client, sample_patient_data):
        """List patients supports pagination."""
        for i in range(5):
            data = sample_patient_data.copy()
            data["age"] = 30 + i
            client.post("/api/patients", json=data)

        response = client.get("/api/patients?limit=2&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
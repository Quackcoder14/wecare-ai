"""
WeCare.AI API Tests - Queue

Integration tests for queue endpoints.
"""
import pytest
from fastapi.testclient import TestClient


class TestGetQueue:
    """Tests for GET /api/queue"""

    def test_queue_empty_initially(self, client):
        """Queue is empty initially."""
        response = client.get("/api/queue")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_queue_with_patients(self, client, sample_patient_data, sample_patient_data_yellow, sample_patient_data_green):
        """Queue shows patients with assessments ordered by acuity."""
        # Create RED patient
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
        red_resp = client.post("/api/patients", json=red_data)
        red_id = red_resp.json()["patient_id"]
        client.post("/api/assessments", json={"patient_id": red_id})

        # Create YELLOW patient
        yellow_resp = client.post("/api/patients", json=sample_patient_data_yellow)
        yellow_id = yellow_resp.json()["patient_id"]
        client.post("/api/assessments", json={"patient_id": yellow_id})

        # Create GREEN patient
        green_resp = client.post("/api/patients", json=sample_patient_data_green)
        green_id = green_resp.json()["patient_id"]
        client.post("/api/assessments", json={"patient_id": green_id})

        # Get queue
        response = client.get("/api/queue")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        items = data["items"]

        # Should be ordered: RED first, then YELLOW, then GREEN
        assert items[0]["acuity"] == "red"
        assert items[1]["acuity"] == "yellow"
        assert items[2]["acuity"] == "green"

        # Verify each item has required fields
        for item in items:
            assert "patient_id" in item
            assert "age" in item
            assert "acuity" in item
            assert "assessment_summary" in item
            assert "waiting_duration_seconds" in item
            assert "review_status" in item
            assert "latest_assessment_id" in item
            assert "created_at" in item

    def test_queue_review_status_pending(self, client, sample_patient_data_red_vitals):
        """Assessments requiring review show as pending."""
        create_resp = client.post("/api/patients", json=sample_patient_data_red_vitals)
        patient_id = create_resp.json()["patient_id"]
        client.post("/api/assessments", json={"patient_id": patient_id})

        response = client.get("/api/queue")
        items = response.json()["items"]
        assert len(items) == 1
        assert items[0]["review_status"] == "pending"

    def test_queue_review_status_acknowledged(self, client, sample_patient_data_red_vitals):
        """Acknowledged assessments show as acknowledged."""
        create_resp = client.post("/api/patients", json=sample_patient_data_red_vitals)
        patient_id = create_resp.json()["patient_id"]
        assess_resp = client.post("/api/assessments", json={"patient_id": patient_id})
        assessment_id = assess_resp.json()["assessment_id"]

        # Acknowledge
        client.post(f"/api/assessments/{assessment_id}/acknowledge", json={
            "assessment_id": assessment_id,
        })

        response = client.get("/api/queue")
        items = response.json()["items"]
        assert items[0]["review_status"] == "acknowledged"

    def test_queue_waiting_duration(self, client, sample_patient_data):
        """Waiting duration is calculated correctly."""
        create_resp = client.post("/api/patients", json=sample_patient_data)
        patient_id = create_resp.json()["patient_id"]
        client.post("/api/assessments", json={"patient_id": patient_id})

        response = client.get("/api/queue")
        items = response.json()["items"]
        assert items[0]["waiting_duration_seconds"] >= 0

    def test_queue_summary_endpoint(self, client, sample_patient_data, sample_patient_data_yellow, sample_patient_data_green):
        """Queue summary returns correct counts."""
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
        red_resp = client.post("/api/patients", json=red_data)
        red_id = red_resp.json()["patient_id"]
        client.post("/api/assessments", json={"patient_id": red_id})

        yellow_resp = client.post("/api/patients", json=sample_patient_data_yellow)
        yellow_id = yellow_resp.json()["patient_id"]
        client.post("/api/assessments", json={"patient_id": yellow_id})

        green_resp = client.post("/api/patients", json=sample_patient_data_green)
        green_id = green_resp.json()["patient_id"]
        client.post("/api/assessments", json={"patient_id": green_id})

        response = client.get("/api/queue/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert data["red"] == 1
        assert data["yellow"] == 1
        assert data["green"] == 1
        assert data["needs_review"] >= 2  # RED and YELLOW require review
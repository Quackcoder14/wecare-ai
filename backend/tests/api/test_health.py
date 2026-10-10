"""
WeCare.AI API Tests - Health

Integration tests for health endpoint.
"""
import pytest
from fastapi.testclient import TestClient


class TestHealthCheck:
    """Tests for GET /api/health"""

    def test_health_check_returns_ok(self, client):
        """Health check returns status ok."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["ok", "degraded"]
        assert "database" in data
        assert "clinical_rules" in data
        assert "speech" in data

    def test_health_check_database_status(self, client):
        """Health check reports database status."""
        response = client.get("/api/health")
        data = response.json()
        assert data["database"] in ["available", "unavailable"]

    def test_health_check_clinical_rules(self, client):
        """Health check reports clinical rules status."""
        response = client.get("/api/health")
        data = response.json()
        assert data["clinical_rules"]["configured"] is True
        assert "rules_version" in data["clinical_rules"]
        assert data["clinical_rules"]["rules_version"] is not None

    def test_health_check_speech_status(self, client):
        """Health check reports speech service status."""
        response = client.get("/api/health")
        data = response.json()
        assert "configured" in data["speech"]
        assert "available" in data["speech"]
        assert "supported_languages" in data["speech"]
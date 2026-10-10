"""
WeCare.AI Test Configuration

Shared pytest fixtures and configuration.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import create_app
from app.config import Settings


# Test database URL (in-memory SQLite for isolation)
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def test_settings():
    """Test settings with in-memory database."""
    return Settings(
        DATABASE_URL=TEST_DATABASE_URL,
        DATABASE_ECHO=False,
        DEBUG=True,
        ENVIRONMENT="test",
        SPEECH_TRANSCRIPTION_ENABLED=False,
    )


@pytest.fixture(scope="function")
def db_engine(test_settings):
    """Create test database engine."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a test database session with transaction rollback."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database dependency."""
    from fastapi.testclient import TestClient

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def sample_patient_data():
    """Sample patient data for testing."""
    return {
        "age": 45,
        "symptoms": ["Chest pain", "Shortness of breath"],
        "symptom_onset": "2 hours ago",
        "vitals": {
            "heart_rate_bpm": 112,
            "respiratory_rate_per_min": 28,
            "spo2_percent": 91,
            "systolic_bp_mmhg": 95,
            "temperature_c": 37.2,
        },
        "medical_history": "Hypertension, Type 2 Diabetes",
        "preferred_language": "en",
        "input_method": "manual",
        "transcript": None,
    }


@pytest.fixture
def sample_patient_data_yellow():
    """Sample patient data for yellow acuity."""
    return {
        "age": 34,
        "symptoms": ["Abdominal pain", "Nausea"],
        "symptom_onset": "4 hours ago",
        "vitals": {
            "heart_rate_bpm": 98,
            "respiratory_rate_per_min": 20,
            "spo2_percent": 98,
            "systolic_bp_mmhg": 118,
            "temperature_c": 38.1,
        },
        "medical_history": "None",
        "preferred_language": "ta",
        "input_method": "voice",
        "transcript": "Patient reports abdominal pain and nausea since morning",
    }


@pytest.fixture
def sample_patient_data_green():
    """Sample patient data for green acuity."""
    return {
        "age": 25,
        "symptoms": ["Minor laceration"],
        "symptom_onset": "30 minutes ago",
        "vitals": {
            "heart_rate_bpm": 78,
            "respiratory_rate_per_min": 16,
            "spo2_percent": 99,
            "systolic_bp_mmhg": 125,
            "temperature_c": 36.8,
        },
        "medical_history": "None",
        "preferred_language": "en",
        "input_method": "manual",
        "transcript": None,
    }


@pytest.fixture
def sample_patient_data_red_vitals():
    """Sample patient with RED vital signs only."""
    return {
        "age": 50,
        "symptoms": [],
        "symptom_onset": None,
        "vitals": {
            "heart_rate_bpm": 140,
            "respiratory_rate_per_min": 35,
            "spo2_percent": 88,
            "systolic_bp_mmhg": 85,
            "temperature_c": 40.0,
        },
        "medical_history": None,
        "preferred_language": "en",
        "input_method": "manual",
        "transcript": None,
    }
import pytest
from app.routers.symptoms import get_specialist, predict
from fastapi.testclient import TestClient
from app.main import app
from app.utils.auth import verify_token

client = TestClient(app)

async def mock_verify_token():
    return {"user_id": "test_user_id"}

def test_get_specialist():
    assert get_specialist("I have a severe headache") == "Neurologist"
    assert get_specialist("My chest pain is bad") == "Cardiologist"
    assert get_specialist("My child has a fever") == "General Physician"  # "child" maps to Pediatrician but "fever" comes first in dict? Wait, let's see. In code, fever is first. So it returns General Physician.
    assert get_specialist("I have random pain") == "General Physician"

def test_predict_logic():
    result = predict("I have a fever and chills")
    assert result["emergency"] == False
    assert len(result["conditions"]) > 0
    assert result["conditions"][0]["name"] in ["Viral Fever", "Dengue Fever", "Malaria"]

def test_predict_emergency():
    result = predict("I am experiencing chest pain and difficulty breathing")
    assert result["emergency"] == True

def test_get_suggestions():
    response = client.get("/api/symptoms/suggestions")
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert "Fever" in data["suggestions"]

def test_analyze_symptoms_authorized():
    app.dependency_overrides[verify_token] = mock_verify_token
    response = client.post("/api/symptoms/analyze", json={"symptoms": "I have a terrible migraine"})
    assert response.status_code == 200
    data = response.json()
    assert "conditions" in data
    app.dependency_overrides = {}

def test_analyze_symptoms_validation():
    app.dependency_overrides[verify_token] = mock_verify_token
    response = client.post("/api/symptoms/analyze", json={"symptoms": "hi"})
    assert response.status_code == 422 # Pydantic validation should fail
    app.dependency_overrides = {}

def test_analyze_symptoms_unauthorized():
    app.dependency_overrides = {}
    response = client.post("/api/symptoms/analyze", json={"symptoms": "headache"})
    assert response.status_code == 403 or response.status_code == 401

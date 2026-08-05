import pytest
from app.routers.doctors import haversine, SYMPTOM_TO_SPEC, ALL_INDIA_DOCTORS
from fastapi.testclient import TestClient
from app.main import app
from app.utils.auth import verify_token

client = TestClient(app)

async def mock_verify_token():
    return {"user_id": "test_user"}

def test_haversine_distance():
    # Chennai to Mumbai approx 1030 km
    lat1, lng1 = 13.0850, 80.2101
    lat2, lng2 = 19.0544, 72.8322
    dist = haversine(lat1, lng1, lat2, lng2)
    assert 1000 < dist < 1100

def test_get_all_doctors_unauthorized():
    # Should fail without token
    app.dependency_overrides = {}
    response = client.get("/api/doctors/all")
    assert response.status_code == 403 or response.status_code == 401

def test_get_cities():
    app.dependency_overrides = {}
    response = client.get("/api/doctors/cities")
    assert response.status_code == 200
    data = response.json()
    assert "cities" in data
    assert "All" in data["cities"]
    assert "Chennai" in data["cities"]

def test_get_specializations():
    app.dependency_overrides = {}
    response = client.get("/api/doctors/specializations")
    assert response.status_code == 200
    data = response.json()
    assert "specializations" in data
    assert "Cardiologist" in data["specializations"]

def test_get_all_doctors_authorized():
    app.dependency_overrides[verify_token] = mock_verify_token
    response = client.get("/api/doctors/all")
    assert response.status_code == 200
    data = response.json()
    assert "doctors" in data
    assert len(data["doctors"]) == len(ALL_INDIA_DOCTORS)
    app.dependency_overrides = {}

def test_suggest_doctors_fever():
    app.dependency_overrides[verify_token] = mock_verify_token
    response = client.get("/api/doctors/suggest?symptoms=I have a bad fever")
    assert response.status_code == 200
    data = response.json()
    assert data["specialization"] == "General Physician"
    assert len(data["doctors"]) > 0
    app.dependency_overrides = {}

def test_suggest_doctors_heart():
    app.dependency_overrides[verify_token] = mock_verify_token
    response = client.get("/api/doctors/suggest?symptoms=chest pain")
    assert response.status_code == 200
    data = response.json()
    assert data["specialization"] == "Cardiologist"
    app.dependency_overrides = {}

def test_nearby_doctors_chennai():
    app.dependency_overrides[verify_token] = mock_verify_token
    # Near Chennai coordinates, radius max is 10000000
    response = client.get("/api/doctors/nearby?lat=13.08&lng=80.21&radius=5000000")
    assert response.status_code == 200
    data = response.json()
    assert "doctors" in data
    assert len(data["doctors"]) > 0
    assert data["doctors"][0]["city"] == "Chennai"
    app.dependency_overrides = {}

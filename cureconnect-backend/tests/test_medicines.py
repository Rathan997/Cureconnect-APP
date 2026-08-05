def test_add_medicine(client):
    payload = {
        "userId": "1",
        "name": "Paracetamol",
        "generic": "Acetaminophen",
        "category": "Painkiller",
        "expiry": "05/2028",
        "reminderTimes": ["09:00", "21:00"]
    }
    response = client.post("/api/medicines/save", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] == True
    assert "medicineId" in data

def test_get_medicines(client):
    response = client.get("/api/medicines/1")
    assert response.status_code == 200
    assert "medicines" in response.json()

def test_delete_medicine(client):
    payload = {
        "userId": "1",
        "name": "Aspirin",
        "expiry": "01/2025"
    }
    create_res = client.post("/api/medicines/save", json=payload)
    med_id = create_res.json()["medicineId"]

    del_res = client.delete(f"/api/medicines/{med_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] == True

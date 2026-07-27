def test_create_appointment(client):
    payload = {
        "doctor_name": "Dr. Smith",
        "specialization": "Cardiologist",
        "hospital": "City Hospital",
        "area": "Downtown",
        "date": "2026-12-01",
        "time": "10:00 AM",
        "fee": "500",
        "phone": "1234567890",
        "notes": "First checkup"
    }
    response = client.post("/api/appointments/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["doctor_name"] == "Dr. Smith"
    assert data["status"] == "confirmed"
    assert "id" in data
    
    # Store ID for later tests if we were doing sequential tests,
    # but tests are isolated by db_session fixture. 
    # Let's get the list of appointments to verify.
    response_list = client.get("/api/appointments/")
    assert response_list.status_code == 200
    assert len(response_list.json()) == 1

def test_get_appointment_not_found(client):
    response = client.get("/api/appointments/999")
    assert response.status_code == 404

def test_update_appointment(client):
    # Create first
    payload = {
        "doctor_name": "Dr. Smith",
        "specialization": "Cardiologist",
        "hospital": "City Hospital",
        "area": "Downtown",
        "date": "2026-12-01",
        "time": "10:00 AM",
        "fee": "500",
        "phone": "1234567890"
    }
    create_res = client.post("/api/appointments/", json=payload)
    appt_id = create_res.json()["id"]

    # Update
    update_payload = {"notes": "Updated note", "status": "completed"}
    update_res = client.put(f"/api/appointments/{appt_id}", json=update_payload)
    assert update_res.status_code == 200
    assert update_res.json()["notes"] == "Updated note"
    assert update_res.json()["status"] == "completed"

def test_cancel_appointment(client):
    payload = {
        "doctor_name": "Dr. Smith",
        "specialization": "Cardiologist",
        "hospital": "City Hospital",
        "area": "Downtown",
        "date": "2026-12-01",
        "time": "10:00 AM",
        "fee": "500",
        "phone": "1234567890"
    }
    create_res = client.post("/api/appointments/", json=payload)
    appt_id = create_res.json()["id"]

    del_res = client.delete(f"/api/appointments/{appt_id}")
    assert del_res.status_code == 200
    
    get_res = client.get(f"/api/appointments/{appt_id}")
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "cancelled"

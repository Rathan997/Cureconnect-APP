def test_add_family_member(client):
    payload = {
        "userId": "1",
        "name": "Jane Doe",
        "age": "65",
        "relation": "Mother",
        "phone": "9876543210",
        "blood_group": "O+",
        "conditions": "Diabetes"
    }
    response = client.post("/api/family/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert "id" in data

def test_get_family_members(client):
    response = client.get("/api/family/1")
    assert response.status_code == 200
    assert "members" in response.json()

def test_update_family_member(client):
    payload = {
        "userId": "1",
        "name": "Jane Doe",
        "relation": "Mother"
    }
    create_res = client.post("/api/family/", json=payload)
    member_id = create_res.json()["id"]

    update_payload = {"age": "66", "conditions": "None"}
    update_res = client.put(f"/api/family/{member_id}", json=update_payload)
    assert update_res.status_code == 200
    # Update response only returns success message in this codebase
    assert update_res.json()["success"] == True

def test_family_checkin(client):
    payload = {
        "userId": "1",
        "name": "Jane Doe",
        "relation": "Mother"
    }
    create_res = client.post("/api/family/", json=payload)
    member_id = create_res.json()["id"]

    checkin_res = client.post(f"/api/family/{member_id}/checkin?note=Feeling%20good")
    assert checkin_res.status_code == 200
    assert checkin_res.json()["note"] == "Feeling good"

def test_delete_family_member(client):
    payload = {
        "userId": "1",
        "name": "Jane Doe",
        "relation": "Mother"
    }
    create_res = client.post("/api/family/", json=payload)
    member_id = create_res.json()["id"]

    del_res = client.delete(f"/api/family/{member_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] == True

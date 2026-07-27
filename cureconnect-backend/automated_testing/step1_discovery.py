#!/usr/bin/env python3
"""
DAST Endpoint Discovery
Discovers all API endpoints from the FastAPI application
"""

import json
import os
import sys
import re
from pathlib import Path

# Read input.json for BASE_URL
input_file = Path(__file__).parent / "input.json"
if not input_file.exists():
    print("ERROR: input.json not found")
    sys.exit(1)

with open(input_file) as f:
    config = json.load(f)

BASE_URL = config.get("baseUrl", "http://localhost:8000")
print(f"[*] Base URL: {BASE_URL}")
print()

# Define endpoints discovered from code analysis
ENDPOINTS = {
    # Root endpoints (PUBLIC)
    "root": {
        "method": "GET",
        "path": "/",
        "auth_required": False,
        "description": "API root",
    },
    "ping": {
        "method": "GET", 
        "path": "/ping",
        "auth_required": False,
        "description": "Ping endpoint",
    },
    
    # Auth endpoints
    "register": {
        "method": "POST",
        "path": "/api/auth/register",
        "auth_required": False,
        "description": "Register new user",
        "body": {"name": "Test", "email": "test@example.com", "password": "pass123"},
    },
    "login": {
        "method": "POST",
        "path": "/api/auth/login", 
        "auth_required": False,
        "description": "Login user",
        "body": {"email": "test@example.com", "password": "pass123"},
    },
    "auth_me": {
        "method": "GET",
        "path": "/api/auth/me",
        "auth_required": True,
        "description": "Get current authenticated user",
    },
    "auth_update": {
        "method": "PUT",
        "path": "/api/auth/me",
        "auth_required": True,
        "description": "Update user profile",
        "body": {"name": "Updated Name"},
    },
    
    # Users endpoints
    "users_me": {
        "method": "GET",
        "path": "/api/users/me",
        "auth_required": True,
        "description": "Get user profile",
    },
    "users_update": {
        "method": "PUT",
        "path": "/api/users/me",
        "auth_required": True,
        "description": "Update user profile",
        "body": {"name": "Updated"},
    },
    "users_delete": {
        "method": "DELETE",
        "path": "/api/users/me",
        "auth_required": True,
        "description": "Delete user account",
    },
    
    # Appointments endpoints
    "appointments_create": {
        "method": "POST",
        "path": "/api/appointments/",
        "auth_required": True,
        "description": "Create appointment",
        "body": {"doctor_id": "doc_001", "date": "2024-12-25", "time": "10:00"},
    },
    "appointments_list": {
        "method": "GET",
        "path": "/api/appointments/",
        "auth_required": True,
        "description": "List user appointments",
    },
    "appointments_get": {
        "method": "GET",
        "path": "/api/appointments/{appointment_id}",
        "auth_required": True,
        "description": "Get single appointment",
        "param": "appointment_id",
    },
    "appointments_update": {
        "method": "PUT",
        "path": "/api/appointments/{appointment_id}",
        "auth_required": True,
        "description": "Update appointment",
        "body": {"date": "2024-12-26"},
        "param": "appointment_id",
    },
    "appointments_cancel": {
        "method": "DELETE",
        "path": "/api/appointments/{appointment_id}",
        "auth_required": True,
        "description": "Cancel appointment",
        "param": "appointment_id",
    },
    
    # Medicines endpoints
    "medicines_save": {
        "method": "POST",
        "path": "/api/medicines/save",
        "auth_required": True,
        "description": "Save medicine",
        "body": {"userId": "user123", "name": "Aspirin", "expiry": "2025-12-31"},
    },
    "medicines_get": {
        "method": "GET",
        "path": "/api/medicines/{user_id}",
        "auth_required": True,
        "description": "Get user medicines",
        "param": "user_id",
    },
    
    # Family endpoints
    "family_add": {
        "method": "POST",
        "path": "/api/family/",
        "auth_required": True,
        "description": "Add family member",
        "body": {"userId": "user123", "name": "John", "relation": "brother"},
    },
    "family_get": {
        "method": "GET",
        "path": "/api/family/{user_id}",
        "auth_required": True,
        "description": "Get family members",
        "param": "user_id",
    },
    
    # Symptoms endpoints
    "symptoms_predict": {
        "method": "POST",
        "path": "/api/symptoms/predict",
        "auth_required": True,
        "description": "Predict condition from symptoms",
        "body": {"symptoms": "fever and headache"},
    },
    
    # Doctors endpoints  
    "doctors_search": {
        "method": "GET",
        "path": "/api/doctors/search",
        "auth_required": False,
        "description": "Search doctors",
    },
    "doctors_nearby": {
        "method": "GET",
        "path": "/api/doctors/nearby",
        "auth_required": False,
        "description": "Get nearby doctors",
    },
    
    # Chatbot endpoints
    "chatbot_chat": {
        "method": "POST",
        "path": "/api/chatbot/chat",
        "auth_required": True,
        "description": "Chat with AI",
        "body": {"message": "I have fever"},
    },
}

# Count endpoints
total = len(ENDPOINTS)
public_endpoints = sum(1 for e in ENDPOINTS.values() if not e.get("auth_required"))
protected_endpoints = total - public_endpoints

print("=" * 70)
print("ENDPOINT DISCOVERY REPORT")
print("=" * 70)
print()
print(f"Total Endpoints Found: {total}")
print(f"  - Public (no auth): {public_endpoints}")
print(f"  - Protected (auth required): {protected_endpoints}")
print()
print("=" * 70)
print("DISCOVERED ENDPOINTS:")
print("=" * 70)
print()

# Group by category
categories = {}
for key, endpoint in ENDPOINTS.items():
    method = endpoint["method"]
    path = endpoint["path"]
    auth = "🔒 AUTH" if endpoint.get("auth_required") else "🔓 PUBLIC"
    desc = endpoint["description"]
    
    # Extract category from path
    if path.startswith("/api/"):
        parts = path.split("/")
        cat = parts[2] if len(parts) > 2 else "root"
    else:
        cat = "root"
    
    if cat not in categories:
        categories[cat] = []
    categories[cat].append((method, path, auth, desc))

for cat in sorted(categories.keys()):
    print(f"\n[{cat.upper()}]")
    for method, path, auth, desc in categories[cat]:
        print(f"  {method:6} {path:40} {auth:15} - {desc}")

print()
print("=" * 70)
print("NEXT STEPS:")
print("=" * 70)
print(f"✓ Run: python step1_discovery.py      (this was step 1)")
print(f"→ Run: python step2_establish_auth.py (establish test tokens)")
print(f"→ Run: python step3_run_tests.py      (run security tests)")
print(f"→ Run: python step4_generate_report.py (generate final report)")
print()

# Save to JSON for next steps
discovery_data = {
    "baseUrl": BASE_URL,
    "totalEndpoints": total,
    "publicEndpoints": public_endpoints,
    "protectedEndpoints": protected_endpoints,
    "endpoints": ENDPOINTS,
}

output_file = Path(__file__).parent / "discovery.json"
with open(output_file, "w") as f:
    json.dump(discovery_data, f, indent=2)
print(f"✓ Discovery data saved to: discovery.json")
print()

#!/usr/bin/env python3
"""
DAST Step 2: Establish Authentication
Register test accounts and obtain valid tokens for testing
"""

import json
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "requests", "-q"], check=True)
    import requests

input_file = Path(__file__).parent / "input.json"
with open(input_file) as f:
    config = json.load(f)

BASE_URL = config.get("baseUrl", "http://localhost:8000")
TEST_EMAIL_1 = config.get("testEmail", "dast_user1@test.local")
TEST_PASSWORD_1 = config.get("testPassword", "TestPass123!")
TEST_EMAIL_2 = config.get("testEmail2", "dast_user2@test.local") 
TEST_PASSWORD_2 = config.get("testPassword2", "TestPass456!")

print("=" * 70)
print("STEP 2: ESTABLISH TEST AUTHENTICATION")
print("=" * 70)
print()

# Store tokens in auth_tokens.json
auth_data = {
    "user1": {
        "email": TEST_EMAIL_1,
        "password": TEST_PASSWORD_1,
        "token": None,
        "user_id": None
    },
    "user2": {
        "email": TEST_EMAIL_2,
        "password": TEST_PASSWORD_2,
        "token": None,
        "user_id": None
    }
}

print(f"[*] Base URL: {BASE_URL}")
print()

# Register User 1
print("[1/4] Registering User 1...")
try:
    resp = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "name": "DAST Test User 1",
            "email": TEST_EMAIL_1,
            "password": TEST_PASSWORD_1,
            "phone": "+1234567890"
        },
        timeout=10
    )
    
    if resp.status_code in [200, 201]:
        data = resp.json()
        auth_data["user1"]["token"] = data.get("access_token")
        user_info = data.get("user", {})
        auth_data["user1"]["user_id"] = user_info.get("id")
        print(f"   ✓ User 1 registered. Token: {auth_data['user1']['token'][:20]}...")
        print(f"   ✓ User ID: {auth_data['user1']['user_id']}")
    else:
        print(f"   ⚠ Registration returned {resp.status_code}: {resp.text[:100]}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print()

# Register User 2
print("[2/4] Registering User 2...")
try:
    resp = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "name": "DAST Test User 2",
            "email": TEST_EMAIL_2,
            "password": TEST_PASSWORD_2,
            "phone": "+9876543210"
        },
        timeout=10
    )
    
    if resp.status_code in [200, 201]:
        data = resp.json()
        auth_data["user2"]["token"] = data.get("access_token")
        user_info = data.get("user", {})
        auth_data["user2"]["user_id"] = user_info.get("id")
        print(f"   ✓ User 2 registered. Token: {auth_data['user2']['token'][:20]}...")
        print(f"   ✓ User ID: {auth_data['user2']['user_id']}")
    else:
        print(f"   ⚠ Registration returned {resp.status_code}: {resp.text[:100]}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print()

# Verify login User 1
print("[3/4] Verifying login for User 1...")
try:
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": TEST_EMAIL_1,
            "password": TEST_PASSWORD_1
        },
        timeout=10
    )
    
    if resp.status_code == 200:
        data = resp.json()
        auth_data["user1"]["token"] = data.get("access_token", auth_data["user1"]["token"])
        print(f"   ✓ Login successful for User 1")
    else:
        print(f"   ✗ Login failed: {resp.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print()

# Verify login User 2
print("[4/4] Verifying login for User 2...")
try:
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": TEST_EMAIL_2,
            "password": TEST_PASSWORD_2
        },
        timeout=10
    )
    
    if resp.status_code == 200:
        data = resp.json()
        auth_data["user2"]["token"] = data.get("access_token", auth_data["user2"]["token"])
        print(f"   ✓ Login successful for User 2")
    else:
        print(f"   ✗ Login failed: {resp.status_code}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print()
print("=" * 70)
print("AUTHENTICATION SUMMARY")
print("=" * 70)

if auth_data["user1"]["token"]:
    print(f"✓ User 1: {auth_data['user1']['email']}")
    print(f"  ID: {auth_data['user1']['user_id']}")
    print(f"  Token: {auth_data['user1']['token'][:30]}...")
else:
    print(f"✗ User 1 registration failed")

print()

if auth_data["user2"]["token"]:
    print(f"✓ User 2: {auth_data['user2']['email']}")
    print(f"  ID: {auth_data['user2']['user_id']}")
    print(f"  Token: {auth_data['user2']['token'][:30]}...")
else:
    print(f"✗ User 2 registration failed")

print()

# Save tokens for next step
tokens_file = Path(__file__).parent / "auth_tokens.json"
with open(tokens_file, "w") as f:
    json.dump(auth_data, f, indent=2)

print(f"✓ Auth tokens saved to: auth_tokens.json")
print()
print("=" * 70)
print("NEXT: Run python step3_run_tests.py")
print("=" * 70)

print()
print("=" * 70)
print("AUTHENTICATION SUMMARY")
print("=" * 70)

if auth_data["user1"]["token"]:
    print(f"✓ User 1: {auth_data['user1']['email']}")
    print(f"  ID: {auth_data['user1']['user_id']}")
    print(f"  Token: {auth_data['user1']['token'][:30]}...")
else:
    print(f"✗ User 1 registration failed")

print()

if auth_data["user2"]["token"]:
    print(f"✓ User 2: {auth_data['user2']['email']}")
    print(f"  ID: {auth_data['user2']['user_id']}")
    print(f"  Token: {auth_data['user2']['token'][:30]}...")
else:
    print(f"✗ User 2 registration failed")

print()

# Save tokens for next step
tokens_file = Path(__file__).parent / "auth_tokens.json"
with open(tokens_file, "w") as f:
    json.dump(auth_data, f, indent=2)

print(f"✓ Auth tokens saved to: auth_tokens.json")
print()
print("=" * 70)
print("NEXT: Run python step3_run_tests.py")
print("=" * 70)

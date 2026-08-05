#!/usr/bin/env python3
"""
DAST Step 3: Comprehensive Security Tests
Tests: AuthN bypass, AuthZ/RBAC, IDOR, Token tampering, Injection, Rate limiting, Hardcoded secrets
"""

import json
import time
import sys
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List

try:
    import requests
    import jwt
except ImportError:
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "requests", "pyjwt", "-q"], check=True)
    import requests
    import jwt

# Load configuration
input_file = Path(__file__).parent / "input.json"
with open(input_file) as f:
    config = json.load(f)

BASE_URL = config.get("baseUrl", "http://localhost:8000")

auth_file = Path(__file__).parent / "auth_tokens.json"
with open(auth_file) as f:
    auth_data = json.load(f)

discovery_file = Path(__file__).parent / "discovery.json"
with open(discovery_file) as f:
    discovery = json.load(f)

# Test results storage
test_results = []
test_counter = 0

def log_test(endpoint: str, method: str, role: str, status: int, expected_status, 
             finding: bool, severity: str, response_time: float, category: str, note: str):
    """Log a test result"""
    global test_counter
    test_counter += 1
    
    result = {
        "test_id": test_counter,
        "endpoint": endpoint,
        "method": method,
        "role": role,
        "status": status,
        "expected_status": expected_status,
        "finding": finding,
        "severity": severity,
        "response_time_ms": round(response_time * 1000, 2),
        "test_category": category,
        "note": note,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    test_results.append(result)
    
    # Print result
    status_symbol = "✗" if finding else "✓"
    print(f"  {status_symbol} [{category:15}] {method:6} {endpoint:40} → {status} (expected {expected_status})")
    if finding:
        print(f"     FINDING: {severity} - {note}")
    
    return result

print("=" * 80)
print("STEP 3: DAST SECURITY TESTING")
print("=" * 80)
print()
print(f"Base URL: {BASE_URL}")
print(f"Test Users: {len(auth_data)} accounts ready")
print()

# Extracted data for testing
user1_token = auth_data["user1"]["token"]
user1_id = auth_data["user1"]["user_id"]
user2_token = auth_data["user2"]["token"]
user2_id = auth_data["user2"]["user_id"]

print("=" * 80)
print("CATEGORY 0: HARDCODED CREDENTIALS & SECRETS")
print("=" * 80)
print()

# Scan for hardcoded secrets in key files
print("[*] Scanning codebase for hardcoded credentials...")

secrets_found = []

# Check chatbot.py for hardcoded API key
try:
    chatbot_file = Path(__file__).parent.parent / "app" / "routers" / "chatbot.py"
    if chatbot_file.exists():
        with open(chatbot_file, "r") as f:
            content = f.read()
            if "gsk_" in content or "api_key=" in content:
                # Extract the key for reporting (last 6 chars only)
                matches = re.findall(r'api_key=["\']([^"\']+)["\']', content)
                if matches:
                    key = matches[0]
                    log_test(
                        endpoint="/app/routers/chatbot.py",
                        method="CODE",
                        role="all",
                        status=200,
                        expected_status=0,
                        finding=True,
                        severity="🔴 CRITICAL",
                        response_time=0,
                        category="Hardcoded Secrets",
                        note=f"Hardcoded Groq API key found in source: ...{key[-6:]}"
                    )
                    secrets_found.append(f"Groq API key in chatbot.py")
except Exception as e:
    print(f"  ⚠ Error scanning: {e}")

# Check .env file for secrets
try:
    env_file = Path(__file__).parent.parent.parent / ".env"
    if env_file.exists():
        with open(env_file, "r") as f:
            env_content = f.read()
            if "DATABASE_URL" in env_content or "SECRET" in env_content:
                log_test(
                    endpoint=".env",
                    method="CODE",
                    role="all",
                    status=200,
                    expected_status=0,
                    finding=True,
                    severity="🔴 CRITICAL",
                    response_time=0,
                    category="Hardcoded Secrets",
                    note=".env file contains sensitive configuration (should not be committed)"
                )
                secrets_found.append(".env file with secrets")
except Exception as e:
    pass

if not secrets_found:
    print("  ✓ No obvious hardcoded credentials detected in accessible files")

print()

# ============================================================================
# CATEGORY 1: AUTHENTICATION BYPASS (Protected endpoints without auth)
# ============================================================================
print("=" * 80)
print("CATEGORY 1: AUTHENTICATION BYPASS")
print("=" * 80)
print("[*] Testing protected endpoints without authentication tokens")
print()

protected_endpoints = [
    ("GET", "/api/auth/me"),
    ("GET", "/api/users/me"),
    ("GET", "/api/appointments/"),
    ("POST", "/api/appointments/"),
    ("POST", "/api/medicines/save"),
    ("POST", "/api/family/"),
    ("POST", "/api/symptoms/predict"),
    ("POST", "/api/chatbot/chat"),
]

for method, path in protected_endpoints:
    try:
        if method == "GET":
            start = time.time()
            resp = requests.get(f"{BASE_URL}{path}", timeout=5)
            elapsed = time.time() - start
        else:
            start = time.time()
            resp = requests.post(f"{BASE_URL}{path}", json={}, timeout=5)
            elapsed = time.time() - start
        
        # These should return 401/403, not 2xx
        finding = resp.status_code < 400
        severity = "🔴 CRITICAL" if finding else "✓ PASS"
        
        log_test(
            endpoint=path,
            method=method,
            role="none",
            status=resp.status_code,
            expected_status=401,
            finding=finding,
            severity=severity,
            response_time=elapsed,
            category="AuthN Bypass",
            note="Should reject unauthenticated requests" if not finding else "Accepted request without auth!"
        )
    except Exception as e:
        print(f"  ✗ Error testing {method} {path}: {e}")

print()

# ============================================================================
# CATEGORY 2: AUTHORIZATION & RBAC (User accessing another user's resources)
# ============================================================================
print("=" * 80)
print("CATEGORY 2: AUTHORIZATION & RBAC VIOLATIONS (IDOR)")
print("=" * 80)
print("[*] Testing cross-user access with different user IDs")
print()

# User 1 tries to access User 2's data
authz_tests = [
    ("GET", f"/api/medicines/{user2_id}", user1_token, "User 1 accessing User 2's medicines"),
    ("GET", f"/api/family/{user2_id}", user1_token, "User 1 accessing User 2's family"),
]

for method, path, token, description in authz_tests:
    try:
        headers = {"Authorization": f"Bearer {token}"}
        start = time.time()
        resp = requests.get(f"{BASE_URL}{path}", headers=headers, timeout=5)
        elapsed = time.time() - start
        
        # Should return 403 or 404, not 200
        finding = resp.status_code == 200
        severity = "🔴 CRITICAL" if finding else "✓ PASS"
        
        log_test(
            endpoint=path,
            method=method,
            role="user1",
            status=resp.status_code,
            expected_status=403,
            finding=finding,
            severity=severity,
            response_time=elapsed,
            category="AuthZ/IDOR",
            note=description if finding else f"Correctly rejected ({resp.status_code})"
        )
    except Exception as e:
        print(f"  ✗ Error: {e}")

print()

# ============================================================================
# CATEGORY 3: TOKEN TAMPERING (Modified JWT claims)
# ============================================================================
print("=" * 80)
print("CATEGORY 3: TOKEN TAMPERING")
print("=" * 80)
print("[*] Testing tampered JWT tokens (modified claims)")
print()

# Decode the original token to get the payload
try:
    decoded = jwt.decode(user1_token, options={"verify_signature": False})
    
    # Create a tampered token by manually changing the user_id claim
    # NOTE: Without signing key, we just create an invalid token to test rejection
    tampered_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjogImZha2UtdXNlci1pZCIsICJlbWFpbCI6ICJhdHRhY2tlckBldmlsLmNvbSJ9.invalid_signature"
    
    headers = {"Authorization": f"Bearer {tampered_token}"}
    start = time.time()
    resp = requests.get(f"{BASE_URL}/api/auth/me", headers=headers, timeout=5)
    elapsed = time.time() - start
    
    # Should reject tampered token
    finding = resp.status_code == 200
    severity = "🔴 CRITICAL" if finding else "✓ PASS"
    
    log_test(
        endpoint="/api/auth/me",
        method="GET",
        role="tampered",
        status=resp.status_code,
        expected_status=401,
        finding=finding,
        severity=severity,
        response_time=elapsed,
        category="Token Tampering",
        note="Tampered JWT should be rejected" if not finding else "ACCEPTED TAMPERED TOKEN!"
    )
except Exception as e:
    print(f"  ✗ Error during token tampering test: {e}")

print()

# ============================================================================
# CATEGORY 4: INJECTION PROBES (SQLi / NoSQLi detection)
# ============================================================================
print("=" * 80)
print("CATEGORY 4: INJECTION PROBES (SQL/NoSQL Detection)")
print("=" * 80)
print("[*] Testing input validation with injection payloads")
print()

injection_payloads = [
    {"symptoms": "' OR '1'='1"},  # SQL injection
    {"symptoms": "'; DROP TABLE users; --"},  # SQL injection
    {"symptoms": "'; db.users.deleteMany({}); //"},  # NoSQL injection
    {"message": "' OR '1'='1"},  # In chatbot
]

for idx, payload in enumerate(injection_payloads):
    endpoint = "/api/symptoms/predict" if "symptoms" in payload else "/api/chatbot/chat"
    
    try:
        headers = {"Authorization": f"Bearer {user1_token}"}
        start = time.time()
        resp = requests.post(f"{BASE_URL}{endpoint}", json=payload, headers=headers, timeout=5)
        elapsed = time.time() - start
        
        # Check for error messages that reveal system details
        response_text = resp.text.lower()
        has_sql_error = any(x in response_text for x in ["sql", "syntax", "database", "query"])
        has_mongo_error = any(x in response_text for x in ["mongodb", "operator"])
        
        finding = has_sql_error or has_mongo_error
        severity = "🟡 MEDIUM" if finding else "✓ PASS"
        
        log_test(
            endpoint=endpoint,
            method="POST",
            role="user1",
            status=resp.status_code,
            expected_status=400,
            finding=finding,
            severity=severity,
            response_time=elapsed,
            category="Injection",
            note=f"Payload: {str(payload)[:40]}..." if finding else "Safely handled"
        )
    except Exception as e:
        print(f"  ✗ Error testing injection: {e}")

print()

# ============================================================================
# CATEGORY 5: RATE LIMITING
# ============================================================================
print("=" * 80)
print("CATEGORY 5: RATE LIMITING")
print("=" * 80)
print("[*] Testing rate limiting on login endpoint (burst of 30 requests)")
print()

rate_limit_endpoint = "/api/auth/login"
rate_limit_test_data = {
    "email": "test@example.com",
    "password": "TestPassword123"
}

request_count = 30
success_count = 0
rate_limited = False
rate_limit_threshold = 0

for i in range(request_count):
    try:
        start = time.time()
        resp = requests.post(f"{BASE_URL}{rate_limit_endpoint}", json=rate_limit_test_data, timeout=5)
        elapsed = time.time() - start
        
        if resp.status_code == 429:  # Too many requests
            rate_limited = True
            rate_limit_threshold = i
            break
        elif resp.status_code == 200:
            success_count += 1
    except:
        pass
    
    time.sleep(0.05)  # Small throttle

if not rate_limited and success_count == request_count:
    severity = "🟡 MEDIUM"
    note = f"No rate limiting detected - all {request_count} requests succeeded"
    finding = True
else:
    severity = "✓ PASS"
    note = f"Rate limiting engaged after {rate_limit_threshold} requests" if rate_limited else "Rate limiting present"
    finding = False

log_test(
    endpoint=rate_limit_endpoint,
    method="POST",
    role="user1",
    status=429 if rate_limited else 200,
    expected_status=429,
    finding=finding,
    severity=severity,
    response_time=0,
    category="Rate Limiting",
    note=note
)

print()

# ============================================================================
# CATEGORY 6: RBAC MATRIX (Each role × each endpoint)
# ============================================================================
print("=" * 80)
print("CATEGORY 6: RBAC MATRIX (Authenticated user permissions)")
print("=" * 80)
print("[*] Testing expected behavior with valid authentication")
print()

rbac_tests = [
    ("GET", "/api/auth/me", user1_token, 200),
    ("GET", "/api/users/me", user1_token, 200),
    ("GET", "/api/appointments/", user1_token, 200),
    ("GET", "/api/doctors/search", None, 200),  # Public endpoint
    ("GET", "/api/doctors/nearby", None, 200),  # Public endpoint
]

for method, path, token, expected_status in rbac_tests:
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        start = time.time()
        if method == "GET":
            resp = requests.get(f"{BASE_URL}{path}", headers=headers, timeout=5)
        else:
            resp = requests.post(f"{BASE_URL}{path}", headers=headers, json={}, timeout=5)
        elapsed = time.time() - start
        
        finding = resp.status_code != expected_status
        severity = "🟡 MEDIUM" if finding else "✓ PASS"
        role = "public" if not token else "user1"
        
        log_test(
            endpoint=path,
            method=method,
            role=role,
            status=resp.status_code,
            expected_status=expected_status,
            finding=finding,
            severity=severity,
            response_time=elapsed,
            category="RBAC Matrix",
            note="Unexpected status" if finding else "Correct access"
        )
    except Exception as e:
        print(f"  ✗ Error: {e}")

print()

# ============================================================================
# Summary Statistics
# ============================================================================
print("=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print()

findings = [r for r in test_results if r["finding"]]
critical = [r for r in findings if "CRITICAL" in r["severity"]]
medium = [r for r in findings if "MEDIUM" in r["severity"]]

print(f"Total Tests Run: {len(test_results)}")
print(f"Findings: {len(findings)} ({len(findings)/len(test_results)*100:.1f}%)")
print(f"  - 🔴 CRITICAL: {len(critical)}")
print(f"  - 🟡 MEDIUM: {len(medium)}")
print()

if findings:
    print("CRITICAL FINDINGS:")
    for f in critical:
        print(f"  • {f['endpoint']} ({f['method']}) - {f['note']}")
    print()

# Save results
results_file = Path(__file__).parent / "test_results.json"
with open(results_file, "w") as f:
    json.dump(test_results, f, indent=2)

print(f"✓ Test results saved to: test_results.json")
print()
print("=" * 80)
print("NEXT: Run python step4_generate_report.py")
print("=" * 80)

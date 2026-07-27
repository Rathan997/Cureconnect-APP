#!/usr/bin/env python3
"""
Test connectivity and API availability
"""

import json
from pathlib import Path
import sys

try:
    import requests
except ImportError:
    print("ERROR: requests library not found. Installing...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "requests", "-q"], check=True)
    import requests

input_file = Path(__file__).parent / "input.json"
with open(input_file) as f:
    config = json.load(f)

BASE_URL = config.get("baseUrl", "http://localhost:8000")

print(f"Testing connectivity to {BASE_URL}...")
print()

try:
    # Test root endpoint
    resp = requests.get(f"{BASE_URL}/", timeout=5)
    print(f"✓ GET / → {resp.status_code}")
    print(f"  Response: {resp.json()}")
    print()
    
    # Test ping
    resp = requests.get(f"{BASE_URL}/ping", timeout=5)
    print(f"✓ GET /ping → {resp.status_code}")
    print(f"  Response: {resp.json()}")
    print()
    
    print("✓ API is running and responding!")
    sys.exit(0)
    
except Exception as e:
    print(f"✗ ERROR: Could not connect to {BASE_URL}")
    print(f"  {type(e).__name__}: {e}")
    print()
    print("Make sure the API server is running:")
    print("  cd d:\\cureconnect-backend")
    print("  venv\\Scripts\\activate")
    print("  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    sys.exit(1)

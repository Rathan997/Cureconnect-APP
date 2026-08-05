import pytest
import jwt
from datetime import datetime
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.routers.auth import hash_password
from app.utils.auth import create_token, verify_token, SECRET_KEY, ALGORITHM

def test_hash_password():
    password = "MySecurePassword123"
    hashed = hash_password(password)
    assert hashed != password
    assert len(hashed) == 64  # SHA-256 hex digest length
    
    # Hashing same password again should yield same hash
    assert hash_password(password) == hashed

def test_create_token():
    data = {"user_id": "12345", "email": "test@example.com"}
    token = create_token(data)
    
    assert isinstance(token, str)
    assert len(token) > 0
    
    # Decode to verify payload
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["user_id"] == "12345"
    assert decoded["email"] == "test@example.com"
    assert "exp" in decoded

def test_verify_token_valid():
    data = {"user_id": "12345"}
    token = create_token(data)
    
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    
    decoded = verify_token(credentials)
    assert decoded["user_id"] == "12345"

def test_verify_token_invalid():
    invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=invalid_token)
    
    with pytest.raises(HTTPException) as excinfo:
        verify_token(credentials)
        
    assert excinfo.value.status_code == 401
    assert "Invalid token" in str(excinfo.value.detail)


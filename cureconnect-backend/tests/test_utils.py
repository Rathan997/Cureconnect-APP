import pytest
from app.utils.email import generate_otp, store_otp, verify_otp, otp_store

def test_generate_otp():
    otp = generate_otp()
    assert isinstance(otp, str)
    assert len(otp) == 6
    assert otp.isdigit()

def test_store_and_verify_otp():
    email = "test.otp@example.com"
    otp = generate_otp()
    
    # Store it
    store_otp(email, otp)
    assert email in otp_store
    
    # Verify with wrong OTP
    assert not verify_otp(email, "000000")
    
    # After a failed attempt, is it still there? Wait, the code doesn't delete on fail? 
    # Let's check the code: "if stored['otp'] != otp: return False" (doesn't delete)
    # Re-store just in case
    store_otp(email, otp)
    
    # Verify with correct OTP
    assert verify_otp(email, otp)
    
    # After successful verification, it should be deleted
    assert email not in otp_store

def test_verify_nonexistent_otp():
    assert not verify_otp("nobody@example.com", "123456")

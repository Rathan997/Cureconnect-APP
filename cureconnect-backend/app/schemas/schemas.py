from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ─── Auth ───────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

# ─── User Profile ────────────────────────────────────
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    conditions: Optional[str] = None
    emergency_contact: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    age: Optional[str]
    gender: Optional[str]
    height: Optional[str]
    weight: Optional[str]
    blood_group: Optional[str]
    allergies: Optional[str]
    conditions: Optional[str]
    emergency_contact: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Appointments ────────────────────────────────────
class AppointmentCreate(BaseModel):
    doctor_name: str
    specialization: str
    hospital: str
    area: str
    date: str
    time: str
    fee: str
    phone: str
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    doctor_name: str
    specialization: str
    hospital: str
    area: str
    date: str
    time: str
    fee: str
    phone: str
    status: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Medicines ───────────────────────────────────────
class MedicineCreate(BaseModel):
    name: str
    generic: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[str] = None
    barcode: Optional[str] = None
    expiry: str
    reminder_times: Optional[str] = None
    side_effects: Optional[str] = None

class MedicineResponse(BaseModel):
    id: int
    name: str
    generic: Optional[str]
    manufacturer: Optional[str]
    category: Optional[str]
    barcode: Optional[str]
    expiry: str
    reminder_times: Optional[str]
    side_effects: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Family ──────────────────────────────────────────
class FamilyMemberCreate(BaseModel):
    name: str
    age: Optional[str] = None
    relation: str
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    conditions: Optional[str] = None

class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    conditions: Optional[str] = None
    medicines: Optional[str] = None
    check_in_note: Optional[str] = None

class FamilyMemberResponse(BaseModel):
    id: int
    name: str
    age: Optional[str]
    relation: str
    phone: Optional[str]
    blood_group: Optional[str]
    conditions: Optional[str]
    medicines: Optional[str]
    last_check_in: Optional[datetime]
    check_in_note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Symptom Check ───────────────────────────────────
class SymptomCheckCreate(BaseModel):
    symptoms: str
    condition: Optional[str] = None
    specialist: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[float] = None
    advice: Optional[str] = None

class SymptomCheckResponse(BaseModel):
    id: int
    symptoms: str
    condition: Optional[str]
    specialist: Optional[str]
    severity: Optional[str]
    confidence: Optional[float]
    advice: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

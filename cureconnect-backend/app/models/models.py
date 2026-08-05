from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    age = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    height = Column(String, nullable=True)
    weight = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    conditions = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    appointments = relationship("Appointment", back_populates="user")
    medicines = relationship("Medicine", back_populates="user")
    family_members = relationship("FamilyMember", back_populates="user")
    symptom_checks = relationship("SymptomCheck", back_populates="user")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    doctor_name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    hospital = Column(String, nullable=False)
    area = Column(String, nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    fee = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    status = Column(String, default="confirmed")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="appointments")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    generic = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    category = Column(String, nullable=True)
    barcode = Column(String, nullable=True)
    expiry = Column(String, nullable=False)
    reminder_times = Column(String, nullable=True)
    side_effects = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="medicines")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    age = Column(String, nullable=True)
    relation = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    conditions = Column(String, nullable=True)
    medicines = Column(Text, nullable=True)
    last_check_in = Column(DateTime(timezone=True), nullable=True)
    check_in_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="family_members")


class SymptomCheck(Base):
    __tablename__ = "symptom_checks"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    symptoms = Column(Text, nullable=False)
    condition = Column(String, nullable=True)
    specialist = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    advice = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="symptom_checks")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    qualification = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    clinic = Column(String, nullable=True)
    area = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    fee = Column(String, nullable=True)
    rating = Column(Float, nullable=True)
    reviews = Column(String, nullable=True)
    timings = Column(String, nullable=True)
    languages = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    password = Column(String, nullable=True)

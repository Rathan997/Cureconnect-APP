from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Appointment, User
from app.schemas.schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.utils.auth import get_current_user, verify_token

router = APIRouter(tags=["Appointments"])

@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = Appointment(
        user_id=current_user.id,
        **data.dict()
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.get("/", response_model=List[AppointmentResponse])
def get_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Appointment).filter(
        Appointment.user_id == current_user.id
    ).order_by(Appointment.created_at.desc()).all()

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.user_id == current_user.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.user_id == current_user.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.delete("/{appointment_id}")
def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.user_id == current_user.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = "cancelled"
    db.commit()
    return {"message": "Appointment cancelled successfully"}


from app.models.models import Doctor

@router.get("/doctor-list")
def get_doctor_appointments(
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    doctor_id = token.get("doctor_id")
    if not doctor_id:
        raise HTTPException(status_code=401, detail="Invalid doctor session")
        
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    appointments = db.query(Appointment).filter(
        Appointment.doctor_name == doctor.name
    ).order_by(Appointment.date.desc(), Appointment.time.desc()).all()
    
    results = []
    for appt in appointments:
        results.append({
            "id": appt.id,
            "patient_name": appt.user.name if appt.user else "Patient",
            "patient_email": appt.user.email if appt.user else "",
            "patient_phone": appt.phone,
            "date": appt.date,
            "time": appt.time,
            "status": appt.status,
            "notes": appt.notes or ""
        })
    return results


@router.post("/doctor-list/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    status: str,
    token: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    doctor_id = token.get("doctor_id")
    if not doctor_id:
        raise HTTPException(status_code=401, detail="Invalid doctor session")
        
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_name == doctor.name
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    appointment.status = status
    db.commit()
    db.refresh(appointment)
    return {"message": f"Appointment status updated to {status} successfully", "status": appointment.status}
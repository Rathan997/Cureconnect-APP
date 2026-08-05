from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Appointment, Medicine, SymptomCheck
from app.utils.auth import verify_admin

router = APIRouter()

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_admin: User = Depends(verify_admin)):
    try:
        user_count = db.query(User).count()
        appointment_count = db.query(Appointment).count()
        medicine_count = db.query(Medicine).count()
        symptom_count = db.query(SymptomCheck).count()
        
        return {
            "users": user_count,
            "appointments": appointment_count,
            "medicines": medicine_count,
            "symptoms": symptom_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
def get_users(db: Session = Depends(get_db), current_admin: User = Depends(verify_admin)):
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()
        return [
            {
                "id": str(u.id),
                "name": u.name,
                "email": u.email,
                "phone": u.phone or "",
                "age": u.age or "",
                "gender": u.gender or "",
                "isAdmin": bool(u.is_admin),
                "isActive": bool(u.is_active),
                "createdAt": u.created_at.isoformat() if u.created_at else None
            } for u in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/toggle-admin")
def toggle_admin(user_id: str, db: Session = Depends(get_db), current_admin: User = Depends(verify_admin)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if str(user.id) == str(current_admin.id):
            raise HTTPException(status_code=400, detail="Cannot toggle admin status for yourself")
            
        user.is_admin = not user.is_admin
        db.commit()
        db.refresh(user)
        return {
            "message": f"Successfully set admin status to {user.is_admin} for {user.email}",
            "isAdmin": bool(user.is_admin)
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

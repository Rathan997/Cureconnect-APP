from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.utils.auth import create_token, verify_token
from app.utils.email import generate_otp, store_otp, verify_otp, send_otp_email
from app.database import SessionLocal
from sqlalchemy import text
import uuid
import hashlib
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def get_db():
    db = SessionLocal()
    return db


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    allergies: Optional[str] = None
    conditions: Optional[str] = None
    emergency_contact: Optional[str] = None
    fcmToken: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


@router.post("/register")
async def register(body: RegisterRequest):
    db = get_db()

    try:
        existing = db.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": body.email.lower()}
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        user_id = str(uuid.uuid4())

        db.execute(text("""
            INSERT INTO users (
                id,
                name,
                email,
                password,
                phone,
                created_at
            )
            VALUES (
                :id,
                :name,
                :email,
                :password,
                :phone,
                :created_at
            )
        """), {
            "id": user_id,
            "name": body.name.strip(),
            "email": body.email.lower().strip(),
            "password": hash_password(body.password),
            "phone": body.phone or "",
            "created_at": datetime.utcnow()
        })

        db.commit()

        token = create_token({
            "user_id": user_id,
            "email": body.email
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "name": body.name.strip(),
                "email": body.email.lower(),
                "phone": body.phone or ""
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        logger.error(f"Register error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()


@router.post("/login")
async def login(body: LoginRequest):
    db = get_db()

    try:
        user = db.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": body.email.lower()}
        ).fetchone()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Email not found"
            )

        if user.password != hash_password(body.password):
            raise HTTPException(
                status_code=401,
                detail="Incorrect password"
            )

        token = create_token({
            "user_id": str(user.id),
            "email": body.email
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "phone": user.phone or "",
                "bloodGroup": user.blood_group or "",
                "age": user.age or "",
                "gender": user.gender or "",
                "height": user.height or "",
                "weight": user.weight or "",
                "allergies": user.allergies or "",
                "conditions": user.conditions or "",
                "emergency_contact": user.emergency_contact or "",
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()


@router.get("/me")
async def get_me(token: dict = Depends(verify_token)):
    db = get_db()

    try:
        user = db.execute(
            text("SELECT * FROM users WHERE id = :id"),
            {"id": token.get("user_id")}
        ).fetchone()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "phone": user.phone or "",
            "bloodGroup": user.blood_group or "",
            "age": user.age or "",
            "gender": user.gender or "",
            "height": user.height or "",
            "weight": user.weight or "",
            "allergies": user.allergies or "",
            "conditions": user.conditions or "",
            "emergency_contact": user.emergency_contact or "",
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Get me error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()


@router.put("/me")
async def update_profile(
    body: UpdateProfileRequest,
    token: dict = Depends(verify_token),
):
    db = get_db()

    try:
        field_map = {
            'name': 'name',
            'phone': 'phone',
            'age': 'age',
            'gender': 'gender',
            'bloodGroup': 'blood_group',
            'height': 'height',
            'weight': 'weight',
            'allergies': 'allergies',
            'conditions': 'conditions',
            'emergency_contact': 'emergency_contact',
            'fcmToken': 'fcm_token',
        }

        body_dict = body.dict()

        updates = {}

        for frontend_key, db_column in field_map.items():
            if body_dict.get(frontend_key) is not None:
                updates[db_column] = body_dict[frontend_key]

        if not updates:
            return {
                "success": True,
                "message": "Nothing to update"
            }

        set_clause = ", ".join([
            f"{col} = :{col}" for col in updates.keys()
        ])

        updates["user_id"] = token.get("user_id")

        db.execute(
            text(f"""
                UPDATE users
                SET {set_clause}
                WHERE id = :user_id
            """),
            updates
        )

        db.commit()

        return {
            "success": True,
            "message": "Profile updated successfully"
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Update profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    db = get_db()

    try:
        user = db.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": body.email.lower()}
        ).fetchone()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="No account found with this email"
            )

        otp = generate_otp()

        store_otp(body.email.lower(), otp)

        email_sent = send_otp_email(
            to_email=body.email.lower(),
            otp=otp,
            user_name=user.name
        )

        if email_sent:
            return {
                "message": "OTP sent successfully ✅",
                "email": body.email
            }

        # Fallback if SMTP connection fails (e.g. port blocked by ISP/firewall/VPN)
        logger.warning(
            f"SMTP email delivery failed for {body.email}. "
            f"Developer fallback activated: Check terminal/logs for OTP! "
            f"OTP is: {otp}"
        )
        return {
            "message": f"OTP is {otp} (logged to console due to SMTP failure) ⚠️",
            "email": body.email,
            "warning": "SMTP failed. Please check the backend terminal/logs to view the OTP."
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    db = get_db()

    try:
        if not verify_otp(body.email.lower(), body.otp):
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired OTP"
            )

        user = db.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": body.email.lower()}
        ).fetchone()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        db.execute(
            text("""
                UPDATE users
                SET password = :password
                WHERE email = :email
            """),
            {
                "password": hash_password(body.new_password),
                "email": body.email.lower()
            }
        )

        db.commit()

        return {
            "message": "Password reset successfully ✅"
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        logger.error(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()
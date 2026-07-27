from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.utils.auth import verify_token
from app.database import SessionLocal
from sqlalchemy import text
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        pass


class MedicineRequest(BaseModel):
    userId: str
    name: str
    generic: Optional[str] = ""
    manufacturer: Optional[str] = ""
    barcode: Optional[str] = ""
    expiry: str
    reminderTimes: Optional[List[str]] = []
    category: Optional[str] = "General"


@router.post("/save", status_code=201)
async def save_medicine(
    body: MedicineRequest,
    token: dict = Depends(verify_token),
):
    medicine_id = str(uuid.uuid4())
    db = get_db()
    try:
        db.execute(text("""
            INSERT INTO medicines (id, user_id, name, generic, manufacturer, barcode, expiry, reminder_times, category, created_at)
            VALUES (:id, :user_id, :name, :generic, :manufacturer, :barcode, :expiry, :reminder_times, :category, :created_at)
        """), {
            "id": medicine_id,
            "user_id": body.userId,
            "name": body.name,
            "generic": body.generic or "",
            "manufacturer": body.manufacturer or "",
            "barcode": body.barcode or "",
            "expiry": body.expiry,
            "reminder_times": ",".join(body.reminderTimes) if body.reminderTimes else "",
            "category": body.category or "General",
            "created_at": datetime.utcnow()
        })
        db.commit()
        logger.info(f"Medicine saved: {body.name}")
        return {
            "success": True,
            "medicineId": medicine_id,
            "message": f"{body.name} saved successfully",
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Save medicine error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/{user_id}")
async def get_medicines(
    user_id: str,
    token: dict = Depends(verify_token),
):
    db = get_db()
    try:
        result = db.execute(
            text("SELECT * FROM medicines WHERE user_id = :user_id ORDER BY created_at DESC"),
            {"user_id": user_id}
        ).fetchall()
        medicines = [dict(row._mapping) for row in result]
        return {"medicines": medicines, "total": len(medicines)}
    except Exception as e:
        logger.error(f"Get medicines error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/expiring/{user_id}")
async def get_expiring_medicines(
    user_id: str,
    token: dict = Depends(verify_token),
):
    db = get_db()
    try:
        result = db.execute(
            text("SELECT * FROM medicines WHERE user_id = :user_id ORDER BY created_at DESC"),
            {"user_id": user_id}
        ).fetchall()
        medicines = [dict(row._mapping) for row in result]

        expiring = []
        for med in medicines:
            try:
                month, year = med['expiry'].split('/')
                expiry_date = datetime(int(year), int(month), 1)
                days_left = (expiry_date - datetime.utcnow()).days
                if days_left <= 60:
                    expiring.append({
                        **med,
                        "days_left": days_left,
                        "status": "expired" if days_left < 0 else "expiring_soon"
                    })
            except:
                pass
        return {"medicines": expiring, "total": len(expiring)}
    except Exception as e:
        logger.error(f"Get expiring medicines error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.delete("/{medicine_id}")
async def delete_medicine(
    medicine_id: str,
    token: dict = Depends(verify_token),
):
    db = get_db()
    try:
        db.execute(
            text("DELETE FROM medicines WHERE id = :id"),
            {"id": medicine_id}
        )
        db.commit()
        return {"success": True, "message": "Medicine deleted"}
    except Exception as e:
        db.rollback()
        logger.error(f"Delete medicine error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
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


class FamilyMemberRequest(BaseModel):
    userId: str
    name: str
    age: Optional[str] = ""
    relation: str
    phone: Optional[str] = ""
    blood_group: Optional[str] = ""
    conditions: Optional[str] = ""
    medicines: Optional[str] = ""


class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    conditions: Optional[str] = None
    medicines: Optional[str] = None
    check_in_note: Optional[str] = None


@router.post("/")
async def add_family_member(
    body: FamilyMemberRequest,
    token: dict = Depends(verify_token),
):
    member_id = str(uuid.uuid4())
    db = get_db()
    try:
        db.execute(text("""
            INSERT INTO family_members (id, user_id, name, age, relation, phone, blood_group, conditions, medicines, created_at)
            VALUES (:id, :user_id, :name, :age, :relation, :phone, :blood_group, :conditions, :medicines, :created_at)
        """), {
            "id": member_id,
            "user_id": body.userId,
            "name": body.name,
            "age": body.age or "",
            "relation": body.relation,
            "phone": body.phone or "",
            "blood_group": body.blood_group or "",
            "conditions": body.conditions or "",
            "medicines": body.medicines or "",
            "created_at": datetime.utcnow()
        })
        db.commit()
        logger.info(f"Family member added: {body.name}")
        return {
            "success": True,
            "id": member_id,
            "name": body.name,
            "message": f"{body.name} added successfully",
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Add family member error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/{user_id}")
async def get_family_members(
    user_id: str,
    token: dict = Depends(verify_token),
):
    db = get_db()
    try:
        result = db.execute(
            text("SELECT * FROM family_members WHERE user_id = :user_id ORDER BY created_at DESC"),
            {"user_id": user_id}
        ).fetchall()
        members = [dict(row._mapping) for row in result]
        return {"members": members, "total": len(members)}
    except Exception as e:
        logger.error(f"Get family members error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.put("/{member_id}")
async def update_family_member(
    member_id: str,
    body: FamilyMemberUpdate,
    token: dict = Depends(verify_token),
):
    db = get_db()
    try:
        field_map = {
            'name': 'name',
            'age': 'age',
            'phone': 'phone',
            'blood_group': 'blood_group',
            'conditions': 'conditions',
            'medicines': 'medicines',
            'check_in_note': 'check_in_note',
        }
        body_dict = body.dict()
        updates = {}
        for key, col in field_map.items():
            if body_dict.get(key) is not None:
                updates[col] = body_dict[key]

        if not updates:
            return {"success": True, "message": "Nothing to update"}

        updates["member_id"] = member_id
        set_clause = ", ".join([f"{col} = :{col}" for col in updates.keys() if col != "member_id"])

        db.execute(
            text(f"UPDATE family_members SET {set_clause} WHERE id = :member_id"),
            updates
        )
        db.commit()
        return {"success": True, "message": "Family member updated"}
    except Exception as e:
        db.rollback()
        logger.error(f"Update family member error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.post("/{member_id}/checkin")
async def log_checkin(
    member_id: str,
    note: str = "",
    token: dict = Depends(verify_token),
):
    db = get_db()
    try:
        db.execute(
            text("UPDATE family_members SET last_check_in = :now, check_in_note = :note WHERE id = :id"),
            {"now": datetime.utcnow(), "note": note, "id": member_id}
        )
        db.commit()
        return {
            "success": True,
            "message": "Check-in logged successfully",
            "checked_in_at": datetime.utcnow().isoformat(),
            "note": note
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Check-in error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.delete("/{member_id}")
async def delete_family_member(
    member_id: str,
    token: dict = Depends(verify_token),
):
    db = get_db()
    try:
        db.execute(
            text("DELETE FROM family_members WHERE id = :id"),
            {"id": member_id}
        )
        db.commit()
        return {"success": True, "message": "Family member removed"}
    except Exception as e:
        db.rollback()
        logger.error(f"Delete family member error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
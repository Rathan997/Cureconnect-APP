from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from app.utils.auth import verify_token
from app.database import SessionLocal
from sqlalchemy import text
import re, random, logging, bleach, uuid

logger = logging.getLogger(__name__)
router = APIRouter()

CONDITION_DB = {
    "fever": [
        {"name": "Viral Fever", "confidence": 85, "emergency": False,
         "description": "A common viral infection causing elevated body temperature.",
         "details": "Rest and stay hydrated. Take paracetamol for fever. See a doctor if fever exceeds 103°F or lasts more than 5 days."},
        {"name": "Dengue Fever", "confidence": 65, "emergency": True,
         "description": "Mosquito-borne viral disease very common in Chennai.",
         "details": "Warning signs: severe abdominal pain, vomiting, bleeding gums. Seek immediate care."},
        {"name": "Malaria", "confidence": 40, "emergency": False,
         "description": "Parasitic infection with cyclical fever, chills and sweating.",
         "details": "Blood test confirms diagnosis. Early treatment is effective."},
    ],
    "headache": [
        {"name": "Tension Headache", "confidence": 80, "emergency": False,
         "description": "Feels like a tight band around the head.",
         "details": "Caused by stress or dehydration. Rest helps."},
        {"name": "Migraine", "confidence": 55, "emergency": False,
         "description": "Severe one-sided throbbing pain.",
         "details": "Triggered by stress, food, or hormones."},
    ],
    "default": [
        {"name": "Viral Infection", "confidence": 70, "emergency": False,
         "description": "General viral illness.",
         "details": "Rest and hydration recommended."},
    ],
}

EMERGENCY_KEYWORDS = [
    "chest pain", "difficulty breathing", "stroke",
    "unconscious", "severe bleeding"
]

KEYWORD_MAP = {
    "fever": ["fever", "temperature", "chills"],
    "headache": ["headache", "migraine"],
}

SYMPTOM_SPECIALIST_MAP = {
    "fever": "General Physician",
    "cold": "General Physician",
    "cough": "General Physician",
    "headache": "Neurologist",
    "migraine": "Neurologist",
    "chest pain": "Cardiologist",
    "heart": "Cardiologist",
    "rash": "Dermatologist",
    "skin": "Dermatologist",
    "ear": "ENT Specialist",
    "throat": "ENT Specialist",
    "back pain": "Orthopedic",
    "joint": "Orthopedic",
    "stomach": "Gastroenterologist",
    "diabetes": "Diabetologist",
    "eye": "Ophthalmologist",
    "tooth": "Dentist",
    "dental": "Dentist",
    "child": "Pediatrician",
    "baby": "Pediatrician",
}

def get_specialist(symptoms_text: str) -> str:
    lower = symptoms_text.lower()
    for keyword, specialist in SYMPTOM_SPECIALIST_MAP.items():
        if keyword in lower:
            return specialist
    return "General Physician"


class SymptomRequest(BaseModel):
    symptoms: str

    @field_validator("symptoms")
    def validate_symptoms(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError("Provide valid symptoms")
        if len(v) > 500:
            raise ValueError("Too long")
        return v.strip()


def predict(symptoms_text: str) -> dict:
    clean = bleach.clean(symptoms_text, tags=[], strip=True)
    clean = re.sub(r"[^\w\s]", "", clean)
    lower = clean.lower()

    is_emergency = any(k in lower for k in EMERGENCY_KEYWORDS)

    category = "default"
    for cat, words in KEYWORD_MAP.items():
        if any(w in lower for w in words):
            category = cat
            break

    conditions = CONDITION_DB.get(category, CONDITION_DB["default"])

    result = []
    for c in conditions:
        confidence = c["confidence"] + random.randint(-5, 5)
        result.append({
            "name": c["name"],
            "confidence": max(10, min(95, confidence)),
            "description": c["description"],
            "details": c["details"],
            "emergency": c.get("emergency", False)
        })

    result.sort(key=lambda x: x["confidence"], reverse=True)

    return {
        "conditions": result,
        "emergency": is_emergency
    }


def get_db():
    db = SessionLocal()
    return db


@router.post("/analyze")
async def analyze_symptoms(
    body: SymptomRequest,
    token: dict = Depends(verify_token),
):
    try:
        result = predict(body.symptoms)

        top = result["conditions"][0] if result["conditions"] else {}
        specialist = get_specialist(body.symptoms)

        db = get_db()
        try:
            db.execute(text("""
                INSERT INTO symptom_checks (id, user_id, symptoms, condition, specialist, severity, confidence, advice, created_at)
                VALUES (:id, :user_id, :symptoms, :condition, :specialist, :severity, :confidence, :advice, NOW())
            """), {
                "id": str(uuid.uuid4()),
                "user_id": token.get("user_id"),
                "symptoms": body.symptoms,
                "condition": top.get("name", ""),
                "specialist": specialist,
                "severity": "Moderate" if top.get("confidence", 0) > 70 else "Mild",
                "confidence": top.get("confidence", 0),
                "advice": top.get("details", ""),
            })
            db.commit()
            logger.info(f"Symptom check saved for user {token.get('user_id')}")
        except Exception as db_err:
            db.rollback()
            logger.error(f"DB save error: {db_err}")
        finally:
            db.close()

        return result

    except Exception as e:
        logger.error(f"Analyze error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")


@router.get("/suggestions")
async def get_suggestions():
    return {
        "suggestions": [
            "Fever", "Headache", "Cough",
            "Body pain", "Fatigue", "Vomiting"
        ]
    }
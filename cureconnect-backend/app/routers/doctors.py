from fastapi import APIRouter, Depends, HTTPException, Query
from app.utils.auth import verify_token
from app.database import SessionLocal
from sqlalchemy import text
import math, logging, pickle, os

logger = logging.getLogger(__name__)
router = APIRouter()

# Load ML model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../ml_model.pkl")
ml_model = None
try:
    with open(MODEL_PATH, "rb") as f:
        ml_model = pickle.load(f)
    logger.info("✅ ML model loaded successfully!")
except Exception as e:
    logger.warning(f"⚠️ ML model not found: {e}")


def get_db():
    db = SessionLocal()
    try:
        return db
    finally:
        pass


def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dlng/2)**2)
    return round(R * 2 * math.asin(math.sqrt(a)), 1)


def predict_specialist(symptoms: str) -> tuple:
    """Use ML model to predict specialist from symptoms."""
    if ml_model is None:
        # Fallback keyword matching
        keyword_map = {
            "fever": "General Physician", "cold": "General Physician",
            "chest pain": "Cardiologist", "heart": "Cardiologist",
            "skin": "Dermatologist", "rash": "Dermatologist",
            "back pain": "Orthopedic", "joint": "Orthopedic",
            "headache": "Neurologist", "seizure": "Neurologist",
            "child": "Pediatrician", "baby": "Pediatrician",
            "pregnancy": "Gynecologist", "periods": "Gynecologist",
            "stomach": "Gastroenterologist", "diabetes": "Diabetologist",
            "ear": "ENT Specialist", "throat": "ENT Specialist",
        }
        lower = symptoms.lower()
        for keyword, spec in keyword_map.items():
            if keyword in lower:
                return spec, 75.0
        return "General Physician", 60.0

    try:
        prediction = ml_model.predict([symptoms])[0]
        proba = ml_model.predict_proba([symptoms])
        confidence = round(max(proba[0]) * 100, 1)
        return prediction, confidence
    except Exception as e:
        logger.error(f"ML prediction error: {e}")
        return "General Physician", 60.0


@router.get("/nearby")
async def nearby_doctors(
    lat: float = Query(20.5937),
    lng: float = Query(78.9629),
    specialization: str = Query("All"),
    radius: int = Query(5000000, le=10000000),
    city: str = Query("All"),
    state: str = Query("All"),
    token: dict = Depends(verify_token),
):
    db = get_db()
    try:
        query = "SELECT * FROM doctors WHERE 1=1"
        params = {}

        if specialization != "All":
            query += " AND specialization = :spec"
            params["spec"] = specialization
        if city != "All":
            query += " AND LOWER(city) = :city"
            params["city"] = city.lower()
        if state != "All":
            query += " AND LOWER(state) = :state"
            params["state"] = state.lower()

        result = db.execute(text(query), params).fetchall()
        doctors = [dict(row._mapping) for row in result]

        results = []
        for doc in doctors:
            dist = haversine(lat, lng, doc["lat"], doc["lng"])
            if dist <= radius / 1000:
                doc["distance"] = dist
                doc["languages"] = doc.get("languages", "").split(",")
                results.append(doc)

        results.sort(key=lambda x: x["distance"])
        return {"doctors": results[:100], "total": len(results)}

    except Exception as e:
        logger.error(f"Nearby doctors error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/suggest")
async def suggest_doctors(
    symptoms: str = Query(""),
    lat: float = Query(20.5937),
    lng: float = Query(78.9629),
    token: dict = Depends(verify_token),
):
    """AI-powered doctor suggestion based on symptoms using ML model."""
    db = get_db()
    try:
        # Use ML model to predict specialist
        specialist, confidence = predict_specialist(symptoms)
        logger.info(f"ML predicted: {specialist} ({confidence}%) for '{symptoms}'")

        # Fetch matching doctors from DB
        result = db.execute(
            text("SELECT * FROM doctors WHERE specialization = :spec ORDER BY rating DESC"),
            {"spec": specialist}
        ).fetchall()

        doctors = []
        for row in result:
            doc = dict(row._mapping)
            doc["distance"] = haversine(lat, lng, doc["lat"], doc["lng"])
            doc["languages"] = doc.get("languages", "").split(",")
            doctors.append(doc)

        doctors.sort(key=lambda x: x["distance"])

        # If no doctors found fall back to General Physician
        if not doctors:
            result = db.execute(
                text("SELECT * FROM doctors WHERE specialization = 'General Physician' ORDER BY rating DESC"),
            ).fetchall()
            doctors = []
            for row in result:
                doc = dict(row._mapping)
                doc["distance"] = haversine(lat, lng, doc["lat"], doc["lng"])
                doc["languages"] = doc.get("languages", "").split(",")
                doctors.append(doc)
            specialist = "General Physician"

        return {
            "specialization": specialist,
            "confidence": confidence,
            "ml_powered": ml_model is not None,
            "doctors": doctors[:10],
            "total": len(doctors)
        }

    except Exception as e:
        logger.error(f"Suggest doctors error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/all")
async def get_all_doctors(token: dict = Depends(verify_token)):
    db = get_db()
    try:
        result = db.execute(
            text("SELECT * FROM doctors ORDER BY rating DESC LIMIT 100")
        ).fetchall()
        doctors = []
        for row in result:
            doc = dict(row._mapping)
            doc["languages"] = doc.get("languages", "").split(",")
            doctors.append(doc)
        return {"doctors": doctors, "total": len(doctors)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/cities")
async def get_cities(token: dict = Depends(verify_token)):
    db = get_db()
    try:
        result = db.execute(
            text("SELECT DISTINCT city FROM doctors ORDER BY city")
        ).fetchall()
        cities = [row[0] for row in result]
        return {"cities": ["All"] + cities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/states")
async def get_states(token: dict = Depends(verify_token)):
    db = get_db()
    try:
        result = db.execute(
            text("SELECT DISTINCT state FROM doctors ORDER BY state")
        ).fetchall()
        states = [row[0] for row in result]
        return {"states": ["All"] + states}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/specializations")
async def get_specializations():
    return {
        "specializations": [
            "All", "General Physician", "Cardiologist", "Dermatologist",
            "ENT Specialist", "Orthopedic", "Neurologist", "Pediatrician",
            "Gynecologist", "Gastroenterologist", "Diabetologist",
        ]
    }
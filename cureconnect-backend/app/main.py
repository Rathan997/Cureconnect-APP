from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import engine
from app.models import models
from app.routers import appointments, auth, medicines, users, family, symptoms, doctors, chatbot, admin
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)

models.Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="CureConnect API",
    description="AI Symptom Checker & Doctor Suggestion Backend",
    version="1.0.0",
)

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/auth",         tags=["Auth"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(medicines.router,    prefix="/api/medicines",    tags=["Medicines"])
app.include_router(users.router,        prefix="/api/users",        tags=["Users"])
app.include_router(family.router,       prefix="/api/family",       tags=["Family"])
app.include_router(symptoms.router,     prefix="/api/symptoms",     tags=["Symptoms"])
app.include_router(doctors.router,      prefix="/api/doctors",      tags=["Doctors"])
app.include_router(chatbot.router,      prefix="/api/chatbot",      tags=["Chatbot"])
app.include_router(admin.router,        prefix="/api/admin",        tags=["Admin"])

@app.get("/")
def root():
    return {
        "status": "MediCheck API running ✅",
        "version": "1.0.0",
        "docs": "/docs",
    }

@app.get("/ping")
def ping():
    return {"ping": "pong"}

if __name__ == "__main__":
    # Trigger reload to load new env vars
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
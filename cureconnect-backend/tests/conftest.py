import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app.utils.auth import verify_token, get_current_user

from sqlalchemy.pool import StaticPool

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from app.models.models import User, Appointment, Medicine, FamilyMember, SymptomCheck

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Insert dummy user
    dummy_user = User(id=1, name="Test User", email="test@example.com", password="hashed_password")
    db.add(dummy_user)
    db.commit()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    async def mock_verify_token():
        return {"user_id": "1"}

    class MockUser:
        def __init__(self, id):
            self.id = id
            
    async def mock_get_current_user():
        return MockUser(id=1)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verify_token] = mock_verify_token
    app.dependency_overrides[get_current_user] = mock_get_current_user

    with TestClient(app) as c:
        yield c

    # Clear overrides after the test
    app.dependency_overrides.clear()

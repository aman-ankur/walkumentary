"""Test configuration and fixtures."""
import asyncio
import pytest
import pytest_asyncio
from unittest.mock import Mock, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import get_db, Base
from models.user import User
from models.location import Location
from models.tour import Tour
from models.cache import CacheEntry
from auth import get_current_user_from_token


# Test database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create test session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Create a test database session."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def override_get_db(db_session):
    """Override the get_db dependency."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass
    return _override_get_db


@pytest.fixture(scope="function")
def client(override_get_db):
    """Create a test client."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def mock_user():
    """Create a mock user for testing."""
    return User(
        id="550e8400-e29b-41d4-a716-446655440000",
        email="test@example.com",
        full_name="Test User",
        preferences={"theme": "light", "language": "en"}
    )


@pytest.fixture
def mock_location():
    """Create a mock location for testing."""
    return Location(
        id="550e8400-e29b-41d4-a716-446655440001",
        name="Test Location",
        latitude=40.7128,
        longitude=-74.0060,
        address="123 Test St, Test City",
        location_type="restaurant",
        metadata={"cuisine": "italian", "rating": 4.5}
    )


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client."""
    mock_client = Mock()
    mock_client.auth.get_user = AsyncMock()
    mock_client.auth.sign_in_with_password = AsyncMock()
    mock_client.auth.sign_out = AsyncMock()
    return mock_client


@pytest.fixture
def mock_authenticated_user():
    """Mock authenticated user dependency."""
    def _mock_user():
        return User(
            id="550e8400-e29b-41d4-a716-446655440000",
            email="test@example.com",
            full_name="Test User"
        )
    return _mock_user


@pytest.fixture
def authenticated_client(client, mock_authenticated_user):
    """Create a client with authenticated user."""
    app.dependency_overrides[get_current_user_from_token] = mock_authenticated_user
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def mock_nominatim_response():
    """Mock response from Nominatim API."""
    return [
        {
            "place_id": 123456,
            "display_name": "Test Location, Test City, Test State",
            "lat": "40.7128",
            "lon": "-74.0060",
            "type": "restaurant",
            "class": "amenity",
            "importance": 0.8,
            "address": {
                "name": "Test Location",
                "house_number": "123",
                "road": "Test Street",
                "city": "Test City",
                "state": "Test State",
                "country": "Test Country",
                "postcode": "12345"
            }
        }
    ]
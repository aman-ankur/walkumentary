"""
Pytest configuration and fixtures for the Walkumentary application.
"""
import os
import asyncio
import pytest
from unittest.mock import Mock, AsyncMock
from typing import Generator, Any

# Set test environment variables before importing application modules
os.environ.update({
    "ENVIRONMENT": "test",
    "SUPABASE_URL": "http://localhost:54321",
    "SUPABASE_SERVICE_ROLE_KEY": "test_key",
    "REDIS_URL": "redis://localhost:6379/1",
    "OPENAI_API_KEY": "test_openai_key",
    "ANTHROPIC_API_KEY": "test_anthropic_key",
    "DATABASE_URL": "sqlite:///:memory:",
    "ALLOWED_ORIGINS": "http://localhost:3000"
})

from app.database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine."""
    # Use in-memory SQLite for tests
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def test_db_session(test_engine):
    """Create a test database session."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def override_get_db(test_db_session):
    """Override the get_db dependency."""
    def _override_get_db():
        try:
            yield test_db_session
        finally:
            pass
    return _override_get_db


@pytest.fixture(scope="function")
def test_client(override_get_db):
    """Create a test client."""
    from app.main import app
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for testing."""
    mock_client = Mock()
    mock_client.chat.completions.create = AsyncMock()
    mock_client.audio.speech.create = AsyncMock()
    return mock_client


@pytest.fixture
def mock_anthropic_client():
    """Mock Anthropic client for testing."""
    mock_client = Mock()
    mock_client.messages.create = AsyncMock()
    return mock_client


@pytest.fixture
def mock_redis_client():
    """Mock Redis client for testing."""
    mock_client = Mock()
    mock_client.get = AsyncMock(return_value=None)
    mock_client.set = AsyncMock(return_value=True)
    mock_client.delete = AsyncMock(return_value=1)
    mock_client.exists = AsyncMock(return_value=False)
    return mock_client


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing."""
    mock_client = Mock()
    mock_client.auth.get_user = AsyncMock()
    mock_client.storage.from_.return_value.upload = AsyncMock()
    mock_client.storage.from_.return_value.download = AsyncMock()
    return mock_client


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "full_name": "Test User",
        "avatar_url": "https://example.com/avatar.jpg"
    }


@pytest.fixture
def sample_location_data():
    """Sample location data for testing."""
    return {
        "name": "Test Location",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "location_type": "landmark",
        "description": "A test location for unit tests"
    }


@pytest.fixture
def sample_tour_data():
    """Sample tour data for testing."""
    return {
        "title": "Test Tour",
        "content": "This is a test tour content",
        "duration_minutes": 15,
        "language": "en",
        "status": "completed",
        "interests": ["history", "culture"]
    }
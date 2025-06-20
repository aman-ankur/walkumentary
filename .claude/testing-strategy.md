# Comprehensive Testing Strategy - Walkumentary
*Full-Stack Testing Approach with High Coverage*

## 1. Testing Philosophy & Goals

### 1.1 Testing Principles
- **Test-Driven Development (TDD)** - Write tests before implementation
- **High Coverage** - Minimum 80% code coverage across all components
- **Fast Feedback** - Quick test execution for rapid development
- **Realistic Testing** - Tests that mirror real-world usage patterns
- **Isolation** - Each test should be independent and deterministic

### 1.2 Testing Pyramid
```
                    E2E Tests (10%)
                ─────────────────────
              Integration Tests (20%)
          ───────────────────────────────
         Unit Tests (70%)
    ─────────────────────────────────────────
```

### 1.3 Coverage Goals
- **Unit Tests:** 90% coverage
- **Integration Tests:** 80% coverage  
- **E2E Tests:** Cover critical user journeys
- **Performance Tests:** API response times, frontend Core Web Vitals
- **Security Tests:** Authentication, authorization, input validation

## 2. Frontend Testing Strategy

### 2.1 Testing Stack
```typescript
// Frontend testing dependencies
{
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^6.1.0", 
  "@testing-library/user-event": "^14.5.0",
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^29.7.0",
  "cypress": "^13.6.0",
  "msw": "^2.0.0",  // Mock Service Worker
  "@storybook/react": "^7.5.0",  // Component documentation
  "vitest": "^0.34.0"  // Alternative to Jest (faster)
}
```

### 2.2 Unit Testing Framework

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { server } from '../__mocks__/server';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8000';

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};
global.navigator.geolocation = mockGeolocation;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

### 2.3 Mock Service Worker Setup

```typescript
// src/__mocks__/handlers.ts
import { rest } from 'msw';
import { mockLocations, mockTours, mockUser } from './data';

export const handlers = [
  // Auth endpoints
  rest.get('/auth/user', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }
    return res(ctx.json({ data: mockUser, success: true }));
  }),

  // Location endpoints
  rest.get('/locations/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('query');
    const filteredLocations = mockLocations.filter(loc => 
      loc.name.toLowerCase().includes(query?.toLowerCase() || '')
    );
    
    return res(
      ctx.json({
        data: {
          locations: filteredLocations,
          suggestions: [],
          total: filteredLocations.length,
        },
        success: true,
      })
    );
  }),

  rest.post('/locations/detect', async (req, res, ctx) => {
    const { coordinates, radius } = await req.json();
    
    // Mock nearby locations based on coordinates
    const nearbyLocations = mockLocations.filter(loc => {
      const distance = calculateDistance(coordinates, loc.coordinates);
      return distance <= radius;
    });
    
    return res(
      ctx.json({
        data: { locations: nearbyLocations },
        success: true,
      })
    );
  }),

  rest.post('/locations/recognize', async (req, res, ctx) => {
    // Mock image recognition
    await ctx.delay(1000); // Simulate processing time
    
    return res(
      ctx.json({
        data: {
          identified: true,
          location: mockLocations[0],
          confidence: 8,
        },
        success: true,
      })
    );
  }),

  // Tour endpoints
  rest.post('/tours/generate', async (req, res, ctx) => {
    const tourData = await req.json();
    
    // Simulate tour generation delay
    await ctx.delay(2000);
    
    const mockTour = {
      ...mockTours[0],
      location_id: tourData.location_id,
      interests: tourData.interests,
      duration_minutes: tourData.duration_minutes,
    };
    
    return res(
      ctx.json({
        data: mockTour,
        success: true,
      })
    );
  }),

  rest.get('/tours/user', (req, res, ctx) => {
    return res(
      ctx.json({
        data: { tours: mockTours },
        success: true,
      })
    );
  }),

  // Audio endpoints
  rest.post('/audio/generate', async (req, res, ctx) => {
    await ctx.delay(1500);
    
    return res(
      ctx.json({
        data: { audio_url: 'http://localhost:8000/audio/mock-audio.mp3' },
        success: true,
      })
    );
  }),

  // Error scenarios
  rest.get('/locations/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('query');
    if (query === 'error-test') {
      return res(
        ctx.status(500),
        ctx.json({ error: 'Internal server error', success: false })
      );
    }
  }),
];

// Helper function to calculate distance between coordinates
function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
           Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Return distance in meters
}
```

### 2.4 Component Testing Examples

```typescript
// src/__tests__/components/TourGenerator.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TourGenerator } from '@/components/tour/TourGenerator';
import { mockLocation } from '../__mocks__/data';

const defaultProps = {
  location: mockLocation,
  onTourGenerated: jest.fn(),
  onCancel: jest.fn(),
};

describe('TourGenerator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with location information', () => {
    render(<TourGenerator {...defaultProps} />);
    
    expect(screen.getByText(mockLocation.name)).toBeInTheDocument();
    expect(screen.getByText(`${mockLocation.city}, ${mockLocation.country}`)).toBeInTheDocument();
  });

  it('allows selecting interests', async () => {
    const user = userEvent.setup();
    render(<TourGenerator {...defaultProps} />);
    
    const historyCheckbox = screen.getByRole('checkbox', { name: /history/i });
    const cultureCheckbox = screen.getByRole('checkbox', { name: /culture/i });
    
    await user.click(historyCheckbox);
    await user.click(cultureCheckbox);
    
    expect(historyCheckbox).toBeChecked();
    expect(cultureCheckbox).toBeChecked();
  });

  it('allows setting tour duration', async () => {
    const user = userEvent.setup();
    render(<TourGenerator {...defaultProps} />);
    
    const durationSlider = screen.getByRole('slider', { name: /duration/i });
    
    await user.clear(durationSlider);
    await user.type(durationSlider, '45');
    
    expect(durationSlider).toHaveValue('45');
  });

  it('generates tour with selected preferences', async () => {
    const user = userEvent.setup();
    render(<TourGenerator {...defaultProps} />);
    
    // Select interests
    await user.click(screen.getByRole('checkbox', { name: /history/i }));
    await user.click(screen.getByRole('checkbox', { name: /art/i }));
    
    // Set duration
    const durationSlider = screen.getByRole('slider', { name: /duration/i });
    await user.clear(durationSlider);
    await user.type(durationSlider, '60');
    
    // Generate tour
    const generateButton = screen.getByRole('button', { name: /generate tour/i });
    await user.click(generateButton);
    
    // Should show loading state
    expect(screen.getByText(/generating your tour/i)).toBeInTheDocument();
    expect(generateButton).toBeDisabled();
    
    // Wait for tour generation to complete
    await waitFor(() => {
      expect(defaultProps.onTourGenerated).toHaveBeenCalledWith(
        expect.objectContaining({
          interests: ['history', 'art'],
          duration_minutes: 60,
          location_id: mockLocation.id,
        })
      );
    }, { timeout: 3000 });
  });

  it('handles generation errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error by using a location that triggers error
    const errorLocation = { ...mockLocation, name: 'error-test' };
    
    render(<TourGenerator {...defaultProps} location={errorLocation} />);
    
    const generateButton = screen.getByRole('button', { name: /generate tour/i });
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to generate tour/i)).toBeInTheDocument();
    });
    
    // Button should be enabled again for retry
    expect(generateButton).not.toBeDisabled();
  });

  it('shows validation errors for invalid inputs', async () => {
    const user = userEvent.setup();
    render(<TourGenerator {...defaultProps} />);
    
    // Try to generate without selecting any interests
    const generateButton = screen.getByRole('button', { name: /generate tour/i });
    await user.click(generateButton);
    
    expect(screen.getByText(/please select at least one interest/i)).toBeInTheDocument();
    expect(defaultProps.onTourGenerated).not.toHaveBeenCalled();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<TourGenerator {...defaultProps} />);
    
    // Tab through form elements
    await user.tab();
    expect(screen.getByRole('checkbox', { name: /history/i })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('checkbox', { name: /culture/i })).toHaveFocus();
    
    // Select interest with Space key
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: /culture/i })).toBeChecked();
  });
});
```

### 2.5 Hook Testing Examples

```typescript
// src/__tests__/hooks/useLocation.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useLocation } from '@/hooks/useLocation';

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('useLocation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with null location and no loading', () => {
    const { result } = renderHook(() => useLocation());
    
    expect(result.current.currentLocation).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.permissionStatus).toBe('prompt');
  });

  it('requests location and updates state', async () => {
    const mockPosition = {
      coords: {
        latitude: -33.9625,
        longitude: 18.4107,
        accuracy: 10,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useLocation());
    
    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.currentLocation).toEqual(mockPosition);
    expect(result.current.loading).toBe(false);
    expect(result.current.permissionStatus).toBe('granted');
  });

  it('handles geolocation errors', async () => {
    const mockError = {
      code: 1,
      message: 'User denied geolocation',
    };

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useLocation());
    
    act(() => {
      result.current.getCurrentLocation();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('User denied geolocation');
    expect(result.current.loading).toBe(false);
    expect(result.current.permissionStatus).toBe('denied');
  });

  it('watches position changes', async () => {
    const watchId = 123;
    mockGeolocation.watchPosition.mockReturnValue(watchId);

    const { result } = renderHook(() => useLocation());
    
    act(() => {
      result.current.watchPosition();
    });

    expect(mockGeolocation.watchPosition).toHaveBeenCalled();
    expect(result.current.watching).toBe(true);

    act(() => {
      result.current.clearWatch();
    });

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
    expect(result.current.watching).toBe(false);
  });
});
```

## 3. Backend Testing Strategy

### 3.1 Testing Stack
```python
# Backend testing dependencies
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
pytest-mock==3.12.0
httpx==0.25.0
factory-boy==3.3.0
faker==20.1.0
freezegun==1.2.2  # Time mocking
respx==0.20.2     # HTTP mocking
```

### 3.2 Test Configuration

```python
# pytest.ini
[tool:pytest]
testpaths = app/tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --strict-markers
    --strict-config
    --verbose
    --cov=app
    --cov-report=term-missing
    --cov-report=html:htmlcov
    --cov-report=xml
    --cov-fail-under=80
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
    external: Tests requiring external services
asyncio_mode = auto
```

### 3.3 Test Factories

```python
# app/tests/factories.py
import factory
from factory.fuzzy import FuzzyChoice, FuzzyDecimal, FuzzyInteger
from faker import Faker
import uuid
from datetime import datetime

from app.models.user import User
from app.models.location import Location
from app.models.tour import Tour

fake = Faker()

class UserFactory(factory.Factory):
    class Meta:
        model = User
    
    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    full_name = factory.Faker('name')
    preferences = factory.LazyFunction(lambda: {
        "interests": fake.random_elements(
            elements=["history", "culture", "food", "art", "nature"],
            length=3,
            unique=True
        ),
        "language": "en",
        "default_tour_duration": 30,
        "audio_speed": 1.0,
    })
    is_active = True
    created_at = factory.Faker('date_time_this_year')
    updated_at = factory.LazyAttribute(lambda obj: obj.created_at)

class LocationFactory(factory.Factory):
    class Meta:
        model = Location
    
    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    name = factory.Faker('city')
    description = factory.Faker('text', max_nb_chars=200)
    latitude = FuzzyDecimal(-90, 90, precision=6)
    longitude = FuzzyDecimal(-180, 180, precision=6)
    country = factory.Faker('country')
    city = factory.Faker('city')
    location_type = FuzzyChoice(['landmark', 'museum', 'park', 'restaurant'])
    metadata = factory.LazyFunction(lambda: {
        "opening_hours": "9:00-17:00",
        "website": fake.url(),
        "rating": fake.random_int(1, 5),
    })
    is_active = True
    created_at = factory.Faker('date_time_this_year')
    updated_at = factory.LazyAttribute(lambda obj: obj.created_at)

class TourFactory(factory.Factory):
    class Meta:
        model = Tour
    
    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    title = factory.Faker('sentence', nb_words=4)
    description = factory.Faker('text', max_nb_chars=150)
    content = factory.Faker('text', max_nb_chars=2000)
    audio_url = factory.LazyFunction(lambda: f"audio/{uuid.uuid4()}.mp3")
    duration_minutes = FuzzyInteger(15, 120)
    interests = factory.LazyFunction(lambda: fake.random_elements(
        elements=["history", "culture", "food", "art"],
        length=2,
        unique=True
    ))
    language = "en"
    llm_provider = FuzzyChoice(['openai', 'anthropic'])
    llm_model = factory.LazyAttribute(lambda obj: 
        'gpt-4o-mini' if obj.llm_provider == 'openai' else 'claude-3-haiku-20240307'
    )
    status = "ready"
    user_id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    location_id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    created_at = factory.Faker('date_time_this_year')
    updated_at = factory.LazyAttribute(lambda obj: obj.created_at)

# Factory for creating test data
class TestDataFactory:
    @staticmethod
    def create_user(**kwargs):
        return UserFactory(**kwargs)
    
    @staticmethod
    def create_location(**kwargs):
        return LocationFactory(**kwargs)
    
    @staticmethod
    def create_tour(**kwargs):
        return TourFactory(**kwargs)
    
    @staticmethod
    def create_tour_with_location_and_user(**kwargs):
        user = UserFactory()
        location = LocationFactory()
        return TourFactory(user_id=user.id, location_id=location.id, **kwargs)
```

### 3.4 API Testing Examples

```python
# app/tests/test_routers/test_tours.py
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
import json

from app.models.user import User
from app.models.location import Location
from app.models.tour import Tour
from app.tests.factories import TestDataFactory

class TestTourRoutes:
    
    @pytest.mark.asyncio
    async def test_generate_tour_success(
        self,
        client: AsyncClient,
        db_session,
        test_user: User,
        test_location: Location
    ):
        """Test successful tour generation"""
        
        # Mock AI service
        mock_tour_data = {
            "title": "Exploring Table Mountain",
            "content": "Welcome to this amazing tour...",
            "metadata": {"provider": "openai"}
        }
        
        with patch('app.services.ai_service.ai_service.generate_tour_content') as mock_ai:
            mock_ai.return_value = mock_tour_data
            
            tour_request = {
                "location_id": str(test_location.id),
                "interests": ["history", "nature"],
                "duration_minutes": 45,
                "language": "en"
            }
            
            response = await client.post(
                "/tours/generate",
                json=tour_request,
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["title"] == "Exploring Table Mountain"
            assert data["data"]["interests"] == ["history", "nature"]
            assert data["data"]["duration_minutes"] == 45
            
            # Verify AI service was called with correct parameters
            mock_ai.assert_called_once()
            call_args = mock_ai.call_args[1]
            assert call_args["interests"] == ["history", "nature"]
            assert call_args["duration_minutes"] == 45
    
    @pytest.mark.asyncio
    async def test_generate_tour_invalid_location(
        self,
        client: AsyncClient,
        test_user: User
    ):
        """Test tour generation with invalid location ID"""
        
        tour_request = {
            "location_id": "invalid-location-id",
            "interests": ["history"],
            "duration_minutes": 30,
            "language": "en"
        }
        
        response = await client.post(
            "/tours/generate",
            json=tour_request,
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert "location not found" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_generate_tour_ai_service_error(
        self,
        client: AsyncClient,
        test_user: User,
        test_location: Location
    ):
        """Test tour generation when AI service fails"""
        
        with patch('app.services.ai_service.ai_service.generate_tour_content') as mock_ai:
            mock_ai.side_effect = Exception("AI service unavailable")
            
            tour_request = {
                "location_id": str(test_location.id),
                "interests": ["history"],
                "duration_minutes": 30,
                "language": "en"
            }
            
            response = await client.post(
                "/tours/generate",
                json=tour_request,
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            assert response.status_code == 500
            data = response.json()
            assert data["success"] is False
            assert "ai service" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_get_user_tours(
        self,
        client: AsyncClient,
        db_session,
        test_user: User
    ):
        """Test getting user's tours"""
        
        # Create test tours for user
        tours = [
            TestDataFactory.create_tour(user_id=test_user.id) 
            for _ in range(3)
        ]
        
        for tour in tours:
            db_session.add(tour)
        await db_session.commit()
        
        response = await client.get(
            "/tours/user",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["tours"]) == 3
    
    @pytest.mark.asyncio
    async def test_get_tour_by_id(
        self,
        client: AsyncClient,
        db_session,
        test_user: User
    ):
        """Test getting specific tour by ID"""
        
        tour = TestDataFactory.create_tour(user_id=test_user.id)
        db_session.add(tour)
        await db_session.commit()
        
        response = await client.get(
            f"/tours/{tour.id}",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == str(tour.id)
        assert data["data"]["title"] == tour.title
    
    @pytest.mark.asyncio
    async def test_delete_tour(
        self,
        client: AsyncClient,
        db_session,
        test_user: User
    ):
        """Test deleting a tour"""
        
        tour = TestDataFactory.create_tour(user_id=test_user.id)
        db_session.add(tour)
        await db_session.commit()
        
        response = await client.delete(
            f"/tours/{tour.id}",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Verify tour is deleted
        deleted_tour = await db_session.get(Tour, tour.id)
        assert deleted_tour is None
    
    @pytest.mark.asyncio
    async def test_generate_tour_validation_errors(
        self,
        client: AsyncClient,
        test_user: User
    ):
        """Test validation errors in tour generation"""
        
        # Missing required fields
        invalid_requests = [
            {},  # Empty request
            {"location_id": "test"},  # Missing other fields
            {"location_id": "test", "interests": []},  # Empty interests
            {"location_id": "test", "interests": ["history"], "duration_minutes": 0},  # Invalid duration
            {"location_id": "test", "interests": ["history"], "duration_minutes": 200},  # Too long duration
        ]
        
        for invalid_request in invalid_requests:
            response = await client.post(
                "/tours/generate",
                json=invalid_request,
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio 
    async def test_unauthorized_access(self, client: AsyncClient):
        """Test unauthorized access to tour endpoints"""
        
        # Without auth header
        response = await client.post("/tours/generate", json={})
        assert response.status_code == 401
        
        response = await client.get("/tours/user")
        assert response.status_code == 401
        
        # With invalid token
        response = await client.get(
            "/tours/user",
            headers={"Authorization": "Bearer invalid-token"}
        )
        assert response.status_code == 401

class TestTourService:
    
    @pytest.mark.asyncio
    async def test_create_tour_in_database(self, db_session):
        """Test creating tour in database"""
        from app.services.tour_service import TourService
        
        tour_service = TourService(db_session)
        user = TestDataFactory.create_user()
        location = TestDataFactory.create_location()
        
        # Add user and location to db
        db_session.add(user)
        db_session.add(location)
        await db_session.commit()
        
        tour_data = {
            "title": "Test Tour",
            "content": "Test content",
            "duration_minutes": 30,
            "interests": ["history"],
            "language": "en",
            "location_id": location.id,
            "user_id": user.id,
        }
        
        tour = await tour_service.create_tour(tour_data)
        
        assert tour.title == "Test Tour"
        assert tour.user_id == user.id
        assert tour.location_id == location.id
        assert tour.status == "generating"
    
    @pytest.mark.asyncio
    async def test_update_tour_status(self, db_session):
        """Test updating tour status"""
        from app.services.tour_service import TourService
        
        tour_service = TourService(db_session)
        tour = TestDataFactory.create_tour(status="generating")
        
        db_session.add(tour)
        await db_session.commit()
        
        updated_tour = await tour_service.update_tour_status(
            tour.id, 
            "ready", 
            audio_url="http://example.com/audio.mp3"
        )
        
        assert updated_tour.status == "ready"
        assert updated_tour.audio_url == "http://example.com/audio.mp3"
```

## 4. Integration Testing

### 4.1 Database Integration Tests

```python
# app/tests/test_integration/test_database.py
import pytest
from sqlalchemy import select
from app.models.user import User
from app.models.location import Location
from app.models.tour import Tour
from app.tests.factories import TestDataFactory

class TestDatabaseIntegration:
    
    @pytest.mark.asyncio
    async def test_user_tour_relationship(self, db_session):
        """Test user-tour relationship"""
        
        user = TestDataFactory.create_user()
        location = TestDataFactory.create_location()
        
        db_session.add(user)
        db_session.add(location)
        await db_session.commit()
        
        # Create tours for user
        tours = [
            TestDataFactory.create_tour(user_id=user.id, location_id=location.id)
            for _ in range(3)
        ]
        
        for tour in tours:
            db_session.add(tour)
        await db_session.commit()
        
        # Query user with tours
        result = await db_session.execute(
            select(User).where(User.id == user.id)
        )
        user_with_tours = result.scalar_one()
        
        # Test relationship loading
        assert len(user_with_tours.tours) == 3
        assert all(tour.user_id == user.id for tour in user_with_tours.tours)
    
    @pytest.mark.asyncio
    async def test_location_coordinates_query(self, db_session):
        """Test geographic queries on locations"""
        
        # Create locations in Cape Town area
        cape_town_locations = [
            TestDataFactory.create_location(
                latitude=-33.9249 + i * 0.01,
                longitude=18.4241 + i * 0.01,
                city="Cape Town"
            )
            for i in range(5)
        ]
        
        # Create location far away
        distant_location = TestDataFactory.create_location(
            latitude=40.7128,  # New York
            longitude=-74.0060,
            city="New York"
        )
        
        for location in cape_town_locations + [distant_location]:
            db_session.add(location)
        await db_session.commit()
        
        # Query locations near Cape Town
        center_lat, center_lng = -33.9249, 18.4241
        radius_deg = 0.1  # Approximate radius in degrees
        
        result = await db_session.execute(
            select(Location).where(
                (Location.latitude.between(center_lat - radius_deg, center_lat + radius_deg)) &
                (Location.longitude.between(center_lng - radius_deg, center_lng + radius_deg))
            )
        )
        nearby_locations = result.scalars().all()
        
        assert len(nearby_locations) == 5  # Should not include distant location
        assert all(loc.city == "Cape Town" for loc in nearby_locations)
    
    @pytest.mark.asyncio
    async def test_cascade_delete(self, db_session):
        """Test cascade delete behavior"""
        
        user = TestDataFactory.create_user()
        location = TestDataFactory.create_location()
        
        db_session.add(user)
        db_session.add(location)
        await db_session.commit()
        
        # Create tours for user
        tours = [
            TestDataFactory.create_tour(user_id=user.id, location_id=location.id)
            for _ in range(3)
        ]
        
        for tour in tours:
            db_session.add(tour)
        await db_session.commit()
        
        # Delete user - should cascade delete tours
        await db_session.delete(user)
        await db_session.commit()
        
        # Verify tours are deleted
        result = await db_session.execute(select(Tour))
        remaining_tours = result.scalars().all()
        assert len(remaining_tours) == 0
```

### 4.2 API Integration Tests

```python
# app/tests/test_integration/test_full_workflow.py
import pytest
from httpx import AsyncClient
from unittest.mock import patch

class TestFullWorkflow:
    
    @pytest.mark.asyncio
    async def test_complete_tour_generation_workflow(
        self,
        client: AsyncClient,
        test_user,
        test_location
    ):
        """Test complete workflow from location search to tour generation"""
        
        # Step 1: Search for locations
        response = await client.get(
            "/locations/search",
            params={"query": test_location.name},
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        search_data = response.json()
        assert len(search_data["data"]["locations"]) > 0
        found_location = search_data["data"]["locations"][0]
        
        # Step 2: Generate tour for found location
        with patch('app.services.ai_service.ai_service.generate_tour_content') as mock_ai:
            mock_ai.return_value = {
                "title": "Amazing Tour",
                "content": "Tour content here...",
                "metadata": {"provider": "openai"}
            }
            
            tour_request = {
                "location_id": found_location["id"],
                "interests": ["history", "culture"],
                "duration_minutes": 30,
                "language": "en"
            }
            
            response = await client.post(
                "/tours/generate",
                json=tour_request,
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            assert response.status_code == 200
            tour_data = response.json()
            tour_id = tour_data["data"]["id"]
        
        # Step 3: Get generated tour
        response = await client.get(
            f"/tours/{tour_id}",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        tour_details = response.json()
        assert tour_details["data"]["title"] == "Amazing Tour"
        
        # Step 4: Generate audio for tour
        with patch('app.services.ai_service.ai_service.generate_audio') as mock_audio:
            mock_audio.return_value = b"fake audio data"
            
            response = await client.post(
                "/audio/generate",
                json={"text": tour_details["data"]["content"]},
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
            
            assert response.status_code == 200
            audio_data = response.json()
            assert "audio_url" in audio_data["data"]
        
        # Step 5: Get user's tours
        response = await client.get(
            "/tours/user",
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        assert response.status_code == 200
        user_tours = response.json()
        assert len(user_tours["data"]["tours"]) >= 1
        assert any(tour["id"] == tour_id for tour in user_tours["data"]["tours"])
```

## 5. End-to-End Testing

### 5.1 Cypress Configuration

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // Code coverage
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
    env: {
      apiUrl: 'http://localhost:8000',
      testUserEmail: 'test@example.com',
      testUserPassword: 'testpassword123',
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
```

### 5.2 E2E Test Examples

```typescript
// cypress/e2e/tour-generation.cy.ts
describe('Tour Generation Flow', () => {
  beforeEach(() => {
    // Mock API responses
    cy.intercept('GET', '/api/auth/user', {
      fixture: 'user.json'
    }).as('getUser');
    
    cy.intercept('GET', '/api/locations/search*', {
      fixture: 'locations.json'
    }).as('searchLocations');
    
    cy.intercept('POST', '/api/tours/generate', {
      fixture: 'tour.json'
    }).as('generateTour');
    
    // Visit app and login
    cy.visit('/');
    cy.login();
  });

  it('should complete full tour generation flow', () => {
    // Search for location
    cy.get('[data-testid="location-search"]').type('Table Mountain');
    cy.wait('@searchLocations');
    
    // Select location from results
    cy.get('[data-testid="location-result"]').first().click();
    
    // Customize tour preferences
    cy.get('[data-testid="interest-history"]').check();
    cy.get('[data-testid="interest-culture"]').check();
    cy.get('[data-testid="duration-slider"]').clear().type('45');
    
    // Generate tour
    cy.get('[data-testid="generate-tour-btn"]').click();
    cy.wait('@generateTour');
    
    // Verify tour is generated and displayed
    cy.get('[data-testid="tour-title"]').should('contain', 'Table Mountain Tour');
    cy.get('[data-testid="tour-content"]').should('be.visible');
    cy.get('[data-testid="audio-player"]').should('be.visible');
    
    // Test audio player controls
    cy.get('[data-testid="play-button"]').click();
    cy.get('[data-testid="play-button"]').should('have.attr', 'aria-label', 'Pause');
    
    // Test saving tour
    cy.get('[data-testid="save-tour-btn"]').click();
    cy.get('[data-testid="toast-success"]').should('contain', 'Tour saved successfully');
  });

  it('should handle location search errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '/api/locations/search*', {
      statusCode: 500,
      body: { error: 'Search service unavailable' }
    }).as('searchError');
    
    cy.get('[data-testid="location-search"]').type('Invalid location');
    cy.wait('@searchError');
    
    cy.get('[data-testid="error-message"]')
      .should('contain', 'Search failed. Please try again.');
  });

  it('should work on mobile devices', () => {
    cy.viewport('iphone-x');
    
    // Test mobile navigation
    cy.get('[data-testid="mobile-menu-button"]').click();
    cy.get('[data-testid="mobile-menu"]').should('be.visible');
    
    // Test mobile search
    cy.get('[data-testid="location-search"]').should('be.visible');
    cy.get('[data-testid="location-search"]').type('Cape Town');
    
    // Test mobile tour generation
    cy.get('[data-testid="location-result"]').first().click();
    cy.get('[data-testid="generate-tour-btn"]').should('be.visible');
  });
});

// cypress/e2e/accessibility.cy.ts
describe('Accessibility Tests', () => {
  it('should be accessible with keyboard navigation', () => {
    cy.visit('/');
    cy.login();
    
    // Test tab navigation
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid', 'location-search');
    
    cy.tab();
    cy.focused().should('have.attr', 'data-testid', 'gps-button');
    
    cy.tab();
    cy.focused().should('have.attr', 'data-testid', 'camera-button');
  });

  it('should have proper ARIA labels and roles', () => {
    cy.visit('/');
    cy.login();
    
    cy.get('[data-testid="location-search"]')
      .should('have.attr', 'aria-label', 'Search for locations');
    
    cy.get('[data-testid="generate-tour-btn"]')
      .should('have.attr', 'role', 'button');
    
    cy.get('[data-testid="audio-player"]')
      .should('have.attr', 'role', 'region')
      .should('have.attr', 'aria-label', 'Audio player');
  });

  it('should meet WCAG contrast requirements', () => {
    cy.visit('/');
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });
});
```

## 6. Performance Testing

### 6.1 Frontend Performance Tests

```typescript
// cypress/e2e/performance.cy.ts
describe('Performance Tests', () => {
  it('should meet Core Web Vitals thresholds', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Measure performance metrics
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              cy.wrap(entry.startTime).should('be.lessThan', 2500); // LCP < 2.5s
            }
            if (entry.entryType === 'first-input') {
              cy.wrap(entry.processingStart - entry.startTime).should('be.lessThan', 100); // FID < 100ms
            }
          });
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      }
    });
    
    // Test initial page load
    cy.get('[data-testid="main-content"]').should('be.visible');
  });

  it('should load search results within acceptable time', () => {
    cy.visit('/');
    cy.login();
    
    const startTime = Date.now();
    cy.get('[data-testid="location-search"]').type('Table Mountain');
    
    cy.get('[data-testid="search-results"]').should('be.visible').then(() => {
      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(1000); // Search results < 1s
    });
  });
});
```

### 6.2 Backend Performance Tests

```python
# app/tests/test_performance.py
import pytest
import asyncio
import time
from httpx import AsyncClient
from concurrent.futures import ThreadPoolExecutor

class TestPerformance:
    
    @pytest.mark.asyncio
    async def test_location_search_response_time(self, client: AsyncClient, test_user):
        """Test location search API response time"""
        
        start_time = time.time()
        
        response = await client.get(
            "/locations/search",
            params={"query": "Cape Town"},
            headers={"Authorization": f"Bearer {test_user.token}"}
        )
        
        end_time = time.time()
        response_time = (end_time - start_time) * 1000  # Convert to ms
        
        assert response.status_code == 200
        assert response_time < 500  # Should respond within 500ms
    
    @pytest.mark.asyncio
    async def test_concurrent_tour_generation(self, client: AsyncClient, test_user, test_location):
        """Test handling concurrent tour generation requests"""
        
        async def generate_tour():
            return await client.post(
                "/tours/generate",
                json={
                    "location_id": str(test_location.id),
                    "interests": ["history"],
                    "duration_minutes": 30,
                    "language": "en"
                },
                headers={"Authorization": f"Bearer {test_user.token}"}
            )
        
        # Mock AI service to avoid external calls
        with patch('app.services.ai_service.ai_service.generate_tour_content') as mock_ai:
            mock_ai.return_value = {
                "title": "Test Tour",
                "content": "Test content"
            }
            
            # Generate 5 tours concurrently
            tasks = [generate_tour() for _ in range(5)]
            responses = await asyncio.gather(*tasks)
            
            # All requests should succeed
            for response in responses:
                assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_database_query_performance(self, db_session):
        """Test database query performance with large dataset"""
        
        # Create large number of locations
        locations = [
            TestDataFactory.create_location() 
            for _ in range(1000)
        ]
        
        for location in locations:
            db_session.add(location)
        await db_session.commit()
        
        # Test search query performance
        start_time = time.time()
        
        result = await db_session.execute(
            select(Location).where(Location.city.like('%Cape%')).limit(10)
        )
        search_results = result.scalars().all()
        
        end_time = time.time()
        query_time = (end_time - start_time) * 1000
        
        assert len(search_results) <= 10
        assert query_time < 100  # Query should complete within 100ms
```

## 7. Testing Automation & CI/CD

### 7.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      working-directory: frontend
      run: npm ci
    
    - name: Run type checking
      working-directory: frontend
      run: npm run type-check
    
    - name: Run linting
      working-directory: frontend
      run: npm run lint
    
    - name: Run unit tests
      working-directory: frontend
      run: npm run test:coverage
    
    - name: Run Cypress tests
      working-directory: frontend
      run: npm run test:e2e:headless
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: frontend/coverage/lcov.info
        flags: frontend

  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      working-directory: backend
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-dev.txt
    
    - name: Run type checking
      working-directory: backend
      run: mypy app/
    
    - name: Run linting
      working-directory: backend
      run: |
        black --check app/
        isort --check-only app/
        flake8 app/
    
    - name: Run tests
      working-directory: backend
      run: pytest --cov=app --cov-report=xml
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
        SECRET_KEY: test-secret-key
        OPENAI_API_KEY: test-key
        ANTHROPIC_API_KEY: test-key
        SUPABASE_URL: http://localhost:54321
        SUPABASE_SERVICE_KEY: test-key
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: backend/coverage.xml
        flags: backend

  integration-tests:
    needs: [test-frontend, test-backend]
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Docker Compose
      run: |
        docker-compose -f docker-compose.test.yml up -d
        sleep 30  # Wait for services to start
    
    - name: Run integration tests
      run: |
        docker-compose -f docker-compose.test.yml exec -T backend pytest app/tests/test_integration/
    
    - name: Cleanup
      run: docker-compose -f docker-compose.test.yml down
```

### 7.2 Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-merge-conflict
      - id: check-yaml
      - id: check-json
  
  - repo: https://github.com/psf/black
    rev: 23.11.0
    hooks:
      - id: black
        files: ^backend/
        language_version: python3.9
  
  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
        files: ^backend/
        args: ["--profile", "black"]
  
  - repo: https://github.com/pycqa/flake8
    rev: 6.1.0
    hooks:
      - id: flake8
        files: ^backend/
  
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.55.0
    hooks:
      - id: eslint
        files: ^frontend/
        types: [file]
        types_or: [javascript, jsx, ts, tsx]
  
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        files: ^frontend/
        types_or: [javascript, jsx, ts, tsx, json, yaml, markdown]
```

This comprehensive testing strategy ensures high code quality, reliability, and maintainability throughout the development process. The combination of unit, integration, E2E, and performance tests provides confidence in the application's behavior across all scenarios.
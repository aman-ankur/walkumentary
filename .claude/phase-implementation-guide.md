# Phase Implementation Guide - Walkumentary
*Detailed step-by-step implementation with testing checkpoints*

## Phase Structure Overview

Each phase is designed to be **completely tested and functional** before moving to the next phase. This ensures:
- ✅ **Incremental Progress** - Working software at each phase
- ✅ **Risk Mitigation** - Issues caught early in development
- ✅ **Confidence Building** - Each phase validates the approach
- ✅ **Easy Debugging** - Smaller, focused changes per phase

## Phase 1: Foundation & Core Features (Days 1-7)

### Phase 1A: Project Setup & Authentication (Days 1-2)

#### Goals
- Set up both frontend and backend projects
- Implement basic authentication with Supabase
- Create development environment with testing
- Establish CI/CD pipeline

#### Frontend Tasks (Day 1)

**🔧 Setup & Configuration**
```bash
# 1. Create Next.js project
npx create-next-app@latest walkumentary-frontend --typescript --tailwind --eslint --app --src-dir
cd walkumentary-frontend

# 2. Install dependencies (from frontend implementation guide)
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @radix-ui/react-* lucide-react react-leaflet
npm install react-hook-form @hookform/resolvers zod
npm install next-pwa workbox-webpack-plugin

# 3. Install testing dependencies
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D jest jest-environment-jsdom @types/jest
npm install -D cypress @cypress/code-coverage
```

**📁 Project Structure Setup**
```bash
# Create directory structure
mkdir -p src/{components/{ui,layout,auth,common},lib,hooks,stores,__tests__}
mkdir -p src/components/{location,tour,audio,maps}
mkdir -p src/__tests__/{components,hooks,pages,utils}
```

**⚙️ Configuration Files**
1. Set up `next.config.js` with PWA and environment variables
2. Configure `tsconfig.json` with path aliases
3. Set up `jest.config.js` and `jest.setup.js`
4. Create `.env.local.example` with required variables

**🎨 Basic UI Components**
1. Install and configure shadcn/ui
2. Create basic layout components (Header, Navigation)
3. Set up global styles and theme configuration

**✅ Phase 1A Frontend Tests**
```bash
# Test commands to verify setup
npm run build          # Should build without errors
npm run type-check      # Should pass TypeScript validation
npm run test           # Should run basic tests
npm run lint          # Should pass linting
```

#### Backend Tasks (Day 2)

**🔧 Setup & Configuration**
```bash
# 1. Create backend project
mkdir walkumentary-backend
cd walkumentary-backend
python3.9 -m venv venv
source venv/bin/activate

# 2. Install dependencies (from backend implementation guide)
pip install fastapi uvicorn sqlalchemy asyncpg alembic
pip install supabase redis httpx pillow pydantic
pip install openai anthropic google-cloud-vision

# 3. Install testing dependencies
pip install pytest pytest-asyncio pytest-cov httpx factory-boy
```

**📁 Project Structure Setup**
```bash
# Create directory structure
mkdir -p app/{models,schemas,routers,services,utils,core,tests}
mkdir -p app/tests/{test_routers,test_services}
mkdir -p alembic/versions
```

**⚙️ Configuration & Database**
1. Set up `app/config.py` with multi-LLM provider support
2. Configure `app/database.py` with async SQLAlchemy
3. Create base models and Alembic configuration
4. Set up authentication with Supabase integration

**🔗 Basic API Endpoints**
1. Health check endpoint (`/health`)
2. Authentication endpoints (`/auth/*`)
3. Basic error handling and middleware

**✅ Phase 1A Backend Tests**
```bash
# Test commands to verify setup
pytest app/tests/test_health.py     # Health check endpoint
pytest app/tests/test_auth.py       # Authentication tests
uvicorn app.main:app --reload       # Should start without errors
```

#### Integration & Deployment (Day 2 Evening)

**🔗 Frontend-Backend Integration**
1. Configure API client in frontend
2. Set up authentication flow between frontend and backend
3. Test basic authentication end-to-end

**🚀 Development Deployment**
1. Set up Supabase project (free tier)
2. Configure environment variables
3. Deploy backend to Railway/Fly.io staging
4. Deploy frontend to Vercel staging

**✅ Phase 1A Integration Tests**
- [ ] User can access the application
- [ ] Google OAuth login works end-to-end
- [ ] Frontend can authenticate with backend
- [ ] Health check endpoint responds correctly
- [ ] Error handling works for auth failures

**🎯 Phase 1A Completion Criteria**
- ✅ Both projects set up with proper structure
- ✅ Authentication flow working end-to-end
- ✅ All tests passing (frontend and backend)
- ✅ Deployed to staging environments
- ✅ CI/CD pipeline operational

---

### Phase 1B: Location Search (Days 3-4)

#### Goals
- Implement text-based location search with autocomplete
- Integrate with Nominatim API for geocoding
- Add caching for search results
- Create comprehensive test coverage

#### Backend Tasks (Day 3)

**🏗️ Location Models & Services**
```python
# 1. Create Location model
class Location(BaseModel):
    name: str
    description: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    country: str
    city: str
    location_type: str
    metadata: dict = {}

# 2. Location service with Nominatim integration
class LocationService:
    async def search_locations(self, query: str, limit: int = 10):
        # Implementation with caching
        pass
```

**🔗 Location API Endpoints**
```python
# app/routers/locations.py
@router.get("/search", response_model=LocationSearchResponse)
async def search_locations(
    query: str,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    # Implementation with validation and error handling
    pass
```

**💾 Caching Implementation**
1. Set up Redis caching for Nominatim responses
2. Implement cache key strategy for location searches
3. Add cache invalidation and TTL management

**✅ Phase 1B Backend Tests**
```python
# Test location search functionality
async def test_location_search_success():
    # Test successful search with results
    pass

async def test_location_search_caching():
    # Test cache hit/miss scenarios
    pass

async def test_location_search_error_handling():
    # Test API failures and edge cases
    pass
```

#### Frontend Tasks (Day 4)

**🎨 Location Search Components**
```typescript
// 1. LocationSearch component with debouncing
const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Search for locations..."
}) => {
  // Implementation with useDebounce hook
};

// 2. SearchSuggestions component
const SearchSuggestions: React.FC<SuggestionsProps> = ({
  suggestions,
  onSelect,
  loading
}) => {
  // Implementation with keyboard navigation
};
```

**🔧 Custom Hooks**
```typescript
// hooks/useLocationSearch.ts
export const useLocationSearch = () => {
  // Debounced search with caching
  // Error handling and loading states
  // Return search results and functions
};

// hooks/useDebounce.ts
export const useDebounce = <T>(value: T, delay: number): T => {
  // Standard debounce implementation
};
```

**🔗 API Integration**
```typescript
// lib/api.ts - Location search methods
class ApiClient {
  async searchLocations(params: LocationSearchParams): Promise<ApiResponse<LocationSearchResult>> {
    // Implementation with proper error handling
  }
}
```

**✅ Phase 1B Frontend Tests**
```typescript
// Test location search components
describe('LocationSearch Component', () => {
  it('should render search input', () => {});
  it('should debounce search input', () => {});
  it('should display search results', () => {});
  it('should handle search errors', () => {});
  it('should call onLocationSelect when item clicked', () => {});
});

describe('useLocationSearch Hook', () => {
  it('should debounce search queries', () => {});
  it('should handle loading states', () => {});
  it('should cache search results', () => {});
});
```

#### Integration Testing (Day 4 Evening)

**🔗 E2E Location Search Flow**
```typescript
// cypress/e2e/location-search.cy.ts
describe('Location Search Flow', () => {
  it('should search and select location', () => {
    cy.visit('/');
    cy.get('[data-testid="location-search"]').type('Cape Town');
    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.get('[data-testid="location-result"]').first().click();
    // Verify location selection
  });
});
```

**✅ Phase 1B Integration Tests**
- [ ] Search autocomplete works with real API
- [ ] Cache improves subsequent search performance  
- [ ] Error handling works for API failures
- [ ] Search results display correctly on mobile
- [ ] Keyboard navigation works in search results

**🎯 Phase 1B Completion Criteria**
- ✅ Location search works with Nominatim API
- ✅ Autocomplete provides relevant suggestions
- ✅ Caching reduces API calls and improves performance
- ✅ All unit and integration tests passing
- ✅ Error handling covers edge cases
- ✅ Mobile-responsive search interface

---

### Phase 1C: GPS Location Detection & Nearby Discovery (Days 5-6) - **COMPLETED ✅**

#### Goals
- ✅ Implement advanced GPS-based location detection
- ✅ Add smart nearby landmark discovery with filtering
- ✅ Handle location permissions gracefully with comprehensive error handling
- ✅ Create advanced UX for location services with settings panel

#### **COMPLETED IMPLEMENTATION (June 21, 2025)**

**🎯 Phase 1C Achievements:**
- **Enhanced GPS Service**: Advanced `useGeolocation` hook with retry logic and comprehensive error handling
- **Smart Nearby Discovery**: `useNearbyLocations` hook with intelligent caching, filtering, and sorting
- **Advanced GPS UI**: `GPSLocationDetector` component with settings panel, real-time controls, and status indicators
- **New UI Components**: Badge, Slider, Switch, Select components with Radix UI integration
- **Comprehensive Testing**: 50+ test cases covering all GPS functionality and edge cases
- **Production Build**: Successful TypeScript compilation and build optimization

**📱 Advanced Features Implemented:**
- Location type filtering (museums, monuments, parks, landmarks, etc.)
- Dynamic radius selection (100m - 5km with slider control)
- Intelligent sorting (distance, rating, popularity)
- Real-time location tracking with auto-refresh
- Stale data detection with visual indicators
- Request cancellation to prevent race conditions
- Mobile-first responsive design with touch optimization

#### Backend Tasks (Day 5) - ✅ COMPLETED

**🌍 Geographic Services**
```python
# services/location_service.py
class LocationService:
    async def find_nearby_locations(
        self, 
        coordinates: Tuple[float, float], 
        radius: int = 1000,
        location_types: List[str] = None
    ) -> List[Location]:
        # Implementation with geographic queries
        # Use PostGIS functions for radius search
        pass
    
    async def detect_landmarks_near_coordinates(
        self,
        coordinates: Tuple[float, float]
    ) -> List[Location]:
        # Integration with external APIs for POI discovery
        pass
```

**📍 GPS Detection Endpoints**
```python
# app/routers/locations.py
@router.post("/detect", response_model=NearbyLocationsResponse)
async def detect_nearby_locations(
    request: GPSDetectionRequest,
    db: AsyncSession = Depends(get_db)
):
    # Validate coordinates
    # Find nearby locations
    # Return sorted by distance
    pass
```

**🗄️ Database Optimizations**
```sql
-- Add spatial indexes for performance
CREATE INDEX idx_locations_geog ON locations 
USING GIST(ST_Point(longitude, latitude));

-- Geographic search function
CREATE OR REPLACE FUNCTION find_nearby_locations(
    search_lat DECIMAL,
    search_lng DECIMAL,
    radius_meters INTEGER
) RETURNS TABLE(location_id UUID, distance_meters DECIMAL) AS $$
    -- Implementation using PostGIS
$$;
```

**✅ Phase 1C Backend Tests**
```python
async def test_nearby_locations_search():
    # Test finding locations within radius
    pass

async def test_coordinate_validation():
    # Test invalid coordinate handling
    pass

async def test_geographic_distance_calculation():
    # Test distance calculations are accurate
    pass
```

#### Frontend Tasks (Day 6)

**📍 GPS Components**
```typescript
// components/location/GPSDetector.tsx
const GPSDetector: React.FC<GPSDetectorProps> = ({
  onLocationDetected,
  onError,
  autoDetect = false
}) => {
  // Handle geolocation API
  // Show loading states
  // Handle permission requests
};

// components/common/LocationPermissionModal.tsx
const LocationPermissionModal: React.FC = () => {
  // Explain why location is needed
  // Guide user through enabling permissions
};
```

**🔧 Location Hooks**
```typescript
// hooks/useGeolocation.ts
export const useGeolocation = () => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const getCurrentPosition = useCallback(() => {
    // Implementation with error handling
  }, []);
  
  return { position, error, loading, getCurrentPosition };
};

// hooks/useNearbyLocations.ts
export const useNearbyLocations = () => {
  // Fetch nearby locations based on coordinates
  // Handle loading and error states
};
```

**🎨 Location Display Components**
```typescript
// components/location/LocationCard.tsx
const LocationCard: React.FC<LocationCardProps> = ({
  location,
  distance,
  onSelect
}) => {
  // Display location with distance
  // Show location type and description
  // Handle selection
};

// components/location/NearbyLocationsList.tsx
const NearbyLocationsList: React.FC<NearbyLocationsProps> = ({
  locations,
  loading,
  onLocationSelect
}) => {
  // List of nearby locations
  // Loading skeletons
  // Empty states
};
```

**✅ Phase 1C Frontend Tests**
```typescript
describe('GPS Location Detection', () => {
  it('should request location permission', () => {});
  it('should handle permission denial gracefully', () => {});
  it('should fetch nearby locations after getting coordinates', () => {});
  it('should display loading state during detection', () => {});
  it('should show error message for location failures', () => {});
});

describe('useGeolocation Hook', () => {
  it('should return current position when available', () => {});
  it('should handle geolocation errors', () => {});
  it('should update loading state correctly', () => {});
});
```

#### Integration & Mobile Testing (Day 6 Evening)

**📱 Mobile Device Testing**
- Test on actual mobile devices
- Verify permission prompts work correctly
- Test GPS accuracy and performance
- Validate battery impact

**🔗 E2E GPS Flow**
```typescript
// cypress/e2e/gps-detection.cy.ts
describe('GPS Location Detection', () => {
  it('should detect current location and show nearby places', () => {
    cy.visit('/');
    cy.mockGeolocation(-33.9249, 18.4241); // Cape Town coordinates
    cy.get('[data-testid="gps-detect-btn"]').click();
    cy.get('[data-testid="nearby-locations"]').should('be.visible');
    cy.get('[data-testid="location-card"]').should('have.length.greaterThan', 0);
  });
});
```

**✅ Phase 1C Integration Tests**
- [ ] GPS detection works on mobile devices
- [ ] Permission handling is user-friendly
- [ ] Nearby locations are relevant and accurate
- [ ] Error states are properly handled
- [ ] Performance is acceptable on slower devices

**🎯 Phase 1C Completion Criteria**
- ✅ GPS location detection works reliably
- ✅ Nearby landmarks are discovered automatically
- ✅ Permission handling provides clear user guidance
- ✅ Geographic search performs well with large datasets
- ✅ Mobile experience is smooth and responsive
- ✅ All tests passing including device testing

---

### Phase 1D: Basic Tour Generation (Days 7)

#### Goals
- Implement AI-powered tour content generation
- Support both OpenAI and Anthropic providers
- Add tour customization (interests, duration)
- Create tour management system

#### Backend Tasks (Day 7 Morning)

**🤖 AI Service Implementation**
```python
# services/ai_service.py
class AIService:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.default_provider = settings.DEFAULT_LLM_PROVIDER
    
    async def generate_tour_content(
        self,
        location: Location,
        interests: List[str],
        duration_minutes: int,
        language: str = "en",
        provider: Optional[LLMProvider] = None
    ) -> TourContent:
        # Implementation with caching and fallback
        pass
```

**📝 Tour Models & Services**
```python
# models/tour.py
class Tour(BaseModel):
    title: str
    content: str
    duration_minutes: int
    interests: List[str]
    language: str
    llm_provider: str
    llm_model: str
    status: str = "generating"
    user_id: UUID
    location_id: UUID

# services/tour_service.py
class TourService:
    async def create_tour(self, tour_data: TourCreateRequest) -> Tour:
        # Create tour in database
        # Trigger background AI generation
        pass
    
    async def update_tour_content(self, tour_id: UUID, content: TourContent):
        # Update tour with generated content
        pass
```

**🔗 Tour API Endpoints**
```python
# app/routers/tours.py
@router.post("/generate", response_model=TourResponse)
async def generate_tour(
    request: TourGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Validate request
    # Create tour in database
    # Start background generation
    # Return tour with "generating" status
    pass

@router.get("/{tour_id}", response_model=TourResponse)
async def get_tour(
    tour_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get tour by ID
    # Verify ownership
    pass
```

**✅ Phase 1D Backend Tests**
```python
async def test_tour_generation_openai():
    # Test tour generation with OpenAI
    pass

async def test_tour_generation_anthropic():
    # Test tour generation with Anthropic
    pass

async def test_provider_fallback():
    # Test fallback when primary provider fails
    pass

async def test_tour_caching():
    # Test content caching reduces API calls
    pass
```

#### Frontend Tasks (Day 7 Afternoon)

**🎨 Tour Generation Components**
```typescript
// components/tour/TourGenerator.tsx
const TourGenerator: React.FC<TourGeneratorProps> = ({
  location,
  onTourGenerated,
  onCancel
}) => {
  // Interest selection checkboxes
  // Duration slider
  // Language selection
  // Generate button with loading state
};

// components/tour/TourCustomizer.tsx
const TourCustomizer: React.FC<TourCustomizerProps> = ({
  onCustomizationChange,
  defaultValues
}) => {
  // Interest selection with icons
  // Duration slider with time display
  // Advanced options (expandable)
};

// components/tour/TourCard.tsx
const TourCard: React.FC<TourCardProps> = ({
  tour,
  onPlay,
  onEdit,
  onDelete
}) => {
  // Tour title and description
  // Duration and interests display
  // Action buttons
  // Status indicator (generating/ready/error)
};
```

**⚙️ Tour Hooks & State**
```typescript
// hooks/useTourGeneration.ts
export const useTourGeneration = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateTour = useCallback(async (params: TourGenerationParams) => {
    // Implementation with error handling
  }, []);
  
  return { generating, error, generateTour };
};

// stores/tour-store.ts
interface TourState {
  currentTour: Tour | null;
  userTours: Tour[];
  generating: boolean;
  error: string | null;
}

export const useTourStore = create<TourState>((set, get) => ({
  // Tour state management
  // Actions for CRUD operations
}));
```

**🔗 Real-time Updates**
```typescript
// hooks/useTourStatus.ts
export const useTourStatus = (tourId: string) => {
  // Poll for tour status updates
  // WebSocket connection for real-time updates (future)
  const [tour, setTour] = useState<Tour | null>(null);
  
  useEffect(() => {
    const pollStatus = async () => {
      // Check tour status every 2 seconds while generating
    };
    
    if (tour?.status === 'generating') {
      const interval = setInterval(pollStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [tour?.status]);
  
  return tour;
};
```

**✅ Phase 1D Frontend Tests**
```typescript
describe('Tour Generation Flow', () => {
  it('should allow selecting interests and duration', () => {});
  it('should start tour generation and show loading state', () => {});
  it('should poll for tour status updates', () => {});
  it('should display generated tour content', () => {});
  it('should handle generation errors gracefully', () => {});
});

describe('Tour Management', () => {
  it('should display user tours list', () => {});
  it('should allow editing tour preferences', () => {});
  it('should handle tour deletion', () => {});
});
```

#### Integration & End-to-End Testing (Day 7 Evening)

**🔗 Full Tour Generation Flow**
```typescript
// cypress/e2e/tour-generation.cy.ts
describe('Complete Tour Generation', () => {
  it('should generate tour from location search to content', () => {
    cy.visit('/');
    cy.login();
    
    // Search and select location
    cy.get('[data-testid="location-search"]').type('Table Mountain');
    cy.get('[data-testid="location-result"]').first().click();
    
    // Customize tour
    cy.get('[data-testid="interest-history"]').check();
    cy.get('[data-testid="duration-slider"]').invoke('val', 30).trigger('change');
    
    // Generate tour
    cy.get('[data-testid="generate-tour-btn"]').click();
    cy.get('[data-testid="generating-spinner"]').should('be.visible');
    
    // Wait for generation (with timeout)
    cy.get('[data-testid="tour-content"]', { timeout: 30000 }).should('be.visible');
    cy.get('[data-testid="tour-title"]').should('not.be.empty');
  });
});
```

**✅ Phase 1D Integration Tests**
- [ ] Complete tour generation flow works end-to-end
- [ ] Both OpenAI and Anthropic providers work
- [ ] Provider fallback works when primary fails
- [ ] Tour status updates work in real-time
- [ ] Generated content quality is acceptable
- [ ] Error handling covers all failure scenarios

**🎯 Phase 1D Completion Criteria**
- ✅ AI tour generation works with both providers
- ✅ Tour customization options function correctly
- ✅ Real-time status updates keep user informed
- ✅ Generated content is relevant and engaging
- ✅ Error handling is comprehensive and user-friendly
- ✅ Complete user journey tested end-to-end

---

## Phase 1 Final Integration & Testing (Day 7 Evening)

### Complete System Testing

**🔗 End-to-End User Journeys**
1. **New User Journey**: Registration → Location Search → Tour Generation
2. **GPS Journey**: GPS Detection → Nearby Discovery → Tour Creation
3. **Search Journey**: Text Search → Location Selection → Customization → Generation
4. **Error Recovery Journey**: Handle all error scenarios gracefully

**📊 Performance Testing**
- Load testing with multiple concurrent users
- Mobile performance on various devices
- API response time validation
- Database query performance optimization

**🔒 Security Testing**
- Authentication flow security
- API endpoint protection
- Input validation and sanitization
- Rate limiting functionality

**✅ Phase 1 Complete Success Criteria**
- ✅ All three location discovery methods working
- ✅ AI tour generation functional with both providers
- ✅ Complete user authentication and authorization
- ✅ Comprehensive error handling and user feedback
- ✅ Mobile-responsive design throughout
- ✅ All automated tests passing (90%+ coverage)
- ✅ Performance meets specified targets
- ✅ Deployed to staging with monitoring

## Moving to Phase 2

Once Phase 1 is complete and all criteria are met, you'll have a solid foundation with:
- **Working location discovery** (text search + GPS)
- **Functional AI tour generation** with both OpenAI and Anthropic
- **Solid authentication and user management**
- **Comprehensive testing framework**
- **Mobile-optimized user experience**

Phase 2 will build on this foundation to add:
- Image recognition for landmark identification
- Audio generation and playback
- Interactive mapping features
- Performance optimizations and polish

This structured approach ensures each phase delivers working software that can be demonstrated and tested, reducing risk and building confidence as the project progresses.
# Frontend Implementation Guide - Next.js 14
*Comprehensive guide for building the Walkumentary frontend with testing*

## 1. Project Setup & Architecture

### 1.1 Initial Setup Commands

```bash
# Create Next.js 14 project with TypeScript
npx create-next-app@latest walkumentary-frontend --typescript --tailwind --eslint --app --src-dir

cd walkumentary-frontend

# Install core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @radix-ui/react-avatar @radix-ui/react-button @radix-ui/react-card
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-input
npm install @radix-ui/react-label @radix-ui/react-progress @radix-ui/react-separator
npm install @radix-ui/react-sheet @radix-ui/react-switch @radix-ui/react-toast
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install react-leaflet leaflet
npm install react-hook-form @hookform/resolvers zod
npm install next-pwa workbox-webpack-plugin
npm install react-hot-toast sonner

# Install testing dependencies
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jest jest-environment-jsdom @types/jest
npm install -D cypress @cypress/code-coverage
npm install -D msw @mswjs/data
npm install -D @types/leaflet

# Install development dependencies
npm install -D prettier eslint-config-prettier eslint-plugin-testing-library
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### 1.2 Project Structure

```
src/
├── app/                          # Next.js 14 App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── loading.tsx              # Global loading UI
│   ├── error.tsx                # Global error UI
│   ├── not-found.tsx            # 404 page
│   ├── auth/
│   │   ├── callback/page.tsx    # OAuth callback
│   │   └── page.tsx             # Auth page
│   ├── search/
│   │   └── page.tsx             # Location search
│   ├── tour/
│   │   ├── [id]/page.tsx        # Tour details
│   │   └── create/page.tsx      # Tour creation
│   └── profile/
│       └── page.tsx             # User profile
├── components/                   # React components
│   ├── ui/                      # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── auth/                    # Authentication components
│   │   ├── AuthButton.tsx
│   │   ├── LoginForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── location/                # Location-related components
│   │   ├── LocationSearch.tsx
│   │   ├── LocationCard.tsx
│   │   ├── LocationList.tsx
│   │   ├── GPSDetector.tsx
│   │   └── ImageCapture.tsx
│   ├── tour/                    # Tour components
│   │   ├── TourCard.tsx
│   │   ├── TourGenerator.tsx
│   │   ├── TourCustomizer.tsx
│   │   └── TourPlayer.tsx
│   ├── audio/                   # Audio components
│   │   ├── AudioPlayer.tsx
│   │   ├── AudioControls.tsx
│   │   └── AudioProgress.tsx
│   ├── maps/                    # Map components
│   │   ├── InteractiveMap.tsx
│   │   ├── LocationMarker.tsx
│   │   └── TourRoute.tsx
│   └── common/                  # Common components
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── Toast.tsx
│       └── Modal.tsx
├── lib/                         # Utilities and configurations
│   ├── supabase.ts             # Supabase client
│   ├── api.ts                  # API client
│   ├── utils.ts                # Utility functions
│   ├── types.ts                # TypeScript types
│   ├── constants.ts            # App constants
│   ├── validations.ts          # Zod schemas
│   └── auth.ts                 # Auth helpers
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts              # Authentication hook
│   ├── useLocation.ts          # Geolocation hook
│   ├── useAudio.ts             # Audio playback hook
│   ├── useApi.ts               # API hook
│   ├── useDebounce.ts          # Debounce hook
│   └── useLocalStorage.ts      # Local storage hook
├── stores/                      # State management
│   ├── auth-store.ts           # Auth state
│   ├── location-store.ts       # Location state
│   ├── tour-store.ts           # Tour state
│   └── ui-store.ts             # UI state
├── styles/                      # Additional styles
│   ├── globals.css             # Global CSS
│   └── components.css          # Component-specific CSS
└── __tests__/                   # Test files
    ├── __mocks__/              # Mock files
    ├── components/             # Component tests
    ├── hooks/                  # Hook tests
    ├── pages/                  # Page tests
    └── utils/                  # Utility tests
```

## 2. Core Configuration Files

### 2.1 Next.js Configuration

```typescript
// next.config.js
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverActions: true,
  },
  images: {
    domains: [
      'supabase.co',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_MAPS_API_KEY: process.env.NEXT_PUBLIC_MAPS_API_KEY,
  },
  // Enable strict mode for better development experience
  reactStrictMode: true,
  // Optimize bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Performance optimizations
  swcMinify: true,
};

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
  ],
});

export default withPWAConfig(nextConfig);
```

### 2.2 TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/types/*": ["./src/lib/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "out"]
}
```

### 2.3 Testing Configuration

```javascript
// jest.config.js
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/cypress/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default createJestConfig(config);
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { server } from './__tests__/__mocks__/server';

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

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Establish API mocking before all tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 3. Core Type Definitions

```typescript
// src/lib/types.ts
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  interests: Interest[];
  language: string;
  default_tour_duration: number;
  audio_speed: number;
  theme: 'light' | 'dark' | 'system';
}

export type Interest = 
  | 'history'
  | 'culture'
  | 'food'
  | 'art'
  | 'architecture'
  | 'nature'
  | 'shopping'
  | 'entertainment';

export interface Location {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number]; // [lat, lng]
  country: string;
  city: string;
  type: LocationType;
  image_url?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export type LocationType = 
  | 'landmark'
  | 'museum'
  | 'park'
  | 'restaurant'
  | 'historical_site'
  | 'cultural_site'
  | 'entertainment'
  | 'shopping';

export interface Tour {
  id: string;
  title: string;
  description: string;
  content: string;
  audio_url?: string;
  duration_minutes: number;
  location: Location;
  interests: Interest[];
  language: string;
  status: 'generating' | 'ready' | 'error';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface LocationSearchParams {
  query: string;
  coordinates?: [number, number];
  radius?: number;
  limit?: number;
  types?: LocationType[];
}

export interface TourGenerationParams {
  location_id: string;
  interests: Interest[];
  duration_minutes: number;
  language: string;
  additional_preferences?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
}

// Component Props Types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LocationSearchProps extends ComponentProps {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export interface TourCardProps extends ComponentProps {
  tour: Tour;
  onPlay?: (tour: Tour) => void;
  onEdit?: (tour: Tour) => void;
  onDelete?: (tour: Tour) => void;
}

export interface AudioPlayerProps extends ComponentProps {
  audioUrl: string;
  title: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

// State Types
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LocationState {
  currentLocation: GeolocationPosition | null;
  selectedLocation: Location | null;
  nearbyLocations: Location[];
  searchResults: Location[];
  loading: boolean;
  error: string | null;
}

export interface TourState {
  currentTour: Tour | null;
  userTours: Tour[];
  generating: boolean;
  playing: boolean;
  error: string | null;
}
```

## 4. Core Utilities & Configurations

### 4.1 Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth helpers
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};
```

### 4.2 API Client

```typescript
// src/lib/api.ts
import { 
  ApiResponse, 
  LocationSearchParams, 
  TourGenerationParams,
  Location,
  Tour
} from './types';
import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Location services
  async searchLocations(params: LocationSearchParams): Promise<ApiResponse<{
    locations: Location[];
    suggestions: string[];
    total: number;
  }>> {
    const query = new URLSearchParams();
    
    query.append('query', params.query);
    if (params.coordinates) {
      query.append('coordinates', params.coordinates.join(','));
    }
    if (params.radius) {
      query.append('radius', params.radius.toString());
    }
    if (params.limit) {
      query.append('limit', params.limit.toString());
    }
    if (params.types) {
      query.append('types', params.types.join(','));
    }

    return this.request(`/locations/search?${query.toString()}`);
  }

  async detectNearbyLocations(
    coordinates: [number, number], 
    radius: number = 1000
  ): Promise<ApiResponse<{ locations: Location[] }>> {
    return this.request('/locations/detect', {
      method: 'POST',
      body: JSON.stringify({ coordinates, radius }),
    });
  }

  async recognizeLocationFromImage(
    imageFile: File
  ): Promise<ApiResponse<{
    identified: boolean;
    location?: Location;
    confidence?: number;
    message?: string;
  }>> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return this.request('/locations/recognize', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Tour services
  async generateTour(params: TourGenerationParams): Promise<ApiResponse<Tour>> {
    return this.request('/tours/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getTour(tourId: string): Promise<ApiResponse<Tour>> {
    return this.request(`/tours/${tourId}`);
  }

  async getUserTours(): Promise<ApiResponse<{ tours: Tour[] }>> {
    return this.request('/tours/user');
  }

  async deleteTour(tourId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/tours/${tourId}`, {
      method: 'DELETE',
    });
  }

  // Audio services
  async generateAudio(
    text: string,
    voice: string = 'alloy'
  ): Promise<ApiResponse<{ audio_url: string }>> {
    return this.request('/audio/generate', {
      method: 'POST',
      body: JSON.stringify({ text, voice }),
    });
  }
}

export const apiClient = new ApiClient();

// Error handling utility
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request retry utility
export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};
```

## 5. Testing Strategy Implementation

### 5.1 Component Testing Example

```typescript
// src/__tests__/components/LocationSearch.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationSearch } from '@/components/location/LocationSearch';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock data
const mockLocations = [
  {
    id: '1',
    name: 'Table Mountain',
    description: 'Iconic flat-topped mountain in Cape Town',
    coordinates: [-33.9625, 18.4107] as [number, number],
    country: 'South Africa',
    city: 'Cape Town',
    type: 'landmark' as const,
    metadata: {},
    created_at: '2023-01-01T00:00:00Z',
  },
];

const defaultProps = {
  onLocationSelect: jest.fn(),
  placeholder: 'Search locations...',
};

describe('LocationSearch Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    render(<LocationSearch {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search locations...')).toBeInTheDocument();
  });

  it('shows loading state while searching', async () => {
    mockApiClient.searchLocations.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<LocationSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search locations...');
    await userEvent.type(input, 'Table Mountain');

    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
  });

  it('displays search results', async () => {
    mockApiClient.searchLocations.mockResolvedValue({
      data: {
        locations: mockLocations,
        suggestions: [],
        total: 1,
      },
      success: true,
    });

    render(<LocationSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search locations...');
    await userEvent.type(input, 'Table Mountain');

    await waitFor(() => {
      expect(screen.getByText('Table Mountain')).toBeInTheDocument();
      expect(screen.getByText('Cape Town, South Africa')).toBeInTheDocument();
    });
  });

  it('calls onLocationSelect when location is clicked', async () => {
    mockApiClient.searchLocations.mockResolvedValue({
      data: {
        locations: mockLocations,
        suggestions: [],
        total: 1,
      },
      success: true,
    });

    render(<LocationSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search locations...');
    await userEvent.type(input, 'Table Mountain');

    await waitFor(() => {
      expect(screen.getByText('Table Mountain')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Table Mountain'));

    expect(defaultProps.onLocationSelect).toHaveBeenCalledWith(mockLocations[0]);
  });

  it('handles search errors gracefully', async () => {
    mockApiClient.searchLocations.mockRejectedValue(new Error('Search failed'));

    render(<LocationSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search locations...');
    await userEvent.type(input, 'Invalid location');

    await waitFor(() => {
      expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('debounces search input', async () => {
    jest.useFakeTimers();
    
    mockApiClient.searchLocations.mockResolvedValue({
      data: { locations: [], suggestions: [], total: 0 },
      success: true,
    });

    render(<LocationSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search locations...');
    
    await userEvent.type(input, 'T');
    await userEvent.type(input, 'a');
    await userEvent.type(input, 'b');

    // Should not have called the API yet
    expect(mockApiClient.searchLocations).not.toHaveBeenCalled();

    // Fast-forward timers
    jest.advanceTimersByTime(300);

    // Now it should have been called once
    expect(mockApiClient.searchLocations).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
```

### 5.2 Hook Testing Example

```typescript
// src/__tests__/hooks/useAuth.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with null user and loading state', () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('sets user when session exists', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
      },
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { 
        session: { 
          user: mockUser,
          access_token: 'mock-token',
          expires_at: Date.now() + 3600000,
        } 
      },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('handles sign in', async () => {
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://auth-url.com' },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  });

  it('handles sign out', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('handles auth errors', async () => {
    const error = new Error('Auth failed');
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Auth failed');
    expect(result.current.loading).toBe(false);
  });
});
```

## 6. Implementation Phases

### Phase 1A: Project Setup & Basic UI (Days 1-2)
1. Create Next.js project with all dependencies
2. Set up shadcn/ui components
3. Configure testing environment
4. Create basic layout components
5. Implement authentication UI
6. Test: Layout rendering, auth UI components

### Phase 1B: Authentication & Core Hooks (Days 3-4)
1. Implement Supabase authentication
2. Create useAuth hook
3. Set up protected routes
4. Create basic navigation
5. Test: Authentication flow, protected routes

### Phase 1C: Location Search UI (Days 5-6)
1. Build LocationSearch component
2. Implement debounced search
3. Create location result display
4. Add GPS detection UI
5. Test: Search functionality, GPS integration

### Phase 1D: Tour Generation UI (Days 7)
1. Create tour customization interface
2. Build TourCard component
3. Implement basic tour display
4. Test: Tour UI components, user interactions

This comprehensive frontend guide provides the foundation for building a robust, tested, and maintainable React application with Next.js 14.
// Core types that match the backend API schemas

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: UserPreferences;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  interests?: string[];
  language?: string;
  preferred_language?: string;
  narration_style?: string;
  voice_preference?: string;
  duration_preference?: number;
  default_tour_duration?: number;
  audio_speed?: number;
  theme?: string;
}

export interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
  location_type?: string;
  location_metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface LocationResponse extends Location {
  distance?: number;
}

export interface WalkableStop {
  name: string;
  description: string;
  approximate_address?: string;
  walking_time_from_previous?: string;
  content_duration?: string;
  highlights?: string[];
  latitude?: number;
  longitude?: number;
  geocoding_accuracy?: string;
  distance_from_main?: number;
}

export interface Tour {
  id: string;
  title: string;
  description?: string;
  content: string;
  duration_minutes: number;
  interests: string[];
  language: string;
  audio_url?: string;
  transcript?: TranscriptSegment[];
  status: 'generating' | 'ready' | 'error';
  location_id: string;
  user_id: string;
  location?: LocationResponse;
  created_at: string;
  updated_at: string;
  // Walkable tour fields
  walkable_stops?: WalkableStop[];
  total_walking_distance?: string;
  estimated_walking_time?: string;
  difficulty_level?: string;
  route_type?: string;
}

export interface TourGenerationParams {
  location_id: string;
  interests?: string[];
  duration_minutes?: number;
  language?: string;
  narration_style?: string;
  voice_preference?: string;
  voice?: string;
}

// API request/response types
export interface TourGenerationRequest extends TourGenerationParams {
  // Additional fields that might be sent to the API
}

export interface TourStatusResponse {
  status: 'generating' | 'ready' | 'error';
  progress?: number;
  message?: string;
}

// Location search and GPS types
export interface LocationSearchRequest {
  query: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit?: number;
}

export interface LocationSearchResponse {
  data: {
    locations: LocationResponse[];
  };
}

export interface GPSDetectionRequest {
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface NearbyLocationsResponse {
  data: {
    locations: LocationResponse[];
  };
}

export interface LocationCreate {
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
  location_type?: string;
  location_metadata?: any;
}
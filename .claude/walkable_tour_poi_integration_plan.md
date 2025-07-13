# Walkable Tour POI Integration Plan
*Created: July 13, 2025*  
*Status: Implementation Ready*  
*Goal: Transform audio tours into walkable experiences with mapped points of interest*

## Vision Statement
Transform Walkumentary into a Rick Steves-style walking tour experience where AI generates tours covering multiple walkable locations within a reasonable area, with all mentioned points of interest displayed on an interactive map for seamless exploration.

## Core Requirements

### Walking Tour Constraints
- **Maximum Walking Distance**: 1.5-2 km total tour route
- **Stop Spacing**: 50-300 meters between major points of interest
- **Tour Duration**: 10-30 minutes covering 3-8 distinct locations
- **Accessibility**: Routes suitable for average walking ability
- **Logical Flow**: Geographically sensible progression between stops

### Example Tour Structure
**"15-Minute Eiffel Tower Walking Tour"** would include:
1. **Eiffel Tower Base** (main location) - 3 minutes
2. **Champ de Mars Gardens** (200m walk) - 2 minutes  
3. **Pont de Bir-Hakeim Bridge** (300m walk) - 2 minutes
4. **Trocadéro Gardens** (400m walk) - 3 minutes
5. **Palais de Chaillot** (100m walk) - 2 minutes
6. **Return viewpoints** (nearby) - 3 minutes

## Implementation Phases

## Phase 1: Enhanced AI Tour Generation (Days 1-2)

### 1.1 Smart Prompt Engineering
**File**: `app/services/ai_service.py`

**Enhanced Prompt Structure**:
```python
def _create_walkable_tour_prompt(self, location, interests, duration_minutes, language, narration_style):
    prompt = f"""Create a {duration_minutes}-minute WALKING TOUR for {location['name']}, {location.get('city', '')}.

WALKING TOUR REQUIREMENTS:
- Generate 3-7 distinct stops within 1.5km radius
- Each stop should be 50-300 meters apart (walkable distance)
- Include specific landmark names, street addresses where possible
- Create logical walking route with clear directions between stops
- Focus on: {interests_text}

RESPONSE FORMAT - Return structured JSON:
{{
  "title": "Walking Tour Title",
  "content": "Complete narration script with clear stop transitions",
  "walkable_stops": [
    {{
      "name": "Stop Name",
      "description": "Brief description",
      "approximate_address": "Street address or landmark description",
      "walking_time_from_previous": "2 minutes",
      "content_duration": "3 minutes",
      "highlights": ["key feature 1", "key feature 2"]
    }}
  ],
  "total_walking_distance": "1.2 km",
  "estimated_walking_time": "15 minutes",
  "difficulty_level": "easy"
}}

CONTENT GUIDELINES:
- Include walking directions between stops
- Mention specific architectural details, historical facts
- Use present tense as if user is standing at each location
- Clear audio cues for when to move to next stop
"""
```

**Key Changes**:
- **Structured Output**: AI returns both narrative content AND structured stop data
- **Geographic Constraints**: Explicit distance and walkability requirements
- **Address Information**: Request specific addresses/landmarks for geocoding
- **Logical Flow**: Emphasis on sensible walking routes

### 1.2 Enhanced Content Processing
**File**: `app/services/tour_service.py`

**New Processing Pipeline**:
```python
async def _process_walkable_tour_content(self, content_data: dict, location: dict):
    """Process AI-generated content to extract walkable stops"""
    
    # Extract structured stops from AI response
    walkable_stops = content_data.get("walkable_stops", [])
    
    # Geocode each stop using existing location service
    geocoded_stops = []
    for stop in walkable_stops:
        coordinates = await self._geocode_stop(stop, location)
        if coordinates:
            geocoded_stops.append({
                **stop,
                "latitude": coordinates["lat"],
                "longitude": coordinates["lng"],
                "distance_from_main": self._calculate_distance(
                    location["coordinates"], coordinates
                )
            })
    
    return geocoded_stops

async def _geocode_stop(self, stop: dict, main_location: dict):
    """Geocode individual stop using location service"""
    # Use existing location_service.py search functionality
    search_query = f"{stop['name']}, {stop.get('approximate_address', '')}, {main_location.get('city', '')}"
    
    try:
        results = await location_service.search_locations(search_query, limit=1)
        if results and len(results) > 0:
            result = results[0]
            return {
                "lat": result["latitude"],
                "lng": result["longitude"],
                "accuracy": "geocoded"
            }
    except Exception as e:
        logger.warning(f"Failed to geocode stop {stop['name']}: {e}")
    
    return None
```

### 1.3 Database Schema Enhancement
**File**: `app/models/tour.py`

**Add New Fields**:
```python
class Tour(BaseModel):
    # ... existing fields ...
    
    # New walkable tour fields
    walkable_stops = Column(JSON, nullable=True)  # Array of stop objects with coordinates
    total_walking_distance = Column(String, nullable=True)  # "1.2 km"
    estimated_walking_time = Column(String, nullable=True)  # "15 minutes"
    difficulty_level = Column(String, default="easy")  # easy/moderate/challenging
    route_type = Column(String, default="walkable")  # walkable/driving/mixed
```

**Migration Script**:
```sql
-- Add walkable tour fields to tours table
ALTER TABLE tours ADD COLUMN walkable_stops JSONB DEFAULT '[]';
ALTER TABLE tours ADD COLUMN total_walking_distance VARCHAR(50);
ALTER TABLE tours ADD COLUMN estimated_walking_time VARCHAR(50);
ALTER TABLE tours ADD COLUMN difficulty_level VARCHAR(20) DEFAULT 'easy';
ALTER TABLE tours ADD COLUMN route_type VARCHAR(20) DEFAULT 'walkable';

-- Create index for walkable_stops JSONB queries
CREATE INDEX idx_tours_walkable_stops ON tours USING GIN (walkable_stops);
```

## Phase 2: Frontend Map Enhancement (Days 3-4)

### 2.1 Enhanced Tour Map Component
**File**: `frontend/src/components/map/WalkableTourMap.tsx`

**New Component Features**:
```typescript
interface WalkableStop {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  walking_time_from_previous: string;
  content_duration: string;
  highlights: string[];
  distance_from_main: number;
}

interface WalkableTourMapProps {
  tour: Tour & {
    walkable_stops?: WalkableStop[];
    total_walking_distance?: string;
    estimated_walking_time?: string;
  };
  currentAudioTime?: number;
  onStopClick?: (stop: WalkableStop, index: number) => void;
}

export function WalkableTourMap({ tour, currentAudioTime, onStopClick }: WalkableTourMapProps) {
  // Calculate which stop is currently active based on audio timing
  const activeStopIndex = useActiveStop(currentAudioTime, tour.walkable_stops);
  
  return (
    <MapContainer>
      {/* Main tour location */}
      <LocationMarker 
        location={tour.location} 
        isMain={true}
        isActive={activeStopIndex === 0}
      />
      
      {/* Walkable stops */}
      {tour.walkable_stops?.map((stop, index) => (
        <WalkableStopMarker
          key={index}
          stop={stop}
          index={index + 1}
          isActive={activeStopIndex === index + 1}
          onClick={() => onStopClick?.(stop, index)}
        />
      ))}
      
      {/* Walking route line */}
      <WalkingRoute stops={[tour.location, ...tour.walkable_stops]} />
      
      {/* User location */}
      <UserLocationMarker />
    </MapContainer>
  );
}
```

### 2.2 Walkable Stop Marker Component
**File**: `frontend/src/components/map/WalkableStopMarker.tsx`

**Custom Marker Design**:
```typescript
const createWalkableStopIcon = (index: number, isActive: boolean) => {
  const backgroundColor = isActive ? '#FF6B35' : '#FFA07A';
  const textColor = '#FFFFFF';
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.2 0 0 7.2 0 16C0 28 16 40 16 40S32 28 32 16C32 7.2 24.8 0 16 0Z" fill="${backgroundColor}"/>
        <circle cx="16" cy="16" r="10" fill="white"/>
        <text x="16" y="20" text-anchor="middle" fill="${backgroundColor}" font-size="12" font-weight="bold">${index}</text>
      </svg>
    `)}`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

export function WalkableStopMarker({ stop, index, isActive, onClick }: WalkableStopMarkerProps) {
  return (
    <Marker
      position={[stop.latitude, stop.longitude]}
      icon={createWalkableStopIcon(index, isActive)}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="min-w-[200px] p-3">
          <h4 className="font-bold text-orange-600 mb-2">Stop {index}: {stop.name}</h4>
          <p className="text-gray-700 text-sm mb-2">{stop.description}</p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Duration: {stop.content_duration}</div>
            {stop.walking_time_from_previous && (
              <div>Walk from previous: {stop.walking_time_from_previous}</div>
            )}
          </div>
          {stop.highlights && (
            <div className="mt-2">
              <div className="text-xs font-semibold text-gray-600 mb-1">Highlights:</div>
              <ul className="text-xs text-gray-600 list-disc list-inside">
                {stop.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
```

### 2.3 Walking Route Visualization
**File**: `frontend/src/components/map/WalkingRoute.tsx`

**Route Line Component**:
```typescript
import { Polyline } from 'react-leaflet';

export function WalkingRoute({ stops }: { stops: Array<{latitude: number, longitude: number}> }) {
  const routeCoordinates = stops.map(stop => [stop.latitude, stop.longitude] as [number, number]);
  
  return (
    <Polyline
      positions={routeCoordinates}
      pathOptions={{
        color: '#FF6B35',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 10'
      }}
    />
  );
}
```

## Phase 3: Audio-Map Synchronization (Days 5-6)

### 3.1 Enhanced Transcript Integration
**File**: `app/utils/transcript_generator.py`

**Stop-Aware Transcript Generation**:
```python
@staticmethod
def generate_walkable_transcript_segments(content: str, walkable_stops: List[dict], estimated_duration: float) -> List[Dict[str, Any]]:
    """Generate transcript segments aligned with walkable stops"""
    
    # Analyze content to identify stop transitions
    stop_keywords = [stop['name'].lower() for stop in walkable_stops]
    
    # Split content by stop mentions
    segments = []
    current_time = 0.0
    
    for i, stop in enumerate(walkable_stops):
        # Find content related to this stop
        stop_content = TranscriptGenerator._extract_stop_content(content, stop, i)
        
        # Calculate timing based on content duration
        content_duration = TranscriptGenerator._parse_duration(stop.get('content_duration', '3 minutes'))
        
        segments.append({
            "startTime": round(current_time, 2),
            "endTime": round(current_time + content_duration, 2),
            "text": stop_content,
            "stop_index": i,
            "stop_name": stop['name'],
            "location": {
                "latitude": stop['latitude'],
                "longitude": stop['longitude']
            }
        })
        
        current_time += content_duration
    
    return segments

@staticmethod
def _extract_stop_content(full_content: str, stop: dict, stop_index: int) -> str:
    """Extract content portion related to specific stop"""
    # Use simple heuristics to split content by stop mentions
    # This could be enhanced with NLP for better accuracy
    lines = full_content.split('\n')
    stop_lines = []
    
    capturing = False
    for line in lines:
        if stop['name'].lower() in line.lower():
            capturing = True
        
        if capturing:
            stop_lines.append(line)
            
        # Stop capturing when next stop is mentioned (simple heuristic)
        if capturing and len(stop_lines) > 5 and any(
            next_stop['name'].lower() in line.lower() 
            for next_stop in [s for s in stop['all_stops'] if s != stop]
        ):
            break
    
    return '\n'.join(stop_lines).strip()
```

### 3.2 Audio Player Integration
**File**: `frontend/src/components/audio/EnhancedAudioPlayer.tsx`

**Add Stop Navigation**:
```typescript
export function EnhancedAudioPlayer({ tour }: { tour: Tour }) {
  const { currentTime, seek } = useAudioPlayer();
  
  // Calculate active stop based on transcript timing
  const activeStop = useMemo(() => {
    if (!tour.transcript || !tour.walkable_stops) return null;
    
    const currentSegment = tour.transcript.find(segment => 
      currentTime >= segment.startTime && currentTime <= segment.endTime
    );
    
    return currentSegment?.stop_index ?? null;
  }, [currentTime, tour.transcript, tour.walkable_stops]);
  
  const jumpToStop = (stopIndex: number) => {
    const segment = tour.transcript?.find(seg => seg.stop_index === stopIndex);
    if (segment) {
      seek(segment.startTime);
    }
  };
  
  return (
    <div className="enhanced-audio-player">
      {/* Existing audio controls */}
      
      {/* Stop navigation */}
      {tour.walkable_stops && (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
          <h4 className="text-sm font-semibold text-orange-800 mb-2">Tour Stops</h4>
          <div className="grid grid-cols-2 gap-1">
            {tour.walkable_stops.map((stop, index) => (
              <button
                key={index}
                onClick={() => jumpToStop(index)}
                className={`text-xs p-2 rounded text-left transition-colors ${
                  activeStop === index 
                    ? 'bg-orange-200 text-orange-900 font-semibold' 
                    : 'bg-white text-orange-700 hover:bg-orange-100'
                }`}
              >
                {index + 1}. {stop.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Phase 4: Tour Planning Intelligence (Days 7-8)

### 4.1 Walking Route Optimization
**File**: `app/services/route_optimization_service.py`

**New Service for Route Planning**:
```python
class RouteOptimizationService:
    """Optimize walking routes for tour stops"""
    
    @staticmethod
    async def optimize_walking_route(main_location: dict, potential_stops: List[dict]) -> List[dict]:
        """Optimize order of stops for efficient walking route"""
        
        # Simple nearest-neighbor algorithm for walking optimization
        optimized_route = [main_location]
        remaining_stops = potential_stops.copy()
        current_location = main_location
        
        while remaining_stops:
            # Find nearest unvisited stop
            nearest_stop = min(remaining_stops, key=lambda stop: 
                RouteOptimizationService._calculate_walking_distance(current_location, stop)
            )
            
            optimized_route.append(nearest_stop)
            remaining_stops.remove(nearest_stop)
            current_location = nearest_stop
        
        return optimized_route[1:]  # Exclude main location from stops
    
    @staticmethod
    def _calculate_walking_distance(loc1: dict, loc2: dict) -> float:
        """Calculate walking distance between two locations"""
        # Use haversine formula for distance calculation
        # Could be enhanced with actual walking route APIs
        from math import radians, cos, sin, asin, sqrt
        
        lat1, lon1 = radians(loc1['latitude']), radians(loc1['longitude'])
        lat2, lon2 = radians(loc2['latitude']), radians(loc2['longitude'])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        
        return c * r * 1000  # Return distance in meters
    
    @staticmethod
    def validate_walking_feasibility(route: List[dict], max_total_distance: float = 2000) -> dict:
        """Validate that route is feasible for walking"""
        total_distance = 0
        leg_distances = []
        
        for i in range(len(route) - 1):
            leg_distance = RouteOptimizationService._calculate_walking_distance(route[i], route[i+1])
            leg_distances.append(leg_distance)
            total_distance += leg_distance
        
        return {
            "is_feasible": total_distance <= max_total_distance,
            "total_distance": total_distance,
            "max_leg_distance": max(leg_distances) if leg_distances else 0,
            "average_leg_distance": sum(leg_distances) / len(leg_distances) if leg_distances else 0,
            "estimated_walking_time": total_distance / 80  # Assume 80m/min walking speed
        }
```

### 4.2 Enhanced Location Discovery
**File**: `app/services/location_service.py`

**Add Walking-Friendly POI Discovery**:
```python
async def discover_walkable_pois(
    self,
    center_lat: float,
    center_lng: float,
    max_radius: int = 1000,
    max_stops: int = 6
) -> List[Dict[str, Any]]:
    """Discover walkable POIs around a location for tour generation"""
    
    # Search for walking-friendly POI types
    walkable_poi_types = [
        "tourism=attraction",
        "historic=monument", 
        "historic=memorial",
        "tourism=museum",
        "leisure=park",
        "tourism=viewpoint",
        "amenity=place_of_worship",
        "tourism=artwork",
        "historic=building"
    ]
    
    discovered_pois = []
    
    for poi_type in walkable_poi_types:
        try:
            pois = await self.detect_nearby_locations(
                lat=center_lat,
                lng=center_lng,
                radius=max_radius,
                limit=20
            )
            
            # Filter for relevant POIs
            relevant_pois = [poi for poi in pois if self._is_tour_worthy_poi(poi)]
            discovered_pois.extend(relevant_pois)
            
        except Exception as e:
            logger.warning(f"Failed to discover POIs for type {poi_type}: {e}")
    
    # Remove duplicates and optimize for walking
    unique_pois = self._deduplicate_pois(discovered_pois)
    walkable_pois = await RouteOptimizationService.optimize_walking_route(
        {"latitude": center_lat, "longitude": center_lng},
        unique_pois
    )
    
    return walkable_pois[:max_stops]

def _is_tour_worthy_poi(self, poi: dict) -> bool:
    """Determine if POI is worth including in a walking tour"""
    
    # Filter criteria for tour-worthy locations
    if not poi.get('name'):
        return False
    
    # Exclude certain types
    excluded_types = ['parking', 'toilets', 'atm', 'fast_food']
    if any(excluded in poi.get('location_type', '').lower() for excluded in excluded_types):
        return False
    
    # Prefer locations with descriptions or cultural significance
    has_description = bool(poi.get('description'))
    has_cultural_keywords = any(keyword in poi.get('name', '').lower() 
                               for keyword in ['museum', 'church', 'monument', 'palace', 'cathedral', 'tower'])
    
    return has_description or has_cultural_keywords
```

## Implementation Guidelines

### Safety & Testing Strategy
1. **Feature Flags**: Implement behind feature flag to avoid breaking existing functionality
2. **Backward Compatibility**: All existing tours continue to work without walkable stops
3. **Graceful Degradation**: If POI extraction fails, tour generation continues with single location
4. **A/B Testing**: Compare user engagement between regular and walkable tours

### Performance Considerations
1. **Caching**: Cache geocoded stops to avoid repeated API calls
2. **Async Processing**: POI extraction happens in background, doesn't block tour generation
3. **Rate Limiting**: Respect Nominatim API limits with proper throttling
4. **Map Optimization**: Cluster nearby stops to maintain map performance

### Quality Assurance
1. **Distance Validation**: Ensure all stops are within reasonable walking distance
2. **Content Coherence**: Verify AI-generated content flows logically between stops
3. **Geographic Accuracy**: Validate geocoded coordinates against known landmarks
4. **Mobile Testing**: Ensure touch interactions work smoothly with multiple markers

## Success Metrics

### Technical KPIs
- **POI Extraction Success Rate**: >80% of mentioned locations successfully geocoded
- **Route Feasibility**: >90% of generated routes under 2km total walking distance
- **Map Performance**: <3 seconds load time with up to 8 POI markers
- **Geocoding Accuracy**: <100m average distance from actual landmark location

### User Experience KPIs  
- **Tour Completion Rate**: Maintain or improve current completion rates
- **Map Interaction**: >50% of users click on at least one POI marker
- **Audio-Map Sync**: Users can seamlessly navigate between audio and map
- **Walking Feasibility**: <5% user complaints about excessive walking distances

### Business Impact
- **User Engagement**: Increased session duration through map interaction
- **Content Quality**: Higher user ratings for walkable multi-stop tours
- **Competitive Advantage**: Feature parity with premium walking tour apps
- **Scalability**: System handles tour generation for any walkable urban area

## Risk Mitigation

### Technical Risks
- **Geocoding Failures**: Fallback to single-location tours if POI extraction fails
- **API Rate Limits**: Implement caching and request throttling
- **Map Performance**: Use clustering and lazy loading for dense POI areas
- **Data Quality**: Validate extracted locations against geographic databases

### User Experience Risks
- **Complexity**: Keep interface intuitive with progressive disclosure
- **Navigation Confusion**: Clear visual indicators for current location and next stop
- **Walking Difficulty**: Provide difficulty ratings and distance warnings
- **Device Compatibility**: Ensure GPS and map features work across devices

This comprehensive plan transforms Walkumentary into a sophisticated walking tour platform that rivals premium applications while maintaining the simplicity and reliability that makes it special.
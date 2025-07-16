# Demo Setup for Recording

This guide helps you set up instant tour generation for recording demo videos of Walkumentary.

## Problems Solved

By default, Walkumentary has several challenges for demo recording:
- **Regeneration**: Tours regenerate every time even for identical parameters
- **AI Generation**: 2-3 minute wait times for content generation  
- **TTS Audio**: 30-60 second wait times for audio generation
- **POI Geocoding**: Nominatim often returns wrong coordinates for specific park attractions
- **Demo Reliability**: Geocoding failures can break the walkable tour map
- **Audio Sync**: Transcript timing may not align properly with generated audio
- **Frontend Compatibility**: Transcript format mismatches between backend and frontend

## Two Solutions Provided

### Option 1: Pre-Generated Demo Data (Recommended for Recording)

**Best for:** Recording professional demo videos with instant results.

#### Quick Setup

```bash
# Run the complete demo setup (with real audio and transcript sync)
./scripts/run_demo_setup.sh
```

#### Manual Setup

```bash
# Activate your Python environment
source venv_walk/bin/activate

# Run the complete demo creation script
python scripts/create_complete_demo.py
```

#### Verification

```bash
# Verify everything is working properly
python scripts/verify_audio_demo.py
```

#### What This Creates

- **Demo User**: Uses your actual Gmail account
- **Demo Location**: Central Park, New York (exact Nominatim coordinates)
- **Real Audio**: AI-generated TTS audio using OpenAI (30-60 seconds to create)
- **Synchronized Transcript**: Properly timed segments with click-to-seek functionality
- **Verified POI Coordinates**: 4 walkable stops with accurate Central Park locations
- **Geocoding Cache**: Pre-populated to prevent API failures during tour generation
- **Audio Cache**: 30-day cached audio for instant playback
- **Production Experience**: Complete end-to-end functionality

#### Demo Recording Flow

1. Start your backend: `python app/main.py`
2. Start your frontend: `cd frontend && npm run dev`
3. Navigate to `localhost:3000`
4. **Log in with your Gmail account** (the one you provided during setup)
5. Search for "Central Park"
6. Select interests: `history`, `architecture`, `nature`
7. Set duration: `30 minutes`
8. Click "Generate Tour" - **instant results!**

### Option 2: Tour Deduplication (Production Feature)

**Best for:** Preventing duplicate tours in production.

This solution adds intelligent tour deduplication to `TourService.generate_tour()`:

- Checks if identical tour exists (same user, location, duration, interests, language)
- Returns existing tour instead of regenerating
- Only creates new tour if parameters differ
- Improves user experience and reduces AI costs

#### How It Works

When a user generates a tour, the system:

1. **Checks Existing Tours**: Looks for tours with identical parameters
2. **Normalizes Interests**: Sorts and deduplicates interest arrays for comparison
3. **Returns Existing**: If found, returns the existing tour immediately
4. **Generates New**: Only if no match is found

#### Code Changes Made

- Added `_find_existing_tour()` method to `TourService`
- Modified `generate_tour()` to check for duplicates first
- Compares: `user_id`, `location_id`, `duration_minutes`, `language`, `interests`
- Ignores failed tours (only reuses `ready` or `generating` status)

## Benefits

### For Demo Recording
- ✅ Instant tour generation
- ✅ Consistent demo experience  
- ✅ Professional-quality recordings
- ✅ No waiting for AI/TTS processing

### For Production
- ✅ Prevents duplicate tours
- ✅ Faster user experience
- ✅ Reduced AI API costs
- ✅ Better resource utilization

## Demo Data Details

The pre-generated Central Park tour includes:

- **Content**: 4-stop walking tour with rich descriptions
- **Audio**: 58-second narrated tour
- **Transcript**: Timestamped subtitles
- **Map**: 4 walkable stops with coordinates
- **Metadata**: Walking distance, difficulty level, etc.

## Cleanup

To remove demo data after recording:

```sql
-- Connect to your database and run:
DELETE FROM tours WHERE user_id IN (
    SELECT id FROM users WHERE email = 'your-email@gmail.com'
);
-- Note: Don't delete the user if you want to keep using the app
```

Or keep the demo data for future recordings!

## Technical Notes

- Demo audio is a minimal MP3 file for size efficiency
- All tour parameters match typical user selections
- Database records use proper UUIDs and timestamps
- Cache entries have 30-day TTL
- Compatible with existing frontend/backend code

This setup gives you professional demo recordings while also improving the production experience with smart tour deduplication! 
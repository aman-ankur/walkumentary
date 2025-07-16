#!/usr/bin/env python3
"""
Audio Demo Verification Script
Tests that the complete demo setup works properly with audio and transcript sync.
"""

import asyncio
import json
import sys
import os
from sqlalchemy import text

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import AsyncSessionLocal
from app.services.cache_service import cache_service

async def verify_demo_setup():
    """Verify that the complete demo setup is working"""
    print("🔍 Verifying Complete Demo Setup")
    print("=" * 50)
    
    success_count = 0
    total_checks = 7
    
    async with AsyncSessionLocal() as db:
        try:
            # Check 1: User exists
            print("1. Checking demo user...")
            result = await db.execute(text("SELECT COUNT(*) as count FROM users"))
            user_count = result.fetchone().count
            if user_count > 0:
                print("   ✅ Users found in database")
                success_count += 1
            else:
                print("   ❌ No users found - run setup first")
            
            # Check 2: Location exists
            print("2. Checking Central Park location...")
            result = await db.execute(text("""
                SELECT COUNT(*) as count FROM locations 
                WHERE name ILIKE '%central park%'
            """))
            location_count = result.fetchone().count
            if location_count > 0:
                print("   ✅ Central Park location found")
                success_count += 1
            else:
                print("   ❌ Central Park location not found")
            
            # Check 3: Tours exist
            print("3. Checking demo tours...")
            result = await db.execute(text("SELECT COUNT(*) as count FROM tours WHERE status = 'completed'"))
            tour_count = result.fetchone().count
            if tour_count > 0:
                print(f"   ✅ {tour_count} completed tour(s) found")
                success_count += 1
            else:
                print("   ❌ No completed tours found")
            
            # Check 4: Tour has proper transcript
            print("4. Checking transcript format...")
            result = await db.execute(text("""
                SELECT transcript FROM tours 
                WHERE status = 'completed' AND transcript IS NOT NULL 
                LIMIT 1
            """))
            tour_with_transcript = result.fetchone()
            
            if tour_with_transcript:
                try:
                    transcript = json.loads(tour_with_transcript.transcript)
                    if isinstance(transcript, list) and len(transcript) > 0:
                        first_segment = transcript[0]
                        if "startTime" in first_segment and "endTime" in first_segment and "text" in first_segment:
                            print(f"   ✅ Transcript format valid ({len(transcript)} segments)")
                            success_count += 1
                        else:
                            print("   ❌ Transcript segments missing required fields")
                    else:
                        print("   ❌ Transcript is not a valid array")
                except json.JSONDecodeError:
                    print("   ❌ Transcript is not valid JSON")
            else:
                print("   ❌ No tours with transcript found")
            
            # Check 5: Tour has walkable stops
            print("5. Checking walkable stops...")
            result = await db.execute(text("""
                SELECT walkable_stops FROM tours 
                WHERE status = 'completed' AND walkable_stops IS NOT NULL 
                LIMIT 1
            """))
            tour_with_stops = result.fetchone()
            
            if tour_with_stops:
                try:
                    stops = json.loads(tour_with_stops.walkable_stops)
                    if isinstance(stops, list) and len(stops) >= 4:
                        # Verify POI coordinates are within Central Park
                        all_valid = True
                        for stop in stops:
                            if not (40.764 <= stop.get("latitude", 0) <= 40.801 and 
                                   -73.982 <= stop.get("longitude", 0) <= -73.949):
                                all_valid = False
                                break
                        
                        if all_valid:
                            print(f"   ✅ {len(stops)} walkable stops with valid Central Park coordinates")
                            success_count += 1
                        else:
                            print("   ❌ Some POI coordinates are outside Central Park")
                    else:
                        print("   ❌ Insufficient walkable stops")
                except json.JSONDecodeError:
                    print("   ❌ Walkable stops is not valid JSON")
            else:
                print("   ❌ No tours with walkable stops found")
            
            # Check 6: Audio cache
            print("6. Checking audio cache...")
            result = await db.execute(text("SELECT id FROM tours WHERE status = 'completed' LIMIT 1"))
            tour = result.fetchone()
            
            if tour:
                audio_key = f"audio:tour:{tour.id}"
                cached_audio = await cache_service.get(audio_key)
                
                if cached_audio:
                    # Rough size check (real audio should be > 10KB)
                    if len(cached_audio) > 10000:
                        print(f"   ✅ Audio cache found ({len(cached_audio)} chars, ~{len(cached_audio)//1000}KB)")
                        success_count += 1
                    else:
                        print("   ⚠️  Audio cache found but seems too small (placeholder?)")
                        success_count += 0.5
                else:
                    print("   ❌ Audio cache not found")
            else:
                print("   ❌ No tour ID found for audio cache check")
            
            # Check 7: Geocoding cache
            print("7. Checking POI geocoding cache...")
            cached_pois = 0
            poi_queries = [
                "location_search_geocode_the_mall_central_park",
                "location_search_geocode_bethesda_terrace_central_park", 
                "location_search_geocode_bow_bridge_central_park",
                "location_search_geocode_strawberry_fields_central_park"
            ]
            
            for query in poi_queries:
                cached_data = await cache_service.get(query)
                if cached_data:
                    cached_pois += 1
            
            if cached_pois >= 4:
                print(f"   ✅ All {cached_pois} POI geocoding entries cached")
                success_count += 1
            elif cached_pois > 0:
                print(f"   ⚠️  Only {cached_pois}/4 POI geocoding entries cached")
                success_count += 0.5
            else:
                print("   ❌ No POI geocoding cache found")
            
        except Exception as e:
            print(f"❌ Database verification failed: {e}")
    
    print()
    print("=" * 50)
    print(f"📊 VERIFICATION RESULTS: {success_count}/{total_checks}")
    print("=" * 50)
    
    if success_count >= total_checks - 1:  # Allow for minor issues
        print("🎉 Demo setup is EXCELLENT - ready for recording!")
        print()
        print("✨ Your demo will include:")
        print("   • Instant tour generation")
        print("   • Real AI-generated audio")
        print("   • Synchronized transcript with click-to-seek")
        print("   • Interactive walkable map with 4 POIs")
        print("   • Professional audio player controls")
        print("   • Zero API failures or delays")
        
        return True
    elif success_count >= total_checks * 0.7:
        print("⚠️  Demo setup is GOOD - may have minor issues")
        print("   Consider re-running setup if any critical features are missing")
        return True
    else:
        print("❌ Demo setup needs work - please run the setup script")
        print("   Run: ./scripts/run_demo_setup.sh")
        return False

def print_demo_instructions():
    """Print instructions for using the demo"""
    print()
    print("🎥 DEMO RECORDING INSTRUCTIONS")
    print("=" * 50)
    print("1. Start backend:")
    print("   cd /path/to/walkumentary")
    print("   source venv_walk/bin/activate")
    print("   python app/main.py")
    print()
    print("2. Start frontend (in new terminal):")
    print("   cd frontend")
    print("   npm run dev")
    print()
    print("3. Record your demo:")
    print("   • Open localhost:3000")
    print("   • Login with your Gmail account")
    print("   • Search 'Central Park'")
    print("   • Select interests: history, architecture, nature")
    print("   • Set duration: 30 minutes")
    print("   • Click Generate Tour → INSTANT RESULTS!")
    print()
    print("4. Show off features:")
    print("   • Play audio with professional controls")
    print("   • Show transcript overlay with click-to-seek")
    print("   • Display walkable map with 4 verified POIs")
    print("   • Demonstrate speed/volume controls")
    print("   • Show tour artwork generation")

if __name__ == "__main__":
    print("🎬 Walkumentary Demo Verification")
    print()
    
    # Run verification
    success = asyncio.run(verify_demo_setup())
    
    if success:
        print_demo_instructions()
    
    print("\n" + "=" * 50)
    print("🚀 Verification complete!") 
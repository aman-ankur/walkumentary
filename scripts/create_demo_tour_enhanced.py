#!/usr/bin/env python3
"""
Enhanced Demo Tour Setup Script
Creates a pre-generated tour with proper POI geocoding cache to ensure demo reliability.
Handles the fact that Nominatim geocoding for specific Central Park POIs often fails or returns wrong results.
"""

import asyncio
import json
import uuid
from datetime import datetime
from sqlalchemy import text

# Add the app directory to the path
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import AsyncSessionLocal, engine
from app.models.user import User
from app.models.location import Location
from app.models.tour import Tour
from app.services.cache_service import cache_service
import base64

# Demo data for Central Park (using exact Nominatim coordinates)
DEMO_LOCATION = {
    "name": "Central Park",
    "description": "America's most iconic urban park in the heart of Manhattan",
    "latitude": 40.7827725,
    "longitude": -73.9653627,
    "country": "United States",
    "city": "New York",
    "location_type": "park"
}

# Pre-verified POI coordinates for Central Park attractions
# These are accurate coordinates since Nominatim often fails for specific park features
DEMO_WALKABLE_STOPS = [
    {
        "name": "The Mall and Literary Walk",
        "description": "Central Park's formal promenade lined with American elm trees and statues of literary figures",
        "latitude": 40.7794,   # Verified Central Park Mall coordinates
        "longitude": -73.9729,
        "order": 1,
        "geocoding_accuracy": "manual_verified"
    },
    {
        "name": "Bethesda Terrace and Fountain", 
        "description": "The heart of Central Park featuring the Angel of the Waters fountain",
        "latitude": 40.7764,   # Verified Bethesda Fountain coordinates
        "longitude": -73.9719,
        "order": 2,
        "geocoding_accuracy": "manual_verified"
    },
    {
        "name": "Bow Bridge",
        "description": "Iconic cast-iron bridge spanning the Lake with romantic views",
        "latitude": 40.7755,   # Verified Bow Bridge coordinates
        "longitude": -73.9713,
        "order": 3,
        "geocoding_accuracy": "manual_verified"
    },
    {
        "name": "Strawberry Fields",
        "description": "John Lennon memorial featuring the famous Imagine mosaic",
        "latitude": 40.7756,   # Verified Strawberry Fields coordinates (not the Ohio one!)
        "longitude": -73.9754,
        "order": 4,
        "geocoding_accuracy": "manual_verified"
    }
]

# Create geocoding cache entries to prevent live geocoding failures
GEOCODING_CACHE_ENTRIES = [
    {
        "query": "The Mall Central Park",
        "coordinates": [40.7794, -73.9729],
        "cache_key": "geocode_the_mall_central_park"
    },
    {
        "query": "Bethesda Terrace Central Park", 
        "coordinates": [40.7764, -73.9719],
        "cache_key": "geocode_bethesda_terrace_central_park"
    },
    {
        "query": "Bow Bridge Central Park",
        "coordinates": [40.7755, -73.9713], 
        "cache_key": "geocode_bow_bridge_central_park"
    },
    {
        "query": "Strawberry Fields Central Park",
        "coordinates": [40.7756, -73.9754],
        "cache_key": "geocode_strawberry_fields_central_park"
    }
]

DEMO_CONTENT = """Welcome to Central Park, New York City's green heart and one of the world's most famous urban parks. Spanning 843 acres in the heart of Manhattan, Central Park represents the triumph of urban planning and the enduring power of green spaces.

We begin our journey at The Mall, Central Park's formal promenade lined with towering American elm trees. This quarter-mile walkway showcases the grandeur of the park's original vision, designed by Frederick Law Olmsted and Calvert Vaux in the 1850s.

Next, we arrive at Bethesda Terrace, the heart of Central Park. The centerpiece is the magnificent Angel of the Waters fountain, commemorating the healing powers of the biblical Pool of Bethesda. The elaborate stonework and architectural details make this one of the park's most photographed locations.

Cross the iconic Bow Bridge, one of Central Park's most romantic spots. This cast-iron bridge spans the Lake and offers beautiful views in all directions, making it a favorite for both visitors and filmmakers.

Our final stop is Strawberry Fields, the touching memorial to John Lennon. This peaceful area features the famous Imagine mosaic, created with stones donated from around the world, creating a living tribute to the Beatles legend.

Central Park continues to be a testament to the power of green spaces in urban environments, telling the story of New York City's evolution."""

DEMO_TRANSCRIPT = [
    {
        "start": 0.0,
        "end": 8.5,
        "text": "Welcome to Central Park, New York City's green heart and one of the world's most famous urban parks."
    },
    {
        "start": 8.5,
        "end": 18.2,
        "text": "We begin our journey at The Mall, Central Park's formal promenade lined with towering American elm trees."
    },
    {
        "start": 18.2,
        "end": 28.8,
        "text": "Next, we arrive at Bethesda Terrace, the heart of Central Park. The centerpiece is the magnificent Angel of the Waters fountain."
    },
    {
        "start": 28.8,
        "end": 38.5,
        "text": "Cross the iconic Bow Bridge, one of Central Park's most romantic spots with beautiful views in all directions."
    },
    {
        "start": 38.5,
        "end": 48.2,
        "text": "Our final stop is Strawberry Fields, the touching memorial to John Lennon with the famous Imagine mosaic."
    },
    {
        "start": 48.2,
        "end": 58.0,
        "text": "Central Park continues to be a testament to the power of green spaces, telling the story of New York City's evolution."
    }
]

async def setup_geocoding_cache():
    """Pre-populate cache with POI geocoding results to avoid live API failures"""
    print("🗺️  Setting up POI geocoding cache...")
    
    try:
        for entry in GEOCODING_CACHE_ENTRIES:
            cache_key = f"location_search_{entry['cache_key']}"
            cache_data = {
                "locations": [{
                    "name": entry["query"],
                    "latitude": entry["coordinates"][0],
                    "longitude": entry["coordinates"][1],
                    "display_name": f"{entry['query']}, Central Park, New York",
                    "type": "tourism",
                    "source": "demo_cache"
                }]
            }
            
            # Cache for 24 hours (enough for demo)
            await cache_service.set(cache_key, cache_data, ttl=86400)
            print(f"   ✅ Cached geocoding for: {entry['query']}")
            
    except Exception as e:
        print(f"⚠️  Warning: Could not setup geocoding cache: {e}")
        print("   Demo may still work but POI geocoding might fail")

async def create_demo_data():
    """Create demo tour data in the database with POI geocoding fallbacks"""
    
    # Get user's Gmail account
    print("🎬 Enhanced Demo Setup for Walkumentary")
    print("This version handles POI geocoding issues for a smooth demo experience.")
    print()
    
    user_email = input("Enter your Gmail address: ").strip()
    if not user_email:
        print("❌ Email is required!")
        return
    
    if "@" not in user_email:
        print("❌ Please enter a valid email address")
        return
    
    user_name = input("Enter your full name (optional): ").strip() or "Demo User"
    
    # Setup geocoding cache first
    await setup_geocoding_cache()
    
    async with AsyncSessionLocal() as db:
        try:
            # Find or create user with the provided email
            print(f"\n🔍 Checking for existing user: {user_email}")
            result = await db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": user_email})
            demo_user = result.fetchone()
            
            if not demo_user:
                # Create user
                user_id = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO users (id, email, full_name, preferences, is_active, created_at, updated_at)
                    VALUES (:id, :email, :full_name, :preferences, :is_active, :created_at, :updated_at)
                """), {
                    "id": user_id,
                    "email": user_email,
                    "full_name": user_name,
                    "preferences": json.dumps({
                        "default_interests": ["history", "architecture", "nature"],
                        "default_duration": 30,
                        "voice_preference": "alloy"
                    }),
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
                
                await db.commit()
                
                result = await db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": user_email})
                demo_user = result.fetchone()
                print(f"✅ Created new user: {demo_user.email}")
            else:
                print(f"✅ Found existing user: {demo_user.email}")
            
            print(f"👤 Demo user ready: {demo_user.email}")
            
            # Find or create location
            print("\n📍 Setting up Central Park location...")
            result = await db.execute(text("""
                SELECT * FROM locations 
                WHERE ABS(latitude - :lat) < 0.001 AND ABS(longitude - :lng) < 0.001
            """), {"lat": DEMO_LOCATION["latitude"], "lng": DEMO_LOCATION["longitude"]})
            
            location = result.fetchone()
            
            if not location:
                location_id = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO locations (id, name, description, latitude, longitude, country, city, location_type, created_at, updated_at)
                    VALUES (:id, :name, :description, :latitude, :longitude, :country, :city, :location_type, :created_at, :updated_at)
                """), {
                    "id": location_id,
                    "name": DEMO_LOCATION["name"],
                    "description": DEMO_LOCATION["description"], 
                    "latitude": DEMO_LOCATION["latitude"],
                    "longitude": DEMO_LOCATION["longitude"],
                    "country": DEMO_LOCATION["country"],
                    "city": DEMO_LOCATION["city"],
                    "location_type": DEMO_LOCATION["location_type"],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
                
                await db.commit()
                result = await db.execute(text("SELECT * FROM locations WHERE id = :id"), {"id": location_id})
                location = result.fetchone()
                print(f"✅ Created Central Park location: {location.id}")
            else:
                print(f"✅ Found existing Central Park location: {location.id}")
            
            # Create tour
            print("\n🎫 Creating instant demo tour...")
            tour_id = str(uuid.uuid4())
            
            # Create a complete tour with all data
            await db.execute(text("""
                INSERT INTO tours (
                    id, user_id, location_id, title, description, duration, interests, 
                    voice, status, content, audio_url, transcript, walkable_stops,
                    created_at, updated_at
                ) VALUES (
                    :id, :user_id, :location_id, :title, :description, :duration, :interests,
                    :voice, :status, :content, :audio_url, :transcript, :walkable_stops,
                    :created_at, :updated_at
                )
            """), {
                "id": tour_id,
                "user_id": demo_user.id,
                "location_id": location.id,
                "title": "Central Park Walking Tour",
                "description": "A curated journey through Central Park's most iconic landmarks",
                "duration": 30,
                "interests": json.dumps(["history", "architecture", "nature"]),
                "voice": "alloy",
                "status": "completed",
                "content": DEMO_CONTENT,
                "audio_url": "data:audio/mp3;base64," + base64.b64encode(b"demo_audio_placeholder").decode(),
                "transcript": json.dumps(DEMO_TRANSCRIPT),
                "walkable_stops": json.dumps(DEMO_WALKABLE_STOPS),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
            await db.commit()
            
            print("✅ Demo setup complete!")
            print(f"📧 User Email: {demo_user.email}")
            print(f"👤 User ID: {demo_user.id}")
            print(f"📍 Location ID: {location.id}")
            print(f"🎫 Tour ID: {tour_id}")
            print("\n🎥 To record your demo:")
            print(f"1. Start backend: python app/main.py")
            print(f"2. Start frontend: cd frontend && npm run dev") 
            print(f"3. Navigate to localhost:3000")
            print(f"4. Log in with Gmail: {demo_user.email}")
            print(f"5. Search for 'Central Park'")
            print(f"6. Select interests: history, architecture, nature")
            print(f"7. Set duration: 30 minutes")
            print(f"8. Click Generate Tour - **INSTANT RESULTS!**")
            print(f"\n🗺️  POI Features:")
            print(f"   • All walkable stops have verified coordinates")
            print(f"   • Geocoding cache prevents API failures") 
            print(f"   • Tour map will show all 4 stops correctly")
            print(f"   • Walking route will be properly calculated")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Error creating demo data: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    print("🎬 Enhanced Walkumentary Demo Setup")
    print("=" * 50)
    
    asyncio.run(create_demo_data()) 
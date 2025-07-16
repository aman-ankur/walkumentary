#!/usr/bin/env python3
"""
Demo Tour Setup Script
Creates a pre-generated tour for demo purposes that appears instantly.
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

DEMO_TOUR_CONTENT = """
# Central Park Audio Walking Tour

## Introduction
Welcome to Central Park, New York City's green heart and one of the world's most famous urban parks. Spanning 843 acres in the heart of Manhattan, this magnificent park has been a sanctuary for both New Yorkers and visitors since 1857.

## Stop 1: The Mall and Literary Walk
We begin our journey at The Mall, Central Park's formal promenade lined with towering American elm trees. This quarter-mile walkway was designed to showcase the grandeur of the park's original vision. As you stroll down this tree-lined avenue, you'll notice the Literary Walk, featuring statues of famous writers including William Shakespeare, Robert Burns, and Sir Walter Scott.

## Stop 2: Bethesda Terrace and Fountain
Next, we arrive at the heart of Central Park - Bethesda Terrace. The centerpiece here is the magnificent Angel of the Waters fountain, also known as Bethesda Fountain. This stunning sculpture commemorates the healing powers of the biblical Pool of Bethesda. The terrace offers spectacular views of the Lake and is one of the most photographed spots in the park.

## Stop 3: Bow Bridge
Cross the iconic Bow Bridge, one of Central Park's most romantic spots. This cast-iron bridge, built in 1862, spans the Lake and offers beautiful views in all directions. The bridge gets its name from its graceful bow shape and has appeared in countless movies and TV shows.

## Stop 4: Strawberry Fields
Our final stop is Strawberry Fields, the touching memorial to John Lennon. This peaceful area features the famous "Imagine" mosaic, created with stones donated from around the world. Located directly across from the Dakota Building where Lennon lived and was tragically killed, this memorial attracts visitors from around the globe who come to pay their respects and reflect on his message of peace.

## Conclusion
Central Park continues to be a testament to the power of green spaces in urban environments. From its carefully designed landscapes to its rich cultural history, every corner tells a story of New York City's evolution and the enduring importance of nature in our lives.
"""

DEMO_AUDIO_TEXT = """Welcome to Central Park, New York City's green heart and one of the world's most famous urban parks. 

We begin our journey at The Mall, Central Park's formal promenade lined with towering American elm trees. This quarter-mile walkway showcases the grandeur of the park's original vision.

Next, we arrive at Bethesda Terrace, the heart of Central Park. The centerpiece is the magnificent Angel of the Waters fountain, commemorating the healing powers of the biblical Pool of Bethesda.

Cross the iconic Bow Bridge, one of Central Park's most romantic spots. This cast-iron bridge spans the Lake and offers beautiful views in all directions.

Our final stop is Strawberry Fields, the touching memorial to John Lennon. This peaceful area features the famous Imagine mosaic, created with stones donated from around the world.

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

DEMO_WALKABLE_STOPS = [
    {
        "name": "The Mall and Literary Walk",
        "description": "Formal promenade with writer statues",
        "latitude": 40.7794,
        "longitude": -73.9729,
        "order": 1
    },
    {
        "name": "Bethesda Terrace and Fountain",
        "description": "Angel of the Waters fountain",
        "latitude": 40.7764,
        "longitude": -73.9719,
        "order": 2
    },
    {
        "name": "Bow Bridge",
        "description": "Iconic cast-iron bridge over the Lake",
        "latitude": 40.7755,
        "longitude": -73.9713,
        "order": 3
    },
    {
        "name": "Strawberry Fields",
        "description": "John Lennon memorial with Imagine mosaic",
        "latitude": 40.7756,
        "longitude": -73.9754,
        "order": 4
    }
]

async def create_demo_data():
    """Create demo tour data in the database"""
    
    # Get user's Gmail account
    print("🎬 Demo Setup for Walkumentary")
    print("Since you use Gmail OAuth, we need to use your actual Gmail account.")
    print()
    
    user_email = input("Enter your Gmail address: ").strip()
    if not user_email:
        print("❌ Email is required!")
        return
    
    if not "@gmail.com" in user_email and not "@" in user_email:
        print("❌ Please enter a valid email address")
        return
    
    user_name = input("Enter your full name (optional): ").strip() or "Demo User"
    
    async with AsyncSessionLocal() as db:
        try:
            # Find or create user with the provided email
            print(f"\n🔍 Checking for existing user: {user_email}")
            result = await db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": user_email})
            demo_user = result.fetchone()
            
            if not demo_user:
                print("👤 Creating new user in database...")
                user_id = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO users (id, email, full_name, preferences, is_active, created_at, updated_at)
                    VALUES (:id, :email, :full_name, :preferences, :is_active, :created_at, :updated_at)
                """), {
                    "id": user_id,
                    "email": user_email,
                    "full_name": user_name,
                    "preferences": json.dumps({
                        "interests": ["history", "architecture"],
                        "language": "en",
                        "default_tour_duration": 30,
                        "audio_speed": 1.0,
                        "theme": "light"
                    }),
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
                await db.commit()
                
                result = await db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": user_email})
                demo_user = result.fetchone()
            else:
                print(f"✅ Found existing user: {demo_user.email}")
            
            print(f"👤 Demo user ready: {demo_user.email}")
            
            # Find or create Central Park location
            print("Setting up Central Park location...")
            result = await db.execute(text("SELECT * FROM locations WHERE name = 'Central Park' AND city = 'New York'"))
            location = result.fetchone()
            
            if not location:
                location_id = str(uuid.uuid4())
                await db.execute(text("""
                    INSERT INTO locations (id, name, description, latitude, longitude, country, city, location_type, metadata, is_active, created_at, updated_at)
                    VALUES (:id, :name, :description, :latitude, :longitude, :country, :city, :location_type, :metadata, :is_active, :created_at, :updated_at)
                """), {
                    "id": location_id,
                    "name": DEMO_LOCATION["name"],
                    "description": DEMO_LOCATION["description"],
                    "latitude": DEMO_LOCATION["latitude"],
                    "longitude": DEMO_LOCATION["longitude"],
                    "country": DEMO_LOCATION["country"],
                    "city": DEMO_LOCATION["city"],
                    "location_type": DEMO_LOCATION["location_type"],
                    "metadata": json.dumps({}),
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
                await db.commit()
                
                result = await db.execute(text("SELECT * FROM locations WHERE id = :id"), {"id": location_id})
                location = result.fetchone()
            
            print(f"Location ready: {location.name}")
            
            # Delete any existing demo tours for this user/location
            await db.execute(text("""
                DELETE FROM tours 
                WHERE user_id = :user_id AND location_id = :location_id
            """), {
                "user_id": demo_user.id,
                "location_id": location.id
            })
            
            # Create demo tour
            print("Creating demo tour...")
            tour_id = str(uuid.uuid4())
            await db.execute(text("""
                INSERT INTO tours (
                    id, user_id, location_id, title, description, content, 
                    audio_url, transcript, duration_minutes, interests, language, 
                    llm_provider, llm_model, generation_params, status,
                    walkable_stops, total_walking_distance, estimated_walking_time,
                    difficulty_level, route_type, is_active, created_at, updated_at
                )
                VALUES (
                    :id, :user_id, :location_id, :title, :description, :content,
                    :audio_url, :transcript, :duration_minutes, :interests, :language,
                    :llm_provider, :llm_model, :generation_params, :status,
                    :walkable_stops, :total_walking_distance, :estimated_walking_time,
                    :difficulty_level, :route_type, :is_active, :created_at, :updated_at
                )
            """), {
                "id": tour_id,
                "user_id": demo_user.id,
                "location_id": location.id,
                "title": "Central Park Walking Tour",
                "description": "A curated audio walking tour of Central Park's most iconic landmarks",
                "content": DEMO_TOUR_CONTENT,
                "audio_url": f"http://localhost:8000/tours/{tour_id}/audio",
                "transcript": json.dumps(DEMO_TRANSCRIPT),
                "duration_minutes": 30,
                "interests": json.dumps(["history", "architecture", "nature"]),
                "language": "en",
                "llm_provider": "openai",
                "llm_model": "gpt-4",
                "generation_params": json.dumps({"narration_style": "conversational"}),
                "status": "ready",
                "walkable_stops": json.dumps(DEMO_WALKABLE_STOPS),
                "total_walking_distance": "1.2 km",
                "estimated_walking_time": "15 minutes",
                "difficulty_level": "easy",
                "route_type": "walkable",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
            await db.commit()
            print(f"Demo tour created with ID: {tour_id}")
            
            # Create fake audio data in cache (for demo purposes)
            print("Setting up demo audio in cache...")
            # Create a small fake audio file (empty MP3 header)
            fake_audio = b'\xff\xfb\x90\x00' + b'\x00' * 1000  # Minimal MP3 header + silence
            audio_b64 = base64.b64encode(fake_audio).decode('utf-8')
            audio_key = f"audio:tour:{tour_id}"
            await cache_service.set(audio_key, audio_b64, ttl=86400 * 30)
            
            print("✅ Demo setup complete!")
            print(f"📧 User Email: {demo_user.email}")
            print(f"👤 User ID: {demo_user.id}")
            print(f"📍 Location ID: {location.id}")
            print(f"🎫 Tour ID: {tour_id}")
            print("\n🎥 To record your demo:")
            print(f"1. Log in with Gmail: {demo_user.email}")
            print("2. Search for 'Central Park'")
            print("3. Select interests: history, architecture, nature")
            print("4. Set duration: 30 minutes")
            print("5. Generate tour - it will appear instantly!")
            
        except Exception as e:
            await db.rollback()
            print(f"Error creating demo data: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(create_demo_data()) 
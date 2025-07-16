#!/usr/bin/env python3
"""
Demo Flow Test Script
Tests that the demo setup works with actual Nominatim search results.
"""

import asyncio
import httpx
import json

async def test_nominatim_search():
    """Test what Nominatim returns for Central Park search"""
    print("🔍 Testing Nominatim search for 'Central Park'...")
    
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": "Central Park New York",
        "format": "json",
        "addressdetails": 1,
        "limit": 3
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        results = response.json()
    
    if results:
        first_result = results[0]
        print(f"✅ First Nominatim result:")
        print(f"   Name: {first_result.get('display_name', '').split(',')[0]}")
        print(f"   Lat: {first_result.get('lat')}")
        print(f"   Lon: {first_result.get('lon')}")
        print(f"   Full: {first_result.get('display_name')}")
        return float(first_result['lat']), float(first_result['lon'])
    else:
        print("❌ No results from Nominatim")
        return None, None

async def check_demo_coordinates():
    """Check our demo coordinates against Nominatim"""
    print("\n📍 Checking demo coordinates...")
    
    # Our demo coordinates (updated)
    demo_lat, demo_lon = 40.7827725, -73.9653627
    
    # Get Nominatim coordinates
    nominatim_lat, nominatim_lon = await test_nominatim_search()
    
    if nominatim_lat and nominatim_lon:
        lat_diff = abs(demo_lat - nominatim_lat)
        lon_diff = abs(demo_lon - nominatim_lon)
        
        print(f"\n📊 Coordinate Comparison:")
        print(f"   Demo:     {demo_lat}, {demo_lon}")
        print(f"   Nominatim: {nominatim_lat}, {nominatim_lon}")
        print(f"   Diff:     {lat_diff:.7f}, {lon_diff:.7f}")
        
        # Calculate distance (rough)
        distance = ((lat_diff * 111000)**2 + (lon_diff * 111000)**2)**0.5
        print(f"   Distance: ~{distance:.1f} meters")
        
        if lat_diff < 0.0001 and lon_diff < 0.0001:
            print("✅ Coordinates match perfectly!")
            return True
        elif distance < 100:
            print("✅ Coordinates are very close (within 100m)")
            return True
        else:
            print("⚠️  Coordinates differ significantly")
            return False
    else:
        print("❌ Could not get Nominatim coordinates")
        return False

async def test_local_api():
    """Test if our local API is running"""
    print("\n🔌 Testing local API...")
    
    try:
        async with httpx.AsyncClient() as client:
            # Test health endpoint
            response = await client.get("http://localhost:8000/health", timeout=5)
            if response.status_code == 200:
                print("✅ Backend API is running")
                
                # Test location search
                search_response = await client.get(
                    "http://localhost:8000/locations/search?query=Central Park&limit=1"
                )
                if search_response.status_code == 200:
                    search_data = search_response.json()
                    if search_data.get('locations'):
                        location = search_data['locations'][0]
                        print(f"✅ Location search works: {location['name']}")
                        print(f"   Coordinates: {location['latitude']}, {location['longitude']}")
                        return True
                    else:
                        print("⚠️  Location search returned no results")
                        return False
                else:
                    print(f"❌ Location search failed: {search_response.status_code}")
                    return False
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
                
    except httpx.ConnectError:
        print("❌ Cannot connect to local API (is it running on localhost:8000?)")
        return False
    except Exception as e:
        print(f"❌ API test error: {e}")
        return False

async def main():
    """Main test function"""
    print("🎬 Demo Flow Test - Walkumentary")
    print("=" * 50)
    
    # Test 1: Coordinate accuracy
    coords_ok = await check_demo_coordinates()
    
    # Test 2: Local API
    api_ok = await test_local_api()
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Test Summary:")
    print(f"   Coordinates Match: {'✅' if coords_ok else '❌'}")
    print(f"   Local API Works:   {'✅' if api_ok else '❌'}")
    
    if coords_ok and api_ok:
        print("\n🎉 Demo should work perfectly!")
        print("   1. Run: ./scripts/run_demo_setup.sh")
        print("   2. Search for 'Central Park'")  
        print("   3. Select the first result")
        print("   4. Generate tour → Instant results!")
    elif coords_ok:
        print("\n⚠️  Demo coordinates are good, but start your backend:")
        print("   python app/main.py")
    else:
        print("\n❌ Demo may have issues. Check the coordinate differences above.")

if __name__ == "__main__":
    asyncio.run(main()) 
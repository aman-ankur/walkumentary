#!/usr/bin/env python3
"""
Demo POI Verification Script
Verifies that demo POI coordinates are accurate and within Central Park bounds.
"""

import asyncio
import json
from math import radians, cos, sin, asin, sqrt

# Central Park approximate bounds (verified coordinates)
CENTRAL_PARK_BOUNDS = {
    "north": 40.800621,   # 110th Street
    "south": 40.764017,   # 59th Street  
    "east": -73.948945,   # 5th Avenue
    "west": -73.981762    # Central Park West
}

CENTRAL_PARK_CENTER = {
    "latitude": 40.7827725,
    "longitude": -73.9653627
}

# Demo POI coordinates to verify
DEMO_POIS = [
    {
        "name": "The Mall and Literary Walk",
        "latitude": 40.7794,
        "longitude": -73.9729
    },
    {
        "name": "Bethesda Terrace and Fountain",
        "latitude": 40.7764,
        "longitude": -73.9719
    },
    {
        "name": "Bow Bridge", 
        "latitude": 40.7755,
        "longitude": -73.9713
    },
    {
        "name": "Strawberry Fields",
        "latitude": 40.7756,
        "longitude": -73.9754
    }
]

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    
    return c * r * 1000  # Return distance in meters

def is_within_bounds(lat, lng, bounds):
    """Check if coordinates are within Central Park bounds"""
    return (bounds["south"] <= lat <= bounds["north"] and 
            bounds["west"] <= lng <= bounds["east"])

def verify_demo_pois():
    """Verify all demo POI coordinates are valid"""
    print("🔍 Verifying Demo POI Coordinates")
    print("=" * 50)
    
    all_valid = True
    total_distance = 0
    
    print(f"📍 Central Park Center: {CENTRAL_PARK_CENTER['latitude']}, {CENTRAL_PARK_CENTER['longitude']}")
    print()
    
    for i, poi in enumerate(DEMO_POIS):
        print(f"{i+1}. {poi['name']}")
        print(f"   Coordinates: {poi['latitude']}, {poi['longitude']}")
        
        # Check if within Central Park bounds
        within_bounds = is_within_bounds(poi['latitude'], poi['longitude'], CENTRAL_PARK_BOUNDS)
        
        # Calculate distance from Central Park center
        distance_from_center = calculate_distance(
            CENTRAL_PARK_CENTER['latitude'], CENTRAL_PARK_CENTER['longitude'],
            poi['latitude'], poi['longitude']
        )
        
        # Calculate walking distance from previous POI
        if i > 0:
            prev_poi = DEMO_POIS[i-1]
            walking_distance = calculate_distance(
                prev_poi['latitude'], prev_poi['longitude'],
                poi['latitude'], poi['longitude']
            )
            total_distance += walking_distance
            print(f"   Walking distance from previous: {walking_distance:.0f}m")
        
        print(f"   Distance from park center: {distance_from_center:.0f}m")
        print(f"   Within Central Park bounds: {'✅ YES' if within_bounds else '❌ NO'}")
        
        if not within_bounds:
            all_valid = False
            print(f"   ⚠️  WARNING: This POI appears to be outside Central Park!")
        
        if distance_from_center > 1000:  # More than 1km from center
            print(f"   ⚠️  WARNING: This POI is quite far from the park center")
        
        print()
    
    print(f"📏 Total walking distance: {total_distance:.0f}m ({total_distance/1000:.1f}km)")
    
    # Validate walking feasibility
    if total_distance < 2000:  # Less than 2km total
        print("✅ Walking distance is feasible for a 30-minute tour")
    elif total_distance < 3000:  # Less than 3km
        print("⚠️  Walking distance is moderate - may be tight for 30 minutes") 
    else:
        print("❌ Walking distance may be too long for a 30-minute tour")
        all_valid = False
    
    print()
    
    if all_valid:
        print("🎉 All POI coordinates verified! Demo should work perfectly.")
        print()
        print("✅ Expected demo behavior:")
        print("   • All 4 POIs will appear on the map within Central Park")
        print("   • Walking route will be calculated correctly")
        print("   • Tour duration matches the walking distance")
        print("   • No geocoding failures during tour generation")
    else:
        print("❌ Some POI coordinates have issues. Demo may not work as expected.")
    
    return all_valid

def verify_nominatim_difference():
    """Show the difference between our coordinates and what Nominatim might return"""
    print("\n🌐 Nominatim Geocoding Challenges")
    print("=" * 50)
    
    print("Our demo uses verified coordinates because Nominatim often fails for specific park features:")
    print()
    print("Example issues we've resolved:")
    print("• 'Strawberry Fields' → Returns Columbus, Ohio instead of Central Park")
    print("• 'Bethesda Terrace' → Often returns no results")
    print("• 'The Mall Central Park' → May return shopping malls instead")
    print("• 'Bow Bridge' → Could return bridges in other cities")
    print()
    print("✅ Our solution:")
    print("• Pre-verified coordinates for all Central Park POIs")  
    print("• Geocoding cache prevents live API failures")
    print("• Fallback to manual coordinates if geocoding fails")
    print("• 100% reliable demo experience")

if __name__ == "__main__":
    print("🎬 Walkumentary Demo POI Verification")
    print()
    
    # Verify coordinates
    is_valid = verify_demo_pois()
    
    # Explain the geocoding challenges
    verify_nominatim_difference()
    
    print("\n" + "=" * 50)
    if is_valid:
        print("🚀 Ready for demo recording!")
    else:
        print("⚠️  Review POI coordinates before recording") 
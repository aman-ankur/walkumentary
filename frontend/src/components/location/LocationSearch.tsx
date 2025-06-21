"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Search, MapPin, Loader2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import { LocationResponse } from "@/lib/types";

interface LocationSearchProps {
  onLocationSelect: (location: LocationResponse) => void;
  placeholder?: string;
  className?: string;
  enableGPS?: boolean;
}

interface SearchResult {
  locations: LocationResponse[];
  suggestions: string[];
  total: number;
}

export function LocationSearch({
  onLocationSelect,
  placeholder = "Search for a place...",
  className = "",
  enableGPS = true,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGPSLoading, setIsGPSLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query
  const debouncedQuery = useDebounce(query, 300);
  
  // Search function
  const searchLocations = useCallback(async (searchQuery: string) => {
    console.log('searchLocations called with:', searchQuery);
    
    if (!searchQuery.trim() || searchQuery.length < 2) {
      console.log('Search query too short, clearing results');
      setResults(null);
      return;
    }
    
    console.log('Starting location search...');
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        limit: "10",
      });
      
      // Add user location for proximity search if available
      if (userLocation) {
        params.append("coordinates", `${userLocation[0]},${userLocation[1]}`);
        console.log('Added user coordinates:', userLocation);
      }
      
      const searchUrl = `/locations/search?${params}`;
      console.log('Making API call to:', searchUrl);
      
      const response = await api.get(searchUrl);
      console.log('Search API response:', response);
      
      setResults(response.data || response);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search locations. Please try again.");
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);
  
  // Effect to trigger search when debounced query changes
  useEffect(() => {
    searchLocations(debouncedQuery);
  }, [debouncedQuery, searchLocations]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    
    if (!value.trim()) {
      setResults(null);
      setIsOpen(false);
    }
  };
  
  // Handle location selection
  const handleLocationSelect = (location: LocationResponse) => {
    setQuery(location.name);
    setIsOpen(false);
    setResults(null);
    onLocationSelect(location);
    inputRef.current?.blur();
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };
  
  // GPS location detection
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    
    setIsGPSLoading(true);
    setError(null);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });
      
      const coords: [number, number] = [
        position.coords.latitude,
        position.coords.longitude,
      ];
      
      setUserLocation(coords);
      
      // Search for nearby locations
      const response = await api.post("/locations/detect", {
        coordinates: coords,
        radius: 1000,
      });
      
      if (response.data.locations.length > 0) {
        setResults({
          locations: response.data.locations,
          suggestions: [],
          total: response.data.locations.length,
        });
        setIsOpen(true);
        setQuery("Nearby locations");
      } else {
        setError("No nearby locations found.");
      }
    } catch (err: any) {
      console.error("GPS error:", err);
      if (err.code === 1) {
        setError("Location access denied. Please enable location services.");
      } else if (err.code === 2) {
        setError("Location unavailable. Please try again.");
      } else if (err.code === 3) {
        setError("Location request timeout. Please try again.");
      } else {
        setError("Failed to detect location. Please try searching manually.");
      }
    } finally {
      setIsGPSLoading(false);
    }
  }, []);
  
  // Handle clicks outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };
  
  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results && results.locations.length > 0) {
                setIsOpen(true);
              }
            }}
            className="pl-10 pr-4"
            disabled={isGPSLoading}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        
        {/* GPS Button */}
        {enableGPS && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={detectLocation}
            disabled={isGPSLoading || isLoading}
            className="shrink-0"
            title="Use my location"
          >
            {isGPSLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
      
      {/* Search Results */}
      {isOpen && (results || isLoading) && (
        <Card
          ref={resultsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto bg-white shadow-lg border"
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : results ? (
            <div className="py-2">
              {/* Locations */}
              {results.locations.length > 0 && (
                <div className="border-b border-gray-100 pb-2 mb-2">
                  <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Locations
                  </div>
                  {results.locations.map((location, index) => (
                    <button
                      key={location.id || index}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {location.name}
                          </div>
                          {location.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {location.description}
                            </div>
                          )}
                          {location.city && location.country && (
                            <div className="text-xs text-muted-foreground truncate">
                              {location.city}, {location.country}
                            </div>
                          )}
                          {location.distance !== undefined && (
                            <div className="text-xs text-blue-600">
                              {location.distance < 1000
                                ? `${location.distance}m away`
                                : `${(location.distance / 1000).toFixed(1)}km away`}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Suggestions */}
              {results.suggestions.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Suggestions
                  </div>
                  {results.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors truncate"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              {/* No Results */}
              {results.locations.length === 0 && results.suggestions.length === 0 && (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No locations found for "{query}"
                </div>
              )}
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
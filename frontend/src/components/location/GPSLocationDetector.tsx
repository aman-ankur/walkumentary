"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Navigation,
  MapPin,
  Loader2,
  Settings,
  Filter,
  RefreshCw,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocationCard } from "./LocationCard";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyLocations, NearbyFilters } from "@/hooks/useNearbyLocations";
import { LocationResponse } from "@/lib/types";

interface GPSLocationDetectorProps {
  onLocationSelect?: (location: LocationResponse) => void;
  className?: string;
  autoStart?: boolean;
  showSettings?: boolean;
}

const LOCATION_TYPES = [
  { value: "museum", label: "Museums" },
  { value: "monument", label: "Monuments" },
  { value: "park", label: "Parks" },
  { value: "landmark", label: "Landmarks" },
  { value: "historic", label: "Historic Sites" },
  { value: "religious", label: "Religious Sites" },
  { value: "viewpoint", label: "Viewpoints" },
  { value: "cultural", label: "Cultural Sites" },
];

const SORT_OPTIONS = [
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Rating" },
  { value: "popularity", label: "Popularity" },
];

export function GPSLocationDetector({
  onLocationSelect,
  className = "",
  autoStart = false,
  showSettings = true,
}: GPSLocationDetectorProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // GPS location hook
  const {
    location: gpsLocation,
    error: gpsError,
    isLoading: isGPSLoading,
    isSupported: isGPSSupported,
    lastUpdated,
    getCurrentLocation,
    startWatching,
    stopWatching,
    clearError: clearGPSError,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 60000, // 1 minute
  });

  // Nearby locations hook
  const {
    locations,
    isLoading: isLocationsLoading,
    error: locationsError,
    center,
    radius,
    filters,
    fetchNearbyLocations,
    refreshLocations,
    updateFilters,
    updateRadius,
    clearError: clearLocationsError,
    isDataStale,
  } = useNearbyLocations({
    autoRefresh,
    refreshInterval: 120000, // 2 minutes
    defaultRadius: 1000,
    cacheTimeout: 300000, // 5 minutes
  });

  // Auto-start GPS detection if enabled
  useEffect(() => {
    if (autoStart && isGPSSupported) {
      getCurrentLocation();
    }
  }, [autoStart, isGPSSupported, getCurrentLocation]);

  // Fetch nearby locations when GPS location changes
  useEffect(() => {
    if (gpsLocation) {
      fetchNearbyLocations(gpsLocation);
    }
  }, [gpsLocation, fetchNearbyLocations]);

  const handleStartDetection = useCallback(() => {
    clearGPSError();
    clearLocationsError();
    getCurrentLocation();
  }, [getCurrentLocation, clearGPSError, clearLocationsError]);

  const handleStartWatching = useCallback(() => {
    clearGPSError();
    clearLocationsError();
    startWatching();
    setAutoRefresh(true);
  }, [startWatching, clearGPSError, clearLocationsError]);

  const handleStopWatching = useCallback(() => {
    stopWatching();
    setAutoRefresh(false);
  }, [stopWatching]);

  const handleRadiusChange = useCallback((value: number[]) => {
    updateRadius(value[0]);
  }, [updateRadius]);

  const handleFilterChange = useCallback((key: keyof NearbyFilters, value: any) => {
    updateFilters({ [key]: value });
  }, [updateFilters]);

  const formatDistance = (distance?: number) => {
    if (!distance) return "";
    return distance < 1000 
      ? `${Math.round(distance)}m` 
      : `${(distance / 1000).toFixed(1)}km`;
  };

  const formatLastUpdated = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes === 0) return "Just now";
    if (minutes === 1) return "1 minute ago";
    return `${minutes} minutes ago`;
  };

  const isLoading = isGPSLoading || isLocationsLoading;
  const hasError = gpsError || locationsError;
  const hasLocation = gpsLocation && !hasError;
  const hasLocations = locations.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">GPS Location Detection</h3>
            {!isGPSSupported && (
              <Badge variant="destructive">Not Supported</Badge>
            )}
          </div>
          
          {showSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Location Status */}
        {hasLocation && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-4 w-4" />
              <span className="font-medium">Location detected</span>
            </div>
            <div className="mt-1 text-sm text-green-600">
              <div>
                Lat: {gpsLocation.latitude.toFixed(6)}, 
                Lng: {gpsLocation.longitude.toFixed(6)}
              </div>
              <div>
                Accuracy: {Math.round(gpsLocation.accuracy)}m
                {lastUpdated && (
                  <span className="ml-2">• {formatLastUpdated(lastUpdated)}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {hasError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2 text-red-800">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">Location Error</div>
                <div className="text-sm text-red-600 mt-1">
                  {gpsError?.message || locationsError}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearGPSError();
                  clearLocationsError();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleStartDetection}
            disabled={!isGPSSupported || isLoading}
            className="flex-1 sm:flex-none"
          >
            {isGPSLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            Detect Location
          </Button>

          {hasLocation && (
            <>
              <Button
                variant="outline"
                onClick={autoRefresh ? handleStopWatching : handleStartWatching}
                disabled={isLoading}
              >
                {autoRefresh ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Stop Tracking
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Track Location
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={refreshLocations}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLocationsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </>
          )}
        </div>

        {/* Filters */}
        {showFilters && hasLocation && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Search Filters</span>
            </div>

            {/* Search Radius */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Search Radius: {formatDistance(radius)}
              </label>
              <Slider
                value={[radius]}
                onValueChange={handleRadiusChange}
                min={100}
                max={5000}
                step={100}
                className="w-full"
              />
            </div>

            {/* Location Types */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Location Types
              </label>
              <Select
                value={filters.locationType?.join(",") || ""}
                onValueChange={(value) => 
                  handleFilterChange("locationType", value ? value.split(",") : undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {LOCATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Sort By
              </label>
              <Select
                value={filters.sortBy || "distance"}
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max Results */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Max Results: {filters.maxResults || 20}
              </label>
              <Slider
                value={[filters.maxResults || 20]}
                onValueChange={(value) => handleFilterChange("maxResults", value[0])}
                min={5}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            {/* Auto Refresh */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Auto Refresh
              </label>
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Nearby Locations */}
      {hasLocation && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">
                Nearby Locations ({locations.length})
              </h3>
              {isDataStale && (
                <Badge variant="outline">Stale Data</Badge>
              )}
            </div>
            
            {hasLocations && (
              <div className="text-sm text-muted-foreground">
                Within {formatDistance(radius)}
              </div>
            )}
          </div>

          {isLocationsLoading && !hasLocations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Finding nearby locations...</span>
            </div>
          ) : hasLocations ? (
            <div className="space-y-3">
              {locations.map((location, index) => (
                <div 
                  key={location.id || index}
                  onClick={() => onLocationSelect?.(location)}
                  className="cursor-pointer"
                >
                  <LocationCard
                    location={location}
                    showActions={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <div>No locations found nearby</div>
              <div className="text-sm">Try increasing the search radius</div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
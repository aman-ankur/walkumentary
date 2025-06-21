"use client";

import React from "react";
import { MapPin, Navigation, Clock, Star, Camera } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocationResponse } from "@/lib/types";

interface LocationCardProps {
  location: LocationResponse;
  onGenerateTour?: () => void;
  onShowOnMap?: () => void;
  onTakePhoto?: () => void;
  showActions?: boolean;
  className?: string;
}

export function LocationCard({
  location,
  onGenerateTour,
  onShowOnMap,
  onTakePhoto,
  showActions = true,
  className = "",
}: LocationCardProps) {
  const formatDistance = (distance?: number) => {
    if (distance === undefined) return null;
    
    if (distance < 1000) {
      return `${distance}m away`;
    } else {
      return `${(distance / 1000).toFixed(1)}km away`;
    }
  };
  
  const getLocationTypeIcon = (type?: string) => {
    switch (type) {
      case "museum":
        return "🏛️";
      case "monument":
        return "🗿";
      case "park":
        return "🌳";
      case "restaurant":
        return "🍽️";
      case "church":
      case "religious":
        return "⛪";
      case "castle":
        return "🏰";
      case "beach":
        return "🏖️";
      case "mountain":
        return "🏔️";
      case "lake":
        return "🏞️";
      case "tourist_attraction":
        return "🎯";
      default:
        return "📍";
    }
  };
  
  const getLocationTypeLabel = (type?: string) => {
    if (!type) return "Location";
    
    return type
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  return (
    <Card className={`w-full transition-shadow hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="text-2xl" title={getLocationTypeLabel(location.location_type)}>
              {getLocationTypeIcon(location.location_type)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                {location.name}
              </h3>
              {location.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {location.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Rating placeholder - could be added later */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4" />
            <span>4.2</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Location Details */}
        <div className="space-y-2 mb-4">
          {/* Location Type */}
          {location.location_type && (
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getLocationTypeLabel(location.location_type)}
              </span>
            </div>
          )}
          
          {/* Address */}
          {(location.city || location.country) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>
                {[location.city, location.country].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          
          {/* Distance */}
          {location.distance !== undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Navigation className="h-4 w-4 shrink-0" />
              <span>{formatDistance(location.distance)}</span>
            </div>
          )}
          
          {/* Coordinates */}
          {location.latitude && location.longitude && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </span>
            </div>
          )}
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t">
            {onGenerateTour && (
              <Button 
                onClick={onGenerateTour}
                className="flex-1"
                size="sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Generate Tour
              </Button>
            )}
            
            {onShowOnMap && (
              <Button 
                onClick={onShowOnMap}
                variant="outline"
                size="sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Map
              </Button>
            )}
            
            {onTakePhoto && (
              <Button 
                onClick={onTakePhoto}
                variant="outline"
                size="sm"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        
        {/* Metadata (for debugging - remove in production) */}
        {process.env.NODE_ENV === "development" && location.location_metadata && (
          <details className="mt-4 text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Debug Info
            </summary>
            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
              {JSON.stringify(location.location_metadata, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
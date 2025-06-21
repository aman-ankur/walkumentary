"use client";

import React from "react";
import { LocationCard } from "./LocationCard";
import { LocationResponse } from "@/lib/types";

interface LocationListProps {
  locations: LocationResponse[];
  onLocationSelect?: (location: LocationResponse) => void;
  onGenerateTour?: (location: LocationResponse) => void;
  onShowOnMap?: (location: LocationResponse) => void;
  onTakePhoto?: (location: LocationResponse) => void;
  showActions?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function LocationList({
  locations,
  onLocationSelect,
  onGenerateTour,
  onShowOnMap,
  onTakePhoto,
  showActions = true,
  className = "",
  emptyMessage = "No locations found.",
}: LocationListProps) {
  if (locations.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        <div className="text-4xl mb-2">📍</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {locations.map((location, index) => (
        <div
          key={location.id || index}
          onClick={() => onLocationSelect?.(location)}
          className="cursor-pointer"
        >
          <LocationCard
            location={location}
            onGenerateTour={onGenerateTour ? () => onGenerateTour(location) : undefined}
            onShowOnMap={onShowOnMap ? () => onShowOnMap(location) : undefined}
            onTakePhoto={onTakePhoto ? () => onTakePhoto(location) : undefined}
            showActions={showActions}
            className="hover:shadow-lg transition-shadow"
          />
        </div>
      ))}
    </div>
  );
}
import React from "react";
import { selectArtwork, getTemplateByIndex } from "@/components/artwork";

interface TourArtworkProps {
  tourId: string;
  tourTitle?: string;
  location?: {
    name?: string;
    city?: string;
    country?: string;
    location_type?: string;
  };
}

/**
 * TourArtwork – Dynamic SVG artwork with deterministic template selection
 * based on tour ID and location context.
 */
export function TourArtwork({ tourId, tourTitle = "Tour", location }: TourArtworkProps) {
  // Select artwork template and colors based on tour ID and location
  const { category, templateIndex, colors } = selectArtwork(tourId, location);
  
  // Get the specific template component
  const template = getTemplateByIndex(category, templateIndex);
  const ArtworkComponent = template.component;
  
  // Format location string for display
  const locationString = location?.name || location?.city || "Destination";
  
  return (
    <ArtworkComponent
      colors={colors}
      tourTitle={tourTitle}
      location={locationString}
      className="w-full h-full"
    />
  );
} 
import { ArtworkCategory, ArtworkColors, Location } from '../types';
import { getColorsForTemplate } from './colorPalettes';
import { generateSeed } from './hashUtils';

/**
 * Determine artwork category based on location data and context
 */
export function getArtworkCategory(location?: Location): ArtworkCategory {
  if (!location) return 'urban'; // Default fallback
  
  const locationName = (location.name || '').toLowerCase();
  const city = (location.city || '').toLowerCase();
  const country = (location.country || '').toLowerCase();
  const locationType = (location.location_type || '').toLowerCase();
  
  // Check for coastal indicators
  if (
    locationName.includes('beach') ||
    locationName.includes('coast') ||
    locationName.includes('harbor') ||
    locationName.includes('port') ||
    locationName.includes('bay') ||
    locationName.includes('island') ||
    locationType.includes('coast')
  ) {
    return 'coastal';
  }
  
  // Check for mountain indicators
  if (
    locationName.includes('mountain') ||
    locationName.includes('peak') ||
    locationName.includes('summit') ||
    locationName.includes('alpine') ||
    locationName.includes('ridge') ||
    locationType.includes('mountain')
  ) {
    return 'mountain';
  }
  
  // Check for nature indicators
  if (
    locationName.includes('park') ||
    locationName.includes('forest') ||
    locationName.includes('lake') ||
    locationName.includes('river') ||
    locationName.includes('nature') ||
    locationName.includes('wilderness') ||
    locationType.includes('park') ||
    locationType.includes('nature')
  ) {
    return 'nature';
  }
  
  // Check for cultural/historical indicators
  if (
    locationName.includes('temple') ||
    locationName.includes('museum') ||
    locationName.includes('historic') ||
    locationName.includes('monument') ||
    locationName.includes('cathedral') ||
    locationName.includes('palace') ||
    locationName.includes('castle') ||
    locationType.includes('historic') ||
    locationType.includes('cultural')
  ) {
    return 'cultural';
  }
  
  // Default to urban for cities and general locations
  return 'urban';
}

/**
 * Select artwork template and colors based on tour ID and location
 */
export function selectArtwork(tourId: string, location?: Location) {
  const seed = generateSeed(tourId);
  const category = getArtworkCategory(location);
  const colors = getColorsForTemplate(category, seed);
  
  // Select template index within category (we'll have multiple templates per category)
  const templateIndex = (seed >> 4) % 3; // Assume 3 templates per category for now
  
  return {
    category,
    templateIndex,
    colors,
    seed
  };
}
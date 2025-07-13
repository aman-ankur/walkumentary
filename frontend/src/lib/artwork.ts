// Tour cover artwork options
export const TOUR_ARTWORKS = [
  "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop&crop=center", // Classic architecture
  "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=400&h=400&fit=crop&crop=center", // Historic building
  "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?w=400&h=400&fit=crop&crop=center", // European street
  "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=400&h=400&fit=crop&crop=center", // City square
  "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=400&fit=crop&crop=center", // Travel scene
  "https://images.unsplash.com/photo-1528114039593-4366cc08227d?w=400&h=400&fit=crop&crop=center", // Historic architecture
  "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&h=400&fit=crop&crop=center", // Urban exploration
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center", // Cultural landmark
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center", // Walking tour vibe
  "https://images.unsplash.com/photo-1571678719845-74d4dbc6fc7a?w=400&h=400&fit=crop&crop=center"  // Heritage site
];

/**
 * Get a random artwork for a tour based on tour ID
 * Uses tour ID as seed for consistent artwork per tour
 */
export function getTourArtwork(tourId: string): string {
  // Create a simple hash from tour ID for consistent selection
  let hash = 0;
  for (let i = 0; i < tourId.length; i++) {
    const char = tourId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % TOUR_ARTWORKS.length;
  return TOUR_ARTWORKS[index];
}

/**
 * Get artwork with fallback logic
 */
export function getTourCover(tour: any): string {
  // Priority: tour location image > random artwork > default
  if (tour?.location?.image_url) {
    return tour.location.image_url;
  }
  
  if (tour?.id) {
    return getTourArtwork(tour.id);
  }
  
  // Fallback to first artwork
  return TOUR_ARTWORKS[0];
}
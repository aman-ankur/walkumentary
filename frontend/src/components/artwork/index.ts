// Main artwork templates
import { CitySkyline } from './templates/urban/CitySkyline';
import { MountainVista } from './templates/nature/MountainVista';
import { OceanHorizon } from './templates/coastal/OceanHorizon';

// Add more templates as they're created
// import { VintageStreet } from './templates/urban/VintageStreet';
// import { ForestPath } from './templates/nature/ForestPath';
// import { AncientTemple } from './templates/cultural/AncientTemple';

import { ArtworkTemplate, ArtworkCategory } from './types';

export const artworkTemplates: Record<ArtworkCategory, ArtworkTemplate[]> = {
  urban: [
    { id: 'city-skyline', name: 'City Skyline', category: 'urban', component: CitySkyline },
    // Add more urban templates
  ],
  nature: [
    { id: 'mountain-vista', name: 'Mountain Vista', category: 'nature', component: MountainVista },
    // Add more nature templates
  ],
  coastal: [
    { id: 'ocean-horizon', name: 'Ocean Horizon', category: 'coastal', component: OceanHorizon },
    // Add more coastal templates
  ],
  cultural: [
    // Will add cultural templates
  ],
  mountain: [
    // Mountain category can reuse some nature templates or have specific ones
    { id: 'mountain-vista-2', name: 'Mountain Vista', category: 'mountain', component: MountainVista },
  ]
};

export function getTemplatesForCategory(category: ArtworkCategory): ArtworkTemplate[] {
  return artworkTemplates[category] || artworkTemplates.urban; // Fallback to urban
}

export function getTemplateByIndex(category: ArtworkCategory, index: number): ArtworkTemplate {
  const templates = getTemplatesForCategory(category);
  const safeIndex = index % templates.length;
  return templates[safeIndex];
}

// Export utilities
export { selectArtwork, getArtworkCategory } from './utils/artworkSelector';
export { getColorsForTemplate } from './utils/colorPalettes';
export type { ArtworkProps, ArtworkColors, ArtworkCategory } from './types';
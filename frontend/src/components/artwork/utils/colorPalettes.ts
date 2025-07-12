import { ArtworkColors, ArtworkCategory } from '../types';

export const colorPalettes: Record<ArtworkCategory, ArtworkColors[]> = {
  urban: [
    {
      primary: '#FF6B6B',
      secondary: '#FFE66D', 
      accent: '#FF8E3C',
      building1: '#1e293b',
      building2: '#334155',
      sky: '#FF5722'
    },
    {
      primary: '#E87A47',
      secondary: '#FFD93D',
      accent: '#FF6B4A',
      building1: '#2d3748',
      building2: '#4a5568',
      sky: '#ED8936'
    },
    {
      primary: '#F56565',
      secondary: '#FBD38D',
      accent: '#ED8936',
      building1: '#2c3e50',
      building2: '#34495e',
      sky: '#E53E3E'
    }
  ],
  nature: [
    {
      primary: '#4ECDC4',
      secondary: '#45B7D1',
      accent: '#96CEB4',
      mountain1: '#6C5CE7',
      mountain2: '#A29BFE',
      sky: '#74B9FF'
    },
    {
      primary: '#48BB78',
      secondary: '#68D391',
      accent: '#9AE6B4',
      mountain1: '#2F855A',
      mountain2: '#38A169',
      sky: '#90CDF4'
    },
    {
      primary: '#4299E1',
      secondary: '#63B3ED',
      accent: '#90CDF4',
      mountain1: '#2B6CB0',
      mountain2: '#3182CE',
      sky: '#BEE3F8'
    }
  ],
  cultural: [
    {
      primary: '#A8E6CF',
      secondary: '#FFD93D',
      accent: '#6BCF7F',
      building1: '#4D4D4D',
      building2: '#666666',
      sky: '#FECA57'
    },
    {
      primary: '#DDA0DD',
      secondary: '#F0E68C',
      accent: '#98FB98',
      building1: '#8B4513',
      building2: '#A0522D',
      sky: '#FFE4B5'
    },
    {
      primary: '#F4A460',
      secondary: '#DEB887',
      accent: '#D2B48C',
      building1: '#8B4513',
      building2: '#CD853F',
      sky: '#FFEFD5'
    }
  ],
  coastal: [
    {
      primary: '#74B9FF',
      secondary: '#00CEC9',
      accent: '#FDCB6E',
      water: '#0984E3',
      sky: '#A29BFE',
      building1: '#FFF'
    },
    {
      primary: '#00B894',
      secondary: '#00CEC9',
      accent: '#FDCB6E',
      water: '#00A085',
      sky: '#74B9FF',
      building1: '#FFFFFF'
    },
    {
      primary: '#55A3FF',
      secondary: '#26C6DA',
      accent: '#FFA726',
      water: '#1976D2',
      sky: '#81C784',
      building1: '#F5F5F5'
    }
  ],
  mountain: [
    {
      primary: '#6C5CE7',
      secondary: '#A29BFE',
      accent: '#FDCB6E',
      mountain1: '#4834D4',
      mountain2: '#686DE0',
      sky: '#E84393'
    },
    {
      primary: '#8E44AD',
      secondary: '#BB8FCE',
      accent: '#F39C12',
      mountain1: '#6C3483',
      mountain2: '#8E44AD',
      sky: '#E74C3C'
    },
    {
      primary: '#5D4E75',
      secondary: '#7D6E93',
      accent: '#FFA726',
      mountain1: '#4A3B60',
      mountain2: '#5D4E75',
      sky: '#FF7043'
    }
  ]
};

export function getColorsForTemplate(category: ArtworkCategory, seed: number): ArtworkColors {
  const categoryPalettes = colorPalettes[category];
  const paletteIndex = seed % categoryPalettes.length;
  return categoryPalettes[paletteIndex];
}
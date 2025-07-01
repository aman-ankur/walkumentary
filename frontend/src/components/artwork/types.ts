export interface ArtworkColors {
  primary: string;
  secondary: string;
  accent: string;
  mountain1?: string;
  mountain2?: string;
  building1?: string;
  building2?: string;
  water?: string;
  sky?: string;
}

export interface ArtworkProps {
  colors: ArtworkColors;
  tourTitle: string;
  location?: string;
  className?: string;
}

export type ArtworkCategory = 'urban' | 'nature' | 'cultural' | 'coastal' | 'mountain';

export interface ArtworkTemplate {
  id: string;
  name: string;
  category: ArtworkCategory;
  component: React.ComponentType<ArtworkProps>;
}

export interface Location {
  name?: string;
  city?: string;
  country?: string;
  location_type?: string;
}
import { LocationResponse } from "@/lib/types";

export interface LocationSearchProps {
  onLocationSelect: (location: LocationResponse) => void;
  placeholder?: string;
  className?: string;
  enableGPS?: boolean;
}

export interface LocationCardProps {
  location: LocationResponse;
  onGenerateTour?: () => void;
  onShowOnMap?: () => void;
  onTakePhoto?: () => void;
  showActions?: boolean;
  className?: string;
}

export interface LocationListProps {
  locations: LocationResponse[];
  onLocationSelect?: (location: LocationResponse) => void;
  onGenerateTour?: (location: LocationResponse) => void;
  onShowOnMap?: (location: LocationResponse) => void;
  onTakePhoto?: (location: LocationResponse) => void;
  showActions?: boolean;
  className?: string;
  emptyMessage?: string;
}
"use client";

import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { MapContainerProps } from './types';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Default center (New York City)
const DEFAULT_CENTER: LatLngExpression = [40.7128, -74.0060];
const DEFAULT_ZOOM = 13;

interface ExtendedMapContainerProps extends MapContainerProps {
  style?: React.CSSProperties;
}

export function MapContainer({ 
  center = DEFAULT_CENTER, 
  zoom = DEFAULT_ZOOM, 
  className = '',
  style,
  children 
}: ExtendedMapContainerProps) {
  // Fix Leaflet default marker icons in Next.js
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Dynamic import to avoid SSR issues
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
  }, []);

  return (
    <div className={`relative ${className}`} style={style}>
      <LeafletMapContainer
        center={center}
        zoom={zoom}
        style={{ 
          height: '100%', 
          width: '100%',
          borderRadius: '1rem',
        }}
        zoomControl={true}
        attributionControl={true}
        touchZoom={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        dragging={true}
        worldCopyJump={false}
        className="focus:outline-none"
      >
        {/* OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        {children}
      </LeafletMapContainer>
    </div>
  );
}
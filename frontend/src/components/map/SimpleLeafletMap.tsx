"use client";

import { MapContainer, TileLayer } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { useEffect } from 'react';

interface SimpleLeafletMapProps {
  center: LatLngExpression;
  zoom: number;
  children?: React.ReactNode;
}

export default function SimpleLeafletMap({ center, zoom, children }: SimpleLeafletMapProps) {
  // Fix Leaflet default marker icons
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    <MapContainer
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
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {children}
    </MapContainer>
  );
}
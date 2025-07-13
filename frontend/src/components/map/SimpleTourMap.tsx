"use client";

import { useEffect, useRef } from 'react';

interface SimpleTourMapProps {
  tour: {
    location: {
      name: string;
      latitude: number;
      longitude: number;
      description?: string;
    };
    title: string;
    description?: string;
  };
  className?: string;
}

export function SimpleTourMap({ tour, className = '' }: SimpleTourMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    
    console.log('SimpleTourMap: Initializing map for tour:', tour.title);
    console.log('SimpleTourMap: Coordinates:', tour.location.latitude, tour.location.longitude);
    
    // Import Leaflet dynamically
    import('leaflet').then((L) => {
      // Cleanup any existing map first
      if (mapInstance.current) {
        console.log('SimpleTourMap: Cleaning up existing map');
        try {
          mapInstance.current.remove();
          mapInstance.current = null;
        } catch (e) {
          console.warn('Error cleaning up existing map:', e);
        }
      }
      
      // Clear the container
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
      
      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      
      // Create map
      const map = L.map(mapRef.current!, {
        center: [tour.location.latitude, tour.location.longitude],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
      });
      
      // Store map instance for cleanup
      mapInstance.current = map;
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      
      // Add marker for tour location
      const marker = L.marker([tour.location.latitude, tour.location.longitude])
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 200px; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${tour.location.name}</h3>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${tour.location.description || tour.description || ''}</p>
            <span style="background: #fed7aa; color: #c2410c; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Tour Location</span>
          </div>
        `);
      
      console.log('SimpleTourMap: Map initialized successfully');
    }).catch((error) => {
      console.error('Failed to load Leaflet:', error);
      if (mapRef.current) {
        mapRef.current.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Failed to load map</div>';
      }
    });
    
    // Cleanup function
    return () => {
      if (mapInstance.current) {
        console.log('SimpleTourMap: Cleaning up map on unmount');
        try {
          mapInstance.current.remove();
          mapInstance.current = null;
        } catch (e) {
          console.warn('Error cleaning up map on unmount:', e);
        }
      }
    };
  }, [tour]);
  
  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full ${className}`}
      style={{ minHeight: '300px' }}
    />
  );
}
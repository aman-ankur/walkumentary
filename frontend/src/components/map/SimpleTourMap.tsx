"use client";

import { useEffect, useRef } from 'react';

import { Tour, WalkableStop } from '@/lib/types';

interface SimpleTourMapProps {
  tour: Tour;
  className?: string;
  activeStopIndex?: number;
}

export function SimpleTourMap({ tour, className = '', activeStopIndex }: SimpleTourMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || !tour.location) return;
    
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
        center: [tour.location!.latitude!, tour.location!.longitude!],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
      });
      
      // Store map instance for cleanup
      mapInstance.current = map;
      
      // Ensure map renders correctly in container
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      
      // Add marker for tour location
      const mainMarker = L.marker([tour.location!.latitude!, tour.location!.longitude!])
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 200px; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${tour.location?.name || 'Tour Start'}</h3>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${tour.location?.description || tour.description || ''}</p>
            <span style="background: #fed7aa; color: #c2410c; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Tour Start</span>
          </div>
        `);

      // Add walkable stops if present
      if (tour.walkable_stops && tour.walkable_stops.length > 0) {
        console.log('SimpleTourMap: Adding', tour.walkable_stops.length, 'walkable stops');
        
        const validStops = tour.walkable_stops.filter(stop => 
          stop.latitude !== undefined && 
          stop.longitude !== undefined &&
          !isNaN(stop.latitude) && 
          !isNaN(stop.longitude)
        );

        // Create route coordinates
        const routeCoords: [number, number][] = [[tour.location!.latitude!, tour.location!.longitude!]];
        
        // Add walkable stop markers
        validStops.forEach((stop, index) => {
          const isActive = activeStopIndex === index;
          
          // Create custom icon for walkable stops
          const customIcon = L.divIcon({
            html: `
              <div style="
                width: 32px; 
                height: 40px; 
                position: relative;
              ">
                <div style="
                  width: 32px;
                  height: 32px;
                  background: ${isActive ? '#FF6B35' : '#FFA07A'};
                  border: 2px solid ${isActive ? '#FF4500' : '#FF8C69'};
                  border-radius: 50% 50% 50% 0;
                  transform: rotate(-45deg);
                  position: absolute;
                  top: 0;
                  left: 0;
                "></div>
                <div style="
                  position: absolute;
                  top: 4px;
                  left: 50%;
                  transform: translateX(-50%);
                  color: white;
                  font-weight: bold;
                  font-size: 12px;
                  z-index: 1000;
                ">${index + 1}</div>
              </div>
            `,
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            className: 'walkable-stop-marker'
          });
          
          const stopMarker = L.marker([stop.latitude!, stop.longitude!], { icon: customIcon })
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 220px; padding: 8px;">
                <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #ea580c;">Stop ${index + 1}: ${stop.name}</h4>
                ${stop.description ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${stop.description}</p>` : ''}
                <div style="font-size: 12px; color: #888; margin-bottom: 8px;">
                  ${stop.content_duration ? `<div>Duration: ${stop.content_duration}</div>` : ''}
                  ${stop.walking_time_from_previous && index > 0 ? `<div>Walk from previous: ${stop.walking_time_from_previous}</div>` : ''}
                </div>
                ${stop.highlights && stop.highlights.length > 0 ? `
                  <div style="border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px;">
                    <div style="font-size: 12px; font-weight: bold; color: #666; margin-bottom: 4px;">Highlights:</div>
                    <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #666;">
                      ${stop.highlights.slice(0, 3).map(highlight => `<li>${highlight}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            `);
          
          routeCoords.push([stop.latitude!, stop.longitude!] as [number, number]);
        });

        // Add walking route line
        if (routeCoords.length > 1) {
          const routeLine = L.polyline(routeCoords, {
            color: '#FF6B35',
            weight: 3,
            opacity: 0.7,
            dashArray: '8, 6'
          }).addTo(map);
          
          // Fit map to show all points
          const group = L.featureGroup([mainMarker, routeLine]);
          map.fitBounds(group.getBounds().pad(0.1));
        }

        // Add tour info panel
        const tourInfoControl = new (L as any).Control({ position: 'bottomleft' });
        tourInfoControl.onAdd = function() {
          const div = L.DomUtil.create('div', 'tour-info-panel');
          div.style.cssText = `
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(4px);
            border-radius: 8px;
            padding: 8px 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 1px solid rgba(255, 107, 53, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 200px;
          `;
          div.innerHTML = `
            <div style="font-size: 12px;">
              <div style="font-weight: bold; color: #c2410c; margin-bottom: 6px; font-size: 13px;">Walking Tour</div>
              <div style="color: #666; font-size: 11px; line-height: 1.3;">
                <div style="margin-bottom: 3px;">🚶 ${validStops.length} stops</div>
                ${tour.total_walking_distance ? `<div style="margin-bottom: 3px;">📏 ${tour.total_walking_distance}</div>` : ''}
                ${tour.estimated_walking_time ? `<div style="margin-bottom: 3px;">⏱️ ${tour.estimated_walking_time}</div>` : ''}
                ${tour.difficulty_level ? `<div>📊 ${tour.difficulty_level}</div>` : ''}
              </div>
            </div>
          `;
          return div;
        };
        tourInfoControl.addTo(map);
      }
      
      console.log('SimpleTourMap: Map initialized successfully with', tour.walkable_stops?.length || 0, 'walkable stops');
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
      style={{ 
        minHeight: '300px',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
}